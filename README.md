# Cue Tracker — Library Music Pipeline

A React + Vite app for library-music composers to move cues through a **pipeline**
(Need to Start → In Progress → Delivered) and into a **catalog** (Accepted → Aired,
or Available for repitching) — backed by [Supabase](https://supabase.com) for
authentication and data, with Row Level Security so each composer only sees their own cues.

This is a faithful rebuild of the original single-file prototype (which ran on
`localStorage` + optional Google Sheets sync), re-platformed onto React + Vite + Supabase.

## Features

- **Email/password auth** via Supabase, with protected routes and sign-out.
- **Pipeline (Kanban)** — cards move across Need to Start / In Progress / Delivered,
  grouped **By Show** or **By Batch**. Due dates show countdown / overdue coloring.
- **Delivered → Catalog** — accept a delivered cue into the catalog (publisher,
  exclusivity, registrations) or mark it "Not Placed" to move it to Available.
- **Catalog** — three tabs, each a sortable table:
  - **Accepted** — publisher, exclusivity, genre, TuneSat / ASCAP / On Disco toggles.
  - **Aired** — network, show, episode, first-air date (mark accepted cues as aired).
  - **Available** — key, BPM, duration, and a running **pitch history** (log pitches).
- **Stats bar** — totals across pipeline / accepted / aired / available + next due date.
- **CSV import / export** and **print** support.
- **Row Level Security aware** — every insert stamps `user_id`; reads are scoped to the
  signed-in user by your RLS policies.

## Tech stack

- [React 18](https://react.dev) + [Vite 5](https://vite.dev)
- [React Router 6](https://reactrouter.com) (auth gating)
- [@supabase/supabase-js](https://supabase.com/docs/reference/javascript) v2
- Plain CSS (Outfit font), no UI framework

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173, create an account, and start adding cues.

### Environment variables

Supabase connection details live in `.env` (already populated for this project):

```
VITE_SUPABASE_URL=https://kkubmqabtxpjdgampcnw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

The anon / "publishable" key is designed to be exposed in the browser, so committing it is
safe — Row Level Security is what protects the data. **Never** put the `service_role` /
secret key in a `VITE_`-prefixed variable; anything with that prefix is bundled into the client.

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite dev server            |
| `npm run build`   | Production build into `dist/`        |
| `npm run preview` | Preview the production build locally |

## Project structure

```
src/
├── lib/
│   ├── supabase.js       # Supabase client (reads env vars)
│   ├── constants.js      # Shows, publishers, statuses, key list, date helpers
│   └── mappers.js        # Row (snake_case) ↔ app cue/batch (camelCase) mapping
├── context/
│   └── AuthContext.jsx   # Session state + auth helpers
├── components/
│   ├── ProtectedRoute.jsx
│   ├── StatsBar.jsx
│   ├── PipelineView.jsx  # Kanban board + cue cards
│   ├── CatalogView.jsx   # Accepted / Aired / Available tables
│   └── modals.jsx        # Add / Edit / Accept / Aired / Reject / Pitch modals
└── pages/
    ├── Login.jsx
    └── Dashboard.jsx      # Header, nav, data layer (Supabase CRUD), CSV import/export
```

## Data model & status vocabulary

The `status` column drives the whole workflow. Values used:

| Group    | Statuses                                       |
| -------- | ---------------------------------------------- |
| Pipeline | `need-to-start`, `in-progress`, `delivered`    |
| Catalog  | `accepted`, `aired`, `available`               |

Column mapping (`cues`): `title`, `status`, `show`, `genre`, `publisher`, `exclusivity`,
`tunesat`, `ascap`, `on_disco`, `air_network`, `air_show`, `air_episode`, `first_air_date`,
`musical_key`, `bpm`, `duration`, `pitched_to` (**jsonb**), `notes`, `due_date`, `batch_id`.
The app maps these to camelCase internally (`tuneSat`, `onDisco`, `dueDate`, `pitchedTo`, …).

`batches`: `name`, `sign_up`, `deliver`.

### Assumptions worth confirming against your schema

1. **`user_id` column** — both tables are assumed to have a `user_id` (referencing
   `auth.users`). Every insert stamps it so your `WITH CHECK (auth.uid() = user_id)` policy
   passes. If it's named differently or defaults to `auth.uid()`, adjust `src/lib/mappers.js`.
2. **`pitched_to` is `jsonb`** — stored as an array of `{ id, publisher, date, notes }`.
3. **`tunesat` / `ascap` / `on_disco` are booleans**; **`bpm`** is numeric; date columns
   (`due_date`, `first_air_date`, `sign_up`, `deliver`) are `date`.
4. The Dashboard tries to `order` cues by a `created_at` column and silently falls back to an
   unordered fetch if you don't have one — add `created_at timestamptz default now()` for
   stable ordering.

Recommended RLS policy (per table):

```sql
alter table cues enable row level security;

create policy "Users manage their own cues"
  on cues for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

> The original had `SHOWS` and `PUBLISHERS` hard-coded (Below Deck, The Challenge, etc.);
> those live in `src/lib/constants.js` — edit them to match your own shows and publishers.
