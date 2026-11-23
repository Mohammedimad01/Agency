import Link from "next/link";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  href: string;
  kind: "deadline" | "milestone" | "task";
}

/** Month calendar of project deadlines, milestones and tasks (server-rendered, URL-driven). */
export function ProjectCalendar({ month, events, baseHref }: { month: Date; events: CalendarEvent[]; baseHref: string }) {
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) });
  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of events) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]);
  const nav = (d: Date) => `${baseHref}${baseHref.includes("?") ? "&" : "?"}month=${format(d, "yyyy-MM")}`;
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h2 className="text-sm font-semibold">{format(month, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" asChild aria-label="Previous month">
            <Link href={nav(addMonths(month, -1))}>
              <ChevronLeft />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={nav(new Date())}>Today</Link>
          </Button>
          <Button variant="ghost" size="icon-sm" asChild aria-label="Next month">
            <Link href={nav(addMonths(month, 1))}>
              <ChevronRight />
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b text-[11.5px] font-medium text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-2 py-1.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const list = byDay.get(key) ?? [];
          return (
            <div key={key} className={cn("min-h-28 border-b border-r p-1.5 [&:nth-child(7n)]:border-r-0", !isSameMonth(day, month) && "bg-muted/30 text-muted-foreground")}>
              <span className={cn("inline-flex size-6 items-center justify-center rounded-full text-[12px]", isToday(day) && "bg-primary font-semibold text-primary-foreground")}>
                {format(day, "d")}
              </span>
              <ul className="mt-1 grid gap-1">
                {list.slice(0, 4).map((e) => (
                  <li key={`${e.kind}-${e.id}`}>
                    <Link
                      href={e.href}
                      className={cn(
                        "block truncate rounded px-1.5 py-0.5 text-[11.5px]",
                        e.kind === "deadline" && "bg-destructive/10 text-destructive",
                        e.kind === "milestone" && "bg-primary/10 text-primary",
                        e.kind === "task" && "bg-muted text-foreground",
                      )}
                      title={e.title}
                    >
                      {e.title}
                    </Link>
                  </li>
                ))}
                {list.length > 4 ? <li className="px-1.5 text-[11px] text-muted-foreground">+{list.length - 4} more</li> : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
