/**
 * Card Component - Reusable card with consistent styling
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'outlined' | 'flat';
  gradient?: readonly string[];
  borderColor?: string;
  padding?: number;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  gradient,
  borderColor,
  padding = spacing.base,
  style,
}) => {
  if (variant === 'gradient' && gradient) {
    return (
      <LinearGradient
        colors={gradient as any} // Type assertion for gradient arrays
        style={[styles.card, { padding }, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  const getVariantStyle = () => {
    switch (variant) {
      case 'outlined':
        return [styles.cardOutlined, borderColor && { borderColor }];
      case 'flat':
        return styles.cardFlat;
      default:
        return styles.cardDefault;
    }
  };

  return (
    <View style={[styles.card, getVariantStyle(), { padding }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  cardDefault: {
    backgroundColor: colors.neutral.white,
    ...shadows.md,
  },
  cardOutlined: {
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.gray,
  },
  cardFlat: {
    backgroundColor: colors.neutral.white,
  },
});
