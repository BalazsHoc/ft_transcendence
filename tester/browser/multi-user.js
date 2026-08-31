#!/usr/bin/env node
/**
 * Two Chrome windows, two users, DevTools open.
 * Alex (left) and Carlito (right) use the app at the same time:
 * login, join a group, send a direct message, watch the other side.
 */
import { ConsoleTracker, goto, runStep, stepPauseMs } from "./lib/console.js";
import { launchBrowser } from "./lib/chrome.js";
import { ensureHud, pause } from "./lib/hud.js";
import { loginAs, clickByText } from "./lib/actions.js";

const BASE_URL = process.env.BASE_URL || "https://localhost";
const STRICT = process.env.TESTER_STRICT !== "0";
const ALEX = {
  email: process.env.DEMO_EMAIL || "alex@example.com",
  password: process.env.DEMO_PASSWORD || "testpass123",
  label: "alex",
};
const CARL = {
  email: process.env.DEMO2_EMAIL || "carlito@example.com",
  password: process.env.DEMO2_PASSWORD || "12345678",
  label: "carlito",
};

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

async function withHud(page, tracker, prefix, stepId, fn) {
  const repro = "node tester/browser/multi-user.js";
  await ensureHud(page, `${prefix} · ${stepId}`, "running");
  try {
    const { issues } = await runStep(tracker, stepId, fn);
    if (issues.length) {
      fail(
        `${prefix}-${stepId}`,
        `${issues.length} console issue(s) — ${issues.slice(0, 2).map((i) => tracker.formatIssue(i)).join(" | ")}`,
        repro,
      );
      await ensureHud(page, `${prefix} · ${stepId}`, "fail");
    } else {
      pass(`${prefix}-${stepId}`, `${stepId}: ok`);
      await ensureHud(page, `${prefix} · ${stepId}`, "pass");
    }
  } catch (e) {
    fail(`${prefix}-${stepId}`, `${stepId} crashed: ${e.message}`, repro);
    await ensureHud(page, `${prefix} · ${stepId}`, "fail");
  }
  await pause(stepPauseMs());
}

async function apiJson(page, path, options = {}) {
  return page.evaluate(
    async (path, options) => {
      const token = localStorage.getItem("access");
      const res = await fetch(path, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { raw: text };
      }
      return { status: res.status, data };
    },
    path,
    options,
  );
}

async function incomingRequests(page) {
  const r = await apiJson(page, "/api/friends/requests/incoming/");
  return Array.isArray(r.data) ? r.data : r.data?.results || [];
}

async function ensureFriends(pageA, pageB) {
  const meA = await apiJson(pageA, "/api/auth/me/");
  const meB = await apiJson(pageB, "/api/auth/me/");
  const idA = meA.data?.id;
  const idB = meB.data?.id;
  if (!idA || !idB) throw new Error("could not read both user ids");

  const friends = await apiJson(pageA, "/api/friends/");
  const flist = Array.isArray(friends.data) ? friends.data : friends.data?.results || [];
  if (flist.some((row) => row.friend?.id === idB)) return idB;

  const isFrom = (req, userId) =>
    req.requested_by === userId || req.requester?.id === userId;

  const incA = await incomingRequests(pageA);
  const fromB = incA.find((req) => isFrom(req, idB));
  if (fromB?.id) {
    const acc = await apiJson(pageA, `/api/friends/requests/${fromB.id}/accept/`, {
      method: "POST",
    });
    if (acc.status >= 400) throw new Error(`accept failed HTTP ${acc.status}`);
    return idB;
  }

  const incB = await incomingRequests(pageB);
  const fromA = incB.find((req) => isFrom(req, idA));
  if (fromA?.id) {
    const acc = await apiJson(pageB, `/api/friends/requests/${fromA.id}/accept/`, {
      method: "POST",
    });
    if (acc.status >= 400) throw new Error(`accept failed HTTP ${acc.status}`);
    return idB;
  }

  await apiJson(pageA, "/api/friends/requests/", {
    method: "POST",
    body: JSON.stringify({ user_id: idB }),
  });
  const inc = await incomingRequests(pageB);
  const req = inc[0];
  if (req?.id) {
    await apiJson(pageB, `/api/friends/requests/${req.id}/accept/`, { method: "POST" });
  }
  return idB;
}

async function ensureComposer(page) {
  let input = await page.$(
    'input[placeholder*="message" i], textarea[placeholder*="message" i]',
  );
  if (input) return input;
  await clickByText(page, /^personal$/i);
  await pause(500);
  const n = await page.$$eval("section ul li button", (els) => els.length).catch(() => 0);
  if (n > 0) {
    await page.click("section ul li button");
    await pause(700);
  }
  input = await page.$(
    'input[placeholder*="message" i], textarea[placeholder*="message" i]',
  );
  if (!input) throw new Error("chat composer not found (are the users friends?)");
  return input;
}

async function sendChat(page, text) {
  const input = await ensureComposer(page);
  await input.click({ clickCount: 3 });
  await input.type(text, { delay: 10 });
  const send = await page.$('[aria-label="Send"], button[aria-label*="send" i]');
  if (send) await send.click();
  else await page.keyboard.press("Enter");
  await pause(1200);
}

