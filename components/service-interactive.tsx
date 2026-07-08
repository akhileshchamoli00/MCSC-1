"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

export function MotionDiv({ children, ...props }: HTMLMotionProps<"div">) {
  return <motion.div {...props}>{children}</motion.div>;
}

export function MotionP({ children, ...props }: HTMLMotionProps<"p">) {
  return <motion.p {...props}>{children}</motion.p>;
}

export function TocButton({ 
  targetId, 
  children 
}: { 
  targetId: string; 
  children: ReactNode;
}) {
  const handleScroll = () => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <button
      onClick={handleScroll}
      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm md:text-base font-medium group text-left w-full"
    >
      {children}
    </button>
  );
}
