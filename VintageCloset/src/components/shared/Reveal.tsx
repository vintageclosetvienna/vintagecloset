'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'none';
  delay?: number;
  duration?: number;
  className?: string;
  width?: 'fit-content' | '100%';
}

export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.55,
  className,
  width = 'fit-content',
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 20 : direction === 'down' ? -20 : 0,
      x: direction === 'left' ? 20 : direction === 'right' ? -20 : 0,
      scale: direction === 'scale' ? 0.95 : 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: duration,
        delay: delay,
        ease: "easeOut" as const,
      },
    },
  };

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={cn(width === "100%" ? "w-full" : "w-fit", className)}
    >
      {children}
    </motion.div>
  );
}


