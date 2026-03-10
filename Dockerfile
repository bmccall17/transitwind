FROM python:3.12-slim

# install node for frontend build
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

# python deps
RUN pip install --no-cache-dir fastapi uvicorn pyswisseph sqlalchemy anthropic pyjwt bcrypt python-dotenv pydantic httpx

# build frontend
RUN cd frontend && npm install && npx vite build

EXPOSE 10000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "10000"]
