# Smart Rental Management — Intelligence Layer Backend

FastAPI backend implementing the full backend architecture: API layer,
service layer, AI module (forecasting / anomaly detection / smart
recommendations), data access layer, and an in-process scheduler for
background alert scans — exclusively backed by AWS DynamoDB (SmartRentalTracking).

## Setup

```bash
cd backend
python -m venv venv && source venv/bin/activate      # optional but recommended
pip install -r requirements.txt
cp .env.example .env                                   # configure AWS credentials
```

## Seed DynamoDB table

Loads the equipment/usage rows from the Terraform problem sheet, plus a set
of present-day scenarios (overdue rental, expiring-soon rental, an anomaly,
and Caterpillar fleet records) directly into AWS DynamoDB:

```bash
python seed_dynamodb.py
```

## Run

```bash
uvicorn main:app --reload
```

- API docs (Swagger UI): http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

## Key endpoints

| Endpoint | Purpose |
|---|---|
| `GET /equipment` | Fleet Overview Dashboard feed (status, utilization, idle ratio, active alerts) |
| `GET /equipment/{id}/timeline` | Full handoff-to-return history for one asset |
| `POST /checkinout/checkout` | Check out an asset, returns a QR token |
| `GET /checkinout/qr/{token}` | Renders the scannable QR image (base64 PNG) |
| `POST /checkinout/checkin` | Check in via QR token or equipment_id |
| `POST /usage` | Log daily usage — also runs real-time anomaly detection |
| `GET /alerts` | Alerts Center feed |
| `POST /alerts/scan` | Manually trigger the overdue/expiring scan (also runs hourly via scheduler) |
| `GET /forecast/{equipment_type}` | Demand forecast + relocation recommendation |
| `GET /anomalies/recent` | Recent anomaly detections (rules + Isolation Forest) |
| `GET /anomalies/recommendations/reallocate` | Underused assets flagged for reallocation |
| `GET /anomalies/recommendations/next-best-asset` | Best available asset for a new job |
| `GET /anomalies/recommendations/extensions` | Proactive contract-extension nudges |

## Demo script suggestion

1. `GET /equipment` — show the live fleet dashboard.
2. `POST /checkinout/checkout` on an available asset — show the QR token generated.
3. `POST /usage` with a high idle-hours payload — watch an anomaly alert appear instantly in `GET /alerts`.
4. `POST /alerts/scan` — show the overdue (`EQX2001`) and expiring-soon (`EQX2002`) alerts fire.
5. `GET /forecast/Excavator` — show the trending demand forecast (uses `EQX2004`/`EQX2005` history) with a relocation recommendation.
6. `GET /anomalies/recommendations/reallocate` — show underused assets flagged for redeployment.

This closes the full loop: **telemetry → AI insight → alert/recommendation → action** in one live walkthrough.

## Architecture notes

- **Layered, not microservices** — deliberate choice for a hackathon: one deployable service, clean separation of concerns (routers → services → repositories → DB), easy to defend and easy to demo.
- **AI is explainable by design** — exponential smoothing / moving average for forecasting, rule thresholds + Isolation Forest for anomalies, weighted scoring for recommendations. Every output can be explained in one sentence under judge questioning.
- **AWS DynamoDB Single-Table Architecture** — zero-latency key/range queries + 2 GSIs (SiteID-CheckInDate-index, Type-CheckOutDate-index) matching the Terraform cloud infrastructure.
- **Scheduler runs in-process** (APScheduler) — no external cron/queue infrastructure required for the MVP.
