import { pause } from "./hud.js";

const BASE_URL = process.env.BASE_URL || "https://localhost";

export async function fillLogin(page, email, password) {
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  const emailInput = await page.$('input[type="email"]');
  const passInput = await page.$('input[type="password"]');
  if (!emailInput || !passInput) throw new Error("login inputs not found");
  await emailInput.click({ clickCount: 3 });
  await emailInput.type(email, { delay: 10 });
  await passInput.click({ clickCount: 3 });
  await passInput.type(password, { delay: 10 });
}

export async function submitLogin(page) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await pause(700);
}

export async function isLoggedIn(page) {
  return page.evaluate(() => Boolean(localStorage.getItem("access")));
}

export async function loginAs(page, email, password) {
  const url = `${BASE_URL}/login`;
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await fillLogin(page, email, password);
  await submitLogin(page);
  if (!(await isLoggedIn(page))) {
    throw new Error(`login failed for ${email}`);
  }
}

/** Click the first button/link whose text matches `pattern`. */
export async function clickByText(page, pattern) {
  const handles = await page.$$("button, a, [role='button']");
  for (const handle of handles) {
    const text = await page.evaluate((el) => (el.textContent || "").replace(/\s+/g, " ").trim(), handle);
    if (pattern.test(text)) {
      const box = await handle.boundingBox();
      if (!box) continue;
      await handle.click();
      return text;
    }
  }
  return null;
}

export async function typeInto(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 12000 });
  const el = await page.$(selector);
  await el.click({ clickCount: 3 });
  await el.type(value, { delay: 12 });
}
