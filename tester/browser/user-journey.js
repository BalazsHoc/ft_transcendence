#!/usr/bin/env node
/**
 * Logged-in user journey. Chrome stays open and a HUD shows each step.
 *
 *   node tester/browser/user-journey.js
 *   TESTER_HEADLESS=1 node tester/browser/user-journey.js
 */
import { ConsoleTracker, goto, runStep, stepPauseMs } from "./lib/console.js";
import { launchBrowser } from "./lib/chrome.js";
import { ensureHud, pause } from "./lib/hud.js";
import {
  fillLogin,
  submitLogin,
  isLoggedIn,
  clickByText,
  typeInto,
} from "./lib/actions.js";

const BASE_URL = process.env.BASE_URL || "https://localhost";
const DEMO_EMAIL = process.env.DEMO_EMAIL || "alex@example.com";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "testpass123";
const STRICT = process.env.TESTER_STRICT !== "0";

/** @type {{ id: string, ok: boolean, detail: string, repro?: string }[]} */
let results = [];

function pass(id, detail) {
  results.push({ id, ok: true, detail });
  console.log(`PASS\t${id}\t${detail}`);
}

function fail(id, detail, repro = "") {
  results.push({ id, ok: false, detail, repro });
  console.log(`FAIL\t${id}\t${detail}`);
  if (repro) console.log(`REPRO\t${id}\t${repro}`);
}

async function openMobileMenu(page) {
  const btn = await page.$(
    '[aria-label="Open menu"], [aria-label="Menu"], [aria-label*="menu" i]',
  );
  if (btn) {
    await btn.click();
    await pause(400);
    return true;
  }
  return false;
}

async function clickNav(page, href, vp) {
  if (vp.width < 768) {
    await goto(page, BASE_URL, "/discover");
    await openMobileMenu(page);
  }
  const sel =
    vp.width < 768
      ? `.header-mobile-menu a[href="${href}"]`
      : `nav a[href="${href}"]`;
  await page.waitForSelector(sel, { visible: true, timeout: 10000 });
  await page.click(sel);
  await page.waitForFunction(
    (path) =>
      window.location.pathname === path ||
      window.location.pathname.startsWith(`${path}/`),
    { timeout: 15000 },
    href,
  );
  await pause(500);
}

async function goToProfile(page, vp) {
  if (vp.width < 768) {
    await goto(page, BASE_URL, "/discover");
    await openMobileMenu(page);
  }
  await page.waitForSelector(".user-menu__trigger", { timeout: 10000 });
  await page.click(".user-menu__trigger");
  await pause(350);
  await page.click('a[href="/profile"]');
  await page.waitForFunction(() => window.location.pathname === "/profile", {
    timeout: 15000,
  });
  await pause(500);
}

/**
 * @param {import("puppeteer-core").Page} page
 * @param {ConsoleTracker} tracker
 * @param {{ name: string, width: number, height: number }} vp
 */
