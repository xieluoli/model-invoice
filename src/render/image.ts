import { writeFile } from "node:fs/promises";

const PLAYWRIGHT_HINT =
  "未检测到 playwright。请先安装:\n  npm i playwright\n  npx playwright install chromium";

async function loadChromium() {
  try {
    const mod: any = await import("playwright");
    return mod.chromium;
  } catch {
    throw new Error(PLAYWRIGHT_HINT);
  }
}

export async function renderToPNG(html: string, outPath: string): Promise<void> {
  const chromium = await loadChromium();
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const el = await page.$(".receipt");
    if (!el) {
      const buf = await page.screenshot({ fullPage: true, type: "png" });
      await writeFile(outPath, buf);
    } else {
      await el.screenshot({ path: outPath, type: "png", omitBackground: false });
    }
  } finally {
    await browser.close();
  }
}

export async function renderToPDF(html: string, outPath: string): Promise<void> {
  const chromium = await loadChromium();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.pdf({
      path: outPath,
      printBackground: true,
      width: "460px",
      height: "1200px",
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
  } finally {
    await browser.close();
  }
}
