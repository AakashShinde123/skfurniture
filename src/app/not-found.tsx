import Link from "next/link";
import { Armchair, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 404 page — real 404 responses for missing/unpublished products (PRD §9).
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary">
        <SearchX className="h-8 w-8" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">404 — not found</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">This page has moved out</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          The page or product you are looking for does not exist or is no longer available. Browse
          the catalogue instead — there is plenty to see.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild className="gap-2">
          <Link href="/catalogue">
            <Armchair className="h-4 w-4" aria-hidden /> Browse furniture
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
