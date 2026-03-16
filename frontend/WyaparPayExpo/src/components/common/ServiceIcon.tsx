import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getServiceByCode,
  getServiceIconComponent,
  ServiceIconInfo,
} from '../../constants/service-icons';
import { colors } from '../../theme';

interface ServiceIconProps {
  serviceCode: string;
  size?: number;
  style?: ViewStyle;
  showGradient?: boolean;
  iconColor?: string;
}

/**
 * ServiceIcon Component
 *
 * Displays icons for various services (Mobile, DTH, Broadband, Bills, etc.)
 *
 * Features:
 * - Auto-loads correct icon from service code
 * - Supports both custom images and Material Icons
 * - Optional gradient background
 * - Customizable size and colors
 * - Fallback for unknown services
 *
 * Usage:
 * ```tsx
 * <ServiceIcon serviceCode="MOBILE_RECHARGE" size={64} showGradient />
 * <ServiceIcon serviceCode="ELECTRICITY" size={48} />
 * <ServiceIcon serviceCode="DTH_RECHARGE" size={56} showGradient />
 * ```
 */
export const ServiceIcon: React.FC<ServiceIconProps> = ({
  serviceCode,
  size = 56,
  style,
  showGradient = false,
  iconColor,
}) => {
  const service = getServiceByCode(serviceCode);

  if (!service) {
    // Fallback for unknown services
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 5,
            backgroundColor: colors.neutral.mediumGray,
          },
          style,
        ]}
      />
    );
  }

  const iconInfo = getServiceIconComponent(service);
  const iconSize = size * 0.6; // Icon is 60% of container size

  const renderIcon = () => {
    if (iconInfo.type === 'image') {
      return (
        <Image
          source={iconInfo.source}
          style={{
            width: size,
            height: size,
            borderRadius: size / 5,
          }}
          resizeMode="contain"
        />
      );
    } else {
      const { Component, name } = iconInfo as { type: string; Component: any; name: string };
      if (!Component) return null;
      return (
        <Component
          name={name}
          size={iconSize}
          color={iconColor || colors.neutral.white}
        />
      );
    }
  };

  if (showGradient && iconInfo.type !== 'image') {
    return (
      <LinearGradient
        colors={service.gradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 5,
          },
          style,
        ]}
      >
        {renderIcon()}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 5,
          backgroundColor:
            iconInfo.type === 'image' ? 'transparent' : service.color,
        },
        style,
      ]}
    >
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradientContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
