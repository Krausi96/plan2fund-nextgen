import { ReactNode, ButtonHTMLAttributes } from "react"

type ButtonProps = {
  children: ReactNode
  variant?: "default" | "outline"
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ children, variant = "default", ...props }: ButtonProps) {
  const base = "px-4 py-2 rounded"
  const styles =
    variant === "outline"
      ? "border border-gray-400 text-gray-800 bg-white"
      : "bg-blue-600 text-white"
  return (
    <button {...props} className={base + " " + styles + " " + (props.className || "")}>
      {children}
    </button>
  )
}
