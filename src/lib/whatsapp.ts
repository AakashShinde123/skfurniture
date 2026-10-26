import { env } from "@/lib/env";
import { formatPrice } from "@/lib/constants";

/**
 * WhatsApp Click-to-Chat link builder.
 *
 * Builds the prefilled enquiry message from the actual product record and the
 * WhatsApp number configured in CMS settings. The customer still presses
 * Send — nothing is submitted automatically.
 */

export interface WhatsAppProductInfo {
  name: string;
  sku: string;
  price?: number | null;
  slug: string;
}

export function buildWhatsAppUrl(number: string, message: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildGeneralEnquiryUrl(number: string, shopName: string): string {
  const message = [
    `Hello ${shopName}!`,
    "",
    "I would like to know more about your furniture collection.",
  ].join("\n");
  return buildWhatsAppUrl(number, message);
}

export function buildProductEnquiryUrl(options: {
  number: string;
  product: WhatsAppProductInfo;
}): string {
  const { number, product } = options;

  const lines: string[] = [
    "Hello! I'm interested in this furniture product.",
    "",
    `Product: ${product.name}`,
    `Product Code: ${product.sku}`,
  ];

  const price = formatPrice(product.price);
  if (price) {
    lines.push(`Price: ${price}`);
  }

  lines.push(`Product page: ${env.siteUrl}/products/${product.slug}`);
  lines.push("");
  lines.push("Please share availability, colour options and delivery details.");

  return buildWhatsAppUrl(number, lines.join("\n"));
}
