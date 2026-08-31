#!/usr/bin/env node
/**
 * Visible Chrome eval: public pages, legal, theme, i18n, then the logged-in journey.
 * Default: a real browser window with a HUD overlay.
 * Headless: TESTER_HEADLESS=1
 */
import { goto as gotoShared, isBenignConsole } from "./lib/console.js";
import { launchBrowser } from "./lib/chrome.js";
import { ensureHud, pause } from "./lib/hud.js";
import { runUserJourney } from "./user-journey.js";
import { runMultiUser } from "./multi-user.js";

const BASE_URL = process.env.BASE_URL || "https://localhost";
const STRICT = process.env.TESTER_STRICT === "1";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

/** @type {{ id: string, ok: boolean, detail?: string, repro?: string }[]} */
const results = [];

function pass(id, detail = "") {
  results.push({ id, ok: true, detail });
  console.log(`PASS\t${id}\t${detail}`);
}

function fail(id, detail, repro = "") {
  results.push({ id, ok: false, detail, repro });
  console.log(`FAIL\t${id}\t${detail}`);
  if (repro) console.log(`REPRO\t${id}\t${repro}`);
}

function collectConsole(page, bucket) {
  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error" || (STRICT && type === "warn") || type === "warning") {
      const text = msg.text();
      if (isBenignConsole(text, type, STRICT)) return;
      bucket.push({ type, text, url: page.url() });
    }
  });
  page.on("pageerror", (err) => {
    bucket.push({ type: "pageerror", text: err.message, url: page.url() });
  });
}

async function goto(page, path, waitMs = 700) {
  await gotoShared(page, BASE_URL, path, waitMs);
  await ensureHud(page, `browse ${path}`);
}

async function main() {
  const { browser, chromePath, headed } = await launchBrowser({
    label: "alex",
    position: "20,40",
    size: "1280,980",
  });
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/discover",
    "/groups",
    "/map",
    "/privacy-policy",
    "/terms-of-service",
  ];

  try {
    const page = await browser.newPage();
    const errors = [];
    collectConsole(page, errors);
    await page.setViewport(VIEWPORTS[0]);

    for (const route of publicRoutes) {
      try {
        await goto(page, route);
        await pause(headed ? 350 : 0);
      } catch (e) {
        fail(
          `BR-desktop-${route}`,
          `navigation failed: ${e.message}`,
          `open ${BASE_URL}${route}`,
        );
      }
    }

    if (errors.length === 0) {
      pass("BR-console-desktop", "no console errors on public routes (1440x900)");
    } else {
      const sample = errors
        .slice(0, 5)
        .map((e) => `[${e.type}] ${e.text} @ ${e.url}`)
        .join(" | ");
      fail(
        "BR-console-desktop",
        `${errors.length} console issue(s): ${sample}`,
        `CHROME_PATH=${chromePath} BASE_URL=${BASE_URL} node tester/browser/check.js`,
      );
    }

    await goto(page, "/");
    const footerLinks = await page.evaluate(() =>
      [...document.querySelectorAll("footer a")].map((a) => ({
        href: a.getAttribute("href"),
        text: a.textContent?.trim(),
      })),
    );
    const hasPrivacy = footerLinks.some((l) => l.href?.includes("privacy"));
    const hasTerms = footerLinks.some((l) => l.href?.includes("terms"));
    if (hasPrivacy && hasTerms) {
      pass("BR-footer", "footer links to Privacy Policy and Terms of Service");
    } else {
      fail(
        "BR-footer",
        `footer legal links missing (found: ${JSON.stringify(footerLinks)})`,
        `open ${BASE_URL}/ and inspect footer`,
      );
    }

    for (const [path, needle] of [
      ["/privacy-policy", "Privacy"],
      ["/terms-of-service", "Terms"],
    ]) {
      await goto(page, path);
      const text = await page.evaluate(() => document.body.innerText);
      if (text.length > 400 && text.toLowerCase().includes(needle.toLowerCase())) {
        pass(`BR-legal-${path}`, `page has substantive content (${text.length} chars)`);
      } else {
        fail(
          `BR-legal-${path}`,
          "legal page looks empty or placeholder",
          `curl -sk ${BASE_URL}${path} | wc -c`,
        );
      }
    }

    await goto(page, "/discover");
    try {
      await page.waitForSelector('[aria-label="Toggle dark mode"]', { timeout: 10000 });
      const before = await page.evaluate(() => document.body.classList.contains("dark"));
      await page.click('[aria-label="Toggle dark mode"]');
      await pause(300);
      const after = await page.evaluate(() => document.body.classList.contains("dark"));
      if (before === after) {
        fail("BR-theme", "theme toggle did not change body.dark", `open ${BASE_URL}/discover`);
      } else {
        pass("BR-theme", `dark/light toggle works (${before} → ${after})`);
      }
    } catch (e) {
      fail("BR-theme", `theme toggle failed: ${e.message}`, `open ${BASE_URL}/discover`);
    }

    try {
      await page.waitForSelector('[aria-label="Language"]', { timeout: 10000 });
      await page.click('[aria-label="Language"]');
      await pause(400);
    } catch {
      /* ignore */
    }
    const langCount = await page.$$eval(".language-switcher__option", (els) => els.length).catch(() => 0);
    if (langCount >= 3) {
      pass("BR-i18n", `≥3 languages in switcher (${langCount} options)`);
    } else {
      fail("BR-i18n", `expected ≥3 languages in UI, found ${langCount}`, `open ${BASE_URL}/discover`);
    }

    console.log("\n--- logged-in user journey (visible Chrome + HUD + DevTools) ---");
    const journeyViewports =
      headed && process.env.TESTER_MOBILE !== "1"
        ? [VIEWPORTS[0]]
        : VIEWPORTS;
    const journeyResults = await runUserJourney(browser, {
      strict: STRICT,
      page,
      viewports: journeyViewports,
    });
    results.push(...journeyResults);

    await page.close();
  } finally {
    await browser.close();
  }

  if (process.env.TESTER_MULTI !== "0") {
    console.log("\n--- two users, two Chrome windows (DevTools open) ---");
    const multi = await runMultiUser();
    results.push(...multi);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\nBROWSER_SUMMARY\tpass=${results.length - failed.length}\tfail=${failed.length}`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`FATAL\t${err.message}`);
  process.exit(2);
});
