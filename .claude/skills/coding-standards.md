# Coding Standards

## TypeScript

- Strict mode on. No `any`. No `@ts-ignore` unless citing a specific upstream bug.
- Prefer `type` over `interface` for unions; `interface` for objects that may be extended.
- Explicit return types on all exported functions.
- `unknown` over `any` when type is genuinely unknown, then narrow it.

## React / Next.js

- Server Components by default. Add `'use client'` only when the component uses browser APIs, event handlers, or hooks.
- Named exports for all components. Default export only for `page.tsx` and `layout.tsx`.
- No class components.
- Colocate state as low as possible — don't hoist unless two siblings need the same state.
- Dynamic imports with `{ ssr: false }` for any library that touches `window` or `document`.

## Style

- Tailwind utility classes only — no CSS modules, no inline styles.
- No arbitrary Tailwind values (`w-[327px]`) unless pixel-perfect design requires it.
- Responsive classes: mobile-first (`sm:`, `md:`, `lg:`).

## Files

- One component per file.
- Filename matches the exported name (PascalCase for components, camelCase for lib).
- No barrel (`index.ts`) files — import directly.
