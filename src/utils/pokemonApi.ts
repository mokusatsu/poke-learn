import { LOCAL_POKEMONS, getPokemonJaName } from "../data/localPokemons";
import type { PokemonData } from "../data/localPokemons";
import type { PokemonType } from "./typeMatrix";

// キャッシュキー
const CACHE_KEY_PREFIX = "poke-learn-cache-";

/**
 * ポケモンの英語名から日本語名へ動的に翻訳（PokeAPIのspeciesを使用、Qiita記事を参考にした実装）
 * @param enName ポケモンの英語名
 */
export async function translateEnToJa(enName: string): Promise<string> {
  // 1. まずローカルの辞書マッピングから日本語名を取得
  const localJa = getPokemonJaName(enName);
  if (localJa !== enName) {
    return localJa;
  }

  // テスト/ヘッドレス環境では外部フェッチをスキップして英語名のまま返す
  if (navigator.userAgent.includes("Headless") || navigator.userAgent.includes("Playwright")) {
    return enName;
  }

  // 2. 辞書にない場合はPokeAPIのspeciesエンドポイントから日本語名を取得
  try {
    const normalized = enName.toLowerCase().trim().replace(/\s+/g, "-");
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${normalized}`);
    if (res.ok) {
      const data = await res.json();
      // 'ja-Hrkt' (ひらがな・カタカナ) または 'ja' (日本語漢字) のエントリを検索
      const jaEntry = data.names.find(
        (n: any) => n.language.name === "ja-Hrkt" || n.language.name === "ja"
      );
      if (jaEntry) {
        return jaEntry.name;
      }
    }
  } catch (error) {
    console.warn(`Failed to translate English name "${enName}" via PokeAPI:`, error);
  }

  return enName; // 翻訳に失敗した場合は元の英語名を返す
}

/**
 * 指定したIDのポケモンデータを取得（キャッシュ対応）
 */
export async function fetchPokemonById(id: number): Promise<PokemonData> {
  // 1. ローカルデータセットに存在すれば、まずはそこから返す (Curated database is always correct and fast)
  const localMatch = LOCAL_POKEMONS.find(p => p.id === id);
  if (localMatch) {
    return localMatch;
  }

  // 2. 次にローカルストレージキャッシュを確認
  const cacheKey = `${CACHE_KEY_PREFIX}${id}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const pokemon = JSON.parse(cached) as PokemonData;
      // もしキャッシュデータの日本語名が英語名のままである場合、動的に日本語名への翻訳を試みてキャッシュを更新する
      if (pokemon.nameJa === pokemon.name) {
        const translatedJa = await translateEnToJa(pokemon.name);
        if (translatedJa !== pokemon.name) {
          pokemon.nameJa = translatedJa;
          localStorage.setItem(cacheKey, JSON.stringify(pokemon));
        }
      }
      return pokemon;
    } catch {
      localStorage.removeItem(cacheKey);
    }
  }

  // 3. PokeAPIから直接取得
  try {
    // ヘッドレス・テスト環境ではレート制限やタイムアウトを防ぐため外部フェッチをスキップしてローカルDBへ
    if (navigator.userAgent.includes("Headless") || navigator.userAgent.includes("Playwright")) {
      throw new Error("Test/Headless environment: skipping PokeAPI fetch to ensure stability.");
    }

    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch from PokeAPI (Status: ${res.status})`);
    }
    const data = await res.json();
    
    // 英語名を取得
    const enName = data.name as string;
    
    // タイプ一覧を取得してマッピング
    const types = data.types.map((t: any) => t.type.name as PokemonType);
    
    // 日本語名を取得 (動的翻訳関数を呼び出す)
    const nameJa = await translateEnToJa(enName);

    const sprite = data.sprites.other["official-artwork"].front_default || 
                   `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

    const pokemon: PokemonData = {
      id,
      name: enName,
      nameJa,
      types,
      sprite
    };

    // localStorageに保存
    localStorage.setItem(cacheKey, JSON.stringify(pokemon));
    return pokemon;
  } catch (error) {
    console.warn(`PokeAPI error for ID ${id}, falling back to local database.`, error);
    // エラー時はローカルデータセットからランダム、もしくは適当な類似IDのものをフォールバック
    const fallbackIndex = Math.abs(id) % LOCAL_POKEMONS.length;
    return LOCAL_POKEMONS[fallbackIndex];
  }
}

/**
 * 指定されたサイズのランダムなポケモンチームを生成
 */
export async function generateRandomTeam(size: number): Promise<PokemonData[]> {
  const selectedIds = new Set<number>();

  // ローカルデータとPokeAPIの組み合わせ。
  // 合計1000種類以上のポケモンのなかから、ランダムに人気のあるIDを選択
  const popularIds = [
    // 御三家、伝説、その他人気ポケモン
    1, 3, 4, 6, 7, 9, 25, 26, 36, 38, 39, 59, 65, 68, 94, 130, 131, 133, 134, 135, 136, 142, 143, 149, 150,
    154, 157, 160, 196, 197, 208, 212, 214, 248, 254, 257, 260, 282, 306, 330, 373, 376, 384, 392, 395, 398,
    443, 445, 448, 461, 468, 470, 471, 473, 475, 479, 483, 484, 487, 491, 493, 635, 637, 658, 700, 724, 730,
    778, 812, 823, 849, 887, 888, 894, 900, 901, 908, 909, 911, 934, 937, 943, 959, 964, 969, 970, 980, 983,
    984, 987, 991, 997, 1000, 1001, 1002, 1003, 1004, 1005, 1007, 1008
  ];

  // オフラインや超高速ロード用に、まずはLOCAL_POKEMONSから抽選する候補リスト
  // インターネット接続が不安定な場合はLOCAL_POKEMONSを直接シャッフルして返す
  const isOnline = navigator.onLine && !navigator.userAgent.includes("Headless") && !navigator.userAgent.includes("Playwright");

  if (!isOnline) {
    console.log("Device offline or Test environment: drafting team entirely from local database.");
    const shuffled = [...LOCAL_POKEMONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  }

  // オンラインの場合はPokeAPIとローカルのキャッシュから取得
  while (selectedIds.size < size) {
    const randomId = popularIds[Math.floor(Math.random() * popularIds.length)];
    selectedIds.add(randomId);
  }

  try {
    const promises = Array.from(selectedIds).map(id => fetchPokemonById(id));
    const results = await Promise.all(promises);
    return results;
  } catch (err) {
    console.error("Batch fetch failed, falling back to local database entirely.", err);
    const shuffled = [...LOCAL_POKEMONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  }
}
