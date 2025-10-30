"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to listen for media query changes.
 * @param query - Example: "(min-width: 1024px)"
 * @returns boolean - true if query matches, false otherwise
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);

    // Cleanup on unmount
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}
