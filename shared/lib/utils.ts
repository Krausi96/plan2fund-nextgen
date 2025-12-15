// Shared UI / utility helpers

// Tailwind-friendly className combiner (similar to clsx)
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

