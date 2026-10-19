import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';
import { loadConfig } from 'frontdex';
import { startMcpServer } from '../src/server.js';

// The sample app ships in the frontdex repo (not in its npm tarball); the devDependency links that repo.
const EXAMPLE = path.resolve(path.dirname(createRequire(import.meta.url).resolve('frontdex')), '../examples/next-app');

function tempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'frontdex-mcp-'));
  fs.cpSync(EXAMPLE, dir, { recursive: true, filter: (src) => !src.includes('.frontdex') && !src.endsWith('frontdex.yaml') });
  return dir;
}

test('MCP server answers legacy and stateless clients', async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  let buf = '';
  output.on('data', (d) => (buf += d));
  const done = startMcpServer(loadConfig(tempProject()), { input, output });
  const modern = { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28' } };
  for (const msg of [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {} } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'catalogue_impact', arguments: { name: 'ProductCard' } } },
    { jsonrpc: '2.0', id: 3, method: 'server/discover', params: modern },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'catalogue_search', arguments: { query: 'is:leaky' }, ...modern } },
    { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'catalogue_health', arguments: { severity: 'high' } } },
    { jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'catalogue_dataflow', arguments: { name: 'CartDrawer' } } },
    { jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'catalogue_state', arguments: { store: 'redux:cart' } } },
    { jsonrpc: '2.0', id: 8, method: 'tools/list' },
  ]) input.write(JSON.stringify(msg) + '\n');
  input.end();
  await done;
  const replies = buf.trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(replies[0].result.protocolVersion, '2025-11-25');
  assert.equal(replies[0].result.serverInfo.name, 'frontdex-mcp');
  assert.match(replies[1].result.content[0].text, /dependent component/);
  assert.ok(replies[2].result.supportedVersions.includes('2026-07-28'));
  assert.equal(replies[3].result.resultType, 'complete');
  assert.match(replies[3].result.content[0].text, /HeroBanner[\s\S]*LiveVisitors/);
  assert.match(replies[4].result.content[0].text, /render-loop · AdminSidebar/);
  assert.match(replies[5].result.content[0].text, /reads redux:ui `ui.drawerOpen`/);
  assert.match(replies[6].result.content[0].text, /written by: .*CartBadge/);
  assert.equal(replies[7].result.tools.length, 17);
});
