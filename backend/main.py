"""
App entrypoint: wires up DB init, all routers, and the background scheduler.
Run with:  uvicorn main:app --reload
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.session import init_db
from jobs.scheduler import start_scheduler, shutdown_scheduler
from routers import equipment, checkinout, usage, alerts, forecast, anomalies

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(
    title="Smart Rental Management — Intelligence Layer API",
    description="Asset traceability, check-in/out, usage logging, alerts, forecasting, and anomaly detection.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(equipment.router)
app.include_router(checkinout.router)
app.include_router(usage.router)
app.include_router(alerts.router)
app.include_router(forecast.router)
app.include_router(anomalies.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
