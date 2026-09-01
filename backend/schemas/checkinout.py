from datetime import date

from pydantic import BaseModel, ConfigDict


class CheckOutRequest(BaseModel):
    equipment_id: str
    site_id: str | None = None
    operator_id: str | None = None
    client_name: str | None = None
    check_out_date: date
    expected_return_date: date | None = None


class CheckInRequest(BaseModel):
    """Check-in identifies the rental cycle either by qr_token (scan) or equipment_id (manual)."""
    qr_token: str | None = None
    equipment_id: str | None = None
    check_in_date: date


class CheckEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipment_id: str
    site_id: str | None
    operator_id: str | None
    check_out_date: date
    expected_return_date: date | None
    check_in_date: date | None
    qr_token: str | None


class QRPayloadOut(BaseModel):
    qr_token: str
    qr_image_base64: str
