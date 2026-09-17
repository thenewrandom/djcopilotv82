<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5f12a67f-3b7f-4a27-ad3d-9c582f78fea4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Personal Voice Personas

DJ Copilot can create a personal AI DJ voice persona from a clear recording/upload. Configure `ELEVENLABS_API_KEY` as a **server-side Vercel Environment Variable**. The browser never receives the API key. Personal persona metadata and the provider voice ID are saved in the browser so the new voice remains available in the AI DJ Persona selector on that device.

For the cleanest instant clone, use roughly 1–2 minutes of a single speaker with minimal background noise or room reverb.
