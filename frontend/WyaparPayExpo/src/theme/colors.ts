/**
 * WyaparPay Color Theme - "Warm Tech"
 * Professional yet approachable design system
 */

export const colors = {
  // Primary Colors - Orange-Red Gradient (matching website)
  primary: {
    main: '#F97316', // Orange-500 - main actions, CTAs (matches website)
    light: '#FB923C', // Orange-400 - hover states
    dark: '#EA580C', // Orange-600 - pressed states
    bg: '#FFF7ED', // Very light orange - backgrounds
  },

  // Secondary Colors - Red (for gradient completion)
  secondary: {
    main: '#DC2626', // Red-600 - for gradient completion (matches website)
    light: '#EF4444', // Red-500 - light states
    dark: '#B91C1C', // Red-700 - dark states
    bg: '#FEE2E2', // Very light red - backgrounds
  },

  // Accent Colors - Premium & Rewards
  accent: {
    main: '#F7B801', // Gold - rewards, premium features
    light: '#FFCD38', // Light Gold - highlights
    dark: '#D9A001', // Dark Gold - pressed states
    bg: '#FFF9E6', // Very light gold - backgrounds
  },

  // Success - Confirmations
  success: {
    main: '#06D6A0', // Teal - confirmations, success
    light: '#2EE6B8', // Light Teal
    dark: '#05B589', // Dark Teal
    bg: '#E6FAF5', // Very light teal
  },

  // Error - Attention & Warnings
  error: {
    main: '#EF476F', // Warm Red - errors
    light: '#FF6B8E', // Light Red
    dark: '#D63A5E', // Dark Red
    bg: '#FFE8EE', // Very light red
  },

  // Warning
  warning: {
    main: '#FFB800', // Amber - warnings
    light: '#FFD054', // Light Amber
    dark: '#CC9300', // Dark Amber
    bg: '#FFF8E1', // Very light amber
  },

  // Neutrals - Backgrounds & Text
  neutral: {
    white: '#FFFFFF',
    offWhite: '#F8F9FA', // Clean light gray - main background
    lightGray: '#F1F3F4', // Light gray - card backgrounds
    gray: '#E8EAED', // Gray - borders
    mediumGray: '#9AA0A6', // Medium gray - disabled states
    darkGray: '#5F6368', // Dark gray - secondary text
    black: '#202124', // Near black - primary text
  },

  // Gradients (for LinearGradient) - as const to ensure type safety
  gradients: {
    primary: ['#F97316', '#DC2626'] as const, // Orange-500 to Red-600 (matches website)
    secondary: ['#FB923C', '#EF4444'] as const, // Orange-400 to Red-500
    accent: ['#F7B801', '#FFCD38'] as const, // Gold gradient
    success: ['#06D6A0', '#2EE6B8'] as const, // Teal gradient
    warm: ['#F97316', '#F7B801'] as const, // Orange to Gold
    cool: ['#F97316', '#06D6A0'] as const, // Orange to Teal
    sunset: ['#F97316', '#DC2626', '#B91C1C'] as const, // Orange to Red gradient
    card: ['#FFFFFF', '#F8F9FA'] as const, // Clean card gradient
    subtle: ['#F8F9FA', '#F1F3F4'] as const, // Subtle background gradient
  },

  // Text colors (for backward compatibility)
  text: {
    primary: '#202124', // Near black - primary text
    secondary: '#5F6368', // Dark gray - secondary text
    tertiary: '#9AA0A6', // Medium gray - tertiary text
    inverse: '#FFFFFF', // White - inverse text
  },

  // Background colors (for backward compatibility)
  background: {
    primary: '#F8F9FA', // Clean light gray - main background
    secondary: '#F1F3F4', // Light gray - card backgrounds
    card: '#FFFFFF', // White - card background
  },

  // Info colors
  info: {
    main: '#2196F3', // Blue - info messages
    light: '#64B5F6', // Light Blue
    dark: '#1976D2', // Dark Blue
    bg: '#E3F2FD', // Very light blue
  },

  // Opacity helpers
  opacity: {
    10: '1A',
    20: '33',
    30: '4D',
    40: '66',
    50: '80',
    60: '99',
    70: 'B3',
    80: 'CC',
    90: 'E6',
  },
};

// Helper function to add opacity to any color
export const withOpacity = (color: string, opacity: number): string => {
  const opacityHex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${opacityHex}`;
};

// Semantic color mappings
export const semanticColors = {
  // Text
  textPrimary: colors.neutral.black,
  textSecondary: colors.neutral.darkGray,
  textTertiary: colors.neutral.mediumGray,
  textInverse: colors.neutral.white,
  textLink: colors.primary.main,

  // Backgrounds
  bgPrimary: colors.neutral.offWhite,
  bgSecondary: colors.neutral.lightGray,
  bgCard: colors.neutral.white,
  bgOverlay: withOpacity(colors.neutral.black, 0.5),

  // Borders
  borderLight: colors.neutral.gray,
  borderMedium: colors.neutral.mediumGray,
  borderDark: colors.neutral.darkGray,

  // Interactive states
  hoverBg: withOpacity(colors.primary.main, 0.1),
  pressedBg: withOpacity(colors.primary.main, 0.2),
  focusBorder: colors.primary.main,
  disabledBg: colors.neutral.lightGray,
  disabledText: colors.neutral.mediumGray,
};

export default colors;
