import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "secondary" | "outline";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  const baseClasses = "px-2 py-1 rounded text-xs font-medium";
  
  const variantClasses = {
    default: "bg-gray-200 text-gray-800",
    destructive: "bg-red-100 text-red-800",
    secondary: "bg-blue-100 text-blue-800",
    outline: "border border-gray-300 text-gray-800"
  };
  
  return (
    <span className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </span>
  );
}

