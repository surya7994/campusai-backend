# CampusAI Backend

Node.js + Express starter backend for CampusAI.

## Run
1. Install Node.js 20+.
2. Copy `.env.example` to `.env` and change JWT_SECRET and owner credentials.
3. Run `npm install`.
4. Run `npm start`.
5. API runs at `http://localhost:4000` by default.

## Included
- Student signup and login
- Password hashing with bcrypt
- JWT authentication
- Owner-only routes
- Notes, assignments/tasks and community post APIs
- Local JSON storage for easy testing
- Placeholder `/api/ai` route for a future AI provider

For production, replace `data.json` with PostgreSQL/Supabase/another database, restrict CORS to your frontend domain, use HTTPS, add rate limiting and validation, and keep all secrets server-side.
