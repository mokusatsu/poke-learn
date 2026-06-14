# エージェント駆動開発 (Agent-Driven Development) ガイド

このドキュメントは、本プロジェクト（`poke-learn`）で作業を行うAIエージェント向けのルーターおよびガイドラインです。エージェントは作業開始時に必ずこのファイルを参照し、記載されたルールとドキュメント構成を遵守してください。

## プロジェクトのコアコマンド

開発環境は **Windows (PowerShell)** を想定しています。
パッケージマネージャーやタスクランナーとして `npm` ではなく **`deno`** を使用します。

- **開発サーバー**: `deno task dev`
- **ビルド**: `deno task build`
- **リンター**: `deno task lint`
- **E2Eテスト**: `deno run -A npm:@playwright/test test`

> 詳細なインストール手順等は [README.md](./README.md) を参照してください。

## プロジェクト構造

- `src/components/` : UIコンポーネント群（クイズ、マトリクス分析など）
- `src/data/` : 静的データ（ローカルのポケモンデータなど）
- `src/utils/` : ドメインロジック（タイプ相性計算API、PokeAPIラッパーなど）
- `tests/` : Playwright による E2E テスト
- `docs/` : 機能別・技術別の詳細ドキュメント

## エージェント固有のルール

### [Do] (必須ルール)
- **環境認識**: 開発環境は Windows (PowerShell) です。`grep`, `cat`, `ls`, `sed` などの Unix 系コマンドを直接シェルで実行しないでください（PowerShell のエイリアスや同等コマンド `Select-String`, `Get-Content` などを適宜使用するか、提供されている専用ツールを優先すること）。
- **言語設定**: 思考プロセス、コードコメント、ドキュメントの記述はすべて**日本語**で行うこと。
- **パフォーマンス優先のUI**: ホバー時などの高頻度なUI更新には React の State を使わず、CSS の `transform`, `opacity`, `will-change` や擬似要素を活用した GPU アクセラレーションを優先すること。
- **モダンなデザイン**: グラスモーフィズムや適切な余白、配色などを意識し、洗練されたモダンな UI を維持すること。

### [Never] (禁止事項)
- コマンド実行時に `npm run`, `yarn`, `pnpm` を直接使用しないこと。必ず `deno task` または `deno run` を使用する。
- リンター（ESLint / TypeScript）によって自動検証・検知可能なルール（インデント幅や型定義の必須化など）をドキュメントで反復しないこと。

### [Ask First] (確認事項)
- 既存の主要なドキュメント（特にアーキテクチャやドメイン知識）を大きく変更・削除する場合。
- 新しいパッケージ（npmライブラリ）を追加する場合や、コンポーネントのアーキテクチャ（状態管理など）に大きな変更を加える場合。

## docs/ ドキュメントパス

コードの実装例や詳細な仕様については、以下のドキュメントを参照してください。

- **アーキテクチャ概要**: [`docs/architecture/overview.md`](./docs/architecture/overview.md)
- **状態管理の指針**: [`docs/state-management.md`](./docs/state-management.md)
- **ドメイン知識・仕様**: [`docs/domain-logic.md`](./docs/domain-logic.md)
- **UI実装とスタイリング**: [`docs/components-styling.md`](./docs/components-styling.md)
- **テスト戦略**: [`docs/testing.md`](./docs/testing.md)
