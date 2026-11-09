"""
Learning script: the three checks used to debug the Groq setup.

Run it from the repo root:

    uv run python scripts/groq_explore.py

It reads GROQ_API_KEY from the .env file at the repo root and never prints it.
Each run sends two small chat requests to Groq, which count toward your usage.
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

# Windows terminals often can't print emoji or curly quotes that models like to
# use, which crashes print(). Switching stdout to UTF-8 avoids that.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

REPO_ROOT = Path(__file__).resolve().parent.parent
SYSTEM_PROMPT = "You are a supportive mental coach."


def check_key() -> str:
    """Load the key from .env and sanity-check it without revealing it."""
    load_dotenv(REPO_ROOT / ".env")
    key = os.getenv("GROQ_API_KEY") or ""

    print("== Step 0: API key check")
    print(f"  present: {bool(key)}")
    print(f"  length: {len(key)}")
    print(f"  starts with 'gsk_': {key.startswith('gsk_')}")
    print(f"  stray spaces/quotes: {key != key.strip().strip(chr(34) + chr(39))}")

    if not key:
        sys.exit("No GROQ_API_KEY found - add it to .env and try again.")
    return key


def list_models(client: Groq) -> None:
    """Script 1: ask Groq which models this key can use."""
    print("\n== Script 1: models available to your key")
    models = client.models.list().data
    for model in sorted(models, key=lambda m: m.id):
        print(f"  {model.id:<40} {model.owned_by:<15} context: {model.context_window}")


def try_model(client: Groq, model: str) -> None:
    """Script 2: send one test message straight to Groq with the coach prompt."""
    print(f"\n== Script 2: test message to {model}")
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": "I feel a bit overwhelmed today."},
            ],
        )
        print(response.choices[0].message.content[:400])
    except Exception as error:
        print(f"  FAILED: {error}")


def call_backend() -> None:
    """Script 3: call our own FastAPI /api/chat endpoint, without starting a server.

    TestClient runs the app in-process, so this tests the real backend code
    (including the model name in api/index.py) end to end.
    """
    print("\n== Script 3: our backend's /api/chat endpoint")
    sys.path.insert(0, str(REPO_ROOT))  # so "import api.index" works
    from fastapi.testclient import TestClient
    from api.index import app

    client = TestClient(app)
    response = client.post("/api/chat", json={"message": "Say hi in five words."})
    print(f"  status: {response.status_code}")
    print(f"  body: {response.json()}")


if __name__ == "__main__":
    groq_client = Groq(api_key=check_key())
    list_models(groq_client)
    try_model(groq_client, "qwen/qwen3.8-27b")
    call_backend()
