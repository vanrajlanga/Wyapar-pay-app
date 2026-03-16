/**
 * Receipt Component for Image Capture
 * Designed to be captured as a screenshot for sharing
 * Follows PhonePe-style receipt design
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GenericTransactionData,
  PaymentSuccessConfig,
} from '../../types/generic-transaction';
import { TransactionUtils } from '../../utils/transaction.utils';
import { useScreenTranslation } from '../../hooks/useScreenTranslation';
import { colors, textStyles, spacing, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');

interface ReceiptComponentProps {
  transactionData: GenericTransactionData;
  config: PaymentSuccessConfig;
}

export const ReceiptComponent: React.FC<ReceiptComponentProps> = ({
  transactionData,
  config,
}) => {
  const { t } = useScreenTranslation('payment-success');
  const company = transactionData.companyInfo || { name: 'WyaparPay' };
  const date = new Date(transactionData.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.receiptContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <MaterialIcons
            name="account-balance-wallet"
            size={32}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Transaction Successful</Text>
          <Text style={styles.headerSubtitle}>{date}</Text>
        </View>
      </View>

      {/* Paid To Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Paid to</Text>
        <View style={styles.paidToCard}>
          <View style={styles.paidToLeft}>
            <View style={styles.paidToIcon}>
              <MaterialIcons name="phone-android" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.paidToDetails}>
              <Text style={styles.paidToName}>
                {transactionData.metadata?.operatorName || 'Mobile Recharge'}
              </Text>
              <Text style={styles.paidToId}>
                {transactionData.metadata?.mobileNumber || 'N/A'}
              </Text>
            </View>
          </View>
          <Text style={styles.paidToAmount}>
            ₹{transactionData.amount.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Payment Details Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="list" size={16} color="#FFFFFF" />
          <Text style={styles.sectionLabel}>Payment Details</Text>
          <MaterialIcons name="keyboard-arrow-down" size={16} color="#FFFFFF" />
        </View>

        {/* Plan Details */}
        {transactionData.metadata?.planName && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('plan')}</Text>
            <Text style={styles.detailValue}>
              {transactionData.metadata.planName}
            </Text>
          </View>
        )}

        {/* Transaction ID */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('transaction_id')}</Text>
          <View style={styles.transactionIdRow}>
            <Text style={styles.detailValue}>
              {transactionData.transactionId}
            </Text>
            <MaterialIcons name="content-copy" size={16} color="#8B5CF6" />
          </View>
        </View>

        {/* Status */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('status')}</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>SUCCESS</Text>
          </View>
        </View>
      </View>

      {/* Debited From Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Debited from</Text>
        <View style={styles.debitedFromCard}>
          <View style={styles.debitedFromLeft}>
            <View style={styles.bankIcon}>
              <MaterialIcons name="account-balance" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.debitedFromDetails}>
              <Text style={styles.debitedFromAccount}>WyaparPay Wallet</Text>
              <Text style={styles.debitedFromUtr}>
                UTR: {transactionData.transactionId.slice(-12)}
              </Text>
            </View>
          </View>
          <View style={styles.debitedFromRight}>
            <Text style={styles.debitedFromAmount}>
              ₹{transactionData.amount.toFixed(2)}
            </Text>
            <MaterialIcons name="content-copy" size={16} color="#8B5CF6" />
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Thank you for using {company.name}!
        </Text>
        <Text style={styles.footerSubtext}>
          Keep this receipt for your records
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  receiptContainer: {
    width: 400,
    backgroundColor: '#1A1A1A',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignSelf: 'center',
    minHeight: 600,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...textStyles.h4,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: '#B0B0B0',
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...textStyles.body,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: spacing.xs,
    flex: 1,
  },
  paidToCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paidToLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paidToIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  paidToDetails: {
    flex: 1,
  },
  paidToName: {
    ...textStyles.body,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  paidToId: {
    ...textStyles.bodySmall,
    color: '#B0B0B0',
    marginTop: 2,
  },
  paidToAmount: {
    ...textStyles.h4,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  detailLabel: {
    ...textStyles.bodySmall,
    color: '#B0B0B0',
  },
  detailValue: {
    ...textStyles.body,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  transactionIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: spacing.xs,
  },
  statusText: {
    ...textStyles.bodySmall,
    color: '#4CAF50',
    fontWeight: '600',
  },
  debitedFromCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debitedFromLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  debitedFromDetails: {
    flex: 1,
  },
  debitedFromAccount: {
    ...textStyles.body,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  debitedFromUtr: {
    ...textStyles.bodySmall,
    color: '#B0B0B0',
    marginTop: 2,
  },
  debitedFromRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debitedFromAmount: {
    ...textStyles.h4,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  footerText: {
    ...textStyles.body,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  footerSubtext: {
    ...textStyles.bodySmall,
    color: '#B0B0B0',
    marginTop: spacing.xs,
  },
});
