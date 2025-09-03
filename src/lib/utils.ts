export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

// Feature flags (read from env with safe defaults)
export const featureFlags = {
  CHECKOUT_ENABLED: process.env.NEXT_PUBLIC_CHECKOUT_ENABLED === 'true',
  EXPORT_ENABLED: process.env.NEXT_PUBLIC_EXPORT_ENABLED === 'true',
  AI_ENABLED: process.env.NEXT_PUBLIC_AI_ENABLED === 'true',
}

export function useFeatureFlags() {
  return featureFlags
}
