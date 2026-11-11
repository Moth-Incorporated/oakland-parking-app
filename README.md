# Moth Incorporated — Oakland Parking App

Helps Pitt students, faculty, and visitors see where legal parking is available in Oakland before they arrive.

## Tech Stack

| Layer | Technology | Justification |
|---|---|---|
| Languages | Python (server), SQL (DB), HTML, CSS, JS (UI) | Python is very efficient for working with data, making it useful for our filtering and searching. SQL has very efficient data retrieval, which will make queries of large parking data sets quicker. HTML, CSS, and JS are very compatible with modern web browsers, making them an easy front end language choice. |
| Frontend (planned) | Vercel (hosting) and React (library) | Vercel has very simple integration with GitHub and allows for seamless deployment. React enables our front end developers to create the UI code in a much more modular and reusable way. |
| Backend | Python (language) and Flask (framework). | Python is a simple high level language that will be helpful to develop simple search algorithms and data maintenance with. Several of our group members have experience with Flask, and it is Python-based, integrating well with our language stack.

**Design Goal 1** - Python’s efficient data slicing enables faster query times.

**Design Goal 2** - Python and Flask seamless integration enables efficient API request handling, allowing for constant updating of data.
|
| Database | OracleDB| Generous free tier for cloud hosted database. Also allows for SQL queries. |
| APIs/external services | Third party parking spot reservation app (ex. ParkMobile) | Necessary for our redirection system to direct the user to a booking page. |

## Architecture

![Subsystem decomposition](docs/subsystem-decomposition.png)
![Deployment diagram](docs/deployment-diagram.png)

| Subsystem (Sprint 3) | Folder | Status |
|---|---|---|
| UI | `client/src/ui/` | Not started |
| User-Specific Data | `client/src/user-specific-data/` | Not started |
| Quality System | `client/src/quality-system/` | Not started |
| User Feedback | `client/src/user-feedback/`, `server/app/user_feedback/` | Not started |
| Parking Search | `server/app/parking_search/` | Search endpoint on mock data, radius check (C1) |
| Third Party Booking | `server/app/third_party_booking/` | Not started |

## How to Run

**Prerequisites:** Python 3.10 or newer (`python3 --version`), Git.

```bash
git clone https://github.com/siddh1709/oakland-parking-app.git
cd oakland-parking-app/server
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # Windows: copy .env.example .env
python run.py
```

**Check that it works:**
(Opening `http://localhost:3001/` shows "Not Found" because the server has no UI yet.)

1. `http://localhost:3001/health` returns `{"status":"ok"}`.
2. `http://localhost:3001/api/search?lat=40.4444&lng=-79.9533&radius=1` returns `count: 3`.
3. The same URL with `radius=6` returns an error (constraint C1).

## Status

**Works:** server starts, `/health`, search endpoint on mock data, radius validation (C1).

**Not yet:** client/UI, database, offline cache and auto-refresh, filters, favorites, feedback, third-party booking, real vacancy data source, legality check (C2).

## Team skeleton verification

| Member | OS | Result |
|---|---|---|
| Dev | macOS | Works: server starts, /health (and other links) respond |
| Kyu | Windows 11 | Works: server starts, /health (and other links) respond |
| Nick | Windows 11 | Works: server starts, /health (and other links) respond |
| Nile | Windows 11 | Works: server starts, /health (and other links) respond |
| Rohan | macOS | Works: server starts, /health (and other links) respond|
| Siddharth | Windows 11 | Works: server starts, /health (and other links) respond |
