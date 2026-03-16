/**
 * Recharge Review Screen - Redesigned with WyaparPay Design System
 * Payment confirmation with warm, trustworthy design
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecharge } from '../../contexts/RechargeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { NavigationProps } from '../../types/navigation';
import { RechargeRequest } from '../../types/recharge';
import { Button, Card, Badge } from '../ui';
import {
  colors,
  textStyles,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';
import { getOperatorLogoUri } from '../../constants/operators';
import { paymentService } from '../../services/payment.service';
import RazorpayCheckout from 'react-native-razorpay';

interface RechargeReviewScreenProps extends NavigationProps {}

export const RechargeReviewScreen: React.FC<RechargeReviewScreenProps> = ({
  setCurrentScreen,
}) => {
  const { t } = useTranslation('recharge');
  const { t: tc } = useTranslation('common');
  const { showError, showWarning } = useToast();

  const { processRecharge, formData, isProcessing, detectedOperator, setLastTransaction } = useRecharge();
  const { tokens } = useAuth();
  const insets = useSafeAreaInsets();

  // Wallet functionality disabled - only Razorpay payment available
  const [paymentMethod, setPaymentMethod] = useState<'razorpay'>(
    'razorpay'
  );
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [failureModal, setFailureModal] = useState<{ message: string; paymentId?: string } | null>(null);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          showWarning(
            'Session Expired',
            'Your recharge session has expired. Please start again.'
          );
          setTimeout(() => setCurrentScreen('recharge-entry'), 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProcess = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Button press animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Validate form data
      if (!formData || !tokens?.accessToken) {
        showError('Error', 'Invalid recharge data. Please try again.');
        return;
      }

      // Payment method handling - Only Razorpay available
      // Wallet functionality disabled
      /* if (paymentMethod === 'wallet') {
        // Wallet payment - Direct KWIKAPI recharge
        await handleWalletPayment();
      } else */ if (paymentMethod === 'razorpay') {
        // Razorpay payment - UPI/Card/Netbanking via Razorpay
        await handleRazorpayPayment();
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      showError(
        'Payment Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      );
    }
  };

  /**
   * Handle wallet payment - Direct KWIKAPI recharge
   * DISABLED: Wallet functionality commented out
   */
  /* const handleWalletPayment = async () => {
    try {
      if (!formData || !detectedOperator?.operatorId) {
        Alert.alert('Error', 'Missing operator information. Please restart the recharge.');
        return;
      }

      // Process KWIKAPI recharge directly
      const rechargeResult = await rechargeService.processCompleteRecharge({
        mobileNumber: formData.mobileNumber,
        amount: formData.amount,
        operatorId: detectedOperator.operatorId,
        operatorName: formData.operatorName || detectedOperator.operatorName,
        accessToken: tokens!.accessToken,
      });

      if (rechargeResult.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCurrentScreen('payment-success');
      } else {
        Alert.alert(
          'Recharge Failed',
          rechargeResult.message || 'Unable to complete recharge. Please try again.'
        );
      }
    } catch (error) {
      console.error('Wallet payment error:', error);
      throw error;
    }
  }; */

  /**
   * Handle Razorpay payment for Card/UPI
   */
  const handleRazorpayPayment = async () => {
    try {
      if (!formData || !detectedOperator?.operatorId || !tokens?.accessToken) {
        showError('Error', 'Invalid payment data');
        return;
      }

      // Debug: Log the payment data
      console.log('💳 Creating Razorpay order with data:', {
        amount: formData.amount,
        amountType: typeof formData.amount,
        currency: 'INR',
        notes: {
          mobile_number: formData.mobileNumber,
          operator: formData.operatorName || detectedOperator.operatorName,
          operator_id: detectedOperator.operatorId,
          plan_id: formData.planId || '',
        },
      });

      // Validate amount
      if (!formData.amount || formData.amount < 1 || typeof formData.amount !== 'number') {
        showError('Error', `Invalid recharge amount: ₹${formData.amount}. Please go back and select a plan.`);
        return;
      }

      // Step 1: Create payment order
      const order = await paymentService.createOrder(
        {
          amount: formData.amount,
          currency: 'INR',
          notes: {
            type: 'recharge',
            mobileNumber: formData.mobileNumber,
            mobile_number: formData.mobileNumber,
            operator: formData.operatorName || detectedOperator.operatorName,
            operator_id: String(detectedOperator.operatorId),
            plan_id: formData.planId || '',
          },
        },
        tokens.accessToken
      );

      // Step 2: Open Razorpay checkout
      const razorpayOptions = {
        key: order.razorpay_key,
        amount: order.amount * 100, // Convert to paise
        currency: order.currency,
        name: 'WyaparPay',
        description: `Mobile Recharge - ${formData.mobileNumber}`,
        order_id: order.razorpay_order_id,
        prefill: {
          contact: formData.mobileNumber,
        },
        theme: {
          color: colors.primary.main,
        },
      };

      RazorpayCheckout.open(razorpayOptions)
        .then(async (data: any) => {
          // Payment successful - verify and process recharge
          await handlePaymentSuccess(data, order.razorpay_order_id);
        })
        .catch((error: any) => {
          // Payment cancelled or failed
          console.error('Razorpay error:', error);
          showWarning(
            'Payment Cancelled',
            error.description || 'Payment was cancelled. Please try again.'
          );
        });
    } catch (error) {
      console.error('Razorpay payment initialization error:', error);
      throw error;
    }
  };

  /**
   * Handle payment success - Verify and process recharge
   */
  const handlePaymentSuccess = async (
    razorpayResponse: any,
    orderId: string
  ) => {
    try {
      if (!formData || !detectedOperator?.operatorId || !tokens?.accessToken) {
        showError('Error', 'Invalid recharge data');
        return;
      }

      // Show loading indicator
      setIsVerifying(true);

      // Step 3: Verify payment
      const verification = await paymentService.verifyPayment(
        {
          razorpay_order_id: orderId,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
        },
        tokens.accessToken
      );

      setIsVerifying(false);

      const verifyStatus = verification.status?.toUpperCase();

      if (verifyStatus === 'SUCCESS') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Store transaction data in context
        setLastTransaction({
          id: verification.transactionId || razorpayResponse.razorpay_payment_id,
          transactionId: verification.transactionId || razorpayResponse.razorpay_payment_id,
          amount: formData.amount.toString(),
          status: 'success',
          message: 'Recharge completed successfully',
          mobileNumber: formData.mobileNumber,
          operatorName: formData.operatorName || detectedOperator.operatorName,
          planName: formData.planName,
        } as any);

        // Navigate to payment success screen
        setCurrentScreen('payment-success');
      } else if (verifyStatus === 'PENDING') {
        // RE is processing, show pending state
        showWarning('Recharge Processing', 'Your recharge is being processed. You will be notified once complete.');
        setCurrentScreen('payment-success');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFailureModal({
          message: 'Your recharge could not be completed. If your payment was deducted, it will be refunded within 5-7 business days.',
          paymentId: razorpayResponse.razorpay_payment_id,
        });
      }
    } catch (error) {
      setIsVerifying(false);
      console.error('Payment verification/recharge error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFailureModal({
        message: 'Your recharge could not be completed. If your payment was deducted, it will be refunded within 5-7 business days.',
      });
    }
  };

  const paymentMethods = [
    // Wallet payment option disabled
    /* {
      id: 'wallet',
      name: 'Wallet Balance',
      description: 'Pay from your WyaparPay wallet',
      icon: 'account-balance-wallet',
      color: colors.success.main,
      balance: '₹1,250',
    }, */
    {
      id: 'razorpay',
      name: 'Razorpay',
      description: 'UPI, Cards, Netbanking & more',
      icon: 'payment',
      color: colors.primary.main,
      balance: null,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={colors.gradients.secondary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentScreen('recharge-plans');
            }}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Review & Pay</Text>
            <Text style={styles.headerSubtitle}>Confirm your recharge</Text>
          </View>
          <View style={styles.timerContainer}>
            <MaterialIcons name="timer" size={16} color="#FFF" />
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Amount Card - Prominent */}
        <LinearGradient
          colors={colors.gradients.warm}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.amountCard}
        >
          <MaterialIcons name="phone-android" size={56} color="#FFF" />
          <Text style={styles.amountLabel}>Recharge Amount</Text>
          <Text style={styles.amountValue}>₹{formData?.amount || 0}</Text>
        </LinearGradient>

        {/* Recharge Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recharge Details</Text>
          </View>

          <Card variant="default">
            <DetailRow
              icon="phone"
              label="Mobile Number"
              value={formData?.mobileNumber || ''}
              iconColor={colors.primary.main}
            />
            <View style={styles.divider} />
            <DetailRow
              icon="sim-card"
              label="Operator"
              value={formData?.operatorName || formData?.operatorCode || ''}
              iconColor={colors.secondary.main}
              operatorCode={formData?.operatorCode}
            />
          </Card>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          {paymentMethods.map((method) => {
            const isSelected = paymentMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentCard,
                  isSelected && styles.paymentCardSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPaymentMethod(method.id as 'razorpay');
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.paymentIconContainer,
                    {
                      backgroundColor: isSelected
                        ? `${method.color}15`
                        : colors.neutral.lightGray,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={method.icon as any}
                    size={28}
                    color={
                      isSelected ? method.color : colors.neutral.mediumGray
                    }
                  />
                </View>

                <View style={styles.paymentInfo}>
                  <Text
                    style={[
                      styles.paymentName,
                      isSelected && styles.paymentNameSelected,
                    ]}
                  >
                    {method.name}
                  </Text>
                  {method.description && (
                    <Text style={styles.paymentDescription}>
                      {method.description}
                    </Text>
                  )}
                  {method.balance && (
                    <Text style={styles.paymentBalance}>{method.balance}</Text>
                  )}
                </View>

                {isSelected ? (
                  <MaterialIcons
                    name="radio-button-checked"
                    size={24}
                    color={colors.primary.main}
                  />
                ) : (
                  <MaterialIcons
                    name="radio-button-unchecked"
                    size={24}
                    color={colors.neutral.gray}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <View style={styles.securityIcon}>
            <MaterialIcons name="lock" size={18} color={colors.neutral.mediumGray} />
          </View>
          <Text style={styles.securityText}>
            100% secure payment with end-to-end encryption
          </Text>
        </View>
      </ScrollView>

      {/* Pay Button - Fixed Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {isProcessing ? (
            <View style={styles.processingButton}>
              <ActivityIndicator size="small" color={colors.primary.main} />
              <Text style={styles.processingText}>Processing payment...</Text>
            </View>
          ) : (
            <Button
              title={`Pay ₹${formData?.amount || 0}`}
              onPress={handleProcess}
              variant="primary"
              size="large"
              fullWidth
              icon={
                <MaterialIcons name="check-circle" size={20} color="#FFF" />
              }
            />
          )}
        </Animated.View>

        <Text style={styles.footerHint}>
          By continuing, you agree to our Terms & Conditions
        </Text>
      </View>

      {/* Loading Overlay - Payment Verification */}
      {isVerifying && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary.main} />
            <Text style={styles.loadingTitle}>Verifying Payment</Text>
            <Text style={styles.loadingSubtitle}>
              Please wait while we verify your payment and process the recharge...
            </Text>
          </View>
        </View>
      )}

      {/* Recharge Failure Modal */}
      <Modal
        visible={!!failureModal}
        transparent
        animationType="fade"
        onRequestClose={() => setFailureModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Red gradient header */}
            <LinearGradient
              colors={['#EF4444', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderIcon}>
                <MaterialIcons name="cancel" size={22} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Recharge Failed</Text>
                <Text style={styles.modalHeaderSub}>Action required</Text>
              </View>
            </LinearGradient>

            {/* Body */}
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>{failureModal?.message}</Text>

              {failureModal?.paymentId && (
                <>
                  <View style={styles.modalPaymentIdBox}>
                    <Text style={styles.modalPaymentIdLabel}>Payment captured — save this ID for support:</Text>
                    <Text style={styles.modalPaymentId}>{failureModal.paymentId}</Text>
                  </View>
                  <Text style={styles.modalSupportHint}>Contact our support team with the above payment ID to resolve this issue.</Text>
                </>
              )}

              <View style={styles.modalActions}>
                {failureModal?.paymentId && (
                  <TouchableOpacity
                    style={styles.modalSupportBtn}
                    onPress={() => {
                      setFailureModal(null);
                      setCurrentScreen('contact-us');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalSupportBtnText}>Contact Support</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.modalCloseBtn, !failureModal?.paymentId && { flex: 1 }]}
                  onPress={() => { setFailureModal(null); setCurrentScreen('dashboard'); }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#F97316', '#EF4444']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalCloseBtnGradient}
                  >
                    <Text style={styles.modalCloseBtnText}>{failureModal?.paymentId ? 'Close' : 'Try Again'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Helper Component
const DetailRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  iconColor: string;
  operatorCode?: string;
}> = ({ icon, label, value, iconColor, operatorCode }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <View style={[styles.detailIcon, { backgroundColor: `${iconColor}15` }]}>
        {operatorCode ? (
          <Image
            source={getOperatorLogoUri(operatorCode)}
            style={styles.operatorLogoSmall}
            resizeMode="contain"
          />
        ) : (
          <MaterialIcons name={icon as any} size={20} color={iconColor} />
        )}
      </View>
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  header: {
    paddingTop: spacing['3xl'] + spacing.base,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    ...shadows.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerTitle: {
    ...textStyles.h4,
    color: colors.neutral.white,
  },
  headerSubtitle: {
    ...textStyles.caption,
    color: colors.neutral.white,
    opacity: 0.9,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs / 2,
  },
  timerText: {
    ...textStyles.bodySmall,
    color: colors.neutral.white,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 160, // Extra space for fixed footer and security text
  },

  // Amount Card
  amountCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  amountLabel: {
    ...textStyles.bodySmall,
    color: colors.neutral.white,
    marginTop: spacing.md,
    opacity: 0.9,
  },
  amountValue: {
    ...textStyles.amount,
    color: colors.neutral.white,
    marginTop: spacing.xs,
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    ...textStyles.h5,
    color: colors.neutral.black,
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
    overflow: 'hidden',
  },
  operatorLogoSmall: {
    width: 28,
    height: 28,
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
    marginLeft: 56, // Icon width + margin
  },

  // Payment Cards
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  paymentCardSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.neutral.white,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    ...textStyles.body,
    color: colors.neutral.black,
    fontWeight: '500',
  },
  paymentNameSelected: {
    fontWeight: '600',
    color: colors.neutral.black,
  },
  paymentDescription: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
    marginTop: spacing.xs / 2,
  },
  paymentBalance: {
    ...textStyles.caption,
    color: colors.success.main,
    marginTop: spacing.xs / 2,
    fontWeight: '600',
  },

  // Security Note
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.offWhite,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  securityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  securityText: {
    ...textStyles.bodySmall,
    color: colors.neutral.mediumGray,
    flex: 1,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray,
    ...shadows.xl,
  },
  processingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.lightGray,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  processingText: {
    ...textStyles.button,
    color: colors.neutral.darkGray,
    marginLeft: spacing.sm,
  },
  footerHint: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 280,
    ...shadows.xl,
  },
  loadingTitle: {
    ...textStyles.h3,
    color: colors.neutral.darkGray,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  loadingSubtitle: {
    ...textStyles.bodySmall,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Failure Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 360,
    ...shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.md,
  },
  modalHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    ...textStyles.h4,
    color: colors.neutral.white,
    fontWeight: '700',
  },
  modalHeaderSub: {
    ...textStyles.caption,
    color: colors.neutral.white,
    opacity: 0.8,
    marginTop: 2,
  },
  modalBody: {
    padding: spacing.base,
    gap: spacing.md,
  },
  modalMessage: {
    ...textStyles.body,
    color: '#374151',
    lineHeight: 22,
  },
  modalPaymentIdBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  modalPaymentIdLabel: {
    ...textStyles.caption,
    color: '#92400E',
    fontWeight: '600',
  },
  modalPaymentId: {
    ...textStyles.bodySmall,
    color: '#78350F',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  modalSupportHint: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
    marginTop: -spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modalSupportBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSupportBtnText: {
    ...textStyles.button,
    color: '#EA580C',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCloseBtn: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  modalCloseBtnGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    ...textStyles.button,
    color: colors.neutral.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
