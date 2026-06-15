import React, { useState, useEffect } from "react";
import type { PokemonData } from "../data/localPokemons";
import { generateRandomTeam } from "../utils/pokemonApi";
import { getEffectiveness, TYPE_DETAILS } from "../utils/typeMatrix";
import type { PokemonType } from "../utils/typeMatrix";
import { TypeBadge } from "./TypeBadge";

export const TeamVisualizer: React.FC = () => {
  const [userTeam, setUserTeam] = useState<PokemonData[]>([]);
  const [oppTeam, setOppTeam] = useState<PokemonData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  // リフレッシュやリサイズなどのハンドラー
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ホバー状態管理
  // user-idx: 味方ホバー, opp-idx: 相手ホバー
  const [hoveredUserIdx, setHoveredUserIdx] = useState<number | null>(null);
  const [hoveredOppIdx, setHoveredOppIdx] = useState<number | null>(null);

  // カードタップ（トグル）ハンドラー
  const handleCardClick = (side: "user" | "opp", index: number) => {
    if (side === "user") {
      if (hoveredUserIdx === index) {
        setHoveredUserIdx(null);
      } else {
        setHoveredUserIdx(index);
        setHoveredOppIdx(null); // 反対側はクリア
      }
    } else {
      if (hoveredOppIdx === index) {
        setHoveredOppIdx(null);
      } else {
        setHoveredOppIdx(index);
        setHoveredUserIdx(null); // 反対側はクリア
      }
    }
  };

  // 外側タップで選択解除するハンドラー
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".pokemon-card") && !target.closest(".btn-primary")) {
      setHoveredUserIdx(null);
      setHoveredOppIdx(null);
    }
  };

  // 新規チーム作成
  const loadTeams = async () => {
    setLoading(true);
    try {
      const draft = await generateRandomTeam(12);
      setUserTeam(draft.slice(0, 6));
      setOppTeam(draft.slice(6, 12));
      setHoveredUserIdx(null);
      setHoveredOppIdx(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  // レイアウト設定
  const CARD_HEIGHT = isMobile ? 54 : 70;
  const CARD_WIDTH = isMobile ? 46 : 260;
  const CARD_GAP = isMobile ? 8 : 8;
  const TOTAL_HEIGHT = isMobile ? 140 : (6 * CARD_HEIGHT + 5 * CARD_GAP);
  const SVG_WIDTH = isMobile ? 320 : 280;

  // ベジェ曲線のパスを生成
  const calculatePath = (idx1: number, idx2: number): string => {
    if (isMobile) {
      // 上から下へのベジェ曲線
      const x1 = idx1 * (46 + 8) + 25; // 味方の中心X座標
      const x2 = idx2 * (46 + 8) + 25; // 相手の中心X座標
      const y1 = 0;
      const y2 = TOTAL_HEIGHT;
      const controlOffset = TOTAL_HEIGHT / 2;
      return `M ${x1} ${y1} C ${x1} ${controlOffset}, ${x2} ${TOTAL_HEIGHT - controlOffset}, ${x2} ${y2}`;
    } else {
      // 左から右へのベジェ曲線
      const y1 = idx1 * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
      let y2 = idx2 * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
      if (y1 === y2) {
        y2 += 0.01;
      }
      const x1 = 0;
      const x2 = SVG_WIDTH;
      const controlOffset = SVG_WIDTH / 2;
      return `M ${x1} ${y1} C ${controlOffset} ${y1}, ${SVG_WIDTH - controlOffset} ${y2}, ${x2} ${y2}`;
    }
  };

  // 倍率に応じたカラー & テキストを取得
  const getMultiplierStyle = (mult: number) => {
    if (mult === 4.0) return { color: "#F59E0B", glow: "rgba(245, 158, 11, 0.4)", label: "4x ばつぐん", shortLabel: "4x" };
    if (mult === 2.0) return { color: "#10B981", glow: "rgba(16, 185, 129, 0.4)", label: "2x ばつぐん", shortLabel: "2x" };
    if (mult === 0.5) return { color: "#3B82F6", glow: "rgba(59, 130, 246, 0.3)", label: "0.5x いまひとつ", shortLabel: "0.5x" };
    if (mult === 0.25) return { color: "#6366F1", glow: "rgba(99, 102, 241, 0.3)", label: "0.25x いまひとつ", shortLabel: "0.25x" };
    if (mult === 0.0) return { color: "#EF4444", glow: "rgba(239, 68, 68, 0.4)", label: "こうかなし", shortLabel: "0x" };
    return { color: "#9CA3AF", glow: "transparent", label: "1x 等倍", shortLabel: "1x" };
  };

  // 倍率に応じた線のスタイル (太さと線種) を取得
  const getLineStyles = (mult: number) => {
    if (mult === 4.0) return { strokeWidth: "1.6em", glowWidth: "2.4em", flowWidth: "0.64em", strokeDasharray: "none" };
    if (mult === 2.0) return { strokeWidth: "0.8em", glowWidth: "1.2em", flowWidth: "0.32em", strokeDasharray: "none" };
    if (mult === 0.5) return { strokeWidth: "0.2em", glowWidth: "0.3em", flowWidth: "0.08em", strokeDasharray: "4 4" };
    if (mult === 0.25) return { strokeWidth: "0.1em", glowWidth: "0.15em", flowWidth: "0.04em", strokeDasharray: "2 2" };
    if (mult === 0.0) return { strokeWidth: "0.05em", glowWidth: "0.075em", flowWidth: "0.02em", strokeDasharray: "1 2" }; // 0倍は細い点線
    return { strokeWidth: "0.4em", glowWidth: "0.6em", flowWidth: "0.16em", strokeDasharray: "none" }; // 1.0倍等倍
  };

  return (
    <div 
      className="animate-fade-in" 
      onClick={handleContainerClick}
      style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}
    >
      
      {/* 操作パネル */}
      <div className="glass-panel" style={{ padding: isMobile ? "4px 8px" : "6px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "nowrap", gap: "8px" }}>
        <div>
          <h2 style={{ fontSize: isMobile ? "0.85rem" : "1rem", fontWeight: 800 }}>{isMobile ? "6vs6 可視化" : "6vs6 相性関係ビジュアライザ"}</h2>
          {!isMobile && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              お互いのポケモンにマウスカーソルを合わせると、タイプ一致技の攻撃ルートとダメージ倍率が流線表示されます。
            </p>
          )}
        </div>
        <button onClick={loadTeams} className="btn-primary" style={{ padding: isMobile ? "6px 10px" : "8px 16px", fontSize: isMobile ? "0.75rem" : "0.8rem", flexShrink: 0 }}>
          チームを再編成する
        </button>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", flex: 1 }}>
          <div style={{
            width: "36px",
            height: "36px",
            border: "3px solid rgba(255, 255, 255, 0.1)",
            borderTop: "3px solid var(--accent-cyan)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>相性フロー解析中...</span>
        </div>
      ) : (
        <div
          className="glass-panel glow-card"
          style={{
            padding: isMobile ? "16px 8px" : "12px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflowX: "hidden",
            maxWidth: "100%",
            flex: 1
          }}
        >
          <div style={{ 
            display: "flex", 
            flexDirection: isMobile ? "column" : "row", 
            alignItems: "center", 
            position: "relative", 
            minWidth: isMobile ? "320px" : "860px" 
          }}>
            
            {/* 上カラム (スマホ) / 左カラム (PC): 味方チーム (6体) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: isMobile ? "320px" : "auto" }}>
              {isMobile ? (
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--success)", marginBottom: "4px" }}>
                  🟢 味方パーティ (タップして選択)
                </div>
              ) : null}
              
              <div style={{ 
                display: "flex", 
                flexDirection: isMobile ? "row" : "column", 
                gap: `${CARD_GAP}px`, 
                width: isMobile ? "320px" : "260px",
                justifyContent: isMobile ? "center" : "flex-start",
                padding: isMobile ? "0 2px" : "0"
              }}>
                {!isMobile && (
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--success)", textAlign: "center", marginBottom: "4px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "4px", whiteSpace: "nowrap", overflow: "hidden" }}>
                    🟢 味方パーティ (攻撃側ホバー)
                  </div>
                )}
                {userTeam.map((poke, index) => {
                  const isHovered = hoveredUserIdx === index;
                  const isAnyHovered = hoveredUserIdx !== null || hoveredOppIdx !== null;
                  const isDimmed = isAnyHovered && !isHovered && hoveredOppIdx === null;

                  return (
                    <div
                      key={`visual-user-${index}`}
                      className="pokemon-card"
                      onClick={() => handleCardClick("user", index)}
                      onMouseEnter={() => { if (!isMobile) setHoveredUserIdx(index); }}
                      onMouseLeave={() => { if (!isMobile) setHoveredUserIdx(null); }}
                      style={{
                        height: `${CARD_HEIGHT}px`,
                        width: isMobile ? `${CARD_WIDTH}px` : "auto",
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: isMobile ? "0px" : "6px",
                        padding: isMobile ? "2px" : "6px 10px",
                        borderRadius: "8px",
                        background: isHovered ? "rgba(255,255,255,0.06)" : "rgba(18,20,32,0.4)",
                        border: `1px solid ${isHovered ? "var(--success)" : "var(--border-glass)"}`,
                        transition: "all 0.2s ease",
                        transform: isHovered 
                          ? (isMobile ? "translateY(2px)" : "translateX(6px)") 
                          : "translateY(0)",
                        opacity: isDimmed ? 0.35 : 1,
                        cursor: "pointer",
                        boxShadow: isHovered ? "0 4px 15px rgba(16,185,129,0.15)" : "none",
                      }}
                    >
                      <img 
                        src={poke.sprite} 
                        alt={poke.nameJa} 
                        style={{ 
                          width: isMobile ? "28px" : "40px", 
                          height: isMobile ? "28px" : "40px", 
                          objectFit: "contain" 
                        }} 
                      />
                      {isMobile ? (
                        <div style={{ display: "flex", gap: "2px", justifyContent: "center", marginTop: "2px" }}>
                          {poke.types.map(t => (
                            <span
                              key={t}
                              style={{
                                display: "inline-block",
                                width: "14px",
                                height: "14px",
                                borderRadius: "50%",
                                backgroundColor: TYPE_DETAILS[t].color,
                                color: TYPE_DETAILS[t].textColor,
                                fontSize: "0.5rem",
                                fontWeight: "bold",
                                lineHeight: "14px",
                                textAlign: "center",
                                boxShadow: `0 0 4px ${TYPE_DETAILS[t].glowColor}`,
                              }}
                            >
                              {TYPE_DETAILS[t].ja.substring(0, 1)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden", flex: 1 }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{poke.nameJa}</span>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {poke.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SVG 接続線領域 */}
            <div style={{ width: `${SVG_WIDTH}px`, height: `${TOTAL_HEIGHT}px`, position: "relative" }}>
              <svg width={SVG_WIDTH} height={TOTAL_HEIGHT} style={{ pointerEvents: "none", overflow: "visible" }}>
                
                {/* 相性ライン描画 */}
                {userTeam.map((userPoke, uIdx) => 
                  oppTeam.map((oppPoke, oIdx) => {
                    const isOpponentAttacking = hoveredOppIdx !== null;
                    const attacker = isOpponentAttacking ? oppPoke : userPoke;
                    const defender = isOpponentAttacking ? userPoke : oppPoke;

                    let maxEffectiveness = 0;
                    let bestAtkType: PokemonType = attacker.types[0];

                    attacker.types.forEach(atkType => {
                      const eff = getEffectiveness(atkType, defender.types);
                      if (eff > maxEffectiveness) {
                        maxEffectiveness = eff;
                        bestAtkType = atkType;
                      }
                    });

                    const isLineHighlighted = 
                      (hoveredUserIdx === uIdx) || 
                      (hoveredOppIdx === oIdx);
                    
                    const isAnyHovered = hoveredUserIdx !== null || hoveredOppIdx !== null;
                    const isLineDimmed = isAnyHovered && !isLineHighlighted;

                    const shouldRenderLine = isLineHighlighted || !isAnyHovered;
                    
                    if (!shouldRenderLine) return null;

                    const lineColor = TYPE_DETAILS[bestAtkType].color;
                    const lineStyle = getLineStyles(maxEffectiveness);
                    
                    return (
                      <g key={`flow-${uIdx}-${oIdx}`}>
                        {isLineHighlighted && (
                          <path
                            d={calculatePath(uIdx, oIdx)}
                            stroke={lineColor}
                            strokeWidth={lineStyle.glowWidth}
                            fill="none"
                            opacity="0.3"
                            style={{ filter: "blur(4px)" }}
                          />
                        )}

                        <path
                          d={calculatePath(uIdx, oIdx)}
                          stroke={lineColor}
                          strokeWidth={lineStyle.strokeWidth}
                          strokeDasharray={lineStyle.strokeDasharray}
                          fill="none"
                          className={`link-path ${isLineHighlighted ? "highlighted" : ""} ${isLineDimmed ? "dimmed" : ""}`}
                          style={{
                            color: lineColor,
                          }}
                        />

                        {isLineHighlighted && (
                          <path
                            d={calculatePath(uIdx, oIdx)}
                            stroke="#ffffff"
                            strokeWidth={lineStyle.flowWidth}
                            strokeDasharray="5 15"
                            fill="none"
                            className={isOpponentAttacking ? "flow-anim-reverse" : "flow-anim"}
                            opacity="0.7"
                          />
                        )}
                      </g>
                    );
                  })
                )}
              </svg>

              {/* フロー上の中央倍率チップ描画 */}
              {userTeam.map((userPoke, uIdx) => 
                oppTeam.map((oppPoke, oIdx) => {
                  const isLineHighlighted = 
                    (hoveredUserIdx === uIdx) || 
                    (hoveredOppIdx === oIdx);
                  
                  if (!isLineHighlighted) return null;

                  const isOpponentAttacking = hoveredOppIdx !== null;
                  const attacker = isOpponentAttacking ? oppPoke : userPoke;
                  const defender = isOpponentAttacking ? userPoke : oppPoke;

                  let maxEffectiveness = 0;
                  attacker.types.forEach(atkType => {
                    const eff = getEffectiveness(atkType, defender.types);
                    if (eff > maxEffectiveness) maxEffectiveness = eff;
                  });

                  // 座標の中央値を近似計算 (ベジェ曲線の中央点)
                  let midX = SVG_WIDTH / 2;
                  let midY = 0;
                  if (isMobile) {
                    const x1 = uIdx * (46 + 8) + 25;
                    const x2 = oIdx * (46 + 8) + 25;
                    midX = (x1 + x2) / 2;
                    midY = TOTAL_HEIGHT / 2;
                  } else {
                    const y1 = uIdx * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
                    const y2 = oIdx * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
                    midY = (y1 + y2) / 2;
                  }

                  const styleDetail = getMultiplierStyle(maxEffectiveness);

                  if (maxEffectiveness === 1.0) return null;

                  return (
                    <div
                      key={`chip-${uIdx}-${oIdx}`}
                      style={{
                        position: "absolute",
                        left: `${midX}px`,
                        top: `${midY}px`,
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "var(--bg-glass)",
                        border: `1.5px solid ${styleDetail.color}`,
                        boxShadow: `0 0 10px ${styleDetail.glow}`,
                        color: styleDetail.color,
                        padding: isMobile ? "2px 4px" : "3px 8px",
                        borderRadius: isMobile ? "4px" : "6px",
                        fontSize: isMobile ? "0.6rem" : "0.7rem",
                        fontWeight: 800,
                        zIndex: 10,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isMobile ? styleDetail.shortLabel : styleDetail.label}
                    </div>
                  );
                })
              )}
            </div>

            {/* 下カラム (スマホ) / 右カラム (PC): 相手チーム (6体) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: isMobile ? "320px" : "auto" }}>
              <div style={{ 
                display: "flex", 
                flexDirection: isMobile ? "row" : "column", 
                gap: `${CARD_GAP}px`, 
                width: isMobile ? "320px" : "260px",
                justifyContent: isMobile ? "center" : "flex-start",
                padding: isMobile ? "0 2px" : "0"
              }}>
                {!isMobile && (
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--error)", textAlign: "center", marginBottom: "4px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "4px", whiteSpace: "nowrap", overflow: "hidden" }}>
                    🔴 相手パーティ (防御側ホバー)
                  </div>
                )}
                {oppTeam.map((poke, index) => {
                  const isHovered = hoveredOppIdx === index;
                  const isAnyHovered = hoveredUserIdx !== null || hoveredOppIdx !== null;
                  const isDimmed = isAnyHovered && !isHovered && hoveredUserIdx === null;

                  return (
                    <div
                      key={`visual-opp-${index}`}
                      className="pokemon-card"
                      onClick={() => handleCardClick("opp", index)}
                      onMouseEnter={() => { if (!isMobile) setHoveredOppIdx(index); }}
                      onMouseLeave={() => { if (!isMobile) setHoveredOppIdx(null); }}
                      style={{
                        height: `${CARD_HEIGHT}px`,
                        width: isMobile ? `${CARD_WIDTH}px` : "auto",
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: isMobile ? "0px" : "6px",
                        padding: isMobile ? "2px" : "6px 10px",
                        borderRadius: "8px",
                        background: isHovered ? "rgba(255,255,255,0.06)" : "rgba(18,20,32,0.4)",
                        border: `1px solid ${isHovered ? "var(--error)" : "var(--border-glass)"}`,
                        transition: "all 0.2s ease",
                        transform: isHovered 
                          ? (isMobile ? "translateY(-2px)" : "translateX(-6px)") 
                          : "translateY(0)",
                        opacity: isDimmed ? 0.35 : 1,
                        cursor: "pointer",
                        boxShadow: isHovered ? "0 4px 15px rgba(239,68,68,0.15)" : "none",
                      }}
                    >
                      <img 
                        src={poke.sprite} 
                        alt={poke.nameJa} 
                        style={{ 
                          width: isMobile ? "28px" : "40px", 
                          height: isMobile ? "28px" : "40px", 
                          objectFit: "contain" 
                        }} 
                      />
                      {isMobile ? (
                        <div style={{ display: "flex", gap: "2px", justifyContent: "center", marginTop: "2px" }}>
                          {poke.types.map(t => (
                            <span
                              key={t}
                              style={{
                                display: "inline-block",
                                width: "14px",
                                height: "14px",
                                borderRadius: "50%",
                                backgroundColor: TYPE_DETAILS[t].color,
                                color: TYPE_DETAILS[t].textColor,
                                fontSize: "0.5rem",
                                fontWeight: "bold",
                                lineHeight: "14px",
                                textAlign: "center",
                                boxShadow: `0 0 4px ${TYPE_DETAILS[t].glowColor}`,
                              }}
                            >
                              {TYPE_DETAILS[t].ja.substring(0, 1)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden", flex: 1 }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{poke.nameJa}</span>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {poke.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {isMobile ? (
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--error)", marginTop: "8px" }}>
                  🔴 相手パーティ (タップして選択)
                </div>
              ) : null}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
