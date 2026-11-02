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

interface Range {
  start: number;
  end: number;
}

/**
 * Scan markdown text and return every GitHub-style anchor link together with
 * its exact character span in the document.
 *
 * Detects three forms:
 *   1. Inline links:  [label](path/file.md#L12-L15)
 *   2. Autolinks:     <path/file.md#L12-L15>
 *   3. Bare text:     path/file.md#L12-L15  (anywhere in the document)
 */
export function findAnchorSpans(text: string): AnchorSpan[] {
  const spans: AnchorSpan[] = [];

  // 1) Inline links: [label](target)
  const inlineRe = /\[[^\]\n]*\]\(([^)\n]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = inlineRe.exec(text)) !== null) {
    const href = extractHref(m[1]);
    if (href && parseAnchor(href)) {
      spans.push({ href, start: m.index, end: m.index + m[0].length });
    }
  }

  // 2) Autolinks: <docs/guide.md#L12-L15>
  const autoRe = /<([^>\s]+)>/g;
  while ((m = autoRe.exec(text)) !== null) {
    const href = m[1];
    if (parseAnchor(href)) {
      spans.push({ href, start: m.index, end: m.index + m[0].length });
    }
  }

  // 3) Bare anchors: path/to/file.ts#L12-L15 anywhere in the document.
  //    Negative lookbehind ensures we don't start mid-word.
  //    Path chars: word chars, dot, slash, tilde, hyphen.
  //    Range forms: -L15, -15, ,15  (space form excluded for free-text safety).
  const bareRe = /(?<![\w.~/-])([\w.~/-]*#L\d+(?:[-,]L?\d+)?)/g;
  while ((m = bareRe.exec(text)) !== null) {
    const href = m[1];
    const start = m.index;
    const end = start + href.length;

    // Skip if this bare anchor overlaps an already-detected inline/autolink span.
    if (rangeOverlapsAny(start, end, spans)) continue;

    if (parseAnchor(href)) {
      spans.push({ href, start, end });
    }
  }

  return spans;
}

/** Strip an optional link title and surrounding `<...>` from a target. */
function extractHref(targetRaw: string): string | undefined {
  let t = targetRaw.trim();
  if (t.startsWith('<') && t.endsWith('>')) {
    t = sliceTrim(t);
  }
  // Drop a trailing link title (quoted) if present.
  t = t.split(/\s+/)[0];
  return t;
}

function sliceTrim(t: string): string {
  return t.slice(1, -1).trim();
}

/** Return true if [start, end) overlaps any range in the list. */
function rangeOverlapsAny(start: number, end: number, list: Range[]): boolean {
  return list.some((r) => start < r.end && end > r.start);
}
