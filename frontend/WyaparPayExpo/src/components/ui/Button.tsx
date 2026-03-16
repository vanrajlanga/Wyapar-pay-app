/**
 * Button Component - Primary CTA with variants
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  colors,
  textStyles,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}) => {
  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const sizeStyles = {
    small: { paddingVertical: spacing.sm, paddingHorizontal: spacing.base },
    medium: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    large: { paddingVertical: spacing.base, paddingHorizontal: spacing.xl },
  };

  const textSizeStyles = {
    small: { fontSize: 13 },
    medium: { fontSize: 15 },
    large: { fontSize: 17 },
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[fullWidth && { width: '100%' }]}
      >
        <LinearGradient
          colors={
            disabled
              ? [colors.neutral.gray, colors.neutral.gray]
              : colors.gradients.primary
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            sizeStyles[size],
            disabled && styles.disabled,
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.neutral.white} />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  styles.textPrimary,
                  textSizeStyles[size],
                  icon ? { marginLeft: spacing.sm } : undefined,
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[fullWidth && { width: '100%' }]}
      >
        <LinearGradient
          colors={
            disabled
              ? [colors.neutral.gray, colors.neutral.gray]
              : colors.gradients.secondary
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            sizeStyles[size],
            disabled && styles.disabled,
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.neutral.white} />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  styles.textPrimary,
                  textSizeStyles[size],
                  icon ? { marginLeft: spacing.sm } : undefined,
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'accent') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[fullWidth && { width: '100%' }]}
      >
        <LinearGradient
          colors={
            disabled
              ? [colors.neutral.gray, colors.neutral.gray]
              : colors.gradients.accent
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            sizeStyles[size],
            disabled && styles.disabled,
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.neutral.black} />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  styles.textAccent,
                  textSizeStyles[size],
                  icon ? { marginLeft: spacing.sm } : undefined,
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.button,
          styles.buttonOutline,
          sizeStyles[size],
          disabled && styles.disabled,
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary.main} />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.textOutline,
                textSizeStyles[size],
                icon ? { marginLeft: spacing.sm } : undefined,
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  // Ghost variant
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.6}
      style={[
        styles.button,
        sizeStyles[size],
        disabled && styles.disabled,
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary.main} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.textGhost,
              textSizeStyles[size],
              icon ? { marginLeft: spacing.sm } : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  buttonOutline: {
    backgroundColor: colors.neutral.white,
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  textPrimary: {
    ...textStyles.button,
    color: colors.neutral.white,
  },
  textAccent: {
    ...textStyles.button,
    color: colors.neutral.black,
  },
  textOutline: {
    ...textStyles.button,
    color: colors.primary.main,
  },
  textGhost: {
    ...textStyles.button,
    color: colors.primary.main,
  },
  disabled: {
    opacity: 0.5,
  },
});
