export interface MinimalMarkdownIt {
  renderer: {
    rules: Record<string, (tokens: Token[], idx: number, options: unknown, env: unknown, self: RendererSelf) => string>;
  };
}

export interface RendererSelf {
  renderToken(tokens: Token[], idx: number, options: unknown): string;
}

export interface Token {
  type: string;
  attrs: [string, string][] | null;
  children: null | Token[];
}

/** True when `href` is a GitHub-style line anchor, e.g. `docs/guide.md#L12-L15` or `#L12`. */
export function isAnchorHref(href: string): boolean {
  return /#L\d+(?:[-,\s]L?\d+)?$/i.test(href);
}

/**
 * For anchor links, strip the `#L…` fragment from the rendered `href` so the
 * preview (VS Code or Trae) can always open the target file on a normal click.
 * The full anchor is preserved in `data-md-anchor` + `class` for a
 * previewScripts click-interceptor to handle and jump with highlight.
 */
export function createAnchorPlugin(): (md: MinimalMarkdownIt) => void {
  return (md) => {
    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const attrs = token.attrs;
      const hrefAttr = attrs?.find((a) => a[0] === 'href');
      if (!hrefAttr) {
        return self.renderToken(tokens, idx, options);
      }
      const href = hrefAttr[1];
      if (!isAnchorHref(href)) {
        return self.renderToken(tokens, idx, options);
      }
      const hashIdx = href.indexOf('#');
      const clean = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
      hrefAttr[1] = clean;
      attrs!.push(['class', 'md-github-anchor']);
      attrs!.push(['data-md-anchor', href]);
      return self.renderToken(tokens, idx, options);
    };
  };
}
