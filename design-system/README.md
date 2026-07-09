# Placed — Design System

The source-of-truth component library for **Placed** (*From Pitched to Placed*).
Each `.html` file here is a self-contained preview "card" that mirrors the real
styles in `src/index.css`, so the design system and the shipping app stay in sync.

## Structure

```
design-system/
├── foundations/
│   ├── colors.html        Brand, semantic & neutral color tokens
│   ├── typography.html    Outfit type scale & labels
│   └── elevation.html     Corner radii & shadow tokens
├── components/
│   ├── buttons.html       Primary, blue, outline, ghost, semantic, icon, sizes
│   ├── forms.html         Inputs, selects, labels, field rows, checkbox
│   ├── navigation.html    Primary nav, catalog tabs, pill groups
│   ├── stats.html         Segmented KPI summary row
│   ├── cue-card.html      Pipeline kanban card
│   ├── kanban.html        Pipeline board columns
│   ├── table.html         Catalog data table
│   ├── badges.html        Status pills, tags, check states, source cards
│   ├── modal.html         Dialog + inline batch creator
│   └── feedback.html      Alerts, empty states, spinner
└── brand/
    ├── logo.html          Placed logo lockup
    └── auth.html          Sign-in surface
```

## How it syncs with Claude Design

These files are mirrored to the **Placed Design System** project at
[claude.ai/design](https://claude.ai/design). Each file's first line carries a
`<!-- @dsCard group="…" name="…" -->` marker that Claude Design reads to build
the browsable card index.

Workflow (via the `/design-sync` skill in Claude Code):

1. Edit a component here **or** iterate visually in claude.ai/design.
2. `/design-sync` reconciles the two — one component at a time, never a
   wholesale replace.
3. When a token or component changes, reflect it in `src/index.css` so the app
   ships the same look.

## Design tokens

All values trace back to the `:root` block in `src/index.css`:

| Token | Value | Use |
|-------|-------|-----|
| `--blue` | `#4a60dc` | Primary brand / info |
| `--orange` | `#e88a3a` | Primary CTA |
| `--green` | `#16a34a` | Success / accepted |
| `--red` | `#dc2626` | Danger / overdue |
| `--purple` | `#7c3aed` | Accent (sources) |
| `--radius` / `--radius-sm` | `12px` / `8px` | Cards / controls |
| `--shadow*` | see file | Elevation |

Font: **Outfit** (400–900).
