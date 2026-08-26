# ArchOS Gemini Command Center

A standalone Gemini-powered reasoning surface built inside the ArchOS repository.

## Architecture

```text
Browser / React UI
       |
       v
Express /api/reason gateway
       |
       v
Google AI Studio -> Gemini
       |
       v
Verified reasoning output
```

The Gemini API key stays server-side. The browser never receives `GEMINI_API_KEY`.

## Run locally

From this directory:

```bash
npm install
copy .env.example .env
```

Set `GEMINI_API_KEY` in `.env` using a key created in Google AI Studio, then run:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Design boundary

This app is deliberately a model gateway and experience prototype. It does not allow the model to execute consequential actions directly. Future ArchOS integration should route proposed actions through the existing governance and ActionGate layers.
