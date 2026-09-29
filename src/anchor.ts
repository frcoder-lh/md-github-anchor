/**
 * GitHub-style line-range anchor parser.
 *
 * Supports targets like:
 *   - `docs/guide.md#L12`        single line
 *   - `docs/guide.md#L12-L15`    inclusive range (both ends prefixed)
 *   - `docs/guide.md#L12-15`     inclusive range (end without `L`)
 *   - `guide.md#L12,15`          GitHub also accepts a comma form
 *   - `#L12-L15`                 same-file anchor (empty path)
 */
export interface AnchorTarget {
  /** Raw file path from the link; empty string means "the current document". */
  rawPath: string;
  /** 1-based start line. */
  startLine: number;
  /** 1-based end line, inclusive. Equals startLine for a single-line anchor. */
  endLine: number;
}

const ANCHOR_RE = /^(.*?)#L(\d+)(?:[-,\s]L?(\d+))?$/i;

/**
 * Parse a link target into an {@link AnchorTarget}, or null when it is not
 * a GitHub-style line-range anchor.
 */
export function parseAnchor(href: string): AnchorTarget | null {
  if (!href) {
    return null;
  }
  const m = ANCHOR_RE.exec(href.trim());
  if (!m) {
    return null;
  }
  const start = Number(m[2]);
  if (!Number.isInteger(start) || start < 1) {
    return null;
  }
  let end = start;
  if (m[3] !== undefined) {
    const parsedEnd = Number(m[3]);
    if (Number.isInteger(parsedEnd) && parsedEnd >= start) {
      end = parsedEnd;
    }
    // A reversed range (#L5-L2) collapses to its start line, matching GitHub.
  }
  return {
    rawPath: m[1],
    startLine: start,
    endLine: end,
  };
}

/**
 * Build the canonical GitHub-style anchor fragment for a range,
 * e.g. `#L12-L15` or `#L12` for a single line.
 */
export function buildAnchorFragment(startLine: number, endLine: number): string {
  if (endLine <= startLine) {
    return `#L${startLine}`;
  }
  return `#L${startLine}-L${endLine}`;
}
