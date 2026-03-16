/**
 * Recharge Status Screen - Redesigned with WyaparPay Design System
 * Success/Failure screen with delightful animations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useRecharge } from '../../contexts/RechargeContext';
import { NavigationProps } from '../../types/navigation';
import { Button, Card, Badge } from '../ui';
import {
  colors,
  textStyles,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';

interface RechargeStatusScreenProps extends NavigationProps {}

export const RechargeStatusScreen: React.FC<RechargeStatusScreenProps> = ({
  setCurrentScreen,
}) => {
  const { t } = useTranslation('recharge');
  const { t: tc } = useTranslation('common');

  const { lastTransaction, clearFormData } = useRecharge();

  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const isSuccess = lastTransaction?.status === 'success';

  useEffect(() => {
    // Trigger haptic feedback
    if (isSuccess) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Animate elements
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1.5),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearFormData();
    setCurrentScreen('dashboard');
  };

  const handleViewHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearFormData();
    setCurrentScreen('recharge-history');
  };

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentScreen('recharge-entry');
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!lastTransaction) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={styles.errorText}>No transaction data available</Text>
        <Button
          title="Go to Dashboard"
          onPress={handleDone}
          variant="primary"
          style={{ marginTop: spacing.xl }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Success/Failure Gradient Background */}
      <LinearGradient
        colors={
          isSuccess
            ? colors.gradients.success
            : [colors.error.main, colors.error.dark]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topSection}
      >
        {/* Animated Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }, { rotate: spin }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.iconCircle}>
            {isSuccess ? (
              <MaterialIcons
                name="check-circle"
                size={80}
                color={colors.success.main}
              />
            ) : (
              <MaterialIcons
                name="cancel"
                size={80}
                color={colors.error.main}
              />
            )}
          </View>
        </Animated.View>

        {/* Status Text */}
        <Animated.View
          style={[styles.statusTextContainer, { opacity: fadeAnim }]}
        >
          <Text style={styles.statusTitle}>
            {isSuccess ? '🎉 Recharge Successful!' : '😞 Recharge Failed'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isSuccess
              ? 'Your recharge has been completed successfully'
              : lastTransaction.message ||
                'Something went wrong. Please try again.'}
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* Details Section */}
      <View style={styles.bottomSection}>
        <Animated.View
          style={[
            styles.detailsWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Amount Card */}
          <Card
            variant="gradient"
            gradient={
              isSuccess ? colors.gradients.warm : colors.gradients.sunset
            }
          >
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amountValue}>₹{lastTransaction.amount}</Text>
              <Badge
                label={isSuccess ? 'COMPLETED' : 'FAILED'}
                variant={isSuccess ? 'success' : 'error'}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </Card>

          {/* Transaction Details */}
          <Card variant="default" style={{ marginTop: spacing.lg }}>
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <View
                  style={[
                    styles.detailIcon,
                    { backgroundColor: colors.primary.bg },
                  ]}
                >
                  <MaterialIcons
                    name="phone"
                    size={20}
                    color={colors.primary.main}
                  />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Mobile Number</Text>
                  <Text style={styles.detailValue}>
                    {lastTransaction.mobileNumber}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <View
                  style={[
                    styles.detailIcon,
                    { backgroundColor: colors.secondary.bg },
                  ]}
                >
                  <MaterialIcons
                    name="sim-card"
                    size={20}
                    color={colors.secondary.main}
                  />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Operator</Text>
                  <Text style={styles.detailValue}>
                    {lastTransaction.operator}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <View
                  style={[
                    styles.detailIcon,
                    { backgroundColor: colors.accent.bg },
                  ]}
                >
                  <Feather name="hash" size={18} color={colors.accent.main} />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={styles.detailValue}>
                    {lastTransaction.transactionId}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {isSuccess ? (
              <>
                <Button
                  title="Back to Dashboard"
                  onPress={handleDone}
                  variant="primary"
                  size="large"
                  fullWidth
                  icon={<MaterialIcons name="home" size={20} color="#FFF" />}
                />
                <Button
                  title="View History"
                  onPress={handleViewHistory}
                  variant="outline"
                  size="large"
                  fullWidth
                  style={{ marginTop: spacing.md }}
                  icon={
                    <MaterialIcons
                      name="history"
                      size={20}
                      color={colors.primary.main}
                    />
                  }
                />
              </>
            ) : (
              <>
                <Button
                  title="Try Again"
                  onPress={handleRetry}
                  variant="primary"
                  size="large"
                  fullWidth
                  icon={<MaterialIcons name="refresh" size={20} color="#FFF" />}
                />
                <Button
                  title="Back to Dashboard"
                  onPress={handleDone}
                  variant="outline"
                  size="large"
                  fullWidth
                  style={{ marginTop: spacing.md }}
                  icon={
                    <MaterialIcons
                      name="home"
                      size={20}
                      color={colors.primary.main}
                    />
                  }
                />
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  topSection: {
    paddingTop: spacing['3xl'] + spacing['2xl'],
    paddingBottom: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
    ...shadows.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  statusTextContainer: {
    alignItems: 'center',
  },
  statusTitle: {
    ...textStyles.h2,
    color: colors.neutral.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  statusSubtitle: {
    ...textStyles.body,
    color: colors.neutral.white,
    textAlign: 'center',
    opacity: 0.9,
  },

  // Bottom Section
  bottomSection: {
    flex: 1,
    padding: spacing.lg,
  },
  detailsWrapper: {
    flex: 1,
  },

  // Amount Card
  amountCard: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  amountLabel: {
    ...textStyles.bodySmall,
    color: colors.neutral.white,
    opacity: 0.9,
  },
  amountValue: {
    ...textStyles.amount,
    color: colors.neutral.white,
    marginTop: spacing.xs,
  },

  // Detail Row
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  detailLabel: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
    marginBottom: spacing.xs / 2,
  },
  detailValue: {
    ...textStyles.body,
    color: colors.neutral.black,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral.gray,
    marginLeft: 56,
  },

  // Actions
  actionsContainer: {
    marginTop: spacing.xl,
  },

  // Error State
  errorText: {
    ...textStyles.body,
    color: colors.neutral.darkGray,
    textAlign: 'center',
  },
});
