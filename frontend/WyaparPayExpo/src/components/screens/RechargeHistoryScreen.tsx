/**
 * Recharge History Screen
 * Display transaction history with filters and search
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useRecharge } from '../../contexts/RechargeContext';
import { NavigationProps } from '../../types/navigation';
import {
  colors,
  textStyles,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';
import { RechargeTransaction } from '../../types/recharge';

interface RechargeHistoryScreenProps extends NavigationProps {}

type StatusFilter = 'all' | 'success' | 'failed' | 'pending';

export const RechargeHistoryScreen: React.FC<RechargeHistoryScreenProps> = ({
  setCurrentScreen,
}) => {
  const { t } = useTranslation('recharge');
  const { t: tc } = useTranslation('common');

  const {
    transactionHistory,
    isLoadingHistory,
    loadTransactionHistory,
    updateFormData,
    resetFormData,
  } = useRecharge();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Load history on mount
  useEffect(() => {
    loadTransactionHistory();
  }, []);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactionHistory();
    setRefreshing(false);
  };

  // Filter transactions
  const filteredTransactions = transactionHistory.filter((transaction) => {
    // Status filter
    if (statusFilter !== 'all' && transaction.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const mobileNumber = transaction.metadata?.mobileNumber || '';
      const description = transaction.description.toLowerCase();

      return (
        mobileNumber.includes(query) ||
        description.includes(query) ||
        transaction.id.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce(
    (groups, transaction) => {
      const date = new Date(transaction.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey: string;
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
      return groups;
    },
    {} as Record<string, RechargeTransaction[]>
  );

  const handleStatusFilterChange = (filter: StatusFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStatusFilter(filter);
  };

  const handleQuickRecharge = (transaction: RechargeTransaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Pre-fill form with transaction data
    if (
      transaction.metadata?.mobileNumber &&
      transaction.metadata?.operatorCode
    ) {
      resetFormData();
      updateFormData({
        mobileNumber: transaction.metadata.mobileNumber,
        operatorCode: transaction.metadata.operatorCode,
        operatorName: transaction.metadata.operatorCode, // TODO: Get from operators list
        circleCode: transaction.metadata.circleCode || '',
        circleName: transaction.metadata.circleCode || '',
        amount: transaction.amount,
      });
      setCurrentScreen('recharge-plans');
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'success':
        return styles.successBadge;
      case 'failed':
        return styles.failureBadge;
      case 'pending':
        return styles.pendingBadge;
      default:
        return styles.cancelledBadge;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'success':
        return styles.successBadgeText;
      case 'failed':
        return styles.failureBadgeText;
      case 'pending':
        return styles.pendingBadgeText;
      default:
        return styles.cancelledBadgeText;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={colors.gradients.primary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentScreen('dashboard');
          }}
          style={styles.backButton}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={colors.neutral.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('recharge_history')}</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color={colors.neutral.mediumGray}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_placeholder')}
          placeholderTextColor={colors.neutral.mediumGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons
              name="close"
              size={20}
              color={colors.neutral.mediumGray}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            statusFilter === 'all' && styles.filterChipActive,
          ]}
          onPress={() => handleStatusFilterChange('all')}
        >
          <Text
            style={[
              styles.filterChipText,
              statusFilter === 'all' && styles.filterChipTextActive,
            ]}
          >
            {tc('all')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            statusFilter === 'success' && styles.filterChipActive,
          ]}
          onPress={() => handleStatusFilterChange('success')}
        >
          <MaterialIcons
            name="check-circle"
            size={16}
            color={
              statusFilter === 'success'
                ? colors.primary.main
                : colors.neutral.mediumGray
            }
          />
          <Text
            style={[
              styles.filterChipText,
              statusFilter === 'success' && styles.filterChipTextActive,
            ]}
          >
            {tc('success')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            statusFilter === 'failed' && styles.filterChipActive,
          ]}
          onPress={() => handleStatusFilterChange('failed')}
        >
          <MaterialIcons
            name="error"
            size={16}
            color={
              statusFilter === 'failed'
                ? colors.primary.main
                : colors.neutral.mediumGray
            }
          />
          <Text
            style={[
              styles.filterChipText,
              statusFilter === 'failed' && styles.filterChipTextActive,
            ]}
          >
            {tc('failed')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            statusFilter === 'pending' && styles.filterChipActive,
          ]}
          onPress={() => handleStatusFilterChange('pending')}
        >
          <MaterialIcons
            name="hourglass-empty"
            size={16}
            color={
              statusFilter === 'pending'
                ? colors.primary.main
                : colors.neutral.mediumGray
            }
          />
          <Text
            style={[
              styles.filterChipText,
              statusFilter === 'pending' && styles.filterChipTextActive,
            ]}
          >
            {tc('pending')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Transactions List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
          />
        }
      >
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
            <Text style={styles.loadingText}>{tc('loading')}...</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="history"
              size={64}
              color={colors.neutral.mediumGray}
            />
            <Text style={styles.emptyText}>
              {searchQuery || statusFilter !== 'all'
                ? t('no_transactions_found')
                : t('no_recharge_history')}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || statusFilter !== 'all'
                ? t('try_changing_filters')
                : t('recharge_transactions_will_appear')}
            </Text>
          </View>
        ) : (
          Object.entries(groupedTransactions).map(([dateKey, transactions]) => (
            <View key={dateKey} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{dateKey}</Text>
              {transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionLeft}>
                      <MaterialIcons
                        name="phone-android"
                        size={20}
                        color={colors.primary.main}
                      />
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionNumber}>
                          {transaction.metadata?.mobileNumber || 'N/A'}
                        </Text>
                        <Text style={styles.transactionOperator}>
                          {transaction.metadata?.operatorCode || 'N/A'} •{' '}
                          {transaction.metadata?.circleCode || 'N/A'}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        getStatusBadgeStyle(transaction.status),
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          getStatusTextStyle(transaction.status),
                        ]}
                      >
                        {transaction.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.transactionDetails}>
                    <View style={styles.transactionAmount}>
                      <Text style={styles.amountLabel}>Amount</Text>
                      <Text style={styles.amountValue}>
                        ₹{transaction.amount}
                      </Text>
                    </View>
                    <View style={styles.transactionTime}>
                      <Text style={styles.timeText}>
                        {new Date(transaction.createdAt).toLocaleTimeString(
                          'en-IN',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.transactionFooter}>
                    <Text style={styles.transactionId} numberOfLines={1}>
                      ID: {transaction.id}
                    </Text>
                    {transaction.status === 'success' && (
                      <TouchableOpacity
                        style={styles.quickRechargeButton}
                        onPress={() => handleQuickRecharge(transaction)}
                      >
                        <MaterialIcons
                          name="refresh"
                          size={16}
                          color={colors.primary.main}
                        />
                        <Text style={styles.quickRechargeText}>
                          Recharge Again
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  header: {
    paddingTop: spacing['3xl'] + spacing.base,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    ...shadows.lg,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.neutral.white,
    marginBottom: spacing.xs,
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.neutral.black,
    paddingVertical: spacing.md,
  },
  filtersContainer: {
    maxHeight: 48,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filtersContent: {
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.lightGray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral.gray,
    gap: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterChipText: {
    ...textStyles.bodySmall,
    color: colors.neutral.darkGray,
    fontWeight: '500',
  },
  filterChipTextActive: {
    ...textStyles.bodySmall,
    color: colors.neutral.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  loadingText: {
    ...textStyles.body,
    color: colors.neutral.darkGray,
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    ...textStyles.h4,
    color: colors.neutral.darkGray,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...textStyles.body,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    ...textStyles.h6,
    color: colors.neutral.black,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  transactionCard: {
    backgroundColor: colors.neutral.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  transactionNumber: {
    ...textStyles.h6,
    color: colors.neutral.black,
    fontWeight: '600',
  },
  transactionOperator: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
    marginTop: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  successBadge: {
    backgroundColor: colors.success.bg,
  },
  failureBadge: {
    backgroundColor: colors.error.bg,
  },
  pendingBadge: {
    backgroundColor: colors.warning.bg,
  },
  cancelledBadge: {
    backgroundColor: colors.neutral.lightGray,
  },
  statusBadgeText: {
    ...textStyles.caption,
    fontWeight: 'bold',
  },
  successBadgeText: {
    color: colors.success.main,
  },
  failureBadgeText: {
    color: colors.error.main,
  },
  pendingBadgeText: {
    color: colors.warning.main,
  },
  cancelledBadgeText: {
    color: colors.neutral.mediumGray,
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
  },
  transactionAmount: {
    flex: 1,
  },
  amountLabel: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
  },
  amountValue: {
    ...textStyles.h4,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginTop: spacing.xs,
  },
  transactionTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  transactionId: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
    flex: 1,
  },
  quickRechargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary.bg,
    borderRadius: borderRadius.sm,
  },
  quickRechargeText: {
    ...textStyles.caption,
    color: colors.primary.main,
    fontWeight: '500',
  },
});
