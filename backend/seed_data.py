"""
Loads the sample dataset from the hackathon problem sheet so the API has
realistic demo data immediately, PLUS a set of present-day scenarios so
alerts/anomalies/forecasts actually have something to show live in a demo
(the original sheet's dates are all in the past and already closed out).

Run once after first start:

    python seed_data.py
"""
from datetime import date, timedelta

from db.session import init_db, session_scope
from models.equipment import Equipment, EquipmentStatus
from models.check_event import CheckEvent
from models.usage_log import UsageLog

# (equipment_id, name, model, type, site_id, check_out, check_in, engine_hrs/day, idle_hrs/day, operating_days, last_operator, client_name)
ROWS = [
    ("CAT-320-01", "Excavator 320", "320 GC", "Excavator", "Bangalore", date(2025, 4, 1), date(2025, 4, 16), 6.5, 1.5, 15, "OP101", "ABC Construction"),
    ("CAT-D6-04", "Bulldozer D6", "D6 T4F", "Bulldozer", "Hyderabad", date(2025, 3, 10), date(2025, 3, 30), 0, 11, 20, None, None),
    ("CAT-950-02", "Loader 950", "950M", "Loader", "Chennai", date(2025, 2, 15), date(2025, 3, 11), 7.5, 2, 25, "OP203", None),
    ("EQX1001", "Excavator 320D", "320D", "Excavator", "S003", date(2025, 4, 1), date(2025, 4, 16), 1.5, 10, 15, "OP101", "Apex Infra"),
    ("EQX1002", "Crane RT50", "RT50", "Crane", None, date(2025, 3, 10), date(2025, 3, 30), 0, 11, 20, None, None),
    ("EQX1003", "Bulldozer D8", "D8T", "Bulldozer", "S002", date(2025, 2, 15), date(2025, 3, 11), 7.5, 2, 25, "OP203", "Metro Rail"),
    ("EQX1004", "Excavator 336", "336 GC", "Excavator", "S004", date(2025, 5, 5), date(2025, 5, 15), 2, 6, 9, "OP106", "Coastal Roads"),
    ("EQX1005", "Bulldozer D6K", "D6K2", "Bulldozer", "S006", date(2025, 1, 1), date(2025, 1, 31), 8, 0, 30, "OP301", "Highland Mining"),
    ("EQX1006", "Grader 140", "140M", "Grader", "S001", date(2025, 4, 5), date(2025, 4, 23), 3, 9, 18, "OP114", "Greenfield Port"),
    ("EQX1007", "Excavator 323", "323 NextGen", "Excavator", None, date(2025, 3, 20), date(2025, 4, 1), 0, 12, 12, None, None),
]


def run():
    init_db()
    with session_scope() as db:
        for eq_id, name, model, type_, site_id, check_out, check_in, engine_h, idle_h, op_days, operator, client in ROWS:
            eq = db.get(Equipment, eq_id)
            status = EquipmentStatus.AVAILABLE
            if eq_id == "CAT-320-01":
                status = EquipmentStatus.RENTED
            elif eq_id == "CAT-950-02":
                status = EquipmentStatus.MAINTENANCE
            elif client and check_in is None:
                status = EquipmentStatus.RENTED

            if eq is None:
                eq = Equipment(
                    equipment_id=eq_id,
                    name=name,
                    model=model,
                    type=type_,
                    site_id=site_id,
                    status=status,
                    client_name=client,
                )
                db.add(eq)
                db.flush()
            else:
                eq.name = name
                eq.model = model
                eq.status = status
                eq.client_name = client

            db.add(
                CheckEvent(
                    equipment_id=eq_id, site_id=site_id, operator_id=operator,
                    check_out_date=check_out, check_in_date=check_in,
                    expected_return_date=check_in,
                )
            )
            existing_log = db.query(UsageLog).filter_by(equipment_id=eq_id, log_date=check_in or check_out).first()
            if not existing_log:
                db.add(
                    UsageLog(
                        equipment_id=eq_id, log_date=check_in or check_out,
                        engine_hours_day=engine_h, idle_hours_day=idle_h,
                        operating_days_cumulative=op_days, last_operator_id=operator,
                    )
                )
    print(f"Seeded {len(ROWS)} equipment records with check-events and usage logs.")
    _seed_live_demo_scenarios()


