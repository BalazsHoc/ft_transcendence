/**
 * Shared console / page-error collector for browser eval tests.
 * Tags each issue with the step that was running when it fired.
 */

export function isBenignConsole(text, type, strict) {
  const t = text.toLowerCase();
  if ((type === "warn" || type === "warning") && !strict) {
    if (t.includes("third-party cookie") || t.includes("deprecated")) return true;
  }
  // Expected failed login/register API responses surface as network errors in DevTools
  if (type === "error" && t.includes("failed to load resource")) {
    if (/\b400\b/.test(t) || /\b401\b/.test(t) || /\b403\b/.test(t)) return true;
  }
  return false;
}

export class ConsoleTracker {
  /** @param {boolean} [strict] */
  constructor(strict = false) {
    this.strict = strict;
    /** @type {{ type: string, text: string, url: string, step: string }[]} */
    this.issues = [];
    this.step = "init";
  }

  /** @param {import("puppeteer-core").Page} page */
  attach(page) {
    page.on("console", (msg) => {
      const type = msg.type();
      if (
        type === "error" ||
        (this.strict && (type === "warn" || type === "warning")) ||
        type === "warning"
      ) {
        const text = msg.text();
        if (isBenignConsole(text, type, this.strict)) return;
        const pageUrl = page.url();
        if (!/localhost|127\.0\.0\.1/.test(pageUrl)) return;
        this.issues.push({
          type,
          text,
          url: page.url(),
          step: this.step,
        });
      }
    });
    page.on("pageerror", (err) => {
      this.issues.push({
        type: "pageerror",
        text: err.message,
        url: page.url(),
        step: this.step,
      });
    });
  }

  /** @param {string} name */
  setStep(name) {
    this.step = name;
  }

  sliceSince(before) {
    return this.issues.slice(before);
  }

  formatIssue(issue) {
    return `[${issue.type}] step=${issue.step} ${issue.text} @ ${issue.url}`;
  }
}

/** @param {import("puppeteer-core").Page} page */
export async function goto(page, baseUrl, path, waitMs = 800) {
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, waitMs));
}

export function stepPauseMs() {
  if (process.env.TESTER_PAUSE) return Number(process.env.TESTER_PAUSE);
  if (process.env.TESTER_HEADLESS === "1") return 0;
  return 450;
}

/**
 * @template T
 * @param {ConsoleTracker} tracker
 * @param {string} stepId
 * @param {() => Promise<T>} fn
 */
export async function runStep(tracker, stepId, fn) {
  tracker.setStep(stepId);
  const before = tracker.issues.length;
  const result = await fn();
  return { stepId, result, issues: tracker.sliceSince(before) };
}
