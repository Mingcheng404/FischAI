/**
 * Totem rows are stored in public/totems.json (canonical).
 * This script refreshes metadata in public/data.json (imported_counts, notes)
 * so it stays consistent. It does not duplicate totem objects into data.json.
 *
 *   npm run seed:totems
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const totemsPath = path.join(projectRoot, "public", "totems.json");
const dataPath = path.join(projectRoot, "public", "data.json");

async function main() {
  const totemRaw = await fs.readFile(totemsPath, "utf8");
  const { totems } = JSON.parse(totemRaw);
  if (!Array.isArray(totems)) {
    throw new Error("public/totems.json must contain a 'totems' array.");
  }

  const dataRaw = await fs.readFile(dataPath, "utf8");
  const data = JSON.parse(dataRaw);
  if (data.source_sync) {
    data.source_sync.provider = data.source_sync.provider || "Official Fisch Wiki";
    data.source_sync.totems_note =
      "Totem definitions live in public/totems.json; loaded at runtime with data.json.";
    data.source_sync.imported_counts = data.source_sync.imported_counts || {};
    data.source_sync.imported_counts.totems = totems.length;
  }
  if ("totems" in data) {
    delete data.totems;
  }

  await fs.writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`totems.json: ${totems.length} totems. Updated data.json metadata (totems not embedded).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

