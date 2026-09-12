const { spawn } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');

const pythonCandidates = [
  { cmd: 'py', args: ['-3.12', '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'] },
  { cmd: 'py', args: ['-3', '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'] },
  { cmd: 'python', args: ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'] },
  { cmd: 'python3', args: ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'] }
];

function trySpawn(index) {
  if (index >= pythonCandidates.length) {
    console.error('[LandSync] Could not start FastAPI backend. Please ensure Python 3.11+ and dependencies are installed.');
    process.exit(1);
  }

  const candidate = pythonCandidates[index];
  console.log('[LandSync Backend] Starting FastAPI via:', candidate.cmd, candidate.args.slice(0, 3).join(' '));

  const isWin = process.platform === 'win32';
  const child = isWin
    ? spawn(`${candidate.cmd} ${candidate.args.join(' ')}`, { cwd: backendDir, stdio: 'inherit', shell: true })
    : spawn(candidate.cmd, candidate.args, { cwd: backendDir, stdio: 'inherit' });

  child.on('error', (err) => {
    console.warn('[LandSync Backend] Error with ' + candidate.cmd + ' (' + err.message + '), trying next candidate...');
    trySpawn(index + 1);
  });

  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}

trySpawn(0);
