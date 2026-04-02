<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Aura Map

Aura Map now uses a Netlify Function (`/.netlify/functions/gemini-echo`) to call Gemini so the deploy-time `GEMINI_API_KEY` stays server-side.

## Local Development

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Create `.env` from `.env.example` and set `GEMINI_API_KEY`
3. Run with Netlify Functions enabled: `npx netlify dev`

## Netlify Deployment

1. Add `GEMINI_API_KEY` in Netlify Site Settings -> Environment Variables
2. Deploy normally (build command: `npm run build`, publish directory: `dist`)
# aura-map
