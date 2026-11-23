"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building, FileText, FolderKanban, Inbox, Receipt, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { globalSearch, type SearchHit } from "@/features/search/actions";
import type { AdminNavItem } from "@/config/admin-nav";

const ICON = { lead: Inbox, client: Building, project: FolderKanban, invoice: Receipt, proposal: FileText };

export function CommandSearch({ nav }: { nav: AdminNavItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [pending, start] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(() => start(async () => setHits(await globalSearch(query))), 180);
    return () => clearTimeout(t);
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };
  const pages = nav.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-full max-w-sm items-center gap-2 rounded-md border bg-background px-2.5 text-[13px] text-muted-foreground shadow-xs hover:bg-accent/50"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search clients, projects, invoices…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[10.5px] sm:inline">⌘K</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0" size="md">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <Command shouldFilter={false}>
            <CommandInput placeholder="Type to search…" value={query} onValueChange={setQuery} />
            <CommandList>
              <CommandEmpty>{pending ? "Searching…" : "No results."}</CommandEmpty>
              {hits.length ? (
                <CommandGroup heading="Records">
                  {hits.map((h) => {
                    const Icon = ICON[h.type];
                    return (
                      <CommandItem key={`${h.type}-${h.id}`} value={`${h.type}-${h.id}`} onSelect={() => go(h.href)}>
                        <Icon />
                        <span className="truncate">{h.title}</span>
                        {h.subtitle ? <span className="ml-auto truncate text-xs text-muted-foreground">{h.subtitle}</span> : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : null}
              {pages.length ? (
                <CommandGroup heading="Go to">
                  {pages.slice(0, 8).map((p) => (
                    <CommandItem key={p.href} value={p.href} onSelect={() => go(p.href)}>
                      {p.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
