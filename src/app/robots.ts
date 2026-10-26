import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/**
 * robots.txt — the public site is crawlable; the admin CMS and API are not
 * (they also send X-Robots-Tag noindex via the admin metadata).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
