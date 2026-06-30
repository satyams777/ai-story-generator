# Architecture Decisions

## Routing

Next.js 14 App Router only. No Pages Router. API routes live in `src/app/api/*/route.ts`.

## Server vs Client boundary

| Concern | Where |
|---|---|
| File parsing (PDF, DOCX) | API route (server) |
| Gemini API calls | API route (server) |
| Mermaid rendering | Client component (browser SVG) |
| Tab state, upload state | Client component |
| Estimation logic | Server (pure function, no IO) |

## AI

- Model: `gemini-1.5-flash` (free tier, 15 RPM, 1M tokens/day).
- Single prompt per analysis — batch everything into one Gemini call to stay within rate limits.
- Response must be raw JSON. Strip markdown code fences before `JSON.parse`.
- Fallback: if Gemini quota hit, surface a clear error; do not silently fail.

## File upload

- `FormData` POST to `/api/analyze`.
- Max file size: 10 MB (enforced in route).
- Accepted types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`.
- Use `pdf-parse/lib/pdf-parse.js` (not the index) to avoid the test-file require issue in Next.js.

## Storage

No external database. Analysis results live in React state only — no persistence between sessions in the POC.

## Export

Browser `window.print()` with `@media print` stylesheet. No server-side PDF generation needed for POC.

## Environment

`GEMINI_API_KEY` must be set in `.env.local`. App will throw at startup if missing.
