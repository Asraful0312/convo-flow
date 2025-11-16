"use client";

import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

interface AnimatedStatProps {
  finalValue: number;
  suffix?: string;
  duration?: number;
}

export function AnimatedStat({
  finalValue,
  suffix = "",
  duration = 1500,
}: AnimatedStatProps) {
  const [currentValue, setCurrentValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;

    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * finalValue);
      setCurrentValue(value);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCurrentValue(finalValue);
      }
    };

    requestAnimationFrame(step);
  }, [isInView, finalValue, duration]);

  return (
    <div ref={ref} className="text-3xl font-bold">
      {currentValue}
      {suffix}
    </div>
  );
}
