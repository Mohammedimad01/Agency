# Design system

## Principles
Minimal, premium, calm. Generous whitespace, subtle borders instead of heavy shadows, one accent colour, real data instead of decoration. Dashboards use small, dense, legible type; the public site uses an editorial serif for headlines.

## Tokens (`src/app/globals.css`)
- **Brand**: `--brand` / `--brand-foreground` from `src/config/site.ts` (default deep green `oklch(0.46 0.085 165)`), mapped to `--primary`. Change the brand colour in one place.
- **Neutrals**: cool grey scale for background, surface, muted, border, input.
- **Semantic**: success, warning, info, destructive; five chart colours derived from the brand.
- **Radius**: 8px base (`--radius`), with sm/md/lg/xl steps.
- **Dark mode**: full token set under `.dark` (toggle in the admin header; light is the default).

## Typography
Geist (UI), Geist Mono (labels, numbers in eyebrows) and Instrument Serif (public headlines, portal greeting). Tabular numerals (`.tabular`) for all money and counts.

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
