import { Command } from "commander";
import type { CliOptions } from "./types.js";

const VALID_RANGES = ["today", "week", "month", "all"] as const;
const VALID_SCOPES = ["day", "session", "project"] as const;
const VALID_THEMES = ["color", "mono"] as const;

export function parseArgs(argv: string[]): CliOptions {
  const program = new Command()
    .name("model-invoice")
    .description("一键生成 Claude Code 用量小票 (HTML / PNG / PDF)")
    .version("0.1.0")
    .option("--range <range>", "today|week|month|all", "today")
    .option("--session <id>", "只看某个 session (前缀匹配)")
    .option("--project <name>", "只看某个 project (子串或全名)")
    .option("--scope <scope>", "BY-X 聚合维度: day|session|project", "day")
    .option("--theme <theme>", "color|mono", "color")
    .option("-o, --output <path>", "输出基名 (无扩展名)")
    .option("--png", "额外生成 PNG (需要 playwright)", false)
    .option("--pdf", "额外生成 PDF (需要 playwright)", false)
    .option("--rates <path>", "自定义价目表 JSON")
    .option("--no-cost", "不计算金额")
    .option("--claude-dir <path>", "覆盖 ~/.claude 路径")
    .allowExcessArguments(false);

  program.parse(argv);
  const opts = program.opts();

  if (!VALID_RANGES.includes(opts.range)) {
    throw new Error(`--range 必须是 ${VALID_RANGES.join("|")}`);
  }
  if (!VALID_SCOPES.includes(opts.scope)) {
    throw new Error(`--scope 必须是 ${VALID_SCOPES.join("|")}`);
  }
  if (!VALID_THEMES.includes(opts.theme)) {
    throw new Error(`--theme 必须是 ${VALID_THEMES.join("|")}`);
  }

  return {
    range: opts.range,
    session: opts.session,
    project: opts.project,
    scope: opts.scope,
    theme: opts.theme,
    output: opts.output,
    png: Boolean(opts.png),
    pdf: Boolean(opts.pdf),
    rates: opts.rates,
    cost: opts.cost !== false,
    claudeDir: opts.claudeDir,
  };
}
