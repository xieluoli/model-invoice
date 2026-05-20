export function formatInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function formatTokensShort(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

export function formatUSD(amount: number): string {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return "<$0.01";
  return "$" + amount.toFixed(2);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const tzOffsetMin = -d.getTimezoneOffset();
  const sign = tzOffsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(tzOffsetMin);
  const tzH = String(Math.floor(abs / 60)).padStart(2, "0");
  const tzM = String(abs % 60).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}:${ss} ${sign}${tzH}${tzM}`;
}

export function shortDayLabel(isoDate: string): string {
  return isoDate.slice(5);
}

export function slipNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const seed = (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()).toString(16).toUpperCase().padStart(4, "0");
  return `#${y}${m}${day}-${seed}`;
}

export function decodeProjectDir(name: string): string {
  return name.startsWith("-") ? name.replace(/-/g, "/") : name;
}

export function projectShortLabel(name: string): string {
  const decoded = decodeProjectDir(name);
  const parts = decoded.split("/").filter(Boolean);
  if (parts.length <= 2) return decoded;
  return ".../" + parts.slice(-2).join("/");
}
