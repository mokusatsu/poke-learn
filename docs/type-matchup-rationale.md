# ポケモンタイプ相性の由来と考察 (Type Matchup Rationales)

> [!WARNING]
> **重要: 同期対象ファイル**
> 本ドキュメントに記載されている考察内容は、プログラム内で動的に取り扱うため [`src/data/typeMatchupRationales.ts`](file:///C:/Users/lain/.gemini/antigravity/worktrees/poke-learn/dynamic-prog-learning-logic/src/data/typeMatchupRationales.ts) に抽出・同期されています。
> 本ドキュメントの考察文を更新・編集した場合は、必ずデータ側のTypeScriptファイルも同期更新してください（自動抽出スクリプト `scratch/generate_ts_data.ts` も利用可能です）。

本ドキュメントでは、ポケモンバトルにおける全18タイプの攻撃相性（非等倍の組み合わせ）について、なぜそのような相性関係（`ばつぐん`、`いまひとつ`、`こうかがない`）になっているのかを現実世界の物理法則、生物の生態、伝承、および論理的推論に基づいて考察し、一覧化したものです。


さらに、各相性関係を画像生成AIで視覚化する際に「どちらが圧倒し、どちらがダメージを受けているか（または防ぎきっているか）」という**強弱関係**が明確に表現されるよう、改善された画像生成プロンプトと設計意図を追加しています。

> [!IMPORTANT]
> 無生物や元素タイプ同士の相性プロンプト（例：みず、ほのお、でんき、はがね等の組み合わせ）においては、不自然な生物的描写（「モンスター」「クリーチャー」等の登場）を完全に排除し、純粋な自然現象や物理的・化学的相互作用（蒸発、溶解、錆び、アース等）として表現しています。

---

## 表記定義
本ドキュメントでは、プロジェクトのトーン＆マナー表記統一ルールに基づき、以下の表現を使用します。
- **ばつぐん**（ダメージ2.0倍）
- **いまひとつ**（ダメージ0.5倍）
- **こうかがない**（ダメージ0.0倍 / 無効）

---

## 1. ノーマルタイプ (Normal)

もっとも標準的で、特別な属性を持たない肉体や無機的なエネルギーを表すタイプです。

### 防御側への影響
- **いわ に対して `いまひとつ`**
  - **考察**: 通常の肉体による体当たりや物理的な打撃は、硬い岩石の防壁に弾き返されてしまい、効果的なダメージを与えられないため。
  - **推奨画像プロンプト**: `A standard mammalian creature's headbutt attack being harmlessly deflected off a giant, smooth rock boulder. The physical strike produces tiny weak sparks, with the rock remaining completely unmoved and unscathed, showing rock's natural hardness. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 攻撃側の生物（ノーマル）が痛がりながら弾き返され、標的である無生物の岩（いわ）がびくともせず無傷で立っている様子を描写し、いわの物理的硬度を表現します。

- **はがね に対して `いまひとつ`**
  - **考察**: 岩石よりもさらに頑丈で緻密な金属（鋼鉄）の装甲に対しては、通常の物理攻撃では傷一つつけられず、衝撃が減衰してしまうため。
  - **推奨画像プロンプト**: `A basic physical punch from a standard mammalian creature hitting a polished, heavy steel plate and bouncing off. The impact shows small sweat-drop marks on the punching creature, while the steel plate is perfectly scratch-free and shiny, highlighting the metal's hardness. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 生物が金属の板を殴って拳を痛め、金属板は無傷で輝いている対比を描くことで、はがねの堅牢さを表します。

- **ゴースト に対して `こうかがない`**
  - **考察**: 生身の物質的攻撃は、実体を持たない霊魂（幽霊）をそのまま通り抜けてしまい、干渉することすらできないため。
  - **推奨画像プロンプト**: `A basic animal-like creature attempting to bite or swipe at a spooky, translucent ghost character. The creature's paw passes completely through the ghost, leaving the ghost smiling playfully and completely unaffected. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 攻撃がゴーストの体を「完全に透過」し、ゴーストが余裕の表情で笑っている姿を描くことで、無効化（こうかがない）の概念を視覚化します。

---

## 2. ほのおタイプ (Fire)

熱エネルギーや燃焼現象、爆発的な破壊力を表すタイプです。

### 防御側への影響
- **くさ に対して `ばつぐん`**
  - **考察**: 草や木などの植物は非常に可燃性が高く、火が触れると一瞬で燃え広がり、灰になってしまうため。
  - **推奨画像プロンプト**: `A roaring fire blast engulfing a dense thicket of green vines and leaves. The vegetation is visibly shrinking, scorching, and turning to black ash under the overwhelming heat, showing the complete destruction of the plants by the fire. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 密集した蔦や葉（くさ）が炎に包まれて「炭化し、黒い灰になっていく様子」を描き、火による植物の一方的な破壊を表現します。

- **こおり に対して `ばつぐん`**
  - **考察**: 氷は熱エネルギー（火）を浴びると急速に融解し、水へと変化して存在を維持できなくなるため。
  - **推奨画像プロンプト**: `A bright fire stream directly hitting a frozen block of solid ice. The ice block is rapidly melting into water and evaporating into steam, cracking apart and dissolving away from the intense heat of the flames. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 氷の塊が熱で「急速に溶けて崩れ、激しく水蒸気（スチーム）となって立ち上る様子」を描き、物理現象としての相性をビジュアル化します。

- **むし に対して `ばつぐん`**
  - **考察**: 多くの昆虫は熱や火に対して極めて脆弱であり、火に触れると外骨格や羽が一瞬で焼き尽くされてしまうため。
  - **推奨画像プロンプト**: `A wave of burning embers swarming a small insect monster. The insect's fragile wings are burning and disintegrating, and it is recoiling in pain from the heat, completely overwhelmed by the fire. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 虫の羽が焼け落ちる描写や、熱に耐えかねて悶絶する様子を描き、生物としての虫が火に極めて弱いことを示します。

- **はがね に対して `ばつぐん`**
  - **考察**: 高熱の炎は硬い金属（鋼鉄）を真っ赤に熱し、軟化させ、最終的にはドロドロに溶かしてしまうため。
  - **推奨画像プロンプト**: `An intense white-hot column of flame blasting a solid steel plate. The steel plate is glowing red-hot, warping and dripping molten metal, showing it is failing to withstand the melting heat. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 鋼鉄の板が「赤熱化してドロドロに溶け、変形している様子」を描き、金属に対する高熱の圧倒的強さを純粋な物理現象として表現します。

- **ほのお に対して `いまひとつ`**
  - **考察**: すでに激しく燃え盛る炎に対して、さらに火を投げかけても燃料や熱源が同化するだけで、決定的な打撃にならないため。
  - **推奨画像プロンプト**: `A fireball shooting directly into a massive, raging bonfire. The fireball simply merges into the bonfire's flames, causing a minor sizzle but doing no damage, showing the flames absorb and neutralize the heat. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 投げた火球が、巨大な焚き火の炎の中に「何事もなく同化して吸収される」様子を描写します。

- **みず に対して `いまひとつ`**
  - **考察**: 水は熱を奪い消火する性質があるため、火をぶつけても水分によってエネルギーが相殺・消滅させられるため。
  - **推奨画像プロンプト**: `A fire breath attack hitting a rushing wall of water. The fire instantly extinguishes with a large cloud of white steam, showing the water easily snuffing out the flames. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 炎が吹き寄せる水壁に激突し、「ジュッという凄まじい音と共に白い水蒸気となって消滅する」自然現象としての消火を描写します。

- **いわ に対して `いまひとつ`**
  - **考察**: 岩石は耐火性が高く、一般的な炎で炙る程度では燃えることも融解することもなく、熱を遮断してしまうため。
  - **推奨画像プロンプト**: `A stream of fire hitting a massive, thick stone wall. The rock wall merely turns slightly black from soot but remains completely solid and unaffected, demonstrating rock's natural resistance to heat. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 厚い石の壁が炎に炙られるものの、表面が黒い煤（すす）で汚れるだけで、構造には微動だに影響がない様子を描きます。

- **ドラゴン に対して `いまひとつ`**
  - **考察**: ドラゴンは自然界の荒ぶる力（炎・水・雷など）を超越した強靭な生命力や神秘の耐性を持っており、純粋な元素攻撃が通りにくいため。
  - **推奨画像プロンプト**: `A massive flamethrower blasting a majestic dragon. The dragon stands proudly, wrapping its wings around itself to easily block the fire, its tough scales glowing slightly but completely uninjured. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: ドラゴンが誇らしげに腕や羽で炎を防ぎ、その鱗が少し輝く程度でノーダメージである威風堂々とした様子を描写します。

---

## 3. みずタイプ (Water)

流体、冷却、浸食、および生命の源としての性質を表すタイプです。

### 防御側への影響
- **ほのお に対して `ばつぐん`**
  - **考察**: 水は燃焼 of 三要素（酸素・熱・可燃物）のうち「熱」を奪い、酸素を遮断して火を直接消し止める天敵であるため。
  - **推奨画像プロンプト**: `A powerful water torrent crashing directly onto a roaring blaze of fire. The flames are shrinking, sputtering out, and producing massive clouds of white steam, completely overwhelmed and extinguished by the water. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 燃え盛る火の塊が、強烈な激流によって「一瞬でかき消され、真っ白な水蒸気だけが立ち込めている」完全なる消火を物理描写します。

- **じめん に対して `ばつぐん`**
  - **考察**: 土や泥でできた地面に大量の水を流し込むと、地盤が緩んで決壊したり、泥水となって崩壊（土砂崩れ）したりするため。
  - **推奨画像プロンプト**: `A high-pressure water jet carving through a mud wall. The mud is eroding, melting, and washing away in a muddy slurry, unable to maintain its shape under the force of the water. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 高圧の水流が土砂の壁を「削り取り、ドロドロの泥水となって崩落させている様子」を描写し、土に対する水の物理的侵食力を表現します。

- **いわ に対して `ばつぐん`**
  - **考察**: 水流による物理的な浸食（雨垂れ石を穿つ）や、岩の隙間に入り込んだ水の圧力によって、長い年月をかけて岩石を風化・破砕するため。
  - **推奨画像プロンプト**: `A crushing water wave crashing down on a solid stone pillar. The stone pillar is cracking and breaking into pieces under the heavy hydraulic impact, showing the water's erosive power. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 怒涛の大波の物理的圧力によって、切り立つ岩柱が「真っ二つに裂け、砕け散る瞬間」を描写し、硬い無機物を砕く水の重量力を表現します。

- **みず に対して `いまひとつ`**
  - **考察**: 水中に水を投げ入れても同化して混ざり合うだけであり、水流の衝撃そのものも周囲の流体によって大幅に減衰するため。
  - **推奨画像プロンプト**: `A high-speed water jet splashing harmlessly into a large, deep pool of flowing water. The impact only creates small, gentle ripples on the water surface, doing no damage and merging into it. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 流れる水に向けて水鉄砲を撃ち込んでも、「波紋を作って混ざり合うだけ」の静かで無駄なシーンを描きます。

- **くさ に対して `いまひとつ`**
  - **考察**: 植物は生存のために水を必要とし、根や葉から水分をグングン吸収するため、水による攻撃はむしろ成長を促す恵みとなってしまうため。
  - **推奨画像プロンプト**: `A stream of water hitting a lush green fern plant. The plant opens its leaves to absorb the water, glowing with healthy green energy, showing the water acts as a nutrient. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 水を浴びた植物（くさ）が「生き生きと輝き、みずみずしい緑のエネルギーを放っている様子」を描写し、攻撃がむしろ益になっている状態を表現します。

- **ドラゴン に対して `いまひとつ`**
  - **考察**: ドラゴンは畏怖されるべき超自然の象徴であり、荒れ狂う大雨や濁流といった水の猛威を物ともしない超越的な肉体・鱗を持つため。
  - **推奨画像プロンプト**: `A giant tidal wave crashing against a mighty dragon. The dragon easily cuts through the water wave with its sharp claws, standing tall and wet but completely unfazed and dominant. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 大波をドラゴンが「爪で切り裂く、あるいは堂々と受けて立っている」構図にし、自然の激流をも超越する力を表現します。

---

## 4. でんきタイプ (Electric)

電荷、電流、および雷などの強力な放電現象を表すタイプです。

### 防御側への影響
- **みず に対して `ばつぐん`**
  - **考察**: 水（特に電解質を含む自然の水）は極めて電気を通しやすく、電気攻撃を受けると水中の隅々にまで電流が行き渡り、回避不能のダメージとなるため。
  - **推奨画像プロンプト**: `A massive, jagged blue lightning bolt striking a body of splashing water. The electric current surges through the entire water volume, causing it to glow with static electricity and violently bubble from the charge. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 激しい水流に落雷が直撃した瞬間、「水全体が青白い電撃オーラを帯びて激しく発光し、高電圧によって水面が激しく波打ち沸騰している様子」を描くことで、電撃が水に伝導して支配している物理的ダイナミクスを明示します。

- **ひこう に対して `ばつぐん`**
  - **考察**: 空を飛んでいる生物は、空中において避雷針のようになりやすく、また電撃を避けるための遮蔽物がないため、逃げ場なく直撃を受けて墜落するため。
  - **推奨画像プロンプト**: `A lightning bolt directly striking a flying bird monster in mid-air. The bird is surrounded by yellow electricity, its wings paralyzed, falling helplessly towards the ground in defeat. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 鳥の翼が電撃で麻痺し、「コントロールを失って真っ逆さまに墜落していく様子」を描くことで、対空性能の圧倒的な破壊力を表現します。

- **でんき に対して `いまひとつ`**
  - **考察**: すでに電気を帯びている、あるいは体内で発電している生物は、外部からの電流に対しても過充電を防ぐ回路や高い耐性を備えているため。
  - **推奨画像プロンプト**: `A lightning bolt striking a copper lightning rod that is already fully charged with electrical sparks. The rod easily channels and absorbs the charge, showing no damage. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 帯電している金属（避雷針など）が、落雷を「難なく受け止めてアースに流し、一切破損していない」様子を描きます。

- **くさ に対して `いまひとつ`**
  - **考察**: 植物は水分を含みつつも乾燥した繊維質（ゴムや木など）が電気を通しにくく（絶縁体）、また地面に根を張っているため電気を地球（アース）へ逃がしやすいため。
  - **推奨画像プロンプト**: `A bolt of electricity striking a thick wooden tree trunk. The tree routes the current down to the earth through its root system, standing completely unharmed, showing the wood is insulating the shock. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 雷撃を受けた大樹が、その電流を樹皮や根を通して地面へと「アース（逃がす）」し、葉一つ焦げずに立っている様子を描写します。

- **ドラゴン に対して `いまひとつ`**
  - **考察**: 雷という天災をも克服する伝説的な肉体を持つドラゴンには、一過性の電撃は決定打になりにくいため。
  - **推奨画像プロンプト**: `A lightning strike hitting a majestic dragon. The dragon's legendary scales easily redirect the electricity away from its body, the dragon looking down calmly and completely unharmed. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 稲妻を浴びながらも、ドラゴンの硬い鱗がそれを四方に散らし、本体には全くダメージが通っていない力強い立ち姿を描きます。

- **じめん に対して `こうかがない`**
  - **考察**: 地面（大地）は無限の電気を受け入れることができる究極の「アース（接地）」であり、どれほど強大な電流であってもすべて地中に拡散・無効化されてしまうため。
  - **推奨画像プロンプト**: `A powerful thunderbolt striking the dry muddy ground. The electricity is immediately absorbed into the earth with a soft buzz, disappearing completely, leaving the ground totally unaffected. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 電撃が泥の大地へ吸い込まれた瞬間に「消滅」し、地面には焦げ跡すら残らず完全に吸収されている（無効化）様子を表現します。

---

## 5. くさタイプ (Grass)

植物、光合成、胞子、および自然の生命力を表すタイプです。

### 防御側への影響
- **みず に対して `ばつぐん`**
  - **考察**: 植物は根から水を能動的に吸い上げて自らの栄養・エネルギーに変えるため、水属性の存在に対して強い支配的優位性を持つため。
  - **推奨画像プロンプト**: `Thick green vines wrapping tightly around a pool of water, actively sucking up the liquid. The water volume shrinks rapidly as the vines grow leafier and stronger, showing the plants draining the water. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 植物の蔦（ツタ）が水を「一方的に吸い尽くして急速に水を枯れさせている様子」を描写し、水分に対する支配力を表します。

- **じめん に対して `ばつぐん`**
  - **考察**: 植物は土（地面）に深く根を張り、その養分や水分を一方的に吸収する。また、強靭な根がアスファルトや土壌を割り裂いて侵食するため。
  - **推奨画像プロンプト**: `Sharp plant roots bursting out of the earth, cracking and breaking a block of dried mud. The dried mud is shattered and crumbled by the aggressive root growth, showing the plants consuming the soil. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 乾燥した土の塊を、植物の強靭な根が「内側から突き破り、粉々に崩壊させている」ダイナミックな土壌侵食の様子を描写します。

- **いわ に対して `ばつぐん`**
  - **考察**: 植物の根は岩の微細な隙間に入り込み、成長に伴って岩石を内部から破壊し（生物的風化）、やがて土壌へと還す強い力を持っているため。
  - **推奨画像プロンプト**: `Creeping vines and roots wrapping around a solid boulder, forcing their way into its cracks. The boulder is breaking apart and crumbling into pebbles under the expansion force of the growing roots. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 岩石の割れ目に蔦が食い込み、岩の本体を「メリメリと引き裂き、砕いて砂利にしている」生物的風化作用のダイナミクスを視覚化します。

- **ほのお に対して `いまひとつ`**
  - **考察**: 火に対して草や木を投げ入れても、単なる「薪（燃料）」として機能してしまい、火の勢いをさらに強める結果になるため。
  - **推奨画像プロンプト**: `A barrage of green leaves flying into a blazing bonfire. The leaves instantly catch fire, adding fuel to the flames and making them burn brighter, showing the grass attack is useless. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 放った木の葉が炎に触れた瞬間に「燃え上がり、むしろ炎の威力を高めてしまっている」矛盾した物理描写を行います。

- **くさ に対して `いまひとつ`**
  - **考察**: 植物同士で葉や種をぶつけ合ったり、絡み合わせたりしても、お互いに類似した性質や防御機構を持っているため、有効打にならない。
  - **推奨画像プロンプト**: `A vine whip attack striking a thick patch of grass. The leafy surface easily cushions the blow, showing no damage, and the vines just brush against the grass. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 植物のムチが草地に当たっても、「葉っぱ同士が重なってクッションになり」、全く痕跡が残らない無駄な衝突を表現します。

- **どく に対して `いまひとつ`**
  - **考察**: 毒液や汚染物質（除草剤など）は植物の生理機能を破壊し枯死させるため、毒の障壁を持つ相手に対して植物の攻撃は押し返されてしまうため。
  - **推奨画像プロンプト**: `A barrage of seeds landing in a pool of toxic purple sludge. The seeds immediately rot and dissolve in the chemical waste, doing no damage to the sludge. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 種子が毒の廃液に触れた瞬間に「黒く腐食して分解し、沈殿していく」化学的な無効化を表現します。

- **ひこう に対して `いまひとつ`**
  - **考察**: 鳥などの飛行生物は樹木を巣として利用し、葉や枝を住処にするため、草木の物理的干渉をいなすのが得意であるため。
  - **推奨画像プロンプト**: `A barrage of sharp leaves flying towards a bird monster. The bird easily blows them away with a gust of wind from its wings, flying smoothly and completely unharmed. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 飛んでくる葉の刃を、鳥が「羽ばたきの風圧で簡単にあしらい」、涼しい顔で飛行を続けている構図を描きます。

- **むし に対して `いまひとつ`**
  - **考察**: 多くの虫は植物を日常的な食料として捕食する側（天敵）であるため、植物側の攻撃は虫の咀嚼力や消化能力の前に遮られてしまうため。
  - **推奨画像プロンプト**: `A grass whip hitting a hungry insect monster. The insect simply bites and chews through the vine with its sharp mandibles, showing it eats the attack for breakfast. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 叩きつけられたツタを、虫が「ムシャムシャと食べてしまっている（餌にしている）」滑稽で力関係の逆転した様子を描写します。

- **ドラゴン に対して `いまひとつ`**
  - **考察**: 自然の調和を象徴する植物の力でも、生と死を超越した強大なドラゴンの前には、その皮膚を貫くほどの威力を発揮できないため。
  - **推奨画像プロンプト**: `A giant wooden hammer strike hitting a dragon. The wooden hammer shatters upon impact with the dragon's iron-like scales, while the dragon remains completely unmoved. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 植物で作られた武器が、ドラゴンの硬い鱗に衝突して「砕け散る」様子を描き、圧倒的な生命力とスケールの差を表現します。

- **はがね に対して `いまひとつ`**
  - **考察**: 柔らかい草木や木の枝をいくら硬い金属（鋼鉄）のブレードや装甲に叩きつけても、傷一つつけられずに弾かれてしまうため。
  - **推奨画像プロンプト**: `A sharp leaf blade striking a polished steel plate. The leaf blade shatters into pieces upon impact, leaving the steel plate completely unmarked and shining. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 葉の刃が金属のプレートに当たって「木っ端微塵に砕け散っている」様子を描き、物質の硬度の違いを明確に示します。

---

## 6. こおりタイプ (Ice)

超低温、氷結、および熱の完全な喪失を表すタイプです。

### 防御側への影響
- **くさ に対して `ばつぐん`**
  - **考察**: 植物は極度の低温（氷点下）にさらされると、細胞内の水分が凍結・膨張して細胞膜が破壊され、完全に枯死（霜害）してしまうため。
  - **推奨画像プロンプト**: `A freezing wind coating a lush green fern in thick frost. The plant's leaves are turning blue and brittle, cracking and dying under the extreme low temperature. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 冷気によって植物が「凍りつき、青ざめてボロボロと崩れ落ちる（凍死する）様子」を痛々しく描写し、寒冷ダメージの強烈さを表現します。

- **じめん に対して `ばつぐん`**
  - **考察**: 激しい寒さは大地を凍らせ（凍上）、土壌の水分を氷に変えて亀裂を生じさせ、大地の活動や泥の流動性を完全に停止させてしまうため。
  - **推奨画像プロンプト**: `A blast of frost freezing a wet patch of mud solid. The mud is turned into solid, cracked ice, stopping any fluid movement completely under the freezing cold. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 液状の泥が「瞬時に凍結し、ひび割れた氷塊となって完全に流動性を失っている様子」を描き、物理現象としての凍土化を表現します。

- **ひこう に対して `ばつぐん`**
  - **考察**: 翼が凍りつくと空を飛べなくなり、また多くの鳥類は寒冷な気候を嫌って渡りを行うほど寒さに弱いため。
  - **推奨画像プロンプト**: `An ice beam freezing the wings of a flying bird creature. The bird's wings are encased in heavy, jagged ice, causing it to fall out of the sky, unable to fly. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 飛行中の鳥の羽が「氷に包まれて凍結し、羽ばたけなくなって落下するショッキングな瞬間」を描くことで、ひこうに対する圧倒的な強さを表現します。

- **ドラゴン に対して `ばつぐん`**
  - **考察**: ドラゴンの多くは爬虫類的な特徴（変温動物）を持っており、周囲の温度が下がると体温を維持できず、活動を停止（冬眠）あるいは衰弱してしまうため。
  - **推奨画像プロンプト**: `A freezing blizzard hitting a reptilian dragon monster. The dragon is shivering violently, its body slowing down and turning blue with frost, losing its strength due to the cold. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 強大なドラゴンが「寒さにガタガタと震え、体色が青ざめて力を失い、うずくまっている」様子を描き、ドラゴンの弱点が氷であることを視覚的に強調します。

- **ほのお に対して `いまひとつ`**
  - **考察**: 燃え盛る火に向けて氷を投げても、接触する前に熱輻射によって溶かされてただの水蒸気に変わってしまい、威力が激減するため。
  - **推奨画像プロンプト**: `An icicle spear thrown at a roaring fire. The icicle melts into water droplets and steam before even touching the flames, doing zero damage. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 氷の柱が炎の熱気で「相手に届く前にみるみる溶けて水滴になり、水蒸気として霧散している」熱力学的な不利を描写します。

- **みず に対して `いまひとつ`**
  - **考察**: 氷を水に投入すると、周囲の水に包まれて徐々に融解し、流体の中に同化・吸収されて衝撃が霧散してしまうため。
  - **推奨画像プロンプト**: `An ice beam shooting into a large flowing river. The ice is quickly melted and absorbed by the rushing water, doing no damage to the fluid body. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 放たれた氷が、勢いよく流れる川の激流に「押し流され、瞬時に溶けて水と一体化している」物理プロセスを描きます。

- **こおり に対して `いまひとつ`**
  - **考察**: すでに凍りついている物体に対して冷気や氷をぶつけても、それ以上凍らせることはできず、同じ硬度の物質同士で弾け合うだけであるため。
  - **推奨画像プロンプト**: `An ice punch hitting an ice wall. The punch just creates a small chip in the target's icy surface, with the wall remaining completely solid and unharmed. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 同質の氷同士がぶつかり、攻撃の衝撃が「わずかな氷屑となって弾け散るだけ」の不毛な様子を描きます。

- **はがね に対して `いまひとつ`**
  - **考察**: 金属は結晶構造が極めて緊密であり、氷の塊をぶつけられても金属の粘りと強度によって受け流し、氷側が砕け散ってしまうため。
  - **推奨画像プロンプト**: `A heavy ice hammer striking a solid steel plate. The ice hammer shatters into thousands of tiny ice crystals on impact, leaving the steel plate perfectly intact. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 氷のハンマーが鋼鉄の板に当たった瞬間に「ガラスのように粉砕して飛び散っている」様子を描き、金属の剛性に対する氷の脆さを無生物描写で表現します。

---

## 7. かくとうタイプ (Fighting)

鍛え上げられた肉体、洗練された格闘技術、武道精神、および正々堂々とした力を表すタイプです。

### 防御側への影響
- **ノーマル に対して `ばつぐん`**
  - **考察**: 特別な耐性や頑丈な装甲を持たない標準的な生物（ノーマル）に対し、限界まで鍛えられたプロの格闘技や武術の打撃は致命傷となるため。
  - **推奨画像プロンプト**: `A powerful karate punch directly striking a basic mammalian creature. The impact creates a large shockwave, sending the target flying backward with swirly eyes of defeat. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 衝撃波（ショックウェーブ）のエフェクトと共に、普通のポケモンが「一撃で吹き飛ばされ、目を回している（やられている）様子」を描くことで、格闘技の威力を強調します。

- **こおり に対して `ばつぐん`**
  - **考察**: 非常に硬い氷のブロックであっても、鍛錬された空手家や格闘家の打撃（瓦割り・氷柱割り）によって、力の集中点から一撃で粉砕できるため。
  - **推奨画像プロンプト**: `A martial artist breaking a thick ice pillar with a powerful palm strike. The ice pillar is shattered into clean, exploding chunks of ice from the concentrated impact. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 鍛えられた空手家の掌打によって、厚い氷の柱が「中央から豪快に砕け、四散している様子」を描き、物理的破壊力を表現します。

- **いわ に対して `ばつぐん`**
  - **考察**: 氷と同様に、硬くも脆い結晶構造を持つ岩石は、武術における試割り（岩石割り）のように、的確な急所打撃によって粉砕可能であるため。
  - **推奨画像プロンプト**: `A strong fighter performing a roundhouse kick on a giant boulder. The boulder cracks deeply and explodes into fragments upon impact, showing the fighter's crushing power. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: キックの衝撃で巨大な岩石（いわ）が「蜘蛛の巣状にひび割れ、砕け散る瞬間」を描写し、硬い無生物をも粉砕する格闘のエネルギーを表現します。

- **あく に対して `ばつぐん`**
  - **考察**: 「あく」が象徴する卑怯な闇討ちや小細工に対し、正面から堂々と立ち向かう正義の武道精神（ヒーローの拳）は、その不意打ちを力強く粉砕するため。
  - **推奨画像プロンプト**: `A heroic martial artist delivering a righteous punch to a shadowy, scheming dark monster. The dark monster's sneaky traps are shattered, and it recoils in defeat from the glowing punch. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 闇から襲う邪悪な影を、格闘家の「光る正義の拳」が正面から打ち破り、影が霧散・敗北している構図を描くことで、正義が悪を挫く姿を表現します。

- **はがね に対して `ばつぐん`**
  - **考察**: 鋼鉄の装甲は硬いものの、格闘家の繰り出す浸透する衝撃（浸透勁など）や絶大な質量打撃によって、内部の機構ごと歪められ破壊されるため。
  - **推奨画像プロンプト**: `A powerful chop hitting a solid steel door. The steel door is heavily dented and warped inward, its bolts popping out from the massive force of the strike. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 厚い鉄の扉が「拳の打撃の形で深くひしゃげ、ボルトが吹き飛んでいる」凄まじい衝撃浸透の様子を描写します。

- **どく に対して `いまひとつ`**
  - **考察**: 有毒な液体や気体をまとった肉体に直接拳や足で触れて攻撃すると、自身の肉体が毒に侵されてしまい、全力で打ち抜くことができないため。
  - **推奨画像プロンプト**: `A fighter trying to punch a pool of poisonous purple sludge. As the punch lands, the fighter's fist is coated in burning toxic slime, causing the fighter to pull back in pain while the sludge remains unaffected. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 攻撃側の生物が「毒液の池を殴って手が紫に染まり、苦痛に顔を歪めている様子」を描き、生身で有毒物質に触れるリスクを表現します。

- **ひこう に対して `いまひとつ`**
  - **考察**: 空中を自由に飛び回る相手に対して、地面に足をしっかりつけて繰り出す格闘技の技は的を絞りにくく、衝撃をいなされやすいため。
  - **推奨画像プロンプト**: `A fighter throwing a high kick at a flying bird monster. The bird easily loops in the air, dodging the kick entirely and looking down mockingly, showing the fighter cannot reach it. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 空飛ぶ相手に対して「キックが虚しく空を切り」、鳥がひらりといなして攻撃範囲外に逃げている構図を描きます。

- **エスパー に対して `いまひとつ`**
  - **考察**: どれだけ肉体を極限まで鍛えても、サイコキネシスで動きを止められたり、テレパシーで攻撃の軌道を先読みされて受け流されたりするため。
  - **推奨画像プロンプト**: `A martial artist charging forward to punch a psychic character. The psychic character uses telekinesis to freeze the fighter in mid-air, making the punch halt harmlessly centimeters away from their face. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 突進する格闘家が「超能力の光（オーラ）によって空中で静止させられ、手も足も出ない状態」を描くことで、肉体に対する精神（超能力）の優位を描写します。

- **むし に対して `いまひとつ`**
  - **考察**: 小さく俊敏な虫や、衝撃を分散するしなやかな外骨格を持つ虫を、人間の手足のような大雑把な打撃で正確に捉えて潰すことは難しいため。
  - **推奨画像プロンプト**: `A fighter trying to squash a tiny, nimble beetle monster. The beetle easily slips through the fingers and escapes, its tough chitinous shell absorbing what little force hit it. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 格闘家の大きな拳の下を、小さな甲虫が「素早くすり抜け、あるいは硬い殻で弾いてケロッと逃げ出している」様子を描写します。

- **フェアリー に対して `いまひとつ`**
  - **考察**: 妖精がまとう神聖で無垢な魔法の気配や、戦意を消失させるチャームの力の前には、暴力（格闘）の意志そのものが骨抜きにされてしまうため。
  - **推奨画像プロンプト**: `A fighter swinging a punch at a cute fairy monster. The fairy releases a shower of sparkling pink dust, calming the fighter's expression and making them drop their fists in a peaceful trance. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 殴りかかろうとしたファイターの表情が「妖精のピンクの光粉を浴びてふにゃりと和らぎ、戦意を喪失して脱力している」様子を描きます。

- **ゴースト に対して `こうかがない`**
  - **考察**: 実体を持たないゴースト（幽霊）に対しては、どれほど強力なパンチやキックを繰り出しても、すべて虚空を切り裂くだけで一切触れられないため。
  - **推奨画像プロンプト**: `A fighter executing a powerful kick directly through a translucent ghost. The leg passes right through the ghost's body, leaving the ghost giggling and waving playfully while the fighter off-balances. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 渾身のキックが「ゴーストの体をすり抜け」、ゴーストは全く無傷で背後でケラケラと笑っている構図を描くことで、完全な無効化を表現します。

---

## 8. どくタイプ (Poison)

毒素、細菌、酸、環境汚染、および生物の生理機能を破壊する化学物質を表すタイプです。

### 防御側への影響
- **くさ に対して `ばつぐん`**
  - **考察**: 植物は除草剤や化学汚染物質に対して非常に敏感であり、根や葉から吸い込むことで一瞬にしてシステムが汚染され、枯死するため。
  - **推奨画像プロンプト**: `A stream of purple toxic acid spraying over a leafy plant. The plant is shriveling, turning dark brown, and melting into goo, completely withered by the chemical attack. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 植物の葉や茎が紫の酸性の液を浴びて「みるみる変色し、萎れてドロドロに溶けて枯れ果てている様子」を生物表現抜きで詳細に描写します。

- **フェアリー に対して `ばつぐん`**
  - **考察**: 清らかで神秘的な生命力を持つ妖精や自然の精霊は、不浄な汚染や毒素によってその魔力の源である自然の循環を汚され、急激に衰弱するため。
  - **推奨画像プロンプト**: `A dark purple poison cloud surrounding a glowing, magical fairy. The fairy's light fades, its wings droop, and it falls to the ground weakened and coughing from the toxic fumes. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 紫色の毒霧に囲まれた美しい妖精の「魔力の光が消えかかり、羽がしおれて苦しそうに倒れ込んでいる（やられている）様子」を描写し、清浄に対する汚染の特効性を表します。

- **どく に対して `いまひとつ`**
  - **考察**: すでに毒を分泌・保持している生物は、体内に解毒酵素や毒素への強力な免疫（受容体のブロックなど）を持っているため、毒が効かない。
  - **推奨画像プロンプト**: `A toxic slime attack being thrown at a poisonous scorpion monster. The scorpion simply absorbs the slime onto its own shell, completely unaffected and immune. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 毒の液体を浴びた毒持ちのサソリが、むしろ「気持ちよさそうにそれを受け流している」平然とした姿を描きます。

- **じめん に対して `いまひとつ`**
  - **考察**: 大地（土壌）は無数の微生物や鉱物による吸着・ろ過作用を持っており、有害な毒素を自然に浄化・分解・希釈してしまうため。
  - **推奨画像プロンプト**: `A pool of toxic acid being poured onto the soil. The ground filters and neutralizes the acid through layers of sand and earth, leaving the soil clean and undamaged. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 土壌に注がれた毒液が、地中に染み込む過程で「汚れが吸着・濾過され、無害な水となって消えていく」自然の浄化プロセスを視覚化します。

- **いわ に対して `いまひとつ`**
  - **考察**: 岩石は無機物であり、血管や心臓、代謝システムを持たないため、生物の生理的機能を損なう「毒」という概念自体がほぼ通用しないため。
  - **推奨画像プロンプト**: `A bottle of poison splashing against a solid boulder. The liquid just slides off the stone surface, doing absolutely nothing to the non-living rock. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 硬い岩肌に毒薬が当たっても、何の化学反応も起こせず「ただ石の表面を濡らして、そのまま下に滴り落ちているだけ」の無駄な衝突を描写します。

- **ゴースト に対して `いまひとつ`**
  - **考察**: 幽霊は物理的な肉体や生命活動を持っていないため、細胞を破壊したり神経を麻痺させたりする毒素が作用する対象が存在しないため。
  - **推奨画像プロンプト**: `A toxic gas cloud trying to choke a ghost. The ghost floats peacefully inside the gas, possessing no lungs or blood to be affected by the poison, smiling happily. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 毒ガスの中に浮かぶゴーストが、肺を持たないため「平然と深呼吸のポーズを取っておどけている」オカルト的耐性をユーモラスに描写します。

- **はがね に対して `こうかがない`**
  - **考察**: 鋼鉄は生命を持たない完全に人工的・無機的な金属であり、生理活性を持つ毒素や細菌は完全に遮断され、一切影響を受けないため。
  - **推奨画像プロンプト**: `A stream of toxic acid splashing against a solid steel plate. The acid slides off the shiny metal surface, leaving it perfectly polished and unscratched, completely immune. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 毒酸が鋼鉄の板に当たっても、激しく弾かれて跡一つ残らず「ツルツルと滑り落ち、金属は依然としてピカピカに輝いている」完璧な無効化を表現します。

---

## 9. じめんタイプ (Ground)

泥、砂、粘土、および大地の地殻変動や震動を表すタイプです。

### 防御側への影響
- **ほのお に対して `ばつぐん`**
  - **考察**: 砂や泥を炎にかぶせる行為は、酸素の供給を完全に遮断し、熱を奪って消火する極めて有効な方法（消火砂）であるため。
  - **推奨画像プロンプト**: `A massive wave of mud and soil smothering a roaring fire. The fire is completely buried under the dirt, its flames snuffed out instantly with only a small wisp of smoke remaining. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 激しく燃え上がる炎（ほのお）が、上から被せられた大量の土砂（じめん）に「窒息するように覆われ、一瞬で消火されてわずかに白い煙が残るだけ」の様子を物理描写します。

- **でんき に対して `ばつぐん`**
  - **考察**: 地面は電気を安全に逃がす「アース」の役割を果たす。電気の通り道を遮り、強引に吸い込んで放電させることで、電気の防御を崩して大ダメージを与えるため。
  - **推奨画像プロンプト**: `An electric current striking a pile of dirt. The ground easily directs the electric bolts into the earth, grounding the shock completely and neutralizing the electricity. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 放たれた激しい電撃が、大地の層に衝突した途端「地中に吸い込まれて四散し、アースされて無力化されている」電気物理現象を描写します。

- **どく に対して `ばつぐん`**
  - **考察**: 流出した有毒物質や毒液を大量 of 土砂で埋め立てて封じ込めるように、大地の質量と吸着力によって毒の活動源を完全に抑え込むため。
  - **推奨画像プロンプト**: `A huge earthquake creating a fissure that swallows a pool of toxic sludge. The earth closes up, burying and sealing the poison deep underground, neutralizing it. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 地割れが走り、液状の毒ヘドロを「大地の割れ目が丸ごと飲み込み、閉じて地中深くに隔離・封印してしまう」土木の力学を描きます。

- **いわ に対して `ばつぐん`**
  - **考察**: 地震による激しい地殻変動や地割れは、硬い岩石の地層を容易に破壊し、土砂崩れによって岩を一気に飲み込み砕き去るため。
  - **推奨画像プロンプト**: `A heavy mudslide crashing into a stone pillar. The rock structure is undermined and collapses, its stones buried and crushed under the massive weight of the sliding earth. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 土砂崩れの大崩落が、切り立った岩石を「根本からへし折り、土砂の中に埋没させて破壊している」質量と重力の力学を描写します。

- **はがね に対して `ばつぐん`**
  - **考察**: 金属（鋼鉄）は湿った土（じめん）の中に埋められると、土中の水分と酸素によって急速に酸化（錆び）が進み、構造的に脆く崩れてしまうため。
  - **推奨画像プロンプト**: `A rusty, wet mud attack wrapping around a steel plate. The steel plate is shown rapidly rusting, losing its shine and becoming brittle under the damp earth's embrace. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 湿った粘土質の泥に触れた金属のプレートが「急速に酸化し、茶色い赤サビに覆われてボロボロに崩壊している」化学的腐食プロセスを表現します。

- **くさ に対して `いまひとつ`**
  - **考察**: 植物は地面に根を張って土砂崩れを防ぐ（保水作用）など、むしろ土を繋ぎ止めて利用する側であるため、土の物理的干渉を受け流せる。
  - **推奨画像プロンプト**: `A sandstorm trying to blow away a tree monster. The tree monster digs its roots deeper into the ground, holding firm and using the sand to secure its position, completely unmoved. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 砂嵐が吹き荒れる中、樹木モンスターが「根を大地にガッチリと張り、ビシッと立って風砂を防いでいる」安定感のある対比を描きます。

- **むし に対して `いまひとつ`**
  - **考察**: 多くの昆虫は地中に巣穴を掘ったり、土の中で幼虫期を過ごしたりしており、泥や砂の圧迫・震動に対する生存適応力が非常に高いため。
  - **推奨画像プロンプト**: `A mud throw attack hitting a beetle monster. The beetle easily digs into the mud, using it to build a shield or tunnel through it, completely unharmed. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 泥をぶつけられた甲虫が、平然と「泥を巣作りに利用するかのように土に潜っていく」様子を描写します。

- **ひこう に対して `こうかがない`**
  - **考察**: 大地がどれほど激しく揺れ（地震）、地割れが生じたとしても、空中に浮遊・飛行している相手には物理的に一切接触できないため。
  - **推奨画像プロンプト**: `A massive earthquake cracking the ground below. The flying bird monster floats high in the sky, looking down calmly and completely unaffected by the shaking earth. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 下の地面が激しく割れ、崖が崩れているにもかかわらず、上空の鳥が「羽ばたきながらのんびりと空に浮かんで傍観している」完全な干渉不可の構図を描きます。

---

## 10. ひこうタイプ (Flying)

大気、風、猛禽類のような上空からの急降下攻撃、および重力からの解放を表すタイプです。

### 防御側への影響
- **くさ に対して `ばつぐん`**
  - **考察**: 鳥（ひこう）は植物の葉や木の実、種子を主食としてついばみ、枝を巣の材料としてむしり取るなど、植物を一方的に利用・破壊する関係にあるため。
  - **推奨画像プロンプト**: `A hawk-like bird tearing through a bush monster with its sharp talons. Leaves and branches are ripped apart as the bird dominates the stationary plant. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 鳥の「鋭い爪」が草木のモンスターを「容赦なく引き裂き、葉っぱや枝を飛び散らせて圧倒している」生態的捕食イメージを鋭利に描きます。

- **かくとう に対して `ばつぐん`**
  - **考察**: 地面に足をつけた格闘家に対し、上空の安全圏から一方的に急降下して襲いかかる飛行生物は圧倒的に有利であり、格闘の間合いの外からヒット＆アウェイで翻弄できるため。
  - **推奨画像プロンプト**: `A flying bird monster diving swiftly from the sky, striking a martial artist from behind. The fighter is caught off-guard, unable to block the aerial strike, and is knocked down. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 格闘家が上を見上げた瞬間、鳥が「死角から超高速で滑空し、突撃を叩きつけて格闘家をぶっ飛ばしている」ヒット＆アウェイのスピード感を表現します。

- **むし に対して `ばつぐん`**
  - **考察**: 鳥（ひこう）にとって虫は日常的な捕食対象（メインの餌）であり、空中や地上から発見されて一瞬で捕らえられ、食べられてしまうため。
  - **推奨画像プロンプト**: `A large bird catching a caterpillar monster in its beak. The caterpillar is trapped and helpless, showing the natural predator-prey relationship. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 鳥の「クチバシ」に捕らえられた虫のモンスターが、バタバタと暴れるものの逃げられない「捕食関係の決定的な瞬間」を明示します。

- **でんき に対して `いまひとつ`**
  - **考察**: 飛行生物が電気をまとった存在に接触すると、逃げ場のない空中では即座に感電して墜落する危険があるため、思い切った攻撃を仕掛けにくい。
  - **推奨画像プロンプト**: `A bird attempting to peck a spark-emitting electric monster. The bird's beak is shocked with static electricity, causing it to flinch and fly away in pain. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 鳥が攻撃しようとした瞬間に「クチバシからバチッと感電し、慌てて羽を乱して逃げ出している」飛行側のリスクを描写します。

- **いわ に対して `いまひとつ`**
  - **考察**: 頑丈な岩の壁や切り立った崖に対して、風を吹き付けたり羽ばたきでぶつかったりしても、硬い無機物を崩すことはできず弾き返されるため。
  - **推奨画像プロンプト**: `A gust of wind blowing against a giant rock wall. The rock wall does not budge even a millimeter, with the wind passing around it uselessly. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 突風が頑丈な岩壁（いわ）に遮られ、「壁に当たって左右に無力にいなされている」様子を表現します。

- **はがね に対して `いまひとつ`**
  - **考察**: 鉄板や金属の装甲でできた相手に、羽毛や肉体を持つ飛行生物が突撃しても、自分が傷つくだけでダメージを通せないため。
  - **推奨画像プロンプト**: `A bird diving to strike a steel plate. The bird's claws scratch harmlessly against the steel surface, producing a metallic ring but doing no damage. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 鳥の爪が金属の板（はがね）を引っ掻いた瞬間に「火花とキィンという金属音をたてて弾かれ、鳥が手を痛めている」様子を描写します。

---

## 11. エスパータイプ (Psychic)

脳の活性化、テレパシー、サイコキネシス、催眠術、および高度な精神集中・論理的思考を表すタイプです。

### 防御側への影響
- **かくとう に対して `ばつぐん`**
  - **考察**: どれだけ肉体を極限まで鍛えた格闘家でも、超能力（サイコキネシス）で物理法則を無視して宙に浮かされたり、脳に直接精神波（テレパシー）を送り込まれて三半規管を狂わされれば、自慢の技やパワーを発揮できずに倒れてしまうため。
  - **推奨画像プロンプト**: `A martial artist frozen in mid-punch, surrounded by a glowing pink psychic aura. The fighter is struggling but completely paralyzed, while the psychic character stands calmly, controlling them with mind power. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 攻撃しようとした格闘家が「不自然な体勢のまま宙に浮いて固まり、汗をかいて動けない状態」を描き、肉体に対する精神エネルギーの絶対的支配力を視覚化します。

- **どく に対して `ばつぐん`**
  - **考察**: 毒は肉体的な細胞や代謝を侵すものだが、超能力は脳や精神の力であるため、肉体の制限を受けずに念力で毒の使い手を制圧できる。また、精神力による自己治癒や毒素の脳内コントロールのイメージ。
  - **推奨画像プロンプト**: `A psychic bubble purifying a poisonous cloud. The glowing mental energy pushes back the toxic fumes, neutralizing the poison-user and forcing them down with telekinetic force. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: どく属性の有毒ガスや気体を「サイコパワーのシールドが押し返し、中和して相手をねじ伏せている」精神エネルギーの対抗戦を表現します。

- **エスパー に対して `いまひとつ`**
  - **考察**: 超能力者同士の戦いは、互いに強力な精神防御障壁（サイコシールド）を展開し、テレパシーによる思考の読み合いが拮抗するため、決定打を与えにくい。
  - **推奨画像プロンプト**: `Two telekinetic blasts colliding in mid-air. The two psychic barriers press against each other, creating a perfect balance and canceling each other out, doing no damage. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 互いの念動力波が「衝突して完全に打ち消し合い、ドーム状のエネルギーが静止している」様子を描き、決定打にならない同タイプ対決の均衡を表現します。

- **はがね に対して `いまひとつ`**
  - **考察**: 無機質で冷徹な金属（鋼鉄）は、電磁波や思念波（サイコウェーブ）を反射・遮断（シールド）してしまう物理的特性があり、精神的な干渉が浸透しにくいため。
  - **推奨画像プロンプト**: `A psychic wave hitting a polished steel mirror. The mental energy is reflected off the metallic surface and scattered, leaving the steel mirror completely undamaged. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 放たれた超能力のビームが、鏡のように磨かれた鋼鉄に「跳ね返されて明後日の方向へ散っている」シールドの描写を行い、精神干渉のカットを表現します。

- **あく に対して `こうかがない`**
  - **考察**: 「あく」は悪意、卑劣、および精神の乱れを誘う「恐怖」を象徴する。精密な計算と極限の集中力を必要とする超能力（エスパー）は、悪意による精神的ゆさぶりや恐怖心に直面すると、脳の処理能力を狂わされて能力の発動そのものを完全に封じられてしまうため。
  - **推奨画像プロンプト**: `A psychic character trying to read the mind of a dark, sinister creature. The psychic character is shocked and distressed by the dark aura, their mind-link shattered, while the dark creature sneers in victory. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: エスパーが「悪のエネルギーに精神を蝕まれて頭を抱えて怯え」、あく属性が薄笑いを浮かべて精神攻撃を完全シャットアウトしている様子を描き、完全無効化の精神力学を表現します。

---

## 12. むしタイプ (Bug)

昆虫、節足動物、群生行動、および本能的で素早い動きを表すタイプです。

### 防御側への影響
- **くさ に対して `ばつぐん`**
  - **考察**: 多くの昆虫は草や木の葉、茎、樹液を主食とし、大群で植物を食べ尽くす害虫としての側面（食害）を持っているため。
  - **推奨画像プロンプト**: `A swarm of hungry locusts eating a giant leaf monster. The leaf monster is covered in holes and losing its foliage as the insects devour it rapidly. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 植物の体が虫の群れによって「虫食い穴だらけにされ、ボロボロになって衰弱している（やられている）様子」をダイナミックに描き、食害の威力を表現します。

- **エスパー に対して `ばつぐん`**
  - **考察**: 虫の「カサカサという不気味な足音」「生理的嫌悪感を抱かせる群れ」「羽音」は、高度な精神集中を要する超能力者の思考をかき乱し、本能的な恐怖で集中力を完全に削ぎ落としてしまうため。
  - **推奨画像プロンプト**: `A swarm of buzzing flies surrounding a psychic character. The character is holding their head in pain, losing their concentration and glowing aura due to the annoying insects. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 超能力者が耳を塞いで「イライラと恐怖に顔を歪め、発動していた念力の光が霧散してしまっている」様子を描き、虫による精神集中の完全な破壊をビジュアル化します。

- **あく に対して `ばつぐん`**
  - **考察**: 「あく」が企む陰謀や悪巧み、精神的な脅しは、個としての感情を持たず「集団の本能」で動く虫たちには一切通用しない。また、暗闇（あく）を好んで這い回る虫は、闇夜 of 支配者をも本能的な嫌悪感で怯えさせるため。さらには、日本の特撮ヒーローである『仮面ライダー』が昆虫（バッタなど）をモチーフとしており、正義のヒーロー（むし）が悪の組織（あく）を打倒するという文化的イメージに由来するという説もあります。
  - **推奨画像プロンプト**: `A brave beetle monster charging through a dark, shadowy trap. The beetle's relentless advance shatters the dark magic, overpowering the sneaky dark creature. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`

  - **プロンプトの意図**: 闇の罠を甲虫が「本能の突進で粉砕して突き進み」、影に隠れていたあくポケモンを直接体当たりで叩きのめしている様子を描きます。

- **ほのお に対して `いまひとつ`**
  - **考察**: 飛んで火に入る夏の虫の通り、火に近づくだけで一瞬で身を焦がされてしまうため、炎の防壁を持つ相手に攻撃を通すのは困難を極めるため。
  - **推奨画像プロンプト**: `A moth flying towards a flame monster. The moth's wings immediately turn to ash as it gets too close to the heat, showing the danger of the fire. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 虫が攻撃しようと近づいた瞬間に「火の粉を浴びて翼が焼け焦げ、慌てて逃げ帰る」一方的な不利描写を行います。

- **かくとう に対して `いまひとつ`**
  - **考察**: 肉体と精神を鍛え上げた武道家は、虫の不気味さに惑わされることなく、素早くかつ的確に虫を叩き潰す術を身につけているため。
  - **推奨画像プロンプト**: `A small insect monster biting a martial artist's arm. The fighter's hardened muscles easily absorb the bite, and the fighter looks down ready to flick the bug away. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 虫の攻撃が、格闘家の「鍛え抜かれた筋肉に弾かれ」、全く効いていない様子を静的な強さで表現します。

- **どく に対して `いまひとつ`**
  - **考察**: 殺虫剤や毒液は虫の小さな肉体を一瞬で破壊するため、毒を持つ相手に接触して攻撃しようとすると、自らが汚染されてしまうため。
  - **推奨画像プロンプト**: `A spider trying to attack a poison toad. The spider is instantly poisoned by the toad's toxic skin and curls up in defeat. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 蜘蛛が攻撃を仕掛けた瞬間、相手の毒の分泌液に触れて「逆に足がしびれて縮こまり、やられてしまっている」様子を描写します。

- **ひこう に対して `いまひとつ`**
  - **考察**: 鳥（ひこう）は虫の天敵（捕食者）であり、攻撃を仕掛けようとしても空から狙い澄まされて返り討ちに遭い、エサにされてしまうため。
  - **推奨画像プロンプト**: `A beetle attacking a bird. The bird easily catches the beetle under its claw, pinning it down effortlessly, showing the bird's superiority. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 虫の攻撃を、天敵である鳥が「足の爪で軽々と押さえつけ」、おやつにするかのように見下ろしている決定的な上下関係を描きます。

- **ゴースト に対して `いまひとつ`**
  - **考察**: 実体のない幽霊（ゴースト）に対して、虫の噛みつきやトゲによる物理的な接触攻撃を仕掛けても、すり抜けてしまってダメージにならないため。
  - **推奨画像プロンプト**: `An insect trying to bite a ghost. The insect passes right through the ghost's wispy body, leaving the ghost untouched and smiling. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 噛みつこうとした虫の顎が「お化けの煙のような体をすり抜けてしまい」、手応えがなく虚しくなっている様子を描きます。

- **はがね に対して `いまひとつ`**
  - **考察**: 虫の小さな顎や爪、細いトゲで硬い鋼鉄をいくら引っ掻いても、傷一つつけられず弾かれてしまうため。
  - **推奨画像プロンプト**: `A beetle trying to pinch a steel plate. The beetle's mandibles slip off the hard steel surface, unable to make a single scratch. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 虫のハサミが平らな金属板（はがね）に当たって「ツルッと滑り、傷一つ残せずに弾かれている」強度の差を描写します。

- **フェアリー に対して `いまひとつ`**
  - **考察**: 妖精は自然を司り、森の虫たちと調和・対話する存在（虫を従える森の妖精のイメージ）であり、虫からの敵意や攻撃を優しく受け流してしまうため。
  - **推奨画像プロンプト**: `A swarm of bugs flying towards a fairy. The fairy gently waves its wand, turning the bugs into harmless, glowing sparkles that dance peacefully around it. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 襲いかかる虫たちが、妖精の持つ「魔法の粉によって浄化され、優しい光の粒（蛍のような光）に変わっておとなしくなっている」ファンタジーの調和を描きます。

---

## 13. いわタイプ (Rock)

岩石、鉱物、および結晶化された固形物の質量と硬度を表すタイプです。

### 防御側への影響
- **ほのお に対して `ばつぐん`**
  - **考察**: 岩石は耐火性が高く、燃え盛る火の中に岩を投げ入れれば、火の勢いを押し潰して窒息消火させることができるため。
  - **推奨画像プロンプト**: `A barrage of heavy rocks falling onto a blazing fire, smothering and extinguishing its flames under the weight of the stone. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 大量の岩石が火の中に投げ込まれ、「その質量で炎を押し潰し、空気（酸素）を遮断して火を窒息消火させている様子」を物理的な質量描写として表します。

- **こおり に対して `ばつぐん`**
  - **考察**: 凍りついた氷の体に対して、質量と硬度のある岩石を叩きつければ、脆い氷の結晶は簡単に粉々に砕け散るため。
  - **推奨画像プロンプト**: `A rock slide crushing blocks of solid ice. The ice is shattered into tiny ice shards under the impact of the heavy boulders. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 落下する岩石が、厚い氷の板を「粉々に粉砕し、氷の破片や氷屑を激しく撒き散らしている様子」を描写し、硬度と質量による破壊力を表現します。

- **ひこう に対して `ばつぐん`**
  - **考察**: 「一石二鳥（一石で二羽の鳥を落とす）」の言葉通り、空を飛ぶ鳥に対して石を投げつける攻撃は古来より最も有効な遠距離対策であり、翼を痛めさせて撃ち落とせるため。
  - **推奨画像プロンプト**: `A flying bird monster being struck by a thrown rock. The impact breaks its flight, sending it spiraling down out of the sky. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 飛行中の鳥の体に「石が命中し、衝撃で羽毛が散りながら、きりもみ状態で墜落していく様子」を描き、対空物理攻撃の強さを表現します。

- **むし に対して `ばつぐん`**
  - **考察**: 小さく脆い虫は、降ってくる巨大な岩石や小石の重量によって逃げ場を失い、一瞬で押し潰されて圧死してしまうため。
  - **推奨画像プロンプト**: `A giant stone slab crushing a small insect monster, pinning it flat to the ground, showing the absolute weight dominance. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 巨大な石板の下に、小さな虫が「完全にプレスされて（潰されて）身動きが取れなくなっている」圧倒的な質量差の結末を描写します。

- **かくとう に対して `いまひとつ`**
  - **考察**: 鍛え抜かれた格闘家は岩を砕く技術（空手の岩割りなど）を持っており、岩の質量攻撃を正面から受け流し、逆に破壊するすべを知っているため。
  - **推奨画像プロンプト**: `A rock monster throwing a punch at a martial artist. The fighter catches the stone fist with bare hands and cracks it, showing the fighter's superior martial skill. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 岩の攻撃を、格闘家が「素手でキャッチして握り潰し、ヒビを入れている」頼もしい構図を描くことで、格闘に対する岩の弱さを表します。

- **じめん に対して `いまひとつ`**
  - **考察**: 岩石はもともと地面（地殻）の一部であり、地滑りや砂の崩落によって土壌の中に埋もれ、土へと還される（風化する）側の存在であるため。
  - **推奨画像プロンプト**: `A massive boulder rolling into a pool of soft mud. The mud easily absorbs the impact, turning the rock into mud and softening the blow completely. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 転がり落ちた巨岩が、柔らかい泥の池に「ズブズブと飲み込まれ、衝撃が完全に吸収されて沈んでいる」無生物の流体クッション描写を行います。

- **はがね に対して `いまひとつ`**
  - **考察**: 岩（石）よりも鋼鉄（金属）の方がはるかに硬度と靭性（粘り強さ）が高いため、岩をぶつけても鋼鉄の装甲に跳ね返されてしまうため。
  - **推奨画像プロンプト**: `A rock throwing attack hitting a solid steel plate. The rock shatters into dust upon impact, while the steel plate remains shiny and undamaged. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 投げられた岩石が金属の防壁にぶつかった瞬間に「岩の方が粉々に砕け散って砂煙になっている」様子を描き、金属の圧倒的な靭性を表現します。

---

## 14. ゴーストタイプ (Ghost)

霊魂、未練、心霊現象、次元の壁を越えたオカルトパワー、および死そのものを表すタイプです。

### 防御側への影響
- **エスパー に対して `ばつぐん`**
  - **考察**: 幽霊や超常現象といった「未知のオカルト」に対する根源的な恐怖は、論理や科学、超能力者の精密な精神集中を根本から崩壊させ、パニックを引き起こすため。
  - **推奨画像プロンプト**: `A terrifying shadowy specter rising behind a psychic character. The character's psychic shield shatters as they scream in terror, their mind overwhelmed by fear. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 超能力者が背後の幽霊に気づいて「恐怖で絶叫し、張っていたバリアがパリンと割れている（やられている）様子」を描き、オカルトによる精神支配を表現します。

- **ゴースト に対して `ばつぐん`**
  - **考察**: 実体を持たない魂の存在に干渉し、傷つけることができるのは、同じく霊的な次元に存在する魂（ゴースト）だけであるため（霊障による魂の喰らい合い）。
  - **推奨画像プロンプト**: `Two ghostly spirits tearing at each other's ethereal bodies, spectral energy exploding as they clash in a battle of souls. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: お互いの幽霊の体が「霊的なオーラを激しく飛び散らせながら爪で切り裂き合っている」オカルトバトルを描き、魂同士の痛烈なダメージ干渉を表現します。

- **あく に対して `いまひとつ`**
  - **考察**: 「あく」は恐怖を支配し、悪意を持って人を騙す側であるため、お化けや怪奇現象といった精神的恐怖に怯むことなく、むしろそのオカルトを利用・支配しようとするため。
  - **推奨画像プロンプト**: `A ghost trying to scare a dark, sinister monster. The dark monster just smiles wickedly and grabs the ghost's tail, showing it is not afraid and dominates the spirit. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: ゴーストの脅かしを、あくタイプが「冷酷な笑みでスルーし、逆にゴーストの尻尾を捕まえて支配している」構図を描くことで、悪意による恐怖の克服を表現します。

- **ノーマル に対して `こうかがない`**
  - **考察**: 生死の波長が全く異なるため、死者の精神的干渉（幽霊の悪戯など）は、現実世界を生きる普通の生身の人間（ノーマル）の肉体には直接的な物理ダメージとして届かないため（生者と死者の不可侵境界）。
  - **推奨画像プロンプト**: `A ghost trying to scare a regular, normal-type creature. The creature is completely distracted, sniffing a flower, while the ghost passes through it invisibly and harmlessly. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: ゴーストが背後でどんなに威嚇していても、生身のポケモンが「全く気づかずにのんきに花の匂いを嗅いでいる」徹底的な波長ズレ（無効化）を表現します。

---

## 15. ドラゴンタイプ (Dragon)

神話に登場する巨大な竜、根源的な野性の力、および畏怖されるべき最強の生命力を表すタイプです。

### 防御側への影響
- **ドラゴン に対して `ばつぐん`**
  - **考察**: 最強にして伝説的な生物である「竜」を打倒できるのは、同じく天災に匹敵するパワーと神話的格を持つ「竜」だけであるため（竜虎相打つ、伝説の竜同士の対決）。
  - **推奨画像プロンプト**: `A blue dragon and a red dragon locked in a fierce claw-to-claw clash in the sky, both taking heavy damage as draconic energy explodes around them. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 双頭のドラゴンが空中戦で「お互いの牙と爪で強烈な傷を負わせ、激しく流血（またはエネルギーがスパーク）している」相打ちの過酷さを描写し、互いの特効性を表します。

- **はがね に対して `いまひとつ`**
  - **考察**: ドラゴンが誇る強大なブレスや牙、爪による荒々しい攻撃も、近代文明の極みである極厚の鋼鉄装甲には弾かれ、威力を防がれてしまうため。
  - **推奨画像プロンプト**: `A dragon breathing a beam of energy at a solid steel fortress. The energy beam is deflected off the polished steel armor plates, leaving the fortress completely unscathed. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 竜の強大なエネルギービーム（ブレス）が、近代的な鋼鉄の要塞壁（はがね）に衝突した瞬間に「無傷で左右へ跳ね返され、要塞はピカピカに輝いたままである」シーンを描きます。

- **フェアリー に対して `こうかがない`**
  - **考察**: ヨーロッパの童話や神話において、凶暴なドラゴンは「妖精の純真な魔力」や「聖なる加護」「乙女の祈り」によって大人しく手懐けられるか、あるいは浄化されて力を奪われるため。
  - **推奨画像プロンプト**: `A massive dragon breathing a destructive energy wave at a small fairy. The fairy raises a tiny wand and creates a pink bubble shield that completely neutralizes the blast, leaving the fairy smiling. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 大迫力のドラゴンのブレス攻撃が、小さな妖精の「ピンクのバリアに遮られて手前で完全に消滅し、妖精は無傷で微笑んでいる」魔法的な完全無効化を描きます。

---

## 16. あくタイプ (Dark)

悪意、冷酷、ずる賢さ、卑怯な戦術（不意打ち・騙し討ち）、および闇そのものを表すタイプです。

### 防御側への影響
- **エスパー に対して `ばつぐん`**
  - **考察**: 雑念を排した極限の精神集中を必要とする超能力（エスパー）に対し、あくが仕掛ける「闇討ち」「罵倒」「汚い手口」は精神的な動揺と恐怖を生み、思考回路を完全に遮断・破壊するため。
  - **推奨画像プロンプト**: `A dark rogue monster attacking a psychic character from the shadows. The dark rogue's claws shatter the psychic's barrier, leaving the psychic character shocked and defeated. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 超能力者の頭上から、あくタイプが「背後から不意打ちの爪を振り下ろし、バリアを粉砕して精神に大ダメージを与えている」闇討ちのシーンを描写します。

- **ゴースト に対して `ばつぐん`**
  - **考察**: あくは幽霊（ゴースト）がもたらす怪奇や恐怖の心理すらもビジネスや武器として利用・冷徹に支配する狡猾さ（恐怖を恐れない悪意）を持っているため。
  - **推奨画像プロンプト**: `A sinister dark monster catching a ghost in a trap made of dark shadow energy. The ghost is bound and crying out as the dark energy drains its spirit. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 幽霊のモンスターが、あくタイプの「邪悪な黒いエネルギーの鎖に捕らえられ、苦しそうに魔力を吸い取られている（やられている）様子」を描き、恐怖を克服する悪の狡猾さを表現します。

- **かくとう に対して `いまひとつ`**
  - **考察**: 正々堂々とした武道精神や正義の心（かくとう）の前には、小細工や卑怯な騙し討ち（あく）は通用せず、鍛え抜かれた力で真っ向からねじ伏せられてしまうため。
  - **推奨画像プロンプト**: `A dark monster trying to bite a martial artist. The fighter blocks the bite with an arm guard and delivers a strong punch, easily overpowering the dark sneak attack. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 卑怯な攻撃を、格闘家が「いとも簡単に腕でガードし、強烈な正拳突きを相手の顔面に叩きこんで撃退している」正義の勝利を描きます。

- **あく に対して `いまひとつ`**
  - **考察**: 悪党同士の騙し合いや裏切りは、お互いに手の内や「裏をかく」思考パターンが分かっているため、決定打を与えにくい。
  - **推奨画像プロンプト**: `Two dark thieves trying to steal from each other, their schemes failing and canceling out as they glare at each other in frustration. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 互いがお互いのポケットから財布を盗もうとして「手首を掴み合って睨み合っている」お互い様の滑稽な均衡を描きます。

- **フェアリー に対して `いまひとつ`**
  - **考察**: 純真無垢で一切の邪心がない妖精（フェアリー）に対しては、どれほど陰湿な悪意や卑劣な罠を仕掛けても、その無垢な光の前に悪意が浄化され、効果が霧散してしまうため。
  - **推奨画像プロンプト**: `A dark shadow monster trying to engulf a fairy. The fairy's bright pink light shines through the darkness, dissolving the shadow and leaving the dark monster blinded. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 闇の塊が妖精を飲み込もうとした瞬間、妖精の「清らかな光によって闇の霧がサーッと消滅し、あくタイプが眩しそうに目を背けている」光による闇の浄化を表現します。

---

## 17. はがねタイプ (Steel)

精錬された金属、人工的な工業技術、硬度と靭性の極み、および近代文明を表すタイプです。

### 防御側への影響
- **こおり に対して `ばつぐん`**
  - **考察**: 凍りついた氷の体を、強固な鉄製のハンマーや削岩機などで力任せに殴打すれば、氷の結晶を一撃で粉砕できるため。
  - **推奨画像プロンプト**: `A heavy steel hammer crushing a block of ice into snow and tiny shards, showing the absolute physical hardness advantage. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 鋼鉄の重厚なハンマーが、氷の塊（こおり）を「一撃で粉砕し、四方に氷屑を弾け飛ばせている様子」を描写し、硬度による絶対的な物理破壊力を表します。

- **いわ に対して `ばつぐん`**
  - **考察**: 炭鉱で硬い岩盤を掘り進むツルハシやドリル、石を削るノミなどの金属製ツールは、岩石（いわ）を容易に削り、打ち砕くことができるため。
  - **推奨画像プロンプト**: `A steel drill boring directly through a solid boulder, shattering the rock into tiny stone fragments. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 金属のドリルが、無機質の巨大な岩（いわ）を「中心から貫通して粉々に砕き割っている」土木的な物理侵食プロセスを生物表現なしで視覚化します。

- **フェアリー に対して `ばつぐん`**
  - **考察**: ヨーロッパの民話や伝承において、妖精や魔法生物は「冷鉄（Cold Iron / 錬鉄）」に対して極めて弱く、鉄に触れるだけで魔力を失ったり火傷を負ったりして退散してしまうという明確な弱点を持つため。
  - **推奨画像プロンプト**: `A cold steel chain wrapping around a magical fairy. The fairy's sparkles fade and it loses its levitation, weakened by the contact with industrial iron. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 無機質な冷たい鉄鎖に縛られた妖精が「魔法の光を失い、宙に浮くこともできなくなって弱々しく地面にへたり込んでいる（やられている）様子」を描くことで、魔法に対する冷鉄の弱点を視覚化します。

- **ほのお に対して `いまひとつ`**
  - **考察**: 炎の熱は金属（はがね）を溶かす天敵であるため、炎の海に金属の刃を突き出しても、溶融・軟化して攻撃力が大幅に低下するため。
  - **推奨画像プロンプト**: `A steel sword striking a blazing fire. The steel sword glows red-hot and starts to warp, soft and melting, before doing any damage. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 鋼鉄の剣が激しい炎に突き立てられた途端、「刃先が赤熱化してふにゃりと曲がり、溶け落ちている様子」を描写し、火に対する金属の弱さを表現します。

- **みず に対して `いまひとつ`**
  - **考察**: 水は金属を錆びさせて劣化させるため、水という流体に対して金属の刃物を振るっても水流に威力を受け流され、また水による劣化イメージから通りにくいため。
  - **推奨画像プロンプト**: `A steel blade slashing through a stream of water. The water just flows around the blade, and the blade is shown covered in rust spots, losing its sharpness. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 水流を切り裂こうとした鉄刃が「濡れた瞬間から急激に赤サビで覆われ、刃こぼれしてボロボロになっている」化学的劣化を描きます。

- **でんき に対して `いまひとつ`**
  - **考察**: 金属は電気を非常によく通す良導体（伝導体）であるため、金属で電気そのものを攻撃しても、電気エネルギーが金属内に拡散して受け流され、効果的なダメージにならないため。
  - **推奨画像プロンプト**: `A steel shield blocking a lightning bolt. The shield easily conducts the electricity into the ground, doing no damage to the shield itself but showing the electricity slipping away. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 電撃を金属の盾（はがね）が「難なく拡散して地面に受け流し、盾自体は放電効果で光っているだけで無傷である」良導体特性をビジュアル化します。

- **はがね に対して `いまひとつ`**
  - **考察**: 鋼鉄同士を正面から激突させても、互いに強固なため火花を散らすだけで、決定的な変形や破壊（ダメージ）を与えるのは難しいため。
  - **推奨画像プロンプト**: `A steel sword clashing against a steel shield, creating bright sparks but leaving both weapons perfectly undamaged and balanced. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 剣と盾が激突して「金属の火花が飛び散る」ものの、双方の表面には傷一つなく完全に互角（いまひとつ）である様子を描きます。

---

## 18. フェアリータイプ (Fairy)

童話や神話の魔法、純真無垢、無償の愛、光、自然の守護、および言葉の持つ神秘的な力を表すタイプです。

### 防御側への影響
- **かくとう に対して `ばつぐん`**
  - **考察**: 物理的な暴力（格闘）や肉体の力は、妖精の放つ純真で神秘的な魔法（チャーム）によって無害化され、戦う意志（闘争心）そのものを優しく奪われてしまうため。
  - **推奨画像プロンプト**: `A cute fairy using a magic spell to turn a martial artist's fists into soft boxing gloves made of flowers, leaving the fighter confused and powerless. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 殴ろうとした格闘家の拳が、魔法の輝きで「フカフカしたお花のグローブに変化させられ、格闘家が戸惑って力が抜けている様子（やられている描写）」をユニークに描写します。

- **ドラゴン に対して `ばつぐん`**
  - **考察**: おとぎ話や神話において、破壊の限りを尽くす凶暴なドラゴンを退治・手懐けるのは「妖精の魔法」や「清らかな乙女の加護」であり、ドラゴンの野性的な暴力性はフェアリーの神聖さの前に圧倒されるため。
  - **推奨画像プロンプト**: `A tiny fairy shining a brilliant pink light that shrinks and calms a giant, raging dragon into a sleeping pet, showing magical dominance. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 荒ぶる巨竜が、妖精の「聖なる光の魔法を浴びて、目がハートになり、おとなしく子犬のように眠ってしまっている様子（圧倒される描写）」を描くことで、魔法の支配力を表現します。

- **あく に対して `ばつぐん`**
  - **考察**: ドス黒い悪意や卑劣な心（あく）は、フェアリーの象徴する「純粋な愛や光」によってその本質を浄化され、悪巧み自体が瓦解してしまうため（光は闇を照らし消し去る）。
  - **推奨画像プロンプト**: `A fairy's bright magic wand blasting a dark shadow monster. The dark monster is dissolved and purified by the pink magical light, fleeing in defeat. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 邪悪な魔物が、妖精の「愛の魔法光線によって黒いモヤ（悪意）をかき消され、泣きながら逃げ出している様子」を描き、浄化の優位性をビジュアル化します。

- **ほのお に対して `いまひとつ`**
  - **考察**: メルヘンで神秘的なおとぎ話の世界（フェアリー）も、すべてを灰にする無慈悲な大火災（ほのお）の前には、魔法の力も届かず焼き尽くされてしまうため。
  - **推奨画像プロンプト**: `A fairy trying to cast a spell on a roaring fire. The fire's heat burns away the magic circle before the spell can activate, leaving the fairy startled. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 妖精が魔法をかけようとするものの、その魔法陣自体が相手の「炎の熱気でチリチリと燃えてかき消され、妖精が困惑している」対比を描きます。

- **どく に対して `いまひとつ`**
  - **考察**: 自然の調和から生まれる清らかな妖精の力は、不浄な毒素や汚染物質（どく）によって生態系が汚染されると、その根源的な魔力が毒されて十分に発揮できなくなるため。
  - **推奨画像プロンプト**: `A fairy trying to sprinkle magic dust on a pool of toxic sludge. The dust is immediately contaminated by the toxic purple gas, dissolving into useless soot. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 妖精がまいた魔法の粉が、相手の毒ヘドロの池（どく）から放たれるガスに触れた瞬間に「汚染されて黒いススになって地に落ちている」様子を描き、魔法の無力化を表現します。

- **はがね に対して `いまひとつ`**
  - **考察**: 文明の冷徹な鉄器（はがね）は、自然の精霊である妖精の魔法（幻想）を通さない冷酷な現実の象徴であり、魔法障壁のように妖精の攻撃を弾き返してしまうため。
  - **推奨画像プロンプト**: `A fairy casting a light beam at a solid steel plate. The beam reflects off the plate's polished metallic body, doing absolutely no damage. Rendered in a 2D anime-style illustration, cel-shaded, vibrant game art style with bold line art, reminiscent of official Pokemon concept art. Clean background, flat colors, no photorealistic textures or 3D rendering effects. Stylized, clean, and energetic.`
  - **プロンプトの意図**: 妖精の魔法ビームが、平らな鋼鉄のプレート（はがね）に「当たってツルリと屈折して跳ね返り」、金属は無傷でビームをそらしている様子を描きます。
