"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isAtSignal: boolean;
  waitStart: number | null;
}

export function SignalIndicator({ isAtSignal, waitStart }: Props) {
  const [waitSeconds, setWaitSeconds] = useState(0);

  useEffect(() => {
    if (!isAtSignal || !waitStart) {
      setWaitSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setWaitSeconds(Math.floor((Date.now() - waitStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAtSignal, waitStart]);

  return (
    <AnimatePresence>
      {isAtSignal && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.9 }}
          className="flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-full px-3 py-1.5 mt-2"
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-warning"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <span className="text-xs font-semibold text-warning">
            Signal wait · {waitSeconds}s
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
