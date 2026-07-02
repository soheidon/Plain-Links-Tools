# Plain Links Tools — 仕様書

[English](../SPEC.md) | 日本語

## 概要

[Obsidian](https://obsidian.md) 用のプラグインで、Markdown リンクを操作するツールを提供します。特に、ベアメールアドレスをクリック可能な mailto リンクではなくプレーンテキストとして表示することに焦点を当てています。

## 要件

- Obsidian ≥ 1.5.0
- デスクトップ・モバイル両対応 (isDesktopOnly: false)

## コマンド

### `convert-links-to-display-text-current-note`

現在のノート内のすべてのリンクを表示文字列形式に変換します。

| 入力 | 出力 |
|------|------|
| `[text](https://example.com)` | `text` |
| `[[target\|alias]]` | `alias` |
| `[[target]]` | `target` |

コードブロックとインラインコードは変換から保護されます。

### `convert-markdown-links-to-urls-current-note`

現在のノート内の Markdown リンクを URL 形式に変換します。Wiki リンクはターゲットパスを URL として使用します。

| 入力 | 出力 |
|------|------|
| `[text](https://example.com)` | `https://example.com` |
| `[[target\|alias]]` | `target` |
| `[[target]]` | `target` |

コードブロックとインラインコードは変換から保護されます。

## ベアメールアドレスのプレーンテキスト化

### 動作

有効時、ベアメールアドレス（例: `user@example.com`）は Reading View と Live Preview / ソースモードの両方でプレーンテキストとして表示されます。

- **通常の左クリック**: 抑制 — mailto を開かない
- **Ctrl/Cmd + 左クリック**: mailto リンクを開く（Obsidian 標準の動作）
- **明示的な Markdown リンク**: `[text](mailto:user@example.com)` は常にクリック可能なリンクとして維持

### Reading View

`registerMarkdownPostProcessor` が `<a href="mailto:...">` 要素を `<span class="plain-links-tools-auto-mailto-text">` 要素に置き換えます。ソース内で明示的な `[text](mailto:...)` パターンに一致する表示テキストを持つ mailto リンクは置換対象から除外されます。

### Live Preview / ソースモード

CodeMirror 6 の `ViewPlugin` が可視範囲内のメールアドレス位置にクラス `plain-links-tools-bare-email` を持つ `Decoration.mark` を適用します。`Prec.highest` の `EditorView.domEventHandlers` クリックハンドラが、装飾されたメール位置での通常の左クリックを抑制します。`:has()` を使用した CSS ルールが、親の `.cm-url` / `.cm-underline` スパンのリンクスタイルを無効化します。

コードブロック、フロントマター、コメント、明示的な `[text](mailto:...)` Markdown リンク内のメールは装飾対象から除外されます。

### 設定

| キー | 型 | デフォルト | 説明 |
|------|------|------------|------|
| `plainEmailAddresses` | boolean | `true` | ベアメールアドレスのプレーンテキスト表示の切り替え |

マイグレーション: `plainBareEmailsInReadingView` (旧キー) → `plainEmailAddresses`

## アーキテクチャ

```
src/main.ts          — プラグインのエントリポイント、全ロジック
styles.css           — Reading View / Live Preview 用 CSS
manifest.json        — Obsidian プラグインのメタデータ
esbuild.config.mjs   — ビルド設定
```

### 主要依存ライブラリ

- `@codemirror/language` — コード/フロントマター/コメントノード除外のための構文木
- `@codemirror/state` — `RangeSetBuilder`、`Prec`
- `@codemirror/view` — `Decoration`、`ViewPlugin`、`EditorView.domEventHandlers`
- `obsidian` — プラグイン API（`registerMarkdownPostProcessor`、`addCommand` 他）

## バージョン履歴

### v0.1.20（現在）

リリース候補。診断ログを削除。Reading View と Live Preview の両方でベアメールアドレスのプレーンテキスト表示が安定。

### v0.1.0 — v0.1.19

ベアメールアドレスプレーンテキスト化機能、CSS によるリンクスタイル抑制、クリック抑制、設定基盤の反復開発。
