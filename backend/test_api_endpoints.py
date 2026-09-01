"""
Verification script: tests all backend API endpoints via FastAPI TestClient
without needing a live server port.
"""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_endpoints():
    print("Testing /health...")
    r = client.get("/health")
    assert r.status_code == 200, f"/health failed: {r.text}"

    print("Testing /equipment/stats/summary...")
    r = client.get("/equipment/stats/summary")
    assert r.status_code == 200, f"/equipment/stats/summary failed: {r.text}"
    summary = r.json()
    print("  Summary:", summary)
    assert summary["total_equipment"] > 0

    print("Testing /equipment...")
    r = client.get("/equipment")
    assert r.status_code == 200, f"/equipment failed: {r.text}"
    fleet = r.json()
    print(f"  Fleet count: {len(fleet)}")
    assert len(fleet) > 0

    print("Testing /alerts...")
    r = client.get("/alerts")
    assert r.status_code == 200, f"/alerts failed: {r.text}"
    alerts = r.json()
    print(f"  Alerts count: {len(alerts)}")

    print("Testing /alerts/scan...")
    r = client.get("/alerts")
    r_scan = client.post("/alerts/scan")
    assert r_scan.status_code == 200, f"/alerts/scan failed: {r_scan.text}"

    print("Testing /forecast/Excavator...")
    r = client.get("/forecast/Excavator")
    assert r.status_code == 200, f"/forecast failed: {r.text}"
    forecast = r.json()
    print("  Forecast points:", len(forecast.get("points", [])))

    print("Testing /anomalies/recent...")
    r = client.get("/anomalies/recent")
    assert r.status_code == 200, f"/anomalies/recent failed: {r.text}"

    print("Testing /anomalies/recommendations/reallocate...")
    r = client.get("/anomalies/recommendations/reallocate")
    assert r.status_code == 200, f"/anomalies/recommendations/reallocate failed: {r.text}"

    print("Testing /anomalies/recommendations/extensions...")
    r = client.get("/anomalies/recommendations/extensions")
    assert r.status_code == 200, f"/anomalies/recommendations/extensions failed: {r.text}"

    print("Testing /usage/CAT-320-01/utilization...")
    r = client.get("/usage/CAT-320-01/utilization")
    assert r.status_code == 200, f"/usage utilization failed: {r.text}"

    print("\nALL BACKEND ENDPOINTS PASSED SUCCESSFULLY! [OK]")

if __name__ == "__main__":
    test_endpoints()
