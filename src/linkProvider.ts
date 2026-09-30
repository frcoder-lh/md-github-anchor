import * as vscode from 'vscode';
import { parseAnchor } from './anchor';
import { findAnchorSpans } from './anchorScan';

const OPEN_ANCHOR_COMMAND = 'md-github-anchor.openAnchor';

/**
 * Scans Markdown documents and turns GitHub-style anchor links
 * (`docs/guide.md#L12-L15`) into clickable links (Ctrl/Cmd+Click).
 */
export class AnchorLinkProvider implements vscode.DocumentLinkProvider {
  provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
    return findAnchorSpans(document.getText()).map(({ href, start, end }) => {
      const target = parseAnchor(href)!;
      const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
      const args = encodeURIComponent(JSON.stringify({ href }));
      const link = new vscode.DocumentLink(range, vscode.Uri.parse(`command:${OPEN_ANCHOR_COMMAND}?${args}`));
      link.tooltip = `Open ${href} (lines ${target.startLine}-${target.endLine})`;
      return link;
    });
  }
}
