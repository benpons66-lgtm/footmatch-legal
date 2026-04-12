const { spawn } = require('child_process');
const path = require('path');

process.chdir(path.join(__dirname));
const p = spawn('npx', ['expo', 'start', '--web', '--port', '8082'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
});
p.on('exit', (code) => process.exit(code));
