# StudyPilot

StudyPilot is an AI-assisted study planner that turns a student’s actual workload and availability into a calendar of realistic study sessions. It is intentionally built around scheduling logic, data boundaries, and useful feedback—not a generic task list with a chat box attached.

## What it does

- Creates and manages courses with priority, color, instructor, and grade targets.
- Tracks assignments, projects, readings, quizzes, and exams with remaining effort, difficulty, progress, and deadlines.
- Generates availability-aware study sessions in 45–90 minute blocks, including 15-minute recovery breaks.
- Scores work using deadline urgency, remaining workload, difficulty, task priority, progress, and assessment type.
- Shows a polished dashboard, weekly calendar, analytics, course progress, deadline risk, and in-app feedback.
- Supports manual calendar moves, completion, and deletion. Regeneration replaces only prior generated sessions so it does not duplicate a plan.
- Provides a context-aware assistant that uses only the supplied course/task summary. When `OPENAI_API_KEY` is unavailable, it gives deterministic, data-based guidance.
- Includes Auth.js credentials authentication, secure password hashing, user-scoped REST endpoints, relational PostgreSQL models, and input validation with Zod.

## Technology

- **Application:** Next.js App Router, React, TypeScript
- **Styling:** Responsive design system in modern CSS custom properties and component-level class architecture
- **Database:** PostgreSQL + Prisma
- **Authentication:** Auth.js / NextAuth credentials provider + `bcryptjs`
- **AI:** OpenAI API (optional), with backend JSON validation and deterministic fallback
- **Validation:** Zod
- **Testing:** Vitest unit tests + Playwright end-to-end tests

## Architecture

```text
src/
  app/                 Next.js pages and HTTP route handlers
  components/          Dashboard, calendar, management, insights, navigation UI
  lib/
    scheduler.ts       Deterministic scoring + availability-aware allocation engine
    ai-plan.ts         Safe optional LLM enrichment of fixed, valid session slots
    assistant.ts       Context-minimized AI/fallback study coach
    validation.ts      Shared Zod request contracts
    prisma.ts          Prisma client singleton
  auth.ts              Auth.js configuration
prisma/
  schema.prisma        Relational data model and indexes
  seed.ts              Realistic CSE/MATH/HIST demo account and data
e2e/                   Browser-level user journeys
```

The scheduler determines dates and durations. If an OpenAI key is present, the model only enriches those already-valid slots with an actionable activity and a short rationale. Its JSON is checked with Zod and every returned identifier and time is matched against the deterministic result before it can be used. This keeps an LLM from generating impossible or duplicate events.

## Scheduling approach

Every incomplete task receives a score:

```text
urgency (inverse days remaining)
+ difficulty × 4
+ priority × 4
+ capped remaining-workload signal
+ exam/quiz boost
+ low-progress boost
```

Tasks are sorted by that score, then allocated across the next 14 days only where a weekly availability window allows it. Existing sessions and specifically blocked periods are excluded. The allocator caps focus blocks at 90 minutes, avoids tiny fragments by requiring a 45-minute minimum, and leaves 15-minute breaks between blocks. If time is insufficient, it returns task IDs that remain unscheduled so the UI can tell the student they need more availability.

## Database model

The Prisma schema includes `User`, `Course`, `Task`, `Availability`, `BlockedTime`, `StudySession`, and `Notification`, plus Auth.js account/session models. Key isolation and query-performance details:

- Every student-owned model has a `userId` foreign key with cascading ownership.
- Courses are unique per user/code; task and session queries are indexed by user and time.
- Course and task API handlers obtain the authenticated user and always scope both reads and writes to that user.
- Task creation confirms that the target course belongs to the current user.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and supply a PostgreSQL connection:

   ```bash
   cp .env.example .env.local
   ```

3. Generate the database client, migrate, and add realistic demo data:

   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visitors see the public landing page; they can sign in, create an account, or choose the clearly labeled `/demo` experience. Demo mode uses service-free in-memory seed data, is never an authenticated account, and exits back to the landing page. After database seeding, an Auth.js demo account is also available at `demo@studypilot.app` / `DemoPass123!` for authentication testing.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | for persistence | PostgreSQL connection string used by Prisma |
| `AUTH_SECRET` | for deployed auth | Long, random Auth.js signing secret |
| `AUTH_URL` | usually omit | Auth.js v5 infers the request origin on Vercel; only set this for a non-standard base path, never to `localhost` in production |
| `OPENAI_API_KEY` | optional | Enables validated AI activity/rationale enrichment and assistant answers |

Never commit `.env.local` or place secrets in client-side code.

## API surface

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/study-plan` | Validates planner data and creates deterministic or AI-enriched structured sessions |
| `POST` | `/api/assistant` | Answers a study question using minimal supplied planning context |
| `GET`, `POST` | `/api/courses` | Authenticated, user-scoped course operations |
| `GET`, `POST` | `/api/tasks` | Authenticated, user-scoped task operations |
| `POST` | `/api/auth/register` | Validated account registration with a bcrypt hash |

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

The unit suite verifies deadline-based prioritization, credential authorization, registration hashing, authenticated-route protection, and availability-aware session splitting. The Playwright suite covers the unauthenticated landing page, explicit demo entry/exit, demo scheduling, auth-page navigation, and protected API behavior.

## Deployment

Deploy to Vercel, Railway, Render, or another Node.js host with a managed PostgreSQL database. Configure `DATABASE_URL` and one strong, stable `AUTH_SECRET` in every environment that authenticates users, then run `prisma migrate deploy` during release. On Vercel, Auth.js uses forwarded host headers and HTTPS secure cookies; leave `AUTH_URL` unset unless the deployment uses a non-standard base path. For production reminders, attach a queue or cron job to query `Task` and `StudySession` records and create `Notification` records; the schema is already structured for this addition.