export async function runMultiUser() {
  results = [];
  const ping = `multi-user-${Date.now()}`;

  const left = await launchBrowser({
    label: "alex",
    position: "20,40",
    size: "980,980",
  });
  const right = await launchBrowser({
    label: "carlito",
    position: "1000,40",
    size: "980,980",
  });

  const pageA = await left.browser.newPage();
  const pageB = await right.browser.newPage();
  await pageA.setViewport({ width: 1280, height: 800 });
  await pageB.setViewport({ width: 1280, height: 800 });

  const trackA = new ConsoleTracker(STRICT);
  const trackB = new ConsoleTracker(STRICT);
  trackA.attach(pageA);
  trackB.attach(pageB);

  try {
    await withHud(pageA, trackA, "MU-alex", "login", async () => {
      await loginAs(pageA, ALEX.email, ALEX.password);
      await ensureHud(pageA, "alex · logged in");
    });
    await withHud(pageB, trackB, "MU-carlito", "login", async () => {
      await loginAs(pageB, CARL.email, CARL.password);
      await ensureHud(pageB, "carlito · logged in");
    });

    await withHud(pageA, trackA, "MU-alex", "befriend", async () => {
      await ensureFriends(pageA, pageB);
    });

    await withHud(pageA, trackA, "MU-alex", "open-chats", async () => {
      await goto(pageA, BASE_URL, "/chats");
      await pause(800);
    });
    await withHud(pageB, trackB, "MU-carlito", "open-chats", async () => {
      await goto(pageB, BASE_URL, "/chats");
      await pause(800);
    });

    await withHud(pageA, trackA, "MU-alex", "send-dm", async () => {
      const carlitoId = await pageB.evaluate(async () => {
        const token = localStorage.getItem("access");
        const res = await fetch("/api/auth/me/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        return data.id;
      });
      await goto(pageA, BASE_URL, `/chats?userId=${carlitoId}`);
      await pause(1200);
      await sendChat(pageA, ping);
      const seen = await pageA.evaluate((t) => document.body.innerText.includes(t), ping);
      if (!seen) throw new Error("Alex did not see their own message");
    });

    await withHud(pageB, trackB, "MU-carlito", "receive-dm", async () => {
      await goto(pageB, BASE_URL, "/chats");
      await pause(1000);
      await ensureComposer(pageB);
      const seen = await pageB.evaluate((t) => document.body.innerText.includes(t), ping);
      if (!seen) {
        throw new Error(`Carlito did not see Alex's message (${ping})`);
      }
    });

    await withHud(pageB, trackB, "MU-carlito", "reply-dm", async () => {
      await sendChat(pageB, `${ping}-reply`);
    });

    let groupPath = "";
    await withHud(pageB, trackB, "MU-carlito", "join-group", async () => {
      await goto(pageB, BASE_URL, "/groups");
      const link = await pageB.$('a[href^="/groups/"]:not([href*="edit"])');
      if (link) {
        await link.click();
        await pause(1200);
        await clickByText(pageB, /apply to join|join group/i);
        await pause(1000);
        groupPath = new URL(pageB.url()).pathname;
      }
    });

    const groupPing = `group-${Date.now()}`;
    await withHud(pageB, trackB, "MU-carlito", "group-chat", async () => {
      if (groupPath) await goto(pageB, BASE_URL, groupPath);
      await pause(800);
      const input = await pageB.$(
        'input[placeholder*="message" i], textarea[placeholder*="message" i]',
      );
      if (!input) return;
      await input.click();
      await input.type(groupPing, { delay: 10 });
      const send = await pageB.$('[aria-label="Send"], button[aria-label*="send" i]');
      if (send) await send.click();
      else await pageB.keyboard.press("Enter");
      await pause(1000);
    });

    await withHud(pageA, trackA, "MU-alex", "group-chat", async () => {
      if (!groupPath) return;
      await goto(pageA, BASE_URL, groupPath);
      await pause(1200);
      await clickByText(pageA, /apply to join|join group/i);
      await pause(800);
      const seen = await pageA.evaluate((t) => document.body.innerText.includes(t), groupPing);
      if (!seen) {
        const input = await pageA.$(
          'input[placeholder*="message" i], textarea[placeholder*="message" i]',
        );
        if (!input) return;
      }
    });

    await withHud(pageA, trackA, "MU-alex", "join-event", async () => {
      await goto(pageA, BASE_URL, "/discover");
      const link = await pageA.$('a[href^="/events/"]:not([href$="/edit"])');
      if (link) {
        await link.click();
        await pause(1000);
        await clickByText(pageA, /join event|join|attend/i);
        await pause(800);
      }
    });

    await withHud(pageB, trackB, "MU-carlito", "join-event", async () => {
      await goto(pageB, BASE_URL, "/discover");
      const link = await pageB.$('a[href^="/events/"]:not([href$="/edit"])');
      if (link) {
        await link.click();
        await pause(1000);
        await clickByText(pageB, /join event|join|attend/i);
        await pause(800);
      }
    });

    const issues = [...trackA.issues, ...trackB.issues];
    if (issues.length === 0) {
      pass("MU-summary", "two browsers, two users, no console errors");
    } else {
      fail(
        "MU-summary",
        `${issues.length} console issue(s) across both windows`,
        "node tester/browser/multi-user.js",
      );
    }
  } finally {
    await pause(800);
    await left.browser.close();
    await right.browser.close();
  }

  return results;
}

async function main() {
  await runMultiUser();
  const failed = results.filter((r) => !r.ok);
  console.log(`\nMULTI_SUMMARY\tpass=${results.length - failed.length}\tfail=${failed.length}`);
  process.exit(failed.length > 0 ? 1 : 0);
}

if (process.argv[1]?.includes("multi-user.js")) {
  main().catch((err) => {
    console.error(`FATAL\t${err.message}`);
    process.exit(2);
  });
}
