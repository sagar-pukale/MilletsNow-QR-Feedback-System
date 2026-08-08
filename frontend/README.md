# MilletsNow QR Feedback & Product Traceability — Frontend

Phase 1 provides the production frontend foundation only. No product UI,
backend integration, authentication, API endpoints, QR logic, or business logic
is included.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer

## Commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

Application code lives in `src`, imports can use the `@/` alias, Tailwind CSS is
loaded from `src/styles/globals.css`, and shadcn/ui is configured through
`components.json`.
