import { useEffect, useState } from "react";
import AiChatPage from "./components/AiChatPage.jsx";
import MutationsPage from "./components/MutationsPage.jsx";
import CountdownsPage from "./components/CountdownsPage.jsx";
import { LanguageProvider, useI18n } from "./i18n.jsx";

const PAGE_BY_PATH = {
  "/": "ai-chat",
  "/ai-chat": "ai-chat",
  "/mutations": "mutations",
  "/countdowns": "countdowns",
};

const REMOVED_PATHS = new Set(["/ai-analysis", "/comparison", "/rod-comparison", "/calculator"]);

function AppContent() {
  const { lang, setLanguage, t } = useI18n();
  const [activePage, setActivePage] = useState("ai-chat");

  useEffect(() => {
    const pathname = String(window.location.pathname || "/")
      .toLowerCase()
      .replace(/\/+$/, "") || "/";
    if (REMOVED_PATHS.has(pathname)) {
      window.history.replaceState({}, "", "/ai-chat");
      setActivePage("ai-chat");
      return;
    }
    setActivePage(PAGE_BY_PATH[pathname] || "ai-chat");
  }, []);

  useEffect(() => {
    const targetPath =
      activePage === "ai-chat" ? "/ai-chat" : activePage === "mutations" ? "/mutations" : "/countdowns";
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({}, "", targetPath);
    }
  }, [activePage]);

  return (
    <div className="relative min-h-screen flex flex-col fisch-bg-grid">
      <a
        href="#main-content"
        className="absolute left-0 top-0 z-[100] -translate-y-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-3 focus:outline-none focus:ring-2 focus:ring-cyan-300"
      >
        {t("common.skipToMain")}
      </a>

      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 shadow-glow-sm"
              aria-hidden
            >
              <span className="font-mono text-lg font-bold tracking-tight text-cyan-200">F</span>
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold tracking-tight text-slate-50 sm:text-xl">
                {t("app.title")}
              </div>
              <p className="mt-0.5 text-sm text-slate-400">
                {t("app.subtitle")}
              </p>
            </div>
          </div>

          <div className="w-full lg:max-w-2xl">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setActivePage("ai-chat")}
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    activePage === "ai-chat"
                      ? "bg-cyan-500/20 text-cyan-100 border border-cyan-500/40"
                      : "bg-slate-900/40 text-slate-300 border border-slate-700/70 hover:border-slate-600"
                  }`}
                >
                  {t("app.navAiChat")}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePage("mutations")}
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    activePage === "mutations"
                      ? "bg-fuchsia-500/20 text-fuchsia-100 border border-fuchsia-500/40"
                      : "bg-slate-900/40 text-slate-300 border border-slate-700/70 hover:border-slate-600"
                  }`}
                >
                  {t("app.navMutations")}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePage("countdowns")}
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    activePage === "countdowns"
                      ? "bg-emerald-500/20 text-emerald-100 border border-emerald-500/40"
                      : "bg-slate-900/40 text-slate-300 border border-slate-700/70 hover:border-slate-600"
                  }`}
                >
                  {t("app.navCountdowns")}
                </button>
              </div>
            </div>
            <div className="mt-2 rounded-xl border border-slate-800/80 bg-slate-900/30 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">{t("app.language")}</div>
                <div className="inline-flex rounded-lg border border-slate-700/80 bg-slate-950/50 p-1">
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                      lang === "en" ? "bg-cyan-500/20 text-cyan-100" : "text-slate-300 hover:text-slate-100"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("zh")}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                      lang === "zh" ? "bg-cyan-500/20 text-cyan-100" : "text-slate-300 hover:text-slate-100"
                    }`}
                  >
                    中文
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 pb-10 pt-2 md:pb-32">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-8">
          {activePage === "ai-chat" ? (
            <AiChatPage />
          ) : activePage === "mutations" ? (
            <MutationsPage />
          ) : (
            <CountdownsPage />
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
