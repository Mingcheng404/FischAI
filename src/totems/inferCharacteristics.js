/**
 * Derives structured fields for future catch-probability models from totem ids + wiki text.
 * Weather tokens aim to match `fish.preferred_weather` in data.json (clear, rain, foggy, windy, storm, …).
 */

function uniqueStrings(list) {
  return [...new Set((list || []).map((x) => String(x || "").trim()).filter(Boolean))];
}

function numberOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * @param {object} totem — row from totems.json
 * @returns {object} TotemCharacteristics (see totemCatalog.js typedef)
 */
export function inferTotemCharacteristics(totem) {
  const id = String(totem?.id || "");
  const effect = String(totem?.effect || "").toLowerCase();
  const valueMult = numberOr(totem?.earnings_multiplier, 1);

  const weather = [];
  const eventTags = [];
  let manipulatesTimeOfDay = false;
  const mutationSurgeFamilies = [];
  /** @type {string | null} */
  let apexHuntTarget = null;

  if (id === "none") {
    return {
      weather_when_active: [],
      event_tags: [],
      manipulates_time_of_day: false,
      mutation_surge_families: [],
      apex_hunt_target: null,
      special_event_pool: false,
      value_multiplier: 1,
      catch_weight_proxy: 1,
    };
  }

  if (id === "sundial_totem") manipulatesTimeOfDay = true;

  if (id === "clearcast_totem") weather.push("clear");
  if (id === "tempest_totem") {
    weather.push("rain", "storm", "stormy");
  }
  if (id === "windset_totem") weather.push("windy");
  if (id === "smokescreen_totem") weather.push("foggy");
  if (id === "blizzard_totem" || id === "avalanche_totem") {
    weather.push("windy", "storm", "stormy");
  }
  if (id === "cursed_storm_totem" || id === "zeus_storm_totem" || id === "poseidons_wrath_totem") {
    weather.push("storm", "stormy", "rain");
  }

  if (id === "mutation_totem") {
    eventTags.push("mutation_surge");
    mutationSurgeFamilies.push("any_mutation_weight");
  }
  if (id === "shiny_totem") {
    eventTags.push("mutation_surge");
    mutationSurgeFamilies.push("shiny", "luminous");
  }
  if (id === "sparkling_totem") {
    eventTags.push("mutation_surge");
    mutationSurgeFamilies.push("sparkling");
  }
  if (id === "rainbow_totem") {
    eventTags.push("mutation_surge", "rainbow_event");
    mutationSurgeFamilies.push("rainbow");
    weather.push("rain");
  }

  if (id === "meteor_totem") eventTags.push("cosmic", "meteor");
  if (id === "starfall_totem") eventTags.push("cosmic", "starfall");
  if (id === "aurora_totem") eventTags.push("cosmic", "aurora");
  if (id === "eclipse_totem") eventTags.push("cosmic", "eclipse");
  if (id === "blue_moon_totem") eventTags.push("cosmic", "blue_moon");

  if (id === "megalodon_hunt_totem") apexHuntTarget = "megalodon";
  if (id === "kraken_hunt_totem") apexHuntTarget = "kraken";
  if (id === "scylla_hunt_totem") apexHuntTarget = "scylla";
  if (id === "colossal_dragon_hunt_totem") apexHuntTarget = "colossal_dragon";
  if (apexHuntTarget) eventTags.push("apex_hunt");

  let specialEventPool = false;
  if (id === "frightful_pool_totem") {
    specialEventPool = true;
    eventTags.push("limited_event_pool");
  }

  // Effect-text fallback when id did not set weather (keeps catalog resilient if ids change)
  if (weather.length === 0) {
    if (effect.includes("clear weather") || effect.includes("forces clear")) weather.push("clear");
    if (effect.includes("rain") && !effect.includes("rainbow")) weather.push("rain", "storm");
    if (effect.includes("wind weather") || /\bwind\b/.test(effect)) weather.push("windy");
    if (effect.includes("fog")) weather.push("foggy");
    if (effect.includes("blizzard") || effect.includes("snowslide") || effect.includes("avalanche")) {
      weather.push("windy", "storm", "stormy");
    }
    if (effect.includes("lightning") || effect.includes("storm") || effect.includes("sea-storm")) {
      weather.push("storm", "stormy");
    }
  }

  const weatherWhenActive = uniqueStrings(weather);
  const tags = uniqueStrings(eventTags);
  const mutFamilies = uniqueStrings(mutationSurgeFamilies);

  return {
    weather_when_active: weatherWhenActive,
    event_tags: tags,
    manipulates_time_of_day: manipulatesTimeOfDay,
    mutation_surge_families: mutFamilies,
    apex_hunt_target: apexHuntTarget,
    special_event_pool: specialEventPool,
    value_multiplier: valueMult,
    catch_weight_proxy: valueMult,
  };
}
