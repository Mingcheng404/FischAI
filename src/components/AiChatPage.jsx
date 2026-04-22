import { useMemo, useState, useEffect } from "react";
import { useI18n } from "../i18n.jsx";

const REMOTE_API_URL = import.meta.env.VITE_PROBEX_API_URL || "https://api.probex.top/v1/chat/completions";
const REMOTE_MODEL = import.meta.env.VITE_PROBEX_MODEL || "deepseek-v3";
const REMOTE_API_KEY = String(import.meta.env.VITE_PROBEX_API_KEY || "").trim();
const REMOTE_MODEL_CANDIDATES = Array.from(
  new Set(
    [REMOTE_MODEL, "deepseek-chat", "deepseek-v3", "deepseek-reasoner"]
      .map((x) => String(x || "").trim())
      .filter(Boolean)
  )
);
const CHAT_STORAGE_KEY = "fisch_ai_chat_history_v1";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bestRods(rods, limit = 3) {
  return asArray(rods)
    .map((rod) => ({
      ...rod,
      _score:
        number(rod.luck_multiplier, 1) * 0.45 +
        number(rod.lure_speed_modifier, 1) * 0.25 +
        number(rod.control_rating, 0) * 0.2 +
        number(rod.resilience_rating, 0) * 0.1,
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
}

function bestFish(fish, limit = 3) {
  return asArray(fish)
    .map((f) => ({
      ...f,
      _score: number(f.base_value, 0) * number(f.value_multiplier, 1),
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
}

function findMentionByName(list, queryLower) {
  return asArray(list).find((item) => {
    const name = String(item?.name || "").trim().toLowerCase();
    return name.length >= 3 && queryLower.includes(name);
  });
}

function findBestItemMatch(list, queryLower) {
  const rows = asArray(list);
  const exact = findMentionByName(rows, queryLower);
  if (exact) return exact;

  const queryTokens = queryLower
    .split(/[^a-z0-9]+/i)
    .map((x) => x.trim())
    .filter((x) => x.length >= 3);
  if (queryTokens.length === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const item of rows) {
    const name = String(item?.name || "").toLowerCase();
    if (!name) continue;
    const nameTokens = name.split(/[^a-z0-9]+/i).filter((x) => x.length >= 3);
    if (nameTokens.length === 0) continue;
    const overlap = queryTokens.filter((tok) => nameTokens.includes(tok)).length;
    if (overlap === 0) continue;
    const score = overlap / nameTokens.length;
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return bestScore >= 0.34 ? best : null;
}

function hasFischSignal(queryLower) {
  return /(fisch|fish|rod|mutation|totem|island|weather|season|bait|apex|catch|moosewood|snowcap|vertigo|depths)/i.test(
    queryLower
  );
}

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((x) => x.trim())
    .filter((x) => x.length >= 3);
}

function levenshtein(a, b) {
  const s = String(a || "");
  const t = String(b || "");
  const dp = Array.from({ length: s.length + 1 }, () => Array(t.length + 1).fill(0));
  for (let i = 0; i <= s.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= t.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= s.length; i += 1) {
    for (let j = 1; j <= t.length; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[s.length][t.length];
}

function suggestionCandidates(queryLower, data, limit = 4) {
  const stop = new Set(["more", "stronger", "better", "than", "which", "what", "should", "does", "with", "and", "the"]);
  const queryTokens = tokenize(queryLower).filter((tok) => !stop.has(tok));
  if (queryTokens.length === 0) return [];

  const pool = [...asArray(data?.rods), ...asArray(data?.mutations)].map((item) => ({
    name: String(item?.name || ""),
    tokens: tokenize(item?.name),
  }));

  const scored = pool
    .map((item) => {
      if (!item.name || item.tokens.length === 0) return null;
      let best = 1;
      for (const qTok of queryTokens) {
        for (const nTok of item.tokens) {
          const dist = levenshtein(qTok, nTok);
          const maxLen = Math.max(1, qTok.length, nTok.length);
          let norm = dist / maxLen;
          if (nTok.startsWith(qTok) || qTok.startsWith(nTok)) norm *= 0.4;
          if (norm < best) best = norm;
        }
      }
      return { name: item.name, score: best };
    })
    .filter(Boolean)
    .filter((x) => x.score <= 0.45)
    .sort((a, b) => a.score - b.score);

  const seen = new Set();
  const out = [];
  for (const row of scored) {
    const key = row.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row.name);
    if (out.length >= limit) break;
  }
  return out;
}

function compactRecords(records, keepKeys, limit = 10) {
  return asArray(records)
    .slice(0, limit)
    .map((row) =>
      keepKeys.reduce((acc, key) => {
        acc[key] = row?.[key];
        return acc;
      }, {})
    );
}

function findByNameIncludes(records, queryLower, limit = 6) {
  return asArray(records)
    .filter((item) => String(item?.name || "").toLowerCase().includes(queryLower))
    .slice(0, limit);
}

function relevantMutations(mutations, queryLower) {
  const all = asArray(mutations);
  const matched = findByNameIncludes(all, queryLower, 60);
  if (matched.length > 0) return matched;
  if (queryLower.includes("mutation") || queryLower.includes("mutations")) {
    return all
      .slice()
      .sort((a, b) => number(b.value_multiplier, 1) - number(a.value_multiplier, 1))
      .slice(0, 60);
  }
  return all.slice(0, 20);
}

function buildDeterministicCountReply(queryLower, data, t) {
  const asksCount = /(how many|count|total|number of)/i.test(queryLower);
  if (!asksCount) return null;

  const counts = {
    rods: asArray(data?.rods).length,
    fish: asArray(data?.fish).length,
    mutations: asArray(data?.mutations).length,
    islands: asArray(data?.islands).length,
    totems: asArray(data?.totems).length,
  };

  if (/(rod|rods|fishing rod)/i.test(queryLower)) return t("aiChat.countRods", { count: counts.rods });
  if (/(mutation|mutations)/i.test(queryLower)) return t("aiChat.countMutations", { count: counts.mutations });
  if (/\bfish\b|fishes/i.test(queryLower)) return t("aiChat.countFish", { count: counts.fish });
  if (/(island|islands|location|locations)/i.test(queryLower)) return t("aiChat.countIslands", { count: counts.islands });
  if (/(totem|totems)/i.test(queryLower)) return t("aiChat.countTotems", { count: counts.totems });

  return null;
}

function normalizeAiReply(rawReply, query, data, t) {
  const text = String(rawReply || "").trim();
  const queryLower = String(query || "").toLowerCase();
  if (!text) return text;

  const hasInternalContextLeak =
    /not (?:provided|available) in this context/i.test(text) ||
    /\bcontext\b/i.test(text) ||
    /\bsubset\b/i.test(text);

  if (!hasInternalContextLeak) return text;

  const deterministic = buildDeterministicCountReply(queryLower, data, t);
  if (deterministic) return deterministic;

  if (/(rod|rods|fishing rod)/i.test(queryLower)) {
    return `${t("aiChat.countRods", { count: asArray(data?.rods).length })} ${t("aiChat.askRodNameHint")}`;
  }
  if (/(mutation|mutations)/i.test(queryLower)) {
    return `${t("aiChat.countMutations", { count: asArray(data?.mutations).length })} ${t("aiChat.askMutationNameHint")}`;
  }
  return text
    .replace(/not (?:provided|available) in this context/gi, t("aiChat.noInternalContextWording"))
    .replace(/\bsubset\b/gi, t("aiChat.noInternalContextWording"));
}

function randomFrom(list) {
  const rows = asArray(list);
  if (rows.length === 0) return null;
  return rows[Math.floor(Math.random() * rows.length)];
}

function rodPowerScore(rod) {
  return (
    number(rod?.luck_multiplier, 1) * 0.4 +
    number(rod?.lure_speed_modifier, 1) * 0.25 +
    number(rod?.control_rating, 0) * 0.2 +
    number(rod?.resilience_rating, 0) * 0.15
  );
}

function extractRodComparisonPair(queryLower, rods) {
  const list = asArray(rods);
  const directMentions = list.filter((r) => queryLower.includes(String(r?.name || "").toLowerCase()));
  if (directMentions.length >= 2) return [directMentions[0], directMentions[1]];

  const parts = queryLower.split(/\s+(?:or|vs|versus|against|better than|stronger than)\s+/i);
  if (parts.length >= 2) {
    const left = findBestItemMatch(list, parts[0]);
    const right = findBestItemMatch(list, parts.slice(1).join(" "));
    if (left && right && left.id !== right.id) return [left, right];
  }
  return null;
}

function buildRodComparisonCharts(pair, t) {
  const [a, b] = pair;
  return [
    {
      id: `rod-compare-a-${a.id}`,
      title: t("aiChat.chartRodStats", { rod: a.name }),
      labels: [t("aiChat.luck"), t("aiChat.speed"), t("aiChat.control"), t("aiChat.resilience"), t("aiChat.maxKg")],
      values: [
        number(a.luck_multiplier, 1),
        number(a.lure_speed_modifier, 1),
        number(a.control_rating, 0) * 10,
        number(a.resilience_rating, 0) * 10,
        number(a.max_kg, 0) / 100,
      ],
      valueSuffix: "",
    },
    {
      id: `rod-compare-b-${b.id}`,
      title: t("aiChat.chartRodStats", { rod: b.name }),
      labels: [t("aiChat.luck"), t("aiChat.speed"), t("aiChat.control"), t("aiChat.resilience"), t("aiChat.maxKg")],
      values: [
        number(b.luck_multiplier, 1),
        number(b.lure_speed_modifier, 1),
        number(b.control_rating, 0) * 10,
        number(b.resilience_rating, 0) * 10,
        number(b.max_kg, 0) / 100,
      ],
      valueSuffix: "",
    },
    {
      id: `rod-compare-score-${a.id}-${b.id}`,
      title: t("aiChat.chartRodPowerCompare"),
      labels: [a.name, b.name],
      values: [rodPowerScore(a), rodPowerScore(b)],
      valueSuffix: "",
    },
  ];
}

function buildRodComparisonResponse(pair, t) {
  const [a, b] = pair;
  const scoreA = rodPowerScore(a);
  const scoreB = rodPowerScore(b);
  const winner = scoreA === scoreB ? null : scoreA > scoreB ? a : b;
  const scoreLine = `${a.name}: ${scoreA.toFixed(2)} | ${b.name}: ${scoreB.toFixed(2)}`;
  const details = [
    `${a.name} -> ${t("aiChat.luck")} ${number(a.luck_multiplier, 1).toFixed(2)}x, ${t("aiChat.speed")} ${number(
      a.lure_speed_modifier,
      1
    ).toFixed(2)}x, ${t("aiChat.control")} ${(number(a.control_rating, 0) * 100).toFixed(0)}%, ${t("aiChat.resilience")} ${(
      number(a.resilience_rating, 0) * 100
    ).toFixed(0)}%, ${t("aiChat.maxKg")} ${a.max_kg == null ? "∞" : Math.round(number(a.max_kg, 0))}`,
    `${b.name} -> ${t("aiChat.luck")} ${number(b.luck_multiplier, 1).toFixed(2)}x, ${t("aiChat.speed")} ${number(
      b.lure_speed_modifier,
      1
    ).toFixed(2)}x, ${t("aiChat.control")} ${(number(b.control_rating, 0) * 100).toFixed(0)}%, ${t("aiChat.resilience")} ${(
      number(b.resilience_rating, 0) * 100
    ).toFixed(0)}%, ${t("aiChat.maxKg")} ${b.max_kg == null ? "∞" : Math.round(number(b.max_kg, 0))}`,
  ].join("\n");

  return [
    t("aiChat.compareDbOnly"),
    scoreLine,
    winner ? t("aiChat.compareWinner", { rod: winner.name }) : t("aiChat.compareTie"),
    details,
  ].join("\n\n");
}

function buildFunCommandReply(rawText, data, t) {
  const text = String(rawText || "").trim().toLowerCase();
  if (!text.startsWith("/")) return null;
  if (text === "/help") return { reply: t("aiChat.commandHelp") };

  if (text === "/randomrod") {
    const rod = randomFrom(data?.rods);
    if (!rod) return { reply: t("aiChat.noMatch") };
    return {
      reply: t("aiChat.randomRodReply", {
        rod: rod.name,
        luck: number(rod.luck_multiplier, 1).toFixed(2),
        speed: number(rod.lure_speed_modifier, 1).toFixed(2),
        passive: rod.passive_effect || "—",
      }),
      charts: buildRodComparisonCharts([rod, rod], t).slice(0, 1),
    };
  }

  if (text === "/randommutation") {
    const mutation = randomFrom(data?.mutations);
    if (!mutation) return { reply: t("aiChat.noMatch") };
    return {
      reply: t("aiChat.randomMutationReply", {
        mutation: mutation.name,
        mult: number(mutation.value_multiplier, 1).toFixed(2),
        rarity: mutation.rarity_tier || "—",
      }),
      charts: [
        {
          id: `mutation-random-${mutation.name}`,
          title: t("aiChat.chartMutationDetail", { mutation: mutation.name }),
          labels: [t("aiChat.valueMultiplier"), t("aiChat.enchantChance")],
          values: [number(mutation.value_multiplier, 1), number(mutation.enchanting_percent, 0) / 10],
          valueSuffix: "",
        },
      ],
    };
  }

  if (text === "/tip") {
    const rod = bestRods(data?.rods, 1)[0];
    const fish = bestFish(data?.fish, 1)[0];
    if (!rod || !fish) return { reply: t("aiChat.noMatch") };
    return {
      reply: t("aiChat.tipReply", {
        rod: rod.name,
        fish: fish.name,
        value: Math.round(number(fish.base_value, 0)).toLocaleString(),
      }),
    };
  }

  return { reply: t("aiChat.commandHelp") };
}

function buildChartsForQuery(query, data, t) {
  const queryLower = String(query || "").trim().toLowerCase();
  const rods = asArray(data?.rods);
  const mutations = asArray(data?.mutations);
  const rodPair = extractRodComparisonPair(queryLower, rods);
  if (rodPair) return buildRodComparisonCharts(rodPair, t);
  const charts = [];

  const rodHit = findBestItemMatch(rods, queryLower);
  if (rodHit) {
    charts.push({
      id: "rod-focus",
      title: t("aiChat.chartRodStats", { rod: rodHit.name }),
      labels: [t("aiChat.luck"), t("aiChat.speed"), t("aiChat.control"), t("aiChat.resilience")],
      values: [
        number(rodHit.luck_multiplier, 1),
        number(rodHit.lure_speed_modifier, 1),
        number(rodHit.control_rating, 0) * 10,
        number(rodHit.resilience_rating, 0) * 10,
      ],
      valueSuffix: "x",
    });
  }

  const mutationHit = findBestItemMatch(mutations, queryLower);
  if (mutationHit) {
    charts.push({
      id: "mutation-focus",
      title: t("aiChat.chartMutationDetail", { mutation: mutationHit.name }),
      labels: [t("aiChat.valueMultiplier"), t("aiChat.enchantChance")],
      values: [number(mutationHit.value_multiplier, 1), number(mutationHit.enchanting_percent, 0) / 10],
      valueSuffix: "",
    });
  }

  return charts;
}

function ChartCard({ chart }) {
  const values = asArray(chart?.values).map((v) => number(v, 0));
  const labels = asArray(chart?.labels);
  const max = Math.max(1, ...values);
  return (
    <article className="rounded-xl border border-slate-800/80 bg-slate-950/35 p-3">
      <h4 className="text-sm font-semibold text-slate-100">{chart.title}</h4>
      <div className="mt-3 space-y-2">
        {labels.map((label, idx) => {
          const value = values[idx] ?? 0;
          const width = Math.max(2, Math.round((value / max) * 100));
          return (
            <div key={`${label}-${idx}`}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-slate-300">{label}</span>
                <span className="font-mono text-slate-400">
                  {value.toFixed(2)}
                  {chart.valueSuffix || ""}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-cyan-400/80" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function buildAiContext(data, query) {
  const queryLower = String(query || "").trim().toLowerCase();
  const rods = asArray(data?.rods);
  const fish = asArray(data?.fish);
  const mutations = asArray(data?.mutations);
  const islands = asArray(data?.islands);
  const totems = asArray(data?.totems);
  const rodHit = findBestItemMatch(rods, queryLower);
  const fishHit = findBestItemMatch(fish, queryLower);
  const mutationHit = findBestItemMatch(mutations, queryLower);
  const islandHit = findBestItemMatch(islands, queryLower);
  const totemHit = findBestItemMatch(totems, queryLower);
  const hasSpecificItem = Boolean(rodHit || fishHit || mutationHit || islandHit || totemHit);

  const context = {
    source: "local_fisch_database",
    instructions_for_model: [
      "Use total_counts for any database size/count statements.",
      "Do not claim that relevant arrays are the full database.",
      "If user asks for all mutations, state the total using total_counts.mutations and provide representative entries from relevant.mutations unless explicitly asked for exhaustive list.",
    ],
    total_counts: {
      rods: rods.length,
      fish: fish.length,
      mutations: mutations.length,
      islands: islands.length,
      totems: totems.length,
    },
    requested_item: hasSpecificItem
      ? {
          type: rodHit
            ? "rod"
            : fishHit
            ? "fish"
            : mutationHit
            ? "mutation"
            : islandHit
            ? "island"
            : "totem",
          name: (rodHit || fishHit || mutationHit || islandHit || totemHit)?.name || "",
        }
      : null,
    mutation_name_index: mutations.map((m) => m?.name).filter(Boolean),
    relevant: {
      rods: compactRecords(
        hasSpecificItem
          ? rodHit
            ? [rodHit]
            : []
          : findByNameIncludes(rods, queryLower).length > 0
          ? findByNameIncludes(rods, queryLower)
          : bestRods(rods, 5),
        [
          "name",
          "price",
          "luck_multiplier",
          "lure_speed_modifier",
          "control_rating",
          "resilience_rating",
          "max_kg",
          "passive_effect",
          "obtain_method",
          "obtain_location",
        ]
      ),
      fish: compactRecords(
        hasSpecificItem
          ? fishHit
            ? [fishHit]
            : []
          : findByNameIncludes(fish, queryLower).length > 0
          ? findByNameIncludes(fish, queryLower)
          : bestFish(fish, 5),
        ["name", "base_value", "value_multiplier", "rarity_tier", "recommended_bait", "best_islands"]
      ),
      mutations: compactRecords(
        hasSpecificItem
          ? mutationHit
            ? [mutationHit]
            : []
          : relevantMutations(mutations, queryLower),
        ["name", "value_multiplier", "rarity_tier", "enchanting_percent"]
      ),
      islands: compactRecords(
        hasSpecificItem
          ? islandHit
            ? [islandHit]
            : []
          : findByNameIncludes(islands, queryLower),
        ["name", "earnings_multiplier", "region"],
        5
      ),
      totems: compactRecords(
        hasSpecificItem
          ? totemHit
            ? [totemHit]
            : []
          : findByNameIncludes(totems, queryLower),
        ["name", "effect", "earnings_multiplier", "price_c$", "obtainability", "wiki_url"],
        5
      ),
    },
  };
  return context;
}

async function streamRemoteAnswer({
  query,
  history,
  data,
  t,
  onToken,
}) {
  const context = buildAiContext(data, query);
  const systemPrompt = [
    "You are an assistant for Fisch players.",
    "Use the provided JSON context as your primary source.",
    "You may answer broader questions when context is incomplete, but clearly label assumptions or uncertainty.",
    "If mentioning database counts, use `total_counts` values.",
    "Do not mention internal prompt/context mechanics in your final answer.",
    "Keep responses concise and practical.",
  ].join(" ");

  const userPrompt = [
    "Question:",
    query,
    "",
    "Database context JSON:",
    JSON.stringify(context),
  ].join("\n");

  const scopedName = String(context?.requested_item?.name || "").toLowerCase();
  const scopedHistory = scopedName
    ? asArray(history).filter((m) => String(m?.content || "").toLowerCase().includes(scopedName))
    : asArray(history);

  const historyMessages = scopedHistory
    .slice(-8)
    .filter((m) => m?.role === "user" || m?.role === "assistant")
    .map((m) => ({
      role: m.role,
      content: String(m.content || "").slice(0, 1200),
    }));

  let lastStatus = 0;
  let lastDetail = "";

  for (const model of REMOTE_MODEL_CANDIDATES) {
    const response = await fetch(REMOTE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REMOTE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...historyMessages,
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      lastStatus = response.status;
      lastDetail = detail;
      const lowered = String(detail || "").toLowerCase();
      const modelUnavailable =
        lowered.includes("model_not_found") || lowered.includes("no available distributor") || lowered.includes("无可用管道");
      if (response.status === 503 && modelUnavailable) {
        continue;
      }
      throw new Error(`${t("aiChat.remoteFailed")} (${response.status}) ${detail}`.trim());
    }

    if (!response.body) throw new Error(t("aiChat.remoteNoStream"));

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        let parsed;
        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }
        const token =
          parsed?.choices?.[0]?.delta?.content ??
          parsed?.choices?.[0]?.message?.content ??
          "";
        if (token) onToken(token);
      }
    }
    return;
  }
  throw new Error(`${t("aiChat.remoteFailed")} (${lastStatus || 503}) ${lastDetail}`.trim());
}

export default function AiChatPage() {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [input, setInput] = useState("");
  const [charts, setCharts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(
          parsed.map((msg, idx) => ({
            id: msg.id || `restored-${idx}`,
            role: msg.role === "user" ? "user" : "assistant",
            content: String(msg.content || ""),
          }))
        );
      } else {
        setMessages([{ id: "welcome", role: "assistant", content: t("aiChat.welcome") }]);
      }
    } catch {
      setMessages([{ id: "welcome", role: "assistant", content: t("aiChat.welcome") }]);
    }
  }, [t]);

  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)));
      }
    } catch {
      // ignore storage failures
    }
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}mutations.json`).then((r) => r.json()),
    ])
      .then(([main, mut]) => {
        if (cancelled) return;
        const merged = {
          ...(main || {}),
          mutations: asArray(mut?.mutations),
        };
        setData(merged);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setData({
          rods: [],
          fish: [],
          islands: [],
          totems: [],
          mutations: [],
        });
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    return {
      rods: asArray(data?.rods).length,
      fish: asArray(data?.fish).length,
      mutations: asArray(data?.mutations).length,
    };
  }, [data]);

  const quickPrompts = useMemo(
    () => [t("aiChat.quickPromptCompare"), t("aiChat.quickPromptPassive"), t("aiChat.quickPromptMutation"), t("aiChat.quickPromptCount")],
    [t]
  );

  async function submitQuestion(rawText) {
    const text = String(rawText || "").trim();
    if (!text || isGenerating) return;
    setSuggestions([]);
    const userMessage = { id: `user-${Date.now()}`, role: "user", content: text };
    const historyForAi = [...messages, userMessage];
    const assistantId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "assistant", content: t("aiChat.generating") }]);

    if (loading) {
      setCharts([]);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantId ? { ...msg, content: t("aiChat.loadingDb") } : msg))
      );
      return;
    }

    const funCommand = buildFunCommandReply(text, data, t);
    if (funCommand) {
      if (funCommand.charts) setCharts(funCommand.charts);
      setMessages((prev) => prev.map((msg) => (msg.id === assistantId ? { ...msg, content: funCommand.reply } : msg)));
      return;
    }

    setCharts(buildChartsForQuery(text, data, t));

    if (!REMOTE_API_KEY) {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantId ? { ...msg, content: t("aiChat.remoteNotConfigured") } : msg))
      );
      return;
    }

    setIsGenerating(true);
    let streamed = "";
    try {
      await streamRemoteAnswer({
        query: text,
        history: historyForAi,
        data,
        t,
        onToken: (token) => {
          streamed += token;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantId ? { ...msg, content: streamed } : msg))
          );
        },
      });
      if (!streamed.trim()) {
        setMessages((prev) => prev.map((msg) => (msg.id === assistantId ? { ...msg, content: t("aiChat.remoteEmpty") } : msg)));
      } else {
        const normalized = normalizeAiReply(streamed, text, data, t);
        if (normalized !== streamed) {
          setMessages((prev) => prev.map((msg) => (msg.id === assistantId ? { ...msg, content: normalized } : msg)));
        }
      }
    } catch (error) {
      const message = `${t("aiChat.remoteErrorPrefix")}: ${error.message}`;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantId ? { ...msg, content: message } : msg))
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function onSend() {
    const value = input.trim();
    if (!value) return;
    setInput("");
    await submitQuestion(value);
  }

  async function onQuickPrompt(prompt) {
    setInput("");
    await submitQuestion(prompt);
  }

  async function onSuggestionClick(name) {
    setInput("");
    await submitQuestion(name);
  }

  function clearChat() {
    const reset = [{ id: "welcome", role: "assistant", content: t("aiChat.chatCleared") }];
    setCharts([]);
    setMessages(reset);
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(reset));
    } catch {
      // ignore storage failures
    }
  }

  return (
    <section className="fisch-panel p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-200">
            {t("aiChat.badge")}
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-50 md:text-2xl">{t("aiChat.title")}</h2>
          <p className="mt-1 text-sm text-slate-400">{t("aiChat.subtitle")}</p>
        </div>
        <div className="rounded-lg border border-slate-700/80 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
          {t("aiChat.dataCoverage", stats)}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {REMOTE_API_KEY ? t("aiChat.remoteEnabled") : t("aiChat.remoteDisabled")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onQuickPrompt(prompt)}
            className="rounded-lg border border-slate-700/80 bg-slate-900/45 px-2.5 py-1.5 text-xs text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-200"
          >
            {prompt}
          </button>
        ))}
        <button
          type="button"
          onClick={clearChat}
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-200 transition hover:bg-rose-500/20"
        >
          {t("aiChat.clearChat")}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/30 p-3">
        <div className="max-h-[380px] min-h-[240px] space-y-3 overflow-y-auto pr-1">
          {messages.map((msg, idx) => (
            <div
              key={`${msg.role}-${idx}`}
              className={`rounded-xl border px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100"
                  : "border-slate-700/80 bg-slate-900/40 text-slate-200"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSend();
            }}
            placeholder={t("aiChat.inputPlaceholder")}
            className="fisch-input flex-1"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={isGenerating}
            className="rounded-lg border border-cyan-500/45 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30"
          >
            {isGenerating ? t("aiChat.thinking") : t("aiChat.send")}
          </button>
        </div>
        {suggestions.length > 0 ? (
          <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="text-xs font-medium text-amber-100">{t("aiChat.didYouMean")}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSuggestionClick(name)}
                  className="rounded-lg border border-amber-400/40 bg-slate-950/40 px-2.5 py-1.5 text-xs text-amber-100 transition hover:bg-amber-400/20"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {charts.length > 0 ? (
        <section className="mt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{t("aiChat.relatedCharts")}</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {charts.map((chart) => (
              <ChartCard key={chart.id} chart={chart} />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
