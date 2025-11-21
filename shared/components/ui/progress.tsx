type ProgressIntent = "primary" | "success" | "warning" | "neutral"
type ProgressSize = "xs" | "sm" | "md"

interface ProgressProps {
  value: number
  intent?: ProgressIntent
  size?: ProgressSize
}

const intentMap: Record<ProgressIntent, string> = {
  primary: "bg-primary-500",
  success: "bg-success",
  warning: "bg-accent-500",
  neutral: "bg-neutral-400",
}

const sizeMap: Record<ProgressSize, string> = {
  xs: "h-0.5",
  sm: "h-1.5",
  md: "h-2.5",
}

export function Progress({ value, intent = "primary", size = "md" }: ProgressProps) {
  return (
    <div className={`w-full rounded-full bg-neutral-200 ${sizeMap[size]}`}>
      <div
        className={`${intentMap[intent]} rounded-full transition-all`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: "100%" }}
        aria-hidden="true"
      />
    </div>
  )
}

