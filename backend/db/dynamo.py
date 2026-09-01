"""
DynamoDB Client & Table Manager.

Implements the single-table DynamoDB connection for SmartRentalTracking
matching the exact Terraform specification:
  - Table: SmartRentalTracking
  - Hash Key: EquipmentID (S)
  - Range Key: CheckOutDate (S)
  - GSI 1: SiteID-CheckInDate-index (SiteID S / CheckInDate S, ALL)
  - GSI 2: Type-CheckOutDate-index (Type S / CheckOutDate S, ALL)
"""
import logging
from decimal import Decimal
from typing import Any

import boto3
from botocore.exceptions import ClientError

from config import settings

logger = logging.getLogger("dynamodb")


def get_dynamo_resource():
    """Initializes and returns a boto3 DynamoDB resource."""
    kwargs: dict[str, Any] = {
        "region_name": settings.aws_region,
    }
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        kwargs["aws_access_key_id"] = settings.aws_access_key_id
        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
    if settings.dynamodb_endpoint_url:
        kwargs["endpoint_url"] = settings.dynamodb_endpoint_url

    return boto3.resource("dynamodb", **kwargs)


def get_dynamo_client():
    """Initializes and returns a boto3 DynamoDB low-level client."""
    kwargs: dict[str, Any] = {
        "region_name": settings.aws_region,
    }
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        kwargs["aws_access_key_id"] = settings.aws_access_key_id
        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
    if settings.dynamodb_endpoint_url:
        kwargs["endpoint_url"] = settings.dynamodb_endpoint_url

    return boto3.client("dynamodb", **kwargs)


def ensure_table_exists(dynamo_resource=None) -> Any:
    """
    Ensures the SmartRentalTracking table exists with the exact schema
    defined in Terraform. Creates it if missing (useful for LocalStack / local tests).
    """
    res = dynamo_resource or get_dynamo_resource()
    table_name = settings.dynamodb_table_name

    try:
        table = res.Table(table_name)
        table.load()
        logger.info(f"DynamoDB table '{table_name}' is active.")
        return table
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") != "ResourceNotFoundException":
            logger.warning(f"Error checking DynamoDB table '{table_name}': {e}")
            raise

    logger.info(f"Table '{table_name}' not found. Creating with Terraform schema...")

    table = res.create_table(
        TableName=table_name,
        BillingMode="PAY_PER_REQUEST",
        KeySchema=[
            {"AttributeName": "EquipmentID", "KeyType": "HASH"},
            {"AttributeName": "CheckOutDate", "KeyType": "RANGE"},
        ],
        AttributeDefinitions=[
            {"AttributeName": "EquipmentID", "AttributeType": "S"},
            {"AttributeName": "CheckOutDate", "AttributeType": "S"},
            {"AttributeName": "SiteID", "AttributeType": "S"},
            {"AttributeName": "CheckInDate", "AttributeType": "S"},
            {"AttributeName": "Type", "AttributeType": "S"},
        ],
        GlobalSecondaryIndexes=[
            {
                "IndexName": "SiteID-CheckInDate-index",
                "KeySchema": [
                    {"AttributeName": "SiteID", "KeyType": "HASH"},
                    {"AttributeName": "CheckInDate", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "Type-CheckOutDate-index",
                "KeySchema": [
                    {"AttributeName": "Type", "KeyType": "HASH"},
                    {"AttributeName": "CheckOutDate", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        Tags=[
            {"Key": "Environment", "Value": "Dev"},
            {"Key": "Project", "Value": "SmartRentalTrackingSystem"},
        ],
    )
    table.wait_until_exists()
    logger.info(f"DynamoDB table '{table_name}' created successfully.")
    return table


def to_dynamo_decimal(obj: Any) -> Any:
    """Recursively converts float to Decimal for DynamoDB storage."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: to_dynamo_decimal(v) for k, v in obj.items() if v is not None}
    if isinstance(obj, list):
        return [to_dynamo_decimal(x) for x in obj]
    return obj


def from_dynamo_decimal(obj: Any) -> Any:
    """Recursively converts Decimal to int/float for JSON and Pydantic serialization."""
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    if isinstance(obj, dict):
        return {k: from_dynamo_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [from_dynamo_decimal(x) for x in obj]
    return obj
