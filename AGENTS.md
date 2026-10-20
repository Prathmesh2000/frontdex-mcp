# AGENTS.md: working on the frontdex-mcp repo

frontdex-mcp is a stdio MCP server. It has no analysis code: `src/server.js` lists the tools (`TOOLS`: name, description, `inputSchema`) and forwards `tools/call` to `createTools(config).tools[name]` from the `frontdex` package (a peer dependency). `bin/frontdex-mcp.js` parses `-C <dir>` and starts it.

## Commands

```bash
npm ci
npm test          # node:test against the frontdex devDependency's examples/next-app; must pass
```

## Rules

- Tool behaviour lives in frontdex `src/tools.js` (https://github.com/Prathmesh2000/frontdex). Do not reimplement analysis here.
- A new tool needs: the function in frontdex, an entry in `TOOLS`, the tool count and a call in `test/server.test.js`, a row in the README table, and a raised `frontdex` peer/dev dependency.
- Descriptions are read by agents: say when to call the tool, not how it works.
- Keep both protocol paths working: the stateless 2026-07-28 revision (`_meta` protocol version) and the initialize handshake (`LEGACY`).
- No new dependencies.
- Do not edit `LICENSE` or `NOTICE`.

## Done means

- [ ] `npm test` passes
- [ ] README tool table and `CHANGELOG.md` (`## Unreleased`) updated for user-visible changes
