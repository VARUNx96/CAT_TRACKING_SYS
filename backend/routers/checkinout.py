"""
Check-in and check-out API endpoints.
Exclusively powered by AWS DynamoDB.
"""
import base64
from io import BytesIO

import qrcode
from fastapi import APIRouter, Depends, HTTPException

from db.session import get_db
from repositories.dynamo_repository import DynamoRepository
from services.rental_service import RentalService, RentalServiceError
from schemas.checkinout import CheckOutRequest, CheckInRequest, CheckEventOut, QRPayloadOut

router = APIRouter(prefix="/checkinout", tags=["check-in/check-out"])


@router.post("/checkout", response_model=CheckEventOut, status_code=201)
def check_out(payload: CheckOutRequest, db: DynamoRepository = Depends(get_db)):
    service = RentalService(db)
    try:
        return service.check_out(
            equipment_id=payload.equipment_id,
            check_out_date=payload.check_out_date,
            site_id=payload.site_id,
            operator_id=payload.operator_id,
            expected_return_date=payload.expected_return_date,
            client_name=payload.client_name,
        )
    except RentalServiceError as e:
        raise HTTPException(400, str(e))


@router.post("/checkin", response_model=CheckEventOut)
def check_in(payload: CheckInRequest, db: DynamoRepository = Depends(get_db)):
    service = RentalService(db)
    try:
        return service.check_in(
            check_in_date=payload.check_in_date,
            qr_token=payload.qr_token,
            equipment_id=payload.equipment_id,
        )
    except RentalServiceError as e:
        raise HTTPException(400, str(e))


@router.get("/qr/{qr_token}", response_model=QRPayloadOut)
def get_qr_image(qr_token: str):
    """
    Generates a scannable QR image for a given token (returned at checkout).
    Frontend renders this at handoff; operator scans it at check-in.
    """
    img = qrcode.make(qr_token)
    buf = BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    return QRPayloadOut(qr_token=qr_token, qr_image_base64=b64)
