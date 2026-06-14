import React, { useState, useEffect } from "react";
import { LOCAL_POKEMONS } from "../data/localPokemons";
import type { PokemonData } from "../data/localPokemons";
import { getEffectiveness, getSingleMatchupMultiplier, TYPE_DETAILS, TYPE_LIST } from "../utils/typeMatrix";
import type { PokemonType } from "../utils/typeMatrix";
import { TypeBadge } from "./TypeBadge";
import { PokemonCard } from "./PokemonCard";

// localStorageキー一覧
const TYPE_WEIGHTS_KEY = "poke-learn-type-weights";
const MAX_POWER_WEIGHTS_KEY = "poke-learn-max-power-weights";
const CONSISTENCY_WEIGHTS_KEY = "poke-learn-consistency-weights";
const SELECTION_WEIGHTS_KEY = "poke-learn-selection-weights";
const PURIFIED_BOSSES_KEY = "poke-learn-purified-bosses";



export const WeaknessAnalysis: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"weak-types" | "heatmap" | "boss">("weak-types");
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  // 苦手集計データ
  const [attackerWeakness, setAttackerWeakness] = useState<Record<PokemonType, number>>({} as any);
  const [defenderWeakness, setDefenderWeakness] = useState<Record<PokemonType, number>>({} as any);
  const [matchupWeakness, setMatchupWeakness] = useState<Record<string, number>>({});
  const [scanProgress, setScanProgress] = useState<number>(0); // 0-100%

  // モーダル・個別特訓用のステート
  const [simQuestionsList, setSimQuestionsList] = useState<Array<{ atk: PokemonType; def: PokemonType }>>([]);
  const [simQuestionIdx, setSimQuestionIdx] = useState<number>(0);
  const [simCorrectCount, setSimCorrectCount] = useState<number>(0);
  const [simStreakFinished, setSimStreakFinished] = useState<boolean>(false);
  const [simAnswered, setSimAnswered] = useState<boolean>(false);
  const [simSelected, setSimSelected] = useState<string | null>(null);

  // シャドウボス・レイドバトル用のステート
  const [bossPokemon, setBossPokemon] = useState<PokemonData | null>(null);
  const [bossTypes, setBossTypes] = useState<PokemonType[]>([]);
  const [battleState, setBattleState] = useState<"idle" | "intro" | "playing" | "victory" | "defeat">("idle");
  const [bossHP, setBossHP] = useState<number>(100);
  const [battleTurn, setBattleTurn] = useState<number>(1); // 1~5
  const [playerLog, setPlayerLog] = useState<string>("");
  const [bossLog, setBossLog] = useState<string>("");

  // レイド戦闘中の選択肢データ
  const [offenseHand, setOffenseHand] = useState<PokemonType[]>([]);
  const [defenseDraft, setDefenseDraft] = useState<PokemonData[]>([]);
  const [bossAtkType, setBossAtkType] = useState<PokemonType>("normal");

  // トロフィーキャビネット
  const [purifiedMedals, setPurifiedMedals] = useState<string[]>([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    loadAndAggregateData();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 苦手度データのロード＆正規化・統合処理
  const loadAndAggregateData = () => {
    // rawロード
    const rawType = JSON.parse(localStorage.getItem(TYPE_WEIGHTS_KEY) || "{}");
    const rawMaxPower = JSON.parse(localStorage.getItem(MAX_POWER_WEIGHTS_KEY) || "{}");
    const rawConsistency = JSON.parse(localStorage.getItem(CONSISTENCY_WEIGHTS_KEY) || "{}");
    const rawSelection = JSON.parse(localStorage.getItem(SELECTION_WEIGHTS_KEY) || "{}");
    const rawMedals = JSON.parse(localStorage.getItem(PURIFIED_BOSSES_KEY) || "[]");

    setPurifiedMedals(rawMedals);

    const newAttacker: Record<PokemonType, number> = {} as any;
    const newDefender: Record<PokemonType, number> = {} as any;
    const newMatchups: Record<string, number> = {};

    let totalScannedElements = 0;
    const totalPossibleElements = 18 * 18; // 相性グリッド全体

    // 対面相性のマージ
    TYPE_LIST.forEach(atk => {
      TYPE_LIST.forEach(def => {
        const key = `${atk}-${def}`;
        let rawSum = 0;
        let rawCount = 0;

        if (rawType[key] !== undefined) {
          rawSum += rawType[key];
          rawCount++;
        }
        if (rawMaxPower[key] !== undefined) {
          rawSum += rawMaxPower[key];
          rawCount++;
        }

        if (rawCount > 0) {
          const avgWeight = rawSum / rawCount;
          if (avgWeight > 1.0) {
            // 弱点 (Weakness) - 最大値5.0までの超過分を0〜100%にマッピング
            const score = Math.min(100, Math.round((avgWeight - 1.0) * 25));
            newMatchups[key] = score; // 正の値は弱度を示す
          } else if (avgWeight < 1.0) {
            // 得意 (Mastery) - 1.0未満の割合を0〜100%にマッピング
            const score = Math.min(100, Math.round((1.0 - avgWeight) * 100));
            newMatchups[key] = -score; // 負の値は強度を示す
          } else {
            newMatchups[key] = 0; // ニュートラル（プレイ済、誤答・即答なし）
          }
          totalScannedElements++;
        }
      });
    });

    // 攻撃・防御のプロファイルマージ
    TYPE_LIST.forEach(type => {
      // 1. 攻撃苦手度: atk-def対面で自分がアタッカーの時のミスを集計
      let atkWeaknessSum = 0;
      let atkCount = 0;
      TYPE_LIST.forEach(def => {
        const key = `${type}-${def}`;
        const score = newMatchups[key];
        if (score !== undefined) {
          atkWeaknessSum += score > 0 ? score : 0;
          atkCount++;
        }
      });
      // シンプルクイズに単体で記録された重みも加味
      if (rawType[type] !== undefined && rawType[type] > 1.0) {
        atkWeaknessSum += Math.min(100, Math.round((rawType[type] - 1.0) * 25));
        atkCount++;
      }
      newAttacker[type] = atkCount > 0 ? Math.round(atkWeaknessSum / atkCount) : -1; // -1 = 未調査

      // 2. 防御苦手度: def-atk対面での被弾ミス、および一貫・選出ミスを集計
      let defWeaknessSum = 0;
      let defCount = 0;
      TYPE_LIST.forEach(atk => {
        const key = `${atk}-${type}`;
        const score = newMatchups[key];
        if (score !== undefined) {
          defWeaknessSum += score > 0 ? score : 0;
          defCount++;
        }
      });
      // 複合防御クイズ
      TYPE_LIST.forEach(otherDef => {
        if (otherDef !== type) {
          const compKey1 = `${type}-${otherDef}`;
          const compKey2 = `${otherDef}-${type}`;
          if (rawType[compKey1] !== undefined && rawType[compKey1] > 1.0) {
            defWeaknessSum += Math.min(100, Math.round((rawType[compKey1] - 1.0) * 25));
            defCount++;
          }
          if (rawType[compKey2] !== undefined && rawType[compKey2] > 1.0) {
            defWeaknessSum += Math.min(100, Math.round((rawType[compKey2] - 1.0) * 25));
            defCount++;
          }
        }
      });
      // 一貫性・選出クイズの重み（防御側タイプに蓄積される）
      if (rawConsistency[type] !== undefined && rawConsistency[type] > 0) {
        const score = Math.min(100, Math.round(rawConsistency[type] * 20));
        defWeaknessSum += score;
        defCount += 1.0;
      }
      if (rawSelection[type] !== undefined && rawSelection[type] > 0) {
        const score = Math.min(100, Math.round(rawSelection[type] * 20));
        defWeaknessSum += score;
        defCount += 1.0;
      }
      newDefender[type] = defCount > 0 ? Math.round(defWeaknessSum / defCount) : -1;
    });

    setAttackerWeakness(newAttacker);
    setDefenderWeakness(newDefender);
    setMatchupWeakness(newMatchups);
    setScanProgress(Math.min(100, Math.round((totalScannedElements / totalPossibleElements) * 100)));

    // シャドウボスの生成 (最も防御苦手度が高い上位2タイプを選出)
    const sortedDef = Object.entries(newDefender)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sortedDef.length > 0) {
      const t1 = sortedDef[0][0] as PokemonType;
      const t2 = sortedDef[1] ? (sortedDef[1][0] as PokemonType) : t1;
      const targetTypes = t1 === t2 ? [t1] : [t1, t2];
      setBossTypes(targetTypes);

      // 該当のタイプを持つポケモンを検索
      let match = LOCAL_POKEMONS.find(p => 
        p.types.includes(t1) && (targetTypes.length === 1 || p.types.includes(t2))
      );
      if (!match) {
        match = LOCAL_POKEMONS.find(p => p.types.includes(t1));
      }
      
      if (match) {
        // ボス用にカスタマイズ
        setBossPokemon({
          ...match,
          nameJa: targetTypes.length === 2 && !match.types.includes(t2)
            ? `シャドウ・${match.nameJa}（${TYPE_DETAILS[t2].ja}変異種）`
            : `シャドウ・${match.nameJa}`,
          types: targetTypes
        });
      }
    } else {
      setBossPokemon(null);
      setBossTypes([]);
    }
  };

  // 警報セルをクリックしたとき（5問の克服特訓クイズを開始）
  const handleCellClick = (clickAtk: PokemonType, clickDef: PokemonType) => {
    // 1. 苦手セル(score > 0)を全抽出
    const allWeakCells: Array<{ atk: PokemonType; def: PokemonType }> = [];
    TYPE_LIST.forEach(atk => {
      TYPE_LIST.forEach(def => {
        const key = `${atk}-${def}`;
        if (matchupWeakness[key] > 0) {
          allWeakCells.push({ atk, def });
        }
      });
    });

    // 2. その中から「同じ攻撃タイプ」または「同じ防御タイプ」の関連するものを抽出
    const relatedWeak = allWeakCells.filter(cell => cell.atk === clickAtk || cell.def === clickDef);

    // 3. 重複を除外してターゲットセルを追加
    let list = [...relatedWeak];
    if (!list.some(c => c.atk === clickAtk && c.def === clickDef)) {
      list.push({ atk: clickAtk, def: clickDef });
    }

    // 4. もし5つ未満なら、その他の苦手セルから補充
    if (list.length < 5) {
      const others = allWeakCells.filter(c => !list.some(l => l.atk === c.atk && l.def === c.def));
      list = [...list, ...others].slice(0, 5);
    }

    // 5. それでも5つ未満なら、同じ行か同じ列の別のセル（ニュートラルなど）を補充
    if (list.length < 5) {
      const extraInRowOrCol: Array<{ atk: PokemonType; def: PokemonType }> = [];
      TYPE_LIST.forEach(other => {
        if (other !== clickDef) extraInRowOrCol.push({ atk: clickAtk, def: other });
        if (other !== clickAtk) extraInRowOrCol.push({ atk: other, def: clickDef });
      });
      for (const cell of extraInRowOrCol) {
        if (list.length >= 5) break;
        if (!list.some(l => l.atk === cell.atk && l.def === cell.def)) {
          list.push(cell);
        }
      }
    }

    // 6. それでも5つ未満なら、タイプ全体のランダム対面で補充
    if (list.length < 5) {
      TYPE_LIST.forEach(atk => {
        TYPE_LIST.forEach(def => {
          if (list.length < 5 && !list.some(l => l.atk === atk && l.def === def)) {
            list.push({ atk, def });
          }
        });
      });
    }

    list = list.slice(0, 5);

    // 7. シャッフルする。ただし、最初の問題がクリックしたセル自身にならないように調整
    let shuffled = [...list].sort(() => 0.5 - Math.random());
    if (shuffled[0].atk === clickAtk && shuffled[0].def === clickDef && shuffled.length > 1) {
      const swapIdx = Math.floor(Math.random() * (shuffled.length - 1)) + 1; // 1〜4
      const temp = shuffled[0];
      shuffled[0] = shuffled[swapIdx];
      shuffled[swapIdx] = temp;
    }

    setSimQuestionsList(shuffled);
    setSimQuestionIdx(0);
    setSimCorrectCount(0);
    setSimStreakFinished(false);
    setSimAnswered(false);
    setSimSelected(null);
  };

  // 攻撃側の行（ヘッダー）をクリックしたとき（そのタイプが攻撃側の弱点克服クイズを5問出題）
  const handleRowHeaderClick = (atk: PokemonType) => {
    const candidates = TYPE_LIST.map(def => {
      const key = `${atk}-${def}`;
      return { def, score: matchupWeakness[key] || 0 };
    });

    // 苦手度の高い順にソート
    candidates.sort((a, b) => b.score - a.score);

    // 上位5個を問題に選出
    const selected = candidates.slice(0, 5).map(c => ({ atk, def: c.def }));
    const shuffled = selected.sort(() => 0.5 - Math.random());

    setSimQuestionsList(shuffled);
    setSimQuestionIdx(0);
    setSimCorrectCount(0);
    setSimStreakFinished(false);
    setSimAnswered(false);
    setSimSelected(null);
  };

  // 守備側の列（ヘッダー）をクリックしたとき（そのタイプが防御側の弱点克服クイズを5問出題）
  const handleColHeaderClick = (def: PokemonType) => {
    const candidates = TYPE_LIST.map(atk => {
      const key = `${atk}-${def}`;
      return { atk, score: matchupWeakness[key] || 0 };
    });

    // 苦手度の高い順にソート
    candidates.sort((a, b) => b.score - a.score);

    // 上位5個を問題に選出
    const selected = candidates.slice(0, 5).map(c => ({ atk: c.atk, def }));
    const shuffled = selected.sort(() => 0.5 - Math.random());

    setSimQuestionsList(shuffled);
    setSimQuestionIdx(0);
    setSimCorrectCount(0);
    setSimStreakFinished(false);
    setSimAnswered(false);
    setSimSelected(null);
  };

  // 特訓回答決定
  const handleSimSubmit = (choice: string) => {
    if (simAnswered || simQuestionsList.length === 0) return;
    setSimSelected(choice);
    setSimAnswered(true);

    const currentPair = simQuestionsList[simQuestionIdx];
    const mult = getEffectiveness(currentPair.atk, [currentPair.def]);
    const correctChoice = mult === 2.0 ? "2倍" : mult === 0.5 ? "0.5倍" : mult === 0.0 ? "0倍" : "1倍";

    const isCorrect = choice === correctChoice;
    if (isCorrect) {
      setSimCorrectCount(prev => prev + 1);
    }

    // localStorageの値を直接更新して反映
    const updateStorage = (key: string, isAtkDef: boolean) => {
      const raw = JSON.parse(localStorage.getItem(key) || "{}");
      const storageKey = isAtkDef ? `${currentPair.atk}-${currentPair.def}` : currentPair.def;
      
      if (raw[storageKey] !== undefined) {
        if (isCorrect) {
          raw[storageKey] = Math.max(0, raw[storageKey] - 2); // 正解で重みを2下げる
        } else {
          raw[storageKey] = (raw[storageKey] || 0) + 1; // 誤答で重みを1上げる
        }
        localStorage.setItem(key, JSON.stringify(raw));
      }
    };

    updateStorage(TYPE_WEIGHTS_KEY, true);
    updateStorage(MAX_POWER_WEIGHTS_KEY, true);
    updateStorage(CONSISTENCY_WEIGHTS_KEY, false);
    updateStorage(SELECTION_WEIGHTS_KEY, false);

    // 再集計
    loadAndAggregateData();
  };

  // レイドバトルの開始
  const startRaidBattle = () => {
    if (!bossPokemon) return;
    setBossHP(100);
    setBattleTurn(1);
    setBattleState("playing");
    setPlayerLog("シャドウボスとの戦闘が開始されました！");
    setBossLog("ボスの気配が渦巻いている...");
    setupRaidTurn(1);
  };

  // レイドバトルのターンセットアップ
  const setupRaidTurn = (turn: number) => {
    if (turn <= 3) {
      // 攻撃フェーズ: 手札アタッカー候補4枚の選出
      // ボスに抜群以上のタイプを1枚以上混ぜる
      const bestAttackers = TYPE_LIST.filter(t => getEffectiveness(t, bossTypes) >= 2.0);
      const otherAttackers = TYPE_LIST.filter(t => getEffectiveness(t, bossTypes) < 2.0);
      
      const hand: PokemonType[] = [];
      if (bestAttackers.length > 0) {
        hand.push(bestAttackers[Math.floor(Math.random() * bestAttackers.length)]);
      }
      while (hand.length < 4) {
        const rand = otherAttackers[Math.floor(Math.random() * otherAttackers.length)];
        if (!hand.includes(rand)) {
          hand.push(rand);
        }
      }
      setOffenseHand(hand.sort(() => 0.5 - Math.random()));
    } else {
      // 防御フェーズ: ボスの攻撃タイプの決定
      const bossAtk = bossTypes[Math.floor(Math.random() * bossTypes.length)];
      setBossAtkType(bossAtk);

      // ドラフトされるポケモン候補4枚の選出 (ボスの攻撃を半減以下で受けられるものを1体以上含む)
      const resistingPokes = LOCAL_POKEMONS.filter(p => getEffectiveness(bossAtk, p.types) <= 0.5);
      const otherPokes = LOCAL_POKEMONS.filter(p => getEffectiveness(bossAtk, p.types) > 0.5);

      const draft: PokemonData[] = [];
      if (resistingPokes.length > 0) {
        draft.push(resistingPokes[Math.floor(Math.random() * resistingPokes.length)]);
      }
      while (draft.length < 4) {
        const rand = otherPokes[Math.floor(Math.random() * otherPokes.length)];
        if (!draft.some(p => p.id === rand.id)) {
          draft.push(rand);
        }
      }
      setDefenseDraft(draft.sort(() => 0.5 - Math.random()));
    }
  };

  // 攻撃フェーズのアクション
  const executeOffenseAction = (selectedAtk: PokemonType) => {
    const mult = getEffectiveness(selectedAtk, bossTypes);
    
    // 手札の中で最高倍率を計算して正誤・ダメージ判定
    const maxPossibleMult = Math.max(...offenseHand.map(t => getEffectiveness(t, bossTypes)));
    const isOptimal = mult === maxPossibleMult;

    const damage = Math.round(mult * 10);
    const newHP = Math.max(0, bossHP - damage);
    setBossHP(newHP);

    const atkName = TYPE_DETAILS[selectedAtk].ja;
    let logMsg = `あなたのターン: ${atkName}タイプで攻撃！（効果は${mult}倍）➡ ボスに ${damage} ダメージ！`;
    if (isOptimal) {
      logMsg += " 🎉 最大打点をマーク！";
    } else {
      logMsg += ` ⚠️ 最大打点（${maxPossibleMult}倍）を見落としました。`;
    }
    setPlayerLog(logMsg);

    if (newHP <= 0) {
      handleRaidEnd(true);
    } else {
      setBossLog(`ボスは耐えている。（残りHP: ${newHP}%）`);
      progressRaidTurn();
    }
  };

  // 防御フェーズのアクション
  const executeDefenseAction = (selectedPoke: PokemonData) => {
    const mult = getEffectiveness(bossAtkType, selectedPoke.types);
    const isSuccess = mult <= 0.5;

    let dmgDealt = 0;
    let nextHP = bossHP;

    if (isSuccess) {
      dmgDealt = 35; // 防御成功時のカウンターダメージ
      nextHP = Math.max(0, bossHP - dmgDealt);
      setBossHP(nextHP);
      setPlayerLog(`あなたのターン: ${selectedPoke.nameJa}で受けに成功！（被ダメージ ${mult}x）カウンターで ${dmgDealt} ダメージを与えました！`);
      setBossLog(`ボスはあなたの完璧な受けに怯んでいる！`);
    } else {
      setPlayerLog(`あなたのターン: ${selectedPoke.nameJa}で受けに失敗しました！（被ダメージ ${mult}x）`);
      setBossLog(`ボスの激しい反撃を受け、あなたの陣形が崩れました！`);
    }

    if (nextHP <= 0) {
      handleRaidEnd(true);
    } else if (battleTurn === 5) {
      handleRaidEnd(false);
    } else {
      progressRaidTurn();
    }
  };

  const progressRaidTurn = () => {
    const nextTurn = battleTurn + 1;
    setBattleTurn(nextTurn);
    setupRaidTurn(nextTurn);
  };

  // バトルの終了処理
  const handleRaidEnd = (isWin: boolean) => {
    if (isWin) {
      setBattleState("victory");
      
      // トロフィーキャビネットへの保存
      const medalName = bossTypes.map(t => TYPE_DETAILS[t].ja).join("・") + "の守護者";
      const updatedMedals = Array.from(new Set([...purifiedMedals, medalName]));
      setPurifiedMedals(updatedMedals);
      localStorage.setItem(PURIFIED_BOSSES_KEY, JSON.stringify(updatedMedals));

      // ボス討伐報酬: 該当複合タイプの苦手履歴データを30%軽減
      const reduceTypeWeights = (key: string) => {
        const raw = JSON.parse(localStorage.getItem(key) || "{}");
        Object.keys(raw).forEach(k => {
          bossTypes.forEach(t => {
            if (k.includes(t) || k === t) {
              raw[k] = Math.max(0, Math.round(raw[k] * 0.7));
            }
          });
        });
        localStorage.setItem(key, JSON.stringify(raw));
      };

      reduceTypeWeights(TYPE_WEIGHTS_KEY);
      reduceTypeWeights(MAX_POWER_WEIGHTS_KEY);
      reduceTypeWeights(CONSISTENCY_WEIGHTS_KEY);
      reduceTypeWeights(SELECTION_WEIGHTS_KEY);

      // 再集計
      loadAndAggregateData();
    } else {
      setBattleState("defeat");
    }
  };

  // 相対的閾値判定のための最大スコア算出
  const maxAtkScore = Math.max(0, ...TYPE_LIST.map(t => attackerWeakness[t] || 0));
  const maxDefScore = Math.max(0, ...TYPE_LIST.map(t => defenderWeakness[t] || 0));

  // 各タイプの攻撃・防御における相性セル集計と層別判定
  const getStratumInfo = (type: PokemonType, direction: "atk" | "def") => {
    const scores = TYPE_LIST.map(other => {
      const key = direction === "atk" ? `${type}-${other}` : `${other}-${type}`;
      return matchupWeakness[key];
    });

    const weakScores = scores.filter(s => s !== undefined && s > 0);
    const masteredScores = scores.filter(s => s !== undefined && s < 0);
    const neutralScores = scores.filter(s => s === 0);
    const scannedCount = scores.filter(s => s !== undefined).length;

    const maxWeakness = weakScores.length > 0 ? Math.max(...weakScores) : 0;
    
    // 相対的スコア判定
    const avgScore = direction === "atk" ? (attackerWeakness[type] || 0) : (defenderWeakness[type] || 0);
    const maxScore = direction === "atk" ? maxAtkScore : maxDefScore;

    let stratum: "danger-high" | "danger-mid" | "mastered" | "stable" = "stable";
    
    // スコアが十分にあり (12超)、かつ同方向の最大スコアの55%以上のものを苦手判定とする
    if (avgScore > 12 && maxScore > 0 && avgScore >= maxScore * 0.55) {
      if (avgScore >= maxScore * 0.8 || avgScore > 50) {
        stratum = "danger-high";
      } else {
        stratum = "danger-mid";
      }
    } else if (scannedCount > 0 && weakScores.length === 0 && masteredScores.length >= 3) {
      stratum = "mastered";
    }

    return {
      weak: weakScores.length,
      mastered: masteredScores.length,
      neutral: neutralScores.length,
      unscanned: 18 - scannedCount,
      maxWeakness,
      stratum
    };
  };

  // アラートの点滅色 (苦手は赤発光、得意は青・シアン発光、標準はエメラルド発光、未プレイはグレー)
  const getGlowStyle = (score: number | undefined) => {
    // 基本スタイル決定
    if (score === undefined) {
      // 未プレイ
      return {
        backgroundColor: "rgba(255, 255, 255, 0.01)",
        border: "1px dashed rgba(255, 255, 255, 0.05)",
        color: "rgba(255, 255, 255, 0.15)"
      };
    }
    if (score === 0) {
      // 標準・ニュートラル（緑）
      return {
        backgroundColor: "rgba(16, 185, 129, 0.06)",
        border: "1px solid rgba(16, 185, 129, 0.15)",
        boxShadow: "0 0 4px rgba(16, 185, 129, 0.08)",
        color: "var(--success)"
      };
    }
    if (score > 0) {
      // 弱点 (赤色ネオン)
      const opacity = 0.12 + (score / 100) * 0.43;
      return {
        backgroundColor: `rgba(239, 68, 68, ${opacity})`,
        border: `1px solid rgba(239, 68, 68, ${0.15 + (score / 100) * 0.65})`,
        boxShadow: `0 0 ${6 + (score / 100) * 12}px rgba(239, 68, 68, ${0.15 + (score / 100) * 0.35})`,
        color: "var(--error)"
      };
    }
    // 得意・マスター (青・シアンネオン)
    const absScore = Math.abs(score);
    const opacity = 0.08 + (absScore / 100) * 0.32;
    return {
      backgroundColor: `rgba(6, 182, 212, ${opacity})`,
      border: `1px solid rgba(6, 182, 212, ${0.15 + (absScore / 100) * 0.5})`,
      boxShadow: `0 0 ${5 + (absScore / 100) * 10}px rgba(6, 182, 212, ${0.15 + (absScore / 100) * 0.3})`,
      color: "var(--accent-cyan)"
    };
  };

  // 苦手な攻撃と防御タイプ（全量・ソート順）
  const allAtkWeak = Object.entries(attackerWeakness)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  const allDefWeak = Object.entries(defenderWeakness)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="glass-panel glow-card animate-fade-in" style={{ padding: isMobile ? "10px" : "20px", display: "flex", flexDirection: "column", gap: "16px", flex: 1, minHeight: "350px" }}>
      <style>{`
        @keyframes pulse-alarm {
          0% { transform: scale(1); opacity: 0.6; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); opacity: 0.6; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .warning-dot {
          animation: pulse-alarm 1.8s infinite ease-in-out;
          box-shadow: 0 0 6px var(--error-glow);
        }
        @keyframes hazard-blink {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.8)); }
        }
        .warning-danger-blink {
          animation: hazard-blink 1.2s infinite ease-in-out;
        }

        /* GPU-optimized Pulse Animations */
        .double-danger-cell::after {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: inherit;
          border: 1px solid rgba(239, 68, 68, 1);
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.85), inset 0 0 8px rgba(239, 68, 68, 0.6);
          pointer-events: none;
          will-change: transform, opacity;
          animation: double-danger-glow 1.4s infinite ease-in-out;
        }
        @keyframes double-danger-glow {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }

        .double-master-cell::after {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: inherit;
          border: 1px solid rgba(6, 182, 212, 0.8);
          box-shadow: 0 0 12px rgba(6, 182, 212, 0.7);
          pointer-events: none;
          will-change: transform, opacity;
          animation: double-master-glow 2s infinite ease-in-out;
        }
        @keyframes double-master-glow {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        /* Hover highlights and crosshair CSS rules */
        .matrix-cell {
          position: relative;
          transition: all 0.15s ease;
        }
        .matrix-cell:hover {
          transform: scale(1.18) !important;
          z-index: 10 !important;
          border: 2px solid var(--accent-cyan) !important;
          box-shadow: 0 0 16px var(--accent-cyan-glow) !important;
          transition: all 0.1s ease !important;
        }
        
        ${TYPE_LIST.map(type => `
          .row-header-${type} {
            text-shadow: 0 0 4px ${TYPE_DETAILS[type].glowColor};
          }
          .col-header-${type} {
            text-shadow: 0 0 4px ${TYPE_DETAILS[type].glowColor};
          }
          #matrix-container[data-hovered-row="${type}"] .row-header-${type} {
            transform: scale(1.15) !important;
            z-index: 10 !important;
            text-shadow: 0 0 8px ${TYPE_DETAILS[type].glowColor}, 0 0 12px ${TYPE_DETAILS[type].glowColor} !important;
          }
          #matrix-container[data-hovered-col="${type}"] .col-header-${type} {
            transform: scale(1.15) !important;
            z-index: 10 !important;
            text-shadow: 0 0 8px ${TYPE_DETAILS[type].glowColor}, 0 0 12px ${TYPE_DETAILS[type].glowColor} !important;
          }
          #matrix-container[data-hovered-row="${type}"] .row-type-${type} {
            outline: 1.5px solid rgba(6, 182, 212, 0.45) !important;
            outline-offset: -1.5px !important;
          }
          #matrix-container[data-hovered-row="${type}"] .row-type-${type}.cell-unplayed {
            background-color: rgba(6, 182, 212, 0.05) !important;
          }
          #matrix-container[data-hovered-col="${type}"] .col-type-${type} {
            outline: 1.5px solid rgba(6, 182, 212, 0.45) !important;
            outline-offset: -1.5px !important;
          }
          #matrix-container[data-hovered-col="${type}"] .col-type-${type}.cell-unplayed {
            background-color: rgba(6, 182, 212, 0.05) !important;
          }
        `).join("\n")}
      `}</style>
      
      {/* 苦手概要ダッシュボード */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "12px" }}>
        <div>
          <h2 style={{ fontSize: isMobile ? "1.1rem" : "1.4rem", fontWeight: 900, background: "linear-gradient(135deg, var(--error), var(--warning))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            📊 苦手分析＆特訓センター
          </h2>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            蓄積されたクイズ履歴を多角スキャンし、リアルタイムであなたの弱点相性を抽出します。
          </p>
        </div>
        
        {/* 全体スキャン進捗バー */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: isMobile ? "100%" : "240px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-cyan)", whiteSpace: "nowrap" }}>
            相性スキャン度: {scanProgress}%
          </span>
          <div style={{ flex: 1, height: "10px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "5px", overflow: "hidden", border: "1px solid var(--border-glass)" }}>
            <div style={{ width: `${scanProgress}%`, height: "100%", background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-violet))", boxShadow: "0 0 6px var(--accent-cyan-glow)" }} />
          </div>
        </div>
      </div>

      {/* サブナビゲーション */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
        <button
          onClick={() => setActiveSubTab("weak-types")}
          className={`tab-btn ${activeSubTab === "weak-types" ? "active" : ""}`}
          style={{ fontSize: "0.8rem", padding: "6px 16px" }}
        >
          🚨 苦手タイプ
        </button>
        <button
          onClick={() => setActiveSubTab("heatmap")}
          className={`tab-btn ${activeSubTab === "heatmap" ? "active" : ""}`}
          style={{ fontSize: "0.8rem", padding: "6px 16px" }}
        >
          📊 マトリクス
        </button>
        <button
          onClick={() => setActiveSubTab("boss")}
          className={`tab-btn ${activeSubTab === "boss" ? "active" : ""}`}
          style={{ fontSize: "0.8rem", padding: "6px 16px" }}
        >
          👾 シャドウボス
        </button>
      </div>

      {/* 苦手タイプ・サブタブ */}
      {activeSubTab === "weak-types" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="glass-panel" style={{ padding: "12px 16px", backgroundColor: "rgba(6, 182, 212, 0.03)", border: "1px solid rgba(6, 182, 212, 0.15)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontWeight: 700 }}>
              💡 [弱点克服トレーニングシステム]
            </span>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              以下はクイズ履歴から抽出された苦手なタイプ一覧です。**行をクリック**すると、そのタイプに特化した「5問連続の弱点克服特訓」を開始できます。
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
            {/* 攻撃側苦手リスト */}
            <div className="glass-panel" style={{ padding: "14px", backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "6px" }}>
                ⚔️ 攻撃の苦手タイプ (行クリックで特訓開始)
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                {allAtkWeak.length === 0 ? (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "16px 0" }}>
                    🎉 攻撃面で苦手なタイプはありません！
                  </span>
                ) : (
                  allAtkWeak.map(([type, score]) => (
                    <div
                      key={`list-atk-weak-${type}`}
                      onClick={() => handleRowHeaderClick(type as PokemonType)}
                      className="tab-btn"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid var(--border-glass)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                        <div style={{ width: "65px" }}><TypeBadge type={type as PokemonType} size="sm" /></div>
                        <div style={{ flex: 1, height: "6px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ width: `${score}%`, height: "100%", backgroundColor: "var(--error)" }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "12px" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--error)" }}>{score}%</span>
                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700 }}>⚔️ 特訓 ➡</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 防御側苦手リスト */}
            <div className="glass-panel" style={{ padding: "14px", backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent-violet)", display: "flex", alignItems: "center", gap: "6px" }}>
                🛡️ 防御の苦手タイプ (行をクリックで特訓開始)
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                {allDefWeak.length === 0 ? (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "16px 0" }}>
                    🎉 防御面で苦手なタイプはありません！
                  </span>
                ) : (
                  allDefWeak.map(([type, score]) => (
                    <div
                      key={`list-def-weak-${type}`}
                      onClick={() => handleColHeaderClick(type as PokemonType)}
                      className="tab-btn"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid var(--border-glass)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                        <div style={{ width: "65px" }}><TypeBadge type={type as PokemonType} size="sm" /></div>
                        <div style={{ flex: 1, height: "6px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ width: `${score}%`, height: "100%", backgroundColor: "var(--accent-violet)" }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "12px" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent-violet)" }}>{score}%</span>
                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700 }}>⚔️ 特訓 ➡</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 警報ホログラムマトリクス・サブタブ */}
      {activeSubTab === "heatmap" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          
          <div className="glass-panel" style={{ padding: "10px 14px", backgroundColor: "rgba(239, 68, 68, 0.03)", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--error)", fontWeight: 700 }}>
              ⚠️ [ホログラフィック警報アラート検知]
            </span>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              赤く点滅している対面は、クイズ中に何度も計算ミスや選出ミスを犯している<strong>盲点相性</strong>です。セルを選択すると、その場ですぐに特訓シミュレータが起動します。
            </p>
          </div>

          {/* 18x18相性グリッドのスクロールラッパー */}
          <div style={{ overflowX: "auto", width: "100%", border: "1px solid var(--border-glass)", borderRadius: "10px", padding: "8px", backgroundColor: "rgba(18, 20, 32, 0.4)" }}>
            <div id="matrix-container" style={{ minWidth: "600px", width: "100%", maxWidth: "1200px", margin: "0 auto", position: "relative", padding: "6px" }}>
              
              {/* サイバーコーナーブラケット */}
              <div style={{ position: "absolute", top: 0, left: 0, width: "12px", height: "12px", borderTop: "2px solid var(--accent-cyan)", borderLeft: "2px solid var(--accent-cyan)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: 0, right: 0, width: "12px", height: "12px", borderTop: "2px solid var(--accent-cyan)", borderRight: "2px solid var(--accent-cyan)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, width: "12px", height: "12px", borderBottom: "2px solid var(--accent-cyan)", borderLeft: "2px solid var(--accent-cyan)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", borderBottom: "2px solid var(--accent-cyan)", borderRight: "2px solid var(--accent-cyan)", pointerEvents: "none" }} />

              {/* ヘッダー行 (防御タイプ) */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: "4px", position: "relative", zIndex: 6 }}>
                <div style={{ width: "60px", flexShrink: 0, fontSize: "0.6rem", textAlign: "center", color: "var(--text-muted)", fontWeight: 700 }}>攻＼防</div>
                {TYPE_LIST.map(def => {
                  const info = getStratumInfo(def, "def");
                  const isHighDanger = info.stratum === "danger-high";
                  const isDanger = info.stratum === "danger-high" || info.stratum === "danger-mid";
                  const isMastered = info.stratum === "mastered";

                  // 背景・枠線スタイルの決定
                  let headerBg = "transparent";
                  let headerBorder = "none";
                  let headerGlow = "none";
                  if (isHighDanger) {
                    headerBg = "rgba(239, 68, 68, 0.12)";
                    headerBorder = "1px solid rgba(239, 68, 68, 0.4)";
                    headerGlow = "0 0 6px rgba(239, 68, 68, 0.2)";
                  } else if (isDanger) {
                    headerBg = "rgba(239, 68, 68, 0.06)";
                    headerBorder = "1px solid rgba(239, 68, 68, 0.25)";
                  } else if (isMastered) {
                    headerBg = "rgba(6, 182, 212, 0.05)";
                    headerBorder = "1px solid rgba(6, 182, 212, 0.2)";
                  }

                  return (
                    <div
                      key={`col-${def}`}
                      onClick={() => handleColHeaderClick(def)}
                      className={`col-header col-header-${def}`}
                      style={{
                        flex: 1,
                        minWidth: "0",
                        margin: "1px",
                        fontSize: "0.6rem",
                        fontWeight: 800,
                        textAlign: "center",
                        color: TYPE_DETAILS[def].color,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2px",
                        padding: "4px 0 2px 0",
                        backgroundColor: headerBg,
                        border: headerBorder,
                        borderRadius: "4px",
                        boxShadow: headerGlow,
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "1px", height: "auto", minHeight: "10px", wordBreak: "break-all", textAlign: "center", justifyContent: "center", lineHeight: "1.1" }}>
                        {isHighDanger ? (
                          <span className="warning-danger-blink" style={{ fontSize: "0.55rem" }}>⚠️</span>
                        ) : isDanger ? (
                          <span className="warning-dot" style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--error)" }} />
                        ) : null}
                        {TYPE_DETAILS[def].ja}
                      </div>
                      
                      {/* プロポーション比率バー */}
                      <div style={{
                        width: "80%",
                        height: "3px",
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        borderRadius: "1.5px",
                        overflow: "hidden",
                        display: "flex",
                        marginTop: "2px"
                      }}>
                        {info.weak > 0 && (
                          <div style={{ width: `${(info.weak / 18) * 100}%`, height: "100%", backgroundColor: "var(--error)" }} />
                        )}
                        {info.neutral > 0 && (
                          <div style={{ width: `${(info.neutral / 18) * 100}%`, height: "100%", backgroundColor: "var(--success)" }} />
                        )}
                        {info.mastered > 0 && (
                          <div style={{ width: `${(info.mastered / 18) * 100}%`, height: "100%", backgroundColor: "var(--accent-cyan)" }} />
                        )}
                        {info.unscanned > 0 && (
                          <div style={{ width: `${(info.unscanned / 18) * 100}%`, height: "100%", backgroundColor: "rgba(255, 255, 255, 0.12)" }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 各行のレンダリング (攻撃タイプ) */}
              {TYPE_LIST.map(atk => {
                const info = getStratumInfo(atk, "atk");
                const isHighDanger = info.stratum === "danger-high";
                const isDanger = info.stratum === "danger-high" || info.stratum === "danger-mid";
                const isMastered = info.stratum === "mastered";

                // 背景・枠線スタイルの決定
                let headerBg = "transparent";
                let headerBorder = "none";
                let headerGlow = "none";
                if (isHighDanger) {
                  headerBg = "rgba(239, 68, 68, 0.12)";
                  headerBorder = "1px solid rgba(239, 68, 68, 0.4)";
                  headerGlow = "0 0 6px rgba(239, 68, 68, 0.2)";
                } else if (isDanger) {
                  headerBg = "rgba(239, 68, 68, 0.06)";
                  headerBorder = "1px solid rgba(239, 68, 68, 0.25)";
                } else if (isMastered) {
                  headerBg = "rgba(6, 182, 212, 0.05)";
                  headerBorder = "1px solid rgba(6, 182, 212, 0.2)";
                }

                return (
                  <div key={`row-${atk}`} style={{ display: "flex", alignItems: "center", marginBottom: "2px", position: "relative", zIndex: 6 }}>
                    <div
                      onClick={() => handleRowHeaderClick(atk)}
                      className={`row-header row-header-${atk}`}
                      style={{
                        width: "60px",
                        flexShrink: 0,
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        color: TYPE_DETAILS[atk].color,
                        paddingRight: "6px",
                        textAlign: "right",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        gap: "1px",
                        backgroundColor: headerBg,
                        border: headerBorder,
                        borderRadius: "4px",
                        boxShadow: headerGlow,
                        height: "30px",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                        {isHighDanger ? (
                          <span className="warning-danger-blink" style={{ fontSize: "0.55rem" }}>⚠️</span>
                        ) : isDanger ? (
                          <span className="warning-dot" style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--error)" }} />
                        ) : null}
                        {TYPE_DETAILS[atk].ja}
                      </div>

                      {/* プロポーション比率バー */}
                      <div style={{
                        width: "36px",
                        height: "3px",
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        borderRadius: "1.5px",
                        overflow: "hidden",
                        display: "flex"
                      }}>
                        {info.weak > 0 && (
                          <div style={{ width: `${(info.weak / 18) * 100}%`, height: "100%", backgroundColor: "var(--error)" }} />
                        )}
                        {info.neutral > 0 && (
                          <div style={{ width: `${(info.neutral / 18) * 100}%`, height: "100%", backgroundColor: "var(--success)" }} />
                        )}
                        {info.mastered > 0 && (
                          <div style={{ width: `${(info.mastered / 18) * 100}%`, height: "100%", backgroundColor: "var(--accent-cyan)" }} />
                        )}
                        {info.unscanned > 0 && (
                          <div style={{ width: `${(info.unscanned / 18) * 100}%`, height: "100%", backgroundColor: "rgba(255, 255, 255, 0.12)" }} />
                        )}
                      </div>
                    </div>
                    {TYPE_LIST.map(def => {
                      const key = `${atk}-${def}`;
                      const score = matchupWeakness[key];
                      const eff = getSingleMatchupMultiplier(atk, def);
                      
                      let symbol = "·";
                      if (eff === 2.0) symbol = "2";
                      else if (eff === 0.5) symbol = "½";
                      else if (eff === 0.25) symbol = "¼";
                      else if (eff === 0.0) symbol = "0";

                      const atkInfo = getStratumInfo(atk, "atk");
                      const defInfo = getStratumInfo(def, "def");
                      const isAtkDanger = atkInfo.stratum === "danger-high" || atkInfo.stratum === "danger-mid";
                      const isDefDanger = defInfo.stratum === "danger-high" || defInfo.stratum === "danger-mid";
                      const isDoubleDanger = isAtkDanger && isDefDanger && score !== undefined && score > 0;
                      const isDoubleMastered = atkInfo.stratum === "mastered" && defInfo.stratum === "mastered" && score !== undefined && score < 0;

                      let cellClassName = "";
                      if (isDoubleDanger) cellClassName = "double-danger-cell";
                      else if (isDoubleMastered) cellClassName = "double-master-cell";

                      return (
                        <button
                          key={`cell-${key}`}
                          className={`matrix-cell row-type-${atk} col-type-${def} ${cellClassName} ${score === undefined ? "cell-unplayed" : ""}`}
                          onClick={() => handleCellClick(atk, def)}
                          onMouseEnter={() => {
                            const container = document.getElementById("matrix-container");
                            if (container) {
                              container.setAttribute("data-hovered-row", atk);
                              container.setAttribute("data-hovered-col", def);
                            }
                          }}
                          onMouseLeave={() => {
                            const container = document.getElementById("matrix-container");
                            if (container) {
                              container.removeAttribute("data-hovered-row");
                              container.removeAttribute("data-hovered-col");
                            }
                          }}
                          style={{
                            flex: 1,
                            minWidth: "0",
                            height: "30px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: 900,
                            cursor: "pointer",
                            margin: "1px",
                            borderRadius: "4px",
                            position: "relative",
                            ...({
                              color: eff === 2.0 ? "var(--success)" : eff === 0.5 || eff === 0.25 ? "var(--accent-violet)" : eff === 0.0 ? "var(--error)" : "rgba(255, 255, 255, 0.4)",
                              border: "1px solid rgba(255,255,255,0.03)",
                              backgroundColor: "rgba(255,255,255,0.01)",
                            } as React.CSSProperties),
                            ...getGlowStyle(score)
                          }}
                          title={`${TYPE_DETAILS[atk].ja} ➡ ${TYPE_DETAILS[def].ja} (倍率: ${eff}x, 苦手度: ${score || 0})`}
                        >
                          {symbol}
                          {score !== undefined && score > 0 && (
                            <span
                              style={{
                                position: "absolute",
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                backgroundColor: "var(--error)",
                                top: "2px",
                                right: "2px",
                                boxShadow: "0 0 2px var(--error)"
                              }}
                            />
                          )}
                          {score !== undefined && score < 0 && (
                            <span
                              style={{
                                position: "absolute",
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                backgroundColor: "var(--accent-cyan)",
                                top: "2px",
                                right: "2px",
                                boxShadow: "0 0 2px var(--accent-cyan)"
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 弱点の化身シャドウボス・サブタブ */}
      {activeSubTab === "boss" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {!bossPokemon ? (
            <div className="glass-panel" style={{ padding: "32px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "2rem" }}>📡</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800 }}>弱点スキャンデータ未検出</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", maxWidth: "400px" }}>
                シャドウボスを特定するための苦手履歴が不足しています。タイプ相性クイズや一貫技クイズをプレイして、スキャンデータを蓄積してください！
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* ボス概要パネル */}
              {battleState === "idle" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                  
                  {/* 左: ボスビジュアル */}
                  <div className="glass-panel" style={{ flex: 1, minWidth: isMobile ? "100%" : "280px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                    
                    {/* 背景演出用スキャンライン */}
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))",
                      backgroundSize: "100% 4px, 6px 100%",
                      pointerEvents: "none"
                    }} />

                    {/* シャドウボスの暗黒シルエットスプライト */}
                    <div style={{
                      width: "140px",
                      height: "140px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      filter: "brightness(0) drop-shadow(0 0 10px rgba(139, 92, 246, 0.8)) saturate(0)",
                      animation: "pulse 2s infinite ease-in-out"
                    }}>
                      <img
                        src={bossPokemon.sprite}
                        alt="Shadow Pokemon"
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                      />
                    </div>

                    <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--accent-violet)" }}>
                      {bossPokemon.nameJa}
                    </h3>
                    
                    <div style={{ display: "flex", gap: "6px" }}>
                      {bossTypes.map(t => <TypeBadge key={`boss-t-${t}`} type={t} size="sm" />)}
                    </div>
                  </div>

                  {/* 右: ボス分析詳細＆レイド開始 */}
                  <div className="glass-panel" style={{ flex: 1.5, minWidth: isMobile ? "100%" : "340px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-violet)" }}>
                      👾 弱点の具現化：シャドウボス検知
                    </span>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      このシャドウボスは、あなたが最も苦手とする相性（<strong>{bossTypes.map(t => TYPE_DETAILS[t].ja).join("・")}</strong>）をベースに生み出された仮想生命体です。
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      ターン制の「レイド特訓バトル」に挑戦し、ボスの複合タイプに対する最大打点攻撃や、ボスのタイプからの防御選出を成功させて討伐・浄化してください。撃破に成功すると、<strong>該当タイプの苦手履歴が30%削減</strong>され、勲章を獲得できます。
                    </p>

                    <button
                      onClick={startRaidBattle}
                      className="btn-primary"
                      style={{
                        padding: "12px 24px",
                        fontSize: "0.95rem",
                        width: "100%",
                        marginTop: "auto",
                        background: "linear-gradient(135deg, var(--accent-violet), var(--error))",
                        border: "1px solid var(--border-glass-active)",
                        boxShadow: "0 0 15px rgba(139, 92, 246, 0.4)"
                      }}
                    >
                      レイドバトルを開始する！ (HP 100)
                    </button>
                  </div>

                </div>
              )}

              {/* バトル進行中の画面 */}
              {battleState === "playing" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  
                  {/* ボスのステータスバー */}
                  <div className="glass-panel" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px", backgroundColor: "rgba(0,0,0,0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700 }}>
                      <span style={{ color: "var(--accent-violet)" }}>👾 {bossPokemon.nameJa} (複合弱点ボス)</span>
                      <span style={{ color: "var(--error)" }}>HP: {bossHP} / 100</span>
                    </div>
                    {/* HPゲージ */}
                    <div style={{ width: "100%", height: "12px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border-glass)" }}>
                      <div style={{ width: `${bossHP}%`, height: "100%", backgroundColor: "var(--error)", boxShadow: "0 0 8px var(--error-glow)", transition: "width 0.3s ease" }} />
                    </div>
                    {/* ターン表示 */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                      <span>戦闘ターン: {battleTurn} / 5</span>
                      <span>
                        フェーズ: {battleTurn <= 3 ? "⚔️ 攻撃 (最大打点選択)" : "🛡️ 防御 (キータイプ耐え抜き)"}
                      </span>
                    </div>
                  </div>

                  {/* 戦闘グラフィック */}
                  <div className="glass-panel" style={{ height: "140px", display: "flex", alignItems: "center", justifyContent: "space-around", position: "relative", overflow: "hidden", background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0) 70%)" }}>
                    
                    {/* 左: プレイヤー（剣と盾のシンボル） */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <div style={{ fontSize: "2.5rem", filter: "drop-shadow(0 0 8px var(--accent-cyan-glow))" }}>🛡️</div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>あなた</span>
                    </div>

                    {/* 中央: ログ表示 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "50%", textAlign: "center" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>{playerLog}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic" }}>{bossLog}</div>
                    </div>

                    {/* 右: ボスシルエット */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <div style={{
                        width: "80px",
                        height: "80px",
                        filter: "brightness(0) drop-shadow(0 0 8px rgba(139,92,246,0.8)) saturate(0)",
                        animation: "pulse 1.5s infinite"
                      }}>
                        <img src={bossPokemon.sprite} alt="Shadow Boss" style={{ maxWidth: "100%", maxHeight: "100%" }} />
                      </div>
                      <div style={{ display: "flex", gap: "2px" }}>
                        {bossTypes.map(t => <span key={`bt-${t}`} style={{ fontSize: "0.5rem", padding: "1px 4px", backgroundColor: TYPE_DETAILS[t].color, borderRadius: "2px", fontWeight: "bold" }}>{TYPE_DETAILS[t].ja.substring(0,1)}</span>)}
                      </div>
                    </div>
                  </div>

                  {/* アクション選択肢 */}
                  <div className="glass-panel" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    
                    {battleTurn <= 3 ? (
                      // 攻撃フェーズ
                      <>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, textAlign: "center", color: "var(--accent-cyan)" }}>
                          👇 最も効果バツグン（最大打点）となる攻撃タイプを選択してください！
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: "8px" }}>
                          {offenseHand.map(atkType => (
                            <button
                              key={`raid-atk-${atkType}`}
                              onClick={() => executeOffenseAction(atkType)}
                              className="tab-btn"
                              style={{
                                padding: "12px",
                                fontSize: "0.9rem",
                                fontWeight: 800,
                                border: `1.5px solid ${TYPE_DETAILS[atkType].color}`,
                                backgroundColor: "rgba(18, 20, 32, 0.4)",
                                color: "#ffffff",
                                cursor: "pointer",
                                borderRadius: "8px",
                                textShadow: `0 0 4px ${TYPE_DETAILS[atkType].glowColor}`
                              }}
                            >
                              {TYPE_DETAILS[atkType].ja}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      // 防御フェーズ
                      <>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, textAlign: "center", color: "var(--warning)" }}>
                          ⚡ ボスが <TypeBadge type={bossAtkType} size="sm" /> タイプで攻撃してきます！<br />
                          ドラフトから「半減以下」で耐え抜ける受けポケモンを選択してください！
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: "8px", justifyContent: "center" }}>
                          {defenseDraft.map(poke => (
                            <div
                              key={`raid-def-poke-${poke.id}`}
                              onClick={() => executeDefenseAction(poke)}
                              style={{ cursor: "pointer", display: "flex", justifyContent: "center" }}
                            >
                              <PokemonCard
                                pokemon={poke}
                                size="sm"
                                showSprite={true}
                                badgeSize="sm"
                              />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                </div>
              )}

              {/* 勝利時のリザルト */}
              {battleState === "victory" && (
                <div className="glass-panel animate-pop-in" style={{ padding: "32px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", border: "2px solid var(--success)", backgroundColor: "rgba(16, 185, 129, 0.05)" }}>
                  <div style={{ fontSize: "3rem", filter: "drop-shadow(0 0 10px var(--success-glow))" }}>🏆</div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--success)" }}>
                    シャドウボス 討伐＆浄化成功！
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "480px", lineHeight: 1.6 }}>
                    おめでとうございます！完璧な判断力でボスを浄化しました。<br />
                    報酬として、**{bossTypes.map(t => TYPE_DETAILS[t].ja).join("・")}** タイプのすべての苦手度データが **30% 軽減** されました。
                  </p>

                  <div className="glass-panel" style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.5rem" }}>🎖️</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--warning)" }}>
                      称号獲得: 「{bossTypes.map(t => TYPE_DETAILS[t].ja).join("・")}の守護者」
                    </span>
                  </div>

                  <button onClick={() => setBattleState("idle")} className="btn-primary" style={{ padding: "10px 30px", fontSize: "0.9rem" }}>
                    ダッシュボードに戻る
                  </button>
                </div>
              )}

              {/* 敗北時のリザルト */}
              {battleState === "defeat" && (
                <div className="glass-panel animate-shake" style={{ padding: "32px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", border: "2px solid var(--error)", backgroundColor: "rgba(239, 68, 68, 0.05)" }}>
                  <div style={{ fontSize: "3rem", filter: "drop-shadow(0 0 10px var(--error-glow))" }}>💀</div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--error)" }}>
                    討伐失敗...
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "480px", lineHeight: 1.6 }}>
                    力及ばず、ボスの苦手相性攻撃に倒れました。<br />
                    警報ホログラムマトリクスから個別に特訓を重ねるか、通常のクイズをプレイして苦手意識を克服し、再び挑戦しましょう！
                  </p>

                  <button onClick={() => setBattleState("idle")} className="btn-primary" style={{ padding: "10px 30px", fontSize: "0.9rem" }}>
                    ダッシュボードに戻る
                  </button>
                </div>
              )}

            </div>
          )}

          {/* トロフィーキャビネット（勲章一覧） */}
          {battleState === "idle" && (
            <div className="glass-panel" style={{ padding: "16px", marginTop: "8px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--warning)", display: "flex", alignItems: "center", gap: "6px" }}>
                🏆 浄化済シャドウ勲章キャビネット
              </span>
              {purifiedMedals.length === 0 ? (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px", fontStyle: "italic" }}>
                  キャビネットは空です。シャドウボスを浄化して勲章バッジを飾りましょう！
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                  {purifiedMedals.map((medal, idx) => (
                    <div
                      key={`medal-${idx}`}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        backgroundColor: "rgba(245, 158, 11, 0.08)",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        boxShadow: "0 0 6px rgba(245, 158, 11, 0.1)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#F59E0B",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <span>🎖️</span> {medal}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* 特訓シミュレーター（ポップアップモーダル風） */}
      {simQuestionsList.length > 0 && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "16px"
        }}>
          <div className="glass-panel glow-card" style={{ padding: "20px", maxWidth: "400px", width: "100%", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid var(--border-glass-active)" }}>
            
            {/* ヘッダー */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--error)", display: "flex", alignItems: "center", gap: "6px" }}>
                ⚔️ 苦手克服特訓 {!simStreakFinished && `(${simQuestionIdx + 1} / 5)`}
              </span>
              <button
                onClick={() => setSimQuestionsList([])}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
                title="特訓を中断する"
              >
                ×
              </button>
            </div>

            {!simStreakFinished ? (
              // クイズ進行中画面
              <>
                {/* 現在の問題対面 */}
                {(() => {
                  const currentPair = simQuestionsList[simQuestionIdx];
                  if (!currentPair) return null;
                  const mult = getEffectiveness(currentPair.atk, [currentPair.def]);
                  const correctChoice = mult === 2.0 ? "2倍" : mult === 0.5 ? "0.5倍" : mult === 0.0 ? "0倍" : "1倍";
                  const simChoices = ["2倍", "1倍", "0.5倍", "0倍"];

                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px" }}>
                        <TypeBadge type={currentPair.atk} size="sm" />
                        <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>攻撃 ➡</span>
                        <TypeBadge type={currentPair.def} size="sm" />
                        <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>防御</span>
                      </div>

                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                          この相性のダメージ倍率を選択してください：
                        </p>
                      </div>

                      {/* 選択肢 */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {simChoices.map(choice => {
                          let border = "1px solid var(--border-glass)";
                          let bg = "transparent";
                          if (simAnswered) {
                            if (choice === correctChoice) {
                              border = "2px solid var(--success)";
                              bg = "rgba(16, 185, 129, 0.15)";
                            } else if (choice === simSelected) {
                              border = "2px solid var(--error)";
                              bg = "rgba(239, 68, 68, 0.15)";
                            }
                          }

                          return (
                            <button
                              key={`sim-choice-${choice}`}
                              onClick={() => !simAnswered && handleSimSubmit(choice)}
                              disabled={simAnswered}
                              className="tab-btn"
                              style={{
                                padding: "10px",
                                fontSize: "0.85rem",
                                border,
                                backgroundColor: bg,
                                fontWeight: 700,
                                cursor: simAnswered ? "default" : "pointer"
                              }}
                            >
                              {choice}
                            </button>
                          );
                        })}
                      </div>

                      {simAnswered && (
                        <div style={{
                          padding: "10px",
                          borderRadius: "6px",
                          backgroundColor: simSelected === correctChoice ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                          border: `1px solid ${simSelected === correctChoice ? "var(--success)" : "var(--error)"}`,
                          textAlign: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: simSelected === correctChoice ? "var(--success)" : "var(--error)"
                        }}>
                          {simSelected === correctChoice
                            ? "🎉 正解！この相性ペアの苦手度が減少しました。"
                            : `❌ 残念！正解は 「${correctChoice}」 です。`}
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                        {simAnswered && (
                          simQuestionIdx < 4 ? (
                            <button
                              onClick={() => {
                                setSimQuestionIdx(prev => prev + 1);
                                setSimAnswered(false);
                                setSimSelected(null);
                              }}
                              className="btn-primary"
                              style={{ padding: "8px 18px", fontSize: "0.8rem" }}
                            >
                              次の問題へ ➡
                            </button>
                          ) : (
                            <button
                              onClick={() => setSimStreakFinished(true)}
                              className="btn-primary"
                              style={{ padding: "8px 18px", fontSize: "0.8rem" }}
                            >
                              結果を見る 🏆
                            </button>
                          )
                        )}
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              // 結果発表画面
              <>
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "12px", padding: "16px 0" }}>
                  <div style={{ fontSize: "2.5rem" }}>🏆</div>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--accent-cyan)" }}>
                    克服特訓完了！
                  </h4>
                  <p style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--text-primary)" }}>
                    5問中 <span style={{ color: simCorrectCount >= 3 ? "var(--success)" : "var(--error)" }}>{simCorrectCount}</span> 問正解
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {simCorrectCount === 5
                      ? "🎉 パーフェクト！苦手意識を完全に克服しました。この調子を維持しましょう！"
                      : simCorrectCount >= 3
                      ? "👍 素晴らしい！苦手箇所の理解が着実に進んでいます。"
                      : "💪 まだまだ伸び代があります。繰り返し特訓して克服を重ねましょう！"}
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    onClick={() => setSimQuestionsList([])}
                    className="btn-primary"
                    style={{ padding: "10px 24px", fontSize: "0.85rem", width: "100%" }}
                  >
                    特訓を完了する
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
