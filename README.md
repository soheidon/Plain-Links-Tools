# Plain Links Tools

English | [日本語](docs/README_ja.md)

Obsidian plugin to convert Markdown links in the current note to plain text or URLs. Also makes bare email addresses render as plain text (not clickable mailto links) in both Reading View and Live Preview.

## Features

- **Convert links to display text** — replace `[text](url)` with `text` and `[[target]]` / `[[target|alias]]` with the display name
- **Convert links to URLs** — replace `[text](url)` with `url` and `[[target|alias]]` with `target`
- **Bare email to plain text** — toggle to render `user@example.com` as plain text instead of a clickable mailto link
  - Works in both Reading View and Live Preview / Source Mode
  - Normal click suppressed; Ctrl/Cmd+click still opens the mailto link
  - Explicit `[text](mailto:...)` links are preserved

All commands are available via the command palette and the ribbon icon menu.

## Installation

### From Obsidian Community Plugins

1. Open Settings → Community Plugins
2. Search for "Plain Links Tools"
3. Install and enable

### Manual

Copy `main.js`, `manifest.json`, and `styles.css` into `VaultFolder/.obsidian/plugins/plain-links-tools/`.

## Usage

| Action | How |
|--------|-----|
| Convert links to display text | Command palette → "現在のノートのリンクを表示文字列に変換" or ribbon menu |
| Convert links to URLs | Command palette → "現在のノートのMarkdownリンクをURLに変換" or ribbon menu |
| Toggle email plain text | Ribbon menu → "メールアドレスを文字列として表示" |

## License

MIT
