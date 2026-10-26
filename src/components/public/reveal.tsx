"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Scroll-into-view reveal — subtle fade + rise used across homepage sections.
 * Hand-rolled IntersectionObserver (predictable across jump-scrolls and
 * embeds, no animation-library internals) with reduced-motion support.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      // Legacy environment — reveal content without waiting for scrolling.
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -60px 0px", threshold: 0.05 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={
        (className ? className + " " : "") +
        "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] " +
        "motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100 " +
        (shown ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0")
      }
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
