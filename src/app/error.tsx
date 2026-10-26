"use client";

import { useEffect } from "react";
import { RefreshCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Global error boundary — renders a friendly recovery screen instead of a
 * raw stack trace, and logs the error for the dev console / server logs.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled UI error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <TriangleAlert className="h-8 w-8" aria-hidden />
      </span>
      <div>
        <h1 className="font-display text-3xl font-semibold">Something went wrong</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          An unexpected error interrupted this page. Retrying usually fixes it — if it keeps
          happening, please contact the shop.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground/70" role="note">
            Error ref: {error.digest}
          </p>
        ) : null}
      </div>
      <Button onClick={reset} className="gap-2">
        <RefreshCcw className="h-4 w-4" aria-hidden /> Try again
      </Button>
    </div>
  );
}
