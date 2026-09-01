"""
DynamoDB Schema & Query Compatibility Test Suite.

Validates that:
  1. The SmartRentalTracking table conforms to the Terraform definition.
  2. Base Table (EquipmentID, CheckOutDate) queries work.
  3. GSI 1 (SiteID-CheckInDate-index) queries work.
  4. GSI 2 (Type-CheckOutDate-index) queries work.
  5. Check-out, check-in, telemetry, and alert operations execute with zero errors.
"""
import os
import sys
from datetime import date, timedelta
from decimal import Decimal

# Set dummy credentials for testing
os.environ["AWS_ACCESS_KEY_ID"] = "testing"
os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
os.environ["AWS_SECURITY_TOKEN"] = "testing"
os.environ["AWS_SESSION_TOKEN"] = "testing"
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
os.environ["AWS_REGION"] = "us-east-1"

import boto3
from moto import mock_aws

from config import settings
from db.dynamo import ensure_table_exists
from repositories.dynamo_repository import DynamoRepository
from seed_dynamodb import seed_dynamodb, TERRAFORM_ITEMS


@mock_aws
def run_dynamo_compatibility_tests():
    print("\n--- 1. Testing DynamoDB Table Creation (Terraform Schema) ---")
    dynamo_res = boto3.resource("dynamodb", region_name="us-east-1")
    table = ensure_table_exists(dynamo_res)
    assert table.table_name == "SmartRentalTracking"

    # Verify KeySchema
    key_schema = {k["AttributeName"]: k["KeyType"] for k in table.key_schema}
    assert key_schema["EquipmentID"] == "HASH", "Hash key must be EquipmentID"
    assert key_schema["CheckOutDate"] == "RANGE", "Range key must be CheckOutDate"
    print("  [OK] Table KeySchema verified: EquipmentID (HASH) + CheckOutDate (RANGE)")

    # Verify GSIs
    gsi_names = [g["IndexName"] for g in table.global_secondary_indexes]
    assert "SiteID-CheckInDate-index" in gsi_names, "Missing GSI 1: SiteID-CheckInDate-index"
    assert "Type-CheckOutDate-index" in gsi_names, "Missing GSI 2: Type-CheckOutDate-index"
    print("  [OK] GSIs verified: SiteID-CheckInDate-index and Type-CheckOutDate-index present")

    print("\n--- 2. Testing Seeding with Terraform rental_items ---")
    seed_dynamodb()
    print("  [OK] Seeded Terraform problem sheet and Caterpillar demo fleet")

    print("\n--- 3. Testing Base Table Query by EquipmentID ---")
    repo = DynamoRepository("SmartRentalTracking")
    eq1001 = repo.get_equipment("EQX1001")
    assert eq1001 is not None, "EQX1001 should exist"
    assert eq1001["type"] == "Excavator", f"Expected Excavator, got {eq1001['type']}"
    assert eq1001["site_id"] == "S003", f"Expected S003, got {eq1001['site_id']}"
    print(f"  [OK] Retrieved EQX1001: {eq1001['name']} at site {eq1001['site_id']}")

    print("\n--- 4. Testing GSI 1: SiteID-CheckInDate-index (Site-wise Query) ---")
    s003_fleet = repo.list_all_equipment(site_id="S003")
    assert len(s003_fleet) > 0, "Should find equipment at site S003"
    print(f"  [OK] GSI 1 returned {len(s003_fleet)} item(s) for site S003")

    print("\n--- 5. Testing GSI 2: Type-CheckOutDate-index (Forecasting Query) ---")
    excavator_history = repo.history_for_type("Excavator", days=365)
    assert len(excavator_history) > 0, "Should find Excavator telemetry history"
    print(f"  [OK] GSI 2 returned {len(excavator_history)} history point(s) for Excavator type")

    print("\n--- 6. Testing Check-Out Flow ---")
    checkout = repo.create_checkout(
        equipment_id="EQX1006",
        check_out_date=date.today(),
        site_id="Bangalore",
        operator_id="OP999",
        expected_return_date=date.today() + timedelta(days=14),
        qr_token="QR-TEST-TOKEN-1234",
        client_name="Test Enterprise Ltd",
        type_="Grader",
    )
    assert checkout["EquipmentID"] == "EQX1006"
    assert checkout["Status"] == "Rented"
    assert checkout["QRToken"] == "QR-TEST-TOKEN-1234"
    print(f"  [OK] Check-out recorded: QR Token {checkout['QRToken']}")

    print("\n--- 7. Testing QR Token Lookup & Return Check-In ---")
    found_by_qr = repo.get_by_qr_token("QR-TEST-TOKEN-1234")
    assert found_by_qr is not None
    assert found_by_qr["EquipmentID"] == "EQX1006"

    closed = repo.close_checkout(
        equipment_id="EQX1006",
        check_out_date=str(date.today()),
        check_in_date=date.today(),
    )
    assert closed["status"] == "Available"
    print("  [OK] Return verified: Asset status transitioned back to Available")

    print("\n--- 8. Testing Active Alerts Retrieval ---")
    alerts = repo.list_active_alerts()
    print(f"  [OK] Scanned {len(alerts)} active alerts (overdue, expiring soon, and high idle)")
    assert any(a["type"] == "OVERDUE" for a in alerts), "Should detect overdue demo alert"

    print("\nALL DYNAMODB COMPATIBILITY TESTS PASSED! [OK]\n")


if __name__ == "__main__":
    run_dynamo_compatibility_tests()
