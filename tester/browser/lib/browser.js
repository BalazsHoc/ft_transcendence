import puppeteer from "puppeteer-core";
import { execSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Multi-browser launcher used by cross-browser.js. Chromium-family browsers
 * (chrome, chromium, edge) are driven over CDP by puppeteer-core; Firefox is
 * attempted over WebDriver BiDi as a best effort. Anything that is not
 * installed or cannot launch is reported to the caller so it can be skipped
 * with a warning rather than failing the run.
 */

const BROWSER_DEFS = {
  chrome: {
    env: ["CHROME_PATH", "BROWSER_PATH"],
    bins: ["google-chrome", "google-chrome-stable"],
    family: "chromium",
  },
  chromium: {
    env: ["CHROMIUM_PATH", "BROWSER_PATH"],
    bins: ["chromium", "chromium-browser"],
    family: "chromium",
  },
  edge: {
    env: ["EDGE_PATH", "BROWSER_PATH"],
    bins: ["microsoft-edge", "microsoft-edge-stable", "microsoft-edge-beta", "msedge"],
    family: "chromium",
  },
  firefox: {
    env: ["FIREFOX_PATH", "BROWSER_PATH"],
    bins: ["firefox", "firefox-esr"],
    family: "firefox",
  },
  webkit: {
    // puppeteer-core cannot drive WebKit; listed so it can be reported as
    // unsupported rather than silently ignored.
    env: ["WEBKIT_PATH"],
    bins: [],
    family: "webkit",
  },
};

export function knownBrowsers() {
  return Object.keys(BROWSER_DEFS);
}

export function browserFamily(kind) {
  return BROWSER_DEFS[kind] ? BROWSER_DEFS[kind].family : null;
}

/** Resolve an executable path for a logical browser name, or null. */
export function findBrowserPath(kind) {
  const def = BROWSER_DEFS[kind];
  if (!def) return null;
  for (const envName of def.env) {
    const p = process.env[envName];
    if (p && existsSync(p)) return p;
  }
  for (const bin of def.bins) {
    try {
      const p = execSync(`command -v ${bin}`, { encoding: "utf8" }).trim();
      if (p) return p;
    } catch {
      /* try next candidate */
    }
  }
  return null;
}

/** [{ kind, path, family, available, supported }] for the requested names. */
export function detectBrowsers(kinds) {
  return kinds.map((kind) => {
    const family = browserFamily(kind);
    const supported = family === "chromium" || family === "firefox";
    const path = findBrowserPath(kind);
    return { kind, family, supported, path, available: Boolean(path) && supported };
  });
}

function wantHeaded() {
  return process.env.TESTER_HEADLESS !== "1";
}

/**
 * Launch the given browser. Returns { browser, kind, family, path, headed }.
 * Throws when the browser is unsupported or fails to launch.
 * @param {{ kind: string, label?: string, userDataDir?: string }} opts
 */
export async function launchNamed(opts) {
  const kind = opts.kind;
  const def = BROWSER_DEFS[kind];
  if (!def) throw new Error(`unknown browser "${kind}"`);
  if (def.family === "webkit") {
    throw new Error("webkit is not drivable by puppeteer-core (use Playwright)");
  }
  const path = findBrowserPath(kind);
  if (!path) throw new Error(`${kind} not found`);
  const headed = wantHeaded();
  const userDataDir =
    opts.userDataDir || mkdtempSync(join(tmpdir(), `ft-xb-${opts.label || kind}-`));

  if (def.family === "firefox") {
    const browser = await puppeteer.launch({
      browser: "firefox",
      executablePath: path,
      headless: !headed,
      acceptInsecureCerts: true,
      userDataDir,
      protocolTimeout: 60000,
    });
    return { browser, kind, family: "firefox", path, headed };
  }

  // chromium family (chrome / chromium / edge)
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--ignore-certificate-errors",
    "--window-size=1280,900",
  ];
  const browser = await puppeteer.launch({
    executablePath: path,
    headless: !headed,
    acceptInsecureCerts: true,
    defaultViewport: { width: 1280, height: 800 },
    args,
    userDataDir,
    protocolTimeout: 60000,
  });
  return { browser, kind, family: "chromium", path, headed };
}
