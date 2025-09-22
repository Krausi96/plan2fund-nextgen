/**
 * Label Component
 * A label for form inputs
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface LabelProps {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  required?: boolean;
}

export function Label({ 
  children, 
  className, 
  htmlFor, 
  required = false 
}: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}
