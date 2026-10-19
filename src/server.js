import fs from 'node:fs';
import readline from 'node:readline';
import { createTools } from 'frontdex';
import query from 'frontdex/query';

const { QUERY_HELP } = query;
const PKG = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const MODERN = '2026-07-28';
const LEGACY = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const META_VERSION = 'io.modelcontextprotocol/protocolVersion';

const INSTRUCTIONS = `Knowledge base of this project's React/Next.js components and pages.
Use catalogue_find_existing (and catalogue_search) before creating a component (reuse beats duplication), catalogue_tokens instead of hard-coded colors/sizes, catalogue_component / catalogue_dataflow before editing one,
catalogue_impact before changing props/exports, catalogue_health to avoid introducing leaks or dead code, catalogue_state / catalogue_api / catalogue_styles
to reuse existing stores, endpoints and CSS, and catalogue_rescan after editing components or routes.`;

const str = (description) => ({ type: 'string', description });
const TOOLS = [
  {
    name: 'catalogue_search',
    description: `Search components by name/text and filters. Filters: ${QUERY_HELP.map(([t]) => t).join(', ')}. Returns name, file, kind and usage counts.`,
    inputSchema: { type: 'object', properties: { query: str('e.g. "button", "uses:Modal", "hook:useQuery is:shared"'), limit: { type: 'number', description: 'max results (default 25)' } }, required: ['query'] },
  },
  {
    name: 'catalogue_component',
    description: 'Full card for one component: file, props with types/defaults, state, context, hooks, effects (mount/update/unmount), what it renders, who renders it, pages, impact.',
    inputSchema: { type: 'object', properties: { name: str('component name or id (Name@path when names collide)') }, required: ['name'] },
  },
  {
    name: 'catalogue_impact',
    description: 'Blast radius of changing a component: every component that renders it directly or transitively, and every page it appears on, with file paths to update.',
    inputSchema: { type: 'object', properties: { name: str('component name or id') }, required: ['name'] },
  },
  {
    name: 'catalogue_page',
    description: 'A route: file, root component, layouts, params and the full component tree. Omit route to list all pages.',
    inputSchema: { type: 'object', properties: { route: str('e.g. "/", "/products/[id]", "/users/:id"') } },
  },
  {
    name: 'catalogue_overview',
    description: 'Project summary: counts, routers, folders, most shared components. Start here in an unfamiliar codebase.',
    inputSchema: { type: 'object', additionalProperties: false },
  },
  {
    name: 'catalogue_dataflow',
    description: 'How data moves through one component: props received from each parent (with values), store/context reads, local state, effects, API calls, store writes, and props passed to each child.',
    inputSchema: { type: 'object', properties: { name: str('component name or id') }, required: ['name'] },
  },
  {
    name: 'catalogue_health',
    description: 'Diagnostics: memory leaks (uncleared intervals/listeners/subscriptions), render loops, unsafe async state updates, stale effect deps, unused variables/props/state/functions/imports, unused components/files/exports, deprecated usage. Each with file:line and a fix.',
    inputSchema: { type: 'object', properties: { severity: str('high | medium | low | info (default: all)'), type: str('e.g. memory-leak, unused-variable') } },
  },
  {
    name: 'catalogue_state',
    description: 'Global state map: Redux slices, React contexts and zustand stores with their state keys, actions, providers, and which components read or write them. Pass a store to focus (e.g. "redux:cart", "AuthContext").',
    inputSchema: { type: 'object', properties: { store: str('optional store id or name') } },
  },
  {
    name: 'catalogue_api',
    description: 'Every API call in the frontend grouped by endpoint (method, client: fetch/axios/useSWR/service, component, where it runs). Optionally filter by endpoint text.',
    inputSchema: { type: 'object', properties: { endpoint: str('optional filter, e.g. "/orders"') } },
  },
  {
    name: 'catalogue_styles',
    description: 'CSS usage: for a class name, where it is defined (file:line) and which components use it; for a component, its classes, CSS modules and stylesheets.',
    inputSchema: { type: 'object', properties: { className: str('CSS class to look up'), name: str('component name') } },
  },
  {
    name: 'catalogue_find_existing',
    description: 'Run BEFORE creating a component: existing components similar to the one you plan (same base name, shared name words, shared props), with file, props and usage count. Reuse or extend a match instead of duplicating it.',
    inputSchema: { type: 'object', properties: { name: str('planned component name, e.g. "PrimaryButton"'), props: { type: 'array', items: { type: 'string' }, description: 'planned prop names' } }, required: ['name'] },
  },
  {
    name: 'catalogue_duplicates',
    description: 'Components that already look like duplicates of each other (scored on names, props, children and classes). Pass a component to see only its pairs.',
    inputSchema: { type: 'object', properties: { name: str('optional component name or id') } },
  },
  {
    name: 'catalogue_tokens',
    description: 'Design tokens (CSS custom properties, Tailwind theme) and hard-coded values that match them, with where each is used and defined. Use tokens instead of literal colors and sizes.',
    inputSchema: { type: 'object', properties: { query: str('optional filter: token name, value or file') } },
  },
  {
    name: 'catalogue_rescan',
    description: 'Incrementally rescan the source after you edit components or routes, and report what changed.',
    inputSchema: { type: 'object', additionalProperties: false },
  },
  {
    name: 'catalogue_history',
    description: 'Recent knowledge-base commits (git-like), optionally only those touching one component.',
    inputSchema: { type: 'object', properties: { name: str('optional component name or id'), limit: { type: 'number', description: 'default 10' } } },
  },
];

