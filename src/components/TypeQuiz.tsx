import React, { useState, useEffect } from "react";
import { TYPE_DETAILS, getEffectiveness } from "../utils/typeMatrix";
import type { PokemonType } from "../utils/typeMatrix";
import { TypeBadge } from "./TypeBadge";
import { MaxPowerQuiz } from "./MaxPowerQuiz";

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

// タイプのアンロック順序 (ほのお、みず、くさ の御三家からメジャー度順)
const PROGRESSIVE_TYPE_ORDER: PokemonType[] = [
  "fire", "water", "grass",      // 御三家
  "normal", "flying", "bug",      // 初盤・基本タイプ
  "electric", "ground", "rock",   // 元素・物理
  "poison", "fighting", "psychic",// 中堅難易度
  "ice", "ghost", "dragon",       // 後半・特殊
  "dark", "steel", "fairy"        // 現代・複合向け
];

const getCorrectSimpleChoice = (mult: number): SimpleChoice => {
  if (mult >= 2.0) return "double";
  if (mult === 1.0) return "normal";
  if (mult > 0.0 && mult < 1.0) return "half";
  return "immune";
};

export const TypeQuiz: React.FC = () => {
  const [category, setCategory] = useState<QuizCategory>("simple-offense");
  const [isFocusedMode, setIsFocusedMode] = useState<boolean>(false);
  
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
  
  // 統計
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  const activeTypes = PROGRESSIVE_TYPE_ORDER.slice(0, unlockedTypeCount);

  // カバー率 (Coverage) の計算
  const getActiveCoveredPairsCount = (pairsList: string[]) => {
    const activeSet = new Set(activeTypes);
    return pairsList.filter(p => {
      const [atk, def] = p.split("-") as PokemonType[];
      return activeSet.has(atk) && activeSet.has(def);
    }).length;
  };

  const activeCoveredCount = getActiveCoveredPairsCount(coveredPairs);
  const totalPossiblePairs = unlockedTypeCount * unlockedTypeCount;
  const coveragePercent = Math.round((activeCoveredCount / totalPossiblePairs) * 100);

  // 出題タイプ（単一、複合、またはシンプル）の重み付け抽選
  const generateQuestion = () => {
    if (category === "max-power") return;
    setIsAnswered(false);
    setSelectedTypes([]);
    setSelected4xTypes([]);
    setSelected2xTypes([]);
    setSelectedSimpleAns(null);
    setJustUnlocked(null);

    // localStorageから重みを取得
    const weightsRaw = localStorage.getItem(WEIGHTS_KEY);
    const weights: Record<string, number> = weightsRaw ? JSON.parse(weightsRaw) : {};

    if (category.startsWith("simple-")) {
      // シンプル相性クイズ：現在有効なタイププールからランダムな攻撃・受けのペアを選択
      const atk = activeTypes[Math.floor(Math.random() * activeTypes.length)];
      const def = activeTypes[Math.floor(Math.random() * activeTypes.length)];
      setSimpleAtkType(atk);
      setSimpleDefType(def);
      setQuestionType(null);
      setQuestionComposite(null);
    } else if (category.startsWith("single-")) {
      let selectedType: PokemonType;

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

      let selectedComp: [PokemonType, PokemonType];

      if (composites.length === 0) {
        // フォールバック
        selectedComp = [activeTypes[0], activeTypes[1] || activeTypes[0]];
      } else if (isFocusedMode && Object.keys(weights).length > 0) {
        const candidates = composites.map(c => {
          const key = `${c[0]}-${c[1]}`;
          const failCount = (weights[key] || 0) + (weights[c[0]] || 0) + (weights[c[1]] || 0);
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

      setQuestionComposite(selectedComp);
      setQuestionType(null);
      setSimpleAtkType(null);
      setSimpleDefType(null);
    }
  };

  // カテゴリや出題モード、有効タイプ数が切り替わったら再出題
  useEffect(() => {
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

        // 更新後のプール内でのカバー数を再計算
        const nextActiveCoveredCount = getActiveCoveredPairsCount(newPairs);
        const nextTotalPossiblePairs = unlockedTypeCount * unlockedTypeCount;

        if (nextActiveCoveredCount === nextTotalPossiblePairs && unlockedTypeCount < 18) {
          // 次のタイプを自動解放！
          const nextType = PROGRESSIVE_TYPE_ORDER[unlockedTypeCount];
          setUnlockedTypeCount(c => {
            const nextCount = c + 1;
            localStorage.setItem("poke-learn-unlocked-types", nextCount.toString());
            return nextCount;
          });
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
      <div className="glass-panel" style={{ padding: "6px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        {/* 出題形式セレクタ */}
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {(
            [
              { id: "simple-offense", name: "攻撃側 (シンプル)" },
              { id: "simple-defense", name: "防御側 (シンプル)" },
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
          <label className="toggle-switch">
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

      {/* 段階的タイプ学習コントロールパネル (1行の超コンパクト化) */}
      {category !== "max-power" && (
        <div className="glass-panel" style={{ padding: "6px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", flexWrap: "wrap", gap: "8px" }}>
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

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span>📊 網羅率:</span>
            <span style={{ fontWeight: 700, color: coveragePercent === 100 ? "var(--success)" : "var(--accent-cyan)" }}>
              {coveragePercent}% ({activeCoveredCount}/{totalPossiblePairs})
            </span>
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
            {category === "single-offense" && "攻撃相性 - 抜群選択"}
            {category === "single-defense" && "防御相性 - 弱点選択"}
            {category === "composite-offense" && "攻撃相性 - 4倍・2倍の攻撃判定"}
            {category === "composite-defense" && "防御相性 - 4倍・2倍の弱点判定"}
          </span>

          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginTop: "2px" }}>
            {category === "simple-offense" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                <span>タイプ一致</span>
                {simpleAtkType && <TypeBadge type={simpleAtkType} size="md" />}
                <span>の技で、防御側</span>
                {simpleDefType && <TypeBadge type={simpleDefType} size="md" />}
                <span>を攻撃したときの効果は？</span>
              </div>
            )}
            {category === "simple-defense" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                <span>防御側が</span>
                {simpleDefType && <TypeBadge type={simpleDefType} size="md" />}
                <span>タイプのとき、攻撃側</span>
                {simpleAtkType && <TypeBadge type={simpleAtkType} size="md" />}
                <span>からの技を受ける効果は？</span>
              </div>
            )}
            {category === "single-offense" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                <span>タイプ一致</span>
                {questionType && <TypeBadge type={questionType} size="md" />}
                <span>の技で攻撃したとき、<strong>効果は抜群</strong>になるのは？</span>
              </div>
            )}
            {category === "single-defense" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                <span>防御側が</span>
                {questionType && <TypeBadge type={questionType} size="md" />}
                <span>タイプのとき、<strong>弱点（効果は抜群）</strong>となる攻撃タイプは？</span>
              </div>
            )}
            {category === "composite-offense" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                <span>防御側が</span>
                {questionComposite && (
                  <>
                    <TypeBadge type={questionComposite[0]} size="md" />
                    <span>・</span>
                    <TypeBadge type={questionComposite[1]} size="md" />
                  </>
                )}
                <span>のとき、4倍および2倍になる攻撃は？</span>
              </div>
            )}
            {category === "composite-defense" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                <span>タイプが</span>
                {questionComposite && (
                  <>
                    <TypeBadge type={questionComposite[0]} size="md" />
                    <span>・</span>
                    <TypeBadge type={questionComposite[1]} size="md" />
                  </>
                )}
                <span>のポケモンの、4倍弱点と2倍弱点は？</span>
              </div>
            )}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
            {category.startsWith("simple-") 
              ? "※正しい相性倍率を選択すると、その瞬間に回答が確定します。" 
              : "※当てはまるタイプを全て選択し、決定ボタンを押してください。該当なしは未選択で決定。"}
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
                  { id: "normal", label: "等倍", desc: "1倍", color: "var(--text-primary)" },
                  { id: "half", label: "いまひとつ", desc: "0.5倍以下", color: "var(--accent-cyan)" },
                  { id: "immune", label: "無効", desc: "0倍", color: "var(--error)" }
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
                  onClick={() => handleTypeToggle(type)}
                  disabled={isAnswered}
                  style={{
                    backgroundColor: bg,
                    border,
                    borderRadius: "6px",
                    padding: "6px 0",
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
        )}

        {/* 3. タイプ選択エリア (複合タイプ用：4倍・2倍の分別選択) */}
        {!category.startsWith("single-") && !category.startsWith("simple-") && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
            
            {/* 4倍弱点/抜群エリア */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🎯 【4倍】効果は抜群（4x）</span>
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
                      clickable={!isAnswered}
                      selected={isSelected}
                      onClick={() => handleCompositeToggle(type, "4x")}
                      style={customStyle}
                    />
                  );
                })}
              </div>
            </div>

            {/* 2倍弱点/抜群エリア */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-violet)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>⚡ 【2倍】効果は抜群（2x）</span>
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
                      clickable={!isAnswered}
                      selected={isSelected}
                      onClick={() => handleCompositeToggle(type, "2x")}
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
                        normal: "等倍 (1倍)",
                        half: "いまひとつ (0.5倍以下)",
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

        {/* コントロールボタン (Submit and Next in same slot) */}
        <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "center" }}>
          {!isAnswered ? (
            <button 
              onClick={() => handleSubmit()} 
              className="btn-primary" 
              style={{ width: "200px", padding: "10px 20px", fontSize: "0.9rem" }}
              disabled={category.startsWith("simple-") && !selectedSimpleAns}
            >
              回答を決定する
            </button>
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
