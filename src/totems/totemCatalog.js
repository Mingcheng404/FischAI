import totemDoc from "../data/totems.json";
import { inferTotemCharacteristics } from "./inferCharacteristics.js";

/**
 * @typedef {object} TotemCharacteristics
 * @property {string[]} weather_when_active — Normalized weather ids this totem forces or strongly implies (overlap with fish.preferred_weather).
 * @property {string[]} event_tags — Logical tags: mutation_surge, cosmic, apex_hunt, limited_event_pool, etc.
 * @property {boolean} manipulates_time_of_day — Sundial-style (affects time windows, not a weather token).
 * @property {string[]} mutation_surge_families — Mutation lines weighted higher while active (wiki-level grouping).
 * @property {string | null} apex_hunt_target — Boss id string when this is a hunt totem.
 * @property {boolean} special_event_pool — Replaces or narrows the roll table (e.g. frightful pool).
 * @property {number} value_multiplier — Sell/value multiplier from data (earnings_multiplier).
 * @property {number} luck_multiplier — Multiplicative luck granted while active (stack with rod luck in future calcs). Optional JSON field `luck_multiplier` overrides; else defaults to earnings_multiplier until datamined.
 * @property {number} catch_weight_proxy — Placeholder multiplier for relative catch odds until exact game weights exist; currently equals value_multiplier.
 */

function asTotemList() {
  const raw = totemDoc?.totems;
  return Array.isArray(raw) ? raw : [];
}

/**
 * Wiki/base fields plus `characteristics` for probability tooling.
 * @returns {Array<object & { characteristics: TotemCharacteristics }>}
 */
export function getTotemsWithCharacteristics() {
  return asTotemList().map((row) => ({
    ...row,
    characteristics: inferTotemCharacteristics(row),
  }));
}

let _byId = null;

/** @returns {Record<string, object & { characteristics: TotemCharacteristics }>} */
export function getTotemsById() {
  if (!_byId) {
    _byId = Object.fromEntries(getTotemsWithCharacteristics().map((t) => [t.id, t]));
  }
  return _byId;
}

export function getTotemById(id) {
  return getTotemsById()[id] || null;
}

/** Intersection of totem-implied weather and a fish row's preferred_weather. */
export function weatherOverlapWithFish(totemCharacteristics, fish) {
  const w = new Set(totemCharacteristics?.weather_when_active || []);
  return (fish?.preferred_weather || []).filter((x) => w.has(x));
}

/**
 * Simple 0–1 score: how well totem weather matches fish preferences (for ranking).
 * Not a real spawn rate — placeholder for future models.
 */
export function weatherAffinityScore(totemCharacteristics, fish) {
  const prefs = fish?.preferred_weather;
  if (!Array.isArray(prefs) || prefs.length === 0) return 0;
  const overlap = weatherOverlapWithFish(totemCharacteristics, fish).length;
  return overlap / prefs.length;
}

/** Preview: multiplicative stack of rod and totem luck (placeholder until game formula is known). */
export function previewCombinedLuckMultiplier(rodLuckMultiplier, totemCharacteristics) {
  const r = Number(rodLuckMultiplier);
  const t = Number(totemCharacteristics?.luck_multiplier);
  const rod = Number.isFinite(r) && r > 0 ? r : 1;
  const tot = Number.isFinite(t) && t > 0 ? t : 1;
  return rod * tot;
}
