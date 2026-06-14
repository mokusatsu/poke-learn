/**
 * ポケモンタイプ相性マトリックス & 計算ユーティリティ
 * 対象：第六世代以降（フェアリータイプ対応、鋼タイプ相性修正済み）
 */

export type PokemonType =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

export interface TypeDetail {
  en: PokemonType;
  ja: string;
  color: string;      // 標準のタイプカラー
  glowColor: string;  // ネオン発光用カラー
  textColor: string;  // バッジ内での文字色 (デフォルト #fff)
}

export const TYPE_LIST: PokemonType[] = [
  "normal", "fire", "water", "electric", "grass",
  "ice", "fighting", "poison", "ground", "flying",
  "psychic", "bug", "rock", "ghost", "dragon",
  "dark", "steel", "fairy"
];

export const TYPE_DETAILS: Record<PokemonType, TypeDetail> = {
  normal: { en: "normal", ja: "ノーマル", color: "#A8A77A", glowColor: "rgba(168, 167, 122, 0.6)", textColor: "#FFFFFF" },
  fire: { en: "fire", ja: "ほのお", color: "#EE8130", glowColor: "rgba(238, 129, 48, 0.7)", textColor: "#FFFFFF" },
  water: { en: "water", ja: "みず", color: "#6390F0", glowColor: "rgba(99, 144, 240, 0.7)", textColor: "#FFFFFF" },
  electric: { en: "electric", ja: "でんき", color: "#F7D02C", glowColor: "rgba(247, 208, 44, 0.7)", textColor: "#000000" },
  grass: { en: "grass", ja: "くさ", color: "#7AC74C", glowColor: "rgba(122, 199, 76, 0.7)", textColor: "#FFFFFF" },
  ice: { en: "ice", ja: "こおり", color: "#96D9D6", glowColor: "rgba(150, 217, 214, 0.7)", textColor: "#000000" },
  fighting: { en: "fighting", ja: "かくとう", color: "#C22E28", glowColor: "rgba(194, 46, 40, 0.7)", textColor: "#FFFFFF" },
  poison: { en: "poison", ja: "どく", color: "#A33EA1", glowColor: "rgba(163, 62, 161, 0.7)", textColor: "#FFFFFF" },
  ground: { en: "ground", ja: "じめん", color: "#E2BF65", glowColor: "rgba(226, 191, 101, 0.7)", textColor: "#000000" },
  flying: { en: "flying", ja: "ひこう", color: "#A98FF3", glowColor: "rgba(169, 143, 243, 0.7)", textColor: "#FFFFFF" },
  psychic: { en: "psychic", ja: "エスパー", color: "#F95587", glowColor: "rgba(249, 85, 135, 0.7)", textColor: "#FFFFFF" },
  bug: { en: "bug", ja: "むし", color: "#A6B91A", glowColor: "rgba(166, 185, 26, 0.7)", textColor: "#FFFFFF" },
  rock: { en: "rock", ja: "いわ", color: "#B6A136", glowColor: "rgba(182, 161, 54, 0.7)", textColor: "#FFFFFF" },
  ghost: { en: "ghost", ja: "ゴースト", color: "#735797", glowColor: "rgba(115, 87, 151, 0.7)", textColor: "#FFFFFF" },
  dragon: { en: "dragon", ja: "ドラゴン", color: "#6F35FC", glowColor: "rgba(111, 53, 252, 0.7)", textColor: "#FFFFFF" },
  dark: { en: "dark", ja: "あく", color: "#705746", glowColor: "rgba(112, 87, 70, 0.7)", textColor: "#FFFFFF" },
  steel: { en: "steel", ja: "はがね", color: "#B7B7CE", glowColor: "rgba(183, 183, 206, 0.7)", textColor: "#000000" },
  fairy: { en: "fairy", ja: "フェアリー", color: "#D685AD", glowColor: "rgba(214, 133, 173, 0.7)", textColor: "#FFFFFF" },
};

/**
 * 攻撃タイプから防御タイプへの相性倍率マップ
 * キー: 攻撃タイプ -> 防御タイプ -> 倍率
 * 記載のない組み合わせはすべて 1.0 (等倍)
 */
export const EFFECTIVENESS_MATRIX: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: {
    rock: 0.5,
    ghost: 0,
    steel: 0.5,
  },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: {
    fire: 2,
    water: 0.5,
    grass: 0.5,
    ground: 2,
    rock: 2,
    dragon: 0.5,
  },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5,
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
    fairy: 2,
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5,
  },
  psychic: {
    fighting: 2,
    poison: 2,
    psychic: 0.5,
    steel: 0.5,
    dark: 0,
  },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5,
  },
  ghost: {
    normal: 0,
    psychic: 2,
    ghost: 2,
    dark: 0.5,
  },
  dragon: {
    dragon: 2,
    steel: 0.5,
    fairy: 0,
  },
  dark: {
    fighting: 0.5,
    psychic: 2,
    ghost: 2,
    dark: 0.5,
    fairy: 0.5,
  },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2,
  },
  fairy: {
    fire: 0.5,
    fighting: 2,
    poison: 0.5,
    dragon: 2,
    dark: 2,
    steel: 0.5,
  },
};

/**
 * ある攻撃タイプから、単一の防御タイプへの相性倍率を取得
 */
export function getSingleMatchupMultiplier(
  attacker: PokemonType,
  defender: PokemonType
): number {
  const row = EFFECTIVENESS_MATRIX[attacker];
  if (!row) return 1.0;
  const val = row[defender];
  return val !== undefined ? val : 1.0;
}

/**
 * 攻撃タイプから防御側ポケモン（単・複合タイプ）への合計相性倍率を計算
 */
export function getEffectiveness(
  attacker: PokemonType,
  defenders: PokemonType[]
): number {
  if (defenders.length === 0) return 1.0;
  return defenders.reduce(
    (acc, def) => acc * getSingleMatchupMultiplier(attacker, def),
    1.0
  );
}

/**
 * 防御ポケモン（単・複合タイプ）が、ある攻撃タイプに対して受けるダメージ倍率のリストを取得
 */
export function getDefensiveStrengths(
  defenders: PokemonType[]
): Record<PokemonType, number> {
  const strengths = {} as Record<PokemonType, number>;
  for (const atk of TYPE_LIST) {
    strengths[atk] = getEffectiveness(atk, defenders);
  }
  return strengths;
}

/**
 * 攻撃ポケモン（単・複合タイプ）が自身のタイプ一致技（STAB）を繰り出す時、
 * 各防御タイプに対して与えられる最大倍率のマップを取得
 */
export function getOffensiveSTABMatchups(
  attackers: PokemonType[],
  defenders: PokemonType[]
): number {
  // ポケモンが繰り出す各タイプ一致技の中で、最も有効な倍率を返す
  let maxMult = 0;
  for (const atk of attackers) {
    const mult = getEffectiveness(atk, defenders);
    if (mult > maxMult) {
      maxMult = mult;
    }
  }
  return maxMult;
}
