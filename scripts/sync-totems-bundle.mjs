/**
 * Copies public/totems.json → src/data/totems.json so Vite/Rolldown can import it.
 * Runs automatically before dev/build via npm lifecycle scripts.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const publicPath = path.join(projectRoot, "public", "totems.json");
const bundledPath = path.join(projectRoot, "src", "data", "totems.json");

export async function syncTotemsBundle() {
  await fs.access(publicPath);
  await fs.mkdir(path.dirname(bundledPath), { recursive: true });
  await fs.copyFile(publicPath, bundledPath);
}

async function main() {
  try {
    await syncTotemsBundle();
    console.log("sync-totems-bundle: public/totems.json → src/data/totems.json");
  } catch (e) {
    console.error("sync-totems-bundle: failed (is public/totems.json present?)", e);
    process.exit(1);
  }
}

const selfPath = fileURLToPath(import.meta.url);
const launched = process.argv[1] && path.resolve(process.argv[1]);
if (launched && path.normalize(launched) === path.normalize(selfPath)) {
  main();
}
