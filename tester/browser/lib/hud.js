/**
 * Floating on-page overlay so a visible Chrome run is readable like a QA demo.
 */

const HUD_ID = "__eval_hud";

export async function ensureHud(page, step, status = "running") {
  try {
    await page.evaluate(
      (id, step, status) => {
        const colors = {
          running: "#0ea5e9",
          pass: "#22c55e",
          fail: "#ef4444",
        };
        let el = document.getElementById(id);
        if (!el) {
          el = document.createElement("div");
          el.id = id;
          el.style.cssText = [
            "position:fixed",
            "top:10px",
            "left:10px",
            "z-index:2147483647",
            "font:600 13px/1.35 ui-sans-serif,system-ui,sans-serif",
            "color:#fff",
            "background:rgba(15,23,42,.92)",
            "border:1px solid rgba(255,255,255,.18)",
            "border-radius:12px",
            "padding:10px 14px",
            "min-width:280px",
            "max-width:420px",
            "box-shadow:0 12px 40px rgba(0,0,0,.35)",
            "pointer-events:none",
          ].join(";");
          document.documentElement.appendChild(el);
        }
        const dot = colors[status] || colors.running;
        el.innerHTML =
          `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">` +
          `<span style="width:9px;height:9px;border-radius:99px;background:${dot};display:inline-block"></span>` +
          `<span style="letter-spacing:.04em;font-size:11px;opacity:.8">VIENNA ACTIVE · EVAL TESTER</span>` +
          `</div>` +
          `<div>${step}</div>`;
      },
      HUD_ID,
      step,
      status,
    );
  } catch {
    /* page may be navigating */
  }
}

export async function pause(ms) {
  const n = Number(ms);
  if (!n || n < 0) return;
  await new Promise((r) => setTimeout(r, n));
}
