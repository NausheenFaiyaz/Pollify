# Pollify

Pollify is a full-stack polling platform where creators can build polls, collect responses, and view analytics in real time.

## Live Demo

- Deployed App: https://lets-pollify.vercel.app/
- YouTube Demo: https://www.youtube.com/watch?v=6F8q_JEHs3I

It supports:
- Anonymous polls
- Authenticated polls
- Mixed mode (anonymous + authenticated)
- Live updates via WebSockets
- OIDC login with automatic refresh-token based session continuation

## Custom OIDC Authentication

Pollify uses my own custom OpenID Connect-compatible auth provider:

- **TokenShinobi OIDC Service**: `https://token-shinobi.onrender.com/`

Pollify uses Authorization Code + PKCE on the client side, then exchanges code on the backend and stores refresh tokens in secure HTTP-only cookies.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB + Mongoose
- **Realtime**: Socket.IO
- **Validation**: Zod
- **Authentication**: OIDC (TokenShinobi), JWT verification via JWKS (`jose`)

## Core Features

## 1. Poll Creation
- Create multi-question polls.
- Each question supports:
- Single-choice answers
- 2 to 10 options
- Required/optional mode
- Poll-level settings:
- Response mode: `anonymous` | `authenticated` | `both`
- Expiry date/time
- Quick expiry pills: `5 min`, `15 min`, `30 min`, `1 hr`, `1 day`, `7 days`

## 2. Response Collection
- Public shareable link per poll (`/poll/:slug`)
- One response per authenticated user per poll
- One response per anonymous browser session per poll
- Required-question validation before submit
- Poll expiry enforcement on backend

## 3. Analytics and Results
- Creator analytics dashboard
- Question-wise option counts and percentages
- Participation breakdown:
- Total responses
- Anonymous responses
- Authenticated responses
- Live analytics update through Socket.IO

## 4. Publishing Flow
- Creators can publish a poll to show final results.
- If poll is expired and user is creator, creator can still view results.

## 5. Authentication and Session Management
- Login through my own TokenShinobi OIDC service.
- Authorization Code exchange done server-side (`/api/auth/oidc/exchange`).
- Access token used in `Authorization: Bearer ...`.
- Refresh token stored in HTTP-only cookie (`ps_refresh_token`) scoped to `/api/auth`.
- Automatic refresh using `/api/auth/refresh`.
- Supports both token shapes from OIDC responses:
- `accessToken` / `refreshToken`
- `access_token` / `refresh_token`
- Silent session restore in the app (no forced login every 15 minutes).
- Redirects back to originating page after login (including public poll URLs).

## 6. UI/UX Enhancements
- Route/page transition animations
- Smooth card/section entry transitions
- Mobile hamburger menu for navigation:
- Dashboard
- Create Poll
- Login/Logout
- Auth gate copy and flow improvements

## Project Structure

```txt
Pollify/
  client/                  # React app
    src/
      api/                 # Axios client + refresh interceptors
      auth/                # OIDC + token helpers
      pages/               # Route pages
      ui/                  # Shared UI components
  server/                  # Express API + sockets
    src/
      config/              # DB connection
      controllers/         # Route handlers
      middleware/          # Auth, error handling, async wrappers
      models/              # Poll, Response, User schemas
      routes/              # Auth + Poll routes
      services/            # Analytics service
      socket/              # Socket event wiring
```

## API Overview

Base URL: `${VITE_API_URL}/api`

Auth:
- `POST /auth/oidc/exchange` - Exchange OIDC authorization code + PKCE verifier
- `POST /auth/refresh` - Rotate access token using refresh cookie
- `POST /auth/logout` - Clear refresh cookie
- `GET /auth/me` - Get current user profile

Polls:
- `POST /polls` - Create poll (auth required)
- `GET /polls/mine` - List creator’s polls
- `GET /polls/:slug/analytics` - Poll analytics (owner only)
- `PATCH /polls/:slug/publish` - Publish poll (owner only)
- `GET /polls/public/:slug` - Public poll details
- `POST /polls/public/:slug/respond` - Submit public response

Health:
- `GET /health`

## Environment Variables

## Server (`server/.env`)

Required:

- `PORT` (default: `8080`)
- `MONGO_URI`
- `CLIENT_URL` (comma-separated allowed origins, e.g. `http://localhost:5173`)
- `OIDC_CLIENT_ID`
- `OIDC_CLIENT_SECRET`
- `OIDC_REDIRECT_URI` (must match your client callback URL)
- `OIDC_AUDIENCE` (OIDC client identifier used when verifying access token)

Optional (has defaults in code):

- `OIDC_ISSUER_URL` (default: `https://token-shinobi.onrender.com`)
- `OIDC_JWKS_URI` (default: `${OIDC_ISSUER_URL}/certs`)
- `OIDC_TOKEN_ENDPOINT` (default: `https://token-shinobi.onrender.com/token`)

## Client (`client/.env`)

- `VITE_API_URL` (example: `http://localhost:8080`)
- `VITE_SOCKET_URL` (example: `http://localhost:8080`)
- `VITE_OIDC_ISSUER` (example: `https://token-shinobi.onrender.com`)
- `VITE_OIDC_CLIENT_ID`
- `VITE_OIDC_REDIRECT_URI` (example: `http://localhost:5173/auth/callback`)

## Local Development

## 1. Clone and install

```bash
git clone <your-repo-url>
cd Pollify
cd server && npm install
cd ../client && npm install
```

## 2. Configure environment files

Create:
- `server/.env`
- `client/.env`

Use the variable list above.

## 3. Start backend

```bash
cd server
npm run dev
```

Server runs on `http://localhost:8080` by default.

## 4. Start frontend

```bash
cd client
npm run dev
```

Client runs on `http://localhost:5173` by default.

## Scripts

## Client
- `npm run dev` - Start Vite dev server
- `npm run build` - Type-check and production build
- `npm run preview` - Preview production build

## Server
- `npm run dev` - Start server in watch mode with `tsx`
- `npm run build` - Compile TypeScript
- `npm run start` - Run compiled server from `dist`

## Security Notes

- Access tokens are not stored in cookies; refresh tokens are stored in HTTP-only cookies.
- Refresh cookie settings adapt for localhost vs production:
- Localhost: `sameSite=lax`, non-secure
- Production: `sameSite=none`, secure
- Rate limiting and helmet are enabled on backend.

## Current Product Flow

1. User signs in through TokenShinobi.
2. Pollify exchanges auth code and stores refresh token cookie.
3. User creates and shares poll.
4. Responders submit answers based on poll response mode.
5. Creator monitors dashboard analytics and can publish final results.

## Roadmap Ideas

- Multi-select question type
- Scheduled publish/unpublish
- CSV export for responses
- Poll templates
- Team workspaces and role-based access

---

Built with care using my own custom OIDC stack powered by **TokenShinobi**:  
`https://token-shinobi.onrender.com/`
