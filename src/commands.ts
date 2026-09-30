import * as vscode from 'vscode';
import * as path from 'path';
import { AnchorTarget, buildAnchorFragment, parseAnchor } from './anchor';

/** Single temporary highlight decoration shared across calls. */
let highlightDecoration: vscode.TextEditorDecorationType | undefined;
let highlightTimer: NodeJS.Timeout | undefined;

/**
 * Open the target document and select / highlight the anchored line range.
 *
 * @param href  Raw link target, e.g. `docs/guide.md#L12-L15` or `#L12-L15`.
 * @param base  Optional base document used to resolve relative paths. When
 *              omitted the currently active Markdown editor is used.
 */
export async function openAnchor(href: string | undefined, base?: vscode.TextDocument): Promise<void> {
  const effectiveHref = href ?? (await tryReadClipboardAnchor());
  if (!effectiveHref) {
    vscode.window.showWarningMessage('No GitHub-style anchor link to open.');
    return;
  }
  const target = parseAnchor(effectiveHref);
  if (!target) {
    vscode.window.showWarningMessage(`"${effectiveHref}" is not a GitHub-style anchor (expected path#L12 or path#L12-L15).`);
    return;
  }

  const baseDoc = base ?? getActiveMarkdownDocument();
  const uri = await resolveTargetUri(baseDoc, target);
  if (!uri) {
    vscode.window.showErrorMessage(`Could not resolve target for "${effectiveHref}".`);
    return;
  }

  const doc = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(doc, {
    preserveFocus: true,
    preview: false,
  });

  const lastLine = Math.max(0, Math.min(target.endLine - 1, editor.document.lineCount - 1));
  const startPos = new vscode.Position(Math.max(0, target.startLine - 1), 0);
  const endPos = editor.document.lineAt(lastLine).range.end;
  const range = new vscode.Range(startPos, endPos);

  editor.selection = new vscode.Selection(startPos, endPos);
  editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
  flashHighlight(editor, range);
}

/** Resolve the anchored file path against the base document + workspace fallback. */
async function resolveTargetUri(baseDoc: vscode.TextDocument | undefined, target: AnchorTarget): Promise<vscode.Uri | undefined> {
  const raw = target.rawPath;
  if (!raw) {
    // Same-file anchor: open the base document itself.
    return baseDoc?.uri;
  }

  const isAbsolute = path.isAbsolute(raw) || /^[a-zA-Z]:[\\/]/.test(raw);
  if (isAbsolute) {
    return vscode.Uri.file(raw);
  }

  // Relative to the base document's folder (GitHub semantics: relative to file).
  if (baseDoc && baseDoc.uri.scheme === 'file') {
    const baseDir = vscode.Uri.file(path.dirname(baseDoc.uri.fsPath));
    const uri = vscode.Uri.joinPath(baseDir, raw);
    if (pathExists(uri)) {
      return uri;
    }
  }

  // Fallback: unique basename lookup anywhere in the workspace.
  const basename = path.basename(raw);
  const wsFolders = vscode.workspace.workspaceFolders ?? [];
  for (const folder of wsFolders) {
    const matches = await vscode.workspace.findFiles(
      new vscode.RelativePattern(folder, `**/${basename}`),
      undefined,
      1
    );
    if (matches.length > 0) {
      return matches[0];
    }
  }
  return undefined;
}

function pathExists(uri: vscode.Uri): boolean {
  try {
    return require('fs').existsSync(uri.fsPath) as boolean;
  } catch {
    return false;
  }
}

function getActiveMarkdownDocument(): vscode.TextDocument | undefined {
  const editor = vscode.window.activeTextEditor;
  if (editor && editor.document.languageId === 'markdown') {
    return editor.document;
  }
  // Search open editors for a Markdown document.
  for (const ed of vscode.window.visibleTextEditors) {
    if (ed.document.languageId === 'markdown') {
      return ed.document;
    }
  }
  return undefined;
}

async function tryReadClipboardAnchor(): Promise<string | undefined> {
  try {
    const text = (await vscode.env.clipboard.readText()).trim();
    return parseAnchor(text) ? text : undefined;
  } catch {
    return undefined;
  }
}

