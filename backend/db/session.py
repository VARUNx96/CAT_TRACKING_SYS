"""
Database repository dependency provider.
Exclusively uses AWS DynamoDB (SmartRentalTracking table).
"""
from db.dynamo import ensure_table_exists
from repositories.dynamo_repository import DynamoRepository


def get_db() -> DynamoRepository:
    """FastAPI dependency — returns the DynamoDB repository instance."""
    return DynamoRepository()


def init_db() -> None:
    """Ensures the DynamoDB table exists and is accessible."""
    ensure_table_exists()
