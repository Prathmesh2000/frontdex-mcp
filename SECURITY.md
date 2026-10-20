# Security policy

## Reporting a vulnerability

Do not open a public issue. Report it privately, either way:

- GitHub: **Security → Report a vulnerability** on this repository (private advisory), or
- email **prathmeshagrawal2000@gmail.com** with "frontdex-mcp security" in the subject.

Include the version, how to reproduce it, and the impact you see. You will get a reply within 7 days. Once a fix is released, the advisory is published with credit to you unless you ask otherwise.

## Supported versions

Only the latest minor release gets security fixes.

## Scope

frontdex-mcp runs as a local stdio process started by your coding agent and answers from the frontdex core installed in your project. Things that matter most:

- tool arguments come from the agent (or from text it was fed). Tools may write only the knowledge base (`frontdex.yaml`, `.frontdex/`, including docs from `catalogue_enrich_write`) and temporary git worktrees for `catalogue_diff`; anything else is a bug;
- the server opens no network ports and makes no network calls.

Vulnerabilities in the scanner, the UI server or `frontdex agents` belong to [frontdex](https://github.com/Prathmesh2000/frontdex/security).
