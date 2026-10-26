"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dashboard stat tile — value, label, accent tone and deep-link into the
 * filtered admin list it summarises.
 */

const TONES = {
  default: "bg-primary/10 text-primary",
  success: "bg-[#25D366]/12 text-[#128C4B]",
  warning: "bg-amber-500/12 text-amber-600",
  danger: "bg-destructive/10 text-destructive",
} as const;

export function StatCard({
  label,
  value,
  icon,
  href,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", TONES[tone])}>
          {icon}
        </span>
        <span className="font-display text-3xl font-bold tabular-nums">{value}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-muted-foreground group-hover:text-foreground">{label}</p>
    </Link>
  );
}

export type { LucideIcon };
