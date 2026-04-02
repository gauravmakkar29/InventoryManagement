# IMS Gen 2 — Release Process

> Application versioning and release workflow for the IMS Gen 2 platform.

## Version Format

The application follows [Semantic Versioning](https://semver.org/) (SemVer):

```
MAJOR.MINOR.PATCH+SHA
```

- **MAJOR** — Breaking changes (API incompatibility, schema migration required)
- **MINOR** — New features, backward-compatible
- **PATCH** — Bug fixes, backward-compatible
- **SHA** — Git short SHA appended at build time (e.g., `1.2.0+abc1234`)

The canonical version is stored in `package.json` and injected at build time via Vite.

## Creating a Release

### 1. Bump the version

Use `npm version` to update `package.json` and create a git tag:

```bash
# Patch release (bug fixes)
npm version patch

# Minor release (new features)
npm version minor

# Major release (breaking changes)
npm version major
```

This automatically:
- Updates `version` in `package.json`
- Creates a git commit: `v1.2.1`
- Creates a git tag: `v1.2.1`

### 2. Push with tags

```bash
git push origin main --follow-tags
```

### 3. Create a GitHub Release

```bash
gh release create v1.2.1 \
  --title "v1.2.1 — Short description" \
  --generate-notes
```

Or create manually via GitHub UI at **Releases > Draft a new release**.

### 4. Deploy

CI/CD triggers on the new tag:
- Runs full test suite (unit + E2E)
- Builds production bundle with version injection
- Deploys to target environment (staging first, then production)

## Build-Time Version Injection

The Vite build injects three globals (see `vite.config.ts`):

| Global             | Example                      | Description                  |
| ------------------ | ---------------------------- | ---------------------------- |
| `__APP_VERSION__`  | `"1.2.0"`                    | SemVer from package.json     |
| `__APP_BUILD_SHA__`| `"abc1234"`                  | Git short SHA at build time  |
| `__APP_BUILD_TIME__`| `"2026-04-02T10:30:00.000Z"`| ISO timestamp of the build   |

Additionally, `VITE_APP_VERSION` is set as an environment variable (`1.2.0+abc1234`).

## API Compatibility

Every API request includes the `X-App-Version` header (e.g., `1.2.0+abc1234`). This enables:

- **Server-side logging** — correlate requests to client versions
- **Stale client detection** — server responds with `X-Deployed-Version` header; the client compares and prompts refresh if stale
- **Compatibility checks** — major version must match, minor must be >= for API compatibility

## Stale Client Detection

When the server includes an `X-Deployed-Version` response header:

1. The client compares it against the running version
2. If they differ, a non-blocking toast appears: "A new version is available. Refresh to update."
3. The notification only appears once per session (sessionStorage flag)

## Data Schema Versioning

Schema versions for DynamoDB tables are tracked in `infra/migrations/`. When a release includes schema changes:

1. Add a numbered migration file (e.g., `002-add-telemetry-index.json`)
2. Document the schema version in the migration
3. Ensure backward compatibility during the rollout window
4. Run migration before deploying the new application version

## Pre-Release Checklist

- [ ] All tests pass (`npm test` + `npm run test:e2e:smoke`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] Lint passes (`npm run lint`)
- [ ] CHANGELOG updated (if maintained)
- [ ] Version bumped via `npm version`
- [ ] Git tag created and pushed
- [ ] GitHub Release created with release notes
