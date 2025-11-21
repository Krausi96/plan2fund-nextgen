import { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/shared/lib/utils"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={cn("card", className)} {...props}>
      {children}
    </div>
  )
}

