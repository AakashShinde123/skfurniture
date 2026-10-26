"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { SiteSettingsDto } from "@/types";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/catalogue", label: "Collection" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

interface SiteHeaderProps {
  settings: SiteSettingsDto;
}

/** Serif "SK" monogram tile with an inset gold frame. */
function BrandMark() {
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center bg-primary text-primary-foreground">
      <span
        className="absolute inset-[3px] border border-gold/60"
        aria-hidden
      />
      <span className="font-display text-sm font-semibold tracking-wide">SK</span>
    </span>
  );
}

export function SiteHeader({ settings }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container-site flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3" aria-label={`${settings.shopName} — home`}>
          <BrandMark />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold tracking-[0.08em] sm:text-xl">
              SK FURNITURE
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground sm:block">
              Solid Wood · Since 1998
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative py-2 text-[13px] font-medium uppercase tracking-[0.16em] text-foreground/70 transition-colors hover:text-foreground",
                "after:absolute after:inset-x-0 after:-bottom-0 after:h-px after:bg-gold after:origin-left after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100",
                isActive(link.href) && "text-foreground after:scale-x-100",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="hidden rounded-none border-primary/30 px-5 font-medium tracking-wide sm:inline-flex"
          >
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>
              <Phone className="h-4 w-4" aria-hidden />
              {settings.phone}
            </a>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile navigation">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-sm font-medium uppercase tracking-[0.14em] hover:bg-secondary",
                      isActive(link.href) && "bg-secondary",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="my-3 h-px bg-border" />
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                  <Phone className="h-4 w-4" aria-hidden /> {settings.phone}
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
