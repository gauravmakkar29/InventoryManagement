# Git Workflow & Release Rulebook

> Enforced by branch protection rules, CI checks, and code review.

---

## 1. Story-to-Code Traceability

Every line of code traces back to a GitHub Issue. No exceptions.

```
Epic (label) → Story (issue) → Branch → Commit → PR → Merge
```

| Artifact        | Naming Convention                   | Example                                                                |
| --------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| **Epic label**  | `epic:N`                            | `epic:20`                                                              |
| **Story issue** | `[Story N.M] Title`                 | `[Story 20.1] Artifact Provider Interface + Mock Adapter`              |
| **Branch**      | `feature/IMS-{issue#}-short-desc`   | `feature/IMS-383-artifact-provider`                                    |
| **Commit**      | `feat(scope): description #{issue}` | `feat(providers): add IArtifactProvider interface + mock adapter #383` |
| **PR title**    | `[Story N.M] Description`           | `[Story 20.1] Artifact Provider Interface + Mock Adapter`              |
| **PR body**     | Must include `Closes #{issue}`      | `Closes #383`                                                          |

## 2. Branch Strategy

### Branch Types

| Branch              | Created From | Merges Into               | Purpose                  |
| ------------------- | ------------ | ------------------------- | ------------------------ |
| `feature/IMS-{#}-*` | `main`       | `main` (via PR)           | New story implementation |
| `fix/IMS-{#}-*`     | `main`       | `main` (via PR)           | Bug fix                  |
| `release/*`         | `main`       | `qa` → `preprod` → `prod` | Release promotion        |
| `hotfix/*`          | `main`       | `preprod` → `main`        | Production emergency     |

### Rules

- **One branch per story** — never combine multiple stories in one branch
- **Short-lived branches** — merge within 48 hours, delete after merge
- **Always branch from latest `main`** — rebase before PR if behind
- **Never push directly to `main`** — always PR with CI passing

## 3. Commit Standards

### Format (commitlint enforced)

```
type(scope): description #issue

[optional body]

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

### Types

| Type       | When                                    |
| ---------- | --------------------------------------- |
| `feat`     | New feature / story implementation      |
| `fix`      | Bug fix                                 |
| `refactor` | Code restructuring (no behavior change) |
| `test`     | Adding/updating tests only              |
| `docs`     | Documentation only                      |
| `chore`    | Build, CI, tooling changes              |

### Scope Examples

| Scope        | Covers                                  |
| ------------ | --------------------------------------- |
| `providers`  | Provider interfaces, adapters, registry |
| `auth`       | Authentication, authorization, RBAC     |
| `firmware`   | Firmware lifecycle, deployment          |
| `compliance` | Compliance, vulnerability, scanning     |
| `ui`         | Component changes, layouts              |
| `infra`      | Terraform, CDK, CI/CD                   |

## 4. Pull Request Process

### PR Creation Checklist

- [ ] Branch follows naming convention
- [ ] PR title matches `[Story N.M] Description`
- [ ] PR body includes `Closes #{issue}`
- [ ] All linked issues are in the PR body
- [ ] CI passes (build + lint + unit tests ≥ 85%)
- [ ] No `any` types, no `console.log`
- [ ] Compliance check green

### PR Review Rules

| Branch Target | Required Approvals | CI Checks                             |
| ------------- | ------------------ | ------------------------------------- |
| `main`        | 1                  | Lint, Test (≥ 85%), Build, Compliance |
| `qa`          | 1                  | Lint, Test (≥ 85%), Build             |
| `preprod`     | 1                  | Lint, Test (≥ 85%), Build, Compliance |
| `prod`        | 2                  | Lint, Test (≥ 85%), Build, Compliance |

### Merge Strategy

| Target Branch           | Merge Type           | Rationale                             |
| ----------------------- | -------------------- | ------------------------------------- |
| `main`                  | **Squash and merge** | Clean single commit per story         |
| `qa`, `preprod`, `prod` | **Merge commit**     | Preserves SHA for NIST SI-7 integrity |

## 5. Multi-Story Epics

When implementing an epic with multiple stories:

1. **Create all story issues first** — link to epic label
2. **Implement one story per branch** — even if stories share files
3. **Merge stories in dependency order** — foundation stories first
4. **Each PR references its story** — not the entire epic
5. **If stories are independent** — branches can run in parallel

### Parallel Story Example (Epic 20)

```
main ─── feature/IMS-383-artifact-provider ──── PR → merge
    └── feature/IMS-385-crm-provider ────────── PR → merge
    └── feature/IMS-387-scanner-provider ─────── PR → merge
    └── feature/IMS-390-cdc-provider ──────────── PR → merge
    └── feature/IMS-392-dns-provider ──────────── PR → merge
```

When stories modify the same file (e.g., `types.ts`):

- **First story** creates the shared structure
- **Subsequent stories** branch from `main` after first merges
- Or: **Combine into one branch** if tightly coupled (document all story IDs in commit)

## 6. Release Process

### Release Branch

```bash
git checkout main
git pull origin main
git checkout -b release/v1.0.0
# CI validates automatically on push
```

### Promotion Path

```
release/v1.0.0 → PR → qa (AJ tests) → PR → preprod (Justin smoke) → PR → prod
```

### Release Tagging

After merge to prod:

```bash
git tag -a v1.0.0 -m "Release v1.0.0 — Epic 20 provider interfaces"
git push origin v1.0.0
```

## 7. GitHub Project Board

### Issue Lifecycle

```
Backlog → In Progress → In Review → Done
```

| Column          | Trigger                      |
| --------------- | ---------------------------- |
| **Backlog**     | Issue created                |
| **In Progress** | Branch created, assignee set |
| **In Review**   | PR opened                    |
| **Done**        | PR merged, issue auto-closed |

### Labels Required on Every Story

| Label        | Purpose          |
| ------------ | ---------------- |
| `story`      | Type identifier  |
| `epic:N`     | Epic association |
| `priority:*` | Priority level   |

## 8. Anti-Patterns (DO NOT)

- Do NOT commit directly to `main`
- Do NOT create a PR without a linked issue
- Do NOT merge with failing CI
- Do NOT combine multiple stories in one branch (unless tightly coupled + documented)
- Do NOT use `--force-push` on shared branches
- Do NOT skip hooks (`--no-verify`)
- Do NOT merge your own PR without review
- Do NOT leave branches open longer than 48 hours
