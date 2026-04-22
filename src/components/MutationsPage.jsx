import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n.jsx";

function formatPercent(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n)}%`;
}

function formatMultiplier(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}x`;
}

export default function MutationsPage() {
  const { t } = useI18n();
  const [mutations, setMutations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${import.meta.env.BASE_URL}mutations.json`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const list = Array.isArray(json?.mutations) ? json.mutations : [];
        setMutations(list);
        setSelectedName((prev) => prev || list[0]?.name || "");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setMutations([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mutations;
    return mutations.filter((m) => String(m?.name || "").toLowerCase().includes(q));
  }, [mutations, query]);

  const selected = useMemo(() => {
    const inFiltered = filtered.find((m) => m.name === selectedName);
    if (inFiltered) return inFiltered;
    return filtered[0] || null;
  }, [filtered, selectedName]);

  return (
    <section className="fisch-panel p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-fuchsia-200">
            {t("mutations.badge")}
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-50 md:text-2xl">{t("mutations.title")}</h2>
          <p className="mt-1 text-sm text-slate-400">{t("mutations.subtitle")}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/30 p-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("mutations.searchPlaceholder")}
            className="fisch-input w-full text-sm"
          />

          <div className="mt-3 max-h-[28rem] overflow-y-auto space-y-2 pr-1">
            {loading ? <div className="text-sm text-slate-400">{t("mutations.loading")}</div> : null}
            {!loading && filtered.length === 0 ? <div className="text-sm text-slate-400">{t("mutations.noMutations")}</div> : null}
            {!loading
              ? filtered.slice(0, 300).map((m) => {
                  const active = selected?.name === m.name;
                  return (
                    <button
                      key={`${m.name}-${m.value_multiplier}`}
                      type="button"
                      onClick={() => setSelectedName(m.name)}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                        active
                          ? "border-fuchsia-500/55 bg-fuchsia-500/15 text-fuchsia-100"
                          : "border-slate-800 bg-slate-900/40 text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{m.name}</span>
                        <span className="font-mono text-xs">{formatMultiplier(m.value_multiplier)}</span>
                      </div>
                    </button>
                  );
                })
              : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/30 p-4">
          {!selected ? (
            <div className="text-sm text-slate-400">{t("mutations.selectHint")}</div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500">{t("mutations.mutation")}</div>
                <div className="mt-1 text-xl font-semibold text-slate-100">{selected.name}</div>
                <div className="mt-1 text-sm text-slate-400">
                  {t("mutations.valueMultiplier")}: <span className="font-mono text-slate-200">{formatMultiplier(selected.value_multiplier)}</span>
                </div>
                <div className="text-sm text-slate-400">
                  {t("mutations.enchantingChance")}:{" "}
                  <span className="font-mono text-slate-200">{selected.enchanting_percent ? formatPercent(selected.enchanting_percent) : "—"}</span>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500">{t("mutations.rodsCanFish")}</div>
                <div className="mt-2 space-y-2">
                  {Array.isArray(selected.rod_sources) && selected.rod_sources.length > 0 ? (
                    selected.rod_sources.map((r) => (
                      <div key={`${r.rod}-${r.chance_percent}-${r.note || ""}`} className="rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-slate-200">{r.rod}</span>
                          <span className="font-mono text-xs text-cyan-200">{formatPercent(r.chance_percent)}</span>
                        </div>
                        {r.note ? <div className="mt-1 text-[11px] text-slate-500">{r.note}</div> : null}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400">{t("mutations.noRodSources")}</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500">{t("mutations.enchantingSources")}</div>
                <div className="mt-2 space-y-2">
                  {Array.isArray(selected.enchanting_sources) && selected.enchanting_sources.length > 0 ? (
                    selected.enchanting_sources.map((e) => (
                      <div key={`${e.enchantment}-${e.chance_percent}`} className="rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-2 text-sm text-slate-200">
                        {e.enchantment} · <span className="font-mono text-cyan-200">{formatPercent(e.chance_percent)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400">{t("mutations.noEnchantingSources")}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
