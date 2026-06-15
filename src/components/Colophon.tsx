import React from "react";

export const Colophon: React.FC = () => {
  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", flex: 1 }}>
      
      {/* ヘッダーパネル */}
      <div className="glass-panel" style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            奥付 / Colophon
          </h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            POKE-LEARN システム情報および開発履歴
          </p>
        </div>
      </div>

      {/* メイングリッド */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "16px",
        flex: 1,
        width: "100%"
      }}>
        
        {/* COPYRIGHT.md の内容を表示 */}
        <div className="glass-panel glow-card animate-pop-in" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", background: "rgba(18, 20, 32, 0.4)", border: "1px solid var(--border-glass)" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--accent-cyan)", borderBottom: "1px solid var(--border-glass)", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>©️</span> COPYRIGHT
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, justifyContent: "center" }}>
            
            {/* GitHubリンク */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>GitHub Repository</span>
              <a 
                href="https://github.com/mokusatsu/poke-learn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: "8px", 
                  padding: "10px 16px", 
                  textDecoration: "none", 
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))",
                  border: "1px solid var(--accent-cyan)",
                  color: "#ffffff",
                  boxShadow: "0 0 10px rgba(6, 182, 212, 0.15)",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(6, 182, 212, 0.3)";
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(6, 182, 212, 0.35), rgba(139, 92, 246, 0.35))";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 0 10px rgba(6, 182, 212, 0.15)";
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))";
                }}
              >
                <span>🌐</span> mokusatsu / poke-learn
              </a>
            </div>

            {/* 制作者名 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Creator</span>
              <div style={{ 
                fontSize: "1.1rem", 
                fontWeight: 800, 
                color: "#ffffff", 
                padding: "8px 12px", 
                borderRadius: "8px", 
                backgroundColor: "rgba(255,255,255,0.03)", 
                border: "1px solid rgba(255,255,255,0.03)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
              }}>
                Keiji Okamoto
              </div>
            </div>

            {/* AIエージェント名 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Development Partner</span>
              <div style={{ 
                fontSize: "1.1rem", 
                fontWeight: 800, 
                color: "var(--accent-violet)", 
                padding: "8px 12px", 
                borderRadius: "8px", 
                backgroundColor: "rgba(139, 92, 246, 0.05)", 
                border: "1px solid rgba(139, 92, 246, 0.15)",
                boxShadow: "0 0 8px rgba(139, 92, 246, 0.1)"
              }}>
                🤖 Antigravity
              </div>
            </div>

          </div>
        </div>

        {/* HISTORY.md の内容を表示 */}
        <div className="glass-panel glow-card animate-pop-in" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", background: "rgba(18, 20, 32, 0.4)", border: "1px solid var(--border-glass)", animationDelay: "0.1s" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--accent-violet)", borderBottom: "1px solid var(--border-glass)", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>⏳</span> HISTORY
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingLeft: "8px", position: "relative", flex: 1, justifyContent: "center" }}>
            
            {/* タイムラインの縦線 */}
            <div style={{
              position: "absolute",
              left: "4px",
              top: "16px",
              bottom: "16px",
              width: "2px",
              background: "linear-gradient(to bottom, var(--accent-violet), rgba(139, 92, 246, 0.1))"
            }} />

            {/* タイムラインアイテム 1 */}
            <div style={{ position: "relative", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {/* ドット */}
              <div style={{
                position: "absolute",
                left: "1px",
                top: "6px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-violet)",
                boxShadow: "0 0 8px var(--accent-violet)"
              }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ffffff" }}>2026-06-15</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                スマホレイアウト調整、文言調整
              </span>
            </div>

            {/* タイムラインアイテム 2 */}
            <div style={{ position: "relative", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {/* ドット */}
              <div style={{
                position: "absolute",
                left: "1px",
                top: "6px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "rgba(139, 92, 246, 0.5)",
                boxShadow: "0 0 4px rgba(139, 92, 246, 0.3)"
              }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-secondary)" }}>2026-06-14</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                初版
              </span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
