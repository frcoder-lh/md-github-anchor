/**
 * Test for findAnchorSpans (link position calculation).
 * Run: npm test  (requires `npm run compile` first).
 */
const { findAnchorSpans } = require('../out/anchorScan.js');

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else { fail++; console.log('FAIL:', msg); }
}

const text = [
  'intro text',
  '[open guide](docs/guide.md#L12-L15) tail',
  '<docs/x.md#L3> more',
  '[plain](docs/guide.md)',
  '[single](a.md#L42)',
  'end',
].join('\n');

const spans = findAnchorSpans(text);
const byHref = (href) => spans.find((s) => s.href === href);

// 1) inline with range: span must exactly cover the full link text.
{
  const full = '[open guide](docs/guide.md#L12-L15)';
  const s = byHref('docs/guide.md#L12-L15');
  ok(!!s, 'inline range span present');
  if (s) {
    ok(text.slice(s.start, s.end) === full, `slice='${text.slice(s.start, s.end)}'`);
    ok(s.start === text.indexOf(full), `start=${s.start}, expected ${text.indexOf(full)}`);
    ok(s.end === text.indexOf(full) + full.length, `end=${s.end}`);
  }
}

// 2) autolink
{
  const full = '<docs/x.md#L3>';
  const s = byHref('docs/x.md#L3');
  ok(!!s, 'autolink span present');
  if (s) {
    ok(text.slice(s.start, s.end) === full, `slice='${text.slice(s.start, s.end)}'`);
    ok(s.start === text.indexOf(full), `start=${s.start}, expected ${text.indexOf(full)}`);
  }
}

// 3) single-line inline
{
  const full = '[single](a.md#L42)';
  const s = byHref('a.md#L42');
  ok(!!s, 'single inline span present');
  if (s) {
    ok(text.slice(s.start, s.end) === full, `slice='${text.slice(s.start, s.end)}'`);
    ok(s.start === text.indexOf(full), `start=${s.start}, expected ${text.indexOf(full)}`);
  }
}

// 4) plain link without anchor must NOT be included
ok(!byHref('docs/guide.md'), 'plain link should be excluded');
ok(spans.length === 3, `expected 3 spans, got ${spans.length}`);

console.log(`linkprovider.test: PASS=${pass} FAIL=${fail}`);
process.exit(fail > 0 ? 1 : 0);
