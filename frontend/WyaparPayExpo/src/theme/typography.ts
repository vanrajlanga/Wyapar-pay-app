/**
 * WyaparPay Typography System
 * Using Poppins for headings and Inter for body text
 */

export const typography = {
  // Font Families
  fonts: {
    heading: 'Poppins-Bold',
    headingSemiBold: 'Poppins-SemiBold',
    headingMedium: 'Poppins-Medium',
    headingRegular: 'Poppins-Regular',
    body: 'Inter-Regular',
    bodyMedium: 'Inter-Medium',
    bodySemiBold: 'Inter-SemiBold',
    bodyBold: 'Inter-Bold',
    numbers: 'Poppins-Medium', // Better for financial numbers
  },

  // Font Sizes
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },

  // Font Weights (for fallback or custom fonts)
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

// Text Styles (common combinations)
export const textStyles = {
  // Headings
  h1: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['4xl'],
    lineHeight: typography.sizes['4xl'] * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['3xl'],
    lineHeight: typography.sizes['3xl'] * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h3: {
    fontFamily: typography.fonts.headingSemiBold,
    fontSize: typography.sizes['2xl'],
    lineHeight: typography.sizes['2xl'] * typography.lineHeights.tight,
  },
  h4: {
    fontFamily: typography.fonts.headingSemiBold,
    fontSize: typography.sizes.xl,
    lineHeight: typography.sizes.xl * typography.lineHeights.normal,
  },
  h5: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * typography.lineHeights.normal,
  },
  h6: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },

  // Additional heading styles
  headingSmall: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  headingLarge: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes['5xl'],
    lineHeight: typography.sizes['5xl'] * typography.lineHeights.tight,
  },

  // Body Text
  bodyLarge: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * typography.lineHeights.relaxed,
  },
  body: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
  bodyMedium: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },
  bodySmall: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  caption: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    lineHeight: typography.sizes.xs * typography.lineHeights.normal,
  },

  // Special
  button: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.base,
    letterSpacing: typography.letterSpacing.wide,
  },
  buttonLarge: {
    fontFamily: typography.fonts.headingSemiBold,
    fontSize: typography.sizes.lg,
    letterSpacing: typography.letterSpacing.wide,
  },
  amount: {
    fontFamily: typography.fonts.numbers,
    fontSize: typography.sizes['4xl'],
    letterSpacing: typography.letterSpacing.tight,
  },
  amountSmall: {
    fontFamily: typography.fonts.numbers,
    fontSize: typography.sizes['2xl'],
    letterSpacing: typography.letterSpacing.tight,
  },
  label: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },
};

export default typography;
