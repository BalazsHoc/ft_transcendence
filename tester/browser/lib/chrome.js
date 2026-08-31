import puppeteer from "puppeteer-core";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  for (const bin of [
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
  ]) {
    try {
      return execSync(`command -v ${bin}`, { encoding: "utf8" }).trim();
    } catch {
      /* next */
    }
  }
  throw new Error("Chrome not found — install google-chrome or set CHROME_PATH");
}

export function wantHeaded() {
  return process.env.TESTER_HEADLESS !== "1";
}

export function slomoMs(headed) {
  if (process.env.TESTER_SLOMO) return Number(process.env.TESTER_SLOMO);
  return headed ? 70 : 0;
}

/**
 * @param {{
 *   label?: string,
 *   position?: string,
 *   size?: string,
 *   userDataDir?: string,
 * }} [opts]
 */
export async function launchBrowser(opts = {}) {
  const chromePath = findChrome();
  const headed = wantHeaded();
  const slowMo = slomoMs(headed);
  const position = opts.position || "40,40";
  const size = opts.size || "1100,980";
  const userDataDir =
    opts.userDataDir || mkdtempSync(join(tmpdir(), `ft-eval-${opts.label || "chrome"}-`));
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--ignore-certificate-errors",
    `--window-size=${size}`,
    `--window-position=${position}`,
  ];
  if (headed) {
    args.push("--auto-open-devtools-for-tabs");
    console.log(
      `HUD\topening Chrome [${opts.label || "main"}] DevTools on ${position} (${chromePath})`,
    );
  }
  const launchOpts = {
    executablePath: chromePath,
    headless: !headed,
    slowMo,
    devtools: headed,
    defaultViewport: headed ? null : { width: 1280, height: 800 },
    args,
    userDataDir,
  };
  try {
    const browser = await puppeteer.launch(launchOpts);
    return { browser, chromePath, headed, userDataDir };
  } catch (err) {
    if (!headed) throw err;
    console.log(`WARN\theaded Chrome failed (${err.message}) — retrying headless`);
    const browser = await puppeteer.launch({
      ...launchOpts,
      headless: true,
      slowMo: 0,
      devtools: false,
      defaultViewport: { width: 1280, height: 800 },
    });
    return { browser, chromePath, headed: false, userDataDir };
  }
}
