/**
 * Button Component
 * Reusable button with different variants
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

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'biometric' | 'link';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.button,
    variant !== 'link' && styles[variant],
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.buttonText,
    variant !== 'link' && styles[`${variant}Text`],
    textStyle,
  ];

  if (variant === 'link') {
    return (
      <TouchableOpacity
        style={[styles.linkButton, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
      >
        <Text style={[styles.linkText, textStyle]}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#ffffff' : '#F97316'}
        />
      ) : (
        <>
          {icon}
          <Text style={buttonTextStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    gap: 10,
  },
  primary: {
    backgroundColor: '#F97316', // Orange-500
  },
  secondary: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)', // Orange-500 with opacity
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
  },
  biometric: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: '#F97316',
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#ffffff', // White text on orange background
  },
  secondaryText: {
    color: '#F97316', // Orange text
  },
  biometricText: {
    color: '#F97316',
  },
  linkButton: {
    marginBottom: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#F97316', // Orange color for visibility
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
