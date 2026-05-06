# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Paramedic Learnings is a knowledge platform for ambulance personnel: capture and improve operational guidance ("topics") with AI-assisted analysis and human approval. This is a course project — the infrastructure is wired up but the domain features are unimplemented. The backlog is in `docs/user-stories.md`.

## Commands

```bash
# Start local Postgres (port 15432)
docker compose up -d

# Install dependencies
npm install

# Dev server
npm run dev

# Lint
npm run lint

# Build
npm run build

# Database migrations (after editing src/db/schema.ts)
npx drizzle-kit generate
npx drizzle-kit migrate

# Type check
npm run type-check

# Tests
npm run test
```

## Environment Setup

Create a `.env.local` file in the project root:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:15432/paramedic_learnings
```

The Docker Compose setup creates the database automatically when you run `docker compose up -d`.

## Architecture

**Next.js App Router** — all pages live under `src/app/`. Use the file-system routing conventions: `src/app/topics/page.tsx` for list pages, `src/app/topics/[id]/page.tsx` for detail pages. Server Components are the default; only add `"use client"` when browser APIs or interactivity require it.

**Database layer** — `src/db/schema.ts` is where all Drizzle table definitions go (currently empty). `src/db/index.ts` exports `db`, a typed Drizzle client connected to Postgres via `DATABASE_URL`. Migrations are generated into `./drizzle/` with `drizzle-kit generate` and applied with `drizzle-kit migrate`. The default Docker Postgres URL is `postgresql://postgres:postgres@localhost:15432/paramedic_learnings`.

**Server Actions / API Routes** — prefer Next.js Server Actions (inline `async` functions with `"use server"`) for form submissions and mutations. Use Route Handlers (`src/app/api/`) when you need a plain HTTP endpoint (e.g., for AI callback webhooks).

**Validation** — use Zod at all system boundaries: form inputs, API request bodies, and AI response parsing.

**AI integration** — the user stories require Claude (Anthropic SDK) for source summarization, topic suggestion, and conflict flagging. Use the `claude-api` skill when adding AI features.

**Styling** — Tailwind CSS v4 via PostCSS. Follow the existing slate color palette and `max-w-4xl` container width established in `src/app/layout.tsx`.

## Domain Model (to be built)

Key entities from `docs/user-stories.md`:
- **Topic** — operational guidance with title, summary, guidance text, owner, and version history
- **TopicVersion** — immutable snapshots of guidance; one is marked current
- **Source** — submitted evidence (debrief report, research finding) with a `sourceType`
- **ChangeProposal** — draft update linking a topic to one or more sources; can be approved or rejected
- **Subscription** — (stretch) links a user to a topic for notifications

Build Story 1 first — every other story depends on topics existing in the database.

## Gotchas

- **Database migrations fail**: If migrations are out of sync, reset with `docker compose down -v && docker compose up -d`, then re-run `npx drizzle-kit migrate`
- **Hot reload not working**: Restart the dev server with `npm run dev`; Drizzle schema changes sometimes need a full restart
- **TypeScript errors after schema changes**: Run `npm run type-check` to regenerate types before building
