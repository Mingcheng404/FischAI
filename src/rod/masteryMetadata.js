/**
 * Rod Mastery wiki list + helpers (shared by Vite app and Node scripts).
 * Update when fischipedia Rod Mastery article changes.
 */

export const ROD_MASTERY_WIKI_DISPLAY_NAMES = [
  "Abyssal Specter Rod",
  "Astraeus Serenade",
  "Aurora Rod",
  "Blade Of Glorp",
  "Destiny Rod",
  "Dreambreaker",
  "Duskwire",
  "Elder Mossripper",
  "Ethereal Prism Rod",
  "Evil Pitchfork",
  "Fabulous Rod",
  "Flimsy Rod",
  "Heaven's Rod",
  "Kings Rod",
  "Magnet Rod",
  "Masterline Rod",
  "Midas Rod",
  "Mythical Rod",
  "No-Life Rod",
  "Onirifalx",
  "Pinion's Aria",
  "Rod Of The Forgotten Fang",
  "Rod Of The Depths",
  "Rod Of The Exalted One",
  "Rod Of The Zenith",
  "Ruinous Oath",
  "Seraphic Rod",
  "Spiritbinder",
  "Steady Rod",
  "Summit Rod",
  "Sunken Rod",
  "The Boom Ball",
  "Trident Rod",
  "Tryhard Rod",
  "Wisdom Rod",
  "Zeus Rod",
];

const NAME_ALIASES = [
  ["rod of the forgotten fang", "Rod Of The Forgotten Fang"],
  ["rod of the depths", "Rod Of The Depths"],
  ["rod of the exalted one", "Rod Of The Exalted One"],
  ["rod of the zenith", "Rod Of The Zenith"],
  ["heavens rod", "Heaven's Rod"],
  ["king's rod", "Kings Rod"],
  ["kings rod", "Kings Rod"],
];

export function normalizeRodNameForMastery(name) {
  return String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const MASTERY_NAME_KEYS = new Set(ROD_MASTERY_WIKI_DISPLAY_NAMES.map((n) => normalizeRodNameForMastery(n)));

const ALIAS_MAP = new Map(NAME_ALIASES.map(([k, v]) => [k, normalizeRodNameForMastery(v)]));

export function rodHasMasteryTrack(rodName) {
  const key = normalizeRodNameForMastery(rodName);
  if (!key) return false;
  if (MASTERY_NAME_KEYS.has(key)) return true;
  const viaAlias = ALIAS_MAP.get(key);
  if (viaAlias && MASTERY_NAME_KEYS.has(viaAlias)) return true;
  return false;
}

export function rodMasteryBlock(rod) {
  const name = String(rod?.name || "");
  const wikiUrlRaw = String(rod?.wiki_url || "").trim();
  const baseWiki = wikiUrlRaw ? wikiUrlRaw.replace(/#.*$/, "") : "";
  const track = rodHasMasteryTrack(name);

  return {
    track_available: track,
    wiki_index_url: "https://fischipedia.org/wiki/Rod_Mastery",
    mastery_section_url: track && baseWiki ? `${baseWiki}#Mastery` : null,
    grand_reward_type: track ? "golden_skin" : null,
    quest_count: null,
    quest_rewards_summary: track
      ? "Per-rod quests reward passive boosts, C$, XP, skins, bobbers, lanterns, titles, halos, gliders, boats (wiki)."
      : null,
    passive_stat_boosts: null,
    data_pending: track,
    source_note: "Rod Mastery names from fischipedia.org/wiki/Rod_Mastery; edit src/rod/masteryMetadata.js.",
  };
}

/**
 * Ensures every rod has a `mastery` object. Wiki-listed rods always get track_available true
 * (fixes stale data.json). Other rods keep existing mastery when present.
 */
export function enrichRodsWithMastery(rods) {
  return (Array.isArray(rods) ? rods : []).map((rod) => {
    if (!rod) return rod;
    const canonical = rodMasteryBlock(rod);
    if (canonical.track_available) {
      return {
        ...rod,
        mastery: {
          ...canonical,
          ...(typeof rod.mastery === "object" && rod.mastery ? rod.mastery : {}),
          track_available: true,
        },
      };
    }
    if (typeof rod.mastery?.track_available === "boolean") return rod;
    return { ...rod, mastery: canonical };
  });
}
