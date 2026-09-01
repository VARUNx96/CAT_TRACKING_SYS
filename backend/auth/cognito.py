import os
from functools import lru_cache

import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt


COGNITO_REGION = os.environ["COGNITO_REGION"]
COGNITO_USER_POOL_ID = os.environ["COGNITO_USER_POOL_ID"]
COGNITO_CLIENT_ID = os.environ["COGNITO_CLIENT_ID"]

ISSUER = (
    f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/"
    f"{COGNITO_USER_POOL_ID}"
)

JWKS_URL = f"{ISSUER}/.well-known/jwks.json"

security = HTTPBearer()


@lru_cache()
def get_jwks():
    response = requests.get(
        JWKS_URL,
        timeout=5,
    )

    response.raise_for_status()

    return response.json()


def verify_cognito_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    try:
        header = jwt.get_unverified_header(token)
        key_id = header.get("kid")

        if not key_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token.",
            )

        jwks = get_jwks()

        signing_key = next(
            (
                key
                for key in jwks["keys"]
                if key["kid"] == key_id
            ),
            None,
        )

        if signing_key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find signing key.",
            )

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=ISSUER,
            options={
                "verify_aud": False,
            },
        )

        if payload.get("client_id") != COGNITO_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token client.",
            )

        if payload.get("token_use") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type.",
            )

        return payload

    except HTTPException:
        raise

    except Exception as error:
        print("JWT verification error:", error)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        )