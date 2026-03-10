# ADR 002: FastAPI + React SPA Monorepo

**Date**: 2026-03-09
**Status**: accepted

## Context

TransitWind needs a backend for ephemeris calculations, chart storage, and AI calls, plus a frontend for interactive chart visualization. Options considered:

1. **Django + templates** — server-rendered, simpler deployment, but poor interactivity for bodygraph SVG and countdown timers
2. **FastAPI + React SPA** — API-first, rich client-side interactivity, modern tooling
3. **Next.js fullstack** — good DX, but Python ecosystem (pyswisseph, scientific libs) is essential for ephemeris

## Decision

Use FastAPI (Python) for the backend and React (Vite + TypeScript) for the frontend, in a single monorepo. FastAPI serves the built frontend as static files in production. Vite dev server proxies `/api` to FastAPI during development.

**Layout**:
```
backend/app/       — FastAPI application
frontend/src/      — React SPA
frontend/dist/     — Vite build output, served by FastAPI
```

## Consequences

- Python gives us native access to Swiss Ephemeris (C library via pyswisseph)
- React gives us rich interactivity for bodygraph, countdowns, and calendar grid
- Single deploy target — FastAPI serves everything
- Dev requires running two processes (backend + Vite dev server)
- Tailwind CSS v4 via `@tailwindcss/vite` plugin handles styling
