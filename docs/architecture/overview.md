# アーキテクチャ概要 (Architecture Overview)

本ドキュメントは `poke-learn` プロジェクトの全体的なアーキテクチャ構成について説明します。

## 1. 技術スタック

本プロジェクトは以下の技術スタックで構成されています。

- **コアフレームワーク**: React 19
- **ビルドツール**: Vite
- **言語**: TypeScript
- **パッケージ管理・タスクランナー**: Deno (※ npm ではなく Deno を使用します)
- **スタイリング**: Vanilla CSS (`index.css` を中心とした CSS 変数、モダンデザイン)
- **テスト**: Playwright (E2Eレイアウトテスト)

## 2. ディレクトリ構造と役割

プロジェクトの主要なディレクトリ構造とそれぞれの役割は以下の通りです。

```text
poke-learn/
├── AGENTS.md                 # エージェント用ルール・ルーター
├── README.md                 # 基本的なセットアップと概要
├── deno.json                 # Deno の設定ファイル (タスクや依存関係の管理)
├── package.json              # フロントエンドエコシステム互換用
├── vite.config.ts            # Vite のビルド設定
├── tests/                    # Playwright による E2E テスト
│   └── viewport-layout.spec.ts
├── docs/                     # 詳細仕様ドキュメント
│   ├── architecture/         # アーキテクチャ関連
│   ├── components-styling.md # UIとスタイルの実装方針
│   ├── domain-logic.md       # ポケモン・タイプ相性等の仕様
│   ├── state-management.md   # 状態管理の指針
│   └── testing.md            # テスト戦略
└── src/
    ├── main.tsx              # アプリケーションのエントリポイント
    ├── App.tsx               # ルートコンポーネント
    ├── index.css             # グローバルスタイル (テーマ変数、リセット等)
    ├── components/           # UI コンポーネント群
    │   ├── WeaknessAnalysis.tsx # 相性分析・ヒートマップ
    │   ├── MaxPowerQuiz.tsx     # 最大打点クイズ
    │   └── ...
    ├── data/                 # 静的データ
    │   └── localPokemons.ts     # ローカルのポケモン一覧データ
    └── utils/                # ドメインロジック、ユーティリティ
        ├── pokemonApi.ts        # PokeAPI 連携ラッパー
        └── typeMatrix.ts        # タイプ相性計算ロジック
```

## 3. エントリポイントの構成

- **`src/main.tsx`**: React DOM を使用して `App` コンポーネントを `#root` にマウントします。グローバルスタイル (`index.css`) もここでインポートされます。
- **`src/App.tsx`**: ルーティングやタブ切り替えといった大枠の UI 構造を管理します。各機能（相性分析、クイズ等）のコンポーネントを配置し、全体のレイアウトを決定します。

## 4. エージェントへの注意事項

- コンポーネントを追加・分割する際は、必ず `src/components/` 配下に配置し、役割が大きすぎる場合は適宜ディレクトリを掘って整理することを検討してください。
- 各ドキュメントには `AGENTS.md` のポインタに従って適宜アクセスし、システム全体の設計思想から逸脱しないように実装を行ってください。
