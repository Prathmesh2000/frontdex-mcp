import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';
import { loadConfig } from 'frontdex';
import { startMcpServer } from '../src/server.js';

// A copy of frontdex's examples/next-app sources: the frontdex npm package does not ship its examples, and the tests
// run against the published frontdex.
const EXAMPLE = path.resolve(import.meta.dirname, 'fixtures/next-app');

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
  assert.equal(replies[7].result.tools.length, 23);
});

test('an agent documents a component through MCP and reads the docs back', async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  let buf = '';
  output.on('data', (d) => (buf += d));
  const done = startMcpServer(loadConfig(tempProject()), { input, output });
  const doc = { purpose: 'Primary action button.', props: { variant: { description: 'Visual style.', howToPass: "'primary' (default) or 'ghost'" } }, usage: [{ title: 'Save', code: '<Button>Save</Button>' }] };
  for (const msg of [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {} } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'catalogue_enrich_next', arguments: { limit: 1 } } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'catalogue_enrich_write', arguments: { name: 'Button', doc, by: 'test-agent' } } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'catalogue_docs', arguments: { name: 'Button' } } },
    { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'catalogue_tests', arguments: { name: 'Button' } } },
  ]) input.write(JSON.stringify(msg) + '\n');
  input.end();
  await done;
  const text = (id) => buf.trim().split('\n').map((l) => JSON.parse(l)).find((r) => r.id === id).result.content[0].text;
  assert.match(text(2), /## Button/);
  assert.match(text(3), /Saved docs for Button/);
  assert.match(text(4), /Primary action button\.[\s\S]*How to pass: 'primary'/);
  assert.match(text(5), /Button\.test\.tsx/);
});
