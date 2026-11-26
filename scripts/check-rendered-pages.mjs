// Browser render gate. Install test-only dependencies with:
// python -m pip install -r scripts/requirements-browser.txt
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const script = fileURLToPath(new URL("./check-rendered-pages.py", import.meta.url));
const python = process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");
const result = spawnSync(python, [script, ...process.argv.slice(2)], { stdio: "inherit", windowsHide: true });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
