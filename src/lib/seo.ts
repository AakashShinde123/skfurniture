import type { Metadata } from "next";
import { env } from "@/lib/env";

/**
 * SEO metadata helpers — one place that knows how canonical URLs, Open Graph
 * tags and title templates are assembled for both public and CMS pages.
 */

export interface SeoInput {
  title: string;
  description?: string | null;
  path?: string; // e.g. "/catalogue" — "" for the homepage
  images?: string[]; // absolute or app-relative URLs
  noIndex?: boolean;
}

export function absoluteUrl(path: string): string {
  if (!path) return env.siteUrl;
  if (path.startsWith("http")) return path;
  return `${env.siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function buildMetadata(input: SeoInput): Metadata {
  const { title, description, path = "", images, noIndex } = input;
  const url = absoluteUrl(path);

  return {
    title,
    description: description ?? undefined,
    alternates: noIndex ? undefined : { canonical: url },
    openGraph: noIndex
      ? undefined
      : {
          title,
          description: description ?? undefined,
          url,
          siteName: env.siteUrl,
          type: "website",
          images: images?.length ? images.map((image) => absoluteUrl(image)) : undefined,
        },
    twitter: noIndex
      ? undefined
      : {
          card: "summary_large_image",
          title,
          description: description ?? undefined,
          images: images?.length ? images.map((image) => absoluteUrl(image)) : undefined,
        },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}
