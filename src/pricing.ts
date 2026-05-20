import type { RawUsage, CostBucket } from "./types.js";

export interface PriceEntry {
  input: number;
  output: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
  cacheRead: number;
}

export const DEFAULT_PRICES: Record<string, PriceEntry> = {
  "claude-opus-4":     { input: 15,   output: 75,  cacheWrite5m: 18.75, cacheWrite1h: 30,   cacheRead: 1.50 },
  "claude-sonnet-4":   { input:  3,   output: 15,  cacheWrite5m:  3.75, cacheWrite1h:  6,   cacheRead: 0.30 },
  "claude-haiku-4":    { input:  1,   output:  5,  cacheWrite5m:  1.25, cacheWrite1h:  2,   cacheRead: 0.10 },
  "claude-3-7-sonnet": { input:  3,   output: 15,  cacheWrite5m:  3.75, cacheWrite1h:  6,   cacheRead: 0.30 },
  "claude-3-5-sonnet": { input:  3,   output: 15,  cacheWrite5m:  3.75, cacheWrite1h:  6,   cacheRead: 0.30 },
  "claude-3-5-haiku":  { input:  0.8, output:  4,  cacheWrite5m:  1,    cacheWrite1h:  1.6, cacheRead: 0.08 },
  "claude-3-opus":     { input: 15,   output: 75,  cacheWrite5m: 18.75, cacheWrite1h: 30,   cacheRead: 1.50 },
  "claude-3-sonnet":   { input:  3,   output: 15,  cacheWrite5m:  3.75, cacheWrite1h:  6,   cacheRead: 0.30 },
  "claude-3-haiku":    { input:  0.25, output: 1.25, cacheWrite5m: 0.30, cacheWrite1h: 0.50, cacheRead: 0.03 },
};

let activePrices: Record<string, PriceEntry> = { ...DEFAULT_PRICES };
const unknownModels = new Set<string>();

export function setPrices(custom: Record<string, PriceEntry>): void {
  activePrices = { ...DEFAULT_PRICES, ...custom };
}

export function priceFor(model: string): PriceEntry | null {
  const candidates = Object.keys(activePrices)
    .filter((prefix) => model.startsWith(prefix))
    .sort((a, b) => b.length - a.length);
  if (candidates.length > 0) return activePrices[candidates[0]];
  if (!unknownModels.has(model)) {
    unknownModels.add(model);
    process.stderr.write(`warn: 未识别模型 "${model}"，金额按 0 计算\n`);
  }
  return null;
}

const ZERO_COST: CostBucket = { input: 0, output: 0, cacheCreation: 0, cacheRead: 0, total: 0 };

export function costFor(model: string, usage: RawUsage): CostBucket {
  const p = priceFor(model);
  if (!p) return { ...ZERO_COST };

  const input = (usage.input_tokens ?? 0) * p.input / 1e6;
  const output = (usage.output_tokens ?? 0) * p.output / 1e6;

  const cc = usage.cache_creation;
  const ephemeral1h = cc?.ephemeral_1h_input_tokens ?? 0;
  const ephemeral5m = cc?.ephemeral_5m_input_tokens ?? 0;
  let cacheCreation: number;
  if (ephemeral1h > 0 || ephemeral5m > 0) {
    cacheCreation = (ephemeral1h * p.cacheWrite1h + ephemeral5m * p.cacheWrite5m) / 1e6;
  } else {
    cacheCreation = (usage.cache_creation_input_tokens ?? 0) * p.cacheWrite5m / 1e6;
  }

  const cacheRead = (usage.cache_read_input_tokens ?? 0) * p.cacheRead / 1e6;
  const total = input + output + cacheCreation + cacheRead;
  return { input, output, cacheCreation, cacheRead, total };
}

export function addCost(a: CostBucket, b: CostBucket): CostBucket {
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    cacheCreation: a.cacheCreation + b.cacheCreation,
    cacheRead: a.cacheRead + b.cacheRead,
    total: a.total + b.total,
  };
}
