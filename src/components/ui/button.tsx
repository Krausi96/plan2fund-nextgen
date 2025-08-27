import { ReactNode, ButtonHTMLAttributes } from "react"

export function Button({ children, ...props }: { children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props}>{children}</button>
}
