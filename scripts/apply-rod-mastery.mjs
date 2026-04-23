/**
 * Merges `mastery` onto every rod in public/data.json without running a full wiki sync.
 *   node ./scripts/apply-rod-mastery.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rodMasteryBlock } from "./rod-mastery-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const dataPath = path.join(projectRoot, "public", "data.json");

async function main() {
  const raw = await fs.readFile(dataPath, "utf8");
  const data = JSON.parse(raw);
  const rods = Array.isArray(data.rods) ? data.rods : [];
  data.rods = rods.map((rod) => ({
    ...rod,
    mastery: rodMasteryBlock(rod),
  }));
  await fs.writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  const withTrack = data.rods.filter((r) => r.mastery?.track_available).length;
  console.log(`Updated ${data.rods.length} rods; ${withTrack} with Rod Mastery track.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
