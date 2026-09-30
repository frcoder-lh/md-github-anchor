import * as vscode from 'vscode';
import { AnchorLinkProvider } from './linkProvider';
import { copyAnchor, disposeAnchorResources, openAnchor, registerFragmentAnchorListener } from './commands';

export function activate(context: vscode.ExtensionContext): void {
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

  // Highlight the line range when the preview opens an anchor link.
  registerFragmentAnchorListener(context);
}

export function deactivate(): void {
  disposeAnchorResources();
}
