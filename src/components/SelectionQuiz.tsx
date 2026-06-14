import React, { useState, useEffect } from "react";
import { LOCAL_POKEMONS } from "../data/localPokemons";
import type { PokemonData } from "../data/localPokemons";
import { fetchPokemonById } from "../utils/pokemonApi";
import { getEffectiveness, TYPE_LIST } from "../utils/typeMatrix";
import type { PokemonType } from "../utils/typeMatrix";
import { PokemonCard } from "./PokemonCard";

type SelectionQuizCategory = "offense-4x" | "defense-4x" | "offense-all" | "defense-min-2x";

const SELECTION_WEIGHTS_KEY = "poke-learn-selection-weights";

export const SelectionQuiz: React.FC = () => {
  const [category, setCategory] = useState<SelectionQuizCategory>("offense-4x");
  const [isFocusedMode, setIsFocusedMode] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [isShortScreen, setIsShortScreen] = useState<boolean>(window.innerHeight < 800 || window.innerWidth < 768);

  // リフレッシュやリサイズなどのハンドラー
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsShortScreen(window.innerHeight < 800 || window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // リクエスト競合（レースコンディション）対策用の参照
  const requestCounterRef = React.useRef(0);

  // ポケモンチーム状態
  const [userTeam, setUserTeam] = useState<PokemonData[]>([]);
  const [oppTeam, setOppTeam] = useState<PokemonData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ユーザーの選出 (インデックスの配列、最大3つ)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // クイズ回答状態
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [correctAnswersList, setCorrectAnswersList] = useState<number[][]>([]); // 正解となる選出インデックスの組み合わせ一覧
  
  // 統計
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  // ポケモンごとの個別判定キャッシュ
  // 1. 各味方ポケモンのタイプ一致技が、敵6体のいずれかに4倍弱点を突けるか
  const checkOffense4x = (userPoke: PokemonData, opps: PokemonData[]): boolean => {
    return userPoke.types.some(uType =>
      opps.some(opp => getEffectiveness(uType, opp.types) === 4.0)
    );
  };

  // 2. 各味方ポケモンが、敵6体のどのタイプ一致技からも4倍弱点を受けないか
  const checkDefense4xSafe = (userPoke: PokemonData, opps: PokemonData[]): boolean => {
    return !opps.some(opp =>
      opp.types.some(oppType => getEffectiveness(oppType, userPoke.types) === 4.0)
    );
  };

  // 全ての選出パターン(6体から3体選ぶ組み合わせ: 20通り)を生成
  const getCombinations = (): number[][] => {
    const combs: number[][] = [];
    const helper = (start: number, active: number[]) => {
      if (active.length === 3) {
        combs.push([...active]);
        return;
      }
      for (let i = start; i < 6; i++) {
        active.push(i);
        helper(i + 1, active);
        active.pop();
      }
    };
    helper(0, []);
    return combs;
  };

  // クイズの解答判定と正解パターンの全網羅
  const calculateCorrectAnswers = (uTeam: PokemonData[], oTeam: PokemonData[]) => {
    const allCombs = getCombinations();
    const validCombs: number[][] = [];

    if (category === "offense-4x") {
      // 4倍弱点攻撃選出: 選んだ3体全員が、敵の誰かに4倍弱点を突けること
      // かつ、敵チームの中のすべての4倍弱点持ちポケモンに対して、選んだ3体のうち誰かが4倍弱点を突けること（カバーできていること）
      const oppsWith4x = oTeam.filter(opp =>
        TYPE_LIST.some(atk => getEffectiveness(atk, opp.types) === 4.0)
      );

      allCombs.forEach(comb => {
        const userPokes = comb.map(idx => uTeam[idx]);
        
        // 条件1: 選んだ3体全員が、敵の誰かに4倍弱点を突ける
        const okEach = comb.every(idx => checkOffense4x(uTeam[idx], oTeam));
        
        // 条件2: 敵のすべての4倍弱点持ちポケモンに対し、選んだ3体のいずれかが4倍弱点を突ける
        const okAllCovered = oppsWith4x.every(opp =>
          userPokes.some(uPoke =>
            uPoke.types.some(uType => getEffectiveness(uType, opp.types) === 4.0)
          )
        );

        if (okEach && okAllCovered) {
          validCombs.push(comb);
        }
      });
    } else if (category === "defense-4x") {
      // 4倍回避防御選出: 選んだ3体全員が、敵のどの攻撃からも4倍を受けないこと
      allCombs.forEach(comb => {
        const ok = comb.every(idx => checkDefense4xSafe(uTeam[idx], oTeam));
        if (ok) validCombs.push(comb);
      });
    } else if (category === "offense-all") {
      // 一貫性攻撃選出: 3体のタイプ一致技で、敵6体全員の弱点(2x or 4x)をカバーできること
      allCombs.forEach(comb => {
        const activeUserPokes = comb.map(idx => uTeam[idx]);
        const covered = oTeam.every(opp =>
          activeUserPokes.some(uPoke =>
            uPoke.types.some(uType => getEffectiveness(uType, opp.types) >= 2.0)
          )
        );
        if (covered) validCombs.push(comb);
      });
    } else if (category === "defense-min-2x") {
      // 鉄壁防御選出: 3体全員が4倍を受けず、さらに「2倍弱点を受ける味方の総数」を最小にする選出
      // まず4倍を受けない組み合わせをフィルタ
      const no4xCombs = allCombs.filter(comb =>
        comb.every(idx => checkDefense4xSafe(uTeam[idx], oTeam))
      );

      if (no4xCombs.length > 0) {
        // 各組み合わせについて、2倍弱点を受けてしまう味方の数をカウント
        const scores = no4xCombs.map(comb => {
          let weakCount = 0;
          comb.forEach(idx => {
            const uPoke = uTeam[idx];
            // 敵の技で2倍弱点があるか
            const has2x = oTeam.some(opp =>
              opp.types.some(oppType => getEffectiveness(oppType, uPoke.types) === 2.0)
            );
            if (has2x) weakCount++;
          });
          return { comb, weakCount };
        });

        // 最小のweakCountを特定
        const minWeak = Math.min(...scores.map(s => s.weakCount));
        scores.forEach(s => {
          if (s.weakCount === minWeak) {
            validCombs.push(s.comb);
          }
        });
      }
    }

    return validCombs;
  };

  // チームのセットアップ (構成的ドラフトシステムで回答なし状態を完全回避)
  const setupQuiz = async () => {
    const requestId = ++requestCounterRef.current;
    setLoading(true);
    setIsAnswered(false);
    setSelectedIndices([]);

    // 苦手克服データ取得
    const weightsRaw = localStorage.getItem(SELECTION_WEIGHTS_KEY);
    const weights: Record<string, number> = weightsRaw ? JSON.parse(weightsRaw) : {};

    let uTeamIds: number[] = [];
    let oTeamIds: number[] = [];

    // タイププールとシャッフル用のユーティリティ
    const shuffleArray = <T,>(arr: T[]): T[] => [...arr].sort(() => 0.5 - Math.random());

    // 攻撃選出 (4倍狙い) で、相手チームのすべての4倍弱点を持つポケモンに対して、必ずこちら側にカウンターが存在するように最終保証
    const enforceOffense4xCounter = (userT: PokemonData[], oppT: PokemonData[]): PokemonData[] => {
      let resultTeam = [...userT];
      const oppsWith4x = oppT.filter(opp =>
        TYPE_LIST.some(atk => getEffectiveness(atk, opp.types) === 4.0)
      );

      oppsWith4x.forEach(opp => {
        const weakAtkTypes = TYPE_LIST.filter(atk => getEffectiveness(atk, opp.types) === 4.0);
        const hasCounter = resultTeam.some(u =>
          u.types.some(t => weakAtkTypes.includes(t))
        );

        if (!hasCounter) {
          const counterCandidates = LOCAL_POKEMONS.filter(p =>
            p.types.some(t => weakAtkTypes.includes(t)) && !resultTeam.some(u => u.id === p.id)
          );
          
          if (counterCandidates.length > 0) {
            const replacement = shuffleArray(counterCandidates)[0];
            let replaceIdx = -1;
            
            for (let i = resultTeam.length - 1; i >= 0; i--) {
              const currentPoke = resultTeam[i];
              const isOnlyCounterForOther = oppsWith4x.some(otherOpp => {
                if (otherOpp.id === opp.id) return false;
                const otherWeakTypes = TYPE_LIST.filter(atk => getEffectiveness(atk, otherOpp.types) === 4.0);
                const isCounter = currentPoke.types.some(t => otherWeakTypes.includes(t));
                if (!isCounter) return false;
                
                const otherCountersCount = resultTeam.filter(u =>
                  u.id !== currentPoke.id && u.types.some(t => otherWeakTypes.includes(t))
                ).length;
                return otherCountersCount === 0;
              });

              if (!isOnlyCounterForOther) {
                replaceIdx = i;
                break;
              }
            }

            if (replaceIdx !== -1) {
              resultTeam[replaceIdx] = replacement;
            } else {
              resultTeam[resultTeam.length - 1] = replacement;
            }
          }
        }
      });

      return resultTeam;
    };

    // 防御選出 (4倍回避) および 鉄壁防御選出では、味方チームに単タイプが含まれない（複合タイプのみ）ように制御
    const userCandidates = (category === "defense-4x" || category === "defense-min-2x")
      ? LOCAL_POKEMONS.filter(p => p.types.length === 2)
      : LOCAL_POKEMONS;

    if (category === "offense-4x") {
      // 1) 攻撃選出 (4倍狙い):
      // - 相手チームに4倍弱点を持つポケモンを1〜3体確定配置
      // - 味方チームにそれらに対して4倍弱点攻撃(STAB)を行えるポケモンを最低3体確定配置

      // 全150体から4倍弱点を持つポケモンを検索
      const fourXWeakOppPool = LOCAL_POKEMONS.filter(opp =>
        TYPE_LIST.some(atk => getEffectiveness(atk, opp.types) === 4.0)
      );
      
      const oppAnchors = shuffleArray(fourXWeakOppPool).slice(0, 2);
      oppAnchors.forEach(p => oTeamIds.push(p.id));

      // 4倍弱点となるタイプを特定
      const weakAtkTypes = new Set<PokemonType>();
      oppAnchors.forEach(opp => {
        TYPE_LIST.forEach(atk => {
          if (getEffectiveness(atk, opp.types) === 4.0) {
            weakAtkTypes.add(atk);
          }
        });
      });

      // その4倍タイプをタイプ一致技（STAB）として繰り出せる味方を検索
      const eligibleUserPool = LOCAL_POKEMONS.filter(p =>
        p.types.some(t => weakAtkTypes.has(t))
      );

      const userAnchors = shuffleArray(eligibleUserPool).slice(0, 3);
      userAnchors.forEach(p => uTeamIds.push(p.id));

    } else if (category === "defense-4x") {
      // 2) 防御選出 (4倍回避):
      // - 相手の攻撃タイプに対し、4倍弱点を受けない安全な味方が最低3体確定配置

      // 相手チームを6体ランダムにピックアップ
      const opps = shuffleArray(LOCAL_POKEMONS).slice(0, 6);
      opps.forEach(p => oTeamIds.push(p.id));

      // 相手チームの全一致攻撃タイプを抽出
      const oppAtkTypes = new Set<PokemonType>();
      opps.forEach(opp => opp.types.forEach(t => oppAtkTypes.add(t)));

      // 相手のいかなる攻撃タイプからも4倍弱点を受けない安全な味方を検索（複合タイプのみ）
      const safeUserPool = userCandidates.filter(user =>
        Array.from(oppAtkTypes).every(oppAtk => getEffectiveness(oppAtk, user.types) < 4.0)
      );

      const userAnchors = shuffleArray(safeUserPool).slice(0, 4);
      userAnchors.forEach(p => uTeamIds.push(p.id));

    } else if (category === "offense-all") {
      // 3) 一貫性攻撃選出 (全通し狙い):
      // - 味方3体のタイプ一致技の組み合わせで、敵6体全員の弱点（2倍・4倍）をカバーできる

      // 3つのランダムな攻撃タイプを選択
      const randomAtkTypes = shuffleArray(TYPE_LIST).slice(0, 3);

      // この3タイプのいずれかで弱点(2x以上)を突かれるポケモン候補を検索
      const weakOppPool = LOCAL_POKEMONS.filter(opp =>
        randomAtkTypes.some(atk => getEffectiveness(atk, opp.types) >= 2.0)
      );

      // 相手6体をピック
      const opps = shuffleArray(weakOppPool).slice(0, 6);
      // 万が一候補が足りない場合は、全体から補填
      const filledOpps = [...opps];
      if (filledOpps.length < 6) {
        const fillers = shuffleArray(LOCAL_POKEMONS).filter(p => !filledOpps.some(x => x.id === p.id));
        filledOpps.push(...fillers.slice(0, 6 - filledOpps.length));
      }
      filledOpps.forEach(p => oTeamIds.push(p.id));

      // 攻撃タイプに対応する味方を3体ドラフト
      const userAnchors: PokemonData[] = [];
      randomAtkTypes.forEach(atk => {
        const matches = LOCAL_POKEMONS.filter(p => p.types.includes(atk));
        if (matches.length > 0) {
          const match = shuffleArray(matches)[0];
          if (!userAnchors.some(x => x.id === match.id)) {
            userAnchors.push(match);
          }
        }
      });
      userAnchors.forEach(p => uTeamIds.push(p.id));

    } else {
      // 4) 鉄壁防御選出 (被ダメージ最小化):
      // - 4倍を受けず、かつ被ダメージが最小となる味方3体が存在するように配置
      
      const opps = shuffleArray(LOCAL_POKEMONS).slice(0, 6);
      opps.forEach(p => oTeamIds.push(p.id));

      const oppAtkTypes = new Set<PokemonType>();
      opps.forEach(opp => opp.types.forEach(t => oppAtkTypes.add(t)));

      // 4倍を受けない安全な味方（複合タイプのみ）
      const safeUserPool = userCandidates.filter(user =>
        Array.from(oppAtkTypes).every(oppAtk => getEffectiveness(oppAtk, user.types) < 4.0)
      );

      // 2倍弱点の被弾数が最小のもの順にソート
      const sortedSafeUserPool = [...safeUserPool].sort((a, b) => {
        const countA = Array.from(oppAtkTypes).filter(t => getEffectiveness(t, a.types) === 2.0).length;
        const countB = Array.from(oppAtkTypes).filter(t => getEffectiveness(t, b.types) === 2.0).length;
        return countA - countB;
      });

      const userAnchors = sortedSafeUserPool.slice(0, 4);
      userAnchors.forEach(p => uTeamIds.push(p.id));
    }

    // 苦手克服モードの場合：
    // - 誤答履歴のウエイトが高い苦手なタイプを、相手チームの余り枠に配置しやすくする
    if (isFocusedMode && Object.keys(weights).length > 0) {
      const sortedFailedTypes = Object.entries(weights)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0] as PokemonType);

      if (sortedFailedTypes.length > 0) {
        const targetType = sortedFailedTypes[0]; // 最も苦手なタイプ
        // 相手候補プールから苦手タイプを持つポケモンを検索
        const matches = LOCAL_POKEMONS.filter(p => p.types.includes(targetType) && !oTeamIds.includes(p.id));
        if (matches.length > 0) {
          // 相手の余り枠の差し替え用として確保
          oTeamIds.push(matches[0].id);
        }
      }
    }

    // 余り枠の補填 (重複のないようにユニーク化)
    uTeamIds = Array.from(new Set(uTeamIds));
    oTeamIds = Array.from(new Set(oTeamIds));

    // 味方を6体に補填 (単タイプ制約を適用)
    const userFillers = shuffleArray(userCandidates).filter(p => !uTeamIds.includes(p.id));
    while (uTeamIds.length < 6) {
      const filler = userFillers.pop();
      if (!filler) break;
      uTeamIds.push(filler.id);
    }

    // 相手を6体に補填
    const oppFillers = shuffleArray(LOCAL_POKEMONS).filter(p => !oTeamIds.includes(p.id));
    while (oTeamIds.length < 6) {
      const filler = oppFillers.pop();
      if (!filler) break;
      oTeamIds.push(filler.id);
    }

    // 動的PokeAPIフェッチ (またはキャッシュ / ローカルフォールバック)
    try {
      const userPromises = uTeamIds.slice(0, 6).map(id => fetchPokemonById(id));
      const oppPromises = oTeamIds.slice(0, 6).map(id => fetchPokemonById(id));

      const uTeam = await Promise.all(userPromises);
      let oTeam = await Promise.all(oppPromises);

      // 防御選出 (4倍回避) および 鉄壁防御選出では、味方チームに単タイプが含まれないことを最終保証
      let finalUTeam = uTeam;
      if (category === "defense-4x" || category === "defense-min-2x") {
        const hasSingleType = finalUTeam.some(p => p.types.length !== 2);
        if (hasSingleType) {
          const dualCandidates = LOCAL_POKEMONS.filter(p => p.types.length === 2 && !finalUTeam.some(x => x.id === p.id));
          const shuffledCandidates = shuffleArray(dualCandidates);
          finalUTeam = finalUTeam.map(p => {
            if (p.types.length !== 2) {
              const replacement = shuffledCandidates.pop();
              return replacement || p;
            }
            return p;
          });
        }
      }

      // 攻撃選出 (4倍狙い) で、相手の4倍弱点を持つ全てのポケモンに対して、必ずこちら側にカウンターが存在するように最終保証
      if (category === "offense-4x") {
        finalUTeam = enforceOffense4xCounter(finalUTeam, oTeam);
      }

      if (requestId !== requestCounterRef.current) return;

      // 解答を再計算
      let answers = calculateCorrectAnswers(finalUTeam, oTeam);

      // 解答がない場合（4倍弱点が多すぎて3枠でカバーしきれない等）、解が存在するまで4倍弱点持ちの相手を非4倍のポケモンに置き換える
      if (category === "offense-4x" && answers.length === 0) {
        const non4xOppPool = LOCAL_POKEMONS.filter(p =>
          !TYPE_LIST.some(atk => getEffectiveness(atk, p.types) === 4.0)
        );
        const shuffledOpps = shuffleArray(non4xOppPool);
        let adjustedOTeam = [...oTeam];

        for (let i = 0; i < adjustedOTeam.length; i++) {
          const opp = adjustedOTeam[i];
          const has4x = TYPE_LIST.some(atk => getEffectiveness(atk, opp.types) === 4.0);
          if (has4x) {
            const replacement = shuffledOpps.pop();
            if (replacement) {
              adjustedOTeam[i] = replacement;
              finalUTeam = enforceOffense4xCounter(uTeam, adjustedOTeam);
              answers = calculateCorrectAnswers(finalUTeam, adjustedOTeam);
              if (answers.length > 0) {
                oTeam = adjustedOTeam;
                break;
              }
            }
          }
        }
      }

      setUserTeam(finalUTeam);
      setOppTeam(oTeam);
      setCorrectAnswersList(answers);
      setLoading(false);
    } catch (err) {
      console.error("Constructive fetch failed, using local safety sync.", err);
      
      if (requestId !== requestCounterRef.current) return;

      // 完全ローカルフォールバック
      const uTeam = uTeamIds.slice(0, 6).map(id => LOCAL_POKEMONS.find(p => p.id === id)!);
      let oTeam = oTeamIds.slice(0, 6).map(id => LOCAL_POKEMONS.find(p => p.id === id)!);

      // フォールバック時も同様に最終保証
      let finalUTeam = uTeam;
      if (category === "defense-4x" || category === "defense-min-2x") {
        const hasSingleType = finalUTeam.some(p => p.types.length !== 2);
        if (hasSingleType) {
          const dualCandidates = LOCAL_POKEMONS.filter(p => p.types.length === 2 && !finalUTeam.some(x => x.id === p.id));
          const shuffledCandidates = shuffleArray(dualCandidates);
          finalUTeam = finalUTeam.map(p => {
            if (p.types.length !== 2) {
              const replacement = shuffledCandidates.pop();
              return replacement || p;
            }
            return p;
          });
        }
      }

      // 攻撃選出 (4倍狙い) の最終保証 (フォールバック時)
      if (category === "offense-4x") {
        finalUTeam = enforceOffense4xCounter(finalUTeam, oTeam);
      }

      let answers = calculateCorrectAnswers(finalUTeam, oTeam);

      // 解答がない場合のローカルフォールバック時の対応
      if (category === "offense-4x" && answers.length === 0) {
        const non4xOppPool = LOCAL_POKEMONS.filter(p =>
          !TYPE_LIST.some(atk => getEffectiveness(atk, p.types) === 4.0)
        );
        const shuffledOpps = shuffleArray(non4xOppPool);
        let adjustedOTeam = [...oTeam];

        for (let i = 0; i < adjustedOTeam.length; i++) {
          const opp = adjustedOTeam[i];
          const has4x = TYPE_LIST.some(atk => getEffectiveness(atk, opp.types) === 4.0);
          if (has4x) {
            const replacement = shuffledOpps.pop();
            if (replacement) {
              adjustedOTeam[i] = replacement;
              finalUTeam = enforceOffense4xCounter(uTeam, adjustedOTeam);
              answers = calculateCorrectAnswers(finalUTeam, adjustedOTeam);
              if (answers.length > 0) {
                oTeam = adjustedOTeam;
                break;
              }
            }
          }
        }
      }

      setUserTeam(finalUTeam);
      setOppTeam(oTeam);
      setCorrectAnswersList(answers);
      setLoading(false);
    }
  };

  useEffect(() => {
    setupQuiz();
  }, [category, isFocusedMode]);

  // 味方選択時のアクション
  const handlePokeSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      if (prev.length >= 3) {
        // 最大3体なので、1つ目を押し出して追加
        return [...prev.slice(1), index];
      }
      return [...prev, index];
    });
  };

  // 回答送信
  const handleSubmit = () => {
    if (selectedIndices.length !== 3 || isAnswered) return;

    // ソートして比較
    const userCombSorted = [...selectedIndices].sort((a, b) => a - b);
    const isCorrectSelection = correctAnswersList.some(comb => {
      const combSorted = [...comb].sort((a, b) => a - b);
      return userCombSorted.every((val, index) => val === combSorted[index]);
    });

    setIsCorrect(isCorrectSelection);
    setIsAnswered(true);
    setScore(prev => ({
      correct: prev.correct + (isCorrectSelection ? 1 : 0),
      total: prev.total + 1,
    }));

    // 履歴（重み）の保存
    const weightsRaw = localStorage.getItem(SELECTION_WEIGHTS_KEY);
    const weights: Record<string, number> = weightsRaw ? JSON.parse(weightsRaw) : {};

    // 相手チームのすべてのタイプを抽出し、失敗した場合はそのタイプへの苦手ウエイトを増やす
    oppTeam.forEach(p => {
      p.types.forEach(t => {
        if (!isCorrectSelection) {
          weights[t] = (weights[t] || 0) + 1;
        } else {
          weights[t] = Math.max(0, (weights[t] || 0) - 1);
        }
      });
    });
    localStorage.setItem(SELECTION_WEIGHTS_KEY, JSON.stringify(weights));
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
      
      {/* サブナビゲーションと苦手克服トグル */}
      <div className="glass-panel" style={{ padding: isMobile ? "4px 8px" : "6px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "nowrap", gap: "8px", overflow: "hidden" }}>
        
        {/* 出題カテゴリ */}
        <div style={{ display: "flex", gap: "4px", flexWrap: isMobile ? "nowrap" : "wrap", overflowX: isMobile ? "auto" : "visible", width: isMobile ? "calc(100% - 90px)" : "auto", paddingBottom: isMobile ? "2px" : "0", scrollbarWidth: "none" }}>
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>
          {(
            [
              { id: "offense-4x", name: "攻撃選出 (4倍狙い)" },
              { id: "defense-4x", name: "防御選出 (4倍回避)" },
              { id: "offense-all", name: "一貫性攻撃 (全通し)" },
              { id: "defense-min-2x", name: "鉄壁防御選出" },
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
      </div>

      {/* ロード画面 */}
      {loading ? (
        <div className="glass-panel" style={{ padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", flex: 1 }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid rgba(255, 255, 255, 0.1)",
              borderTop: "3px solid var(--accent-cyan)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 500 }}>
            実戦に耐えうるバランスのチームを選出中...
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: isShortScreen ? "3px" : "8px", flex: 1 }}>
          
          {/* 出題内容解説 */}
          <div className="glass-panel glow-card" style={{ padding: isShortScreen ? "4px 8px" : "10px 16px", display: "flex", flexDirection: "column", gap: isShortScreen ? "2px" : "4px", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--accent-cyan)", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.05em" }}>
                選出問題 {category === "offense-4x" && "「攻撃選出 (4倍狙い)」"}
                {category === "defense-4x" && "「防御選出 (4倍回避)」"}
                {category === "offense-all" && "「一貫性攻撃選出 (全通し)」"}
                {category === "defense-min-2x" && "「鉄壁防御選出」"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                スコア: <strong style={{ color: "var(--success)" }}>{score.correct}</strong> / {score.total}
              </span>
            </div>

            <h2 style={{ fontSize: isMobile ? "0.85rem" : "1.05rem", fontWeight: 800, lineHeight: 1.3 }}>
              {isMobile ? (
                <>
                  {category === "offense-4x" && "一致技で敵の誰かに4倍弱点を突ける3体を選出せよ！"}
                  {category === "defense-4x" && "敵の一致技から4倍弱点を受けない安全な3体を選出せよ！"}
                  {category === "offense-all" && "味方3体の一致技で敵6体全員の弱点をカバーせよ！"}
                  {category === "defense-min-2x" && "4倍を回避しつつ、被2倍弱点の総数を最小化する3体を選出！"}
                </>
              ) : (
                <>
                  {category === "offense-4x" && "味方のうち「タイプ一致技で敵のいずれかに4倍の弱点ダメージを叩き込める」3体を選んでください。"}
                  {category === "defense-4x" && "味方のうち「敵のどのタイプ一致技を喰らっても4倍ダメージを受けない」安全な3体を選んでください。"}
                  {category === "offense-all" && "味方3体のタイプ一致技を組み合わせることで、「敵6体全員の弱点（2倍・4倍）をカバーできる」3体を選んでください。"}
                  {category === "defense-min-2x" && "味方のうち「4倍ダメージを受けず、かつ2倍弱点を被弾するポケモンの総数が最も少なくなる」最適な3体を選んでください。"}
                </>
              )}
            </h2>
          </div>

          {/* 対戦カードエリア: 敵・味方 */}
          <div style={{ display: "flex", flexDirection: "column", gap: isShortScreen ? "2px" : "6px", flexShrink: 0 }}>
            
            {/* 敵チーム (6体) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--error)", letterSpacing: "0.05em", paddingLeft: "4px" }}>
                🔴 相手チーム (タイプのみ・一致技使用可能)
              </span>
              <div style={{ display: "flex", gap: isMobile ? "6px" : "8px", overflowX: isMobile ? "auto" : "visible", width: "100%", paddingBottom: isMobile ? "4px" : "0", scrollbarWidth: "none", justifyContent: isMobile ? "flex-start" : "center" }}>
                <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                {oppTeam.map((poke, index) => (
                  <PokemonCard
                    key={`opp-${index}`}
                    pokemon={poke}
                    size="sm"
                    showSprite={true}
                    badgeSize="sm"
                  />
                ))}
              </div>
            </div>

            {/* VS パーティション */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? "4px" : "10px", margin: isMobile ? "0px" : (isShortScreen ? "1px 0" : "2px 0") }}>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, var(--border-glass), transparent)" }} />
              <span style={{ fontSize: isMobile ? "0.7rem" : "0.85rem", fontWeight: 900, color: "var(--text-muted)", letterSpacing: "0.1em", background: "rgba(0,0,0,0.3)", padding: isMobile ? "1px 8px" : "2px 12px", borderRadius: "20px", border: "1px solid var(--border-glass)" }}>
                VS
              </span>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, var(--border-glass), transparent)" }} />
            </div>

            {/* 味方チーム (6体 - 選択可能) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--success)", letterSpacing: "0.05em", paddingLeft: "4px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                <span>🟢 あなたの控えチーム (3体選択: 現在 {selectedIndices.length}/3 体)</span>
                {isAnswered && <span style={{ color: "var(--text-muted)" }}>（正解の組み合わせ: {correctAnswersList.length}通り）</span>}
              </span>
              <div style={{ display: "flex", gap: isMobile ? "6px" : "8px", overflowX: isMobile ? "auto" : "visible", width: "100%", paddingBottom: isMobile ? "4px" : "0", scrollbarWidth: "none", justifyContent: isMobile ? "flex-start" : "center" }}>
                {userTeam.map((poke, index) => {
                  const isSelected = selectedIndices.includes(index);
                  
                  // 正誤判定の表示用オーバーレイ
                  let overlay: React.ReactNode = null;
                  if (isAnswered) {
                    const isInCorrectComb = correctAnswersList.some(comb => comb.includes(index));
                    if (isSelected) {
                      // ユーザーが選択し、それが合っていた場合/間違っていた場合
                      overlay = (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "12px",
                            backgroundColor: isCorrect ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            border: `2px solid ${isCorrect ? "var(--success)" : "var(--error)"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.5rem",
                            pointerEvents: "none",
                          }}
                        >
                          {isCorrect ? "🟢" : "❌"}
                        </div>
                      );
                    } else if (isInCorrectComb) {
                      // 選択されなかったが、正答パターンに入り得るもの
                      overlay = (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "12px",
                            border: "2px dashed var(--success)",
                            backgroundColor: "rgba(16, 185, 129, 0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.7rem",
                            fontWeight: "bold",
                            color: "var(--success)",
                            pointerEvents: "none",
                          }}
                        >
                          候補
                        </div>
                      );
                    }
                  }

                  return (
                    <div key={`user-${index}`} style={{ position: "relative", flexShrink: 0 }}>
                      <PokemonCard
                        pokemon={poke}
                        size="sm"
                        clickable={!isAnswered}
                        selected={isSelected}
                        onClick={() => handlePokeSelect(index)}
                        badgeSize="sm"
                        customOverlay={overlay}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 結果＆解説表示 */}
          {isAnswered && (
            <div
              className={`glass-panel ${isCorrect ? "animate-pop-in" : "animate-shake"}`}
              style={{
                padding: isShortScreen ? "4px 8px" : "8px 12px",
                backgroundColor: isCorrect ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                border: `1px solid ${isCorrect ? "var(--success)" : "var(--error)"}`,
                boxShadow: `0 0 10px ${isCorrect ? "var(--success-glow)" : "var(--error-glow)"}`,
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                flexShrink: 1,
                minHeight: isShortScreen ? "55px" : "90px"
              }}
            >
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: isCorrect ? "var(--success)" : "var(--error)", textAlign: "center" }}>
                {isCorrect ? "🎉 見事な選出です！大正解！" : "❌ 選出ミスです！相性関係を再分析しましょう。"}
              </h3>
              
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "2px" }}>
                <strong>💡 選出解説:</strong>
                
                {category === "offense-4x" && (
                  <span>
                    各味方ポケモンのタイプ一致攻撃で4倍弱点を突ける相手:
                    <ul style={{ paddingLeft: "15px", marginTop: "2px" }}>
                      {userTeam.map((p, idx) => {
                        const targets = oppTeam.filter(opp =>
                          p.types.some(uType => getEffectiveness(uType, opp.types) === 4.0)
                        );
                        return (
                          <li key={idx} style={{ color: targets.length > 0 ? "var(--success)" : "var(--text-muted)", fontSize: "0.75rem" }}>
                            <strong>{p.nameJa}</strong>: {targets.length > 0 ? `${targets.map(t => t.nameJa).join(", ")} に4倍` : "突ける相手なし"}
                          </li>
                        );
                      })}
                    </ul>
                  </span>
                )}

                {category === "defense-4x" && (
                  <span>
                    各味方ポケモンの4倍被弾チェック:
                    <ul style={{ paddingLeft: "15px", marginTop: "2px" }}>
                      {userTeam.map((p, idx) => {
                        const threads = oppTeam.filter(opp =>
                          opp.types.some(oppType => getEffectiveness(oppType, p.types) === 4.0)
                        );
                        const isSafe = threads.length === 0;
                        return (
                          <li key={idx} style={{ color: isSafe ? "var(--success)" : "var(--error)", fontSize: "0.75rem" }}>
                            <strong>{p.nameJa}</strong>: {isSafe ? "安全" : `相手の ${threads.map(t => t.nameJa).join(", ")} から4倍`}
                          </li>
                        );
                      })}
                    </ul>
                  </span>
                )}

                {category === "offense-all" && (
                  <span>
                    正解の選出パターン一覧:
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                      {correctAnswersList.map((comb, cIdx) => (
                        <div key={cIdx} style={{ background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "6px", border: "1px solid var(--border-glass)", fontSize: "0.75rem", color: "var(--success)" }}>
                          {comb.map(idx => userTeam[idx].nameJa).join(" ＆ ")}
                        </div>
                      ))}
                    </div>
                  </span>
                )}

                {category === "defense-min-2x" && (
                  <span>
                    被弾状況:
                    <ul style={{ paddingLeft: "15px", marginTop: "2px" }}>
                      {userTeam.map((p, idx) => {
                        const weakOpponents = oppTeam.filter(opp =>
                          opp.types.some(oppType => getEffectiveness(oppType, p.types) === 2.0)
                        );
                        return (
                          <li key={idx} style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                            <strong>{p.nameJa}</strong>: {weakOpponents.length > 0 ? `弱点2倍被弾あり (${weakOpponents.map(o => o.nameJa).join(", ")})` : "被弾なし"}
                          </li>
                        );
                      })}
                    </ul>
                  </span>
                )}

              </div>
            </div>
          )}

          {/* 送信・次へボタン */}
          <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "center", marginTop: "4px", flexShrink: 0 }}>
            {!isAnswered ? (
              <button
                onClick={handleSubmit}
                disabled={selectedIndices.length !== 3}
                className="btn-primary"
                style={{
                  width: "220px",
                  padding: "10px 20px",
                  fontSize: "0.9rem",
                  opacity: selectedIndices.length === 3 ? 1 : 0.4,
                  cursor: selectedIndices.length === 3 ? "pointer" : "not-allowed"
                }}
              >
                選出を確定してバトル！
              </button>
            ) : (
              <button
                onClick={setupQuiz}
                className="btn-primary"
                style={{
                  width: "220px",
                  padding: "10px 20px",
                  fontSize: "0.9rem",
                  background: "linear-gradient(135deg, var(--accent-violet), #c084fc)"
                }}
              >
                次の対戦カードへ
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

