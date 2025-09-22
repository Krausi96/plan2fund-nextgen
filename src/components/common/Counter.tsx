import { motion } from "framer-motion";
import { useState, useEffect, memo } from "react";
import { useReducedMotion } from "framer-motion";

interface CounterProps {
  value: number;
  label: string;
  description?: string;
  className?: string;
  delay?: number;
}

export const Counter = memo(function Counter({ 
  value, 
  label, 
  description, 
  className = "",
  delay = 0 
}: CounterProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (hasAnimated) return;
    
    const timer = setTimeout(() => {
      const increment = value / 50;
      if (count < value) {
        setCount(prev => Math.min(prev + increment, value));
      } else {
        setHasAnimated(true);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [count, value, hasAnimated]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      viewport={{ once: true }}
      className={`text-center ${className}`}
    >
      <div className="text-3xl font-bold text-primary-600 mb-2">
        {shouldReduceMotion ? value : Math.floor(count)}+
      </div>
      <div className="text-neutral-600 font-medium">{label}</div>
      {description && (
        <div className="text-sm text-neutral-500 mt-1">{description}</div>
      )}
    </motion.div>
  );
});
