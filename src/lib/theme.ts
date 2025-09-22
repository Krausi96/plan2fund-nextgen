// Brand Color Palette - Updated with unified design tokens
export const colors = {
  // Primary brand colors
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  
  // Accent colors
  accent: '#F59E0B',
  
  // Background colors
  background: '#FFFFFF',
  backgroundAlt: '#F9FAFB',
  
  // Surface colors
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280', // Improved contrast for WCAG AA
  
  // Border colors
  border: '#E5E7EB',
  
  // Semantic colors - Improved contrast for WCAG AA
  success: '#059669', // Darker green for better contrast
  warning: '#D97706', // Darker orange for better contrast
  error: '#DC2626', // Darker red for better contrast
  
  // Extended palette for compatibility
  primaryPalette: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main blue - matches primary
    600: '#2563eb', // Primary blue - matches primaryHover
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  accentPalette: {
    50: '#fef3c7',
    100: '#fde68a',
    200: '#fcd34d',
    300: '#fbbf24',
    400: '#f59e0b', // Main accent
    500: '#d97706',
    600: '#b45309',
    700: '#92400e',
    800: '#78350f',
    900: '#451a03',
  },
  neutral: {
    50: '#f9fafb', // backgroundAlt
    100: '#f3f4f6', // surfaceAlt
    200: '#e5e7eb', // border
    300: '#d1d5db',
    400: '#9ca3af', // textMuted
    500: '#6b7280',
    600: '#4b5563', // textSecondary
    700: '#374151',
    800: '#1f2937',
    900: '#111827', // textPrimary
  },
  semantic: {
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#3B82F6',
  }
} as const;

// Typography Scale - Updated with unified design tokens
export const typography = {
  fontFamily: {
    heading: "'Inter', sans-serif",
    body: "'Source Sans Pro', sans-serif",
    monospace: "'Roboto Mono', monospace",
    // Legacy compatibility
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    // Extended scale for compatibility
    '6xl': '60px',
  },
  lineHeight: {
    tight: '1.2',
    snug: '1.35',
    normal: '1.5',
    relaxed: '1.7',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

// Spacing Scale - Updated with unified design tokens
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  // Extended scale for compatibility
  '3xl': '64px',
  '4xl': '96px',
  '5xl': '128px',
} as const;

// Border Radius - Updated with unified design tokens
export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '24px',
  // Extended scale for compatibility
  none: '0',
  '2xl': '32px',
  '3xl': '48px',
  full: '9999px',
} as const;

// Shadows - Updated with unified design tokens
export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.1)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
  // Extended scale for compatibility
  xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
  '2xl': '0 25px 50px -12px rgba(0,0,0,0.25)',
} as const;

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Motion/Animation Tokens
export const motion = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  spring: {
    gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// Component Variants - Updated with unified design tokens
export const componentVariants = {
  button: {
    primary: 'bg-primary text-white hover:bg-primaryHover shadow-md hover:shadow-lg',
    secondary: 'bg-surface text-primary border-2 border-primary hover:bg-surfaceAlt',
    outline: 'border border-border text-textSecondary hover:bg-surfaceAlt',
    ghost: 'text-textSecondary hover:bg-surfaceAlt',
    success: 'bg-success text-white hover:opacity-90 shadow-md hover:shadow-lg',
    warning: 'bg-warning text-white hover:opacity-90 shadow-md hover:shadow-lg',
    error: 'bg-error text-white hover:opacity-90 shadow-md hover:shadow-lg',
  },
  card: {
    base: 'bg-surface rounded-lg shadow-sm border border-border p-6',
    hover: 'hover:shadow-md hover:border-border transition-all duration-200',
    elevated: 'bg-surface rounded-lg shadow-lg border border-border p-6',
  },
} as const;