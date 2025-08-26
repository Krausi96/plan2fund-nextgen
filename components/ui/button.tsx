import * as React from "react"

export function Button({ children, onClick, className = "", type = "button", disabled = false }: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  type?: "button" | "submit" | "reset"
  disabled?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={\px-4 py-2 rounded-xl font-semibold transition
        \
        \\}
    >
      {children}
    </button>
  )
}
