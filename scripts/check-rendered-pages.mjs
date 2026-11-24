// Zero-dependency render gate: builds must actually render at phone widths.
// Launches headless Chrome, measures overflow and checks for Next error pages.
// Usage: node scripts/check-rendered-pages.mjs http://localhost:3100
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3100";
const PORT = 9333;
const ROUTES = [
  "/",
  "/features",
  "/supported",
  "/pricing",
  "/devices",
  "/help",
  "/privacy",
  "/terms",
  "/merchant-terms",
  "/account-deletion",
  "/app/dashboard",
  "/app/products",
  "/app/orders",
  "/app/customers",
  "/app/reports",
  "/app/shops",
  "/app/staff",
  "/app/billing",
  "/app/settings",
  "/app/sign-in",
  "/app/signup",
  "/stock/batches",
  "/stock/transfer",
  "/more/payments",
];
const WIDTHS = [360, 375, 412];
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const profile = mkdtempSync(join(tmpdir(), "kan-render-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pageTarget() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((item) => item.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome not listening yet.
    }
    await sleep(250);
  }
  throw new Error("Could not attach to Chrome DevTools");
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`CDP timeout: ${method}`));
      }, 15000);
    });
  }
  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || "Evaluation failed");
    }
    return result.result.value;
  }
}

let ws;
let failures = 0;
try {
  const url = await pageTarget();
  ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  const cdp = new Cdp(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  for (const width of WIDTHS) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 800,
      deviceScaleFactor: 1,
      mobile: true,
    });
    for (const route of ROUTES) {
      await cdp.send("Page.navigate", { url: `${BASE}${route}` });
      let result;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        await sleep(250);
        result = await cdp.evaluate(`(() => {
          if (!document.body || !document.body.innerText) return null;
          return {
            title: document.title,
            width: window.innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
            error: document.body.innerText.includes("__next_error__"),
            text: document.body.innerText.slice(0, 80)
          };
        })()`);
        if (result) break;
      }
      if (!result) {
        failures += 1;
        console.error(`FAIL ${width}px ${route}: no rendered body`);
        continue;
      }
      const ok = !result.error && result.overflow === 0 && result.text.length > 0;
      if (!ok) {
        failures += 1;
        console.error(`FAIL ${width}px ${route}: ${JSON.stringify(result)}`);
      }
    }
  }
  console.log(
    failures === 0
      ? `Render gate OK: ${ROUTES.length} routes at ${WIDTHS.join("/")}px`
      : `Render gate FAILED: ${failures} cases`,
  );
} catch (error) {
  failures += 1;
  console.error(error);
} finally {
  if (ws?.readyState === WebSocket.OPEN) ws.close();
  chrome.kill("SIGTERM");
  try {
    spawn("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  } catch {
    // Best effort on Windows.
  }
  await sleep(300);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    // Profile may still be locked; next run sweeps it.
  }
}
process.exit(failures === 0 ? 0 : 1);
