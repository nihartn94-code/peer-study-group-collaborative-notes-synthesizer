import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend can be imported from root or backend/
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

from backend.memory import create_or_update_bank, BANK_ID


def main():
    print(f"Starting bank setup for BANK_ID='{BANK_ID}'...")
    try:
        res = create_or_update_bank(
            bank_id=BANK_ID,
            name="DSA Prep Group",
            mission="Remember peer explanations, doubts, quiz results and the group's mistakes with who and when.",
            enable_observations=True,
        )
        print(f"Bank setup successful! Response: {res}")
    except Exception as e:
        print(f"Bank setup encountered error: {e}")
        # Safe to run twice - log and exit with error code if failed
        sys.exit(1)


if __name__ == "__main__":
    main()

