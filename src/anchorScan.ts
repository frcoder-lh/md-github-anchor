import { parseAnchor } from './anchor';

/**
 * Pure, dependency-free scanning of GitHub-style anchor links in markdown
 * text. Lives in its own module so it can be unit-tested without loading
 * the `vscode` module.
 */

/** A detected GitHub-style anchor link span in the document text. */
export interface AnchorSpan {
  /** The link target, e.g. `docs/guide.md#L12-L15`. */
  href: string;
  /** Character offset of the start of the link text. */
  start: number;
  /** Character offset one past the end of the link text. */
  end: number;
}

/**
 * Scan markdown text and return every GitHub-style anchor link together with
 * its exact character span in the document.
 */
export function findAnchorSpans(text: string): AnchorSpan[] {
  const spans: AnchorSpan[] = [];

  // Inline links: [label](target)
  const inlineRe = /\[[^\]\n]*\]\(([^)\n]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = inlineRe.exec(text)) !== null) {
    const href = extractHref(m[1]);
    if (href && parseAnchor(href)) {
      spans.push({ href, start: m.index, end: m.index + m[0].length });
    }
  }

  // Autolinks: <docs/guide.md#L12-L15>
  const autoRe = /<([^>\s]+)>/g;
  while ((m = autoRe.exec(text)) !== null) {
    const href = m[1];
    if (parseAnchor(href)) {
      spans.push({ href, start: m.index, end: m.index + m[0].length });
    }
  }

  return spans;
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
