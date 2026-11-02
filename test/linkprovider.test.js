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

// ── Existing test cases (inline links + autolinks) ──
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
    ok(s.start === text.indexOf(full), `start=${text.indexOf(full)}`);
  }
}

// 4) plain link without anchor must NOT be included
ok(!byHref('docs/guide.md'), 'plain link should be excluded');
ok(spans.length === 3, `expected 3 spans, got ${spans.length}`);

// ── New test cases: bare anchors in plain text ──
const text2 = [
  'intro',
  'see src/commands.ts#L12-L15 for details',
  'check a.md#L42 above',
  'same-file #L7-L9 here',
  'single-line b/c.ts#L10 end',
  'no anchor here: docs/guide.md',
  'inline code `src/commands.ts#L99-L100` should also match',
  '',
  '```',
  'fenced src/commands.ts#L88 should also match',
  '```',
  'after fence src/commands.ts#L77 should match',
].join('\n');

const spans2 = findAnchorSpans(text2);
const byHref2 = (href) => spans2.find((s) => s.href === href);

// 5) bare anchor with range
{
  const s = byHref2('src/commands.ts#L12-L15');
  ok(!!s, 'bare range anchor present');
  if (s) {
    ok(text2.slice(s.start, s.end) === 'src/commands.ts#L12-L15',
       `bare range slice='${text2.slice(s.start, s.end)}'`);
  }
}

// 6) bare single-line anchor
{
  const s = byHref2('a.md#L42');
  ok(!!s, 'bare single-line anchor present');
  if (s) {
    ok(text2.slice(s.start, s.end) === 'a.md#L42',
       `bare single slice='${text2.slice(s.start, s.end)}'`);
  }
}

// 7) bare same-file anchor (#L7-L9)
{
  const s = byHref2('#L7-L9');
  ok(!!s, 'bare same-file anchor present');
  if (s) {
    ok(text2.slice(s.start, s.end) === '#L7-L9',
       `bare same-file slice='${text2.slice(s.start, s.end)}'`);
  }
}

// 8) bare anchor with subdirectory
{
  const s = byHref2('b/c.ts#L10');
  ok(!!s, 'bare subdir anchor present');
  if (s) {
    ok(text2.slice(s.start, s.end) === 'b/c.ts#L10',
       `bare subdir slice='${text2.slice(s.start, s.end)}'`);
  }
}

// 9) plain path without #L must NOT match
ok(!byHref2('docs/guide.md'), 'bare path without anchor should not match');

// 10) inline code anchor SHOULD match (no code exclusion)
{
  const s = byHref2('src/commands.ts#L99-L100');
  ok(!!s, 'inline code anchor should be detected (no exclusion)');
}

// 11) fenced code block anchor SHOULD match (no code exclusion)
{
  const s = byHref2('src/commands.ts#L88');
  ok(!!s, 'fenced code block anchor should be detected (no exclusion)');
}

// 12) anchor after fenced block SHOULD match
{
  const s = byHref2('src/commands.ts#L77');
  ok(!!s, 'anchor after fence should match');
}

// Count expected: 8 bare anchors
//   #L12-L15, #L42, #L7-L9, #L10, #L99-L100, #L88, #L77
//   (excluding plain path docs/guide.md)
ok(spans2.length === 7, `expected 7 bare spans, got ${spans2.length}: ${spans2.map(s=>s.href).join(', ')}`);

console.log(`linkprovider.test: PASS=${pass} FAIL=${fail}`);
process.exit(fail > 0 ? 1 : 0);
