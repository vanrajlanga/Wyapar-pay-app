/**
 * Modern Toggle Component
 * Sharp, modern toggle switch with smooth animations
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';

interface ModernToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'success' | 'accent';
  style?: ViewStyle;
}

export const ModernToggle: React.FC<ModernToggleProps> = ({
  value,
  onValueChange,
  disabled = false,
  size = 'medium',
  color = 'primary',
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 44,
          height: 24,
          borderRadius: 12,
          thumbSize: 20,
          thumbMargin: 2,
        };
      case 'large':
        return {
          width: 56,
          height: 32,
          borderRadius: 16,
          thumbSize: 28,
          thumbMargin: 2,
        };
      default: // medium
        return {
          width: 50,
          height: 28,
          borderRadius: 14,
          thumbSize: 24,
          thumbMargin: 2,
        };
    }
  };

  const getColorStyles = () => {
    switch (color) {
      case 'success':
        return {
          activeBg: colors.success.main,
          inactiveBg: colors.neutral.gray,
          thumbColor: colors.neutral.white,
        };
      case 'accent':
        return {
          activeBg: colors.accent.main,
          inactiveBg: colors.neutral.gray,
          thumbColor: colors.neutral.white,
        };
      default: // primary
        return {
          activeBg: colors.primary.main,
          inactiveBg: colors.neutral.gray,
          thumbColor: colors.neutral.white,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const colorStyles = getColorStyles();

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colorStyles.inactiveBg, colorStyles.activeBg],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      sizeStyles.thumbMargin,
      sizeStyles.width - sizeStyles.thumbSize - sizeStyles.thumbMargin,
    ],
  });

  const opacity = disabled ? 0.5 : 1;

  return (
    <TouchableOpacity
      style={[style, { opacity }]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            borderRadius: sizeStyles.borderRadius,
            backgroundColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: sizeStyles.thumbSize,
              height: sizeStyles.thumbSize,
              borderRadius: sizeStyles.thumbSize / 2,
              backgroundColor: colorStyles.thumbColor,
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
    shadowColor: colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  thumb: {
    position: 'absolute',
    shadowColor: colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
