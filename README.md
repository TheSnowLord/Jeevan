# Jeevan

Jeevan is a full-stack healthcare routing platform. This starter contains the responsive Liquid Glass authentication experience and a FastAPI authentication API designed to be expanded by the team.

## Stack

- Frontend: React + TypeScript + Vite
- Styling: CSS with a reusable Liquid Glass design system
- Backend: FastAPI
- Database-ready architecture: PostgreSQL configuration included
- Authentication: phone number + OTP flow
- OTP: development mode included; replace with an SMS provider for production

## Run locally

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The frontend expects the API at `http://localhost:8000`.

For production, set `VITE_API_URL` to the deployed API URL.

## Authentication flow

1. Citizen enters Indian mobile number.
2. Frontend calls `POST /api/auth/request-otp`.
3. Backend creates a short-lived OTP.
4. Development mode logs the OTP to the backend console.
5. User enters the OTP.
6. Frontend calls `POST /api/auth/verify-otp`.
7. Backend returns an authenticated development session and whether the user is new.

Before production, replace the development OTP sender and session implementation with a proper SMS provider and secure session/JWT strategy.

## Important

The hospital skyline and medical icon are rendered in HTML/CSS/SVG so the page remains responsive and sharp on phones, tablets and desktop screens.
