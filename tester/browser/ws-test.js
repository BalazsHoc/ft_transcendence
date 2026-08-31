#!/usr/bin/env node
/**
 * WebSocket smoke test — presence heartbeat + optional notification receive.
 * Usage: TOKEN=<jwt> node ws-test.js
 */
import WebSocket from "ws";

const WS_BASE = (process.env.WS_URL || "https://localhost").replace(/^http/, "ws");
const TOKEN = process.env.TOKEN;
if (!TOKEN) {
  console.error("FAIL\tWS-00\tTOKEN env var required");
  process.exit(1);
}

const url = `${WS_BASE}/ws/presence/?token=${encodeURIComponent(TOKEN)}`;

const ws = new WebSocket(url, { rejectUnauthorized: false });
let done = false;

const finish = (ok, id, msg, repro = "") => {
  if (done) return;
  done = true;
  console.log(`${ok ? "PASS" : "FAIL"}\t${id}\t${msg}`);
  if (repro) console.log(`REPRO\t${id}\t${repro}`);
  ws.close();
  process.exit(ok ? 0 : 1);
};

const timer = setTimeout(
  () => finish(false, "WS-timeout", "no response within 8s", `TOKEN=<jwt> WS_URL=${WS_BASE} node tester/browser/ws-test.js`),
  8000,
);

ws.on("open", () => {
  ws.send(JSON.stringify({ type: "heartbeat" }));
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(String(data));
    if (
      msg.type === "presence_update" ||
      msg.type === "presence_snapshot" ||
      msg.type === "heartbeat_ack" ||
      msg.presence
    ) {
      clearTimeout(timer);
      finish(true, "WS-presence", `received ${msg.type || "presence"} message`);
    }
  } catch {
    /* wait for valid JSON */
  }
});

ws.on("error", (err) => {
  clearTimeout(timer);
  finish(false, "WS-error", err.message, `TOKEN=<jwt> node tester/browser/ws-test.js`);
});

ws.on("close", (code) => {
  if (!done && code === 4001) {
    clearTimeout(timer);
    finish(false, "WS-auth", "connection closed 4001 (unauthenticated)", "check JWT token");
  }
});
