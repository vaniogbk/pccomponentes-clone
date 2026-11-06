import { spawn } from 'node:child_process';

const npmCli = process.env.npm_execpath;
const workspaces = ['@pcc/api', '@pcc/web'];
const children = new Set();
let shuttingDown = false;

function stopChildren(signal = 'SIGTERM') {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    child.kill(signal);
  }
}

for (const workspace of workspaces) {
  const command = npmCli ? process.execPath : 'npm';
  const args = npmCli
    ? [npmCli, 'run', 'dev', `--workspace=${workspace}`]
    : ['run', 'dev', `--workspace=${workspace}`];
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: !npmCli && process.platform === 'win32',
  });

  children.add(child);

  child.on('error', (error) => {
    console.error(`Impossible de démarrer ${workspace} : ${error.message}`);
    process.exitCode = 1;
    stopChildren();
  });

  child.on('exit', (code) => {
    children.delete(child);

    if (!shuttingDown && code !== 0) {
      process.exitCode = code ?? 1;
      stopChildren();
    }

    if (children.size === 0) {
      process.exit(process.exitCode ?? 0);
    }
  });
}

process.on('SIGINT', () => stopChildren('SIGINT'));
process.on('SIGTERM', () => stopChildren('SIGTERM'));
