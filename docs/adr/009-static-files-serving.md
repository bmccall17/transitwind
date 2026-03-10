# ADR 009: Path Traversal Fix — StaticFiles over FileResponse

**Date**: 2026-03-10
**Status**: accepted

## Context

The original SPA serving code used a catch-all route that passed user-supplied path segments directly into `FileResponse`:

```python
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    file_path = frontend_dist / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    return FileResponse(frontend_dist / "index.html")
```

Snyk SAST scan flagged this as **CWE-23: Path Traversal** (High severity). An attacker could craft a URL with `../` sequences to read files outside `frontend_dist/`.

Adding `.resolve()` + `is_relative_to()` guards mitigated the vulnerability logically, but Snyk's taint analysis still flagged the flow because user input ultimately reached `FileResponse`.

## Decision

Replace the manual catch-all route with FastAPI's built-in `StaticFiles` middleware using `html=True` mode:

```python
app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="spa")
```

`StaticFiles` with `html=True`:
- Serves static files from the directory
- Falls back to `index.html` for SPA routing (any path without a matching file)
- Handles path traversal protection internally (Starlette's `StaticFiles` resolves and validates paths)

## Consequences

- Path traversal vulnerability eliminated — Snyk scan returns 0 issues
- Simpler code — one line replaces a 5-line route handler
- SPA routing works identically (unmatched paths serve `index.html`)
- `/assets` mount (line 31) is technically redundant now but kept for explicit CDN-friendly caching if needed later
