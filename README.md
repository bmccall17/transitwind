# transitwind

*see yourself in today's weather*

a personalized Human Design transit interpreter. overlays real-time planetary transits onto your natal chart and generates AI-powered plain-language interpretations of what today's energy means for **you** specifically.

the white space: nobody provides AI-powered, personalized, plain-language interpretation of how today's transits interact with your specific chart. until now.

## what it does

- calculates your full HD natal chart from birth data (type, authority, profile, strategy, incarnation cross, all 13 planets)
- tracks real-time planetary transits via Swiss Ephemeris
- overlays transits on your chart to find completed channels, newly defined centers, reinforced gates
- generates personalized daily interpretations via Claude API
- transit journal for tracking awareness over time

## stack

- **backend**: python / FastAPI + SQLite + pyswisseph
- **frontend**: react + vite + tailwind css
- **ai**: Claude API (anthropic sdk) for interpretation, with template fallback
- **auth**: JWT + bcrypt
- **geocoding**: OpenStreetMap/Nominatim for birth location lookup

## run it

```bash
# backend
python3 -m venv .venv && . .venv/bin/activate
pip install fastapi uvicorn pyswisseph sqlalchemy anthropic pyjwt bcrypt python-dotenv pydantic httpx

cp .env.example .env
# add your ANTHROPIC_API_KEY to .env (optional, falls back to templates)

uvicorn backend.app.main:app --reload

# frontend (dev)
cd frontend && npm install && npm run dev

# frontend (production build)
cd frontend && npx vite build
# FastAPI serves the built files automatically from frontend/dist/
```

## deploy

Railway or Fly.io recommended. single server, single process. see deploy section below.

### Railway (easiest)
```bash
# Procfile
web: cd frontend && npm run build && cd .. && uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```

### Fly.io
```bash
fly launch
fly secrets set ANTHROPIC_API_KEY=sk-ant-... SECRET_KEY=your-random-string
fly deploy
```

### docker (if you want it)
```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*
COPY . .
RUN pip install fastapi uvicorn pyswisseph sqlalchemy anthropic pyjwt bcrypt python-dotenv pydantic httpx
RUN cd frontend && npm install && npx vite build
EXPOSE 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## env vars

| var | required | what |
|-----|----------|------|
| `SECRET_KEY` | yes | random string for JWT signing |
| `ANTHROPIC_API_KEY` | no | enables AI interpretations (falls back to templates without it) |
| `DATABASE_URL` | no | defaults to `sqlite:///./transitwind.db` |

## how it works

the HD computation engine:

1. **wheel.py** maps 360° ecliptic to 64 gates x 6 lines each
2. **ephemeris.py** wraps Swiss Ephemeris for 13 planetary positions (Sun, Earth, Moon, Nodes, Mercury through Pluto)
3. **chart.py** calculates personality (birth moment) and design (88° Sun arc before birth) positions, derives type/authority/profile from defined channels and centers
4. **transit.py** gets current planetary positions, cached hourly
5. **overlay.py** combines natal + transit to find completed channels, newly defined centers, reinforced gates
6. **interpreter.py** feeds the overlay into Claude for personalized plain-language interpretation

## license

do what you want with it.
