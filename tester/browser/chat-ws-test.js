#!/usr/bin/env node
/**
 * Generic chat WebSocket test — connect, send {text}, receive the {type:"message"}
 * echo (the sender is part of the room group, so it receives its own broadcast).
 * Also supports asserting a rejection close code (unauthenticated / forbidden).
 *
 * Env:
 *   WS_ID         label used in the PASS/FAIL line (default "WS")
 *   WS_PATH       path without leading slash or trailing slash, e.g. "ws/events/<id>"
 *   TOKEN         JWT (omit to test the unauthenticated path)
 *   EXPECT_REJECT set to 1 to assert the connection is refused (unauth/forbidden).
 *                 Channels closes rejected sockets before the handshake completes,
 *                 so the client sees an abnormal close (1006)/error rather than the
 *                 application code (4001/4003); we assert "rejected, no echo".
 *   WS_URL        base URL (default https://localhost)
 *
 * Output: "PASS\t<id>\t<msg>" or "FAIL\t<id>\t<msg>" + "REPRO\t<id>\t<cmd>".
 */
import WebSocket from "ws";

const WS_BASE = (process.env.WS_URL || "https://localhost").replace(/^http/, "ws");
const ID = process.env.WS_ID || "WS";
const PATH = process.env.WS_PATH;
const TOKEN = process.env.TOKEN || "";
const EXPECT_REJECT = process.env.EXPECT_REJECT === "1";

const repro =
  `WS_ID=${ID} WS_PATH=${PATH} ` +
  (EXPECT_REJECT ? "EXPECT_REJECT=1 " : "TOKEN=<jwt> ") +
  `node tester/browser/chat-ws-test.js`;

if (!PATH) {
  console.log(`FAIL\t${ID}\tWS_PATH env var required`);
  console.log(`REPRO\t${ID}\t${repro}`);
  process.exit(1);
}

const url = `${WS_BASE}/${PATH}/?token=${encodeURIComponent(TOKEN)}`;
const ws = new WebSocket(url, { rejectUnauthorized: false });
let done = false;

const finish = (ok, msg) => {
  if (done) return;
  done = true;
  console.log(`${ok ? "PASS" : "FAIL"}\t${ID}\t${msg}`);
  if (!ok) console.log(`REPRO\t${ID}\t${repro}`);
  try { ws.close(); } catch { /* ignore */ }
  process.exit(ok ? 0 : 1);
};

const timer = setTimeout(() => finish(false, "no response within 10s"), 10000);
const stamp = `eval-ws-${Date.now()}`;

ws.on("open", () => {
  if (EXPECT_REJECT) {
    clearTimeout(timer);
    finish(false, "connection was accepted but should have been rejected");
    return;
  }
  ws.send(JSON.stringify({ text: stamp }));
});

ws.on("message", (data) => {
  if (EXPECT_REJECT) {
    clearTimeout(timer);
    finish(false, "received a message but the connection should have been rejected");
    return;
  }
  try {
    const msg = JSON.parse(String(data));
    if (msg.type === "message") {
      clearTimeout(timer);
      finish(true, `sent {text} and received the broadcast echo (${msg.type})`);
    } else if (msg.type === "error") {
      clearTimeout(timer);
      finish(false, `server error: ${msg.detail || "unknown"}`);
    }
  } catch {
    /* wait for valid JSON */
  }
});

ws.on("close", (code) => {
  if (done) return;
  clearTimeout(timer);
  if (EXPECT_REJECT) {
    if (code !== 1000) finish(true, `connection correctly rejected (close ${code})`);
    else finish(false, "connection closed cleanly (1000) without being rejected");
  } else {
    finish(false, `connection closed early (code ${code})`);
  }
});

ws.on("error", (err) => {
  if (done) return;
  clearTimeout(timer);
  // A rejected handshake surfaces as an error before the close frame.
  if (EXPECT_REJECT) finish(true, `connection correctly rejected (${err.message})`);
  else finish(false, err.message);
});
