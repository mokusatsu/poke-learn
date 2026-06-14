// scripts/sync_pokemons.ts
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

const LOCAL_IDS = [
  // Normal
  133, 143, 132, 18, 398, 901,
  // Fire
  6, 59, 157, 257, 663, 911, 1004,
  // Water
  9, 130, 260, 658, 730, 964,
  // Grass
  3, 254, 724, 812, 908, 1001,
  // Electric
  25, 181, 405, 479, 145, 894,
  // Ice
  131, 471, 461, 473, 991, 1002,
  // Fighting
  68, 448, 475, 984, 1007,
  // Poison
  94, 169, 453, 849, 980,
  // Ground
  28, 445, 450, 530, 1003,
  // Flying
  142, 149, 715, 823,
  // Psychic
  65, 150, 196, 282, 376, 876,
  // Bug
  12, 212, 214, 637, 900,
  // Rock
  248, 839, 934, 970,
  // Ghost
  778, 887, 937, 987,
  // Dragon
  373, 612, 635, 1008,
  // Dark
  197, 491, 983, 1005,
  // Steel
  208, 1000,
  // Fairy
  36, 468, 700, 888, 959
];

// Popular IDs to pre-translate (Gen 1-9 popular entries not in LOCAL_IDS)
const POPULAR_IDS = [
  1, 3, 4, 6, 7, 9, 25, 26, 36, 38, 39, 59, 65, 68, 94, 130, 131, 133, 134, 135, 136, 142, 143, 149, 150,
  154, 157, 160, 196, 197, 208, 212, 214, 248, 254, 257, 260, 282, 306, 330, 373, 376, 384, 392, 395, 398,
  443, 445, 448, 461, 468, 470, 471, 473, 475, 479, 483, 484, 487, 491, 493, 635, 637, 658, 700, 724, 730,
  778, 812, 823, 849, 887, 888, 894, 900, 901, 908, 909, 911, 934, 937, 943, 959, 964, 969, 970, 980, 983, 984, 987, 991,
  997, 1000, 1001, 1002, 1003, 1004, 1005, 1007, 1008
];

interface PokemonData {
  id: number;
  name: string;
  nameJa: string;
  types: string[];
  sprite: string;
}

// Fetch single Pokemon details and its species translation
async function fetchPokemon(id: number): Promise<{ pokemon: PokemonData | null, translation: { en: string, ja: string } | null }> {
  try {
    const pRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!pRes.ok) throw new Error(`Pokemon fetch failed`);
    const pData = await pRes.json();

    const sRes = await fetch(pData.species.url);
    if (!sRes.ok) throw new Error(`Species fetch failed`);
    const sData = await sRes.json();

    const jaNameEntry = sData.names.find((n: any) => n.language.name === "ja-Hrkt" || n.language.name === "ja");
    const nameJa = jaNameEntry ? jaNameEntry.name : pData.name;

    const pokemon: PokemonData = {
      id,
      name: pData.name,
      nameJa,
      types: pData.types.map((t: any) => t.type.name),
      sprite: pData.sprites.other["official-artwork"].front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
    };

    return {
      pokemon,
      translation: { en: pData.name, ja: nameJa }
    };
  } catch (err) {
    console.error(`Error fetching ID ${id}:`, err);
    return { pokemon: null, translation: null };
  }
}

async function main() {
  console.log("Fetching Pokemon data from PokeAPI...");
  
  // Clean duplicates
  const uniqueLocalIds = Array.from(new Set(LOCAL_IDS));
  const uniquePopularIds = Array.from(new Set(POPULAR_IDS));

  const localPokemons: PokemonData[] = [];
  const translations: Record<string, string> = {};

  // Fetch local pokemons
  for (const id of uniqueLocalIds) {
    console.log(`Fetching local pokemon ID ${id}...`);
    const { pokemon, translation } = await fetchPokemon(id);
    if (pokemon) {
      localPokemons.push(pokemon);
    }
    if (translation) {
      translations[translation.en] = translation.ja;
    }
    // Delay to respect API limits
    await new Promise(r => setTimeout(r, 100));
  }

  // Fetch extra translations for popular IDs not in local pokemons
  const extraIds = uniquePopularIds.filter(id => !uniqueLocalIds.includes(id));
  for (const id of extraIds) {
    console.log(`Fetching extra translation ID ${id}...`);
    const { translation } = await fetchPokemon(id);
    if (translation) {
      translations[translation.en] = translation.ja;
    }
    await new Promise(r => setTimeout(r, 100));
  }

  // Write to src/data/localPokemons.ts
  const filePath = join("src", "data", "localPokemons.ts");
  const fileContent = `// Generated automatically from PokeAPI via scripts/sync_pokemons.ts
import type { PokemonType } from "../utils/typeMatrix";

export interface PokemonData {
  id: number;
  name: string;
  nameJa: string;
  types: PokemonType[];
  sprite: string;
}

export const LOCAL_POKEMONS: PokemonData[] = ${JSON.stringify(localPokemons, null, 2)};

export const POKEMON_NAME_TRANSLATION: Record<string, string> = {};
LOCAL_POKEMONS.forEach(p => {
  POKEMON_NAME_TRANSLATION[p.name] = p.nameJa;
});

export const ADDITIONAL_TRANSLATIONS: Record<string, string> = ${JSON.stringify(translations, null, 2)};

export function getPokemonJaName(enName: string): string {
  const normalized = enName.toLowerCase().replace(" ", "-");
  return POKEMON_NAME_TRANSLATION[normalized] || ADDITIONAL_TRANSLATIONS[normalized] || enName;
}
`;

  Deno.writeTextFileSync(filePath, fileContent);
  console.log(`Successfully generated ${filePath} with ${localPokemons.length} Pokémon entries and ${Object.keys(translations).length} translations!`);
}

main();
