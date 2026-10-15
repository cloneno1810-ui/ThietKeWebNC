/* Read-only scan. Prints locations/categories only, never matched secret values. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.resolve(process.argv[3] || path.join(__dirname, '..'));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const configured = fs.existsSync(path.join(root, '.env')) ? require('dotenv').parse(fs.readFileSync(path.join(root, '.env'))) : {};
const knownValues = Object.entries(configured).filter(([key, value]) => /SECRET|KEY|DATABASE_URL/.test(key) && value.length >= 16).map(([, value]) => value);
const findings = [];
const reviewed = new Set();
function inspect(content, file, revision) {
  if (content.includes('\0') || /(?:^|\/)(?:node_modules|storage)\//.test(file)) return;
  const sample = /(?:\.example|\.sample)$/.test(file);
  content.split(/\r?\n/).forEach((line, index) => {
    const categories = [];
    if (knownValues.some((value) => line.includes(value))) categories.push('CONFIGURED_SECRET');
    if (/(?:postgres(?:ql)?|mysql):\/\/[^\s/:]+:[^\s@]+@/i.test(line) && !sample && !/password@|user:pass@|USERNAME|<.*>/.test(line)) categories.push('DATABASE_CREDENTIAL');
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(line)) categories.push('PRIVATE_KEY');
    if (/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|\bgh[pousr]_[A-Za-z0-9]{30,}|\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}/.test(line)) categories.push('ACCESS_KEY');
    if (/JWT_SECRET\s*\|\|\s*['"][^'"]+['"]/.test(line)) categories.push('HARDCODED_JWT_FALLBACK');
    if (/(?:^|\/)\.env(?:\.[^/]+)?$/.test(file) && !sample && line.trim() && !line.trim().startsWith('#')) categories.push('TRACKED_ENV_FILE');
    if (categories.length) findings.push({ revision, file, line: index + 1, categories });
  });
}
const commits = git('rev-list', '--all').trim().split(/\s+/).filter(Boolean);
let historicalBlobs = 0;
for (const commit of commits) {
  for (const entry of git('ls-tree', '-r', commit).trim().split('\n').filter(Boolean)) {
    const match = entry.match(/^\d+ blob ([a-f0-9]+)\t(.+)$/);
    if (!match || reviewed.has(match[1])) continue;
    reviewed.add(match[1]); historicalBlobs++;
    inspect(git('cat-file', 'blob', match[1]), match[2], commit);
  }
}
const bare = git('rev-parse', '--is-bare-repository').trim() === 'true';
for (const file of (bare ? '' : git('ls-files', '--cached', '--others', '--exclude-standard', '-z')).split('\0').filter(Boolean)) {
  const absolute = path.join(root, file);
  if (fs.existsSync(absolute) && fs.statSync(absolute).isFile() && fs.statSync(absolute).size <= 10 * 1024 * 1024) inspect(fs.readFileSync(absolute, 'utf8'), file, 'WORKTREE');
}
const result = { scannedAt: new Date().toISOString(), commits: commits.length, uniqueHistoricalBlobs: historicalBlobs,
  scope: bare ? 'All reachable commits from --all in the prepared bare repository.' : 'All reachable commits from --all, tracked files and non-ignored untracked files; known .env secrets compared without output.',
  clean: findings.length === 0, findings,
  limitation: 'Heuristic scan; unknown secret formats and unreachable/dangling Git objects are outside this scan. No history rewritten.' };
if (process.argv[2]) fs.writeFileSync(path.resolve(process.argv[2]), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
process.exitCode = findings.length ? 1 : 0;
