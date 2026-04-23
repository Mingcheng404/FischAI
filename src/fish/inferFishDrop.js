/**
 * Placeholder drop / catch likelihood + availability hints for each fish row.
 * When the database gains `event_limited`, `obtainable`, `event_id`, etc., this module reads them automatically.
 */

/** Relative 0–1 weight when wiki `catch_chance` is missing (not a real spawn table). */
const RARITY_FALLBACK_WEIGHT = {
  Trash: 0.4,
  Common: 0.32,
  Seed: 0.28,
  Unusual: 0.22,
  Uncommon: 0.16,
  Rare: 0.09,
  Special: 0.08,
  Fragment: 0.07,
  Gemstone: 0.06,
  Relic: 0.05,
  Legendary: 0.035,
  Mythical: 0.022,
  Exotic: 0.018,
  Limited: 0.012,
  Secret: 0.008,
  "Divine Secret": 0.004,
  Apex: 0.01,
  Extinct: 0,
};

const DEFAULT_RARITY_WEIGHT = 0.06;

function normalizeCatchChance(raw) {
  if (raw === null || raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n > 1) return Math.min(1, n / 100);
  return n;
}

function rarityFallbackWeight(tier) {
  const key = String(tier || "").trim();
  if (key && Object.prototype.hasOwnProperty.call(RARITY_FALLBACK_WEIGHT, key)) {
    return RARITY_FALLBACK_WEIGHT[key];
  }
  return DEFAULT_RARITY_WEIGHT;
}

function readBooleanField(obj, keys) {
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k) && typeof obj[k] === "boolean") {
      return obj[k];
    }
  }
  return null;
}

function inferEventLimited(fish) {
  const explicit = readBooleanField(fish, ["event_limited", "limited_time", "is_event_fish"]);
  if (explicit === true) return true;
  if (explicit === false) return false;
  if (String(fish?.rarity_tier || "").trim() === "Limited") return true;
  const desc = String(fish?.description || "").toLowerCase();
  if (/\bevent[-\s]only\b|\btime[-\s]limited\b|\blimited\s+time\b|\bseasonal\s+exclusive\b/.test(desc)) return true;
  return false;
}

function inferUnobtainableHint(fish) {
  const explicit = readBooleanField(fish, ["obtainable", "is_obtainable"]);
  if (explicit === false) return true;
  if (String(fish?.rarity_tier || "").trim() === "Extinct") return true;
  return false;
}

/**
 * @typedef {object} FishDropProfile
 * @property {{ wiki_catch_chance: number | null, rarity_tier: string }} sources
 * @property {number | null} normalized_catch_rate — From infobox `catch_chance` when present (0–1).
 * @property {number} rarity_fallback_weight — Prior when wiki rate missing.
 * @property {number} effective_drop_likelihood_proxy — Use in calculators: wiki rate if set, else rarity fallback (0–1).
 * @property {object} availability
 * @property {boolean} availability.has_seasonal_window — `preferred_seasons` non-empty.
 * @property {string[]} availability.seasons — spring | summer | autumn | winter
 * @property {boolean} availability.is_event_limited — Explicit DB flag or heuristic.
 * @property {boolean} availability.unobtainable_hint — Extinct / marked unobtainable.
 * @property {string[]} availability.event_tags — From `fish.event_tags` when added to DB; else [].
 * @property {string | null} availability.event_id — From `fish.event_id` when added.
 * @property {boolean} availability.details_pending — True until seasonal/event fields are fully curated.
 */

/**
 * @param {object} fish — one row from data.json `fish` array
 * @returns {FishDropProfile}
 */
export function inferFishDropProfile(fish) {
  const wikiRate = normalizeCatchChance(fish?.catch_chance);
  const tier = String(fish?.rarity_tier || "").trim() || "Unknown";
  const rarityWeight = rarityFallbackWeight(tier);
  const extinctLike = inferUnobtainableHint(fish);

  const effective =
    extinctLike ? 0 : wikiRate !== null ? wikiRate : rarityWeight;

  const seasons = Array.isArray(fish?.preferred_seasons)
    ? fish.preferred_seasons.map((x) => String(x || "").trim()).filter(Boolean)
    : [];

  const eventTags = Array.isArray(fish?.event_tags)
    ? fish.event_tags.map((x) => String(x || "").trim()).filter(Boolean)
    : [];

  const eventId = fish?.event_id != null && String(fish.event_id).trim() ? String(fish.event_id).trim() : null;

  return {
    sources: {
      wiki_catch_chance: wikiRate,
      rarity_tier: tier,
    },
    normalized_catch_rate: wikiRate,
    rarity_fallback_weight: extinctLike ? 0 : rarityWeight,
    effective_drop_likelihood_proxy: effective,
    availability: {
      has_seasonal_window: seasons.length > 0,
      seasons,
      is_event_limited: inferEventLimited(fish),
      unobtainable_hint: extinctLike,
      event_tags: eventTags,
      event_id: eventId,
      details_pending: eventTags.length === 0 && eventId === null,
    },
  };
}

/**
 * @param {object[]} fishList
 * @returns {Array<object & { drop_profile: FishDropProfile }>}
 */
export function attachFishDropProfiles(fishList) {
  const rows = Array.isArray(fishList) ? fishList : [];
  return rows.map((fish) => ({
    ...fish,
    drop_profile: inferFishDropProfile(fish),
  }));
}

/** True if `seasonId` matches `fish.preferred_seasons`, or if the fish has no seasonal prefs (always allowed). */
export function isFishInSeason(fish, seasonId) {
  const seasons = fish?.preferred_seasons;
  if (!Array.isArray(seasons) || seasons.length === 0) return true;
  const s = String(seasonId || "").trim().toLowerCase();
  if (!s) return true;
  return seasons.some((x) => String(x).toLowerCase() === s);
}

