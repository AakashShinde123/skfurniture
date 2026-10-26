import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { Providers } from "@/components/providers";
import { getSessionUser } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

/** Session-guarded on every request — never prerendered. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Shop CMS — Admin",
  noIndex: true, // The CMS must never appear in search results.
});

/**
 * Guarded admin layout. The session is validated server-side on every
 * navigation (cookie presence alone is not trusted); unauthenticated visitors
 * are redirected to the login page before any admin content renders.
 */
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <Providers>
      <AdminShell user={{ name: user.name, username: user.username }}>{children}</AdminShell>
    </Providers>
  );
}
