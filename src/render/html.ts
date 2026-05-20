import type { AggregateRow, ReceiptData, ThemeName } from "../types.js";
import { FONT_STACK, themes } from "../theme.js";
import { formatDate, formatDateTime, formatInt, formatTokensShort, formatUSD } from "../format.js";

const VERSION = "0.1.0";

function escapeHTML(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function modelBlock(row: AggregateRow, showCost: boolean): string {
  const lines: string[] = [];
  lines.push(
    `<div class="model-head">
      <span class="model-name">${escapeHTML(row.label)}</span>
      <span class="model-msgs">${formatInt(row.messageCount)} msgs</span>
    </div>`,
  );
  const items: Array<[string, number, number]> = [
    ["input", row.tokens.input, row.cost.input],
    ["output", row.tokens.output, row.cost.output],
    ["cache create", row.tokens.cacheCreation, row.cost.cacheCreation],
    ["cache read", row.tokens.cacheRead, row.cost.cacheRead],
  ];
  for (const [label, tok, cost] of items) {
    if (tok === 0) continue;
    lines.push(
      `<div class="line">
        <span class="line-left">▸ ${escapeHTML(label)}</span>
        <span class="line-tok">${formatInt(tok)}</span>
        ${showCost ? `<span class="line-cost">${formatUSD(cost)}</span>` : ""}
      </div>`,
    );
  }
  if (showCost) {
    lines.push(
      `<div class="line subtotal">
        <span class="line-left">subtotal</span>
        <span class="line-tok"></span>
        <span class="line-cost">${formatUSD(row.cost.total)}</span>
      </div>`,
    );
  }
  return `<div class="model-block">${lines.join("")}</div>`;
}

function scopeRowLine(row: AggregateRow, showCost: boolean): string {
  return `<div class="scope-row">
    <span class="scope-label">${escapeHTML(row.label)}</span>
    <span class="scope-msgs">${formatInt(row.messageCount)} msgs</span>
    <span class="scope-tok">${formatTokensShort(row.tokens.total)} tok</span>
    ${showCost ? `<span class="scope-cost">${formatUSD(row.cost.total)}</span>` : ""}
  </div>`;
}

function scopeTitle(scope: "day" | "session" | "project"): string {
  if (scope === "day") return "BY DAY";
  if (scope === "session") return "BY SESSION";
  return "BY PROJECT";
}

function rangeNote(range: string): string {
  if (range === "today") return "today";
  if (range === "week") return "last 7 days";
  if (range === "month") return "last 30 days";
  return "all time";
}

export function renderHTML(data: ReceiptData, themeName: ThemeName = "color"): string {
  const t = themes[themeName];
  const showCost = data.showCost;

  const periodStart = formatDate(data.period.start);
  const periodEnd = formatDate(data.period.end);
  const generated = formatDateTime(data.generatedAt);

  const css = `
    :root {
      --bg: ${t.bg};
      --fg: ${t.fg};
      --muted: ${t.muted};
      --dashed: ${t.dashed};
      --double: ${t.double};
      --border: ${t.border};
      --accent: ${t.accent};
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      background: ${themeName === "color" ? "#ece6d6" : "#ededed"};
      font-family: ${FONT_STACK};
      font-size: 12px;
      color: var(--fg);
      font-variant-numeric: tabular-nums;
      -webkit-font-smoothing: antialiased;
    }
    body { padding: 32px 16px; display: flex; justify-content: center; }
    .receipt {
      background: var(--bg);
      color: var(--fg);
      width: 420px;
      padding: 24px 22px;
      border: 1px solid var(--border);
      box-shadow: 0 6px 28px rgba(0,0,0,0.12);
      line-height: 1.5;
    }
    .title {
      text-align: center;
      font-weight: 700;
      letter-spacing: 0.15em;
      font-size: 13px;
      color: var(--accent);
      margin: 0 0 4px;
    }
    .subtitle {
      text-align: center;
      color: var(--muted);
      font-size: 10.5px;
      margin: 0 0 14px;
    }
    .double-sep { border-top: 3px double var(--double); margin: 10px 0; }
    .dashed-sep { border-top: 1px dashed var(--dashed); margin: 10px 0; }
    .meta { display: grid; grid-template-columns: 78px 1fr; row-gap: 2px; column-gap: 8px; }
    .meta-key { color: var(--muted); }
    .section-title {
      font-weight: 700;
      letter-spacing: 0.1em;
      color: var(--accent);
      margin: 4px 0 6px;
    }
    .model-block { margin-bottom: 10px; }
    .model-head {
      display: flex; justify-content: space-between;
      font-weight: 600; color: var(--accent);
    }
    .line {
      display: grid;
      grid-template-columns: 1fr auto auto;
      column-gap: 10px;
      color: var(--fg);
    }
    .line-left { color: var(--muted); }
    .line-tok { min-width: 64px; text-align: right; }
    .line-cost { min-width: 56px; text-align: right; }
    .line.subtotal { color: var(--accent); font-weight: 600; border-top: 1px dotted var(--dashed); margin-top: 4px; padding-top: 2px; }
    .scope-row {
      display: grid;
      grid-template-columns: 1fr 70px 78px ${showCost ? "60px" : ""};
      column-gap: 8px;
    }
    .scope-label { color: var(--fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .scope-msgs, .scope-tok, .scope-cost { text-align: right; color: var(--muted); }
    .scope-cost { color: var(--accent); }
    .grand {
      display: grid;
      grid-template-columns: 1fr auto;
      row-gap: 2px;
      color: var(--accent);
      font-weight: 700;
    }
    .grand .label { letter-spacing: 0.08em; }
    .grand .sub { color: var(--muted); font-weight: 400; }
    .footer {
      text-align: center;
      color: var(--muted);
      font-size: 10px;
      margin-top: 12px;
      line-height: 1.6;
    }
    .footer .brand { color: var(--accent); font-weight: 600; letter-spacing: 0.1em; }
  `.trim();

  const periodLine =
    periodStart === periodEnd
      ? periodStart
      : `${periodStart} ~ ${periodEnd}`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Claude Code Usage Invoice ${escapeHTML(data.slipNo)}</title>
<style>${css}</style>
</head>
<body>
  <div class="receipt">
    <div class="title">CLAUDE CODE USAGE INVOICE</div>
    <div class="subtitle">— a model-invoice receipt —</div>

    <div class="double-sep"></div>

    <div class="meta">
      <span class="meta-key">Period</span><span>${escapeHTML(periodLine)}</span>
      <span class="meta-key">Scope</span><span>${escapeHTML(data.scope)}&nbsp;&nbsp;(${escapeHTML(rangeNote(data.range))})</span>
      <span class="meta-key">Generated</span><span>${escapeHTML(generated)}</span>
      <span class="meta-key">Slip No.</span><span>${escapeHTML(data.slipNo)}</span>
    </div>

    <div class="dashed-sep"></div>
    <div class="section-title">BY MODEL</div>
    ${data.byModel.map((row) => modelBlock(row, showCost)).join("")}

    <div class="dashed-sep"></div>
    <div class="section-title">${scopeTitle(data.scope)} <span style="font-weight:400;color:var(--muted)">(${escapeHTML(rangeNote(data.range))})</span></div>
    ${data.byScope.map((row) => scopeRowLine(row, showCost)).join("")}

    <div class="double-sep"></div>
    <div class="grand">
      <span class="label">GRAND TOTAL</span><span>${formatInt(data.grandTotal.messageCount)} msgs</span>
      <span class="sub">total tokens</span><span>${formatInt(data.grandTotal.tokens.total)}</span>
      ${
        showCost
          ? `<span class="sub">total amount</span><span>${formatUSD(data.grandTotal.cost.total)} USD</span>`
          : ""
      }
    </div>
    <div class="double-sep"></div>

    <div class="footer">
      <div><span class="brand">model-invoice</span> v${VERSION} · ${escapeHTML(formatDate(data.generatedAt))}</div>
      ${showCost ? `<div>* prices estimated from public rate card</div>` : ""}
    </div>
  </div>
</body>
</html>`;
  return html;
}
