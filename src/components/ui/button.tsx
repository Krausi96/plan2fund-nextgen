import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none ring-offset-background " +
  "active:scale-95 transform",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primaryHover shadow-md hover:shadow-lg",
        secondary: "bg-surface text-primary border-2 border-primary hover:bg-surfaceAlt shadow-sm hover:shadow-md",
        outline: "border border-border text-textSecondary hover:bg-surfaceAlt hover:border-border",
        ghost: "text-textSecondary hover:bg-surfaceAlt",
        success: "bg-success text-white hover:opacity-90 shadow-md hover:shadow-lg",
        danger: "bg-error text-white hover:opacity-90 shadow-md hover:shadow-lg",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        default: "h-11 px-6 text-base",
        lg: "h-12 px-8 text-lg",
        xl: "h-14 px-10 text-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

