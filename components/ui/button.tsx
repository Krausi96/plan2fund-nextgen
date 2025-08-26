import * as React from "react"

export function Button({ children, onClick, className = "", type = "button" }: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  type?: "button" | "submit" | "reset"
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={\px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition \\}
    >
      {children}
    </button>
  )
}
