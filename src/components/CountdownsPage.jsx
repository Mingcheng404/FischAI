import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n.jsx";

const APEX_TYPES = [
  { id: "mosslurker", name: "Mosslurker / Apex Leviathan", intervalHours: 4 },
  { id: "narwhal", name: "Narwhal / Beluga / Magician Narwhal", intervalHours: 3 },
  { id: "dreadfin", name: "Dreadfin", intervalHours: 3.5 },
];

const WEEKLY_UPDATE_UTC = { day: 6, hour: 15, minute: 30, second: 0 };
const SEASON_KEYS = ["countdowns.spring", "countdowns.summer", "countdowns.autumn", "countdowns.winter"];
const SEASON_LEN_MS = 576 * 60 * 1000;

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function msParts(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function CountdownCard({ title, subtitle, remainingMs, accent = "cyan", t }) {
  const p = msParts(remainingMs);
  const tone =
    accent === "fuchsia"
      ? "from-fuchsia-500/20 to-cyan-500/10 border-fuchsia-500/20"
      : accent === "emerald"
      ? "from-emerald-500/20 to-cyan-500/10 border-emerald-500/20"
      : "from-cyan-500/20 to-emerald-500/10 border-cyan-500/20";

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${tone} p-4 md:p-5`}>
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <div className="rounded-xl border border-slate-700/70 bg-slate-950/45 px-2 py-2.5">
          <div className="font-mono text-lg font-semibold text-slate-100 tabular-nums">{pad2(p.days)}</div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">{t("countdowns.days")}</div>
        </div>
        <div className="rounded-xl border border-slate-700/70 bg-slate-950/45 px-2 py-2.5">
          <div className="font-mono text-lg font-semibold text-slate-100 tabular-nums">{pad2(p.hours)}</div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">{t("countdowns.hours")}</div>
        </div>
        <div className="rounded-xl border border-slate-700/70 bg-slate-950/45 px-2 py-2.5">
          <div className="font-mono text-lg font-semibold text-slate-100 tabular-nums">{pad2(p.minutes)}</div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">{t("countdowns.minutes")}</div>
        </div>
        <div className="rounded-xl border border-slate-700/70 bg-slate-950/45 px-2 py-2.5">
          <div className="font-mono text-lg font-semibold text-slate-100 tabular-nums">{pad2(p.seconds)}</div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">{t("countdowns.seconds")}</div>
        </div>
      </div>
    </div>
  );
}

function nextWeeklyUpdateMs(now) {
  const d = new Date(now);
  const nowDay = d.getUTCDay();
  const target = new Date(now);
  const daysAhead = (WEEKLY_UPDATE_UTC.day - nowDay + 7) % 7;
  target.setUTCDate(d.getUTCDate() + daysAhead);
  target.setUTCHours(
    WEEKLY_UPDATE_UTC.hour,
    WEEKLY_UPDATE_UTC.minute,
    WEEKLY_UPDATE_UTC.second,
    0
  );
  if (target.getTime() <= now) target.setUTCDate(target.getUTCDate() + 7);
  return target.getTime() - now;
}

function nextSeasonBoundaryMs(now, t) {
  const elapsedInSeason = now % SEASON_LEN_MS;
  const ms = elapsedInSeason === 0 ? SEASON_LEN_MS : SEASON_LEN_MS - elapsedInSeason;
  const seasonIndex = Math.floor(now / SEASON_LEN_MS) % 4;
  const nextSeasonName = t(SEASON_KEYS[(seasonIndex + 1) % 4]);
  return { ms, seasonName: nextSeasonName };
}

function nextApexCycleMs(now, intervalHours) {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  const elapsedInCycle = now % intervalMs;
  return intervalMs - elapsedInCycle;
}

export default function CountdownsPage() {
  const { t } = useI18n();
  const now = useNow();
  const weeklyMs = useMemo(() => nextWeeklyUpdateMs(now), [now]);
  const season = useMemo(() => nextSeasonBoundaryMs(now, t), [now, t]);

  return (
    <section className="fisch-panel p-5 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-fuchsia-200/90">
            {t("countdowns.badge")}
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-50 md:text-2xl">
            {t("countdowns.title")}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {t("countdowns.subtitle")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {APEX_TYPES.map((apexType) => (
          <CountdownCard
            key={apexType.id}
            title={t("countdowns.apexTitle", { name: apexType.name })}
            subtitle={t("countdowns.cycleInterval", { hours: apexType.intervalHours })}
            remainingMs={nextApexCycleMs(now, apexType.intervalHours)}
            accent="fuchsia"
            t={t}
          />
        ))}
        <CountdownCard
          title={t("countdowns.weeklyUpdate")}
          subtitle={t("countdowns.nextSaturday")}
          remainingMs={weeklyMs}
          accent="cyan"
          t={t}
        />
        <CountdownCard
          title={t("countdowns.seasonalRollover")}
          subtitle={t("countdowns.nextSeason", { season: season.seasonName })}
          remainingMs={season.ms}
          accent="emerald"
          t={t}
        />
      </div>
    </section>
  );
}

