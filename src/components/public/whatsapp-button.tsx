import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * WhatsApp enquiry button — a plain anchor styled in WhatsApp green.
 * Opens the wa.me draft in a new tab; the customer still presses Send.
 */

type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

interface WhatsAppButtonProps {
  href: string;
  label?: string;
  size?: Size;
  className?: string;
  variant?: "solid" | "outline";
}

export function WhatsAppButton({
  href,
  label = "Enquire on WhatsApp",
  size = "md",
  className,
  variant = "solid",
}: WhatsAppButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (opens WhatsApp in a new tab)`}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]",
        variant === "solid"
          ? "bg-[#25D366] text-white hover:bg-[#1fb95a] active:scale-[0.98]"
          : "border border-[#25D366]/50 bg-transparent text-[#128C4B] hover:bg-[#25D366]/10",
        sizeClasses[size],
        className,
      )}
    >
      <MessageCircle className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
      {label}
    </a>
  );
}
