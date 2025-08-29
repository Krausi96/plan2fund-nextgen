import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-base font-semibold transition focus:outline-none focus:ring-4",
  {
    variants: {
      variant: {
        primary:
          "text-white bg-[linear-gradient(135deg,#7bc4ff_0%,#9f7cff_100%)] shadow-soft hover:shadow-glow focus:ring-[rgba(77,163,255,0.25)]",
        outline:
          "text-brand-700 ring-1 ring-brand-300 bg-white hover:bg-brand-50 focus:ring-[rgba(77,163,255,0.2)]",
        subtle:
          "text-brand-800 bg-brand-50 hover:bg-brand-100",
      },
      size: {
        sm: "px-4 py-2",
        md: "px-5 py-3",
        lg: "px-6 py-3.5 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface CTAButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const CTAButton = React.forwardRef<HTMLButtonElement, CTAButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
CTAButton.displayName = "CTAButton";
