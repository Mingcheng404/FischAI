import { createContext, useContext, useMemo, useState } from "react";

const dictionaries = {
  en: {
    app: {
      title: "Fisch Rod Selector",
      subtitle: "Fisch AI chat, mutation lookup, and live event timing in one place.",
      navAiChat: "AI Chat",
      navMutations: "Mutation Search",
      navCountdowns: "Countdowns",
      language: "Language",
    },
    aiChat: {
      badge: "Fisch AI Assistant",
      title: "Ask Fisch questions",
      subtitle: "This assistant only answers Fisch-related questions using the local game database.",
      dataCoverage:
        "Data loaded: {rods} rods · {fish} fish · {mutations} mutations · {islands} islands · {totems} totems",
      inputPlaceholder: "Ask about rods, fish, mutations, islands, or totems...",
      send: "Send",
      thinking: "Thinking...",
      welcome:
        "Hi! I can only answer Fisch questions based on this app's database. Try: 'best rod', 'Bluegill', or 'tell me about Mythical mutation'.",
      remoteEnabled: "Real AI mode: enabled (streaming).",
      remoteDisabled: "Real AI mode: disabled (set VITE_PROBEX_API_KEY in .env.local).",
      loadingDb: "Database is still loading. Please wait a moment and ask again.",
      generating: "Generating response...",
      onlyFisch: "I can only answer Fisch-related questions and only using the local database.",
      fromDb: "Answer based on local Fisch database:",
      askPrompt: "Please type a Fisch-related question.",
      noMatch: "I could not find a matching entry in the database. Try a rod/fish/mutation/island/totem name.",
      remoteNotConfigured: "AI API key is not configured. Real AI response is unavailable.",
      remoteErrorPrefix: "AI request failed",
      remoteFailed: "AI API request failed",
      remoteNoStream: "AI API returned no stream body",
      remoteEmpty: "AI returned an empty response. Please ask again.",
      topRods: "Top rods (by combined luck/speed/control score):",
      topFish: "Top fish (by base value x multiplier):",
      topMutations: "Top mutations (by value multiplier):",
      price: "Price",
      luck: "Luck",
      speed: "Speed",
      control: "Control",
      resilience: "Resilience",
      maxKg: "Max Kg",
      baseValue: "Base value",
      valueMultiplier: "Value multiplier",
      rarity: "Rarity",
      bait: "Recommended bait",
      bestIslands: "Best islands",
      enchantChance: "Enchant chance",
      earningsMultiplier: "Earnings multiplier",
      region: "Region",
      description: "Description",
      effect: "Effect",
      relatedCharts: "Related data charts",
      chartRodStats: "Rod stat profile: {rod}",
      chartTopRods: "Top rods by combined score",
      chartTopMutations: "Top mutations by value multiplier",
      chartMutationDetail: "Mutation detail: {mutation}",
      chartRodPowerCompare: "Rod power score comparison",
      compareDbOnly: "Database comparison result (deterministic):",
      compareWinner: "Stronger overall: {rod}",
      compareTie: "Overall result: tie",
      countRods: "There are {count} rods in the database.",
      countMutations: "There are {count} mutations in the database.",
      countFish: "There are {count} fish entries in the database.",
      countIslands: "There are {count} islands in the database.",
      countTotems: "There are {count} totems in the database.",
      askRodNameHint: "Ask with a rod name to get a direct comparison or stat breakdown.",
      askMutationNameHint: "Ask with a mutation name to get detailed stats.",
      noInternalContextWording: "available in database",
      quickPromptCompare: "Compare Tryhard Rod vs Training Rod",
      quickPromptPassive: "What is the passive of Mythical Rod?",
      quickPromptMutation: "Explain Abyssal mutation",
      quickPromptCount: "How many rods are in database?",
      clearChat: "Clear chat",
      chatCleared: "Chat cleared. Ask any Fisch question or use /help for commands.",
      commandHelp: "Commands: /help, /randomrod, /randommutation, /tip",
      randomRodReply:
        "Random rod pick: {rod}\nLuck {luck}x · Speed {speed}x\nPassive: {passive}",
      randomMutationReply:
        "Random mutation pick: {mutation}\nMultiplier {mult}x · Rarity {rarity}",
      tipReply:
        "Quick tip: Try {rod} when targeting high-value fish like {fish} (base ${value}).",
      didYouMean: "Did you mean one of these?",
    },
    mutations: {
      badge: "Mutation Search",
      title: "Find mutation details",
      subtitle: "Search a mutation and see value multiplier, rods that can trigger it, and enchanting chance.",
      searchPlaceholder: "Search mutation name...",
      loading: "Loading mutations...",
      noMutations: "No mutations found.",
      selectHint: "Select a mutation to view details.",
      mutation: "Mutation",
      valueMultiplier: "Value multiplier",
      enchantingChance: "Enchanting chance",
      rodsCanFish: "Rods that can fish this mutation",
      noRodSources: "No rod source data available for this mutation yet.",
      enchantingSources: "Enchanting sources",
      noEnchantingSources: "No enchanting chance data available for this mutation yet.",
    },
    countdowns: {
      badge: "Live timers",
      title: "Apex & update countdowns",
      subtitle: "Track all Apex hunt cycle windows, weekly update reset, and seasonal rollover.",
      apexTitle: "Apex: {name}",
      cycleInterval: "Cycle interval: {hours}h",
      weeklyUpdate: "Weekly update",
      nextSaturday: "Next Saturday 15:30 UTC",
      seasonalRollover: "Seasonal rollover",
      nextSeason: "Next season: {season}",
      days: "Days",
      hours: "Hours",
      minutes: "Min",
      seconds: "Sec",
      spring: "Spring",
      summer: "Summer",
      autumn: "Autumn",
      winter: "Winter",
    },
    common: {
      loading: "Loading",
      skipToMain: "Skip to main content",
      dash: "-",
    },
  },
  zh: {
    app: {
      title: "Fisch 鱼竿比较器",
      subtitle: "一站式 Fisch AI 聊天、突变查询与实时倒计时。",
      navAiChat: "AI 聊天",
      navMutations: "突变查询",
      navCountdowns: "倒计时",
      language: "语言",
    },
    aiChat: {
      badge: "Fisch AI 助手",
      title: "提问 Fisch 问题",
      subtitle: "该助手仅根据本地游戏数据库回答 Fisch 相关问题。",
      dataCoverage: "已加载数据：{rods} 鱼竿 · {fish} 鱼类 · {mutations} 突变 · {islands} 岛屿 · {totems} 图腾",
      inputPlaceholder: "可提问鱼竿、鱼类、突变、岛屿或图腾...",
      send: "发送",
      thinking: "思考中...",
      welcome: "你好！我只能基于本应用数据库回答 Fisch 问题。可试试：'best rod'、'Bluegill'、'tell me about Mythical mutation'。",
      remoteEnabled: "真实 AI 模式：已启用（流式回复）。",
      remoteDisabled: "真实 AI 模式：未启用（请在 .env.local 中设置 VITE_PROBEX_API_KEY）。",
      loadingDb: "数据库仍在加载，请稍后再问。",
      generating: "正在生成回复...",
      onlyFisch: "我只能回答 Fisch 相关问题，并且仅使用本地数据库。",
      fromDb: "以下答案基于本地 Fisch 数据库：",
      askPrompt: "请输入 Fisch 相关问题。",
      noMatch: "数据库中未找到匹配条目。请尝试鱼竿/鱼类/突变/岛屿/图腾名称。",
      remoteNotConfigured: "AI API Key 未配置，暂时无法使用真实 AI 回复。",
      remoteErrorPrefix: "AI 请求失败",
      remoteFailed: "AI API 请求失败",
      remoteNoStream: "AI API 未返回流式内容",
      remoteEmpty: "AI 返回为空，请重新提问。",
      topRods: "顶级鱼竿（按幸运/速度/控制综合评分）：",
      topFish: "顶级鱼类（按基础价值 x 倍率）：",
      topMutations: "顶级突变（按价值倍率）：",
      price: "价格",
      luck: "幸运",
      speed: "速度",
      control: "控制",
      resilience: "韧性",
      maxKg: "最大 KG",
      baseValue: "基础价值",
      valueMultiplier: "价值倍率",
      rarity: "稀有度",
      bait: "推荐鱼饵",
      bestIslands: "推荐岛屿",
      enchantChance: "附魔概率",
      earningsMultiplier: "收益倍率",
      region: "区域",
      description: "描述",
      effect: "效果",
      relatedCharts: "相关数据图表",
      chartRodStats: "鱼竿属性图：{rod}",
      chartTopRods: "综合评分最高鱼竿",
      chartTopMutations: "价值倍率最高突变",
      chartMutationDetail: "突变详情：{mutation}",
      chartRodPowerCompare: "鱼竿强度评分对比",
      compareDbOnly: "数据库对比结果（确定性计算）：",
      compareWinner: "综合更强：{rod}",
      compareTie: "综合结果：平局",
      countRods: "数据库中共有 {count} 把鱼竿。",
      countMutations: "数据库中共有 {count} 种突变。",
      countFish: "数据库中共有 {count} 条鱼类数据。",
      countIslands: "数据库中共有 {count} 个岛屿。",
      countTotems: "数据库中共有 {count} 个图腾。",
      askRodNameHint: "请输入具体鱼竿名称，我可以直接做对比或属性拆解。",
      askMutationNameHint: "请输入具体突变名称，我可以提供详细数据。",
      noInternalContextWording: "可在数据库中查询",
      quickPromptCompare: "对比 Tryhard Rod 和 Training Rod",
      quickPromptPassive: "Mythical Rod 的被动是什么？",
      quickPromptMutation: "解释 Abyssal 突变",
      quickPromptCount: "数据库里有多少鱼竿？",
      clearChat: "清空聊天",
      chatCleared: "聊天已清空。可直接提问 Fisch 问题，或输入 /help 查看命令。",
      commandHelp: "命令：/help、/randomrod、/randommutation、/tip",
      randomRodReply:
        "随机鱼竿推荐：{rod}\n幸运 {luck}x · 速度 {speed}x\n被动：{passive}",
      randomMutationReply:
        "随机突变推荐：{mutation}\n倍率 {mult}x · 稀有度 {rarity}",
      tipReply:
        "快速建议：使用 {rod}，并优先目标高价值鱼类（例如 {fish}，基础价值 ${value}）。",
      didYouMean: "你是否想问以下内容？",
    },
    mutations: {
      badge: "突变查询",
      title: "查看突变详情",
      subtitle: "搜索突变，查看倍率、可触发鱼竿与附魔概率。",
      searchPlaceholder: "搜索突变名称...",
      loading: "加载突变数据中...",
      noMutations: "找不到突变。",
      selectHint: "请先选择一个突变。",
      mutation: "突变",
      valueMultiplier: "价值倍率",
      enchantingChance: "附魔概率",
      rodsCanFish: "可钓出此突变的鱼竿",
      noRodSources: "此突变目前没有鱼竿来源数据。",
      enchantingSources: "附魔来源",
      noEnchantingSources: "此突变目前没有附魔概率数据。",
    },
    countdowns: {
      badge: "实时倒计时",
      title: "Apex 与更新倒计时",
      subtitle: "显示所有 Apex 循环、每周更新与季节轮替倒计时。",
      apexTitle: "Apex：{name}",
      cycleInterval: "循环间隔：{hours} 小时",
      weeklyUpdate: "每周更新",
      nextSaturday: "下次周六 15:30（UTC）",
      seasonalRollover: "季节轮替",
      nextSeason: "下一季：{season}",
      days: "天",
      hours: "时",
      minutes: "分",
      seconds: "秒",
      spring: "春季",
      summer: "夏季",
      autumn: "秋季",
      winter: "冬季",
    },
    common: {
      loading: "加载中",
      skipToMain: "跳到主要内容",
      dash: "-",
    },
  },
};

const LanguageContext = createContext(null);

function resolvePath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
}

function template(str, params) {
  if (!params) return str;
  return String(str).replace(/\{(\w+)\}/g, (_, key) => (params[key] != null ? String(params[key]) : `{${key}}`));
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("fisch_lang");
      return saved === "zh" ? "zh" : "en";
    } catch {
      return "en";
    }
  });

  const value = useMemo(() => {
    const t = (key, params) => {
      const localized = resolvePath(dictionaries[lang], key);
      if (localized != null) return template(localized, params);
      const fallback = resolvePath(dictionaries.en, key);
      return template(fallback ?? key, params);
    };
    const setLanguage = (next) => {
      const valid = next === "zh" ? "zh" : "en";
      setLang(valid);
      try {
        localStorage.setItem("fisch_lang", valid);
      } catch {
        // ignore storage failures
      }
    };
    return { lang, setLanguage, t };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}


