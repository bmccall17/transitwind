# /adr - Architecture Decision Record

## Purpose
Capture significant architectural decisions before or during implementation. Every structural choice gets documented so future-you (and contributors) know *why*, not just *what*.

## Usage
```
/adr [title or topic]
```

If a title is provided, use it. Otherwise, derive one from the current conversation context.

## When to use
- Choosing between technologies, libraries, or approaches
- Changing an existing pattern (new caching strategy, new auth method, etc.)
- Adding a new service, API pattern, or data model
- Any decision you'd want to explain to a teammate joining next month

## When NOT to use
- Variable naming, CSS tweaks, copy changes
- Bug fixes that don't change architecture
- Routine feature work following established patterns

## Workflow

### Step 1: Determine ADR Number
- Read `docs/adr/README.md` index table
- Find the highest existing ADR number
- Increment by 1 (e.g., 009 → 010)

### Step 2: Gather Context
- Review the current conversation for the decision being made
- Identify:
  - What problem or question prompted this
  - What options were considered (at least 2)
  - What was chosen and why
  - What tradeoffs or consequences follow

### Step 3: Write the ADR
Create `docs/adr/NNN-kebab-case-title.md` with this structure:

```markdown
# ADR NNN: Title

**Date**: YYYY-MM-DD
**Status**: proposed | accepted | deprecated | superseded

## Context
[What prompted this decision. What problem are we solving. 2-4 sentences.]

## Decision
[What we decided. Be specific — include code patterns, library names, file paths.
If relevant, mention what alternatives were rejected and why.]

## Consequences
[What follows from this decision. Both positive and negative.
- What becomes easier
- What becomes harder
- What constraints this creates
- Migration or cleanup needed]
```

### Step 4: Update the Index
Add a row to the table in `docs/adr/README.md`:

```
| NNN | [Title](NNN-kebab-case-title.md) | status | YYYY-MM-DD |
```

Insert at the bottom of the table (chronological order).

### Step 5: Check for Superseded ADRs
- If this decision replaces a previous one, update the old ADR's status to `superseded by [ADR NNN](NNN-file.md)`
- Update the old ADR's row in the index table too

### Step 6: Confirm
Report to user:
- **ADR number:** NNN
- **Title:** [title]
- **File:** `docs/adr/NNN-kebab-case-title.md`
- **Index updated:** yes
- **Supersedes:** [previous ADR if applicable, otherwise "none"]

## Key Files
- `docs/adr/README.md` — index of all ADRs
- `docs/adr/NNN-*.md` — individual decision records
- `CHANGELOG.md` — reference for what shipped when (ADRs explain *why*)

## Important Notes
- ADRs are **immutable** once accepted. Don't edit old ADRs to change the decision — write a new one that supersedes it.
- Status `proposed` means it's open for discussion. `accepted` means we're committed.
- Keep it concise. An ADR that takes 10 minutes to read is too long. Aim for 1-2 minutes.
- The **Context** section is the most important part. If someone only reads one section, make it that one.
