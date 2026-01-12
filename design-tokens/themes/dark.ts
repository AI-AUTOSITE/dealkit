// design-tokens/themes/dark.ts
import { colors } from '../primitives/colors';

export const darkTheme = {
  // Backgrounds
  background: colors.dark200,
  backgroundSurface: colors.dark100,
  backgroundSurfaceRaised: colors.dark50,
  backgroundOverlay: 'rgba(0,0,0,0.7)',
  
  // Text
  textPrimary: colors.neutral100,
  textSecondary: colors.neutral400,
  textTertiary: colors.neutral500,
  textDisabled: colors.neutral600,
  textInverse: colors.neutral950,
  
  // Borders
  borderSubtle: colors.neutral800,
  borderDefault: colors.neutral700,
  borderStrong: colors.neutral600,
  borderFocus: colors.primary400,
  
  // Interactive
  interactivePrimary: colors.primary400,
  interactivePrimaryHover: colors.primary300,
  interactivePrimaryPressed: colors.primary500,
  
  // Status backgrounds (dark mode - more saturated)
  statusPaidBg: colors.success900,
  statusPaidText: colors.success400,
  statusOverdueBg: colors.error900,
  statusOverdueText: colors.error400,
  statusNegotiatingBg: '#4C1D95',
  statusNegotiatingText: colors.primary300,
  statusPendingBg: colors.info900,
  statusPendingText: colors.info400,
  statusDraftBg: colors.neutral800,
  statusDraftText: colors.neutral400,
  
  // Pipeline stages
  stagePitched: colors.stagePitched,
  stageNegotiating: colors.stageNegotiating,
  stageContracted: colors.stageContracted,
  stageInProgress: colors.stageInProgress,
  stageDelivered: colors.stageDelivered,
  stageInvoiced: colors.stageInvoiced,
  stagePaid: colors.stagePaid,
} as const;