import { useState, useEffect } from "react";
import { TypeQuiz } from "./components/TypeQuiz";
import { SelectionQuiz } from "./components/SelectionQuiz";
import { TeamVisualizer } from "./components/TeamVisualizer";
import { ConsistencyQuiz } from "./components/ConsistencyQuiz";
import { WeaknessAnalysis } from "./components/WeaknessAnalysis";
import { Colophon } from "./components/Colophon";

type ActiveTab = "type-quiz" | "selection-quiz" | "consistency-quiz" | "visualizer" | "weakness-analysis" | "colophon";

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("type-quiz");
  const [apiOnline, setApiOnline] = useState<boolean>(navigator.onLine);
  const [cachedCount, setCachedCount] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [isShortScreen, setIsShortScreen] = useState<boolean>(window.innerHeight < 800 || window.innerWidth < 768);

  // オンラインステータスと画面リサイズの監視
  useEffect(() => {
    const handleOnline = () => setApiOnline(true);
    const handleOffline = () => setApiOnline(false);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsShortScreen(window.innerHeight < 800 || window.innerWidth < 768);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("resize", handleResize);

    // キャッシュされたポケモン数をカウント
    const updateCacheCount = () => {
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("poke-learn-cache-")) {
          count++;
        }
      }
      setCachedCount(count);
    };

    updateCacheCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isMobile ? "6px" : (isShortScreen ? "8px 12px" : "12px 16px"), display: "flex", flexDirection: "column", gap: isMobile ? "4px" : (isShortScreen ? "6px" : "12px"), minHeight: "100dvh", height: "auto", overflow: "visible", boxSizing: "border-box" }}>
      
      {/* プレミアムダッシュボードヘッダー */}
      <header
        className="glass-panel glow-card"
        style={{
          padding: isShortScreen ? "4px 12px" : "8px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: isShortScreen ? "4px" : "12px"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: isMobile ? "1.1rem" : (isShortScreen ? "1.2rem" : "1.4rem"), fontWeight: 900, background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              POKE-LEARN
            </span>
            <span
              onClick={() => setActiveTab("colophon")}
              style={{
                fontSize: "0.55rem",
                fontWeight: 700,
                color: "var(--accent-cyan)",
                border: "1px solid var(--accent-cyan)",
                padding: "0.5px 5px",
                borderRadius: "20px",
                boxShadow: "0 0 4px var(--accent-cyan-glow)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(6, 182, 212, 0.15)";
                e.currentTarget.style.boxShadow = "0 0 10px var(--accent-cyan-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.boxShadow = "0 0 4px var(--accent-cyan-glow)";
              }}
            >
              2026-06-15
            </span>
          </div>
          {!isMobile && !isShortScreen && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              ポケモンの複雑なタイプ相性・実戦選出を体系的に習得する近未来的学習システム
            </p>
          )}
        </div>

        {/* API・オンラインインジケータ */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.75rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              データ同期:{" "}
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: apiOnline ? "var(--success)" : "var(--warning)",
                boxShadow: apiOnline ? "0 0 6px var(--success)" : "0 0 6px var(--warning)"
              }} />
              <span style={{ color: apiOnline ? "var(--success)" : "var(--warning)" }}>
                {apiOnline ? "PokeAPI" : "オフライン"}
              </span>
            </span>
            {!isMobile && !isShortScreen && (
              <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
                キャッシュ済: <strong>{cachedCount}</strong> 体
              </span>
            )}
          </div>
        </div>
      </header>

      {/* メインタブナビゲーション */}
      <nav className="tab-container" style={{ padding: "2px", display: "flex", flexWrap: isMobile ? "nowrap" : "wrap", overflowX: isMobile ? "auto" : "visible", gap: isShortScreen ? "2px" : "4px", width: "100%", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        <style>{`.tab-container::-webkit-scrollbar { display: none; }`}</style>
        <button
          onClick={() => setActiveTab("type-quiz")}
          className={`tab-btn ${activeTab === "type-quiz" ? "active" : ""}`}
          style={{ padding: isMobile ? "4px 8px" : (isShortScreen ? "4px 8px" : "6px 12px"), fontSize: "0.8rem", flexShrink: 0 }}
        >
          <span className="mobile-only">🎯 相性</span>
          <span className="desktop-only">🎯 タイプ相性</span>
        </button>
        <button
          onClick={() => setActiveTab("selection-quiz")}
          className={`tab-btn ${activeTab === "selection-quiz" ? "active" : ""}`}
          style={{ padding: isMobile ? "4px 8px" : (isShortScreen ? "4px 8px" : "6px 12px"), fontSize: "0.8rem", flexShrink: 0 }}
        >
          <span className="mobile-only">⚔️ 選出</span>
          <span className="desktop-only">⚔️ 6vs6 選出</span>
        </button>
        <button
          onClick={() => setActiveTab("consistency-quiz")}
          className={`tab-btn ${activeTab === "consistency-quiz" ? "active" : ""}`}
          style={{ padding: isMobile ? "4px 8px" : (isShortScreen ? "4px 8px" : "6px 12px"), fontSize: "0.8rem", flexShrink: 0 }}
        >
          <span>🔥 一貫技</span>
        </button>
        <button
          onClick={() => setActiveTab("visualizer")}
          className={`tab-btn ${activeTab === "visualizer" ? "active" : ""}`}
          style={{ padding: isMobile ? "4px 8px" : (isShortScreen ? "4px 8px" : "6px 12px"), fontSize: "0.8rem", flexShrink: 0 }}
        >
          <span className="mobile-only">🌐 可視化</span>
          <span className="desktop-only">🌐 相性可視化</span>
        </button>
        <button
          onClick={() => setActiveTab("weakness-analysis")}
          className={`tab-btn ${activeTab === "weakness-analysis" ? "active" : ""}`}
          style={{ padding: isMobile ? "4px 8px" : (isShortScreen ? "4px 8px" : "6px 12px"), fontSize: "0.8rem", flexShrink: 0 }}
        >
          <span className="mobile-only">📊 分析・特訓</span>
          <span className="desktop-only">📊 苦手分析＆特訓</span>
        </button>
      </nav>

      {/* アクティブコンテンツのレンダリング */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {activeTab === "type-quiz" && <TypeQuiz />}
        {activeTab === "selection-quiz" && <SelectionQuiz />}
        {activeTab === "consistency-quiz" && <ConsistencyQuiz />}
        {activeTab === "visualizer" && <TeamVisualizer />}
        {activeTab === "weakness-analysis" && <WeaknessAnalysis />}
        {activeTab === "colophon" && <Colophon />}
      </main>
    </div>
  );
}

export default App;
