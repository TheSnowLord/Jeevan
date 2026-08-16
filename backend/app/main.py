import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Jeevan API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OTP_EXPIRY_SECONDS = int(os.getenv("OTP_EXPIRY_SECONDS", "300"))
DEV_OTP_MODE = os.getenv("DEV_OTP_MODE", "true").lower() == "true"

# Development-only in-memory OTP store.
# Replace with Redis/PostgreSQL-backed storage before production.
otp_store: dict[str, dict] = {}


class PhoneRequest(BaseModel):
    phone: str = Field(min_length=10, max_length=16)


class VerifyRequest(BaseModel):
    phone: str = Field(min_length=10, max_length=16)
    otp: str = Field(min_length=6, max_length=6)


def normalize_phone(phone: str) -> str:
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) == 10:
        digits = "91" + digits
    if len(digits) != 12 or not digits.startswith("91"):
        raise HTTPException(status_code=400, detail="Enter a valid Indian mobile number.")
    return "+" + digits


def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


@app.get("/health")
def health():
    return {"status": "ok", "service": "jeevan-api"}


@app.post("/api/auth/request-otp")
def request_otp(payload: PhoneRequest):
    phone = normalize_phone(payload.phone)
    otp = f"{secrets.randbelow(1_000_000):06d}"

    otp_store[phone] = {
        "hash": hash_otp(otp),
        "expires_at": datetime.now(timezone.utc) + timedelta(seconds=OTP_EXPIRY_SECONDS),
        "attempts": 0,
    }

    # DEVELOPMENT ONLY:
    # Production must send this through an SMS provider.
    if DEV_OTP_MODE:
        print(f"[JEEVAN DEV OTP] {phone}: {otp}")

    return {
        "message": "Verification code sent.",
        "expires_in": OTP_EXPIRY_SECONDS,
    }


@app.post("/api/auth/verify-otp")
def verify_otp(payload: VerifyRequest):
    phone = normalize_phone(payload.phone)
    record = otp_store.get(phone)

    if not record:
        raise HTTPException(status_code=400, detail="No active verification code. Request a new one.")

    if datetime.now(timezone.utc) > record["expires_at"]:
        otp_store.pop(phone, None)
        raise HTTPException(status_code=400, detail="Verification code expired.")

    record["attempts"] += 1
    if record["attempts"] > 5:
        otp_store.pop(phone, None)
        raise HTTPException(status_code=429, detail="Too many attempts. Request a new code.")

    if not secrets.compare_digest(record["hash"], hash_otp(payload.otp)):
        raise HTTPException(status_code=400, detail="Incorrect verification code.")

    otp_store.pop(phone, None)

    # Temporary development response.
    # Replace with a signed JWT/session tied to a PostgreSQL user record.
    return {
        "access_token": secrets.token_urlsafe(32),
        "token_type": "bearer",
        "is_new_user": True,
        "user": {
            "phone": phone,
            "role": "citizen",
        },
    }
