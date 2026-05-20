export interface RawUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation?: {
    ephemeral_5m_input_tokens?: number;
    ephemeral_1h_input_tokens?: number;
  };
}

export interface UsageRecord {
  sessionId: string;
  projectDir: string;
  timestamp: string;
  model: string;
  usage: RawUsage;
}

export interface TokenBucket {
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
  total: number;
}

export interface CostBucket {
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
  total: number;
}

export interface AggregateRow {
  key: string;
  label: string;
  messageCount: number;
  tokens: TokenBucket;
  cost: CostBucket;
}

export interface ReceiptData {
  period: { start: string; end: string };
  scope: "day" | "session" | "project";
  range: string;
  generatedAt: string;
  slipNo: string;
  byModel: AggregateRow[];
  byScope: AggregateRow[];
  grandTotal: AggregateRow;
  showCost: boolean;
}

export type ThemeName = "color" | "mono";

export interface ThemePalette {
  bg: string;
  fg: string;
  muted: string;
  dashed: string;
  double: string;
  border: string;
  accent: string;
}

export interface CliOptions {
  range: "today" | "week" | "month" | "all";
  session?: string;
  project?: string;
  scope: "day" | "session" | "project";
  theme: ThemeName;
  output?: string;
  png: boolean;
  pdf: boolean;
  rates?: string;
  cost: boolean;
  claudeDir?: string;
}
