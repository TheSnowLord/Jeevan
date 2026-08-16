# Jeevan integration notes

This branch establishes the authentication foundation.

## Frontend handoff

The login UI lives in `frontend/src/App.tsx` and `frontend/src/styles.css`.

When teammates build the main product:
- keep `/login` as the authentication entry route;
- move the authenticated application into a dashboard route such as `/dashboard`;
- replace the temporary `window.location.href = "/dashboard"` with the team's router;
- reuse the CSS variables in `styles.css` as the base Jeevan design tokens.

## Backend handoff

The auth API currently has:
- `GET /health`
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`

The OTP store and returned token are intentionally development-only. Before public deployment:
- use PostgreSQL/Redis for OTP/session persistence;
- connect an approved SMS provider;
- issue secure, signed access/refresh tokens or server sessions;
- add rate limiting;
- add persistent user records and role-based access control;
- use HTTPS;
- restrict CORS to the real frontend origin.