/** Stdio MCP server speaking both the stateless 2026-07-28 revision and the initialize-handshake revisions. */
export function startMcpServer(config, { input = process.stdin, output = process.stdout } = {}) {
  const { tools } = createTools(config);
  const send = (msg) => output.write(JSON.stringify(msg) + '\n');
  const serverInfo = { name: PKG.name, version: PKG.version };

  const handle = (msg) => {
    const { id, method, params = {} } = msg;
    const isRequest = id !== undefined && id !== null;
    const modern = params._meta?.[META_VERSION];
    const reply = (result) => isRequest && send({ jsonrpc: '2.0', id, result: modern ? { resultType: 'complete', ...result } : result });
    const fail = (code, message, data) => isRequest && send({ jsonrpc: '2.0', id, error: { code, message, ...(data && { data }) } });

    if (modern && modern !== MODERN && !LEGACY.includes(modern)) return fail(-32022, 'Unsupported protocol version', { supported: [MODERN, ...LEGACY], requested: modern });
    switch (method) {
      case 'initialize':
        return reply({ protocolVersion: LEGACY.includes(params.protocolVersion) ? params.protocolVersion : LEGACY[0], capabilities: { tools: { listChanged: false } }, serverInfo, instructions: INSTRUCTIONS });
      case 'server/discover':
        return reply({ supportedVersions: [MODERN, ...LEGACY], capabilities: { tools: {} }, _meta: { 'io.modelcontextprotocol/serverInfo': serverInfo }, instructions: INSTRUCTIONS });
      case 'ping':
        return reply({});
      case 'tools/list':
        return reply({ tools: TOOLS });
      case 'tools/call': {
        const tool = tools[params.name];
        if (!tool) return fail(-32602, `Unknown tool: ${params.name}`);
        try {
          return reply({ content: [{ type: 'text', text: tool(params.arguments ?? {}) }], isError: false });
        } catch (err) {
          return reply({ content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true });
        }
      }
      default:
        if (method?.startsWith('notifications/')) return;
        return fail(-32601, `Method not found: ${method}`);
    }
  };

  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    }
    (Array.isArray(msg) ? msg : [msg]).forEach(handle);
  });
  return new Promise((resolve) => rl.on('close', resolve));
}
