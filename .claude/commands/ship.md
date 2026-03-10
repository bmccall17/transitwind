# /ship - Release & ADR Workflow

## Purpose
End-to-end shipping workflow for TransitWind. Handles version bump, release notes, CHANGELOG update, ADR capture, and build verification. Every ship cycle checks for architectural decisions worth recording.

## Usage
```
/ship [phase or version title]
```

Phases: `status`, `build`, `adr`, `full`
No argument or a title = full cycle.

- `/ship` — full release cycle
- `/ship Transit Tools v1.1` — full cycle with explicit title
- `/ship status` — repo state + recent changes only
- `/ship build` — build verification only
- `/ship adr` — ADR management only (same as `/adr`)

## Full Cycle Workflow

### Step 1: Status Check
- Run `git status` and `git log --oneline -10` for repo state
- Read `CHANGELOG.md` for current version
- Read `docs/adr/README.md` for recent decisions
- Report: what's changed since last release

### Step 2: Build Verification
- Run `cd frontend && npx tsc --noEmit` — TypeScript must pass clean
- Run `cd frontend && npx vite build` — production build must succeed
- Run backend import check: `python -c "from backend.app.main import app"`
- Run Snyk code scan on project root — must show 0 issues
- If any step fails, stop and report. Do not proceed with a broken build.

### Step 3: Determine Version
- Read `CHANGELOG.md` for the current version (e.g., `[1.1.0]`)
- Determine bump level:
  - **Patch** (1.1.0 → 1.1.1): bug fixes, small tweaks
  - **Minor** (1.1.0 → 1.2.0): new features, new endpoints, new components
  - **Major** (1.1.0 → 2.0.0): breaking changes, major rewrites
- If user provided a title, use it. Otherwise derive from changes.

### Step 4: ADR Check
- Review the conversation and recent changes for architectural decisions
- Ask: "Were any of these worth an ADR?"
  - New technology/library adopted
  - New service pattern or data model
  - Changed an existing approach
  - Security fix with design implications
- If yes, run the ADR workflow (see `/adr` command):
  1. Determine next ADR number from `docs/adr/README.md`
  2. Write ADR file in `docs/adr/NNN-kebab-case-title.md`
  3. Update index in `docs/adr/README.md`
  4. Check for superseded ADRs

### Step 5: Update CHANGELOG.md
Add a new version section at the top of `CHANGELOG.md` (below the header, above previous versions):

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- [New features, endpoints, components]

### Changed
- [Modified behavior, refactors]

### Fixed
- [Bug fixes, security fixes]

### Removed
- [Deleted features, deprecated code]
```

Only include sections that have entries. Follow [Keep a Changelog](https://keepachangelog.com/) format.

### Step 6: Update pyproject.toml
Update the `version` field in `pyproject.toml` to match the new release.

### Step 7: Confirm & Report
Report to user:
- **Version:** vX.Y.Z
- **Title:** [title]
- **CHANGELOG.md:** updated
- **pyproject.toml:** version bumped
- **ADRs written:** [list or "none"]
- **Build:** clean (TS + Vite + backend + Snyk)
- **Next step:** user handles `git commit` and deploy

## Phase: `/ship status`

Quick check only — no changes made:
- `git status`, `git log --oneline -10`
- Current version from `CHANGELOG.md`
- Count of ADRs in `docs/adr/`
- Any uncommitted changes

## Phase: `/ship build`

Build verification only — no changes made:
- TypeScript check
- Vite production build
- Backend import check
- Snyk scan

## Phase: `/ship adr`

ADR management only — equivalent to `/adr`:
- List all ADRs
- Check for `proposed` status ADRs needing resolution
- Prompt for new ADR if applicable
- Write ADR using the standard workflow

## Key Files
- `CHANGELOG.md` — version history (what shipped when)
- `docs/adr/README.md` — ADR index (why decisions were made)
- `docs/adr/NNN-*.md` — individual decision records
- `pyproject.toml` — project version

## Important Notes
- Do NOT push to remote unless explicitly asked
- Do NOT commit unless explicitly asked
- Build must pass before shipping — no exceptions
- ADRs are immutable once accepted. Supersede, don't edit.
- Every ship cycle should at least *consider* whether an ADR is warranted
