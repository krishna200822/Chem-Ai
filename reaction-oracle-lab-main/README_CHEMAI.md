# ChemAI

AI-powered chemistry reaction intelligence frontend and Gemini-backed starter API.

## Gemini API key

The key belongs in the **backend**, never in the browser frontend.

1. Open `backend/.env.example`.
2. Set `GEMINI_API_KEY` in your local/server environment.
3. Install `backend/requirements.txt`.
4. Run `backend/app.py`.
5. Point the frontend API base at your deployed backend.

For local browser-only development, the frontend currently defaults to `/api`, so configure your production reverse proxy or change `window.CHEMAI_CONFIG.API_BASE_URL` before deployment.

## Important

Do not commit `.env`, API keys, or secret credentials to GitHub.
