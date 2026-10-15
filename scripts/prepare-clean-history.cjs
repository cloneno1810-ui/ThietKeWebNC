/* Prepare a separate repository for review; never alter/push the working repository. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const source = path.resolve(__dirname, '..');
if (!process.argv[2]) throw new Error('Specify an empty destination for the prepared bare repository.');
const destination = path.resolve(process.argv[2]);
if (destination === source || destination.startsWith(source + path.sep)) throw new Error('Destination must be separate from the working repository.');
if (fs.existsSync(destination)) throw new Error('Destination already exists; no existing repository will be overwritten.');
const git = (cwd, args, options = {}) => execFileSync('git', args, { cwd, maxBuffer: 64 * 1024 * 1024, ...options });
const text = (cwd, args) => git(cwd, args, { encoding: 'utf8' }).trim();
const head = text(source, ['symbolic-ref', 'HEAD']);
const exported = git(source, ['fast-export', '--all']);
const filtered = [];
let offset = 0;
let replacements = 0;
while (offset < exported.length) {
  const start = offset;
  const end = exported.indexOf(10, offset);
  if (end < 0) { filtered.push(exported.subarray(offset)); break; }
  const line = exported.toString('ascii', offset, end);
  const data = line.match(/^data (\d+)$/);
  offset = end + 1;
  if (!data) { filtered.push(exported.subarray(start, end + 1)); continue; }
  const size = Number(data[1]);
  const payload = exported.subarray(offset, offset + size);
  offset += size;
  // Latin-1 round trip preserves original bytes, including non-ASCII/binary data.
  const changed = Buffer.from(payload.toString('latin1').replace(
    /process\.env\.JWT_SECRET\s*\|\|\s*(['"])hotel_super_secret_jwt_key_2026\1/g,
    () => { replacements++; return 'process.env.JWT_SECRET'; }
  ), 'latin1');
  filtered.push(Buffer.from(`data ${changed.length}\n`), changed);
}
fs.mkdirSync(destination, { recursive: true });
git(destination, ['init', '--bare']);
git(destination, ['fast-import', '--quiet'], { input: Buffer.concat(filtered) });
git(destination, ['symbolic-ref', 'HEAD', head]);
const parent = text(destination, ['rev-parse', head]);
const files = Array.from(new Set(git(source, ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))).sort();
const snapshot = [];
const message = 'Buoi 08: reviewed working tree snapshot for adopting sanitized history\n';
snapshot.push(Buffer.from(`commit ${head}\ncommitter Codex <codex@local.invalid> ${Math.floor(Date.now()/1000)} +0700\ndata ${Buffer.byteLength(message)}\n${message}from ${parent}\ndeleteall\n`));
let fileCount = 0;
for (const file of files) {
  if (/(?:^|\/)\.env(?:\.[^/]+)?$/.test(file) && !file.endsWith('.env.example')) throw new Error('Refusing to include an environment secrets file.');
  const absolute = path.join(source, file);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
  const data = fs.readFileSync(absolute);
  snapshot.push(Buffer.from(`M 100644 inline ${JSON.stringify(file)}\ndata ${data.length}\n`), data, Buffer.from('\n'));
  fileCount++;
}
snapshot.push(Buffer.from('\n'));
git(destination, ['fast-import', '--quiet'], { input: Buffer.concat(snapshot) });
git(destination, ['fsck', '--full'], { stdio: 'pipe' });
console.log(JSON.stringify({ destination, removedHistoricalFallbacks: replacements, snapshotFiles: fileCount,
  head: text(destination, ['rev-parse', 'HEAD']), originalRepositoryModified: false, pushed: false }));
