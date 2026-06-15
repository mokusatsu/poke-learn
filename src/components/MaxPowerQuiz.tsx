import React, { useState, useEffect, useRef } from "react";
import { LOCAL_POKEMONS } from "../data/localPokemons";
import type { PokemonData } from "../data/localPokemons";
import { getEffectiveness, getSingleMatchupMultiplier, TYPE_DETAILS, TYPE_LIST } from "../utils/typeMatrix";
import type { PokemonType } from "../utils/typeMatrix";
import { PokemonCard } from "./PokemonCard";
import { TypeBadge } from "./TypeBadge";

// IRT弱点マトリクスのlocalStorageキー
const WEAKNESS_MATRIX_KEY = "poke-learn-max-power-weights";

interface QuestionData {
  opp: PokemonData;
  hand: PokemonType[];
  maxMult: number;
  bestTypes: PokemonType[];
}

interface QuestionResult {
  index: number;
  opp: PokemonData;
  hand: PokemonType[];
  selected: PokemonType | null; // null is timeout
  isCorrect: boolean;
  timeMs: number;
}

export const MaxPowerQuiz: React.FC = () => {
  const [gameState, setGameState] = useState<"start" | "playing" | "answered" | "result">("start");
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [selectedType, setSelectedType] = useState<PokemonType | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [quizMode, setQuizMode] = useState<"normal" | "expert">("normal");
  
  // レスポンシブ用状態
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [isShortScreen, setIsShortScreen] = useState<boolean>(window.innerHeight < 800 || window.innerWidth < 768);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const elapsedRef = useRef<number>(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsShortScreen(window.innerHeight < 800 || window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 左右表示用レイアウト定数
  const CONTAINER_WIDTH = isMobile ? 330 : 630;
  const BUTTON_WIDTH = isMobile ? 90 : 150;
  const RIGHT_WIDTH = isMobile ? 170 : 300;

  const BUTTON_HEIGHT = isMobile ? 40 : 52;
  const BUTTON_GAP = isMobile ? 14 : 24;
  const TOTAL_HEIGHT = 4 * BUTTON_HEIGHT + 3 * BUTTON_GAP;

  const x1 = BUTTON_WIDTH;
  const BADGE_WIDTH = isMobile ? 44 : 80;
  const GAP = isMobile ? 4 : 12;
  const POKEMON_CARD_WIDTH = isMobile ? 112 : (isShortScreen ? 130 : 160);
  const x2 = CONTAINER_WIDTH - POKEMON_CARD_WIDTH - GAP - BADGE_WIDTH / 2;
  const midX = (x1 + x2) / 2;

  const y_left = (idx: number) => {
    return idx * (BUTTON_HEIGHT + BUTTON_GAP) + BUTTON_HEIGHT / 2;
  };

  const y_right = (idx: number) => {
    const typesCount = currentQuestion?.opp.types.length || 1;
    if (typesCount === 1) {
      return TOTAL_HEIGHT / 2;
    } else {
      const spacing = isMobile ? 24 : 32;
      return idx === 0 
        ? TOTAL_HEIGHT / 2 - spacing 
        : TOTAL_HEIGHT / 2 + spacing;
    }
  };

  // 倍率に応じたカラー & テキストを取得
  const getMultiplierStyle = (mult: number) => {
    if (mult === 4.0) return { color: "#F59E0B", glow: "rgba(245, 158, 11, 0.4)" };
    if (mult === 2.0) return { color: "#10B981", glow: "rgba(16, 185, 129, 0.4)" };
    if (mult === 0.5) return { color: "#3B82F6", glow: "rgba(59, 130, 246, 0.3)" };
    if (mult === 0.25) return { color: "#6366F1", glow: "rgba(99, 102, 241, 0.3)" };
    if (mult === 0.0) return { color: "#EF4444", glow: "rgba(239, 68, 68, 0.4)" };
    return { color: "#ffffff", glow: "transparent" };
  };

  // 倍率に応じた線のスタイル (太さと線種) を取得
  const getLineStyles = (mult: number) => {
    if (mult === 4.0) return { strokeWidth: "1.6em", glowWidth: "2.4em", flowWidth: "0.64em", strokeDasharray: "none" };
    if (mult === 2.0) return { strokeWidth: "0.8em", glowWidth: "1.2em", flowWidth: "0.32em", strokeDasharray: "none" };
    if (mult === 0.5) return { strokeWidth: "0.2em", glowWidth: "0.3em", flowWidth: "0.08em", strokeDasharray: "4 4" };
    if (mult === 0.25) return { strokeWidth: "0.1em", glowWidth: "0.15em", flowWidth: "0.04em", strokeDasharray: "2 2" };
    if (mult === 0.0) return { strokeWidth: "0.05em", glowWidth: "0.075em", flowWidth: "0.02em", strokeDasharray: "1 2" };
    return { strokeWidth: "0.4em", glowWidth: "0.6em", flowWidth: "0.16em", strokeDasharray: "none" };
  };

  // 倍率文字の個別カラーを取得
  const getMultiplierColor = (mult: number): string => {
    if (mult === 4.0) return "#F59E0B";
    if (mult === 2.0) return "#10B981";
    if (mult === 0.5) return "#3B82F6";
    if (mult === 0.25) return "#6366F1";
    if (mult === 0.0) return "#EF4444";
    return "#ffffff";
  };

  // ミニタイプカードを描画
  const renderMiniTypeBadge = (type: PokemonType) => {
    const detail = TYPE_DETAILS[type];
    if (!detail) return null;
    return (
      <span
        style={{
          backgroundColor: detail.color,
          color: detail.textColor,
          boxShadow: `0 0 6px ${detail.glowColor}`,
          border: "1px solid rgba(255, 255, 255, 0.15)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: isMobile ? "0.55rem" : "0.65rem",
          padding: isMobile ? "1px 4px" : "2px 6px",
          borderRadius: "4px",
          letterSpacing: "0.02em",
          lineHeight: 1
        }}
      >
        {detail.ja}
      </span>
    );
  };

  // IRT弱点マトリクスの読み込み
  const loadWeaknessMatrix = (): Record<string, number> => {
    const raw = localStorage.getItem(WEAKNESS_MATRIX_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // フォールバック
      }
    }
    // 初期値: 324個の組み合わせすべてを 1.0 に設定
    const initial: Record<string, number> = {};
    TYPE_LIST.forEach(atk => {
      TYPE_LIST.forEach(def => {
        initial[`${atk}-${def}`] = 1.0;
      });
    });
    return initial;
  };

  // IRT弱点マトリクスの保存
  const saveWeaknessMatrix = (matrix: Record<string, number>) => {
    localStorage.setItem(WEAKNESS_MATRIX_KEY, JSON.stringify(matrix));
  };

  // 相手ポケモンが「2倍 × 0.5倍 = 1.0倍」の相殺攻撃タイプを持っているかチェックするヘルパー
  const hasNeutralizationAtk = (opp: PokemonData): boolean => {
    if (opp.types.length < 2) return false;
    const def1 = opp.types[0];
    const def2 = opp.types[1];
    return TYPE_LIST.some(atk => {
      const m1 = getSingleMatchupMultiplier(atk, def1);
      const m2 = getSingleMatchupMultiplier(atk, def2);
      return (m1 === 2.0 && m2 === 0.5) || (m1 === 0.5 && m2 === 2.0);
    });
  };

  // IRT加重に基づき、苦手なタイプを持つ敵ポケモンを選出
  const draftOpponent = (weights: Record<string, number>, forceNeutralization?: boolean): PokemonData => {
    let pool = LOCAL_POKEMONS;
    if (forceNeutralization) {
      pool = LOCAL_POKEMONS.filter(hasNeutralizationAtk);
      if (pool.length === 0) pool = LOCAL_POKEMONS;
    }

    // 各ポケモンが「受けるダメージ」において、プレイヤーの苦手相性合計スコアを計算
    const scoredPokemons = pool.map(poke => {
      let score = 0;
      // 18種類の攻撃側タイプから受けるダメージを評価
      TYPE_LIST.forEach(atk => {
        const eff = getEffectiveness(atk, poke.types);
        // 等倍以上（一貫・弱点）でダメージが通る攻撃対面について、プレイヤーの苦手度を加算する
        if (eff >= 1.0) {
          const def1 = poke.types[0];
          const def2 = poke.types[1] || def1;
          const w1 = weights[`${atk}-${def1}`] || 1.0;
          const w2 = weights[`${atk}-${def2}`] || 1.0;
          score += (w1 + w2) / 2 * eff; // 相性倍率も掛け合わせて重みを強調
        }
      });
      return { poke, score };
    });

    // 加重確率選出 (ルーレットホイール選択)
    const totalScore = scoredPokemons.reduce((sum, item) => sum + item.score, 0);
    let randomPoint = Math.random() * totalScore;
    
    for (const item of scoredPokemons) {
      randomPoint -= item.score;
      if (randomPoint <= 0) {
        return item.poke;
      }
    }
    
    // 安全フォールバック
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // 手札 (攻撃タイプ 4枚) のドラフト
  const draftHand = (opp: PokemonData, mode: "normal" | "expert", forceNeutralization: boolean): { hand: PokemonType[], maxMult: number, bestTypes: PokemonType[] } => {
    // 後半2問用の相殺パターン強制ロジック
    if (forceNeutralization) {
      const def1 = opp.types[0];
      const def2 = opp.types[1] || def1;
      const neutTypes = TYPE_LIST.filter(atk => {
        const m1 = getSingleMatchupMultiplier(atk, def1);
        const m2 = getSingleMatchupMultiplier(atk, def2);
        return (m1 === 2.0 && m2 === 0.5) || (m1 === 0.5 && m2 === 2.0);
      });
      // 1倍未満（半減、0倍など）の攻撃タイプ
      const weakerTypes = TYPE_LIST.filter(atk => getEffectiveness(atk, opp.types) < 1.0);

      if (neutTypes.length > 0 && weakerTypes.length >= 3) {
        const selectedNeut = neutTypes[Math.floor(Math.random() * neutTypes.length)];
        const selectedWeakers = [...weakerTypes].sort(() => 0.5 - Math.random()).slice(0, 3);
        const hand = [selectedNeut, ...selectedWeakers].sort(() => 0.5 - Math.random());
        const maxMult = 1.0;
        return { hand, maxMult, bestTypes: [selectedNeut] };
      }
    }

    let attempts = 0;
    while (attempts < 200) {
      attempts++;
      // 18タイプから重複なくランダムに4枚選出
      const shuffled = [...TYPE_LIST].sort(() => 0.5 - Math.random());
      const hand = shuffled.slice(0, 4);
      
      // それぞれの相性倍率を計算
      const mults = hand.map(t => getEffectiveness(t, opp.types));
      
      // 異倍率保証: 手札に少なくとも2つ以上の異なる倍率が存在することを確認
      const uniqueMults = Array.from(new Set(mults));
      if (uniqueMults.length >= 2) {
        const maxMult = Math.max(...mults);

        // モード別の制限をかける
        if (mode === "normal" && maxMult < 2.0) {
          continue; // 通常モードでは、最大倍率が効果抜群（2x以上）である必要がある
        }
        // エキスパートモードでは2xや4xを除外しないため、条件制限は不要（任意の倍率を許容）

        const bestTypes: PokemonType[] = [];
        hand.forEach((t, i) => {
          if (mults[i] === maxMult) {
            bestTypes.push(t);
          }
        });
        
        return { hand, maxMult, bestTypes };
      }
    }

    // 万が一のフォールバック
    const fallbackHand: PokemonType[] = ["normal", "fire", "water", "grass"];
    const mults = fallbackHand.map(t => getEffectiveness(t, opp.types));
    const maxMult = Math.max(...mults);
    const bestTypes = fallbackHand.filter(t => getEffectiveness(t, opp.types) === maxMult);
    return { hand: fallbackHand, maxMult, bestTypes };
  };

  // 次の問題をセットアップ
  const setupNextQuestion = (nextIndex: number, mode: "normal" | "expert") => {
    // エキスパートモードの後半2問（問題9、10 = インデックス8、9）のみ、強制相殺問題にする
    const forceNeutralization = mode === "expert" && (nextIndex === 8 || nextIndex === 9);
    const weights = loadWeaknessMatrix();
    const opp = draftOpponent(weights, forceNeutralization);
    const { hand, maxMult, bestTypes } = draftHand(opp, mode, forceNeutralization);

    setCurrentQuestion({
      opp,
      hand,
      maxMult,
      bestTypes
    });
    setSelectedType(null);
    setElapsedMs(0);
    elapsedRef.current = 0;
    setQuestionIndex(nextIndex);
    setGameState("playing");

    // タイマー起動
    startTimeRef.current = performance.now();
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      const now = performance.now();
      const diff = now - startTimeRef.current;
      if (diff >= 10000) {
        // タイムアウト
        setElapsedMs(10000);
        elapsedRef.current = 10000;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        handleAnswer(null, true);
      } else {
        setElapsedMs(diff);
        elapsedRef.current = diff;
      }
    }, 30); // 30ms間隔で滑らかに更新
  };

  // ゲームの開始
  const startGame = () => {
    setResults([]);
    setupNextQuestion(0, quizMode);
  };

  // 解答決定処理
  const handleAnswer = (type: PokemonType | null, isTimeout: boolean = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const timeMs = isTimeout ? 10000 : Math.min(10000, performance.now() - startTimeRef.current);
    setSelectedType(type);

    if (!currentQuestion) return;

    // 正答判定
    let isCorrect = false;
    if (type) {
      const mult = getEffectiveness(type, currentQuestion.opp.types);
      isCorrect = mult === currentQuestion.maxMult;
    }

    // 結果の追加
    const questionResult: QuestionResult = {
      index: questionIndex,
      opp: currentQuestion.opp,
      hand: currentQuestion.hand,
      selected: type,
      isCorrect,
      timeMs: isCorrect ? timeMs : 10000 // 誤答は10秒扱い
    };

    setResults(prev => [...prev, questionResult]);

    // --- IRT弱点マトリクスの更新 ---
    const weights = loadWeaknessMatrix();
    const def1 = currentQuestion.opp.types[0];
    const def2 = currentQuestion.opp.types[1] || def1;

    // 手札にあった全タイプと敵ポケモンの相性の重みを調整
    currentQuestion.hand.forEach(atk => {
      const isBest = currentQuestion.bestTypes.includes(atk);
      const isSelected = type === atk;

      // 各防御タイプペアに対して更新
      const updateWeight = (atkType: PokemonType, defType: PokemonType) => {
        const key = `${atkType}-${defType}`;
        const currentW = weights[key] || 1.0;

        if (isBest) {
          if (!isCorrect || isTimeout) {
            // 正解なのに選べなかった/タイムアウトした場合：苦手度を大きく加算
            weights[key] = currentW + 2.0;
          } else if (isSelected) {
            // 正解を選べた場合
            if (timeMs > 2500) {
              // 即答できなかった（2.5秒超え）：苦手度を少し加算
              weights[key] = currentW + 1.0;
            } else {
              // 正解かつ即答（2.5秒以内）：苦手度を減衰させてマスターに近づける
              weights[key] = Math.max(1.0, currentW * 0.9);
            }
          }
        } else if (isSelected) {
          // 不正解のタイプを誤って選択した場合：そのタイプへの苦手度を加算
          weights[key] = currentW + 2.0;
        }
      };

      updateWeight(atk, def1);
      if (currentQuestion.opp.types[1]) {
        updateWeight(atk, def2);
      }
    });

    saveWeaknessMatrix(weights);
    setGameState("answered");
  };

  // 次へ進む
  const handleNext = () => {
    if (questionIndex < 9) {
      setupNextQuestion(questionIndex + 1, quizMode);
    } else {
      // 10問全終了 ➡ リザルト画面
      setGameState("result");
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // スコア計算
  const calculateFinalScore = () => {
    const totalTimeSec = results.reduce((sum, r) => sum + r.timeMs / 1000, 0);
    return {
      totalTimeSec: parseFloat(totalTimeSec.toFixed(2)),
      score: parseFloat(Math.max(0, 100 - totalTimeSec).toFixed(2))
    };
  };

  // 倍率表記テキスト・カラーの日本語変換
  const getMultBreakdownText = (atkType: PokemonType, defTypes: PokemonType[]) => {
    const atkDetail = TYPE_DETAILS[atkType];
    const def1 = defTypes[0];
    const def2 = defTypes[1];

    const m1 = getSingleMatchupMultiplier(atkType, def1);
    const text1 = `${TYPE_DETAILS[def1].ja} (${m1}x)`;

    if (def2) {
      const m2 = getSingleMatchupMultiplier(atkType, def2);
      const text2 = `${TYPE_DETAILS[def2].ja} (${m2}x)`;
      const total = m1 * m2;
      return `${atkDetail.ja} ➡ ${text1} × ${text2} ＝ ${total}x`;
    }
    return `${atkDetail.ja} ➡ ${text1} ＝ ${m1}x`;
  };

  if (gameState === "start") {
    return (
      <div className="glass-panel glow-card animate-fade-in" style={{ padding: isMobile ? "16px" : "32px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "350px", textAlign: "center" }}>
        <h2 style={{ fontSize: isMobile ? "1.2rem" : "1.6rem", fontWeight: 900, background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          ⚔️ 最大打点技選択 (10問タイムアタック)
        </h2>
        <div style={{ maxWidth: "540px", fontSize: isMobile ? "0.8rem" : "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: "10px", textAlign: "left", margin: "10px 0" }}>
          <p>💡 <strong>ルール説明:</strong></p>
          <p>・提示される敵の複合タイプに対し、手札にある <strong>4つの攻撃タイプ</strong> の中から最もダメージ倍率が高い最適タイプを瞬時に比較・計算して選択してください。</p>
          <p>・各問題の制限時間は <strong>10秒</strong> です。</p>
          <p>・<strong>スコア ＝ 100秒 － 合計所要時間</strong> です。誤答やタイムアウト（時間切れ）はペナルティとして一律 <strong>10秒</strong> 扱いとなります。</p>
          <p>・プレイヤーの解答精度と即答速度（2.5秒以内）に基づいて <strong>IRT弱点マトリクス</strong> が更新され、苦手なタイプを突く/防ぐ問題が自動的に優先して出題されます。</p>
        </div>

        {/* 難易度モード選択UI */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "400px", margin: "10px 0", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)" }}>🎮 難易度モードを選択してください:</span>
          <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "center" }}>
            <button
              onClick={() => setQuizMode("normal")}
              className={`tab-btn ${quizMode === "normal" ? "active" : ""}`}
              style={{ padding: "8px 20px", fontSize: "0.85rem", flex: 1, whiteSpace: "nowrap" }}
            >
              😊 通常モード
            </button>
            <button
              onClick={() => setQuizMode("expert")}
              className={`tab-btn ${quizMode === "expert" ? "active" : ""}`}
              style={{ padding: "8px 20px", fontSize: "0.85rem", flex: 1, whiteSpace: "nowrap" }}
            >
              🔥 エキスパートモード
            </button>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4, marginTop: "4px", minHeight: "40px" }}>
            {quizMode === "normal"
              ? "【通常】手札の中に必ず1枚以上は「効果はバツグン（2倍または4倍）」のタイプが存在します。"
              : "【エキスパート】手札の中に「効果はバツグン（2倍以上）」のタイプが存在しません。等倍（1.0倍）や半減（0.5倍）が最大打点となるため、より深い計算が必要です。"}
          </p>
        </div>

        <button onClick={startGame} className="btn-primary" style={{ padding: "14px 32px", fontSize: "1.05rem", width: "220px", marginTop: "12px" }}>
          ゲームを開始する！
        </button>
      </div>
    );
  }

  if (gameState === "playing" || gameState === "answered") {
    if (!currentQuestion) return null;
    const isAnsMode = gameState === "answered";
    const lastResult = results[results.length - 1];

    return (
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: isShortScreen ? "6px" : "12px", width: "100%", height: "auto" }}>
        
        {/* ステータスバー */}
        <div className="glass-panel" style={{ padding: isShortScreen ? "6px 12px" : "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
            問題 {questionIndex + 1} / 10
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            累積タイム:{" "}
            <strong style={{ color: "var(--accent-cyan)" }}>
              {results.reduce((sum, r) => sum + r.timeMs / 1000, 0).toFixed(2)} 秒
            </strong>
          </span>
        </div>

        {/* タイムプログレスバー */}
        <div className="glass-panel" style={{ width: "100%", height: "16px", padding: "4px", borderRadius: "10px", display: "flex", alignItems: "center", flexShrink: 0, overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.max(0, 10000 - elapsedMs) / 100}%`,
              height: "8px",
              background: elapsedMs > 7500 ? "var(--error)" : "linear-gradient(90deg, var(--accent-cyan), var(--accent-violet))",
              boxShadow: elapsedMs > 7500 ? "0 0 10px var(--error-glow)" : "0 0 10px var(--accent-cyan-glow)",
              borderRadius: "4px",
              transition: elapsedMs === 0 ? "none" : "width 0.1s linear"
            }}
          />
        </div>

        {/* 左右分割＆相性接続ライン可視化盤面 */}
        <div className="glass-panel" style={{ padding: isMobile ? "8px" : "16px", display: "flex", flexDirection: "column", gap: "12px", width: "100%", overflow: "hidden" }}>
          {/* 説明ラベル */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "6px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
              {isAnsMode ? "🧐 相性接続・計算プロセス詳細" : "👇 手札から1つ選んで攻撃！"}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              分析対象：相手の {currentQuestion.opp.nameJa}
            </span>
          </div>

          <div style={{ display: "flex", width: `${CONTAINER_WIDTH}px`, height: `${TOTAL_HEIGHT}px`, alignItems: "center", position: "relative", margin: "10px auto" }}>
            
            {/* 左側: 攻撃側の縦並び手札ボタン */}
            <div style={{ position: "absolute", left: 0, top: 0, width: `${BUTTON_WIDTH}px`, height: "100%" }}>
              {currentQuestion.hand.map((type, i) => {
                const detail = TYPE_DETAILS[type];
                const isSelected = selectedType === type;
                const isBest = currentQuestion.bestTypes.includes(type);
                
                let border = "1px solid rgba(255, 255, 255, 0.08)";
                let bg = "rgba(18, 20, 32, 0.35)";
                let shadow = "none";
                let opacity = 1;
                let textPrefix = "";
                let textColor = "var(--text-primary)";

                if (isAnsMode) {
                  if (isBest) {
                    if (isSelected || (selectedType && currentQuestion.bestTypes.includes(selectedType))) {
                      bg = detail.color;
                      border = "2px solid var(--success)";
                      shadow = `0 0 12px ${detail.glowColor}`;
                      textPrefix = "✓ ";
                      textColor = detail.textColor;
                    } else {
                      bg = "rgba(0, 0, 0, 0.5)";
                      border = `2px dashed ${detail.color}`;
                      textPrefix = "⚪ ";
                      textColor = "var(--text-primary)";
                    }
                  } else if (isSelected) {
                    bg = "rgba(239, 68, 68, 0.35)";
                    border = "2px solid var(--error)";
                    shadow = "0 0 10px var(--error-glow)";
                    textPrefix = "✗ ";
                    textColor = "var(--text-primary)";
                  } else {
                    opacity = 0.5;
                    border = "1px solid rgba(255, 255, 255, 0.02)";
                    textColor = "var(--text-secondary)";
                  }
                } else if (isSelected) {
                  bg = detail.color;
                  border = "2.5px solid #ffffff";
                  shadow = `0 0 12px ${detail.glowColor}`;
                  textColor = detail.textColor;
                }

                return (
                  <button
                    key={`hand-btn-${type}`}
                    onClick={() => !isAnsMode && handleAnswer(type)}
                    disabled={isAnsMode}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: `${y_left(i)}px`,
                      transform: "translateY(-50%)",
                      width: "100%",
                      height: `${BUTTON_HEIGHT}px`,
                      backgroundColor: bg,
                      border,
                      borderRadius: "10px",
                      color: textColor,
                      fontWeight: 800,
                      fontSize: isMobile ? "0.75rem" : "0.9rem",
                      cursor: isAnsMode ? "default" : "pointer",
                      boxShadow: shadow,
                      transition: "all 0.15s ease",
                      opacity,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px"
                    }}
                  >
                    <span style={{ whiteSpace: "nowrap" }}>{textPrefix}{detail.ja}</span>
                    {isAnsMode && (
                      <span style={{ fontSize: isMobile ? "0.65rem" : "0.75rem", opacity: 0.85 }}>
                        ({getEffectiveness(type, currentQuestion.opp.types)}x)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 中央: SVG接続線キャンバス（全体オーバーレイ） */}
            <svg width={CONTAINER_WIDTH} height={TOTAL_HEIGHT} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
              {isAnsMode && currentQuestion.hand.map((atkType, i) => {
                const isBest = currentQuestion.bestTypes.includes(atkType);
                const isSelected = selectedType === atkType;
                const isHighlighted = isBest || isSelected;

                if (!isHighlighted) return null;

                return currentQuestion.opp.types.map((defType, j) => {
                  const singleMult = getSingleMatchupMultiplier(atkType, defType);
                  const lineColor = TYPE_DETAILS[atkType].color;
                  const lineStyle = getLineStyles(singleMult);

                  const y1 = y_left(i);
                  const y2 = y_right(j);
                  const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

                  return (
                    <g key={`curve-${i}-${j}`}>
                      {/* Glow path */}
                      <path
                        d={path}
                        stroke={lineColor}
                        strokeWidth={lineStyle.glowWidth}
                        fill="none"
                        opacity="0.25"
                        style={{ filter: "blur(4px)" }}
                      />
                      {/* Main path */}
                      <path
                        d={path}
                        stroke={lineColor}
                        strokeWidth={lineStyle.strokeWidth}
                        strokeDasharray={lineStyle.strokeDasharray}
                        fill="none"
                        className="link-path highlighted"
                      />
                      {/* Flow animation */}
                      <path
                        d={path}
                        stroke="#ffffff"
                        strokeWidth={lineStyle.flowWidth}
                        strokeDasharray="5 15"
                        fill="none"
                        className="flow-anim"
                        opacity="0.65"
                      />
                    </g>
                  );
                });
              })}
            </svg>

            {/* 乗算計算プロセスのチップ表示（全体オーバーレイ） */}
            {isAnsMode && currentQuestion.hand.map((atkType, i) => {
              const isBest = currentQuestion.bestTypes.includes(atkType);
              const isSelected = selectedType === atkType;
              const isHighlighted = isBest || isSelected;

              if (!isHighlighted) return null;

              const m1 = getSingleMatchupMultiplier(atkType, currentQuestion.opp.types[0]);
              const m2 = currentQuestion.opp.types[1] ? getSingleMatchupMultiplier(atkType, currentQuestion.opp.types[1]) : 1.0;
              const total = m1 * (currentQuestion.opp.types[1] ? m2 : 1.0);
              
              const styleDetail = getMultiplierStyle(total);

              // チップを攻撃側ボタンのすぐ右横に配置する
              const y1 = y_left(i);
              const chipLeft = x1 + (isMobile ? 4 : 10);

              return (
                <div
                  key={`formula-chip-${atkType}`}
                  style={{
                    position: "absolute",
                    left: `${chipLeft}px`,
                    top: `${y1}px`,
                    transform: "translate(0, -50%)",
                    backgroundColor: "rgba(18, 20, 32, 0.95)",
                    border: `1.5px solid ${styleDetail.color}`,
                    boxShadow: `0 0 10px ${styleDetail.glow}`,
                    color: "#ffffff",
                    padding: isMobile ? "2px 6px" : "4px 10px",
                    borderRadius: "6px",
                    fontSize: isMobile ? "0.65rem" : "0.75rem",
                    fontWeight: 800,
                    zIndex: 10,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  {renderMiniTypeBadge(currentQuestion.opp.types[0])}
                  <span style={{ color: getMultiplierColor(m1), fontWeight: 900 }}>{m1}x</span>
                  {currentQuestion.opp.types[1] && (
                    <>
                      <span style={{ color: "var(--text-muted)", margin: "0 1px" }}>×</span>
                      {renderMiniTypeBadge(currentQuestion.opp.types[1])}
                      <span style={{ color: getMultiplierColor(m2), fontWeight: 900 }}>{m2}x</span>
                    </>
                  )}
                  <span style={{ color: "var(--text-secondary)", margin: "0 1px" }}>＝</span>
                  <span style={{ color: styleDetail.color, fontWeight: 900 }}>{total}x</span>
                </div>
              );
            })}

            {/* 右側: 防御側のポケモンカード＆縦並び接続用タイプバッジ */}
            <div style={{ position: "absolute", right: 0, top: 0, width: `${RIGHT_WIDTH}px`, height: "100%", display: "flex", alignItems: "center", gap: isMobile ? "4px" : "12px", justifyContent: "flex-end" }}>
              {/* タイプバッジの縦配置 (SVG接続先) */}
              <div style={{ position: "relative", width: isMobile ? "44px" : "80px", height: "100%" }}>
                {currentQuestion.opp.types.map((type, j) => {
                  return (
                    <div
                      key={`def-badge-${type}`}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: `${y_right(j)}px`,
                        transform: "translateY(-50%)",
                        width: "100%",
                        display: "flex",
                        justifyContent: "center"
                      }}
                    >
                      <TypeBadge type={type} size={isMobile ? "sm" : "md"} />
                    </div>
                  );
                })}
              </div>

              {/* ポケモンカード本体＆解答後の「次へ」ボタン */}
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <PokemonCard pokemon={currentQuestion.opp} size={isMobile ? "sm" : (isShortScreen ? "md" : "md")} showSprite={true} badgeSize="sm" />
                {isAnsMode && (
                  <button
                    onClick={handleNext}
                    className="btn-primary animate-pop-in"
                    style={{
                      padding: isMobile ? "6px 12px" : "8px 20px",
                      fontSize: isMobile ? "0.75rem" : "0.85rem",
                      width: "100%",
                      boxShadow: "0 0 10px rgba(6, 182, 212, 0.4)",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {questionIndex < 9 ? "次へ ➡" : "結果へ ➡"}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* 解答後の詳細な乗算計算プロセスの展開 (解体フィードバック) */}
        {isAnsMode && lastResult && (
          <div
            className={lastResult.isCorrect ? "glass-panel animate-pop-in" : "glass-panel animate-shake"}
            style={{
              padding: isShortScreen ? "8px 12px" : "12px 16px",
              backgroundColor: lastResult.isCorrect ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
              border: `1px solid ${lastResult.isCorrect ? "var(--success)" : "var(--error)"}`,
              boxShadow: `0 0 10px ${lastResult.isCorrect ? "var(--success-glow)" : "var(--error-glow)"}`,
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              flexShrink: 0
            }}
          >
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 900, color: lastResult.isCorrect ? "var(--success)" : "var(--error)" }}>
                {selectedType === null 
                  ? "⏰ 時間切れ！ (10秒超過ペナルティ)" 
                  : (lastResult.isCorrect 
                      ? `🎉 正解！ [解答時間: ${(lastResult.timeMs / 1000).toFixed(2)}秒]`
                      : "❌ 残念、不正解！ (10秒ペナルティ)"
                    )
                }
              </span>
            </div>

            {/* IRT即答評価 */}
            {lastResult.isCorrect && lastResult.timeMs > 2500 && (
              <div style={{ fontSize: "0.75rem", color: "var(--warning)", textAlign: "center", fontWeight: 600 }}>
                ⚠️ 2.5秒以内の「即答」にならなかったため、このタイプの弱点マトリクスの苦手度は低下しません。
              </div>
            )}

            {/* 計算プロセスの展開 */}
            <div style={{ fontSize: "0.75rem", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <strong style={{ color: "var(--text-secondary)" }}>💡 乗算計算プロセスの展開 (自己修正用):</strong>
              {currentQuestion.hand.map(type => {
                const isBest = currentQuestion.bestTypes.includes(type);
                const isSelected = selectedType === type;
                const formula = getMultBreakdownText(type, currentQuestion.opp.types);
                
                let textColor = "var(--text-secondary)";
                let bgStyle = "transparent";
                if (isBest) {
                  textColor = "var(--success)";
                  bgStyle = "rgba(16, 185, 129, 0.05)";
                } else if (isSelected) {
                  textColor = "var(--error)";
                  bgStyle = "rgba(239, 68, 68, 0.05)";
                }

                return (
                  <div key={`breakdown-${type}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 6px", borderRadius: "4px", backgroundColor: bgStyle }}>
                    <span style={{ color: textColor, fontWeight: isBest || isSelected ? 700 : 400 }}>{formula}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 800, color: isBest ? "var(--success)" : "var(--text-muted)" }}>
                      {isBest ? "【最大打点】" : ""}
                      {isSelected ? "【あなたの選択】" : ""}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 下部のボタンは上部に移動したため削除 */}
          </div>
        )}
      </div>
    );
  }

  if (gameState === "result") {
    const { score } = calculateFinalScore();

    return (
      <div className="glass-panel glow-card animate-fade-in" style={{ padding: isMobile ? "16px" : "32px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", flex: 1 }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 900, background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          🏁 リザルト：最大打点技選択 タイムアタック ({quizMode === "normal" ? "通常モード" : "エキスパートモード"})
        </h2>

        {/* スコア・タイム概要 */}
        <div style={{ display: "flex", gap: "24px", margin: "10px 0", flexWrap: "wrap", justifyContent: "center" }}>
          <div className="glass-panel" style={{ padding: "16px 24px", textAlign: "center", minWidth: "140px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>最終スコア</span>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--success)" }}>{score}</div>
          </div>
          <div className="glass-panel" style={{ padding: "16px 24px", textAlign: "center", minWidth: "140px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>実測の解答時間合計</span>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--accent-cyan)" }}>
              {results.reduce((sum, r) => sum + (r.selected ? r.timeMs : 10000), 0) / 1000} 秒
            </div>
          </div>
        </div>

        {/* 評価メッセージ */}
        <div style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 700, textAlign: "center", maxWidth: "480px" }}>
          {score >= 90 && "🏆 伝説級の計算力！タイプ相性を完全にマスターしています。"}
          {score >= 75 && score < 90 && "✨ エリートトレーナー！非常に速く正確な計算プロセスです。"}
          {score >= 50 && score < 75 && "👍 グッド！即答速度を高めることでさらにスコアを伸ばせます。"}
          {score < 50 && "📖 じっくり復習しましょう。解体プロセスを参考に誤答を克服！"}
        </div>

        {/* 解答履歴リスト */}
        <div style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px", overflowY: "auto", padding: "6px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)" }}>📋 10問の解答履歴内訳:</span>
          {results.map((r, idx) => (
            <div
              key={`res-row-${idx}`}
              className="glass-panel"
              style={{
                padding: "8px 12px",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                fontSize: "0.75rem",
                gap: isMobile ? "4px" : "8px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                <span style={{ fontWeight: 800, color: "var(--text-muted)", minWidth: "20px" }}>Q{idx + 1}</span>
                <span style={{ fontWeight: 700 }}>{r.opp.nameJa} ({r.opp.types.map(t => TYPE_DETAILS[t].ja).join("/")})</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isMobile ? "space-between" : "flex-end",
                  gap: isMobile ? "8px" : "12px",
                  width: isMobile ? "100%" : "auto",
                  paddingLeft: isMobile ? "28px" : "0",
                  color: "var(--text-secondary)",
                  boxSizing: "border-box"
                }}
              >
                <span>手札: {r.hand.map(t => TYPE_DETAILS[t].ja[0]).join(", ")}</span>
                <span>
                  選択:{" "}
                  {r.selected 
                    ? <strong style={{ color: r.isCorrect ? "var(--success)" : "var(--error)" }}>{TYPE_DETAILS[r.selected].ja}</strong> 
                    : <strong style={{ color: "var(--error)" }}>時間切れ</strong>
                  }
                </span>
                <span>時間: {(r.timeMs / 1000).toFixed(2)}s</span>
                <span style={{ fontSize: "0.85rem" }}>{r.isCorrect ? "🟢" : "❌"}</span>
              </div>
            </div>
          ))}
        </div>

        {/* アクションボタン */}
        <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
          <button onClick={startGame} className="btn-primary" style={{ padding: "10px 24px", width: "180px" }}>
            もう一度挑戦する！
          </button>
          <button onClick={() => setGameState("start")} className="btn-secondary" style={{ padding: "10px 24px", width: "180px" }}>
            スタート画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return null;
};
