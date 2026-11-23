"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/shared/form";

const PRESETS = [
  ["1m", "This month"],
  ["3m", "Last 3 months"],
  ["6m", "Last 6 months"],
  ["12m", "Last 12 months"],
  ["ytd", "Year to date"],
  ["24m", "Last 24 months"],
  ["custom", "Custom range"],
] as const;

export function ReportFilters({ preset, from, to, section }: { preset: string; from: string; to: string; section: string }) {
  const router = useRouter();
  const [p, setP] = useState(preset);
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const go = (np: string, nf = f, nt = t) => router.push(`/admin/reports?section=${section}&preset=${np}&from=${nf}&to=${nt}`);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect aria-label="Date range" className="h-8 w-44" value={p} onChange={(e) => { setP(e.target.value); if (e.target.value !== "custom") go(e.target.value); }}>
        {PRESETS.map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </NativeSelect>
      {p === "custom" ? (
        <>
          <Input type="date" className="h-8 w-36" value={f} onChange={(e) => setF(e.target.value)} aria-label="From" />
          <Input type="date" className="h-8 w-36" value={t} onChange={(e) => setT(e.target.value)} aria-label="To" />
          <Button size="sm" variant="outline" onClick={() => go("custom")}>
            Apply
          </Button>
        </>
      ) : null}
    </div>
  );
}
