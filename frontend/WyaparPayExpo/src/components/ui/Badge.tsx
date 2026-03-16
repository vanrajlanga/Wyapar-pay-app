/**
 * Badge Component - Small labels for status, tags, etc.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default';
  size?: 'small' | 'medium';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'medium',
  style,
  textStyle,
}) => {
  const variantStyles = {
    success: {
      backgroundColor: colors.success.bg,
      borderColor: colors.success.main,
      color: colors.success.dark,
    },
    error: {
      backgroundColor: colors.error.bg,
      borderColor: colors.error.main,
      color: colors.error.dark,
    },
    warning: {
      backgroundColor: colors.warning.bg,
      borderColor: colors.warning.main,
      color: colors.warning.dark,
    },
    info: {
      backgroundColor: colors.secondary.bg,
      borderColor: colors.secondary.main,
      color: colors.secondary.dark,
    },
    default: {
      backgroundColor: colors.neutral.lightGray,
      borderColor: colors.neutral.gray,
      color: colors.neutral.darkGray,
    },
  };

  const sizeStyles = {
    small: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      fontSize: 10,
    },
    medium: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      fontSize: 11,
    },
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyles[variant].backgroundColor,
          borderColor: variantStyles[variant].borderColor,
        },
        sizeStyles[size],
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: variantStyles[variant].color,
            fontSize: sizeStyles[size].fontSize,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
