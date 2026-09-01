"""
DynamoDB Seeder Script.

Populates the SmartRentalTracking DynamoDB table with:
  1. The exact 7 equipment items from the Terraform 'rental_items' resource.
  2. Caterpillar fleet assets (CAT-320-01, CAT-D6-04, CAT-950-02).
  3. Live demo scenarios (overdue rental, expiring soon, telemetry anomalies).
"""
import logging
from datetime import date, timedelta
from decimal import Decimal

from config import settings
from db.dynamo import get_dynamo_resource, ensure_table_exists, to_dynamo_decimal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_dynamodb")

# Exactly matching Terraform resource "aws_dynamodb_table_item" "rental_items"
TERRAFORM_ITEMS = [
    {
        "EquipmentID": "EQX1001",
        "Type": "Excavator",
        "SiteID": "S003",
        "CheckOutDate": "2025-04-01",
        "CheckInDate": "2025-04-16",
        "EngineHoursPerDay": Decimal("1.5"),
        "IdleHoursPerDay": Decimal("10"),
        "OperatingDays": 15,
        "LastOperatorID": "OP101",
        "Name": "Excavator EQX1001",
        "Model": "Cat 320",
        "Status": "Available",
    },
    {
        "EquipmentID": "EQX1002",
        "Type": "Crane",
        "SiteID": "Depot",
        "CheckOutDate": "2025-03-10",
        "CheckInDate": "2025-03-30",
        "EngineHoursPerDay": Decimal("0"),
        "IdleHoursPerDay": Decimal("11"),
        "OperatingDays": 20,
        "LastOperatorID": None,
        "Name": "Mobile Crane EQX1002",
        "Model": "Cat RT100",
        "Status": "Available",
    },
    {
        "EquipmentID": "EQX1003",
        "Type": "Bulldozer",
        "SiteID": "S002",
        "CheckOutDate": "2025-02-15",
        "CheckInDate": "2025-03-11",
        "EngineHoursPerDay": Decimal("7.5"),
        "IdleHoursPerDay": Decimal("0.5"),
        "OperatingDays": 25,
        "LastOperatorID": "OP203",
        "Name": "Bulldozer EQX1003",
        "Model": "Cat D6",
        "Status": "Available",
    },
    {
        "EquipmentID": "EQX1004",
        "Type": "Excavator",
        "SiteID": "S004",
        "CheckOutDate": "2025-05-05",
        "CheckInDate": "2025-05-15",
        "EngineHoursPerDay": Decimal("2"),
        "IdleHoursPerDay": Decimal("9"),
        "OperatingDays": 10,
        "LastOperatorID": "OP106",
        "Name": "Excavator EQX1004",
        "Model": "Cat 330",
        "Status": "Available",
    },
    {
        "EquipmentID": "EQX1005",
        "Type": "Bulldozer",
        "SiteID": "S006",
        "CheckOutDate": "2025-01-01",
        "CheckInDate": "2025-01-31",
        "EngineHoursPerDay": Decimal("8"),
        "IdleHoursPerDay": Decimal("0"),
        "OperatingDays": 30,
        "LastOperatorID": "OP301",
        "Name": "Bulldozer EQX1005",
        "Model": "Cat D8",
        "Status": "Available",
    },
    {
        "EquipmentID": "EQX1006",
        "Type": "Grader",
        "SiteID": "S001",
        "CheckOutDate": "2025-04-05",
        "CheckInDate": "2025-04-23",
        "EngineHoursPerDay": Decimal("3"),
        "IdleHoursPerDay": Decimal("6"),
        "OperatingDays": 18,
        "LastOperatorID": "OP114",
        "Name": "Motor Grader EQX1006",
        "Model": "Cat 140",
        "Status": "Available",
    },
    {
        "EquipmentID": "EQX1007",
        "Type": "Excavator",
        "SiteID": "Depot",
        "CheckOutDate": "2025-03-20",
        "CheckInDate": "2025-04-01",
        "EngineHoursPerDay": Decimal("0"),
        "IdleHoursPerDay": Decimal("12"),
        "OperatingDays": 12,
        "LastOperatorID": None,
        "Name": "Mini Excavator EQX1007",
        "Model": "Cat 308",
        "Status": "Available",
    },
]


