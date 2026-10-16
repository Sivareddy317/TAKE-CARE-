import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const RAW_DIR = path.join(process.cwd(), 'eval', 'raw');
if (!fs.existsSync(RAW_DIR)) {
  fs.mkdirSync(RAW_DIR, { recursive: true });
}

function runAndSave(cmd: string, filename: string): string {
  console.log(`Running: ${cmd}`);
  let output = '';
  try {
    output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err: any) {
    output = (err.stdout || '') + '\n' + (err.stderr || '') + '\n' + (err.message || '');
  }
  const filePath = path.join(RAW_DIR, filename);
  fs.writeFileSync(filePath, `COMMAND: ${cmd}\n\nRAW OUTPUT:\n${output}\n`, 'utf-8');
  console.log(`Saved output to ${filename} (${output.length} bytes)`);
  return output;
}

// 1. Build
runAndSave('node ./node_modules/vite/bin/vite.js build', 'task1_build.txt');

// 2. Test Pipeline
runAndSave('node ./node_modules/tsx/dist/cli.mjs test-pipeline.ts', 'task1_test_pipeline.txt');

// 3. Git Commits & Contributors
runAndSave('git shortlog -sn', 'task1_git_shortlog.txt');
runAndSave('git rev-list --count HEAD', 'task1_git_commits.txt');

// 4. Lines of code (src/ and server.ts)
function countLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function walkDir(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git') {
        walkDir(full, fileList);
      }
    } else {
      if (/\.(ts|tsx|js|jsx|css|html)$/.test(f)) {
        fileList.push(full);
      }
    }
  }
  return fileList;
}

const srcFiles = walkDir(path.join(process.cwd(), 'src'));
const locReport: { file: string; lines: number }[] = [];
let totalSrcLines = 0;

for (const file of srcFiles) {
  const lines = countLines(file);
  totalSrcLines += lines;
  locReport.push({ file: path.relative(process.cwd(), file).replace(/\\/g, '/'), lines });
}

const serverLines = countLines(path.join(process.cwd(), 'server.ts'));
locReport.push({ file: 'server.ts', lines: serverLines });

locReport.sort((a, b) => b.lines - a.lines);

const locOutput = `=== LINES OF CODE AUDIT ===\n` +
  `Total src/ lines: ${totalSrcLines}\n` +
  `server.ts lines: ${serverLines}\n` +
  `Combined Total: ${totalSrcLines + serverLines}\n\n` +
  `Files Breakdown:\n` +
  locReport.map(r => `  ${r.lines.toString().padStart(6, ' ')} : ${r.file}`).join('\n');

fs.writeFileSync(path.join(RAW_DIR, 'task1_loc.txt'), locOutput, 'utf-8');
console.log(`Saved LOC breakdown (Total: ${totalSrcLines + serverLines})`);

// 5. Dependencies
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const depOutput = `=== DEPENDENCIES AUDIT ===\n` +
  `Dependencies (${Object.keys(pkg.dependencies || {}).length}):\n` +
  Object.entries(pkg.dependencies || {}).map(([k, v]) => `  - ${k}: ${v}`).join('\n') +
  `\n\nDevDependencies (${Object.keys(pkg.devDependencies || {}).length}):\n` +
  Object.entries(pkg.devDependencies || {}).map(([k, v]) => `  - ${k}: ${v}`).join('\n');

fs.writeFileSync(path.join(RAW_DIR, 'task1_dependencies.txt'), depOutput, 'utf-8');
console.log('Saved dependencies audit');

console.log('Inventory collection complete!');
