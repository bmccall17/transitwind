"""TransitWind — FastAPI application entry point."""

from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.database import init_db
from backend.app.routers import auth, user, chart, transit, interpret, journal

app = FastAPI(title="TransitWind", version="0.1.0")

# Register routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(chart.router)
app.include_router(transit.router)
app.include_router(interpret.router)
app.include_router(journal.router)


@app.on_event("startup")
def on_startup():
    init_db()


# Serve frontend static files (built by Vite)
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"

if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the SPA for all non-API routes."""
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