def _seed_live_demo_scenarios():
    """
    Adds a handful of present-day rows so /alerts, /anomalies/recent, and
    /forecast return non-empty results out of the box:
      - EQX2001: active rental, overdue (expected_return in the past)
      - EQX2002: active rental, expiring in 2 days
      - EQX2003: high idle ratio + unassigned operator -> anomaly
      - EQX2004/2005: 14+ days of Excavator usage history -> real trend forecast
    """
    today = date.today()
    with session_scope() as db:
        # Overdue asset
        if db.get(Equipment, "EQX2001") is None:
            db.add(Equipment(equipment_id="EQX2001", type="Excavator", site_id="S010", status=EquipmentStatus.RENTED))
            db.add(CheckEvent(
                equipment_id="EQX2001", site_id="S010", operator_id="OP210",
                check_out_date=today - timedelta(days=20),
                expected_return_date=today - timedelta(days=3),
                check_in_date=None,
            ))

        # Expiring soon
        if db.get(Equipment, "EQX2002") is None:
            db.add(Equipment(equipment_id="EQX2002", type="Bulldozer", site_id="S011", status=EquipmentStatus.RENTED))
            db.add(CheckEvent(
                equipment_id="EQX2002", site_id="S011", operator_id="OP211",
                check_out_date=today - timedelta(days=10),
                expected_return_date=today + timedelta(days=2),
                check_in_date=None,
            ))

        # Anomaly candidate: high idle ratio, unassigned operator
        if db.get(Equipment, "EQX2003") is None:
            db.add(Equipment(equipment_id="EQX2003", type="Grader", site_id="S012", status=EquipmentStatus.RENTED))
            db.flush()
        if not db.query(UsageLog).filter_by(equipment_id="EQX2003", log_date=today).first():
            db.add(UsageLog(
                equipment_id="EQX2003", log_date=today,
                engine_hours_day=1.0, idle_hours_day=9.0,
                operating_days_cumulative=5, last_operator_id=None,
            ))

        # 21 days of history for two Excavators -> exponential smoothing kicks in
        for eq_id, site in [("EQX2004", "S013"), ("EQX2005", "S013")]:
            if db.get(Equipment, eq_id) is None:
                db.add(Equipment(equipment_id=eq_id, type="Excavator", site_id=site, status=EquipmentStatus.AVAILABLE))
                db.flush()
            for i in range(21, 0, -1):
                log_date = today - timedelta(days=i)
                if not db.query(UsageLog).filter_by(equipment_id=eq_id, log_date=log_date).first():
                    # simulate a gently rising demand trend
                    engine_hours = 4.0 + (21 - i) * 0.15
                    db.add(UsageLog(
                        equipment_id=eq_id, log_date=log_date,
                        engine_hours_day=round(min(engine_hours, 10), 2),
                        idle_hours_day=round(24 - min(engine_hours, 10) - 12, 2) if engine_hours < 12 else 0.5,
                        operating_days_cumulative=21 - i, last_operator_id="OP220",
                    ))

    print("Seeded live-demo scenarios: overdue, expiring-soon, anomaly, and forecast-ready trend data.")

    try:
        from jobs.scheduler import job_refresh_anomaly_scan
        job_refresh_anomaly_scan()
        print("Converted seeded anomalies into Alert records.")
    except ImportError:
        print("Notice: apscheduler not installed in global environment yet. Run 'pip install -r requirements.txt'.")


if __name__ == "__main__":
    run()
