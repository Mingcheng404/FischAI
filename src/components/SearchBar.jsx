import { useEffect, useMemo, useState } from "react";

function rarityStyle(tier) {
  const t = (tier || "").toLowerCase();
  if (t.includes("myth")) return "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200";
  if (t.includes("rare")) return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
  if (t.includes("uncommon")) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  return "border-slate-500/30 bg-slate-700/10 text-slate-200";
}

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
      />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M5.5 7.5L10 12l4.5-4.5H5.5z" />
    </svg>
  );
}

export default function SearchBar({ selectedMutation, onMutationSelect }) {
  const [query, setQuery] = useState("");
  const [mutations, setMutations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listOpen, setListOpen] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setListOpen(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadMutations = () =>
      fetch("/mutations.json")
        .then((r) => r.json())
        .then((json) => {
          const list = Array.isArray(json?.mutations) ? json.mutations : [];
          if (list.length > 0) return list;
          return null;
        });

    loadMutations()
      .then((list) => {
        if (list) return list;
        return fetch("/data.json")
          .then((r) => r.json())
          .then((json) => (Array.isArray(json?.mutations) ? json.mutations : []));
      })
      .then((list) => {
        if (cancelled) return;
        setMutations(Array.isArray(list) ? list : []);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load mutations");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = mutations || [];
    if (!q) return list;
    return list.filter((m) => (m?.name || "").toLowerCase().includes(q));
  }, [mutations, query]);

  const mutationSummary = selectedMutation
    ? `${selectedMutation.name} · ${Number(selectedMutation.value_multiplier).toFixed(2)}×`
    : "No mutation (1.00×)";

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mutation</div>
            <p className="mt-0.5 truncate text-sm text-slate-200" title={mutationSummary}>
              {mutationSummary}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-xl border border-slate-700/90 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-500/35 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
            onClick={() => onMutationSelect(null)}
          >
            Clear
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <div className="relative flex-1">
            <label htmlFor="mutation-search" className="sr-only">
              Search mutations
            </label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="mutation-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              autoComplete="off"
              className="fisch-input w-full pl-10 pr-14 text-sm"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
              >
                Reset
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700/90 bg-slate-950/50 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
            onClick={() => setListOpen((o) => !o)}
            aria-expanded={listOpen}
          >
            <span>{listOpen ? "Hide list" : "Browse list"}</span>
            <ChevronIcon open={listOpen} />
          </button>
        </div>
      </div>

      <div
        className={`mt-3 overflow-hidden rounded-2xl border bg-slate-900/45 backdrop-blur-sm transition-[max-height,opacity,border-color] duration-200 ${
          listOpen
            ? "max-h-[min(18rem,50vh)] border-slate-800/80 opacity-100"
            : "max-h-0 border-transparent opacity-0 lg:max-h-72 lg:border-slate-800/80 lg:opacity-100"
        }`}
      >
        <div className="max-h-[min(18rem,50vh)] overflow-y-auto p-3 lg:max-h-72">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading mutations…</div>
          ) : null}
          {error ? <div className="text-sm text-rose-300">{error}</div> : null}
          {!loading && !error && filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">No mutations match your search.</div>
          ) : null}

          {!loading && !error ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filtered.map((m) => {
                const selected = selectedMutation?.name === m?.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => onMutationSelect(m)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                      selected
                        ? "border-emerald-500/55 bg-emerald-500/15 text-emerald-100 shadow-glow-sm ring-1 ring-emerald-500/20"
                        : `border-slate-800/90 ${rarityStyle(m.rarity_tier)} hover:brightness-110`
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 text-xs font-semibold leading-snug">{m.name}</div>
                      <div className="shrink-0 font-mono text-xs font-bold tabular-nums">
                        {Number(m.value_multiplier).toFixed(2)}×
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] opacity-85">{m.rarity_tier}</div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
