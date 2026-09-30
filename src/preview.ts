import * as vscode from 'vscode';
import * as path from 'path';
import MarkdownIt from 'markdown-it';
import { isAnchorHref } from './markdownPlugin';
import { openAnchor } from './commands';

let previewPanel: vscode.WebviewPanel | undefined;
let previewDoc: vscode.TextDocument | undefined;
let mdInstance: InstanceType<typeof MarkdownIt> | undefined;
let syncRegistered = false;

function getMarkdownIt(): InstanceType<typeof MarkdownIt> {
  if (!mdInstance) {
    mdInstance = new MarkdownIt({ html: true, linkify: true, breaks: true });
  }
  return mdInstance;
}

function resolveWebviewUri(webview: vscode.Webview, base: vscode.TextDocument, href: string): string | undefined {
  try {
    const abs = path.resolve(path.dirname(base.uri.fsPath), href);
    return webview.asWebviewUri(vscode.Uri.file(abs)).toString();
  } catch {
    return undefined;
  }
}

/** Render a Markdown document to an HTML fragment for the preview webview. */
function renderDocument(doc: vscode.TextDocument, webview: vscode.Webview): string {
  const mdit = getMarkdownIt();

  const defaultLinkOpen = mdit.renderer.rules.link_open;
  mdit.renderer.rules.link_open = (tokens: any, idx: number, options: any, env: any, self: any) => {
    const token = tokens[idx];
    const href = token.attrGet('href');
    if (href) {
      if (isAnchorHref(href)) {
        // GitHub-style line anchor → intercept in the webview and jump+highlight.
        token.attrSet('class', 'md-github-anchor');
        token.attrSet('data-anchor', href);
        token.attrSet('href', '#');
        return self.renderToken(tokens, idx, options);
      }
      if (!/^[a-z]+:/i.test(href) && !href.startsWith('#')) {
        // Plain relative path (no scheme) → open the file.
        token.attrSet('class', 'md-open-link');
        token.attrSet('data-link', href);
        token.attrSet('href', '#');
        return self.renderToken(tokens, idx, options);
      }
    }
    return defaultLinkOpen ? defaultLinkOpen(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
  };

  const defaultImage = mdit.renderer.rules.image;
  mdit.renderer.rules.image = (tokens: any, idx: number, options: any, env: any, self: any) => {
    const token = tokens[idx];
    const src = token.attrGet('src');
    if (src && !/^(https?:|data:|#)/i.test(src)) {
      const resolved = resolveWebviewUri(webview, doc, src);
      if (resolved) {
        token.attrSet('src', resolved);
      }
    }
    return defaultImage ? defaultImage(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
  };

  return mdit.render(doc.getText());
}

const PREVIEW_STYLE = `
:root { color-scheme: light dark; }
body { font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  padding: 8px 24px 48px; line-height: 1.65; color: var(--vscode-foreground, #24292f);
  background: var(--vscode-editor-background, #fff); max-width: 920px; margin: 0 auto; }
h1,h2,h3,h4,h5,h6 { font-weight: 600; line-height: 1.25; margin: 1.2em 0 0.5em; }
h1 { font-size: 1.9em; border-bottom: 1px solid var(--vscode-panel-border, #d0d7de); padding-bottom: .3em; }
h2 { font-size: 1.45em; border-bottom: 1px solid var(--vscode-panel-border, #d0d7de); padding-bottom: .3em; }
a { color: var(--vscode-textLink-foreground, #0969da); text-decoration: none; }
a:hover { text-decoration: underline; }
a.md-github-anchor, a.md-open-link { cursor: pointer; }
p { margin: 0 0 1em; }
ul, ol { padding-left: 1.6em; margin: 0 0 1em; }
li { margin: .25em 0; }
code { font-family: var(--vscode-editor-font-family, monospace); background: var(--vscode-textCodeBlock-background, rgba(175,184,193,.2)); padding: .2em .35em; border-radius: 4px; font-size: 0.9em; }
pre { background: var(--vscode-textCodeBlock-background, rgba(175,184,193,.2)); padding: 12px; border-radius: 6px; overflow: auto; }
pre code { background: none; padding: 0; }
blockquote { margin: 0 0 1em; padding: 0 1em; color: var(--vscode-descriptionForeground, #57606a); border-left: 4px solid var(--vscode-panel-border, #d0d7de); }
table { border-collapse: collapse; margin: 0 0 1em; }
th, td { border: 1px solid var(--vscode-panel-border, #d0d7de); padding: 6px 12px; }
th { background: var(--vscode-sideBar-background, rgba(175,184,193,.15)); }
img { max-width: 100%; }
hr { border: none; border-top: 1px solid var(--vscode-panel-border, #d0d7de); margin: 1.5em 0; }
`;

function getHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${PREVIEW_STYLE}</style>
</head>
<body>
<div id="markdown-body" class="markdown-body"></div>
<script>
(function () {
  var vscode = acquireVsCodeApi();
  window.addEventListener('message', function (event) {
    var msg = event.data;
    if (msg && msg.type === 'html') {
      document.getElementById('markdown-body').innerHTML = msg.html;
    }
  });
  document.addEventListener('click', function (e) {
    var el = e.target;
    while (el && el.tagName !== 'A') { el = el.parentElement; }
    if (!el || el.tagName !== 'A') { return; }
    var anchor = el.getAttribute('data-anchor');
    var link = el.getAttribute('data-link');
    if (anchor) { e.preventDefault(); e.stopPropagation(); vscode.postMessage({ type: 'openAnchor', href: anchor }); }
    else if (link) { e.preventDefault(); e.stopPropagation(); vscode.postMessage({ type: 'openLink', href: link }); }
  });
  vscode.postMessage({ type: 'ready' });
})();
</script>
</body>
</html>`;
}

function refreshPreview(): void {
  if (!previewPanel || !previewDoc) {
    return;
  }
  const body = renderDocument(previewDoc, previewPanel.webview);
  previewPanel.webview.postMessage({ type: 'html', html: body });
}

/**
 * Open (or reuse) a custom Markdown preview webview that fully controls link
 * handling — GitHub-style anchors jump + highlight, other relative links open
 * the target file. This bypasses the host's built-in preview entirely, so it
 * works in Trae too.
 */
export function openGitHubAnchorPreview(context: vscode.ExtensionContext): void {
  if (!syncRegistered) {
    syncRegistered = true;
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (previewDoc && e.document.uri.toString() === previewDoc.uri.toString()) {
          previewDoc = e.document;
          refreshPreview();
        }
      })
    );
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showWarningMessage('Open a Markdown file first to use the GitHub Anchor preview.');
    return;
  }
  const doc = editor.document;

  if (previewPanel && previewDoc && previewDoc.uri.toString() === doc.uri.toString()) {
    previewPanel.reveal(vscode.ViewColumn.Beside);
    refreshPreview();
    return;
  }

  previewDoc = doc;
  const dirUri = vscode.Uri.file(path.dirname(doc.uri.fsPath));
  const folder = vscode.workspace.getWorkspaceFolder(doc.uri);
  const roots = folder ? [folder.uri, dirUri] : [dirUri];

  previewPanel = vscode.window.createWebviewPanel(
    'mdGithubAnchorPreview',
    `${path.basename(doc.uri.fsPath)} · GitHub Anchor Preview`,
    vscode.ViewColumn.Beside,
    { enableScripts: true, localResourceRoots: roots, retainContextWhenHidden: true }
  );
  previewPanel.webview.html = getHtml();
  previewPanel.webview.onDidReceiveMessage((msg) => {
    const base = previewDoc;
    if (!base) {
      return;
    }
    if (msg.type === 'ready') {
      refreshPreview();
    } else if (msg.type === 'openAnchor') {
      openAnchor(msg.href, base);
    } else if (msg.type === 'openLink') {
      const abs = path.resolve(path.dirname(base.uri.fsPath), msg.href);
      vscode.commands.executeCommand('vscode.open', vscode.Uri.file(abs));
    }
  });
  previewPanel.onDidDispose(() => {
    previewPanel = undefined;
    previewDoc = undefined;
  });
  refreshPreview();
}

export function disposePreview(): void {
  if (previewPanel) {
    previewPanel.dispose();
    previewPanel = undefined;
    previewDoc = undefined;
  }
}
