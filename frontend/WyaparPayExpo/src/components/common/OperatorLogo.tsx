import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import {
  getOperatorByCode,
  getOperatorLogoUri,
} from '../../constants/operators';

interface OperatorLogoProps {
  operatorCode: string;
  size?: number;
  style?: ViewStyle;
  showBorder?: boolean;
  borderColor?: string;
}

/**
 * OperatorLogo Component
 *
 * Displays the logo for a telecom operator
 *
 * Features:
 * - Auto-loads correct logo from operator code
 * - Fallback to default logo if operator not found
 * - Customizable size
 * - Optional border with operator brand color
 * - Optimized image rendering
 *
 * Usage:
 * ```tsx
 * <OperatorLogo operatorCode="AIRTEL" size={64} />
 * <OperatorLogo operatorCode="JIO" size={48} showBorder />
 * ```
 */
export const OperatorLogo: React.FC<OperatorLogoProps> = ({
  operatorCode,
  size = 56,
  style,
  showBorder = false,
  borderColor,
}) => {
  const operator = getOperatorByCode(operatorCode);
  const logoSource = getOperatorLogoUri(operatorCode);
  const finalBorderColor = borderColor || operator.brandColor;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 5,
        },
        showBorder && {
          borderWidth: 2,
          borderColor: finalBorderColor,
        },
        style,
      ]}
    >
      <Image
        source={logoSource}
        style={[
          styles.logo,
          {
            width: size,
            height: size,
            borderRadius: size / 5,
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    overflow: 'hidden',
  },
});
