"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants, Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import { TextShimmer } from "./text-shimmer";
import { specialGothic } from "@/app/fonts";

interface TextLoopProps {
  analyses: string[];
  className?: string;
  transition?: Transition;
  variants?: Variants;
  textColor?: string;
  textSize?: string;
}

export function TextLoop({
  analyses,
  className,
  transition = { duration: 0.4 },
  variants,
  textColor = "rgb(59, 130, 246)",
  textSize = "1rem",
}: TextLoopProps) {
  const [currentText, setCurrentText] = useState<string>("");

  // Update current text when analyses change
  useEffect(() => {
    if (analyses.length > 0) {
      setCurrentText(analyses[analyses.length - 1] ?? "");
    }
  }, [analyses]);

  const motionVariants: Variants = variants ?? {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };

  return (
    <div className={cn("relative h-11 w-full", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentText}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          variants={motionVariants}
          className={`absolute left-0 ${specialGothic.className}`}
          style={{
            fontSize: textSize,
            fontWeight: 400,
            color: textColor,
          }}
        >
          <TextShimmer
            className="text-lg ![--base-color:rgba(255,255,255,1)] ![--base-gradient-color:rgba(100,100,100,1)]"
            spread={1}
            duration={4}
          >
            {currentText}
          </TextShimmer>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
