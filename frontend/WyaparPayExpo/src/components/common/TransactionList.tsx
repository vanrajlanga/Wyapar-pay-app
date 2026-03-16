/**
 * Transaction List Component
 * Reusable component for displaying lists of transactions
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Transaction, TransactionListProps } from '../../types/transaction';
import { TransactionItem } from './TransactionItem';
import { TransactionUtils } from '../../utils/transaction.utils';
import { colors, textStyles, spacing, borderRadius } from '../../theme';
import { Card } from '../ui';

interface TransactionListComponentProps extends TransactionListProps {
  onTransactionPress?: (transaction: Transaction) => void;
  emptyMessage?: string;
  emptySubMessage?: string;
  showHeader?: boolean;
  headerTitle?: string;
  headerAction?: {
    text: string;
    onPress: () => void;
  };
}

export const TransactionList: React.FC<TransactionListComponentProps> = ({
  transactions,
  loading = false,
  onTransactionPress,
  onRefresh,
  onLoadMore,
  showSummary = false,
  showFilters = false,
  config = {},
  emptyMessage = 'No transactions found',
  emptySubMessage = 'Your transaction history will appear here',
  showHeader = false,
  headerTitle,
  headerAction,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  }, [onRefresh]);

  const handleLoadMore = useCallback(() => {
    if (!loading) {
      onLoadMore?.();
    }
  }, [loading, onLoadMore]);

  const renderTransactionItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionItem
        transaction={item}
        onPress={onTransactionPress}
        showMetadata={config.showMetadata !== false}
        showStatus={config.showStatus !== false}
        compact={config.compact || false}
      />
    ),
    [onTransactionPress, config]
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="receipt" size={64} color={colors.text.secondary} />
        <Text style={styles.emptyTitle}>{emptyMessage}</Text>
        <Text style={styles.emptySubtitle}>{emptySubMessage}</Text>
      </View>
    ),
    [emptyMessage, emptySubMessage]
  );

  const renderHeader = useCallback(() => {
    if (!showHeader) return null;

    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        {headerAction && (
          <TouchableOpacity
            onPress={headerAction.onPress}
            style={styles.headerAction}
          >
            <Text style={styles.headerActionText}>{headerAction.text}</Text>
            <MaterialIcons
              name="arrow-forward"
              size={16}
              color={colors.primary.main}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }, [showHeader, headerTitle, headerAction]);

  const renderSummary = useCallback(() => {
    if (!showSummary || transactions.length === 0) return null;

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const successCount = transactions.filter(
      (t) => t.status === 'success'
    ).length;
    const successRate =
      transactions.length > 0 ? (successCount / transactions.length) * 100 : 0;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{transactions.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Amount</Text>
          <Text style={styles.summaryValue}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Success Rate</Text>
          <Text style={styles.summaryValue}>{successRate.toFixed(1)}%</Text>
        </View>
      </View>
    );
  }, [showSummary, transactions]);

  const renderFooter = useCallback(() => {
    if (loading && transactions.length > 0) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={colors.primary.main} />
        </View>
      );
    }
    return null;
  }, [loading, transactions.length]);

  return (
    <Card variant="default" padding={0}>
      {renderHeader()}
      {renderSummary()}

      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary.main}
            />
          ) : undefined
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        scrollEventThrottle={400}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    ...textStyles.headingSmall,
    color: colors.text.primary,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionText: {
    ...textStyles.bodyMedium,
    color: colors.primary.main,
    marginRight: spacing.xs,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...textStyles.bodyMedium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...textStyles.bodyLarge,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...textStyles.bodyMedium,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.md,
    alignItems: 'center',
  },
});
