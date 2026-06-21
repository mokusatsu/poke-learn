import React, { useState, useEffect } from "react";
import { LOCAL_POKEMONS } from "../data/localPokemons";
import type { PokemonData } from "../data/localPokemons";
import { generateRandomTeam } from "../utils/pokemonApi";
import { getEffectiveness, TYPE_LIST, TYPE_DETAILS } from "../utils/typeMatrix";
import type { PokemonType } from "../utils/typeMatrix";
import { PokemonCard } from "./PokemonCard";
import { typeMatchupRationales } from "../data/typeMatchupRationales";

type ConsistencyQuizSize = 3 | 6;

const CONSISTENCY_WEIGHTS_KEY = "poke-learn-consistency-weights";

export const ConsistencyQuiz: React.FC = () => {
  const [teamSize, setTeamSize] = useState<ConsistencyQuizSize>(3);
  const [isFocusedMode, setIsFocusedMode] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [isShortScreen, setIsShortScreen] = useState<boolean>(window.innerHeight < 800 || window.innerWidth < 768);

  // 考察表示用ステート
  const [selectedRationaleAtk, setSelectedRationaleAtk] = useState<PokemonType | null>(null);
  const [selectedRationaleDef, setSelectedRationaleDef] = useState<PokemonType | null>(null);
  const [rationaleImageError, setRationaleImageError] = useState<boolean>(false);

  // リフレッシュやリサイズなどのハンドラー
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsShortScreen(window.innerHeight < 800 || window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 相手チーム状態
  const [oppTeam, setOppTeam] = useState<PokemonData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ユーザーの回答選択
  const [selectedTypes, setSelectedTypes] = useState<PokemonType[]>([]);

  // 回答状態
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [correctTypes, setCorrectTypes] = useState<PokemonType[]>([]);

  // 統計
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  // 相手チームに対して、等倍(1x)以上でダメージが通る「一貫タイプ」をすべて計算
  const calculateConsistentTypes = (team: PokemonData[]): PokemonType[] => {
    return TYPE_LIST.filter(atkType =>
      team.every(opp => getEffectiveness(atkType, opp.types) >= 1.0)
    );
  };

  // クイズの初期化（解が一貫するまでループする事前検証付き）
  const setupQuiz = async (
    targetSize = teamSize,
    targetFocusedMode = isFocusedMode
  ) => {
    setLoading(true);
    setIsAnswered(false);
    setIsCorrect(false);
    setSelectedTypes([]);
    setSelectedRationaleAtk(null);
    setSelectedRationaleDef(null);
    setRationaleImageError(false);

    // 苦手克服データ取得
    const weightsRaw = localStorage.getItem(CONSISTENCY_WEIGHTS_KEY);
    const weights: Record<string, number> = weightsRaw ? JSON.parse(weightsRaw) : {};

    let attempts = 0;
    while (attempts < 50) {
      attempts++;
      // 動的フェッチ
      let draft = await generateRandomTeam(targetSize);

      // 苦手克服モード: 誤答した実績のあるタイプを相手チームに配置しやすくする
      if (targetFocusedMode && Object.keys(weights).length > 0) {
        const sortedFailedTypes = Object.entries(weights)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0] as PokemonType);

        if (sortedFailedTypes.length > 0) {
          const targetType = sortedFailedTypes[0]; // 最も苦手なタイプ
          // 相手チームの1体目をそのタイプを持つポケモンに変更
          draft = await Promise.all(
            draft.map(async (p, idx) => {
              if (idx === 0 && !p.types.includes(targetType)) {
                const match = generateTeamWithSpecificType(targetType);
                return match || p;
              }
              return p;
            })
          );
        }
      }

      const answers = calculateConsistentTypes(draft);

      // 少なくとも1つ以上の一貫タイプが存在し、かつ18タイプ全部が一貫するような極端なケースは避ける
      if (answers.length > 0 && answers.length < 10) {
        setOppTeam(draft);
        setCorrectTypes(answers);
        setLoading(false);
        return;
      }
    }

    // 安全フォールバック
    console.log("Consistency draft retry limit hit, applying local safety draft.");
    const fallbackOpp = generateRandomTeamFromLocal(targetSize);
    setOppTeam(fallbackOpp);
    setCorrectTypes(calculateConsistentTypes(fallbackOpp));
    setLoading(false);
  };

  const generateTeamWithSpecificType = (type: PokemonType): PokemonData | null => {
    const list = LOCAL_POKEMONS.filter((p) => p.types.includes(type));
    if (list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
  };

  const generateRandomTeamFromLocal = (size: number): PokemonData[] => {
    const shuffled = [...LOCAL_POKEMONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  };

  // 回答トグル
  const handleTypeToggle = (type: PokemonType) => {
    if (isAnswered) return;
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // 回答決定
  const handleSubmit = () => {
    if (isAnswered) return;

    const isMatch =
      selectedTypes.length === correctTypes.length &&
      selectedTypes.every(t => correctTypes.includes(t));

    setIsCorrect(isMatch);
    setIsAnswered(true);
    setScore(prev => ({
      correct: prev.correct + (isMatch ? 1 : 0),
      total: prev.total + 1,
    }));

    // 苦手履歴の保存
    const weightsRaw = localStorage.getItem(CONSISTENCY_WEIGHTS_KEY);
    const weights: Record<string, number> = weightsRaw ? JSON.parse(weightsRaw) : {};

    oppTeam.forEach(p => {
      p.types.forEach(t => {
        if (!isMatch) {
          weights[t] = (weights[t] || 0) + 2; // 不正解なら+2
        } else {
          weights[t] = Math.max(0, (weights[t] || 0) - 1); // 正解なら-1
        }
      });
    });
    localStorage.setItem(CONSISTENCY_WEIGHTS_KEY, JSON.stringify(weights));
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
      
      {/* 制御エリア */}
      <div className="glass-panel" style={{ padding: isMobile ? "4px 8px" : "6px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "nowrap", gap: "8px", overflow: "hidden" }}>
        
        {/* 出題規模選択 */}
        <div style={{ display: "flex", gap: "4px", flexWrap: "nowrap", overflowX: isMobile ? "auto" : "visible", width: isMobile ? "calc(100% - 90px)" : "auto", paddingBottom: isMobile ? "2px" : "0", scrollbarWidth: "none" }}>
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>
          {(
            [
              { size: 3 as const, name: "3匹一貫技クイズ" },
              { size: 6 as const, name: "6匹一貫技クイズ" },
            ]
          ).map(btn => (
            <button
              key={btn.size}
              onClick={() => {
                setTeamSize(btn.size);
                setupQuiz(btn.size, isFocusedMode);
              }}
              className="tab-btn"
              style={{
                fontSize: "0.75rem",
                padding: "4px 8px",
                backgroundColor: teamSize === btn.size ? "rgba(255, 255, 255, 0.08)" : "transparent",
                border: teamSize === btn.size ? "1px solid var(--border-glass-active)" : "1px solid transparent",
              }}
            >
              {btn.name}
            </button>
          ))}
        </div>

        {/* 苦手克服トグル */}
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={isFocusedMode}
            onChange={(e) => {
              const nextFocused = e.target.checked;
              setIsFocusedMode(nextFocused);
              setupQuiz(teamSize, nextFocused);
            }}
            style={{ display: "none" }}
          />
          <div className="toggle-bg" style={{ width: "36px", height: "18px" }}>
            <div className="toggle-circle" style={{ width: "14px", height: "14px", left: isFocusedMode ? "20px" : "2px" }}></div>
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: isFocusedMode ? "var(--accent-cyan)" : "var(--text-secondary)" }}>
            苦手克服
          </span>
        </label>
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
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>一貫相性の検証とチーム構築中...</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: isShortScreen ? "3px" : "8px", flex: 1 }}>
          
          {/* 問題文 */}
          <div className="glass-panel glow-card" style={{ padding: isShortScreen ? "4px 8px" : "10px 16px", display: "flex", flexDirection: "column", gap: isShortScreen ? "2px" : "4px", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--accent-cyan)", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.05em" }}>
                一貫技回答モード ({teamSize}匹チーム)
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                スコア: <strong style={{ color: "var(--success)" }}>{score.correct}</strong> / {score.total}
              </span>
            </div>
            <h2 style={{ fontSize: isMobile ? "0.85rem" : "1.05rem", fontWeight: 800, lineHeight: 1.3 }}>
              {isMobile ? (
                <>相手の {teamSize} 匹全員に<strong>半減以下で防がれない（＝等倍・弱点以上）</strong>攻撃タイプをすべて選択！</>
              ) : (
                <>提示された相手の {teamSize} 匹に対して、<strong>「等倍（1倍）または弱点（2倍・4倍）以上でダメージが一貫する（＝半減以下で防がれない）」</strong>攻撃タイプをすべて選択してください。</>
              )}
            </h2>
          </div>

          {/* 相手メンバー表示 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--error)", letterSpacing: "0.05em", paddingLeft: "4px" }}>
              🔴 分析対象：相手パーティー ({teamSize}匹) {isAnswered && !isCorrect && " (クリックして苦手タイプとの覚え方を表示)"}
            </span>
            <div style={{
              display: "flex",
              gap: isMobile ? "6px" : "8px",
              overflowX: isMobile ? "auto" : "visible",
              width: "100%",
              paddingBottom: isMobile ? "4px" : "0",
              scrollbarWidth: "none",
              maxWidth: teamSize === 3 ? (isMobile ? "300px" : "400px") : "100%",
              margin: "0 auto",
              justifyContent: (teamSize === 3 && !isMobile) ? "center" : "flex-start"
            }}>
              {oppTeam.map((poke, index) => {
                const isSelected = isAnswered && !isCorrect && poke.types.some(t => t === selectedRationaleDef);
                
                return (
                  <PokemonCard
                    key={`opp-const-${index}`}
                    pokemon={poke}
                    size={teamSize === 3 ? (isMobile || isShortScreen ? "sm" : "md") : "sm"}
                    showSprite={true}
                    badgeSize="sm"
                    clickable={isAnswered && !isCorrect}
                    onClick={() => {
                      if (isAnswered && !isCorrect) {
                        // プレイヤーが選択して失敗したタイプがある場合はそのタイプを、無ければノーマルなどをデフォルトに
                        const failedTypes = selectedTypes.filter(t => !correctTypes.includes(t));
                        const atkType = failedTypes.length > 0 
                          ? failedTypes[0] 
                          : TYPE_LIST.find(t => getEffectiveness(t, poke.types) < 1.0) || "normal";
                        
                        setSelectedRationaleAtk(atkType);
                        // 防御タイプはポケモンのタイプ1またはタイプ2のうち、半減以下にした方を代表にする
                        const defType = getEffectiveness(atkType, [poke.types[0]]) < 1.0 
                          ? poke.types[0] 
                          : (poke.types[1] || poke.types[0]);
                        setSelectedRationaleDef(defType);
                        setRationaleImageError(false);
                      }
                    }}
                    selected={isSelected}
                  />
                );
              })}
            </div>
          </div>

          {/* VS 分割線 */}
          <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--border-glass), transparent)", margin: "4px 0", flexShrink: 0 }} />

          {/* 回答入力エリア（18タイプ選択グリッド: 9x2） */}
          <div className="glass-panel" style={{ padding: isShortScreen ? "4px 8px" : "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: isShortScreen ? "2px" : "10px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)" }}>
              👇 一貫していると思われるタイプを選択 (複数選択可能)
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: isShortScreen ? "3px" : "6px", width: "100%", maxWidth: "720px" }}>
              {TYPE_LIST.map(type => {
                const isSelected = selectedTypes.includes(type);
                const isAns = correctTypes.includes(type);
                const detail = TYPE_DETAILS[type];

                let border = "1px solid rgba(255, 255, 255, 0.08)";
                let bg = "rgba(18, 20, 32, 0.3)";
                let shadow = "none";
                let opacity = 1;
                let textPrefix = "";

                if (isAnswered) {
                  if (isAns) {
                    if (isSelected) {
                      bg = detail.color;
                      border = "2px solid var(--success)";
                      shadow = `0 0 12px ${detail.glowColor}`;
                      textPrefix = "✓ ";
                    } else {
                      bg = "rgba(0, 0, 0, 0.4)";
                      border = `2px dashed ${detail.color}`;
                      shadow = "none";
                      textPrefix = "⚪ ";
                    }
                  } else if (isSelected) {
                    bg = "rgba(239, 68, 68, 0.3)";
                    border = "2px solid var(--error)";
                    shadow = "0 0 10px var(--error-glow)";
                    textPrefix = "✗ ";
                  } else {
                    opacity = 0.45;
                    border = "1px solid rgba(255, 255, 255, 0.02)";
                  }
                } else if (isSelected) {
                  bg = detail.color;
                  border = "1.5px solid #ffffff";
                  shadow = `0 0 12px ${detail.glowColor}`;
                }

                return (
                  <button
                    key={type}
                    onClick={() => handleTypeToggle(type)}
                    disabled={isAnswered}
                    style={{
                      backgroundColor: bg,
                      border,
                      borderRadius: "6px",
                      padding: isShortScreen ? "4px 0" : "6px 0",
                      color: (isSelected && (!isAnswered || isAns)) ? detail.textColor : "var(--text-primary)",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      cursor: isAnswered ? "default" : "pointer",
                      boxShadow: shadow,
                      transition: "all 0.15s ease",
                      opacity,
                    }}
                  >
                    {textPrefix}{detail.ja}
                  </button>
                );
              })}
            </div>

            {/* 結果フィードバック */}
            {isAnswered && (
              <div
                className={isCorrect ? "animate-pop-in" : "animate-shake"}
                style={{
                  width: "100%",
                  padding: isShortScreen ? "4px 8px" : "6px 10px",
                  borderRadius: "8px",
                  backgroundColor: isCorrect ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: `1px solid ${isCorrect ? "var(--success)" : "var(--error)"}`,
                  boxShadow: `0 0 10px ${isCorrect ? "var(--success-glow)" : "var(--error-glow)"}`,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  flexShrink: 1,
                  minHeight: isShortScreen ? "55px" : "90px"
                }}
              >
                <span style={{ fontSize: "1.05rem", fontWeight: 800, color: isCorrect ? "var(--success)" : "var(--error)" }}>
                  {isCorrect ? "🎉 正解！見事に一貫する攻撃ルートをすべて見抜きました！" : "❌ 不正解です！等倍以上が通るタイプを再計算しましょう。"}
                </span>
                
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  一貫するタイプは:{" "}
                  <strong>
                    {correctTypes.map(t => TYPE_DETAILS[t].ja).join(", ") || "なし"}
                  </strong>
                </span>

                {/* 詳細な対戦解説 */}
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", textAlign: "left", padding: isMobile ? "4px 8px" : "6px 12px", background: "rgba(0,0,0,0.15)", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <strong>💡 相性計算解説:</strong>
                  {correctTypes.map(t => {
                    const rowText = oppTeam.map(o => {
                      const eff = getEffectiveness(t, o.types);
                      return `${o.nameJa}(${eff}x)`;
                    }).join(", ");
                    return (
                      <span key={`desc-${t}`} style={{ color: "var(--text-primary)" }}>
                        ・<strong>{TYPE_DETAILS[t].ja}タイプ</strong> の一貫: {rowText} に通るため一貫します。
                      </span>
                    );
                  })}
                </div>

                {/* 防がれた要因の分析リスト */}
                {!isCorrect && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", textAlign: "left", padding: isMobile ? "4px 8px" : "6px 12px", background: "rgba(0,0,0,0.15)", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <strong>⚠️ 防がれた要因の分析 (クリックで覚え方を表示):</strong>
                    {(() => {
                      const failedTypes = selectedTypes.filter(t => !correctTypes.includes(t));
                      const typesToAnalyze = failedTypes.length > 0 ? failedTypes : TYPE_LIST.filter(t => !correctTypes.includes(t));
                      
                      const blockReasons: { atk: PokemonType; poke: PokemonData; eff: number }[] = [];
                      
                      typesToAnalyze.forEach(atk => {
                        oppTeam.forEach(o => {
                          const eff = getEffectiveness(atk, o.types);
                          if (eff < 1.0) {
                            blockReasons.push({ atk, poke: o, eff });
                          }
                        });
                      });

                      const targetReasons = failedTypes.length > 0 
                        ? blockReasons.filter(r => failedTypes.includes(r.atk))
                        : blockReasons;

                      return targetReasons.slice(0, 6).map((reason, idx) => {
                        const key = `${reason.atk}-${reason.poke.nameJa}-${idx}`;
                        const defType = getEffectiveness(reason.atk, [reason.poke.types[0]]) < 1.0 
                          ? reason.poke.types[0] 
                          : (reason.poke.types[1] || reason.poke.types[0]);
                        const isSelected = selectedRationaleAtk === reason.atk && selectedRationaleDef === defType;
                        
                        return (
                          <div 
                            key={key} 
                            onClick={() => {
                              setSelectedRationaleAtk(reason.atk);
                              setSelectedRationaleDef(defType);
                              setRationaleImageError(false);
                            }}
                            style={{ 
                              color: "var(--text-primary)", 
                              cursor: "pointer", 
                              padding: "4px 8px", 
                              borderRadius: "4px", 
                              backgroundColor: isSelected ? "rgba(6, 182, 212, 0.15)" : "transparent",
                              border: isSelected ? "1px solid var(--accent-cyan)" : "1px solid transparent",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: "2px",
                              transition: "all 0.15s ease"
                            }}
                            title="クリックして相性の覚え方を表示"
                          >
                            <span>
                              ・<strong>{TYPE_DETAILS[reason.atk].ja}</strong> は <strong>{reason.poke.nameJa}</strong> に {reason.eff}x で防がれました。
                            </span>
                            <span style={{ fontSize: "0.7rem", color: "var(--accent-cyan)" }}>覚え方表示 💡</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* 相性の覚え方アコーディオン */}
            {isAnswered && !isCorrect && selectedRationaleAtk && selectedRationaleDef && (() => {
              const rationaleData = typeMatchupRationales[selectedRationaleAtk]?.[selectedRationaleDef];
              
              return (
                <div className="glass-panel animate-pop-in" style={{
                  marginTop: "6px",
                  padding: "12px",
                  border: "1px solid var(--border-glass-active)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  boxSizing: "border-box",
                  width: "100%"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "1rem" }}>💡</span>
                      <strong style={{ fontSize: "0.85rem", color: "var(--accent-cyan)" }}>相性の覚え方 ({TYPE_DETAILS[selectedRationaleAtk].ja} → {TYPE_DETAILS[selectedRationaleDef].ja})</strong>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRationaleAtk(null);
                        setSelectedRationaleDef(null);
                      }}
                      className="tab-btn"
                      style={{ fontSize: "0.7rem", padding: "1px 6px" }}
                    >
                      閉じる
                    </button>
                  </div>

                  <div className="rationale-container">
                    {/* 考察テキスト */}
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <p style={{ fontSize: "0.75rem", lineHeight: "1.45", margin: 0, color: "var(--text-primary)" }}>
                        {rationaleData?.rationale || "この相性に関する詳細な考察データはありません。"}
                      </p>
                    </div>

                    {/* 画像 */}
                    {!rationaleImageError && (
                      <div className="rationale-image-container" style={{ flex: "0 0 140px", maxWidth: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.1)", backgroundColor: "rgba(0,0,0,0.2)" }}>
                        <img
                          src={`/images/matchup-rationales/${selectedRationaleAtk}-${selectedRationaleDef}.png`}
                          alt={`${TYPE_DETAILS[selectedRationaleAtk].ja} から ${TYPE_DETAILS[selectedRationaleDef].ja} への相性`}
                          onError={(e) => {
                            (e.target as HTMLElement).parentElement!.style.display = "none";
                          }}
                          style={{ width: "100%", height: "auto", display: "block" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* コントロール */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "4px", flexShrink: 0 }}>
              {!isAnswered ? (
                <button onClick={handleSubmit} className="btn-primary" style={{ width: "200px", padding: "10px 20px", fontSize: "0.9rem" }}>
                  回答を決定する
                </button>
              ) : (
                <button onClick={() => setupQuiz()} className="btn-primary" style={{ width: "200px", padding: "10px 20px", fontSize: "0.9rem", background: "linear-gradient(135deg, var(--accent-violet), #c084fc)" }}>
                  次の問題へ
                </button>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