async function runJourney(page, tracker, vp) {
  const prefix = `BR-J-${vp.name}`;
  const repro = `BASE_URL=${BASE_URL} node tester/browser/user-journey.js  # ${vp.name}`;
  const dwell = stepPauseMs();

  function reportStep({ stepId, issues }) {
    const id = `${prefix}-${stepId}`;
    if (issues.length === 0) {
      pass(id, `${stepId}: no console errors`);
    } else {
      const sample = issues
        .slice(0, 3)
        .map((i) => tracker.formatIssue(i))
        .join(" | ");
      fail(id, `${stepId}: ${issues.length} console issue(s) — ${sample}`, repro);
    }
  }

  async function safeStep(stepId, fn) {
    await ensureHud(page, `${vp.name} · ${stepId}`, "running");
    try {
      const outcome = await runStep(tracker, stepId, fn);
      reportStep(outcome);
      await ensureHud(
        page,
        `${vp.name} · ${stepId}`,
        outcome.issues.length ? "fail" : "pass",
      );
      await pause(dwell);
    } catch (e) {
      fail(`${prefix}-${stepId}`, `${stepId} crashed: ${e.message}`, repro);
      await ensureHud(page, `${vp.name} · ${stepId} crashed`, "fail");
      await pause(dwell);
    }
  }

  await page.setViewport({ width: vp.width, height: vp.height });
  page.removeAllListeners("console");
  page.removeAllListeners("pageerror");
  tracker.attach(page);

  await safeStep("landing", async () => {
    await goto(page, BASE_URL, "/");
    await ensureHud(page, `${vp.name} · landing`);
  });

  await safeStep("footer-privacy", async () => {
    await goto(page, BASE_URL, "/");
    const link = await page.$('footer a[href="/privacy-policy"], a[href="/privacy-policy"]');
    if (link) {
      await link.click();
      await page.waitForFunction(() => location.pathname.includes("privacy"), { timeout: 10000 });
      await pause(700);
    }
  });

  await safeStep("footer-terms", async () => {
    await goto(page, BASE_URL, "/");
    const link = await page.$('footer a[href="/terms-of-service"], a[href="/terms-of-service"]');
    if (link) {
      await link.click();
      await page.waitForFunction(() => location.pathname.includes("terms"), { timeout: 10000 });
      await pause(700);
    }
  });

  await safeStep("register-page", async () => {
    await goto(page, BASE_URL, "/register");
    await page.waitForSelector('input[type="email"], form', { timeout: 10000 });
  });

  await safeStep("register-validation", async () => {
    await goto(page, BASE_URL, "/register");
    await page.waitForSelector("form input", { timeout: 10000 });
    await page.waitForFunction(
      () => [...document.querySelectorAll("select option")].some((o) => o.value),
      { timeout: 15000 },
    );
    const fields = await page.$$("form input");
    if (fields.length < 4) throw new Error("register form fields missing");
    await fields[0].type("Eval User", { delay: 8 });
    await fields[1].type(`eval-${Date.now()}@example.test`, { delay: 8 });
    await fields[2].type("TestPass1!x", { delay: 8 });
    await fields[3].type("Mismatch1!x", { delay: 8 });
    const firstOpt = await page.$eval("select option[value]:not([value=''])", (el) => el.value);
    if (firstOpt) await page.select("select", firstOpt);
    await page.click('button[type="submit"]');
    await pause(600);
    const still = await page.evaluate(() => location.pathname.includes("register"));
    if (!still) throw new Error("mismatched passwords submitted the register form");
  });

  await safeStep("google-oauth", async () => {
    await goto(page, BASE_URL, "/login");
    const clicked = await clickByText(page, /google/i);
    if (!clicked) throw new Error("Continue with Google button not found");
    await page
      .waitForFunction(
        () => /accounts\.google\.com|google\.com\/o\/oauth|google\/start/i.test(location.href),
        { timeout: 20000 },
      )
      .catch(() => {});
    const href = page.url();
    if (!/google/i.test(href)) {
      throw new Error(`Google OAuth did not leave the app, stayed on ${href}`);
    }
    await pause(800);
    await goto(page, BASE_URL, "/login");
  });

  await safeStep("empty-login-validation", async () => {
    await goto(page, BASE_URL, "/login");
    await page.click('button[type="submit"]');
    await pause(400);
    const stillLogin = await page.evaluate(() => location.pathname.includes("login"));
    if (!stillLogin) throw new Error("empty login submitted the form");
  });

  await safeStep("invalid-login", async () => {
    await goto(page, BASE_URL, "/login");
    await fillLogin(page, DEMO_EMAIL, "wrong-password-xyz");
    await submitLogin(page);
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  });

  await safeStep("login", async () => {
    await goto(page, BASE_URL, "/login");
    await fillLogin(page, DEMO_EMAIL, DEMO_PASSWORD);
    await submitLogin(page);
    if (!(await isLoggedIn(page))) {
      throw new Error("login succeeded but no access token in localStorage");
    }
  });

  await safeStep("not-found", async () => {
    await goto(page, BASE_URL, "/this-route-does-not-exist-eval");
    await pause(500);
  });

  for (const [stepId, href] of [
    ["nav-discover", "/discover"],
    ["nav-groups", "/groups"],
    ["nav-map", "/map"],
    ["nav-chats", "/chats"],
  ]) {
    await safeStep(stepId, async () => {
      await clickNav(page, href, vp);
    });
  }

  await safeStep("user-menu-profile", async () => {
    await goToProfile(page, vp);
  });

  await safeStep("visit-user-profile", async () => {
    const otherId = await page.evaluate(async () => {
      const token = localStorage.getItem("access");
      const res = await fetch("/api/users/?search=carlito", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.results || [];
      return list[0]?.id || null;
    });
    if (!otherId) throw new Error("could not find another user to visit");
    await goto(page, BASE_URL, `/users/${otherId}`);
    await page.waitForFunction(() => Boolean(document.querySelector("h1, h2")), {
      timeout: 12000,
    });
    await clickByText(page, /add friend|accept|message/i);
    await pause(800);
  });

  await safeStep("open-event", async () => {
    await goto(page, BASE_URL, "/discover");
    const link = await page.$('a[href^="/events/"]:not([href$="/edit"])');
    if (link) {
      await link.click();
      await page.waitForSelector("h1", { timeout: 15000 }).catch(() => {});
      await pause(900);
    }
  });

  await safeStep("event-join-button", async () => {
    const join = await page.$("button");
    if (!join) return;
    const label = await page.evaluate((el) => el.textContent?.trim() || "", join);
    if (/join|leave|attend/i.test(label)) {
      await join.click();
      await pause(900);
    }
  });

  await safeStep("event-chat-send", async () => {
    if (!page.url().includes("/events/")) {
      await goto(page, BASE_URL, "/discover");
      const link = await page.$('a[href^="/events/"]:not([href$="/edit"])');
      if (link) {
        await link.click();
        await pause(1200);
      }
    }
    await clickByText(page, /join event|^join$|attend/i);
    await pause(1000);
    const input = await page.$(
      'input[placeholder*="message" i], textarea[placeholder*="message" i]',
    );
    if (!input) {
      const eventId = await page.evaluate(async () => {
        const token = localStorage.getItem("access");
        const res = await fetch("/api/events/?page=1&page_size=20", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const list = data.results || [];
        const joined = list.find(
          (e) => e.user_status?.status === "attending" || e.user_status?.status === "waiting",
        );
        return joined?.id || list.find((e) => !e.group)?.id || list[0]?.id || null;
      });
      if (!eventId) return;
      await goto(page, BASE_URL, `/events/${eventId}`);
      await pause(1200);
      await clickByText(page, /join event|^join$|attend/i);
      await pause(1000);
    }
    const composer = await page.$(
      'input[placeholder*="message" i], textarea[placeholder*="message" i]',
    );
    if (!composer) return;
    const ping = `eval-event-${Date.now()}`;
    await composer.click();
    await composer.type(ping, { delay: 12 });
    const send = await page.$('[aria-label="Send"], button[aria-label*="send" i]');
    if (send) await send.click();
    else await page.keyboard.press("Enter");
    await pause(900);
  });

  await safeStep("groups-search", async () => {
    await goto(page, BASE_URL, "/groups");
    const search = await page.$('input[type="search"], input[placeholder*="earch" i]');
    if (search) {
      await search.click({ clickCount: 3 });
      await search.type("run", { delay: 25 });
      await pause(1200);
    }
  });

  await safeStep("open-group", async () => {
    const groupLink = await page.$('a[href^="/groups/"]:not([href*="edit"])');
    if (groupLink) {
      await groupLink.click();
      await pause(1000);
    }
  });

  await safeStep("join-group", async () => {
    const applied = await clickByText(page, /apply to join|join group/i);
    if (!applied) {
      await goto(page, BASE_URL, "/groups");
      const links = await page.$$('a[href^="/groups/"]:not([href*="edit"])');
      if (links[1]) await links[1].click();
      else if (links[0]) await links[0].click();
      await pause(1200);
      await clickByText(page, /apply to join|join group/i);
    }
    await pause(1200);
  });

  await safeStep("group-chat-send", async () => {
    const input = await page.$('input[placeholder*="message" i], textarea[placeholder*="message" i]');
    if (!input) return;
    await input.click();
    await input.type(`eval group ping ${Date.now()}`, { delay: 12 });
    const send = await page.$('[aria-label="Send"], button[aria-label*="send" i]');
    if (send) await send.click();
    await pause(900);
  });

  await safeStep("create-group", async () => {
    if (vp.width < 768) return;
    await goto(page, BASE_URL, "/groups");
    const opened = await clickByText(page, /^create group$/i);
    if (!opened) throw new Error("Create group button not found");
    await pause(400);
    const stamp = `Eval ${Date.now()}`;
    await typeInto(page, 'input[name="name"]', stamp);
    const sport = await page.$('select[name="sport"]');
    if (sport) {
      const value = await page.$eval("select[name=\"sport\"]", (el) => {
        const opt = [...el.options].find((o) => o.value);
        return opt ? opt.value : "";
      });
      if (value) await page.select('select[name="sport"]', value);
    }
    await typeInto(page, 'input[name="levels"]', "beginner");
    await clickByText(page, /^create group$/i);
    await pause(1500);
  });

  await safeStep("map-interact", async () => {
    await goto(page, BASE_URL, "/map");
    await page.waitForSelector(".leaflet-container", { timeout: 20000 }).catch(() => {});
    await pause(1500);
  });

  await safeStep("chats-interact", async () => {
    await goto(page, BASE_URL, "/chats");
    await pause(900);
    await page.evaluate(() => {
      for (const btn of document.querySelectorAll("button")) {
        const text = btn.textContent?.trim() || "";
        if (/^(all|personal|events?)$/i.test(text)) btn.click();
      }
    });
    await pause(600);
    await page.evaluate(() => {
      const row = document.querySelector("aside button, [class*='conversation'] button, ul li button");
      row?.click();
    });
    await pause(900);
  });

  await safeStep("send-direct-message", async () => {
    await goto(page, BASE_URL, "/chats");
    await pause(800);
    const personal = await clickByText(page, /^personal$/i);
    if (personal) await pause(400);
    await page.waitForFunction(
      () => [...document.querySelectorAll("section ul li button")].length > 0,
      { timeout: 15000 },
    );
    await page.click("section ul li button");
    await page.waitForSelector(
      'input[placeholder*="message" i], input[placeholder*="Write" i], input[aria-label]',
      { timeout: 12000 },
    );
    const input = await page.$(
      'input[placeholder*="message" i], input[placeholder*="Write" i], input[aria-label]',
    );
    const ping = `eval-dm-${Date.now()}`;
    await input.click();
    await input.type(ping, { delay: 12 });
    const send = await page.$('[aria-label="Send"], button[aria-label*="send" i]');
    if (send) await send.click();
    else await page.keyboard.press("Enter");
    await pause(1000);
    const seen = await page.evaluate((text) => document.body.innerText.includes(text), ping);
    if (!seen) throw new Error("sent message did not appear in the thread");
  });

  await safeStep("notifications", async () => {
    const bell = await page.$(
      '[aria-label*="notification" i], button[class*="notif"], [class*="HeaderNotifications"] button',
    );
    if (bell) {
      await bell.click();
      await pause(700);
    } else {
      await goto(page, BASE_URL, "/discover");
    }
  });

  await safeStep("my-events", async () => {
    await goto(page, BASE_URL, "/my-events");
    await pause(800);
  });

  await safeStep("create-event-form", async () => {
    await goto(page, BASE_URL, "/events/new");
    await page.waitForSelector("form, input, select", { timeout: 15000 });
    await pause(600);
  });

  await safeStep("profile-interact", async () => {
    await goto(page, BASE_URL, "/profile");
    await pause(800);
  });

  if (vp.width >= 768) {
    await safeStep("theme-toggle", async () => {
      await goto(page, BASE_URL, "/discover");
      const btn = await page.$('[aria-label="Toggle dark mode"]');
      if (btn) {
        await btn.click();
        await pause(500);
        await btn.click();
        await pause(400);
      }
    });

    await safeStep("language-switch", async () => {
      await page.click('[aria-label="Language"]').catch(() => {});
      await pause(300);
      const opt = await page.$(".language-switcher__option");
      if (opt) {
        await opt.click();
        await pause(700);
      }
    });
  } else {
    await safeStep("mobile-menu", async () => {
      await goto(page, BASE_URL, "/discover");
      await openMobileMenu(page);
      await page.evaluate(() => {
        const action = [...document.querySelectorAll(".header-mobile-menu__action")].find(
          (el) => el.textContent?.toLowerCase().includes("dark mode"),
        );
        if (action instanceof HTMLElement) action.click();
      });
      await pause(400);
    });
  }

  const total = tracker.issues.length;
  const id = `${prefix}-summary`;
  if (total === 0) {
    pass(id, `full logged-in journey clean (${vp.width}x${vp.height})`);
    await ensureHud(page, `${vp.name} journey clean`, "pass");
  } else {
    const byStep = tracker.issues.reduce((acc, i) => {
      acc[i.step] = (acc[i.step] || 0) + 1;
      return acc;
    }, /** @type {Record<string, number>} */ ({}));
    const breakdown = Object.entries(byStep)
      .map(([s, n]) => `${s}:${n}`)
      .join(", ");
    fail(id, `${total} total console issue(s) — ${breakdown}`, repro);
    await ensureHud(page, `${vp.name} ${total} console issues`, "fail");
  }
  await pause(dwell + 400);
}

export async function runUserJourney(browser, options = {}) {
  results = [];
  const viewports = options.viewports || [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ];
  const reuse = options.page;

  for (const vp of viewports) {
    const page = reuse || (await browser.newPage());
    const tracker = new ConsoleTracker(options.strict ?? STRICT);
    try {
      await runJourney(page, tracker, vp);
    } catch (e) {
      fail(
        `BR-J-${vp.name}-fatal`,
        `journey crashed: ${e.message}`,
        "node tester/browser/user-journey.js",
      );
    } finally {
      if (!reuse) await page.close();
    }
  }

  return results;
}

async function main() {
  const { browser } = await launchBrowser();
  try {
    await runUserJourney(browser);
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\nJOURNEY_SUMMARY\tpass=${results.length - failed.length}\tfail=${failed.length}`);
  process.exit(failed.length > 0 ? 1 : 0);
}

if (process.argv[1]?.includes("user-journey.js")) {
  main().catch((err) => {
    console.error(`FATAL\t${err.message}`);
    process.exit(2);
  });
}
