import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">404</p>
      <h1 className="mt-4 font-display text-5xl tracking-tight">Page not found</h1>
      <p className="mt-3 max-w-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
      <Button className="mt-8" asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
