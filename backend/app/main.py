"""TransitWind — FastAPI application entry point."""

from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.database import init_db
from backend.app.seed import seed
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
    seed()


# Serve frontend static files (built by Vite)
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"

if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    # Serve remaining static files (favicon, manifest, etc.) from dist root
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="spa")
