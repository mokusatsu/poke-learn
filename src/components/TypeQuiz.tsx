import React, { useState, useEffect, useRef } from "react";
import { TYPE_DETAILS, getEffectiveness, computeInferredCoverage, isAsymmetricPair, PROGRESSIVE_TYPE_ORDER } from "../utils/typeMatrix";
import type { PokemonType } from "../utils/typeMatrix";
import { TypeBadge } from "./TypeBadge";
import { MaxPowerQuiz } from "./MaxPowerQuiz";
import { typeMatchupRationales } from "../data/typeMatchupRationales";


// クイズの出題形式
type QuizCategory =
  | "simple-offense"
  | "simple-defense"
  | "single-offense"
  | "single-defense"
  | "composite-offense"
  | "composite-defense"
  | "max-power";

type SimpleChoice = "double" | "normal" | "half" | "immune";

// 苦手克服データ用キー
const WEIGHTS_KEY = "poke-learn-quiz-weights";

const getCorrectSimpleChoice = (mult: number): SimpleChoice => {
  if (mult >= 2.0) return "double";
  if (mult === 1.0) return "normal";
  if (mult > 0.0 && mult < 1.0) return "half";
  return "immune";
};

export const TypeQuiz: React.FC = () => {
  const [category, setCategory] = useState<QuizCategory>("simple-offense");
  const [isFocusedMode, setIsFocusedMode] = useState<boolean>(false);
  const [showProgressPopover, setShowProgressPopover] = useState<boolean>(false);
  
  // 段階的タイプ学習用のステート (3〜18, localStorageで永続化)
  const [unlockedTypeCount, setUnlockedTypeCount] = useState<number>(() => {
    const saved = localStorage.getItem("poke-learn-unlocked-types");
    return saved ? Math.min(18, Math.max(3, parseInt(saved, 10))) : 3;
  });
  
  // タグチメソッド的網羅判定用の状態 (過去に正解したことのある攻撃-防御ペアキー)
  const [coveredPairs, setCoveredPairs] = useState<string[]>(() => {
    const saved = localStorage.getItem("poke-learn-covered-pairs");
    return saved ? JSON.parse(saved) : [];
  });

  // 出題状態
  const [questionType, setQuestionType] = useState<PokemonType | null>(null);
  const [questionComposite, setQuestionComposite] = useState<[PokemonType, PokemonType] | null>(null);
  
  // シンプル相性用出題状態
  const [simpleAtkType, setSimpleAtkType] = useState<PokemonType | null>(null);
  const [simpleDefType, setSimpleDefType] = useState<PokemonType | null>(null);
  
  // ユーザーの選択
  const [selectedTypes, setSelectedTypes] = useState<PokemonType[]>([]);
  const [selected4xTypes, setSelected4xTypes] = useState<PokemonType[]>([]);
  const [selected2xTypes, setSelected2xTypes] = useState<PokemonType[]>([]);
  const [selectedSimpleAns, setSelectedSimpleAns] = useState<SimpleChoice | null>(null);

  // クイズ回答状態
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  
  // 新規アンロックされた時の演出用
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);
  
  // 考察表示用ステート
  const [selectedRationaleType, setSelectedRationaleType] = useState<PokemonType | null>(null);
  const [rationaleImageError, setRationaleImageError] = useState<boolean>(false);
  
  // 統計
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const lastQuestionKeyRef = useRef<string>("");

  const activeTypes = PROGRESSIVE_TYPE_ORDER.slice(0, unlockedTypeCount);

  // 知識伝播・推論を含めたカバー率の計算
  const activeSet = new Set(activeTypes);
  const coverageResult = computeInferredCoverage(coveredPairs, activeTypes);
  const activeCoveredCount = coverageResult.activeCoveredCount;
  const totalPossiblePairs = coverageResult.totalPossiblePairs;
  const coveragePercent = coverageResult.coveragePercent;

  // 内訳の計算
  const activeDirectPairsCount = coveredPairs.filter(p => {
    const [atk, def] = p.split("-") as PokemonType[];
    return activeSet.has(atk) && activeSet.has(def);
  }).length;
  const inferredPairsCount = activeCoveredCount - activeDirectPairsCount;

  // 出題タイプ（単一、複合、またはシンプル）の重み付け抽選
  const generateQuestion = () => {
    if (category === "max-power") return;
    setIsAnswered(false);
    setSelectedTypes([]);
    setSelected4xTypes([]);
    setSelected2xTypes([]);
    setSelectedSimpleAns(null);
    setJustUnlocked(null);
    setSelectedRationaleType(null);
    setRationaleImageError(false);


    // localStorageから重みを取得
    const weightsRaw = localStorage.getItem(WEIGHTS_KEY);
    const weights: Record<string, number> = weightsRaw ? JSON.parse(weightsRaw) : {};

    let attempts = 0;
    const maxAttempts = 20;

    if (category.startsWith("simple-")) {
      // シンプル相性クイズ：現在有効なタイププールからウェイト付きで攻撃・受けのペアを選択
      const candidates: { atk: PokemonType; def: PokemonType; weight: number }[] = [];
      
      for (const atk of activeTypes) {
        for (const def of activeTypes) {
          const key = `${atk}-${def}`;
          let weight = 1.0;
          
          // 未カバーの非対称ペアはウェイトを2倍にする（逆ペナルティ）
          const isCovered = coveredPairs.includes(key);
          if (!isCovered && isAsymmetricPair(atk, def)) {
            weight *= 2.0;
          }
          
          // 苦手克服モードがONの場合、誤答履歴に基づく重みを追加
          if (isFocusedMode && weights[key]) {
            weight += weights[key] * 2.0;
          }
          
          candidates.push({ atk, def, weight });
        }
      }
      
      // 重複回避付きでルーレット選択
      let selectedPair = candidates[0] || { atk: activeTypes[0], def: activeTypes[0] };
      let questionKey = "";
      
      do {
        const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
        let randomNum = Math.random() * totalWeight;
        
        for (const c of candidates) {
          randomNum -= c.weight;
          if (randomNum <= 0) {
            selectedPair = c;
            break;
          }
        }
        questionKey = `${category}:${selectedPair.atk}-${selectedPair.def}`;
        attempts++;
      } while (
        questionKey === lastQuestionKeyRef.current && 
        attempts < maxAttempts && 
        activeTypes.length > 1
      );

      lastQuestionKeyRef.current = questionKey;
      setSimpleAtkType(selectedPair.atk);
      setSimpleDefType(selectedPair.def);
      setQuestionType(null);
      setQuestionComposite(null);
    } else if (category.startsWith("single-")) {
      let selectedType: PokemonType = activeTypes[0];
      let questionKey = "";
      do {
        if (isFocusedMode && Object.keys(weights).length > 0) {
          // 苦手克服モード: 誤答数の多いタイプほど当選確率を高める (アクティブプール内に制限)
          const candidates = activeTypes.map(t => ({
            type: t,
            weight: (weights[t] || 0) + 1,
          }));
          const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
          let randomNum = Math.random() * totalWeight;
          
          selectedType = activeTypes[0];
          for (const c of candidates) {
            randomNum -= c.weight;
            if (randomNum <= 0) {
              selectedType = c.type;
              break;
            }
          }
        } else {
          selectedType = activeTypes[Math.floor(Math.random() * activeTypes.length)];
        }
        questionKey = `${category}:${selectedType}`;
        attempts++;
      } while (
        questionKey === lastQuestionKeyRef.current && 
        attempts < maxAttempts && 
        activeTypes.length > 1
      );

      lastQuestionKeyRef.current = questionKey;
      setQuestionType(selectedType);
      setQuestionComposite(null);
      setSimpleAtkType(null);
      setSimpleDefType(null);
    } else {
      // 複合タイプ (アクティブプールから2つの異なるタイプを選択)
      const composites: [PokemonType, PokemonType][] = [];
      for (let i = 0; i < activeTypes.length; i++) {
        for (let j = i + 1; j < activeTypes.length; j++) {
          composites.push([activeTypes[i], activeTypes[j]]);
        }
      }

      let selectedComp: [PokemonType, PokemonType] = [activeTypes[0], activeTypes[1] || activeTypes[0]];
      let questionKey = "";

      do {
        if (composites.length === 0) {
          // フォールバック
          selectedComp = [activeTypes[0], activeTypes[1] || activeTypes[0]];
        } else if (isFocusedMode && Object.keys(weights).length > 0) {
          const candidates = composites.map(c => {
            const keyName = `${c[0]}-${c[1]}`;
            const failCount = (weights[keyName] || 0) + (weights[c[0]] || 0) + (weights[c[1]] || 0);
            return { comp: c, weight: failCount + 1 };
          });

          const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
          let randomNum = Math.random() * totalWeight;
          
          selectedComp = composites[0];
          for (const c of candidates) {
            randomNum -= c.weight;
            if (randomNum <= 0) {
              selectedComp = c.comp;
              break;
            }
          }
        } else {
          selectedComp = composites[Math.floor(Math.random() * composites.length)];
        }
        questionKey = `${category}:${selectedComp[0]}-${selectedComp[1]}`;
        attempts++;
      } while (
        questionKey === lastQuestionKeyRef.current && 
        attempts < maxAttempts && 
        (composites.length > 1 || (composites.length === 0 && activeTypes.length > 1))
      );

      lastQuestionKeyRef.current = questionKey;
      setQuestionComposite(selectedComp);
      setQuestionType(null);
      setSimpleAtkType(null);
      setSimpleDefType(null);
    }
  };

  // カテゴリや出題モード、有効タイプ数が切り替わったら再出題
  useEffect(() => {
    if (isAnswered) return;
    generateQuestion();
  }, [category, isFocusedMode, unlockedTypeCount]);

  // クイズの正解データを計算 (アクティブなタイププール内に制限)
  const getAnswers = () => {
    if (category === "single-offense" && questionType) {
      return activeTypes.filter(t => getEffectiveness(questionType, [t]) === 2.0);
    }
    if (category === "single-defense" && questionType) {
      return activeTypes.filter(t => getEffectiveness(t, [questionType]) === 2.0);
    }
    if (category === "composite-offense" && questionComposite) {
      const answers4x = activeTypes.filter(t => getEffectiveness(t, questionComposite) === 4.0);
      const answers2x = activeTypes.filter(t => getEffectiveness(t, questionComposite) === 2.0);
      return { answers4x, answers2x };
    }
    if (category === "composite-defense" && questionComposite) {
      const answers4x = activeTypes.filter(t => getEffectiveness(t, questionComposite) === 4.0);
      const answers2x = activeTypes.filter(t => getEffectiveness(t, questionComposite) === 2.0);
      return { answers4x, answers2x };
    }
    
    if (category.startsWith("single-")) {
      return [];
    } else {
      return { answers4x: [], answers2x: [] };
    }
  };

  // 手動でタイプ数を変更した際の処理
  const handleManualTypeCountChange = (count: number) => {
    const safeCount = Math.min(18, Math.max(3, count));
    setUnlockedTypeCount(safeCount);
    setIsAnswered(false);
    localStorage.setItem("poke-learn-unlocked-types", safeCount.toString());
  };

  // 網羅ペア全リセット（開発・再チャレンジ用）
  const handleResetProgress = () => {
    if (window.confirm("これまでの網羅データをリセットして、初期の3タイプ（ほのお・みず・くさ）からやり直しますか？")) {
      setUnlockedTypeCount(3);
      setCoveredPairs([]);
      localStorage.setItem("poke-learn-unlocked-types", "3");
      localStorage.setItem("poke-learn-covered-pairs", JSON.stringify([]));
    }
  };

  // 単一回答のトグル
  const handleTypeToggle = (type: PokemonType) => {
    if (isAnswered) return;
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // 複合回答のトグル
  const handleCompositeToggle = (type: PokemonType, level: "4x" | "2x") => {
    if (isAnswered) return;
    if (level === "4x") {
      setSelected2xTypes(prev => prev.filter(t => t !== type));
      setSelected4xTypes(prev =>
        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
      );
    } else {
      setSelected4xTypes(prev => prev.filter(t => t !== type));
      setSelected2xTypes(prev =>
        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
      );
    }
  };

  // 回答送信
  const handleSubmit = (customSimpleAns?: SimpleChoice) => {
    if (isAnswered) return;

    const finalSimpleAns = customSimpleAns || selectedSimpleAns;
    if (category.startsWith("simple-") && !finalSimpleAns) return;

    let correct = false;
    const weightsRaw = localStorage.getItem(WEIGHTS_KEY);
    const weights: Record<string, number> = weightsRaw ? JSON.parse(weightsRaw) : {};

    let key = "";
    if (questionType) key = questionType;
    else if (questionComposite) key = `${questionComposite[0]}-${questionComposite[1]}`;
    else if (simpleAtkType && simpleDefType) key = `${simpleAtkType}-${simpleDefType}`;

    if (category.startsWith("simple-")) {
      const mult = getEffectiveness(simpleAtkType!, [simpleDefType!]);
      const correctChoice = getCorrectSimpleChoice(mult);
      correct = finalSimpleAns === correctChoice;
    } else if (category.startsWith("single-")) {
      const answers = getAnswers() as PokemonType[];
      correct =
        selectedTypes.length === answers.length &&
        selectedTypes.every(t => answers.includes(t));
    } else {
      const { answers4x, answers2x } = getAnswers() as { answers4x: PokemonType[]; answers2x: PokemonType[] };
      const match4x =
        selected4xTypes.length === answers4x.length &&
        selected4xTypes.every(t => answers4x.includes(t));
      const match2x =
        selected2xTypes.length === answers2x.length &&
        selected2xTypes.every(t => answers2x.includes(t));
      correct = match4x && match2x;
    }

    setIsCorrect(correct);
    setIsAnswered(true);
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));

    if (correct) {
      // 網羅データを更新 (Taguchi-method的マトリックス判定)
      const newPairs = [...coveredPairs];
      let addedAny = false;

      const addPair = (atk: PokemonType, def: PokemonType) => {
        const pairKey = `${atk}-${def}`;
        if (!newPairs.includes(pairKey)) {
          newPairs.push(pairKey);
          addedAny = true;
        }
      };

      if (category.startsWith("simple-")) {
        addPair(simpleAtkType!, simpleDefType!);
      } else if (category.startsWith("single-")) {
        // 単一タイプクイズに正解した場合、そのタイプに関連する全てのアクティブペアをカバーしたとみなす
        if (category === "single-offense") {
          activeTypes.forEach(t => addPair(questionType!, t));
        } else {
          activeTypes.forEach(t => addPair(t, questionType!));
        }
      } else {
        // 複合タイプクイズに正解した場合、アクティブ攻撃タイプと複合ターゲット間の相性をカバー
        const comp = questionComposite!;
        activeTypes.forEach(t => {
          addPair(t, comp[0]);
          addPair(t, comp[1]);
        });
      }

      if (addedAny) {
        setCoveredPairs(newPairs);
        localStorage.setItem("poke-learn-covered-pairs", JSON.stringify(newPairs));

        // 更新後のプール内でのカバー情報を再計算
        const nextCoverageResult = computeInferredCoverage(newPairs, activeTypes);

        if (nextCoverageResult.isComplete && unlockedTypeCount < 18) {
          // 次のタイプを自動解放！
          const nextType = PROGRESSIVE_TYPE_ORDER[unlockedTypeCount];
          const nextCount = unlockedTypeCount + 1;
          localStorage.setItem("poke-learn-unlocked-types", nextCount.toString());
          setUnlockedTypeCount(nextCount);
          setJustUnlocked(TYPE_DETAILS[nextType]?.ja || nextType);
        }
      }

      // 苦手履歴の軽減
      if (key && weights[key]) {
        weights[key] = Math.max(0, weights[key] - 1);
      }
    } else {
      // 苦手履歴の加算
      if (key) {
        weights[key] = (weights[key] || 0) + 2;
      }
    }
    localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
  };

  // レンダリング用の単タイプ正答
  const correctSingleAnswers = category.startsWith("single-") ? (getAnswers() as PokemonType[]) : [];
  // レンダリング用の複合タイプ正答
  const { answers4x: correct4x, answers2x: correct2x } = !category.startsWith("single-") && !category.startsWith("simple-") && category !== "max-power"
    ? (getAnswers() as { answers4x: PokemonType[]; answers2x: PokemonType[] })
    : { answers4x: [], answers2x: [] };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
      
      {/* サブナビゲーションとトグル */}
      <div className="glass-panel" style={{ padding: "6px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
        {/* 出題形式セレクタ (モバイル用) */}
        <div className="mobile-only" style={{ flex: 1 }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as QuizCategory)}
            style={{
              width: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid var(--border-glass-active)",
              color: "var(--text-primary)",
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: "bold",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="simple-offense">🎯 攻撃側 (シンプル)</option>
            <option value="simple-defense">🛡️ 防御側 (シンプル)</option>
            <option value="single-offense">🔥 攻撃側 (単)</option>
            <option value="single-defense">💎 防御側 (単)</option>
            <option value="composite-offense">⚡ 攻撃側 (複合)</option>
            <option value="composite-defense">🌪️ 防御側 (複合)</option>
            <option value="max-power">🏆 最大打点技選択 (10問TA)</option>
          </select>
        </div>

        {/* 出題形式セレクタ (PC用) */}
        <div className="desktop-only" style={{ gap: "4px", flexWrap: "wrap" }}>
          {(
            [
              { id: "simple-offense", name: "攻撃側 (simple)" },
              { id: "simple-defense", name: "防御側 (simple)" },
              { id: "single-offense", name: "攻撃側 (単)" },
              { id: "single-defense", name: "防御側 (単)" },
              { id: "composite-offense", name: "攻撃側 (複合)" },
              { id: "composite-defense", name: "防御側 (複合)" },
              { id: "max-power", name: "最大打点技選択 (10問TA)" },
            ] as const
          ).map(btn => (
            <button
              key={btn.id}
              onClick={() => setCategory(btn.id)}
              className="tab-btn"
              style={{
                fontSize: "0.75rem",
                padding: "4px 8px",
                backgroundColor: category === btn.id ? "rgba(255, 255, 255, 0.08)" : "transparent",
                border: category === btn.id ? "1px solid var(--border-glass-active)" : "1px solid transparent",
              }}
            >
              {btn.name}
            </button>
          ))}
        </div>

        {/* 苦手克服トグル */}
        {category !== "max-power" && (
          <label className="toggle-switch" style={{ flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={isFocusedMode}
              onChange={(e) => setIsFocusedMode(e.target.checked)}
              style={{ display: "none" }}
            />
            <div className="toggle-bg" style={{ width: "36px", height: "18px" }}>
              <div className="toggle-circle" style={{ width: "14px", height: "14px", left: isFocusedMode ? "20px" : "2px" }}></div>
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: isFocusedMode ? "var(--accent-cyan)" : "var(--text-secondary)" }}>
              苦手克服
            </span>
          </label>
        )}
      </div>

      {/* 段階的タイプ学習コントロールパネル */}
      {category !== "max-power" && (
        <>
          {/* モバイル用表示 (バッジ＆設定ポップオーバー) */}
          <div className="mobile-only" style={{ flexDirection: "column", width: "100%" }}>
            <button
              onClick={() => setShowProgressPopover(!showProgressPopover)}
              className="tab-btn glow-card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 12px",
                fontSize: "0.8rem",
                width: "100%",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                borderColor: showProgressPopover ? "var(--accent-cyan)" : "var(--border-glass-active)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📚 段階的学習:</span>
                <strong style={{ color: "var(--accent-cyan)" }}>Lv.{unlockedTypeCount}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📊 網羅率: <strong style={{ color: coveragePercent === 100 ? "var(--success)" : "var(--accent-cyan)" }}>{coveragePercent}%</strong></span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{showProgressPopover ? "▲ 閉じる" : "▼ 設定"}</span>
              </div>
            </button>

            {showProgressPopover && (
              <div className="glass-panel animate-pop-in" style={{
                padding: "10px 14px",
                marginTop: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "0.8rem",
                backgroundColor: "rgba(10, 15, 30, 0.95)",
                border: "1px solid var(--border-glass-active)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                width: "100%",
                boxSizing: "border-box"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 800 }}>解放タイプ数（レベル）:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      onClick={() => handleManualTypeCountChange(unlockedTypeCount - 1)}
                      disabled={unlockedTypeCount <= 3}
                      className="tab-btn"
                      style={{ padding: "2px 8px", fontSize: "0.75rem" }}
                    >
                      -
                    </button>
                    <strong style={{ color: "var(--accent-cyan)", minWidth: "16px", textAlign: "center" }}>{unlockedTypeCount}</strong>
                    <button
                      onClick={() => handleManualTypeCountChange(unlockedTypeCount + 1)}
                      disabled={unlockedTypeCount >= 18}
                      className="tab-btn"
                      style={{ padding: "2px 8px", fontSize: "0.75rem" }}
                    >
                      +
                    </button>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>/18</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "6px", width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>実効カバー率 (推論込):</span>
                    <strong style={{ color: "var(--accent-cyan)" }}>{coveragePercent}% ({activeCoveredCount}/{totalPossiblePairs})</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", color: "var(--text-secondary)", paddingLeft: "8px" }}>
                    <span>└ 直接解答:</span>
                    <span>{activeDirectPairsCount} ペア</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", color: "var(--text-secondary)", paddingLeft: "8px" }}>
                    <span>└ 推論伝播:</span>
                    <span>{inferredPairsCount} ペア</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>特徴的相性 (非等倍):</span>
                  <strong>{coverageResult.characteristicCoveredCount} / {coverageResult.characteristicCount}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>非対称相性 (要直接回答):</span>
                  <strong style={{ color: coverageResult.asymmetricCoveredCount === coverageResult.asymmetricCount ? "var(--success)" : "var(--accent-cyan)" }}>
                    {coverageResult.asymmetricCoveredCount} / {coverageResult.asymmetricCount}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>次に解放されるタイプ:</span>
                  {unlockedTypeCount < 18 ? (
                    <strong style={{ color: "var(--accent-violet)" }}>
                      {TYPE_DETAILS[PROGRESSIVE_TYPE_ORDER[unlockedTypeCount]]?.ja}
                    </strong>
                  ) : (
                    <span style={{ color: "var(--success)", fontWeight: 700 }}>🎉 全解放済み！</span>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                  <button 
                    onClick={() => {
                      handleResetProgress();
                      setShowProgressPopover(false);
                    }} 
                    className="tab-btn" 
                    style={{ fontSize: "0.7rem", padding: "2px 8px", borderColor: "rgba(239, 68, 68, 0.4)", color: "rgba(239, 68, 68, 0.9)" }}
                  >
                    進捗を初期化する
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PC用表示 (1行フラットパネル) */}
          <div className="desktop-only" style={{ padding: "6px 16px", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", gap: "8px", width: "100%", borderRadius: "8px", backgroundColor: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-glass)", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>段階的学習:</span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  onClick={() => handleManualTypeCountChange(unlockedTypeCount - 1)}
                  disabled={unlockedTypeCount <= 3}
                  className="tab-btn"
                  style={{ padding: "1px 5px", fontSize: "0.75rem", minWidth: "16px" }}
                >
                  -
                </button>
                <strong style={{ color: "var(--accent-cyan)", minWidth: "14px", textAlign: "center" }}>{unlockedTypeCount}</strong>
                <button
                  onClick={() => handleManualTypeCountChange(unlockedTypeCount + 1)}
                  disabled={unlockedTypeCount >= 18}
                  className="tab-btn"
                  style={{ padding: "1px 5px", fontSize: "0.75rem", minWidth: "16px" }}
                >
                  +
                </button>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>/18</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span>📊 網羅率 (推論込):</span>
                <span style={{ fontWeight: 700, color: coveragePercent === 100 ? "var(--success)" : "var(--accent-cyan)" }}>
                  {coveragePercent}%
                </span>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                  ({activeCoveredCount}/{totalPossiblePairs})
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", gap: "10px" }}>
                <span>[直接: {activeDirectPairsCount} / 推論: {inferredPairsCount}]</span>
                <span>特徴的: {coverageResult.characteristicCoveredCount}/{coverageResult.characteristicCount}</span>
                <span>非対称: {coverageResult.asymmetricCoveredCount}/{coverageResult.asymmetricCount}</span>
              </div>
            </div>

            {unlockedTypeCount < 18 ? (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ color: "var(--text-secondary)" }}>次:</span>
                <strong style={{ color: "var(--accent-violet)" }}>
                  {TYPE_DETAILS[PROGRESSIVE_TYPE_ORDER[unlockedTypeCount]]?.ja}
                </strong>
              </div>
            ) : (
              <span style={{ color: "var(--success)", fontWeight: 700 }}>🎉 コンプリート！</span>
            )}

            <button 
              onClick={handleResetProgress} 
              className="tab-btn" 
              style={{ fontSize: "0.7rem", padding: "1px 6px", borderColor: "rgba(239, 68, 68, 0.3)", color: "rgba(239, 68, 68, 0.7)" }}
            >
              リセット
            </button>
          </div>
        </>
      )}

      {/* 新規解放のトースト通知 */}
      {category !== "max-power" && justUnlocked && (
        <div className="glass-panel animate-fade-in" style={{
          padding: "6px",
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          border: "1px solid var(--success)",
          boxShadow: "0 0 10px var(--success-glow)",
          borderRadius: "8px",
          textAlign: "center",
          fontSize: "0.8rem"
        }}>
          <strong style={{ color: "var(--success)" }}>
            ✨ 新しく「{justUnlocked}タイプ」がプールに追加されました！
          </strong>
        </div>
      )}

      {/* クイズボード本体 */}
      {category === "max-power" ? (
        <MaxPowerQuiz />
      ) : (
        <div 
          className={`glass-panel glow-card ${isAnswered ? (isCorrect ? "animate-pop-in" : "animate-shake") : ""}`} 
          style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", flex: 1, justifyContent: "center" }}
        >
        
        {/* スコア・正答率 */}
        <div style={{ alignSelf: "flex-end", fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", gap: "10px", marginTop: "-4px" }}>
          <span>正答数: <strong style={{ color: "var(--success)" }}>{score.correct}</strong> / {score.total}</span>
          {score.total > 0 && (
            <span>正答率: <strong>{Math.round((score.correct / score.total) * 100)}%</strong></span>
          )}
        </div>

        {/* 問題のヘッダー */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
            {category === "simple-offense" && "シンプル相性 - 攻撃側倍率判定"}
            {category === "simple-defense" && "シンプル相性 - 防御側倍率判定"}
            {category === "single-offense" && "攻撃相性 - ばつぐん選択"}
            {category === "single-defense" && "防御相性 - 弱点選択"}
            {category === "composite-offense" && "攻撃相性 - 4倍・2倍の攻撃判定"}
            {category === "composite-defense" && "防御相性 - 4倍・2倍の弱点判定"}
          </span>

          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginTop: "2px" }}>
            {category === "simple-offense" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                {/* <span>タイプ一致</span> */}
                {simpleAtkType && <TypeBadge type={simpleAtkType} size="md" />}
                <span>技で</span>
                {simpleDefType && <TypeBadge type={simpleDefType} size="md" />}
                <span>を攻撃したときの効果は？</span>
              </div>
            )}
            {category === "simple-defense" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                {/* <span>防御側が</span> */}
                {simpleDefType && <TypeBadge type={simpleDefType} size="md" />}
                <span>タイプが</span>
                {simpleAtkType && <TypeBadge type={simpleAtkType} size="md" />}
                <span>技を受けたときの効果は？</span>
              </div>
            )}
            {category === "single-offense" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                {/* <span>タイプ一致</span>  */}
                {questionType && <TypeBadge type={questionType} size="md" />}
                <span>技が<strong>ばつぐん</strong>になる相手は？</span>
              </div>
            )}
            {category === "single-defense" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                {/* <span>防御側が</span> */}
                {questionType && <TypeBadge type={questionType} size="md" />}
                <span>タイプに<strong>ばつぐん</strong>な攻撃は？</span>
              </div>
            )}
            {category === "composite-offense" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                {/* <span>防御側が</span> */}
                {questionComposite && (
                  <>
                    <TypeBadge type={questionComposite[0]} size="md" />
                    {/* <span>・</span> */}
                    <TypeBadge type={questionComposite[1]} size="md" />
                  </>
                )}
                <span>にばつぐんの攻撃は？</span>
              </div>
            )}
            {category === "composite-defense" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                {/* <span>タイプが</span> */}
                {questionComposite && (
                  <>
                    <TypeBadge type={questionComposite[0]} size="md" />
                    {/* <span>・</span> */}
                    <TypeBadge type={questionComposite[1]} size="md" />
                  </>
                )}
                <span>ポケモンの弱点は？</span>
              </div>
            )}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
            {category.startsWith("simple-") 
              ? "正しい相性倍率を選択で回答が確定" 
              : isAnswered && !isCorrect 
                ? "💡 タイプバッジをクリックすると相性の覚え方が表示されます"
                : "※当てはまるタイプを全て選択。該当なしは未選択で決定"}
          </p>
        </div>

        <hr style={{ width: "100%", border: "none", borderTop: "1px solid var(--border-glass)", margin: "4px 0" }} />

        {/* 1. シンプルクイズ選択肢エリア (4x1横並びスリムレイアウト) */}
        {category.startsWith("simple-") && simpleAtkType && simpleDefType && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "600px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {(
                [
                  { id: "double", label: "ばつぐん", desc: "2倍", color: "var(--success)" },
                  { id: "normal", label: "こうかあり", desc: "1倍", color: "var(--text-primary)" },
                  { id: "half", label: "いまひとつ", desc: "0.5倍", color: "var(--accent-cyan)" },
                  { id: "immune", label: "こうかなし", desc: "0倍", color: "var(--error)" }
                ] as const
              ).map(opt => {
                const isSelected = selectedSimpleAns === opt.id;
                const correctChoice = getCorrectSimpleChoice(getEffectiveness(simpleAtkType, [simpleDefType]));
                const isAns = opt.id === correctChoice;

                let bg = "rgba(18, 20, 32, 0.4)";
                let border = "1px solid var(--border-glass)";
                let shadow = "none";

                if (isAnswered) {
                  if (isAns) {
                    bg = "rgba(16, 185, 129, 0.25)";
                    border = "2px solid var(--success)";
                    shadow = "0 0 10px rgba(16, 185, 129, 0.3)";
                  } else if (isSelected) {
                    bg = "rgba(239, 68, 68, 0.2)";
                    border = "2px solid var(--error)";
                    shadow = "0 0 10px rgba(239, 68, 68, 0.25)";
                  } else {
                    bg = "rgba(18, 20, 32, 0.15)";
                    border = "1px solid rgba(255, 255, 255, 0.03)";
                  }
                } else if (isSelected) {
                  bg = "rgba(255, 255, 255, 0.08)";
                  border = "2px solid var(--accent-cyan)";
                  shadow = "0 0 10px rgba(6, 182, 212, 0.2)";
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (!isAnswered) {
                        setSelectedSimpleAns(opt.id);
                        handleSubmit(opt.id);
                      }
                    }}
                    disabled={isAnswered}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "2px",
                      padding: "8px 4px",
                      borderRadius: "8px",
                      backgroundColor: bg,
                      border,
                      cursor: isAnswered ? "default" : "pointer",
                      boxShadow: shadow,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ fontSize: "0.95rem", fontWeight: 800, color: opt.color }}>{opt.label}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. タイプ選択エリア (単タイプ用：9列×2行スリムレイアウト) */}
        {category.startsWith("single-") && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "6px", width: "100%", maxWidth: "700px" }}>
            {activeTypes.map(type => {
              const isSelected = selectedTypes.includes(type);
              const isAns = correctSingleAnswers.includes(type);
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
                  onClick={() => {
                    if (isAnswered) {
                      setSelectedRationaleType(type);
                      setRationaleImageError(false);
                    } else {
                      handleTypeToggle(type);
                    }
                  }}
                  style={{
                    backgroundColor: bg,
                    border,
                    borderRadius: "6px",
                    padding: "6px 0",
                    color: (isSelected && (!isAnswered || isAns)) ? detail.textColor : "var(--text-primary)",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    boxShadow: shadow,
                    transition: "all 0.15s ease",
                    opacity,
                  }}
                >
                  {textPrefix}{detail.ja}{isAnswered && !isCorrect && " 💡"}
                </button>
              );
            })}
          </div>
        )}

        {/* 3. タイプ選択エリア (複合タイプ用：4倍・2倍の分別選択) */}
        {!category.startsWith("single-") && !category.startsWith("simple-") && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
            
            {/* 4倍弱点/抜群エリア */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🎯 ちょうばつぐん（4x）</span>
                {isAnswered && <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>（正解: {correct4x.map(t => TYPE_DETAILS[t].ja).join(", ") || "なし"}）</span>}
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", padding: "6px 12px", background: "rgba(0,0,0,0.15)", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                {activeTypes.map(type => {
                  const isSelected = selected4xTypes.includes(type);
                  const isAns = correct4x.includes(type);
                  const detail = TYPE_DETAILS[type];

                  let customStyle = {};
                  if (isAnswered) {
                    if (isAns) {
                      if (isSelected) {
                        customStyle = {
                          backgroundColor: detail.color,
                          border: "2px solid var(--success)",
                          boxShadow: `0 0 10px ${detail.glowColor}`,
                          opacity: 1
                        };
                      } else {
                        customStyle = {
                          backgroundColor: "rgba(0, 0, 0, 0.4)",
                          border: `2px dashed ${detail.color}`,
                          boxShadow: "none",
                          opacity: 0.8,
                          color: "var(--text-primary)"
                        };
                      }
                    } else if (isSelected) {
                      customStyle = {
                        backgroundColor: "rgba(239, 68, 68, 0.4)",
                        border: "2px solid var(--error)",
                        boxShadow: "0 0 10px var(--error-glow)",
                        opacity: 1,
                        color: "var(--text-primary)"
                      };
                    } else {
                      customStyle = {
                        opacity: 0.45,
                        border: "1px solid rgba(255,255,255,0.02)"
                      };
                    }
                  }

                  return (
                    <TypeBadge
                      key={`4x-${type}`}
                      type={type}
                      size="sm"
                      clickable={true}
                      selected={isSelected}
                      onClick={() => {
                        if (isAnswered) {
                          setSelectedRationaleType(type);
                          setRationaleImageError(false);
                        } else {
                          handleCompositeToggle(type, "4x");
                        }
                      }}
                      style={customStyle}
                    />
                  );
                })}
              </div>
            </div>

            {/* 2倍弱点/抜群エリア */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-violet)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>⚡ ばつぐん（2x）</span>
                {isAnswered && <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>（正解: {correct2x.map(t => TYPE_DETAILS[t].ja).join(", ") || "なし"}）</span>}
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", padding: "6px 12px", background: "rgba(0,0,0,0.15)", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                {activeTypes.map(type => {
                  const isSelected = selected2xTypes.includes(type);
                  const isAns = correct2x.includes(type);
                  const detail = TYPE_DETAILS[type];

                  let customStyle = {};
                  if (isAnswered) {
                    if (isAns) {
                      if (isSelected) {
                        customStyle = {
                          backgroundColor: detail.color,
                          border: "2px solid var(--success)",
                          boxShadow: `0 0 10px ${detail.glowColor}`,
                          opacity: 1
                        };
                      } else {
                        customStyle = {
                          backgroundColor: "rgba(0, 0, 0, 0.4)",
                          border: `2px dashed ${detail.color}`,
                          boxShadow: "none",
                          opacity: 0.8,
                          color: "var(--text-primary)"
                        };
                      }
                    } else if (isSelected) {
                      customStyle = {
                        backgroundColor: "rgba(239, 68, 68, 0.4)",
                        border: "2px solid var(--error)",
                        boxShadow: "0 0 10px var(--error-glow)",
                        opacity: 1,
                        color: "var(--text-primary)"
                      };
                    } else {
                      customStyle = {
                        opacity: 0.45,
                        border: "1px solid rgba(255,255,255,0.02)"
                      };
                    }
                  }

                  return (
                    <TypeBadge
                      key={`2x-${type}`}
                      type={type}
                      size="sm"
                      clickable={true}
                      selected={isSelected}
                      onClick={() => {
                        if (isAnswered) {
                          setSelectedRationaleType(type);
                          setRationaleImageError(false);
                        } else {
                          handleCompositeToggle(type, "2x");
                        }
                      }}
                      style={customStyle}
                    />
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* 結果表示＆フィードバック */}
        {isAnswered && (
          <div
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "8px",
              backgroundColor: isCorrect ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
              border: `1px solid ${isCorrect ? "var(--success)" : "var(--error)"}`,
              boxShadow: `0 0 10px ${isCorrect ? "var(--success-glow)" : "var(--error-glow)"}`,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <span style={{ fontSize: "1.05rem", fontWeight: 800, color: isCorrect ? "var(--success)" : "var(--error)" }}>
              {isCorrect ? "🎉 正解！お見事です！" : "❌ 不正解です。正解の相性を確認しましょう。"}
            </span>

            {/* 解説 */}
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              {category.startsWith("simple-") ? (
                <>
                  正解の倍率は:{" "}
                  <strong>
                    {simpleAtkType && simpleDefType && (() => {
                      const mult = getEffectiveness(simpleAtkType, [simpleDefType]);
                      const labelMap = {
                        double: "ばつぐん (2倍)",
                        normal: "こうかあり (1倍)",
                        half: "いまひとつ (0.5倍)",
                        immune: "無効 (0倍)"
                      };
                      return `${mult}x (${labelMap[getCorrectSimpleChoice(mult)]})`;
                    })()}
                  </strong>
                </>
              ) : category.startsWith("single-") ? (
                <>
                  正解のタイプ:{" "}
                  <strong>
                    {correctSingleAnswers.map(t => TYPE_DETAILS[t].ja).join(", ") || "該当なし"}
                  </strong>
                </>
              ) : (
                <>
                  正解: 【4倍】
                  <strong>
                    {correct4x.map(t => TYPE_DETAILS[t].ja).join(", ") || "なし"}
                  </strong>{" "}
                  / 【2倍】
                  <strong>
                    {correct2x.map(t => TYPE_DETAILS[t].ja).join(", ") || "なし"}
                  </strong>
                </>
              )}
            </span>
          </div>
        )}

        {/* シンプル相性クイズで不正解だった場合の「相性の覚え方」 */}
        {category.startsWith("simple-") && isAnswered && !isCorrect && simpleAtkType && simpleDefType && (
          <div className="glass-panel" style={{ marginTop: "4px", padding: "12px", border: "1px solid var(--border-glass-active)", width: "100%", display: "flex", flexDirection: "column", gap: "8px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "6px" }}>
              <span style={{ fontSize: "1rem" }}>💡</span>
              <strong style={{ fontSize: "0.85rem", color: "var(--accent-cyan)" }}>相性の覚え方</strong>
            </div>
            
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap-reverse" }}>
              {/* 画像エリア */}
              {!rationaleImageError && (
                <div style={{ flex: "0 0 160px", maxWidth: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.1)", backgroundColor: "rgba(0,0,0,0.2)" }}>
                  <img
                    src={`/images/matchup-rationales/${simpleAtkType}-${simpleDefType}.png`}
                    alt={`${TYPE_DETAILS[simpleAtkType].ja} から ${TYPE_DETAILS[simpleDefType].ja} への相性`}
                    onError={() => setRationaleImageError(true)}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </div>
              )}
              
              {/* 考察テキスト */}
              <div style={{ flex: 1, minWidth: "200px" }}>
                <p style={{ fontSize: "0.8rem", lineHeight: "1.45", margin: 0, color: "var(--text-primary)" }}>
                  {typeMatchupRationales[simpleAtkType]?.[simpleDefType]?.rationale || "この相性に関する詳細な考察データはありません。"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 単一・複合クイズで不正解時にバッジをクリックした際の「相性の覚え方」 */}
        {!category.startsWith("simple-") && isAnswered && !isCorrect && selectedRationaleType && (() => {
          let matchups: { attacker: PokemonType; defender: PokemonType }[] = [];

          if (category === "single-offense" && questionType) {
            matchups = [{ attacker: questionType, defender: selectedRationaleType }];
          } else if (category === "single-defense" && questionType) {
            matchups = [{ attacker: selectedRationaleType, defender: questionType }];
          } else if ((category === "composite-offense" || category === "composite-defense") && questionComposite) {
            matchups = [
              { attacker: selectedRationaleType, defender: questionComposite[0] },
              { attacker: selectedRationaleType, defender: questionComposite[1] }
            ];
          }

          if (matchups.length === 0) return null;

          return (
            <div className="glass-panel" style={{
              marginTop: "4px",
              padding: "12px",
              border: "1px solid var(--border-glass-active)",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              boxSizing: "border-box",
              animation: "fade-in 0.2s ease"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "1rem" }}>💡</span>
                  <strong style={{ fontSize: "0.85rem", color: "var(--accent-cyan)" }}>相性の覚え方</strong>
                </div>
                <button
                  onClick={() => setSelectedRationaleType(null)}
                  className="tab-btn"
                  style={{ fontSize: "0.7rem", padding: "1px 6px" }}
                >
                  閉じる
                </button>
              </div>

              {matchups.map(({ attacker, defender }, idx) => {
                const rationaleData = typeMatchupRationales[attacker]?.[defender];
                
                return (
                  <div key={`${attacker}-${defender}-${idx}`} style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    paddingTop: idx > 0 ? "10px" : "0",
                    borderTop: idx > 0 ? "1px dashed rgba(255, 255, 255, 0.1)" : "none"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <TypeBadge type={attacker} size="sm" />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>→</span>
                      <TypeBadge type={defender} size="sm" />
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        color: rationaleData?.relation === "ばつぐん" ? "var(--success)" : rationaleData?.relation === "いまひとつ" ? "var(--accent-cyan)" : "var(--error)"
                      }}>
                        {rationaleData?.relation || "等倍"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap-reverse" }}>
                      <div className="rationale-image-container" style={{ flex: "0 0 160px", maxWidth: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.1)", backgroundColor: "rgba(0,0,0,0.2)" }}>
                        <img
                          src={`/images/matchup-rationales/${attacker}-${defender}.png`}
                          alt={`${TYPE_DETAILS[attacker].ja} から ${TYPE_DETAILS[defender].ja} への相性`}
                          onError={(e) => {
                            (e.target as HTMLElement).parentElement!.style.display = "none";
                          }}
                          style={{ width: "100%", height: "auto", display: "block" }}
                        />
                      </div>
                      
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <p style={{ fontSize: "0.8rem", lineHeight: "1.45", margin: 0, color: "var(--text-primary)" }}>
                          {rationaleData?.rationale || "この相性に関する詳細な考察データはありません。"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* コントロールボタン (Submit and Next in same slot) */}
        <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "center" }}>
          {!isAnswered ? (
            !category.startsWith("simple-") && (
              <button 
                onClick={() => handleSubmit()} 
                className="btn-primary" 
                style={{ width: "200px", padding: "10px 20px", fontSize: "0.9rem" }}
              >
                回答を決定する
              </button>
            )
          ) : (
            <button onClick={generateQuestion} className="btn-primary" style={{ width: "200px", padding: "10px 20px", fontSize: "0.9rem", background: "linear-gradient(135deg, var(--accent-violet), #c084fc)" }}>
              次の問題へ
            </button>
          )}
        </div>
      </div>
      )}

    </div>
  );
};
