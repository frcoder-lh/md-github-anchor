/**
 * Preview-side click interceptor for Markdown GitHub Anchor.
 *
 * Injected via `contributes.markdown.previewScripts`. Clicking an anchor link
 * (marked `.md-github-anchor`) is intercepted and routed to the extension
 * command `md-github-anchor.openAnchor` through the VS Code message channel.
 * If the preview does not expose the `vscode` API, it falls back to opening
 * the fragment-free target path so the file is still opened.
 */
(function () {
  function getVscodeApi() {
    const w = window as unknown as { vscode?: unknown; acquireVsCodeApi?: () => unknown };
    if (w.vscode) {
      return w.vscode;
    }
    if (typeof w.acquireVsCodeApi === 'function') {
      try {
        return w.acquireVsCodeApi();
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  function handleClick(ev: MouseEvent): void {
    let el = ev.target as HTMLElement | null;
    while (el && !(el.dataset && el.dataset.mdAnchor)) {
      el = el.parentElement;
    }
    if (!el || !el.dataset) {
      return;
    }
    const href = el.dataset.mdAnchor;
    if (!href) {
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();

    const api = getVscodeApi();
    if (api) {
      (api as { postMessage: (m: unknown) => void }).postMessage({
        type: 'command',
        command: 'md-github-anchor.openAnchor',
        args: [href],
      });
      return;
    }
    // Fallback: open the fragment-free file normally.
    const hashIdx = href.indexOf('#');
    const clean = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
    if (clean) {
      window.location.href = clean;
    }
  }

  document.addEventListener('click', handleClick, true);
})();
