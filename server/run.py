"""Entry point: python run.py"""
import os

from dotenv import load_dotenv

load_dotenv()  # reads server/.env if it exists

from app import create_app  # noqa: E402

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))
    print(f"Server running on http://localhost:{port}")
    app.run(host="127.0.0.1", port=port)
