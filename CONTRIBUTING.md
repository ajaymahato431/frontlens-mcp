# Contributing to frontlens-mcp

Thanks for your interest! This is a focused, version-aware frontend engineering
MCP server. The bar is simple: changes should make the server more accurate,
cheaper in tokens, or easier to run.

## Getting set up

```bash
git clone https://github.com/ajaymahato431/frontlens-mcp.git
cd frontlens-mcp
npm install
```

Run the server directly to check it starts:

```bash
node index.js --help
```

## Tests

```bash
npm test              # offline unit tests — must always pass
npm run test:integration   # tests stdio protocol & live tool invocation
npm run test:all
```

`npm test` is offline and gates CI. Integration tests spawn the server over stdio
and test the JSON-RPC interface.

Please add a test with any behaviour change. Bug fixes should come with a test
that fails before the fix.

## The shared `src/core/` directory

`src/core/` and `test/helpers/client.mjs` are **vendored copies** shared
byte-for-byte across sibling servers in this ecosystem:

- [django-mcp](https://github.com/ajaymahato431/django-mcp)
- [filament-mcp](https://github.com/ajaymahato431/filament-mcp)
- [livewire-mcp](https://github.com/ajaymahato431/livewire-mcp)
- [frontlens-mcp](https://github.com/ajaymahato431/frontlens-mcp)

If you change a file in `src/core/`, apply the identical change to all
repositories. Keeping them identical is deliberate: each server stays
independently installable, with no shared release to coordinate.

## Token cost is a feature

These servers exist to give an agent accurate context without wasting its
context window. Two rules follow from that:

1. **A tool description must state its real cost.** If you change what a tool
   returns, re-measure and update the description.
2. **Prefer returning less.** Tools like `read_frontend_docs` support `section`
   and `outline` to extract only what is needed.
