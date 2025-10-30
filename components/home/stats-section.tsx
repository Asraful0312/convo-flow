"use client";

import React, { useEffect, useState, useRef } from "react";
import { SlidingNumber } from "../ui/sliding-number";
import { motion, useInView } from "framer-motion";

const StatsSection = () => {
  const [completionRate, setCompletionRate] = useState(0);
  const [formSpeed, setFormSpeed] = useState(0);
  const [insights, setInsights] = useState(0);

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 }); // triggers once when 30% visible

  // 🎯 Animate when in view
  useEffect(() => {
    if (!isInView) return;

    let rateInterval: NodeJS.Timeout;
    let speedInterval: NodeJS.Timeout;
    let insightInterval: NodeJS.Timeout;

    // animate 60%
    rateInterval = setInterval(() => {
      setCompletionRate((v) => {
        if (v >= 60) {
          clearInterval(rateInterval);
          return 60;
        }
        return v + 1;
      });
    }, 20);

    // animate 80%
    speedInterval = setInterval(() => {
      setFormSpeed((v) => {
        if (v >= 80) {
          clearInterval(speedInterval);
          return 80;
        }
        return v + 1;
      });
    }, 15);

    // animate 10x (we’ll count up to 10)
    insightInterval = setInterval(() => {
      setInsights((v) => {
        if (v >= 10) {
          clearInterval(insightInterval);
          return 10;
        }
        return v + 1;
      });
    }, 100);

    return () => {
      clearInterval(rateInterval);
      clearInterval(speedInterval);
      clearInterval(insightInterval);
    };
  }, [isInView]);

  return (
    <section
      ref={ref}
      className="container mx-auto px-4 py-20 bg-muted/50 overflow-hidden"
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {/* 1️⃣ Completion Rate */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-2"
          >
            <div className="inline-flex items-center gap-1 text-4xl font-bold text-[#6366f1]">
              <SlidingNumber value={completionRate} />%
            </div>
            <div className="text-muted-foreground">Higher completion rate</div>
          </motion.div>

          {/* 2️⃣ Faster Form Creation */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-2"
          >
            <div className="text-4xl font-bold text-accent">
              {formSpeed}%
            </div>
            <div className="text-muted-foreground">Faster form creation</div>
          </motion.div>

          {/* 3️⃣ Better Insights */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-2"
          >
            <div className="text-4xl font-bold text-success">{insights}x</div>
            <div className="text-muted-foreground">Better insights</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
