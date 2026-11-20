import subprocess
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parent.parent / "server"

CHECKS = [
    ("Compile Python files", [sys.executable, "-m", "compileall", "-q", "app", "run.py"]),
    ("Create the Flask app", [sys.executable, "-c", "from app import create_app; create_app()"]),
    ("Run tests", [sys.executable, "-m", "pytest", "-v"]),
]

def main():
    for name, command in CHECKS:
        print(f"\n=== {name} ===")
        result = subprocess.run(command, cwd=SERVER_DIR)
        if result.returncode != 0:
            print(f"\nFAILED: {name}")
            sys.exit(1)
    print("\nAll checks passed.")


if __name__ == "__main__":
    main()