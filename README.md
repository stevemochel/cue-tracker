# Cue Tracker

A React + Vite app for library-music composers to track their cues, batches, and
placements — backed by [Supabase](https://supabase.com) for authentication and data.

## Features

- **Email/password auth** via Supabase (sign up, sign in, sign out), with protected routes.
- **Cues** — full CRUD in a searchable, filterable table. Filter by status, batch, or free-text
  search across title / show / genre / publisher / pitched-to.
- **Batches** — CRUD with sign-up and deliver dates, shown as cards with a live cue count.
- **Row Level Security aware** — every insert stamps the row with the signed-in user's `id`, and
  reads only return the current user's rows (enforced by your RLS policies).

## Tech stack

- [React 18](https://react.dev) + [Vite 5](https://vite.dev)
- [React Router 6](https://reactrouter.com)
- [@supabase/supabase-js](https://supabase.com/docs/reference/javascript) v2
- Plain CSS (no UI framework dependency)

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

### Environment variables

Supabase connection details live in `.env` (already populated for this project):

```
VITE_SUPABASE_URL=https://kkubmqabtxpjdgampcnw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

The anon / "publishable" key is designed to be exposed in the browser, so committing it is safe —
Row Level Security is what actually protects the data. **Never** put the `service_role` / secret key
in a `VITE_`-prefixed variable; anything with that prefix is bundled into the client.

If you point this at a different Supabase project, copy `.env.example` to `.env` and update the values.

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
│   └── constants.js      # Status / exclusivity / musical-key option lists
├── context/
│   └── AuthContext.jsx   # Session state + auth helpers
├── components/
│   ├── ProtectedRoute.jsx
│   ├── Layout.jsx        # Top bar + nav shell
│   ├── Modal.jsx
│   ├── CueForm.jsx       # Add/edit a cue (all columns)
│   └── BatchForm.jsx     # Add/edit a batch
└── pages/
    ├── Login.jsx
    ├── Cues.jsx          # Cue table, filters, CRUD
    └── Batches.jsx       # Batch cards, CRUD
```

## Database schema assumptions

The app expects two tables with RLS enabled.

**`cues`** — `title`, `status`, `show`, `genre`, `publisher`, `exclusivity`, `tunesat`, `ascap`,
`on_disco`, `air_network`, `air_show`, `air_episode`, `first_air_date`, `musical_key`, `bpm`,
`duration`, `pitched_to`, `notes`, `due_date`, `batch_id`.

**`batches`** — `name`, `sign_up`, `deliver`.

A few assumptions worth confirming against your actual schema:

1. **`user_id` column** — both tables are assumed to have a `user_id` column (referencing
   `auth.users`). The app sets it to the signed-in user on every insert so your RLS
   `WITH CHECK (auth.uid() = user_id)` policy passes. If your column has a different name (or a
   `DEFAULT auth.uid()`), adjust `CueForm.jsx` / `BatchForm.jsx` accordingly.
2. **`tunesat`, `ascap`, `on_disco` are treated as booleans** (checkboxes in the form). If any of
   these are actually text/number columns in your database, change the corresponding input in
   `CueForm.jsx` and the coercion in its `toPayload()` helper.
3. **`bpm` is treated as a number** and **date fields** (`first_air_date`, `due_date`, `sign_up`,
   `deliver`) as `date` columns.

Recommended RLS policy shape (per table):

```sql
alter table cues enable row level security;

create policy "Users manage their own cues"
  on cues for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```
