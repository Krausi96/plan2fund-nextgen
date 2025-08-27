import * as React from "react"

type Variant = "default" | "outline" | "ghost" | "destructive"

export function Button({
  children,
  onClick,
  className = "",
  type = "button",
  disabled = false,
  variant = "default",
  asChild = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  type?: "button" | "submit" | "reset"
  disabled?: boolean
  variant?: Variant
  asChild?: boolean
}) {
  let base = "px-4 py-2 rounded-xl font-semibold transition focus:outline-none"
  let styles = ""

  switch (variant) {
    case "outline":
      styles = "border border-gray-400 text-gray-700 bg-transparent hover:bg-gray-100"
      break
    case "ghost":
      styles = "bg-transparent text-gray-600 hover:bg-gray-100"
      break
    case "destructive":
      styles = "bg-red-600 text-white hover:bg-red-700"
      break
    default:
      styles = "bg-blue-600 text-white hover:bg-blue-700"
  }

  if (disabled) {
    styles = "bg-gray-400 text-gray-200 cursor-not-allowed"
  }

  if (asChild) {
    return <span className={\\ \ \\}>{children}</span>
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={\\ \ \\}
    >
      {children}
    </button>
  )
}
