#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const ignoreDirs = new Set(['.git', 'node_modules', 'coverage', 'dist', 'build', '.next', '.venv', 'storage/uploads']);
const filesToCheck = ['.env', '.env.local', '.env.production', '.env.example'];
const suspiciousPatterns = [
  /JWT_SECRET/i,
  /SESSION_SECRET/i,
  /DATABASE_URL/i,
  /BEGIN [A-Z ]*PRIVATE KEY/i,
  /AKIA[0-9A-Z]{16}/,
  /sk_live_[A-Za-z0-9]+/i,
  /ghp_[A-Za-z0-9]{20,}/i,
  /(?:password|passwd|pwd)\s*[:=]\s*["'][^"']+/i,
  /(?:token|secret|api[_-]?key)\s*[:=]\s*["'][^"']+/i
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      if (entry.name === '.env' || entry.name === '.env.local' || entry.name === '.env.example') {
        result.push(path.join(dir, entry.name));
      }
      continue;
    }

    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue;
      result.push(...walk(path.join(dir, entry.name)));
    } else {
      const fullPath = path.join(dir, entry.name);
      if (!ignoreDirs.has(path.relative(root, fullPath).split(path.sep)[0] || '')) {
        result.push(fullPath);
      }
    }
  }
  return result;
}

function shouldScan(filePath) {
  if (filePath.includes(path.join('.git')) || filePath.includes(path.join('node_modules')) || filePath.includes(path.join('storage', 'uploads'))) {
    return false;
  }
  const ext = path.extname(filePath).toLowerCase();
  return ['.js', '.cjs', '.mjs', '.ts', '.json', '.env', '.md', '.sql'].includes(ext) || filesToCheck.includes(path.basename(filePath));
}

const files = [...filesToCheck.map((file) => path.join(root, file)).filter((file) => fs.existsSync(file)), ...walk(root).filter(shouldScan)];
const uniqueFiles = [...new Set(files)];
const findings = [];

for (const filePath of uniqueFiles) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    continue;
  }

  const matches = suspiciousPatterns
    .map((pattern) => ({ pattern, match: pattern.test(content) }))
    .filter((item) => item.match)
    .map((item) => item.pattern.toString());

  if (matches.length > 0) {
    findings.push({ file: path.relative(root, filePath), matches });
  }
}

if (findings.length > 0) {
  console.log('BẢN QUET BÍ MẬT: TÌM THẤY CÁC VÙNG CÓ KHẢ NĂNG RỦI RO');
  console.log(JSON.stringify(findings, null, 2));
  process.exit(1);
}

console.log('BẢN QUET BÍ MẬT: Không tìm thấy mẫu bí mật rõ ràng trong phạm vi kiểm tra.');
