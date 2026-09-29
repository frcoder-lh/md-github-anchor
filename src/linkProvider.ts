import * as vscode from 'vscode';
import { parseAnchor } from './anchor';

const OPEN_ANCHOR_COMMAND = 'md-github-anchor.openAnchor';

/**
 * Scans Markdown documents and turns GitHub-style anchor links
 * (`docs/guide.md#L12-L15`) into clickable links (Ctrl/Cmd+Click).
 */
export class AnchorLinkProvider implements vscode.DocumentLinkProvider {
  provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
    const links: vscode.DocumentLink[] = [];
    const text = document.getText();

    // Inline links: [label](target)
    const inlineRe = /\[[^\]\n]*\]\(([^)\n]*)\)/g;
    let m: RegExpExecArray | null;
    while ((m = inlineRe.exec(text)) !== null) {
      const full = m[0];
      const hrefRaw = extractHref(m[1]);
      if (!hrefRaw) {
        continue;
      }
      addLink(links, hrefRaw, document.positionAt(m.index));
    }

    // Autolinks: <docs/guide.md#L12-L15>
    const autoRe = /<([^>\s]+)>/g;
    while ((m = autoRe.exec(text)) !== null) {
      addLink(links, m[1], document.positionAt(m.index));
    }

    return links;
  }
}

/** Strip an optional link title and surrounding `<...>` from a target. */
function extractHref(targetRaw: string): string | undefined {
  let t = targetRaw.trim();
  if (t.startsWith('<') && t.endsWith('>')) {
    t = t.slice(1, -1).trim();
  }
  // Drop a trailing link title (quoted) if present.
  t = t.split(/\s+/)[0];
  return t;
}

function addLink(links: vscode.DocumentLink[], href: string, position: vscode.Position): void {
  const target = parseAnchor(href);
  if (!target) {
    return;
  }
  const range = new vscode.Range(position, position.translate(0, href.length));
  const args = encodeURIComponent(JSON.stringify({ href }));
  const link = new vscode.DocumentLink(range, vscode.Uri.parse(`command:${OPEN_ANCHOR_COMMAND}?${args}`));
  link.tooltip = `Open ${href} (lines ${target.startLine}-${target.endLine})`;
  links.push(link);
}
