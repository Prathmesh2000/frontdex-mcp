# Changelog

All notable changes to frontdex-mcp. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Short hashes point at the commit that made the change.

## 0.3.0 (unreleased)

Requires frontdex 0.4.0 or later.

### Changed

- **License: Apache-2.0** (was MIT), with a `NOTICE` file that redistributions keep. Versions up to 0.2.x stay MIT.
- The server instructions tell agents to run the covering tests and keep component docs current.

### Added

Four tools, for 23 in total:

| Tool | Returns |
|---|---|
| `catalogue_tests` | Unit and E2E tests covering a component, page or file, with the command to run them |
| `catalogue_enrich_next` | Components whose docs are missing or stale, with the facts needed to write them |
| `catalogue_enrich_write` | Saves agent-written docs for a component into the knowledge base |
| `catalogue_docs` | A component's saved docs, or docs coverage |

- CI on every PR and a manual Release workflow (npm Trusted Publishing with provenance); `CONTRIBUTING.md`, `AGENTS.md`, `SECURITY.md`, Code of Conduct, issue and PR templates.

## 0.2.0 (2026-10-20)

Requires frontdex 0.3.0 or later.

### Changed

- Follows the core rename from react-catalogue to frontdex (`df139b2`). The peer dependency is now `frontdex >=0.3.0` (was `react-catalogue >=0.2.0`), and imports come from `frontdex` and `frontdex/query`. Install both as devDependencies: `npm i -D frontdex frontdex-mcp`.
- The server instructions tell agents to check for an existing component before creating a new one (`0949d8b`).

### Added

Seven tools, for 19 in total:

| Tool | Returns | Commit |
|---|---|---|
| `catalogue_find_existing` | Components with a similar name or props to one you are about to create | `0949d8b` |
| `catalogue_duplicates` | Components that already look like duplicates of each other | `0949d8b` |
| `catalogue_tokens` | Design tokens and hard-coded values that should use them | `0949d8b` |
| `catalogue_owners` | CODEOWNERS, test and story files, and live git activity for a component | `81720ae` |
| `catalogue_adoption` | Usage of a component across knowledge-base snapshots | `81720ae` |
| `catalogue_diff` | The current change against a git ref: components and pages changed, pages reached, new issues | `295e3d3` |
| `catalogue_hooks` | Custom hooks, what they read and call, and which components use them | `d264fc1` |

## 0.1.0 (never published, superseded by 0.2.0)

The MCP server split out of react-catalogue 0.2 into this repo (`7ac8f2e`). It peered on `react-catalogue >=0.2.0` and was never released under that pairing.

- Stdio server speaking the stateless 2026-07-28 MCP revision and the older initialize-handshake revisions (2025-11-25, 2025-06-18, 2025-03-26, 2024-11-05).
- No analysis code of its own: every answer comes from the core package's public `createTools` API, through the copy installed in your project.
- `frontdex-mcp -C <dir>` points it at another project root.
- 12 tools: `catalogue_overview`, `catalogue_search`, `catalogue_component`, `catalogue_dataflow`, `catalogue_impact`, `catalogue_page`, `catalogue_state`, `catalogue_api`, `catalogue_styles`, `catalogue_health`, `catalogue_rescan`, `catalogue_history`.
- The protocol test moved here from the core repo.
