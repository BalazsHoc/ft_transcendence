#!/usr/bin/env node
/**
 * Cross-browser smoke — runs the same short journey (load landing -> log in ->
 * one authenticated navigation) in each requested browser. Chrome/Chromium/Edge
 * run over CDP; Firefox is attempted over WebDriver BiDi. Browsers that are not
 * installed (or cannot launch) are reported as WARN and skipped, unless
 * TESTER_STRICT_BROWSERS=1 is set.
 *
 * Env:
 *   TESTER_BROWSERS         comma list (default "chrome,edge,firefox")
 *   TESTER_STRICT_BROWSERS  "1" -> missing/failed browsers FAIL instead of WARN
 *   BASE_URL                default https://localhost
 *   DEMO_EMAIL / DEMO_PASSWORD  login creds (default alex@example.com/testpass123)
 *
 * Output: PASS/FAIL/WARN + REPRO TSV lines, then an XB_SUMMARY line.
 */
import { detectBrowsers, launchNamed } from "./lib/browser.js";
import { loginAs, isLoggedIn, clickByText } from "./lib/actions.js";

const BASE_URL = process.env.BASE_URL || "https://localhost";
const EMAIL = process.env.DEMO_EMAIL || "alex@example.com";
const PASSWORD = process.env.DEMO_PASSWORD || "testpass123";
const STRICT = process.env.TESTER_STRICT_BROWSERS === "1";
const KINDS = (process.env.TESTER_BROWSERS || "chrome,edge,firefox")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

let passed = 0;
let failed = 0;
let skipped = 0;

const clean = (s) => String(s).replace(/[\t\r\n]+/g, " ").trim();
const pass = (id, detail) => { passed++; console.log(`PASS\t${id}\t${clean(detail)}`); };
const warn = (id, detail) => { skipped++; console.log(`WARN\t${id}\t${clean(detail)}`); };
const fail = (id, detail, repro) => {
  failed++;
  console.log(`FAIL\t${id}\t${clean(detail)}`);
  if (repro) console.log(`REPRO\t${id}\t${clean(repro)}`);
};

const rep = (kind) => `TESTER_BROWSERS=${kind} TESTER_HEADLESS=1 BASE_URL=${BASE_URL} node tester/browser/cross-browser.js`;

async function smoke(kind) {
  const repro = rep(kind);
  let launched;
  try {
    launched = await launchNamed({ kind, label: kind });
  } catch (err) {
    const msg = `${kind} unavailable — ${err.message}`;
    if (STRICT) fail(`XB-${kind}`, msg, repro);
    else warn(`XB-${kind}`, `${msg} (skipped)`);
    return;
  }

  const { browser } = launched;
  try {
    const page = await browser.newPage();

    // 1) public landing page loads
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    const title = await page.title();
    if (title && title.length > 0) pass(`XB-${kind}-load`, `landing page loads (title: "${title}")`);
    else fail(`XB-${kind}-load`, "landing page had no title", repro);

    // 2) login
    await loginAs(page, EMAIL, PASSWORD);
    if (await isLoggedIn(page)) pass(`XB-${kind}-login`, `logged in as ${EMAIL}`);
    else { fail(`XB-${kind}-login`, "login did not persist a token", repro); return; }

    // 3) one authenticated navigation (click a nav item, fall back to goto)
    let navText = null;
    try { navText = await clickByText(page, /Discover|Events|Groups|Map|Profile/i); } catch { /* ignore */ }
    if (!navText) {
      await page.goto(`${BASE_URL}/discover`, { waitUntil: "domcontentloaded", timeout: 60000 });
    }
    await new Promise((r) => setTimeout(r, 600));
    const stillIn = await isLoggedIn(page);
    const url = page.url();
    if (stillIn && url.startsWith(BASE_URL)) {
      pass(`XB-${kind}-nav`, `navigated (${navText ? `clicked "${navText}"` : "went to /discover"}) -> ${url.replace(BASE_URL, "")}`);
    } else {
      fail(`XB-${kind}-nav`, `navigation failed (loggedIn=${stillIn}, url=${url})`, repro);
    }
  } catch (err) {
    fail(`XB-${kind}-run`, `smoke error: ${err.message}`, repro);
  } finally {
    try { await browser.close(); } catch { /* ignore */ }
  }
}

async function main() {
  const detected = detectBrowsers(KINDS);
  const usable = detected.filter((b) => b.available).map((b) => b.kind);
  console.log(
    `HUD\tcross-browser: requested [${KINDS.join(", ")}], usable [${usable.join(", ") || "none"}]`,
  );

  for (const b of detected) {
    if (!b.supported) { warn(`XB-${b.kind}`, `${b.kind} not supported by puppeteer-core (skipped)`); continue; }
    if (!b.available) {
      const msg = `${b.kind} not installed`;
      if (STRICT) fail(`XB-${b.kind}`, msg, rep(b.kind));
      else warn(`XB-${b.kind}`, `${msg} (skipped)`);
      continue;
    }
    await smoke(b.kind);
  }

  console.log(`XB_SUMMARY\tpass=${passed} fail=${failed} skip=${skipped} browsers=[${usable.join(",")}]`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.log(`FAIL\tXB-fatal\t${err.message}`);
  process.exit(1);
});
