// design-tokens/primitives/typography.ts
// NOTE: These are design-system reference values.
// Screen-level fontSize is imported from lib/theme.tsx (which uses different values).
// components/ui/Text.tsx uses its own variantStyles.
// Do NOT mix these with lib/theme.tsx fontSize imports.
export const fontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;