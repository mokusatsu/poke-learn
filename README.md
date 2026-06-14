# poke-learn

React + TypeScript + Vite で構築された、ポケモンのタイプ相性やバトル知識を学ぶための Web アプリケーションです。

## 技術スタック (Tech Stack)

- **UI Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Task Runner / Package Manager**: Deno
- **Testing**: Playwright
- **Styling**: Vanilla CSS (CSS Variables, Glassmorphism)

## 環境構築と実行 (Installation & Usage)

本プロジェクトの開発環境は **Windows (PowerShell)** を想定し、タスクの実行には `npm` ではなく **`deno`** を使用します。事前に Deno をインストールしてください。

### 依存関係のインストール

Deno を使用しているため、初回起動時やビルド時に自動で依存関係が解決・キャッシュされます。

### 開発用コマンド

```powershell
# 開発サーバーの起動 (localhost)
deno task dev

# プロダクションビルドの実行
deno task build

# リンターの実行
deno task lint

# E2Eテスト (Playwright) の実行
deno run -A npm:@playwright/test test
```

## ドキュメント (Documentation)

プロジェクトの詳細な仕様や設計思想については、`docs/` 配下の各ドキュメントを参照してください。これにより、README の肥大化を防ぎつつ、必要なコンテキストを分割管理しています。

- [アーキテクチャ概要 (Architecture)](./docs/architecture/overview.md)
- [状態管理の指針 (State Management)](./docs/state-management.md)
- [ドメイン知識・仕様 (Domain Logic)](./docs/domain-logic.md)
- [UI実装とスタイリング (Components & Styling)](./docs/components-styling.md)
- [テスト戦略 (Testing Strategy)](./docs/testing.md)

### 🤖 AIエージェント向けガイド

本プロジェクトはエージェント駆動開発（Agent-Driven Development）を採用しています。
エージェントが本リポジトリで作業を開始する際は、必ず最初に **[`AGENTS.md`](./AGENTS.md)** を読み込み、プロジェクト固有のルールや開発手順を遵守してください。