/** Apply a short-lived whole-line highlight over the anchored range. */
function flashHighlight(editor: vscode.TextEditor, range: vscode.Range): void {
  if (!highlightDecoration) {
    highlightDecoration = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: new vscode.ThemeColor('editor.selectionHighlightBackground'),
      border: '1px solid var(--vscode-focusBorder)',
    });
  }
  editor.setDecorations(highlightDecoration, [range]);

  if (highlightTimer) {
    clearTimeout(highlightTimer);
  }
  const deco = highlightDecoration;
  highlightTimer = setTimeout(() => {
    if (!deco) {
      return;
    }
    for (const ed of vscode.window.visibleTextEditors) {
      ed.setDecorations(deco, []);
    }
  }, 4000);
}

/** Copy a GitHub-style anchor link for the current selection, e.g. `docs/guide.md#L12-L15`. */
export async function copyAnchor(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showWarningMessage('Select lines in a Markdown file first.');
    return;
  }
  const sel = editor.selection;
  if (sel.isEmpty) {
    vscode.window.showWarningMessage('Select at least one line to build an anchor link.');
    return;
  }
  const fragment = buildAnchorFragment(sel.start.line + 1, sel.end.line + 1);
  const rel = relativeToWorkspace(editor.document.uri);
  const text = rel ? `${rel}${fragment}` : `${editor.document.uri.fsPath}${fragment}`;
  await vscode.env.clipboard.writeText(text);
  vscode.window.setStatusBarMessage(`$(link) Copied anchor: ${text}`, 4000);
}

function relativeToWorkspace(uri: vscode.Uri): string | undefined {
  const folder = vscode.workspace.getWorkspaceFolder(uri);
  if (!folder) {
    return undefined;
  }
  return path.relative(folder.uri.fsPath, uri.fsPath).split(path.sep).join('/');
}

/** Dispose global decoration resources (called from deactivate). */
export function disposeAnchorResources(): void {
  if (highlightTimer) {
    clearTimeout(highlightTimer);
  }
  if (highlightDecoration) {
    highlightDecoration.dispose();
  }
}

/** Matches a URI fragment of the form `L12`, `L12-L15` or `L12,15`. */
const ANCHOR_FRAGMENT_RE = /^L(\d+)(?:[-,\s]L?(\d+))?$/i;

/**
 * When the Markdown preview opens an anchor link (`path.md#L12-L15`), VS Code
 * opens the target file with the `#L12-L15` kept in the document URI fragment.
 * This listener detects that fragment on the active editor and selects +
 * highlights the corresponding line range — no `command:` links involved, so
 * it works in any VS Code-compatible editor (including Trae).
 */
export function registerFragmentAnchorListener(context: vscode.ExtensionContext): void {
  const handled = new Set<string>();

  const check = (editor: vscode.TextEditor | undefined): void => {
    if (!editor) {
      return;
    }
    const frag = editor.document.uri.fragment;
    const m = ANCHOR_FRAGMENT_RE.exec(frag);
    if (!m) {
      return;
    }
    const key = editor.document.uri.toString();
    if (handled.has(key)) {
      return;
    }
    const startLine = Number(m[1]);
    let endLine = m[2] !== undefined ? Number(m[2]) : startLine;
    if (endLine < startLine) {
      endLine = startLine;
    }
    const last = Math.max(0, Math.min(endLine - 1, editor.document.lineCount - 1));
    const range = new vscode.Range(
      new vscode.Position(Math.max(0, startLine - 1), 0),
      editor.document.lineAt(last).range.end
    );
    editor.selection = new vscode.Selection(range.start, range.end);
    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    flashHighlight(editor, range);
    handled.add(key);
  };

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(check),
    vscode.workspace.onDidOpenTextDocument((doc) => {
      const editor = vscode.window.visibleTextEditors.find((e) => e.document.uri.toString() === doc.uri.toString());
      if (editor) {
        check(editor);
      }
    })
  );
  check(vscode.window.activeTextEditor);
}
