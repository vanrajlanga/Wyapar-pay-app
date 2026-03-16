/**
 * Toast Component
 * Modern, user-friendly toast notifications with clean UX
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, textStyles, spacing, borderRadius, shadows } from '../../theme';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastProps {
  toast: ToastConfig;
  onDismiss: (id: string) => void;
  index: number;
}

const getToastColors = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        background: '#ECFDF5',
        border: '#10B981',
        icon: '#059669',
        iconName: 'check-circle' as const,
      };
    case 'error':
      return {
        background: '#FEF2F2',
        border: '#EF4444',
        icon: '#DC2626',
        iconName: 'error' as const,
      };
    case 'warning':
      return {
        background: '#FFFBEB',
        border: '#F59E0B',
        icon: '#D97706',
        iconName: 'warning' as const,
      };
    case 'info':
    default:
      return {
        background: '#EFF6FF',
        border: '#3B82F6',
        icon: '#2563EB',
        iconName: 'info' as const,
      };
  }
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, index }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  const toastColors = getToastColors(toast.type);
  const duration = toast.duration || 4000;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      dismissToast();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10 + index * 80,
          transform: [{ translateY }, { scale }],
          opacity,
          backgroundColor: toastColors.background,
          borderLeftColor: toastColors.border,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: toastColors.border }]}>
          <MaterialIcons
            name={toastColors.iconName}
            size={20}
            color="#FFFFFF"
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {toast.title}
          </Text>
          {toast.message && (
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          )}
        </View>

        {toast.action && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: toastColors.border }]}
            onPress={() => {
              toast.action?.onPress();
              dismissToast();
            }}
          >
            <Text style={styles.actionText}>{toast.action.label}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={dismissToast}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <ProgressBar duration={duration} color={toastColors.border} />
    </Animated.View>
  );
};

// Progress bar component
const ProgressBar: React.FC<{ duration: number; color: string }> = ({
  duration,
  color,
}) => {
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.progressContainer}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: color,
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    ...shadows.lg,
    zIndex: 9999,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingRight: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...textStyles.bodyMedium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  message: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  actionText: {
    ...textStyles.label,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  dismissButton: {
    padding: spacing.xs,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
  },
});

export default Toast;