def seed_dynamodb():
    """Seeds the DynamoDB table with Terraform items and demo fleet data."""
    logger.info(f"Connecting to DynamoDB table '{settings.dynamodb_table_name}' in region '{settings.aws_region}'...")
    res = get_dynamo_resource()
    table = ensure_table_exists(res)

    today = date.today()
    all_items = list(TERRAFORM_ITEMS)

    # 2. Add CAT Branded Equipment
    all_items.extend([
        {
            "EquipmentID": "CAT-320-01",
            "Type": "Excavator",
            "SiteID": "S003",
            "CheckOutDate": str(today - timedelta(days=5)),
            "ExpectedReturnDate": str(today + timedelta(days=9)),
            "CheckInDate": None,
            "EngineHoursPerDay": Decimal("7.5"),
            "IdleHoursPerDay": Decimal("1.2"),
            "OperatingDays": 14,
            "LastOperatorID": "OP101",
            "ClientName": "ABC Construction Ltd",
            "Name": "Cat 320 Hydraulic Excavator",
            "Model": "320 GC",
            "Status": "Rented",
            "QRToken": "CAT-QR-320-01",
        },
        {
            "EquipmentID": "CAT-D6-04",
            "Type": "Bulldozer",
            "SiteID": "S002",
            "CheckOutDate": str(today - timedelta(days=8)),
            "ExpectedReturnDate": str(today + timedelta(days=6)),
            "CheckInDate": None,
            "EngineHoursPerDay": Decimal("6.8"),
            "IdleHoursPerDay": Decimal("0.8"),
            "OperatingDays": 18,
            "LastOperatorID": "OP203",
            "ClientName": "Metro Rail Infrastructure",
            "Name": "Cat D6 Track Bulldozer",
            "Model": "D6 XE",
            "Status": "Rented",
            "QRToken": "CAT-QR-D6-04",
        },
        {
            "EquipmentID": "CAT-950-02",
            "Type": "Loader",
            "SiteID": "S001",
            "CheckOutDate": str(today - timedelta(days=20)),
            "CheckInDate": str(today - timedelta(days=2)),
            "EngineHoursPerDay": Decimal("5.0"),
            "IdleHoursPerDay": Decimal("1.5"),
            "OperatingDays": 22,
            "LastOperatorID": "OP114",
            "ClientName": None,
            "Name": "Cat 950 Wheel Loader",
            "Model": "950 GC",
            "Status": "Available",
        },
    ])

    # 3. Live Demo Scenarios: Overdue, Expiring Soon, Telemetry Anomaly
    all_items.extend([
        {
            "EquipmentID": "EQX2001",
            "Type": "Excavator",
            "SiteID": "S010",
            "CheckOutDate": str(today - timedelta(days=10)),
            "ExpectedReturnDate": str(today - timedelta(days=2)),  # Overdue
            "CheckInDate": None,
            "EngineHoursPerDay": Decimal("6.0"),
            "IdleHoursPerDay": Decimal("2.0"),
            "OperatingDays": 8,
            "LastOperatorID": "OP210",
            "ClientName": "Delta Highways",
            "Name": "Excavator EQX2001",
            "Model": "Cat 320D",
            "Status": "Rented",
            "QRToken": "QR-EQX2001",
        },
        {
            "EquipmentID": "EQX2002",
            "Type": "Crane",
            "SiteID": "S011",
            "CheckOutDate": str(today - timedelta(days=7)),
            "ExpectedReturnDate": str(today + timedelta(days=2)),  # Expiring soon
            "CheckInDate": None,
            "EngineHoursPerDay": Decimal("7.0"),
            "IdleHoursPerDay": Decimal("1.0"),
            "OperatingDays": 6,
            "LastOperatorID": "OP211",
            "ClientName": "Apex Towers",
            "Name": "Crane EQX2002",
            "Model": "Cat RT100",
            "Status": "Rented",
            "QRToken": "QR-EQX2002",
        },
        {
            "EquipmentID": "EQX2003",
            "Type": "Bulldozer",
            "SiteID": "S012",
            "CheckOutDate": str(today - timedelta(days=3)),
            "CheckInDate": None,
            "EngineHoursPerDay": Decimal("1.0"),
            "IdleHoursPerDay": Decimal("10.0"),  # High idle anomaly
            "OperatingDays": 3,
            "LastOperatorID": None,  # Unassigned operator anomaly
            "ClientName": "Prime Roads",
            "Name": "Bulldozer EQX2003",
            "Model": "Cat D6",
            "Status": "Flagged",
        },
    ])

    # 4. Batch write items to DynamoDB
    with table.batch_writer() as batch:
        for it in all_items:
            clean_item = to_dynamo_decimal(it)
            batch.put_item(Item=clean_item)

    logger.info(f"Successfully seeded {len(all_items)} records into DynamoDB '{settings.dynamodb_table_name}'.")


if __name__ == "__main__":
    seed_dynamodb()
