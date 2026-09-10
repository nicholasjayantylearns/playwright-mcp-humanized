// Verification harness for the ported humanized wrapper.
// 1. Spawns the MCP server over stdio, does initialize + tools/list.
// 2. Confirms the humanizer patch wraps browserType.connectOverCDP/launch.
// 3. Confirms extension-mode would advertise protocolVersion=2.
const { spawn } = require('child_process');
const path = require('path');

function rpc(proc, msg) {
  proc.stdin.write(JSON.stringify(msg) + '\n');
}

async function mcpHandshake() {
  const proc = spawn(process.execPath, [path.join(__dirname, 'cli-humanized.js'), '--headless'], { stdio: ['pipe', 'pipe', 'pipe'] });
  let buf = '';
  const results = {};
  proc.stdout.on('data', d => {
    buf += d.toString();
    let idx;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx); buf = buf.slice(idx + 1);
      if (!line.trim()) continue;
      try { const m = JSON.parse(line); if (m.id !== undefined) results[m.id] = m; } catch {}
    }
  });
  rpc(proc, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'verify', version: '0' } } });
  await new Promise(r => setTimeout(r, 2500));
  rpc(proc, { jsonrpc: '2.0', method: 'notifications/initialized' });
  rpc(proc, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  await new Promise(r => setTimeout(r, 2500));
  proc.kill();
  return results;
}

(async () => {
  const r = await mcpHandshake();
  const server = r[1]?.result?.serverInfo;
  const tools = r[2]?.result?.tools?.map(t => t.name) || [];
  console.log('serverInfo:', JSON.stringify(server));
  console.log('tools:', tools.length, tools.slice(0, 8).join(', '), '...');
  console.log('has browser_find (0.0.80-era tool):', tools.includes('browser_find'));

  // Humanizer hooks
  const pc = require('playwright-core');
  const before = pc.chromium.connectOverCDP;
  require('./patch').patchPlaywright();
  const after = pc.chromium.connectOverCDP;
  console.log('patch wrapped connectOverCDP:', before !== after);
  console.log('patch wrapped launch:', pc.chromium.launch.toString().includes('originalLaunch'));

  // Extension protocol version (what the connect URL will carry)
  const src = require('fs').readFileSync(require.resolve('playwright-core/lib/coreBundle'), 'utf8');
  const m = src.match(/VERSION = (\d+);/);
  console.log('extension protocol VERSION in bundled playwright-core:', m && m[1]);
  process.exit(0);
})();
