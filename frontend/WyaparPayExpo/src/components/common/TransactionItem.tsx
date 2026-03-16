/**
 * Transaction Item Component
 * Reusable component for displaying individual transactions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Transaction } from '../../types/transaction';
import { TransactionUtils } from '../../utils/transaction.utils';
import { colors, textStyles, spacing, borderRadius } from '../../theme';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
  showMetadata?: boolean;
  showStatus?: boolean;
  compact?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
  showMetadata = true,
  showStatus = true,
  compact = false,
}) => {
  const statusColor = TransactionUtils.getStatusColor(transaction.status);
  const categoryIcon = TransactionUtils.getCategoryIcon(transaction.category);
  const description = TransactionUtils.getTransactionDescription(transaction);
  const metadataValue = TransactionUtils.getMetadataDisplayValue(transaction);
  const formattedTime = TransactionUtils.formatTransactionTime(
    transaction.createdAt
  );
  const formattedAmount = TransactionUtils.formatTransactionAmount(
    transaction.amount,
    TransactionUtils.isCreditTransaction(transaction)
  );
  const isCredit = TransactionUtils.isCreditTransaction(transaction);

  const handlePress = () => {
    onPress?.(transaction);
  };

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compactContainer]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: statusColor + '20' },
          ]}
        >
          <MaterialIcons
            name={categoryIcon as any}
            size={compact ? 20 : 24}
            color={statusColor}
          />
        </View>

        <View style={styles.content}>
          <Text
            style={[styles.title, compact && styles.compactTitle]}
            numberOfLines={1}
          >
            {description}
          </Text>

          {showMetadata && metadataValue && (
            <Text style={[styles.metadata, compact && styles.compactMetadata]}>
              {metadataValue}
            </Text>
          )}

          <Text style={[styles.time, compact && styles.compactTime]}>
            {formattedTime}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text
          style={[
            styles.amount,
            { color: isCredit ? colors.success.main : colors.error.main },
            compact && styles.compactAmount,
          ]}
        >
          {formattedAmount}
        </Text>

        {showStatus && (
          <View
            style={[styles.statusContainer, compact && styles.compactStatus]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text
              style={[styles.statusText, compact && styles.compactStatusText]}
            >
              {transaction.status.toUpperCase()}
            </Text>
          </View>
        )}

        <Text
          style={[styles.transactionId, compact && styles.compactTransactionId]}
        >
          {transaction.id.substring(0, 8)}...
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  compactContainer: {
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    ...textStyles.bodyMedium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  compactTitle: {
    ...textStyles.bodySmall,
    marginBottom: 2,
  },
  metadata: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  compactMetadata: {
    fontSize: 11,
  },
  time: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  compactTime: {
    fontSize: 9,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    ...textStyles.bodyMedium,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  compactAmount: {
    ...textStyles.bodySmall,
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  compactStatus: {
    marginBottom: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    ...textStyles.caption,
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  compactStatusText: {
    fontSize: 9,
  },
  transactionId: {
    ...textStyles.caption,
    fontSize: 10,
    color: colors.text.tertiary,
  },
  compactTransactionId: {
    fontSize: 9,
  },
});
