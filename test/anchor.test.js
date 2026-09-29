/**
 * Minimal test runner for the GitHub-style anchor parser.
 * Run: npm test  (requires `npm run compile` first).
 */
const { parseAnchor, buildAnchorFragment } = require('../out/anchor.js');

const cases = [
  ['docs/guide.md#L12-L15', { rawPath: 'docs/guide.md', startLine: 12, endLine: 15 }],
  ['docs/guide.md#L12-15', { rawPath: 'docs/guide.md', startLine: 12, endLine: 15 }], // end without L
  ['a.md#L3-10', { rawPath: 'a.md', startLine: 3, endLine: 10 }],
  ['guide.md#L42', { rawPath: 'guide.md', startLine: 42, endLine: 42 }],
  ['a/b.md#L1-L1', { rawPath: 'a/b.md', startLine: 1, endLine: 1 }],
  ['#L7-9', { rawPath: '', startLine: 7, endLine: 9 }], // same-file
  ['src/x.ts#L3,10', { rawPath: 'src/x.ts', startLine: 3, endLine: 10 }], // comma form
  ['#L5-L2', { rawPath: '', startLine: 5, endLine: 5 }], // reversed -> start only
  ['docs/guide.md#sec', null], // not an anchor
  ['docs/guide.md', null],
  ['#L0', null], // line 0 invalid
];

let pass = 0;
let fail = 0;
for (const [href, expected] of cases) {
  const got = parseAnchor(href);
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (ok) {
    pass++;
  } else {
    fail++;
    console.log('FAIL', href, '=>', JSON.stringify(got), 'expected', JSON.stringify(expected));
  }
}

// buildAnchorFragment checks
const f1 = buildAnchorFragment(12, 15);
const f2 = buildAnchorFragment(12, 12);
if (f1 === '#L12-L15') pass++;
else { fail++; console.log('FAIL build 12-15:', f1); }
if (f2 === '#L12') pass++;
else { fail++; console.log('FAIL build 12:', f2); }

console.log(`anchor.test: PASS=${pass} FAIL=${fail}`);
process.exit(fail > 0 ? 1 : 0);
