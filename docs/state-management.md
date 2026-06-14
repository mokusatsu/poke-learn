# 状態管理の指針 (State Management)

本プロジェクトにおける状態管理（State Management）の設計方針とベストプラクティスについて説明します。

## 1. 基本方針：React Local State と Props の利用

本プロジェクトでは、現在のところ状態（State）が複雑に絡み合う「状態爆発」の懸念はなく、既存の構成で十分機能しているため、**Context API や Zustand, Redux などのグローバル状態管理ライブラリへの無理な拡張（オーバーエンジニアリング）は行いません**。

- 基本的に各コンポーネント内での `useState` を用いたローカルステート管理を標準とします。
- 親コンポーネントから子コンポーネントへのデータ伝播は、Props のバケツリレー（Prop Drilling）で行います。
- アプリケーション全体に跨るような大きな状態が存在しないため、このシンプルで追跡可能な手法を維持してください。

## 2. パフォーマンスを意識した状態更新（重要）

頻繁に更新される UI 状態（例：マウスホバー、スクロールなど）を React の State で管理すると、再レンダリングのコストが高くなりパフォーマンス上のボトルネックとなります。

### アンチパターン：React State に依存した高頻度更新
```tsx
// 悪い例：ホバーの度にコンポーネント全体が再レンダリングされる
const [hoveredCell, setHoveredCell] = useState<string | null>(null);

return (
  <div
    onMouseEnter={() => setHoveredCell('A')}
    onMouseLeave={() => setHoveredCell(null)}
    style={{ backgroundColor: hoveredCell === 'A' ? 'red' : 'white' }}
  />
);
```

### ベストプラクティス：CSSとDOM APIへの移譲
パフォーマンスクリティカルな UI（例：`WeaknessAnalysis.tsx` におけるマトリクスのホバーエフェクトなど）では、React の State を一切使わず、**CSS の擬似クラス (`:hover`) や、動的な CSS セレクタの注入** によって UI の更新を行ってください。

- 高頻度の描画更新には `will-change`, `transform`, `opacity` を利用し、GPU アクセラレーションを効かせること。
- React の仮想 DOM ツリーの更新を伴わない設計を心がけること。

## 3. 今後の展望

現状はシンプルな Props の受け渡しで十分ですが、もし将来的に「ユーザーのログイン状態」「全体の設定テーマ」など、コンポーネントツリーの末端まで深く広範囲に渡って共有される状態が必要になった場合のみ、最低限の Context API の導入を検討してください。エージェントは独断で導入せず、必ずユーザーに `Ask First` してください。
