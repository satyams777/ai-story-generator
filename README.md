# AI Business Analyst Agent

This repository contains a proof-of-concept AI-powered requirements analyzer built with Next.js and Tailwind CSS. Upload PDF/DOCX/text requirements and receive a structured project plan with summary, user stories, tasks, estimates, and diagrams.

## Key Features

- Extracts text from PDF and DOCX inputs
- Uses generative AI to analyze requirements and build project artifacts
- Displays results in a multi-tab dashboard
- Generates Mermaid diagrams for architecture and workflows
- Includes sample mock documents in `mock-docs/`

## Tech Stack

- Frontend: Next.js 14 App Router + Tailwind CSS
- Backend: Next.js API routes
- PDF parsing: `pdf-parse`
- DOCX parsing: `mammoth`
- AI: `@google/generative-ai`
- Diagrams: `mermaid`

## Getting Started

```bash
cd POC
npm install
cp .env.local.example .env.local
```

Then add your Gemini API key in `.env.local`.

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Project Structure

- `src/app/` — Next.js app pages and API routes
- `src/components/` — UI components and dashboard tabs
- `src/lib/` — requirement parsing, AI integration, and estimation logic
- `src/types/` — TypeScript definitions
- `mock-docs/` — sample documents for testing

## Environment

The app requires:

- `GEMINI_API_KEY`

Add it to `.env.local` after copying the example.

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Build production bundle
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## Notes

- Do not commit `.env.local`, `.next/`, or `node_modules/`
- Use `.env.local.example` as the template for environment variables
