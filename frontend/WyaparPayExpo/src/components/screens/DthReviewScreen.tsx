/**
 * DTH Review Screen
 * Summary + Razorpay payment + backend recharge
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RazorpayCheckout from 'react-native-razorpay';
import { NavigationProps } from '../../types/navigation';
import { colors, textStyles, spacing, borderRadius, shadows } from '../../theme';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRecharge } from '../../contexts/RechargeContext';
import { paymentService } from '../../services/payment.service';

interface DthReviewScreenProps extends NavigationProps {
  subscriberId?: string;
  dthOperatorId?: string;
  dthOperatorName?: string;
  selectedPlan?: { name: string; amount: number; months: string };
}

export const DthReviewScreen: React.FC<DthReviewScreenProps> = ({
  setCurrentScreen,
  subscriberId,
  dthOperatorId,
  dthOperatorName,
  selectedPlan,
}) => {
  const { t } = useTranslation('recharge');
  const { t: tc } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const { showError, showWarning } = useToast();
  const { tokens } = useAuth();
  const { setLastTransaction } = useRecharge();

  const [isProcessing, setIsProcessing] = useState(false);
  const [failureModal, setFailureModal] = useState<{ message: string; paymentId?: string } | null>(null);

  const handlePay = async () => {
    if (!subscriberId || !dthOperatorId || !selectedPlan || !tokens?.accessToken) {
      showError(tc('error'), t('missing_recharge_details'));
      return;
    }

    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Step 1: Create Razorpay order
      const order = await paymentService.createOrder(
        {
          amount: selectedPlan.amount,
          currency: 'INR',
          notes: {
            type: 'recharge',
            is_dth: 'true',
            subscriber_id: subscriberId,
            mobile_number: subscriberId,
            operator_kwik_id: dthOperatorId,
            operator: dthOperatorName,
            plan: selectedPlan.name,
          },
        },
        tokens.accessToken
      );

      // Step 2: Open Razorpay
      const razorpayOptions = {
        key: order.razorpay_key,
        amount: order.amount * 100,
        currency: order.currency,
        name: 'WyaparPay',
        description: `DTH Recharge - ${subscriberId}`,
        order_id: order.razorpay_order_id,
        theme: { color: colors.primary.main },
      };

      const razorpayResponse: any = await RazorpayCheckout.open(razorpayOptions);

      // Step 3: Verify payment — backend handles DTH recharge internally
      const verification = await paymentService.verifyPayment(
        {
          razorpay_order_id: order.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
        },
        tokens.accessToken
      );

      setIsProcessing(false);

      const verifyStatus = verification.status?.toUpperCase();

      if (verifyStatus === 'SUCCESS' || verifyStatus === 'PENDING') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLastTransaction({
          id: verification.transactionId || razorpayResponse.razorpay_payment_id,
          transactionId: verification.transactionId || razorpayResponse.razorpay_payment_id,
          amount: selectedPlan.amount.toString(),
          status: 'success',
          message: verifyStatus === 'PENDING'
            ? t('dth_recharge_processing')
            : t('dth_recharge_success'),
          mobileNumber: subscriberId,
          operatorName: dthOperatorName,
          planName: selectedPlan.name,
        } as any);
        setCurrentScreen('payment-success');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFailureModal({
          message: t('recharge_not_completed'),
          paymentId: razorpayResponse.razorpay_payment_id,
        });
      }
    } catch (error: any) {
      setIsProcessing(false);
      if (error?.code === 'PAYMENT_CANCELLED' || error?.description?.includes('cancel')) {
        showWarning(t('payment_cancelled'), t('payment_was_cancelled'));
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFailureModal({
        message: 'Your recharge could not be completed. If your payment was deducted, it will be refunded within 5-7 business days.',
      });
    }
  };

  const summaryItems = [
    { label: t('subscriber_id'), value: subscriberId || '-', icon: 'perm-identity', highlight: false },
    { label: t('operator'), value: dthOperatorName || '-', icon: 'tv', highlight: false },
    { label: t('plan'), value: selectedPlan?.name || '-', icon: 'receipt', highlight: false },
    { label: t('duration'), value: selectedPlan?.months || '-', icon: 'access-time', highlight: false },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={colors.gradients.primary} style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('dth-plans')} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.neutral.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('review_pay')}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Amount Hero */}
        <View style={styles.amountHero}>
          <View style={styles.amountIconCircle}>
            <MaterialIcons name="tv" size={32} color={colors.primary.main} />
          </View>
          <Text style={styles.amountHeroLabel}>{t('total_payable')}</Text>
          <Text style={styles.amountHeroValue}>₹{selectedPlan?.amount || 0}</Text>
          <Text style={styles.amountHeroDuration}>{selectedPlan?.months || ''}</Text>
        </View>

        {/* Order Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('order_details')}</Text>
          {summaryItems.filter(i => !i.highlight).map((item, idx, arr) => (
            <View key={item.label} style={[styles.summaryRow, idx === arr.length - 1 && styles.summaryRowLast]}>
              <View style={styles.summaryLeft}>
                <MaterialIcons name={item.icon as any} size={16} color={colors.neutral.mediumGray} />
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </View>
              <Text style={styles.summaryValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Secured badge */}
        <View style={styles.secureBadge}>
          <MaterialIcons name="lock" size={14} color={colors.neutral.mediumGray} />
          <Text style={styles.secureBadgeText}>{t('payments_secured_razorpay')} · {t('upi_card_netbanking')}</Text>
        </View>
      </ScrollView>

      {/* Recharge Failure Modal */}
      <Modal
        visible={!!failureModal}
        transparent
        animationType="fade"
        onRequestClose={() => setFailureModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
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
                <Text style={styles.modalHeaderTitle}>{t('recharge_failed')}</Text>
                <Text style={styles.modalHeaderSub}>{t('action_required')}</Text>
              </View>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>{failureModal?.message}</Text>

              {failureModal?.paymentId && (
                <>
                  <View style={styles.modalPaymentIdBox}>
                    <Text style={styles.modalPaymentIdLabel}>{t('payment_captured_save_id')}</Text>
                    <Text style={styles.modalPaymentId}>{failureModal.paymentId}</Text>
                  </View>
                  <Text style={styles.modalSupportHint}>{t('contact_support_hint')}</Text>
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
                    <Text style={styles.modalSupportBtnText}>{t('contact_support')}</Text>
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
                    <Text style={styles.modalCloseBtnText}>{failureModal?.paymentId ? t('close') : t('try_again')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pay Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          style={[styles.payBtn, isProcessing && styles.payBtnDisabled]}
          onPress={handlePay}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isProcessing ? ['#ccc', '#aaa'] : colors.gradients.primary}
            style={styles.payBtnGradient}
          >
            {isProcessing ? (
              <>
                <ActivityIndicator size="small" color={colors.neutral.white} />
                <Text style={styles.payBtnText}>{t('processing_short')}</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="lock" size={20} color={colors.neutral.white} />
                <Text style={styles.payBtnText}>{t('pay_amount', { amount: `₹${selectedPlan?.amount || 0}` })}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: {
    ...textStyles.h3,
    color: colors.neutral.white,
    fontWeight: '600',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 32,
    gap: spacing.md,
  },
  amountHero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: 4,
  },
  amountIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  amountHeroLabel: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountHeroValue: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.neutral.black,
    lineHeight: 52,
  },
  amountHeroDuration: {
    ...textStyles.body,
    color: colors.neutral.mediumGray,
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardTitle: {
    ...textStyles.label,
    color: colors.neutral.mediumGray,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  summaryRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    ...textStyles.body,
    color: colors.neutral.darkGray,
    fontSize: 14,
  },
  summaryValue: {
    ...textStyles.body,
    color: colors.neutral.black,
    fontWeight: '500',
    maxWidth: '55%',
    textAlign: 'right',
    fontSize: 14,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: spacing.sm,
  },
  secureBadgeText: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
    fontSize: 11,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray,
  },
  payBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  payBtnDisabled: { opacity: 0.7 },
  payBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  payBtnText: {
    ...textStyles.body,
    color: colors.neutral.white,
    fontWeight: '700',
    fontSize: 16,
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

export default DthReviewScreen;
