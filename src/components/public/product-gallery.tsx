"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { ProductImageDto } from "@/types";

/**
 * Product detail gallery — large main frame with thumbnail strip below.
 * Click / keyboard navigable; images keep the full furniture item in frame
 * (object-contain per PRD §4 image rules).
 */
export function ProductGallery({ images, productName }: { images: ProductImageDto[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];
  const mainSrc = active ? mediaUrl(active.imageKey) : null;

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground">
        <span className="flex flex-col items-center gap-2 text-sm">
          <ImageOff className="h-8 w-8" aria-hidden />
          No photos yet
        </span>
      </div>
    );
  }

  const step = (direction: 1 | -1) => {
    setActiveIndex((index) => (index + direction + images.length) % images.length);
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-border bg-card sm:aspect-square">
        { }
        <img
          src={mainSrc ?? ""}
          alt={active.altText ?? productName}
          className="h-full w-full object-cover"
        />
        {images.length > 1 ? (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => step(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => step(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur"
              aria-label="Next photo"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="scrollbar-slim flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product photos">
          {images.map((image, index) => (
            <button
              key={image.id}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Photo ${index + 1} of ${images.length}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:h-20 sm:w-20",
                index === activeIndex ? "border-primary" : "border-transparent hover:border-border",
              )}
            >
              { }
              <img
                src={mediaUrl(image.imageKey) ?? ""}
                alt={image.altText ?? `${productName} thumbnail ${index + 1}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
