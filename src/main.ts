import {
  MarkdownView,
  Menu,
  Notice,
  Plugin,
  TFile,
  setIcon,
} from "obsidian";

import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder, Prec } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";

interface PlainLinksToolsSettings {
  plainEmailAddresses: boolean;
}

const DEFAULT_SETTINGS: PlainLinksToolsSettings = {
  plainEmailAddresses: true,
};

const EMAIL_PATTERN =
  String.raw`\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b`;

const EMAIL_DECORATION = Decoration.mark({
  class: "plain-links-tools-bare-email plain-links-tools-plain-email",
});

function findEmails(text: string): RegExpMatchArray[] {
  return Array.from(text.matchAll(new RegExp(EMAIL_PATTERN, "g")));
}

function protectCode(text: string, transform: (body: string) => string): string {
  const placeholders: string[] = [];

  const protectedText = text
    .replace(/```[\s\S]*?```/g, (match) => {
      const key = `@@PLAIN_LINKS_CODE_${placeholders.length}@@`;
      placeholders.push(match);
      return key;
    })
    .replace(/`[^`\n]+`/g, (match) => {
      const key = `@@PLAIN_LINKS_CODE_${placeholders.length}@@`;
      placeholders.push(match);
      return key;
    });

  let converted = transform(protectedText);

  placeholders.forEach((value, index) => {
    converted = converted.replace(`@@PLAIN_LINKS_CODE_${index}@@`, value);
  });

  return converted;
}

function linksToDisplayText(text: string): string {
  return text
    .replace(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1");
}

function linksToUrls(text: string): string {
  return text
    .replace(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g, "$2")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1");
}

function collectExplicitMailtoLinkTexts(markdown: string): Set<string> {
  const explicitMailtoTexts = new Set<string>();
  const regex = /(?<!!)\[([^\]]+)\]\(mailto:[^)]+\)/g;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(markdown)) !== null) {
    explicitMailtoTexts.add(match[1]);
  }

  return explicitMailtoTexts;
}

function isInExcludedSyntaxNode(view: EditorView, pos: number): boolean {
  let node = syntaxTree(view.state).resolveInner(pos, 1);

  while (node) {
    const name = node.name.toLowerCase();

    if (
      name.includes("code") ||
      name.includes("frontmatter") ||
      name.includes("comment")
    ) {
      return true;
    }

    const parent = node.parent;
    if (!parent) break;
    node = parent;
  }

  return false;
}

function isInsideExplicitMarkdownMailtoLink(
  view: EditorView,
  start: number,
  end: number
): boolean {
  const line = view.state.doc.lineAt(start);
  const lineText = line.text;

  const localStart = start - line.from;
  const localEnd = end - line.from;

  const regex = /\[[^\]]+\]\(mailto:[^)]+\)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(lineText)) !== null) {
    const linkStart = match.index;
    const linkEnd = linkStart + match[0].length;

    if (localStart >= linkStart && localEnd <= linkEnd) {
      return true;
    }
  }

  return false;
}

function isBareEmailAtPos(view: EditorView, pos: number): boolean {
  const line = view.state.doc.lineAt(pos);
  const text = line.text;

  for (const match of findEmails(text)) {
    if (match.index === undefined) continue;

    const start = line.from + match.index;
    const end = start + match[0].length;

    if (pos < start || pos > end) continue;
    if (isInExcludedSyntaxNode(view, start)) return false;
    if (isInsideExplicitMarkdownMailtoLink(view, start, end)) return false;
    return true;
  }

  return false;
}

function createBareEmailClickSuppressor(plugin: PlainLinksToolsPlugin) {
  return EditorView.domEventHandlers({
    click(event, view) {
      if (!plugin.settings.plainEmailAddresses) return false;

      if (event.ctrlKey || event.metaKey) return false;
      if (event.button !== 0) return false;

      const pos = view.posAtCoords({
        x: event.clientX,
        y: event.clientY,
      });
      if (pos == null) return false;
      if (!isBareEmailAtPos(view, pos)) return false;

      event.preventDefault();
      event.stopPropagation();
      return true;
    },
  });
}

function createPlainEmailEditorExtension(plugin: PlainLinksToolsPlugin) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private lastEnabled: boolean;

      constructor(view: EditorView) {
        this.lastEnabled = plugin.settings.plainEmailAddresses;
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        const nextEnabled = plugin.settings.plainEmailAddresses;

        if (
          update.docChanged ||
          update.viewportChanged ||
          nextEnabled !== this.lastEnabled
        ) {
          this.lastEnabled = nextEnabled;
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();

        if (!plugin.settings.plainEmailAddresses) {
          return builder.finish();
        }

        for (const { from, to } of view.visibleRanges) {
          const text = view.state.doc.sliceString(from, to);

          for (const match of findEmails(text)) {
            if (match.index === undefined) continue;

            const start = from + match.index;
            const end = start + match[0].length;

            if (isInExcludedSyntaxNode(view, start)) continue;
            if (isInsideExplicitMarkdownMailtoLink(view, start, end)) continue;

            builder.add(start, end, EMAIL_DECORATION);
          }
        }

        return builder.finish();
      }
    },
    {
      decorations: (value) => value.decorations,
    }
  );
}

export default class PlainLinksToolsPlugin extends Plugin {
  settings: PlainLinksToolsSettings = { ...DEFAULT_SETTINGS };
  private ribbonIconEl: HTMLElement | null = null;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "convert-links-to-display-text-current-note",
      name: "現在のノートのリンクを表示文字列に変換",
      editorCallback: () => {
        this.convertCurrentNoteToDisplayText();
      },
    });

    this.addCommand({
      id: "convert-markdown-links-to-urls-current-note",
      name: "現在のノートのMarkdownリンクをURLに変換",
      editorCallback: () => {
        this.convertCurrentNoteToUrls();
      },
    });

    this.ribbonIconEl = this.addRibbonIcon(
      this.getRibbonIconName(),
      "Plain Links Tools",
      (event: MouseEvent) => {
        this.showPlainLinksMenu(event);
      }
    );

    this.registerBareMailtoPlainTextPostProcessor();

    this.registerEditorExtension([
      Prec.highest(createPlainEmailEditorExtension(this)),
      Prec.highest(createBareEmailClickSuppressor(this)),
    ]);
  }

  private async loadSettings() {
    const loaded = await this.loadData();

    if (
      loaded &&
      typeof loaded.plainBareEmailsInReadingView === "boolean" &&
      typeof loaded.plainEmailAddresses !== "boolean"
    ) {
      loaded.plainEmailAddresses = loaded.plainBareEmailsInReadingView;
      delete loaded.plainBareEmailsInReadingView;
      await this.saveData(loaded);
    }

    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
  }

  private async saveSettings() {
    await this.saveData(this.settings);
  }

  private getRibbonIconName(): string {
    return this.settings.plainEmailAddresses ? "unlink" : "link";
  }

  private updateRibbonIcon() {
    if (!this.ribbonIconEl) {
      return;
    }

    this.ribbonIconEl.empty();
    setIcon(this.ribbonIconEl, this.getRibbonIconName());
  }

  private showPlainLinksMenu(event: MouseEvent) {
    const menu = new Menu();

    menu.addItem((item) => {
      item
        .setTitle("リンクを表示文字列に変換")
        .setIcon("unlink")
        .onClick(() => {
          this.convertCurrentNoteToDisplayText();
        });
    });

    menu.addItem((item) => {
      item
        .setTitle("リンクをURLに変換")
        .setIcon("external-link")
        .onClick(() => {
          this.convertCurrentNoteToUrls();
        });
    });

    menu.addSeparator();

    menu.addItem((item) => {
      const enabled = this.settings.plainEmailAddresses;

      item
        .setTitle(
          enabled
            ? "メールアドレスを文字列として表示: ON"
            : "メールアドレスを文字列として表示: OFF"
        )
        .setIcon(enabled ? "unlink" : "link")
        .onClick(async () => {
          await this.togglePlainEmailAddresses();
        });
    });

    menu.showAtMouseEvent(event);
  }

  private async togglePlainEmailAddresses() {
    this.settings.plainEmailAddresses =
      !this.settings.plainEmailAddresses;

    await this.saveSettings();
    this.updateRibbonIcon();

    const enabled = this.settings.plainEmailAddresses;

    new Notice(
      enabled
        ? "メールアドレスを文字列として表示します。"
        : "メールアドレスを通常のリンク表示に戻しました。"
    );

    this.app.workspace.updateOptions();
    this.refreshAllMarkdownViews();
  }

  private refreshAllMarkdownViews() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (!(leaf.view instanceof MarkdownView)) {
        return;
      }

      const markdownView = leaf.view;

      const maybePreview = markdownView as MarkdownView & {
        previewMode?: {
          rerender?: (force?: boolean) => void;
        };
      };

      maybePreview.previewMode?.rerender?.(true);

      const editorWithCm = markdownView.editor as typeof markdownView.editor & {
        cm?: EditorView;
      };

      editorWithCm.cm?.dispatch({});
    });
  }

  private registerBareMailtoPlainTextPostProcessor() {
    this.registerMarkdownPostProcessor((element, context) => {
      if (!this.settings.plainEmailAddresses) {
        return;
      }

      const file = this.app.vault.getAbstractFileByPath(context.sourcePath);

      if (!file || !(file instanceof TFile)) {
        return;
      }

      this.app.vault.cachedRead(file).then((markdown) => {
        const explicitMailtoTexts = collectExplicitMailtoLinkTexts(markdown);

        const mailtoLinks = element.querySelectorAll<HTMLAnchorElement>(
          "a[href^='mailto:']"
        );

        mailtoLinks.forEach((link) => {
          const text = link.textContent ?? "";
          if (explicitMailtoTexts.has(text)) {
            return;
          }

          const span = document.createElement("span");
          span.textContent = text;
          span.addClass("plain-links-tools-auto-mailto-text");

          link.replaceWith(span);
        });
      });
    });
  }

  private convertCurrentNoteToDisplayText() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (!view) {
      new Notice("アクティブなMarkdownノートがありません。");
      return;
    }

    const editor = view.editor;
    const original = editor.getValue();
    const converted = protectCode(original, linksToDisplayText);

    if (original === converted) {
      new Notice("変換対象のリンクがありません。");
      return;
    }

    editor.setValue(converted);
    new Notice("現在のノートのリンクを表示文字列に変換しました。");
  }

  private convertCurrentNoteToUrls() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (!view) {
      new Notice("アクティブなMarkdownノートがありません。");
      return;
    }

    const editor = view.editor;
    const original = editor.getValue();
    const converted = protectCode(original, linksToUrls);

    if (original === converted) {
      new Notice("変換対象のMarkdownリンクがありません。");
      return;
    }

    editor.setValue(converted);
    new Notice("現在のノートのMarkdownリンクをURLに変換しました。");
  }
}
