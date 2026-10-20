import { spawn } from 'node:child_process';
import process from 'node:process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [
  spawn(npm, ['run', 'server'], { stdio: 'inherit', env: process.env, shell: process.platform === 'win32' }),
  spawn(npm, ['run', 'dev:vite'], { stdio: 'inherit', env: process.env, shell: process.platform === 'win32' }),
];
let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  setTimeout(() => process.exit(code), 200);
}
for (const child of children) {
  child.on('error', (error) => { console.error('Could not start development process:', error.message); shutdown(1); });
  child.on('exit', (code) => { if (!shuttingDown && code && code !== 0) shutdown(code); });
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
