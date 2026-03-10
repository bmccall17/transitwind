# ADR 001: Use ADRs for Architecture Tracking

**Date**: 2026-03-10
**Status**: accepted

## Context

TransitWind has grown from MVP to v1.1 with transit tools, bisection algorithms, AI integration, and caching layers. Decisions were made implicitly during implementation without a record of why. As the project matures, we need a way to:

- Understand why past decisions were made
- Avoid re-debating settled questions
- Onboard future contributors with context

## Decision

Adopt Architecture Decision Records (ADRs) using the format from [adr.github.io](https://adr.github.io/). Store them in `docs/adr/` with sequential numbering. Backfill key decisions from v1.0 and v1.1.

Each ADR is immutable once accepted. To change a decision, write a new ADR that supersedes the old one.

## Consequences

- Every significant architectural choice gets documented before or during implementation
- The `docs/adr/README.md` index provides a quick overview of all decisions
- Small implementation details (variable names, CSS classes) don't need ADRs — only structural/architectural choices
