// design-tokens/themes/light.ts
import { colors } from '../primitives/colors';

export const lightTheme = {
  // Backgrounds
  background: colors.white,
  backgroundSurface: colors.neutral50,
  backgroundSurfaceRaised: colors.white,
  backgroundOverlay: 'rgba(0,0,0,0.5)',
  
  // Text
  textPrimary: colors.neutral950,
  textSecondary: colors.neutral600,
  textTertiary: colors.neutral400,
  textDisabled: colors.neutral300,
  textInverse: colors.neutral100,
  
  // Borders
  borderSubtle: colors.neutral200,
  borderDefault: colors.neutral300,
  borderStrong: colors.neutral400,
  borderFocus: colors.primary500,
  
  // Interactive
  interactivePrimary: colors.primary600,
  interactivePrimaryHover: colors.primary700,
  interactivePrimaryPressed: colors.primary800,
  
  // Status backgrounds (light mode)
  statusPaidBg: colors.success100,
  statusPaidText: colors.success800,
  statusOverdueBg: colors.error100,
  statusOverdueText: colors.error800,
  statusNegotiatingBg: colors.primary100,
  statusNegotiatingText: colors.primary800,
  statusPendingBg: colors.info100,
  statusPendingText: colors.info800,
  statusDraftBg: colors.neutral100,
  statusDraftText: colors.neutral600,
  
  // Pipeline stages (same in both themes)
  stagePitched: colors.stagePitched,
  stageNegotiating: colors.stageNegotiating,
  stageContracted: colors.stageContracted,
  stageInProgress: colors.stageInProgress,
  stageDelivered: colors.stageDelivered,
  stageInvoiced: colors.stageInvoiced,
  stagePaid: colors.stagePaid,
} as const;