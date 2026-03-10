import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./transitwind.db")
EPHE_PATH = os.getenv("EPHE_PATH", "")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week
