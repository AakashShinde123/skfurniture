import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Providers } from "@/components/providers";
import { getSettings } from "@/services/settings.service";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

/**
 * Public shell reads site settings on every request (CMS-driven header,
 * footer, announcement). Per-request rendering keeps CMS edits instantly
 * visible and keeps the production build free of database access.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata({
    title: settings.defaultSeoTitle,
    description: settings.defaultSeoDescription,
  });
}

/**
 * Public site shell — announcement bar, sticky header, page content and
 * footer. Settings are fetched server-side on every request so CMS changes
 * appear immediately (no stale cache).
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        {settings.announcementText ? (
          <div className="bg-espresso px-4 py-2 text-center text-[13px] font-medium tracking-wide text-ivory/90">
            <span className="mr-2 inline-block h-1.5 w-1.5 rotate-45 bg-gold" aria-hidden />
            {settings.announcementText}
          </div>
        ) : null}
        <SiteHeader settings={settings} />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={settings} />
      </div>
    </Providers>
  );
}
