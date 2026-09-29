import { parseAnchor } from './anchor';

/**
 * Minimal structural types for the markdown-it objects we touch, so the
 * plugin compiles without installing markdown-it (VS Code supplies it).
 */
interface RendererRules {
  [name: string]: unknown;
}
interface MinimalMarkdownIt {
  renderer: { rules: RendererRules };
}
export { MinimalMarkdownIt };
interface TokenLike {
  attrGet(name: string): string | null;
  attrSet(name: string, value: string): void;
}

const OPEN_ANCHOR_COMMAND = 'md-github-anchor.openAnchor';

/**
 * markdown-it plugin contributed to the VS Code Markdown preview.
 *
 * Rewrites GitHub-style anchor links (`docs/guide.md#L12-L15`) to a
 * `command:` URI, so clicking them inside the preview executes the
 * `md-github-anchor.openAnchor` command and jumps to the target lines.
 */
export function createAnchorPlugin() {
  return function anchorPlugin(md: MinimalMarkdownIt): void {
    const original = md.renderer.rules.link_open as
      | ((tokens: TokenLike[], idx: number, options: unknown, env: unknown, self: { renderToken: (tokens: TokenLike[], idx: number, options: unknown) => string }) => string)
      | undefined;

    md.renderer.rules.link_open = (
      tokens: TokenLike[],
      idx: number,
      options: unknown,
      env: unknown,
      self: { renderToken: (tokens: TokenLike[], idx: number, options: unknown) => string }
    ): string => {
      const token = tokens[idx];
      const href = token.attrGet('href') ?? '';
      if (parseAnchor(href)) {
        const args = encodeURIComponent(JSON.stringify({ href }));
        token.attrSet('href', `command:${OPEN_ANCHOR_COMMAND}?${args}`);
      }
      if (typeof original === 'function') {
        return original(tokens, idx, options, env, self);
      }
      return self.renderToken(tokens, idx, options);
    };
  };
}
