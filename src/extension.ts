import * as vscode from 'vscode';
import { AnchorLinkProvider } from './linkProvider';
import { copyAnchor, disposeAnchorResources, openAnchor } from './commands';
import { createAnchorPlugin, MinimalMarkdownIt } from './markdownPlugin';

export function activate(context: vscode.ExtensionContext): { extendMarkdownIt: (md: MinimalMarkdownIt) => MinimalMarkdownIt } {
  context.subscriptions.push(
    vscode.commands.registerCommand('md-github-anchor.openAnchor', (arg?: unknown) => {
      let href: string | undefined;
      if (typeof arg === 'string') {
        href = arg;
      } else if (arg && typeof arg === 'object' && typeof (arg as { href?: unknown }).href === 'string') {
        href = (arg as { href: string }).href;
      }
      return openAnchor(href);
    }),

    vscode.commands.registerCommand('md-github-anchor.copyAnchor', () => copyAnchor()),

    vscode.languages.registerDocumentLinkProvider(
      { language: 'markdown', scheme: 'file' },
      new AnchorLinkProvider()
    )
  );

  /**
   * Contributed via `contributes.markdown.markdownItPlugins: true`.
   * Rewrites GitHub-style anchor links in the Markdown preview to
   * `command:` URIs so clicking them executes `md-github-anchor.openAnchor`.
   */
  return {
    extendMarkdownIt(md: MinimalMarkdownIt): MinimalMarkdownIt {
      createAnchorPlugin()(md);
      return md;
    },
  };
}

export function deactivate(): void {
  disposeAnchorResources();
}
