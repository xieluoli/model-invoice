import type { AggregateRow, CostBucket, ReceiptData, TokenBucket, UsageRecord } from "./types.js";
import { addCost, costFor } from "./pricing.js";
import { formatDate, projectShortLabel, shortDayLabel, slipNumber } from "./format.js";

const ZERO_TOKENS = (): TokenBucket => ({ input: 0, output: 0, cacheCreation: 0, cacheRead: 0, total: 0 });
const ZERO_COST = (): CostBucket => ({ input: 0, output: 0, cacheCreation: 0, cacheRead: 0, total: 0 });

export type Range = "today" | "week" | "month" | "all";

export function filterByRange(records: UsageRecord[], range: Range, now = new Date()): UsageRecord[] {
  if (range === "all") return records;
  const startMs = rangeStart(range, now).getTime();
  const endMs = now.getTime();
  return records.filter((r) => {
    if (!r.timestamp) return false;
    const t = Date.parse(r.timestamp);
    return Number.isFinite(t) && t >= startMs && t <= endMs;
  });
}

function rangeStart(range: Range, now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  switch (range) {
    case "today":
      return d;
    case "week":
      d.setDate(d.getDate() - 6);
      return d;
    case "month":
      d.setDate(d.getDate() - 29);
      return d;
    default:
      return new Date(0);
  }
}

function tokenSumOf(r: UsageRecord): TokenBucket {
  const u = r.usage;
  const input = u.input_tokens ?? 0;
  const output = u.output_tokens ?? 0;
  const cacheCreation = u.cache_creation_input_tokens ?? 0;
  const cacheRead = u.cache_read_input_tokens ?? 0;
  return {
    input,
    output,
    cacheCreation,
    cacheRead,
    total: input + output + cacheCreation + cacheRead,
  };
}

function addTokens(a: TokenBucket, b: TokenBucket): TokenBucket {
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    cacheCreation: a.cacheCreation + b.cacheCreation,
    cacheRead: a.cacheRead + b.cacheRead,
    total: a.total + b.total,
  };
}

function groupBy<K extends string>(
  records: UsageRecord[],
  keyFn: (r: UsageRecord) => K,
  labelFn: (key: K, sample: UsageRecord) => string,
): AggregateRow[] {
  const buckets = new Map<K, { sample: UsageRecord; messageCount: number; tokens: TokenBucket; cost: CostBucket }>();
  for (const r of records) {
    const k = keyFn(r);
    let b = buckets.get(k);
    if (!b) {
      b = { sample: r, messageCount: 0, tokens: ZERO_TOKENS(), cost: ZERO_COST() };
      buckets.set(k, b);
    }
    b.messageCount++;
    b.tokens = addTokens(b.tokens, tokenSumOf(r));
    b.cost = addCost(b.cost, costFor(r.model, r.usage));
  }
  return [...buckets.entries()].map(([key, b]) => ({
    key,
    label: labelFn(key, b.sample),
    messageCount: b.messageCount,
    tokens: b.tokens,
    cost: b.cost,
  }));
}

export function aggregateByModel(records: UsageRecord[]): AggregateRow[] {
  return groupBy(records, (r) => r.model as string, (k) => k).sort((a, b) => b.tokens.total - a.tokens.total);
}

export function aggregateByDay(records: UsageRecord[]): AggregateRow[] {
  return groupBy(
    records,
    (r) => (r.timestamp ? formatDate(r.timestamp) : "unknown"),
    (k) => shortDayLabel(k),
  ).sort((a, b) => (a.key < b.key ? -1 : 1));
}

export function aggregateBySession(records: UsageRecord[]): AggregateRow[] {
  return groupBy(
    records,
    (r) => r.sessionId,
    (k) => k.slice(0, 8),
  ).sort((a, b) => b.tokens.total - a.tokens.total);
}

export function aggregateByProject(records: UsageRecord[]): AggregateRow[] {
  return groupBy(
    records,
    (r) => r.projectDir,
    (k) => projectShortLabel(k),
  ).sort((a, b) => b.tokens.total - a.tokens.total);
}

export function grandTotal(records: UsageRecord[]): AggregateRow {
  let tokens = ZERO_TOKENS();
  let cost = ZERO_COST();
  for (const r of records) {
    tokens = addTokens(tokens, tokenSumOf(r));
    cost = addCost(cost, costFor(r.model, r.usage));
  }
  return { key: "total", label: "GRAND TOTAL", messageCount: records.length, tokens, cost };
}

export interface BuildReceiptOptions {
  range: Range;
  scope: "day" | "session" | "project";
  showCost: boolean;
  now?: Date;
}

export function buildReceipt(records: UsageRecord[], opts: BuildReceiptOptions): ReceiptData {
  if (records.length === 0) {
    throw new Error("没有匹配的 usage 记录可用于生成小票");
  }
  const sorted = [...records].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
  const periodStart = sorted[0].timestamp;
  const periodEnd = sorted[sorted.length - 1].timestamp;

  let byScope: AggregateRow[];
  if (opts.scope === "day") byScope = aggregateByDay(records);
  else if (opts.scope === "session") byScope = aggregateBySession(records);
  else byScope = aggregateByProject(records);

  return {
    period: { start: periodStart, end: periodEnd },
    scope: opts.scope,
    range: opts.range,
    generatedAt: (opts.now ?? new Date()).toISOString(),
    slipNo: slipNumber(),
    byModel: aggregateByModel(records),
    byScope,
    grandTotal: grandTotal(records),
    showCost: opts.showCost,
  };
}
