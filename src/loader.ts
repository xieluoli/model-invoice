import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { createInterface } from "node:readline";
import { join } from "node:path";
import { homedir } from "node:os";
import type { UsageRecord } from "./types.js";

export function defaultClaudeDir(): string {
  return join(homedir(), ".claude");
}

export function projectsDir(claudeDir = defaultClaudeDir()): string {
  return join(claudeDir, "projects");
}

export interface LoadOptions {
  claudeDir?: string;
  session?: string;
  project?: string;
}

export async function loadUsageRecords(opts: LoadOptions = {}): Promise<UsageRecord[]> {
  const root = projectsDir(opts.claudeDir);
  if (!existsSync(root)) {
    throw new Error(`未找到 Claude Code 数据目录: ${root}`);
  }

  const projectDirs = readdirSync(root)
    .filter((name) => {
      try {
        return statSync(join(root, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .filter((name) => (opts.project ? name.includes(opts.project) || name === opts.project : true));

  const all: UsageRecord[] = [];
  for (const dir of projectDirs) {
    const dirPath = join(root, dir);
    const files = readdirSync(dirPath).filter((f) => f.endsWith(".jsonl"));
    for (const file of files) {
      const sessionId = file.replace(/\.jsonl$/, "");
      if (opts.session && !sessionId.startsWith(opts.session)) continue;
      const records = await loadJsonl(join(dirPath, file), sessionId, dir);
      all.push(...records);
    }
  }

  return all;
}

async function loadJsonl(filePath: string, sessionId: string, projectDir: string): Promise<UsageRecord[]> {
  const out: UsageRecord[] = [];
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let lineNo = 0;
  for await (const line of rl) {
    lineNo++;
    if (!line.trim()) continue;
    let parsed: any;
    try {
      parsed = JSON.parse(line);
    } catch {
      process.stderr.write(`warn: ${filePath}:${lineNo} JSON 解析失败，跳过\n`);
      continue;
    }
    if (parsed?.type !== "assistant") continue;
    const message = parsed.message;
    const usage = message?.usage;
    if (!usage) continue;
    const model: string | undefined = message?.model;
    if (!model) continue;

    out.push({
      sessionId,
      projectDir,
      timestamp: parsed.timestamp ?? "",
      model,
      usage,
    });
  }
  return out;
}
