/**
 * Transaction History Screen
 * Comprehensive transaction management with filters and search
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  RefreshControl,
  StatusBar,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useScreenTranslation } from '../../hooks/useScreenTranslation';
import {
  transactionService,
  Transaction,
  TransactionFilters,
  TransactionSummary,
} from '../../services/transaction.service';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../services/logger.service';
import {
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
} from '../../utils/i18nFormatters';

interface TransactionHistoryScreenProps {
  setCurrentScreen: (screen: string) => void;
  triggerHaptic?: () => void;
}

type FilterType = 'all' | 'type' | 'category' | 'status' | 'paymentMethod';
type SortType = 'date' | 'amount' | 'status';

const TRANSACTION_TYPES = [
  { value: 'recharge', label: 'Recharge', icon: 'phone-android' },
  { value: 'bill_payment', label: 'Bill Payment', icon: 'receipt' },
  { value: 'transfer', label: 'Transfer', icon: 'swap-horiz' },
  { value: 'refund', label: 'Refund', icon: 'undo' },
  { value: 'cashback', label: 'Cashback', icon: 'monetization-on' },
  { value: 'withdrawal', label: 'Withdrawal', icon: 'arrow-downward' },
  { value: 'deposit', label: 'Deposit', icon: 'add-circle' },
];

const TRANSACTION_CATEGORIES = [
  { value: 'mobile_recharge', label: 'Mobile Recharge', icon: 'phone-android' },
  { value: 'dth_recharge', label: 'DTH Recharge', icon: 'tv' },
  { value: 'broadband_recharge', label: 'Broadband', icon: 'wifi' },
  { value: 'electricity_bill', label: 'Electricity', icon: 'flash-on' },
  { value: 'water_bill', label: 'Water Bill', icon: 'water-drop' },
  { value: 'gas_bill', label: 'Gas Bill', icon: 'local-gas-station' },
  { value: 'credit_card_bill', label: 'Credit Card', icon: 'credit-card' },
  { value: 'loan_repayment', label: 'Loan', icon: 'account-balance' },
  { value: 'insurance_premium', label: 'Insurance', icon: 'security' },
  { value: 'fastag_recharge', label: 'FASTag', icon: 'directions-car' },
  { value: 'upi_transfer', label: 'UPI Transfer', icon: 'account-balance-wallet' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: 'account-balance' },
  { value: 'cashback_earned', label: 'Cashback', icon: 'monetization-on' },
  { value: 'refund_received', label: 'Refund', icon: 'undo' },
];

const TRANSACTION_STATUSES = [
  { value: 'success', label: 'Success', color: '#10b981', bg: '#d1fae5' },
  { value: 'failed', label: 'Failed', color: '#ef4444', bg: '#fee2e2' },
  { value: 'pending', label: 'Pending', color: '#f59e0b', bg: '#fef3c7' },
  { value: 'processing', label: 'Processing', color: '#3b82f6', bg: '#dbeafe' },
  { value: 'cancelled', label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' },
  { value: 'refunded', label: 'Refunded', color: '#8b5cf6', bg: '#ede9fe' },
];

const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI', icon: 'account-balance-wallet' },
  { value: 'card', label: 'Card', icon: 'credit-card' },
  { value: 'net_banking', label: 'Net Banking', icon: 'account-balance' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: 'account-balance' },
];

const CATEGORY_COLORS: Record<string, string> = {
  mobile_recharge: '#3b82f6',
  dth_recharge: '#8b5cf6',
  broadband_recharge: '#06b6d4',
  electricity_bill: '#f59e0b',
  water_bill: '#0ea5e9',
  gas_bill: '#f97316',
  credit_card_bill: '#ec4899',
  loan_repayment: '#6366f1',
  insurance_premium: '#14b8a6',
  fastag_recharge: '#84cc16',
  upi_transfer: '#22c55e',
  bank_transfer: '#64748b',
  cashback_earned: '#10b981',
  refund_received: '#a855f7',
};

const getTransactionDescription = (transaction: Transaction): string => {
  if (transaction.description) return transaction.description;

  if (transaction.type === 'recharge' && transaction.metadata) {
    const metadata = transaction.metadata as any;
    const operator = metadata.operator || metadata.operatorName || '';
    const mobile = metadata.mobile_number || metadata.mobileNumber || '';
    const amount = transaction.amount;
    if (operator && mobile) return `${operator} ₹${Number(amount).toFixed(0)} - ${mobile}`;
    if (operator) return `${operator} Mobile Recharge`;
    if (mobile) return `Mobile Recharge - ${mobile}`;
  }

  const typeLabels: Record<string, string> = {
    recharge: 'Mobile Recharge',
    mobile_recharge: 'Mobile Recharge',
    dth_recharge: 'DTH Recharge',
    electricity_bill: 'Electricity Bill',
    water_bill: 'Water Bill',
    gas_bill: 'Gas Bill',
  };

  return typeLabels[transaction.type] || typeLabels[transaction.category || ''] || 'Transaction';
};

export const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({
  setCurrentScreen,
  triggerHaptic,
}) => {
  const { t } = useScreenTranslation('transactions');
  const { tokens } = useAuth();
  const { showError } = useToast();
  const insets = useSafeAreaInsets();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [filters, setFilters] = useState<TransactionFilters>({});
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isFetchingRef = useRef(false);

  const fetchTransactions = useCallback(
    async (page: number = 1, reset: boolean = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        if (!tokens?.accessToken) return;
        if (reset) { setIsLoading(true); setCurrentPage(1); }

        const response = await transactionService.getTransactions(
          filters,
          page,
          50, // Fetch more for client-side search
          tokens.accessToken
        );

        if (reset) setTransactions(response.transactions);
        else setTransactions((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newItems = response.transactions.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newItems];
        });

        setHasMore(page < response.totalPages);
        setCurrentPage(page);
      } catch (error) {
        logger.error('Failed to load transactions', error);
        showError('Error', 'Failed to load transactions.');
        if (reset) setTransactions([]);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [tokens?.accessToken, filters]
  );

  const loadSummary = useCallback(async () => {
    try {
      if (!tokens?.accessToken) return;
      const summaryData = await transactionService.getTransactionSummary(filters, tokens.accessToken);
      setSummary(summaryData);
    } catch (error) {
      logger.error('Failed to load transaction summary', error);
    }
  }, [tokens?.accessToken, filters]);

  // Load on mount and when filters change
  useEffect(() => {
    isFetchingRef.current = false;
    fetchTransactions(1, true);
    loadSummary();
  }, [fetchTransactions, loadSummary]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    isFetchingRef.current = false;
    fetchTransactions(1, true);
    loadSummary();
  }, [fetchTransactions, loadSummary]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) fetchTransactions(currentPage + 1, false);
  }, [hasMore, isLoading, currentPage, fetchTransactions]);

  const applyFilter = useCallback((key: string, value: string | undefined) => {
    setFilters((prev) => {
      if (prev[key as keyof TransactionFilters] === value) {
        const next = { ...prev };
        delete next[key as keyof TransactionFilters];
        return next;
      }
      return { ...prev, [key]: value };
    });
    setShowFilters(false);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    setActiveFilter('all');
  }, []);

  const handleTransactionPress = useCallback(
    (transaction: Transaction) => {
      setSelectedTransaction(transaction);
      setShowTransactionDetails(true);
      triggerHaptic?.();
    },
    [triggerHaptic]
  );

  const handleShareTransaction = async (tx: Transaction) => {
    try {
      const meta = tx.metadata as any;
      const desc = getTransactionDescription(tx);
      const statusLabel = getStatusInfo(tx.status).label || tx.status;
      const date = formatDateTime(tx.createdAt);
      const mobileNumber = meta?.mobileNumber || meta?.mobile_number || meta?.subscriberId || '';
      const operator = meta?.operatorName || meta?.operator || meta?.operatorCode || '';
      const paymentId = meta?.razorpay_payment_id || tx.gatewayRef || '';

      const lines = [
        `WyaparPay - Transaction Receipt`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `${desc}`,
        ``,
        `Amount: ₹${Number(tx.amount).toFixed(2)}`,
        `Status: ${statusLabel}`,
        `Date: ${date}`,
        ...(mobileNumber ? [`Number: ${mobileNumber}`] : []),
        ...(operator ? [`Operator: ${operator}`] : []),
        ...(paymentId ? [`Payment ID: ${paymentId}`] : []),
        `Transaction ID: ${tx.id}`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `Powered by WyaparPay`,
      ];

      await Share.share({
        message: lines.join('\n'),
        title: 'Transaction Receipt - WyaparPay',
      });
    } catch (error) {
      logger.error('Failed to share transaction', error);
    }
  };

  const sortedTransactions = useCallback(() => {
    let result = [...transactions];

    // Client-side search filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const desc = getTransactionDescription(t).toLowerCase();
        const category = (t.category || '').toLowerCase().replace(/_/g, ' ');
        const status = (t.status || '').toLowerCase();
        const id = (t.id || '').toLowerCase();
        const meta = t.metadata as any;
        const mobile = (meta?.mobileNumber || meta?.mobile_number || meta?.subscriberId || '').toLowerCase();
        const operator = (meta?.operatorName || meta?.operator || '').toLowerCase();
        return desc.includes(q) || category.includes(q) || status.includes(q) || id.includes(q) || mobile.includes(q) || operator.includes(q);
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortBy === 'amount') cmp = a.amount - b.amount;
      else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transactions, searchQuery, sortBy, sortOrder]);

  const getStatusInfo = (status: string) =>
    TRANSACTION_STATUSES.find((s) => s.value === status) || { color: '#6b7280', bg: '#f3f4f6', label: status };

  const getCategoryIcon = (category?: string) =>
    TRANSACTION_CATEGORIES.find((c) => c.value === category)?.icon || 'receipt';

  const getCategoryColor = (category?: string) =>
    CATEGORY_COLORS[category || ''] || '#6b7280';

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0;

  // ── Transaction row ──────────────────────────────────────────────────────────
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const statusInfo = getStatusInfo(item.status);
    const iconColor = getCategoryColor(item.category);
    const isCredit = item.isCredit;

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => handleTransactionPress(item)}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={[styles.txIcon, { backgroundColor: iconColor + '15' }]}>
          <MaterialIcons name={getCategoryIcon(item.category) as any} size={22} color={iconColor} />
        </View>

        {/* Info */}
        <View style={styles.txInfo}>
          <Text style={styles.txTitle} numberOfLines={1}>
            {getTransactionDescription(item)}
          </Text>
          <Text style={styles.txDate}>{formatDateTime(item.createdAt)}</Text>
        </View>

        {/* Right */}
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: isCredit ? '#10b981' : '#ef4444' }]}>
            {isCredit ? '+' : '-'}₹{Number(item.amount).toFixed(2)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
              {statusInfo.label || item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Filter modal ─────────────────────────────────────────────────────────────
  const renderFilterModal = () => (
    <Modal visible={showFilters} animationType="slide" transparent onRequestClose={() => setShowFilters(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Transactions</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.modalClose}>
              <MaterialIcons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Filter By</Text>
              <View style={styles.filterChips}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'type', label: 'Type' },
                  { key: 'category', label: 'Category' },
                  { key: 'status', label: 'Status' },
                  { key: 'paymentMethod', label: 'Payment' },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
                    onPress={() => setActiveFilter(filter.key as FilterType)}
                  >
                    <Text style={[styles.filterChipText, activeFilter === filter.key && styles.filterChipTextActive]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {activeFilter === 'type' && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Transaction Type</Text>
                {TRANSACTION_TYPES.map((type) => (
                  <TouchableOpacity key={type.value} style={styles.filterOption} onPress={() => applyFilter('type', type.value)}>
                    <MaterialIcons name={type.icon as any} size={20} color="#6b7280" />
                    <Text style={styles.filterOptionText}>{type.label}</Text>
                    {filters.type === type.value && <MaterialIcons name="check-circle" size={20} color="#f97316" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeFilter === 'category' && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Category</Text>
                {TRANSACTION_CATEGORIES.map((category) => (
                  <TouchableOpacity key={category.value} style={styles.filterOption} onPress={() => applyFilter('category', category.value)}>
                    <MaterialIcons name={category.icon as any} size={20} color="#6b7280" />
                    <Text style={styles.filterOptionText}>{category.label}</Text>
                    {filters.category === category.value && <MaterialIcons name="check-circle" size={20} color="#f97316" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeFilter === 'status' && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Status</Text>
                {TRANSACTION_STATUSES.map((status) => (
                  <TouchableOpacity key={status.value} style={styles.filterOption} onPress={() => applyFilter('status', status.value)}>
                    <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                    <Text style={styles.filterOptionText}>{status.label}</Text>
                    {filters.status === status.value && <MaterialIcons name="check-circle" size={20} color="#f97316" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeFilter === 'paymentMethod' && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Payment Method</Text>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity key={method.value} style={styles.filterOption} onPress={() => applyFilter('paymentMethod', method.value)}>
                    <MaterialIcons name={method.icon as any} size={20} color="#6b7280" />
                    <Text style={styles.filterOptionText}>{method.label}</Text>
                    {filters.paymentMethod === method.value && <MaterialIcons name="check-circle" size={20} color="#f97316" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilters(false)}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ── Details modal ────────────────────────────────────────────────────────────
  const renderTransactionDetailsModal = () => {
    const tx = selectedTransaction;
    if (!tx) return null;
    const statusInfo = getStatusInfo(tx.status);

    return (
      <Modal visible={showTransactionDetails} animationType="slide" transparent onRequestClose={() => setShowTransactionDetails(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setShowTransactionDetails(false)} style={styles.modalClose}>
                <MaterialIcons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Amount hero */}
              <View style={styles.detailAmountBox}>
                <Text style={[styles.detailAmountHero, { color: tx.isCredit ? '#10b981' : '#ef4444' }]}>
                  {tx.isCredit ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg, marginTop: 8 }]}>
                  <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>{statusInfo.label || tx.status}</Text>
                </View>
              </View>

              {/* Core details */}
              {[
                { label: 'Description', value: getTransactionDescription(tx) },
                { label: 'Date & Time', value: formatDateTime(tx.createdAt) },
                {
                  label: 'Payment Via',
                  value: (() => {
                    const pm = (tx.paymentMethod || (tx.metadata as any)?.paymentMethod || '').toLowerCase();
                    if (pm === 'upi') return 'Razorpay (UPI)';
                    if (pm === 'card' || pm === 'razorpay') return 'Razorpay';
                    if (pm === 'net_banking') return 'Razorpay (Net Banking)';
                    return 'Razorpay';
                  })(),
                },
                { label: 'Transaction ID', value: tx.id, mono: true },
              ].map(({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
                <View key={label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={[styles.detailValue, mono && styles.monoText]}>{value}</Text>
                </View>
              ))}

              {/* Recharge-specific details */}
              {(() => {
                const meta = tx.metadata as any;
                const skipKeys = new Set(['paymentMethod', 'razorpay_order_id', 'razorpay_payment_id', 'orderId', 'paymentId', 'rechargeexchange', 'plan', 'operatorId']);
                const entries = Object.entries(meta || {}).filter(([k, v]) => !skipKeys.has(k) && v !== null && v !== undefined && typeof v !== 'object' && String(v).trim() !== '');

                const labelMap: Record<string, string> = {
                  mobileNumber: 'Mobile Number',
                  subscriberId: 'Subscriber ID',
                  operatorName: 'Operator',
                  operatorCode: 'Operator',
                  circleCode: 'Circle',
                  planName: 'Plan',
                  planId: 'Plan ID',
                };

                const re = meta?.rechargeexchange;
                const operatorRef = re?.optransid;
                const reReference = re?.referenceid;
                const reTransid = re?.transid;
                const reMessage = re?.message;
                const razorpayOrderId = meta?.razorpay_order_id || meta?.orderId;
                const razorpayPaymentId = meta?.razorpay_payment_id || meta?.paymentId;

                return (
                  <>
                    {entries.length > 0 && (
                      <View style={styles.detailMetaBox}>
                        <Text style={styles.detailMetaTitle}>Recharge Info</Text>
                        {entries.map(([key, value]) => (
                          <View key={key} style={styles.metadataRow}>
                            <Text style={styles.metadataKey}>{labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())}</Text>
                            <Text style={styles.metadataValue}>{String(value)}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {!!(operatorRef || reReference || reTransid) && (
                      <View style={[styles.detailMetaBox, { marginTop: 12 }]}>
                        <Text style={styles.detailMetaTitle}>Provider Reference</Text>
                        {!!operatorRef && (
                          <View style={styles.metadataRow}>
                            <Text style={styles.metadataKey}>Operator Ref</Text>
                            <Text style={[styles.metadataValue, styles.monoText]}>{String(operatorRef)}</Text>
                          </View>
                        )}
                        {!!reReference && (
                          <View style={styles.metadataRow}>
                            <Text style={styles.metadataKey}>RE Reference</Text>
                            <Text style={[styles.metadataValue, styles.monoText]}>{String(reReference)}</Text>
                          </View>
                        )}
                        {!!reTransid && (
                          <View style={styles.metadataRow}>
                            <Text style={styles.metadataKey}>RE Transid</Text>
                            <Text style={[styles.metadataValue, styles.monoText]}>{String(reTransid)}</Text>
                          </View>
                        )}
                        {!!reMessage && (
                          <View style={styles.metadataRow}>
                            <Text style={styles.metadataKey}>Status Msg</Text>
                            <Text style={styles.metadataValue}>{String(reMessage)}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {!!(razorpayOrderId || razorpayPaymentId) && (
                      <View style={[styles.detailMetaBox, { marginTop: 12 }]}>
                        <Text style={styles.detailMetaTitle}>Payment Reference</Text>
                        {!!razorpayPaymentId && (
                          <View style={styles.metadataRow}>
                            <Text style={styles.metadataKey}>Payment ID</Text>
                            <Text style={[styles.metadataValue, styles.monoText]}>{String(razorpayPaymentId)}</Text>
                          </View>
                        )}
                        {!!razorpayOrderId && (
                          <View style={styles.metadataRow}>
                            <Text style={styles.metadataKey}>Order ID</Text>
                            <Text style={[styles.metadataValue, styles.monoText]}>{String(razorpayOrderId)}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </>
                );
              })()}
            </ScrollView>

            {/* Share Button */}
            <View style={styles.detailFooter}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handleShareTransaction(tx)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="share" size={18} color="#fff" />
                <Text style={styles.shareButtonText}>Share Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ea580c" />

      {/* Header */}
      <LinearGradient colors={['#f97316', '#ea580c', '#dc2626']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('dashboard')}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <MaterialIcons name="filter-list" size={24} color="#fff" />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Summary */}
      {summary && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#eff6ff' }]}>
              <MaterialIcons name="receipt-long" size={18} color="#3b82f6" />
            </View>
            <Text style={styles.summaryValue}>{summary.totalTransactions}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#fff7ed' }]}>
              <MaterialIcons name="currency-rupee" size={18} color="#f97316" />
            </View>
            <Text style={styles.summaryValue}>₹{Number(summary.totalAmount).toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Spent</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#f0fdf4' }]}>
              <MaterialIcons name="check-circle-outline" size={18} color="#10b981" />
            </View>
            <Text style={styles.summaryValue}>
              {summary.totalTransactions > 0
                ? ((summary.successCount / summary.totalTransactions) * 100).toFixed(0)
                : 0}%
            </Text>
            <Text style={styles.summaryLabel}>Success</Text>
          </View>
        </View>
      )}

      {/* List */}
      <FlatList
        data={sortedTransactions()}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#f97316" colors={['#f97316']} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <MaterialIcons name="receipt-long" size={40} color="#d1d5db" />
              </View>
              <Text style={styles.emptyTitle}>No transactions found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || Object.keys(filters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Your transaction history will appear here'}
              </Text>
            </View>
          ) : null
        }
      />

      {renderFilterModal()}
      {renderTransactionDetailsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
    borderWidth: 1.5,
    borderColor: '#ea580c',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },

  // Transaction item
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  txInfo: {
    flex: 1,
    marginRight: 10,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  txDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '400',
  },
  txRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },

  // Filter
  filterSection: { marginTop: 20, marginBottom: 4 },
  filterSectionTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  filterChipActive: { backgroundColor: '#fff7ed', borderColor: '#f97316' },
  filterChipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  filterChipTextActive: { color: '#f97316', fontWeight: '600' },
  filterOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f9fafb', gap: 12 },
  filterOptionText: { flex: 1, fontSize: 15, color: '#374151' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  clearButton: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center' },
  clearButtonText: { fontSize: 15, color: '#6b7280', fontWeight: '600' },
  applyButton: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#f97316', alignItems: 'center' },
  applyButtonText: { fontSize: 15, color: '#fff', fontWeight: '700' },

  // Detail modal
  detailAmountBox: { alignItems: 'center', paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', marginBottom: 8 },
  detailAmountHero: { fontSize: 36, fontWeight: '800' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  detailLabel: { fontSize: 13, color: '#9ca3af', fontWeight: '500', flex: 1 },
  detailValue: { fontSize: 14, color: '#111827', fontWeight: '600', flex: 2, textAlign: 'right' },
  monoText: { fontFamily: 'monospace', fontSize: 12 },
  detailMetaBox: { marginTop: 20, backgroundColor: '#f9fafb', borderRadius: 12, padding: 14 },
  detailMetaTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  metadataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  metadataKey: { fontSize: 13, color: '#6b7280', flex: 1 },
  metadataValue: { fontSize: 13, color: '#374151', fontWeight: '500', flex: 1, textAlign: 'right' },

  // Detail footer
  detailFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
