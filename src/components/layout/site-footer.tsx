import Link from "next/link";
import { Clock, Facebook, Instagram, MapPin, MessageCircle, Phone, Youtube } from "lucide-react";
import type { SiteSettingsDto } from "@/types";

/**
 * Premium dark footer — brand, promise list, quick links, contact details
 * and social links. Content is fully driven by CMS settings.
 */

const SOCIALS = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "youtube", label: "YouTube", icon: Youtube },
] as const;

export function SiteFooter({ settings }: { settings: SiteSettingsDto }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-espresso text-ivory/75">
      {/* WhatsApp CTA band */}
      <div className="border-b border-white/10">
        <div className="container-site flex flex-col items-start justify-between gap-5 py-10 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow text-gold">Get in touch</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ivory sm:text-3xl">
              Planning a new corner of your home?
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ivory/60">
              Share your requirement on WhatsApp — we&apos;ll suggest designs, sizes and an honest quote the same day.
            </p>
          </div>
          <a
            href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${settings.shopName}, I would like to enquire about your furniture.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 border border-gold/70 bg-gold/10 px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold hover:text-espresso"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Chat on WhatsApp
          </a>
        </div>
      </div>

      <div className="container-site grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center bg-ivory/10 text-ivory">
              <span className="absolute inset-[3px] border border-gold/60" aria-hidden />
              <span className="font-display text-sm font-semibold">SK</span>
            </span>
            <span className="font-display text-lg font-semibold tracking-[0.08em] text-ivory">
              SK FURNITURE
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ivory/55">
            {settings.tagline}. Every piece is built in our Mumbai workshop from seasoned solid wood — and signed by the artisan who made it.
          </p>
          <div className="flex items-center gap-2 pt-1">
            {SOCIALS.map(({ key, label, icon: Icon }) =>
              settings.socialLinks[key] ? (
                <a
                  key={key}
                  href={settings.socialLinks[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="border border-white/15 p-2.5 text-ivory/60 transition-colors hover:border-gold/60 hover:text-gold"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ) : null,
            )}
          </div>
        </div>

        {/* Explore */}
        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-gold">Explore</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/" className="transition-colors hover:text-gold">Home</Link></li>
            <li><Link href="/catalogue" className="transition-colors hover:text-gold">Our Collection</Link></li>
            <li><Link href="/about" className="transition-colors hover:text-gold">Our Craft & Story</Link></li>
            <li><Link href="/contact" className="transition-colors hover:text-gold">Visit the Showroom</Link></li>
            <li><Link href="/admin" className="text-ivory/35 transition-colors hover:text-gold">Shop owner login</Link></li>
          </ul>
        </div>

        {/* Promise */}
        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-gold">Our Promise</h3>
          <ul className="space-y-2.5 text-sm text-ivory/55">
            <li>100% seasoned solid wood</li>
            <li>5-year workmanship warranty</li>
            <li>Free delivery &amp; assembly</li>
            <li>Custom sizes &amp; fabrics</li>
            <li>{settings.serviceAreas}</li>
          </ul>
        </div>

        {/* Visit */}
        <div className="space-y-4 text-sm">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-gold">Visit Us</h3>
          <p className="flex items-start gap-2.5 text-ivory/55">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold/80" aria-hidden />
            <span>{settings.address}</span>
          </p>
          <p className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 shrink-0 text-gold/80" aria-hidden />
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="transition-colors hover:text-gold">{settings.phone}</a>
          </p>
          <p className="flex items-start gap-2.5 text-ivory/55">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold/80" aria-hidden />
            <span className="whitespace-pre-line">{settings.businessHours}</span>
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="container-site flex flex-col items-center justify-between gap-2 text-xs text-ivory/45 sm:flex-row">
          <p>© {year} {settings.shopName}. All rights reserved.</p>
          <p className="tracking-[0.18em] uppercase">Crafted with care in Mumbai</p>
        </div>
      </div>
    </footer>
  );
}
