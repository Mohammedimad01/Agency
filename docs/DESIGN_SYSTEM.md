# Design system

## Principles
Minimal, premium, calm. Generous whitespace, subtle borders instead of heavy shadows, one accent colour, real data instead of decoration. Dashboards use small, dense, legible type; the public site uses an editorial serif for headlines.

## Tokens (`src/app/globals.css`)
- **Brand**: `--brand` / `--brand-foreground` from `src/config/site.ts` (default deep green `oklch(0.46 0.085 165)`), mapped to `--primary`. Change the brand colour in one place.
- **Neutrals**: cool grey scale for background, surface, muted, border, input.
- **Semantic**: success, warning, info, destructive; five chart colours derived from the brand.
- **Radius**: 8px base (`--radius`), with sm/md/lg/xl steps.
- **Dark mode**: full token set under `.dark` (toggle in the admin header; light is the default).

## Public website identity
- **Colours**: `--ink` (near-black green) for dark sections, header CTA and footer; `--signal` (lime) for the primary public CTA and accent words on dark; `--paper` for warm off-white panels. Utilities: `bg-ink`, `text-ink-foreground`, `text-signal`, `bg-paper`.
- **Type**: Bricolage Grotesque (`.font-display`, weight 600, tight tracking) for headlines; a single Instrument Serif italic word (`font-serif italic`) as an accent per headline.
- **Imagery**: code-built product examples in `components/public/visuals.tsx` (browser, invoice, search result, traffic, AI answer), always labelled "Example". No stock photos, no invented client logos or metrics.
- **Sections**: `Section`, `SectionIntro`, `Eyebrow` (numbered mono label) and `PageHero` in `components/public/section.tsx`; `tone="dark"` gives a rounded ink panel.

## Typography
Geist (UI), Geist Mono (labels, numbers in eyebrows), Bricolage Grotesque (public display headlines) and Instrument Serif (italic accents, portal greeting). Tabular numerals (`.tabular`) for all money and counts.

## Components
Primitives (`components/ui`): Button, Input, Textarea, Label, Select, Checkbox, Switch, Badge, Card, Dialog, AlertDialog, Sheet, DropdownMenu, Popover, Tooltip, Tabs, Table, Progress, Skeleton, Avatar, Command, Toaster.
Shared (`components/shared`): PageHeader + Breadcrumbs, TabNav (URL-driven), DataTable (search, facet filters, sorting, pagination), StatusBadge (+ status maps in `lib/status.ts`), StatCard, EmptyState, Field/NativeSelect/SubmitButton, FormDialog, ConfirmAction, FileUploader, charts (area, bar, donut), NotificationBell, UserMenu, ActivityFeed, LineItemsTable, Logo.

## UX rules
- Every list has an empty state; every destructive action is confirmed; every mutation gives toast feedback.
- Forms validate on the client (Zod) and on the server; server field errors are mapped back to fields; labels are programmatically linked to controls.
- Status is always shown as a badge with consistent colour semantics across admin and portal.
- Kanban boards support drag-and-drop and a keyboard-accessible status selector.
- Layouts work from 360px wide; the admin sidebar collapses (and becomes a sheet on mobile); tables scroll horizontally inside their card, never the page.
- `prefers-reduced-motion` disables animations.
