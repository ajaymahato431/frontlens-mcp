# Releasing frontlens-mcp

Maintainer notes. Nothing here is needed to *use* the server — see
[README.md](README.md) for that.

This file is not shipped to npm; the `files` field in `package.json` excludes it.

> **Never put a token in this repository.** Tokens belong in your user-level
> `~/.npmrc` (Windows: `C:\Users\<you>\.npmrc`) or in GitHub repository secrets.

---

## Releasing from your machine

### 1. Pre-flight

```bash
npm test                  # offline unit tests — must pass
npm run test:integration  # stdio protocol test
npm pack --dry-run        # confirm only intended files ship
node index.js --version
```

### 2. Bump the version

Edit `package.json` and `src/settings.js` to bump the version number.

### 3. Update the changelog

Update `CHANGELOG.md` with the new release notes.

### 4. Publish to npm

```bash
npm publish --access public
```

### 5. Tag and push

```bash
git add -A
git commit -m "v1.0.0"
git tag v1.0.0
git push origin main --tags
```
