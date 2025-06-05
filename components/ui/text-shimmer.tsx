"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextShimmerProps {
  children: string;
  className?: string;
  spread?: number;
  duration?: number;
}

export function TextShimmer({
  children,
  className,
  spread = 1,
  duration = 4,
}: TextShimmerProps) {
  return (
    <motion.div
      className={cn("inline-block", className)}
      initial={{ opacity: 0.7 }}
      animate={{
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
