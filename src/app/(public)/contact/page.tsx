import { Clock, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { buildGeneralEnquiryUrl } from "@/lib/whatsapp";
import { buildMetadata } from "@/lib/seo";
import { getSettings } from "@/services/settings.service";
import type { Metadata } from "next";

/** CMS-driven page: render per-request, never at build time. */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata({
    title: `Contact Us — ${settings.shopName}`,
    description: `Visit our showroom, call ${settings.phone} or send a WhatsApp enquiry. Address, opening hours and service areas.`,
    path: "/contact",
  });
}

/**
 * Contact page (PRD Page 5) — phone, WhatsApp, address, hours, service areas
 * and an embedded Google Map (the no-API-key embed of the configured link).
 */
export default async function ContactPage() {
  const settings = await getSettings();
  const whatsappHref = buildGeneralEnquiryUrl(settings.whatsappNumber, settings.shopName);

  // Derive an embeddable map URL from the configured maps link.
  const embedQuery = encodeURIComponent(settings.address);
  const embedUrl = `https://maps.google.com/maps?q=${embedQuery}&output=embed`;

  return (
    <div className="container-site py-10 sm:py-12">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Get in touch</p>
        <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Contact Us</h1>
        <p className="mt-3 text-muted-foreground">
          The fastest way to reach us is WhatsApp — share a product code or your requirement and we
          will reply within shop hours.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        {/* Contact details */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">{settings.shopName}</h2>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="mt-0.5 text-muted-foreground">{settings.address}</p>
                  <a
                    href={settings.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Open in Google Maps <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">Phone</p>
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="mt-0.5 block text-muted-foreground hover:text-primary">
                    {settings.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">Email</p>
                  <a href={`mailto:${settings.email}`} className="mt-0.5 block text-muted-foreground hover:text-primary">
                    {settings.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">Opening hours</p>
                  <p className="mt-0.5 whitespace-pre-line text-muted-foreground">{settings.businessHours}</p>
                </div>
              </li>
            </ul>

            <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5">
              <WhatsAppButton href={whatsappHref} label="Chat on WhatsApp" className="w-full" />
              <Button asChild variant="outline" className="w-full">
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>
                  <Phone className="h-4 w-4" aria-hidden /> Call the shop
                </a>
              </Button>
            </div>
          </div>

          <p className="rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Delivery areas:</span> {settings.serviceAreas}
          </p>
        </div>

        {/* Map */}
        <div className="overflow-hidden rounded-xl border border-border lg:col-span-3">
          <iframe
            title={`Map — ${settings.shopName}`}
            src={embedUrl}
            className="h-[420px] w-full lg:h-full lg:min-h-[560px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
