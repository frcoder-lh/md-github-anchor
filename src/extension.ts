import * as vscode from 'vscode';
import { AnchorLinkProvider } from './linkProvider';
import { copyAnchor, disposeAnchorResources, openAnchor, registerFragmentAnchorListener } from './commands';
import { createAnchorPlugin, MinimalMarkdownIt } from './markdownPlugin';
import { disposePreview, openGitHubAnchorPreview } from './preview';

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

    vscode.commands.registerCommand('md-github-anchor.openPreview', () => openGitHubAnchorPreview(context)),

    vscode.languages.registerDocumentLinkProvider(
      { language: 'markdown', scheme: 'file' },
      new AnchorLinkProvider()
    )
  );

  // Highlight the line range when the preview opens an anchor link via fragment.
  registerFragmentAnchorListener(context);

  return {
    extendMarkdownIt(md: MinimalMarkdownIt): MinimalMarkdownIt {
      createAnchorPlugin()(md);
      return md;
    },
  };
}

export function deactivate(): void {
  disposeAnchorResources();
  disposePreview();
}
