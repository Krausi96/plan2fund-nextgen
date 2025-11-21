import { ReactNode } from "react"
import { cn } from "@/shared/lib/utils"

type BadgeVariant =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "default"
  | "secondary";

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: BadgeVariant;
}

export function Badge({ children, className, variant = "neutral" }: BadgeProps) {
  const baseClasses =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight";

  const variantClasses: Record<BadgeVariant, string> = {
    neutral: "bg-neutral-100 text-neutral-700",
    info: "bg-primary-100 text-primary-700",
    success: "bg-success/15 text-success",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-error/15 text-error",
    default: "bg-neutral-100 text-neutral-700",
    secondary: "bg-primary-100 text-primary-700",
  };

  return (
    <span className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </span>
  );
}

