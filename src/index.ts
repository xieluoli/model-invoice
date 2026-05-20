import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import pc from "picocolors";
import { parseArgs } from "./cli.js";
import { loadUsageRecords } from "./loader.js";
import { buildReceipt, filterByRange } from "./aggregator.js";
import { renderHTML } from "./render/html.js";
import { renderToPDF, renderToPNG } from "./render/image.js";
import { setPrices } from "./pricing.js";
import { formatDate } from "./format.js";

export async function run(argv: string[]): Promise<void> {
  const opts = parseArgs(argv);

  if (opts.rates) {
    try {
      const raw = readFileSync(opts.rates, "utf8");
      const custom = JSON.parse(raw);
      setPrices(custom);
      process.stderr.write(pc.gray(`已加载自定义价目表: ${opts.rates}\n`));
    } catch (e: any) {
      throw new Error(`无法加载 --rates 文件: ${e.message ?? e}`);
    }
  }

  const records = await loadUsageRecords({
    claudeDir: opts.claudeDir,
    session: opts.session,
    project: opts.project,
  });

  const sessionsCount = new Set(records.map((r) => r.sessionId)).size;
  const projectsCount = new Set(records.map((r) => r.projectDir)).size;
  process.stderr.write(
    pc.gray(`✓ 扫描完成: ${records.length} 条 usage / ${sessionsCount} sessions / ${projectsCount} projects\n`),
  );

  const filtered = filterByRange(records, opts.range);
  if (filtered.length === 0) {
    throw new Error(
      `在范围 "${opts.range}" 内没有匹配的 usage 记录。可尝试 --range all 查看全部。`,
    );
  }

  const data = buildReceipt(filtered, {
    range: opts.range,
    scope: opts.scope,
    showCost: opts.cost,
  });

  const html = renderHTML(data, opts.theme);

  const baseName = opts.output ?? `invoice-${formatDate(data.generatedAt)}`;
  const htmlPath = resolve(baseName.endsWith(".html") ? baseName : baseName + ".html");
  const pngPath = resolve(baseName.replace(/\.html?$/, "") + ".png");
  const pdfPath = resolve(baseName.replace(/\.html?$/, "") + ".pdf");

  writeFileSync(htmlPath, html, "utf8");
  process.stdout.write(pc.green("✓ ") + `生成: ${htmlPath}\n`);

  if (opts.png) {
    await renderToPNG(html, pngPath);
    process.stdout.write(pc.green("✓ ") + `生成: ${pngPath}\n`);
  }
  if (opts.pdf) {
    await renderToPDF(html, pdfPath);
    process.stdout.write(pc.green("✓ ") + `生成: ${pdfPath}\n`);
  }
}
