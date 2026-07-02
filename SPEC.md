# Plain Links Tools — Specification

> [日本語版はこちら](docs/SPEC_ja.md)

## Overview

A plugin for [Obsidian](https://obsidian.md) that provides tools for working with Markdown links, with a particular focus on making bare email addresses render as plain text rather than clickable mailto links.

## Requirements

- Obsidian ≥ 1.5.0
- Desktop and mobile (isDesktopOnly: false)

## Commands

### `convert-links-to-display-text-current-note`

Converts all links in the current note to their display text form.

| Input | Output |
|-------|--------|
| `[text](https://example.com)` | `text` |
| `[[target\|alias]]` | `alias` |
| `[[target]]` | `target` |

Code blocks and inline code are protected from conversion.

### `convert-markdown-links-to-urls-current-note`

Converts Markdown links in the current note to their URL form. Wiki links use the target path as the URL.

| Input | Output |
|-------|--------|
| `[text](https://example.com)` | `https://example.com` |
| `[[target\|alias]]` | `target` |
| `[[target]]` | `target` |

Code blocks and inline code are protected from conversion.

## Bare Email Plain Text

### Behavior

When enabled, bare email addresses (e.g. `user@example.com`) are rendered as plain text in both Reading View and Live Preview / Source Mode.

- **Normal left click**: suppressed — does not open mailto
- **Ctrl/Cmd + left click**: opens the mailto link (Obsidian default behavior)
- **Explicit Markdown links**: `[text](mailto:user@example.com)` are always preserved as clickable links

### Reading View

A `registerMarkdownPostProcessor` replaces `<a href="mailto:...">` elements with `<span class="plain-links-tools-auto-mailto-text">` elements. Explicit Markdown mailto links whose display text matches an explicit `[text](mailto:...)` pattern in the source are excluded from replacement.

### Live Preview / Source Mode

A CodeMirror 6 `ViewPlugin` applies `Decoration.mark` with class `plain-links-tools-bare-email` to email positions in visible ranges. A `Prec.highest` `EditorView.domEventHandlers` click handler suppresses normal left clicks on decorated email positions. CSS rules using `:has()` kill the link styling on the parent `.cm-url` / `.cm-underline` spans.

Emails inside code blocks, frontmatter, comments, and explicit `[text](mailto:...)` Markdown links are excluded from decoration.

### Settings

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `plainEmailAddresses` | boolean | `true` | Toggle bare email plain text rendering |

Migration: `plainBareEmailsInReadingView` (legacy) → `plainEmailAddresses`

## Architecture

```
src/main.ts          — Plugin entry point, all logic
styles.css           — Reading View and Live Preview CSS
manifest.json        — Obsidian plugin metadata
esbuild.config.mjs   — Build configuration
```

### Key Dependencies

- `@codemirror/language` — syntax tree for excluding code/frontmatter/comment nodes
- `@codemirror/state` — `RangeSetBuilder`, `Prec`
- `@codemirror/view` — `Decoration`, `ViewPlugin`, `EditorView.domEventHandlers`
- `obsidian` — Plugin API (`registerMarkdownPostProcessor`, `addCommand`, etc.)

## Version History

### v0.1.20 (current)

Release candidate. Removed diagnostic logging. Both Reading View and Live Preview bare email plain text rendering are stable.

### v0.1.0 — v0.1.19

Iterative development of bare email plain text feature, CSS suppression, click suppression, and settings infrastructure.
