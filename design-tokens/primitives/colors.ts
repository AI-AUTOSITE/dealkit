// design-tokens/primitives/colors.ts
export const colors = {
  // Neutral scale (gray)
  neutral50: '#FAFAFA',
  neutral100: '#F4F4F5',
  neutral200: '#E4E4E7',
  neutral300: '#D4D4D8',
  neutral400: '#A1A1AA',
  neutral500: '#71717A',
  neutral600: '#52525B',
  neutral700: '#3F3F46',
  neutral800: '#27272A',
  neutral900: '#18181B',
  neutral950: '#09090B',
  
  // Dark backgrounds
  dark50: '#1C1C1F',
  dark100: '#141416',
  dark200: '#0A0A0B',
  
  // Primary (Indigo/Purple)
  primary50: '#EEF2FF',
  primary100: '#E0E7FF',
  primary200: '#C7D2FE',
  primary300: '#A5B4FC',
  primary400: '#818CF8',
  primary500: '#6366F1',
  primary600: '#4F46E5',
  primary700: '#4338CA',
  primary800: '#3730A3',
  primary900: '#312E81',
  
  // Status - Success (Green)
  success50: '#ECFDF5',
  success100: '#D1FAE5',
  success200: '#A7F3D0',
  success300: '#6EE7B7',
  success400: '#34D399',
  success500: '#10B981',
  success600: '#059669',
  success700: '#047857',
  success800: '#065F46',
  success900: '#064E3B',
  
  // Status - Error (Red)
  error50: '#FEF2F2',
  error100: '#FEE2E2',
  error200: '#FECACA',
  error300: '#FCA5A5',
  error400: '#F87171',
  error500: '#EF4444',
  error600: '#DC2626',
  error700: '#B91C1C',
  error800: '#991B1B',
  error900: '#7F1D1D',
  
  // Status - Warning (Amber)
  warning50: '#FFFBEB',
  warning100: '#FEF3C7',
  warning200: '#FDE68A',
  warning300: '#FCD34D',
  warning400: '#FBBF24',
  warning500: '#F59E0B',
  warning600: '#D97706',
  warning700: '#B45309',
  warning800: '#92400E',
  warning900: '#78350F',
  
  // Status - Info (Blue)
  info50: '#EFF6FF',
  info100: '#DBEAFE',
  info200: '#BFDBFE',
  info300: '#93C5FD',
  info400: '#60A5FA',
  info500: '#3B82F6',
  info600: '#2563EB',
  info700: '#1D4ED8',
  info800: '#1E40AF',
  info900: '#1E3A8A',
  
  // Pipeline stage colors
  stagePitched: '#3B82F6',     // Blue
  stageNegotiating: '#8B5CF6', // Purple
  stageContracted: '#14B8A6',  // Teal
  stageInProgress: '#F59E0B',  // Orange
  stageDelivered: '#2563EB',   // Blue
  stageInvoiced: '#6B7280',    // Gray
  stagePaid: '#22C55E',        // Green
  
  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;