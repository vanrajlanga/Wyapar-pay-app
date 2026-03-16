/**
 * Input Component
 * Reusable text input with consistent styling
 */

import React from 'react';
import { TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';

interface InputProps extends TextInputProps {
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  containerStyle,
  style,
  ...props
}) => {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor="#9AA0A6"
      autoCapitalize="none"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: '#202124',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
});
