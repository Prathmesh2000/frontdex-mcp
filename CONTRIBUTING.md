# Contributing to frontdex-mcp

This repo holds the MCP layer only: tool names, descriptions and input schemas (`TOOLS` in `src/server.js`) and the JSON-RPC transport. Every answer comes from `createTools()` in [frontdex](https://github.com/Prathmesh2000/frontdex), so most feature work starts there; see its [CONTRIBUTING.md](https://github.com/Prathmesh2000/frontdex/blob/main/CONTRIBUTING.md) and [architecture notes](https://github.com/Prathmesh2000/frontdex/blob/main/docs/ARCHITECTURE.md#an-mcp-tool).

## Setup

Node 20 or later.

```bash
git clone https://github.com/Prathmesh2000/frontdex-mcp.git
cd frontdex-mcp
npm ci
npm test
```

The tests run against the published `frontdex` devDependency and its `examples/next-app`. To test against a local frontdex checkout, run `npm install --no-save ../frontdex` (and `npm ci` afterwards to go back).

## Adding or changing a tool

1. The tool function lives in frontdex `src/tools.js`; land it there first.
2. Add its entry to `TOOLS` in `src/server.js`: `name`, a description that tells an agent when to call it, and an `inputSchema`.
3. Update the tool count and add a call in `test/server.test.js`, the table in `README.md`, and `INSTRUCTIONS` if agents should use it by default.
4. Raise the `frontdex` peer and dev dependency to the first version that has the tool.

## Pull requests

Keep a PR to one change, with tests. Add a line to `CHANGELOG.md` under `## Unreleased`. Maintainers release with **Actions → Release → Run workflow**.

## License

Apache-2.0. By opening a pull request you agree that your contribution is licensed under the same terms (section 5 of the [license](LICENSE)). Everyone follows the [Code of Conduct](CODE_OF_CONDUCT.md); security issues go through [SECURITY.md](SECURITY.md).
