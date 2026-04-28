# ORT Math Platform — Frontend

React 19 + Vite + Tailwind CSS 4 + KaTeX + Framer Motion

## Quick Start

```bash
npm install
npm run dev
```

Opens at http://localhost:3000

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 (Vite 6) |
| Styling | Tailwind CSS 4 |
| Math | KaTeX (instant LaTeX rendering) |
| State | Zustand |
| API | Axios with JWT interceptors |
| Animation | Framer Motion |
| Icons | Lucide React |

## Pages

- `/login` — Register / Login (JWT)
- `/dashboard` — Bento grid stats + topic cards
- `/practice?topic=1` — Quiz interface with timer + LaTeX
- `/analytics` — Coming soon
- `/errors` — Coming soon

## Architecture

```
src/
├── components/
│   ├── layout/     — Sidebar, AppLayout, ProtectedRoute
│   ├── math/       — MathText (KaTeX wrapper)
│   └── ui/         — Reusable UI components
├── hooks/          — useTopics, useStats
├── pages/          — Login, Dashboard, Quiz
├── services/       — api.js (Axios + JWT interceptor)
├── store/          — authStore (Zustand)
└── lib/            — utils (cn helper)
```
