/**
 * Rods that have a Rod Mastery quest track (Official Fisch Wiki — Rod Mastery article).
 * Update this list when the wiki changes. Names are matched loosely to data.json `name` fields.
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

/** Extra aliases: local `name` -> wiki mastery name (normalized keys). */
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

/**
 * @param {{ name?: string, wiki_url?: string }} rod
 */
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
    /** Filled when quests are datamined */
    quest_count: null,
    /** Per-quest rewards: stat boosts, C$, XP, cosmetics — expand in DB later */
    quest_rewards_summary: track
      ? "Per-rod quests reward passive boosts, C$, XP, skins, bobbers, lanterns, titles, halos, gliders, boats (wiki)."
      : null,
    /** Numeric mastery bonuses by tier — TBD */
    passive_stat_boosts: null,
    data_pending: track,
    source_note: "Rod Mastery rod names from fischipedia.org/wiki/Rod_Mastery (update scripts/rod-mastery-data.mjs when wiki changes).",
  };
}
