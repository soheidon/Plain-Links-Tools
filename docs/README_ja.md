# Plain Links Tools

[English](../README.md) | 日本語

現在のノート内の Markdown リンクをプレーンテキストや URL に変換する Obsidian プラグインです。また、ベアメールアドレス（`user@example.com` のようなリンク構文なしのメールアドレス）を、クリック可能な mailto リンクではなくプレーンテキストとして表示します。Reading View と Live Preview の両方に対応しています。

## 機能

- **リンクを表示文字列に変換** — `[text](url)` を `text` に、`[[target]]` / `[[target|alias]]` を表示名に変換します
- **リンクをURLに変換** — `[text](url)` を `url` に、`[[target|alias]]` を `target` に変換します
- **ベアメールアドレスをプレーンテキスト化** — `user@example.com` をクリック可能な mailto リンクではなくプレーンテキストとして表示します
  - Reading View と Live Preview / ソースモードの両方で動作
  - 通常クリックは抑制され、Ctrl/Cmd+クリックで mailto リンクを開きます
  - 明示的な `[text](mailto:...)` リンクはそのまま維持されます

すべてのコマンドはコマンドパレットとリボンアイコンメニューから利用できます。

## インストール

### Obsidian Community Plugins から

1. 設定 → コミュニティプラグイン を開く
2. "Plain Links Tools" を検索
3. インストールして有効化

### 手動インストール

`main.js`、`manifest.json`、`styles.css` を `VaultFolder/.obsidian/plugins/plain-links-tools/` にコピーしてください。

## 使い方

| 操作 | 方法 |
|------|------|
| リンクを表示文字列に変換 | コマンドパレット →「現在のノートのリンクを表示文字列に変換」またはリボンメニュー |
| リンクをURLに変換 | コマンドパレット →「現在のノートのMarkdownリンクをURLに変換」またはリボンメニュー |
| メールアドレス表示の切り替え | リボンメニュー →「メールアドレスを文字列として表示」 |

## ライセンス

MIT
