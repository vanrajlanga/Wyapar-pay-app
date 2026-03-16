/**
 * Transaction Filter Component
 * Reusable component for filtering transactions
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  TransactionFilters,
  FilterType,
  TransactionCategory,
  TransactionStatus,
  PaymentMethod,
} from '../../types/transaction';
import { colors, textStyles, spacing, borderRadius } from '../../theme';

interface TransactionFilterProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: TransactionFilters) => void;
  initialFilters?: TransactionFilters;
}

export const TransactionFilter: React.FC<TransactionFilterProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters = {},
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);

  const filterTypes: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'type', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status' },
    { key: 'paymentMethod', label: 'Payment' },
  ];

  const transactionTypes = [
    { key: 'recharge', label: 'Recharge' },
    { key: 'bill_payment', label: 'Bill Payment' },
    { key: 'transfer', label: 'Transfer' },
    { key: 'refund', label: 'Refund' },
    { key: 'cashback', label: 'Cashback' },
    { key: 'withdrawal', label: 'Withdrawal' },
    { key: 'deposit', label: 'Deposit' },
  ];

  const categories = [
    { key: 'mobile_recharge', label: 'Mobile Recharge' },
    { key: 'dth_recharge', label: 'DTH Recharge' },
    { key: 'broadband_recharge', label: 'Broadband' },
    { key: 'electricity_bill', label: 'Electricity' },
    { key: 'water_bill', label: 'Water Bill' },
    { key: 'gas_bill', label: 'Gas Bill' },
    { key: 'credit_card_bill', label: 'Credit Card' },
    { key: 'loan_repayment', label: 'Loan' },
    { key: 'insurance_premium', label: 'Insurance' },
    { key: 'fastag_recharge', label: 'FASTag' },
    { key: 'upi_transfer', label: 'UPI Transfer' },
    { key: 'bank_transfer', label: 'Bank Transfer' },
    { key: 'wallet_transfer', label: 'Wallet Transfer' },
    { key: 'cashback_earned', label: 'Cashback' },
    { key: 'refund_received', label: 'Refund' },
    { key: 'wallet_topup', label: 'Wallet Top-up' },
    { key: 'withdrawal_to_bank', label: 'Withdrawal' },
  ];

  const statuses = [
    { key: 'success', label: 'Success' },
    { key: 'failed', label: 'Failed' },
    { key: 'pending', label: 'Pending' },
    { key: 'processing', label: 'Processing' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'refunded', label: 'Refunded' },
  ];

  const paymentMethods = [
    { key: 'wallet', label: 'Wallet' },
    { key: 'upi', label: 'UPI' },
    { key: 'card', label: 'Card' },
    { key: 'net_banking', label: 'Net Banking' },
    { key: 'bank_transfer', label: 'Bank Transfer' },
  ];

  const handleFilterSelect = useCallback((filterType: FilterType) => {
    setActiveFilter(filterType);
  }, []);

  const handleOptionSelect = useCallback((key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setActiveFilter('all');
  }, []);

  const handleApplyFilters = useCallback(() => {
    onApply(filters);
    onClose();
  }, [filters, onApply, onClose]);

  const getCurrentOptions = () => {
    switch (activeFilter) {
      case 'type':
        return transactionTypes;
      case 'category':
        return categories;
      case 'status':
        return statuses;
      case 'paymentMethod':
        return paymentMethods;
      default:
        return [];
    }
  };

  const renderFilterChips = () => (
    <View style={styles.filterChips}>
      {filterTypes.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterChip,
            activeFilter === filter.key && styles.filterChipActive,
          ]}
          onPress={() => handleFilterSelect(filter.key)}
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === filter.key && styles.filterChipTextActive,
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOptions = () => {
    const options = getCurrentOptions();

    if (options.length === 0) return null;

    return (
      <View style={styles.optionsContainer}>
        <ScrollView style={styles.optionsScroll}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.optionItem,
                filters[activeFilter as keyof TransactionFilters] ===
                  option.key && styles.optionItemActive,
              ]}
              onPress={() => handleOptionSelect(activeFilter, option.key)}
            >
              <Text
                style={[
                  styles.optionText,
                  filters[activeFilter as keyof TransactionFilters] ===
                    option.key && styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {filters[activeFilter as keyof TransactionFilters] ===
                option.key && (
                <MaterialIcons
                  name="check"
                  size={20}
                  color={colors.primary.main}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Transactions</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons
                name="close"
                size={24}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Filter By</Text>
              {renderFilterChips()}
            </View>

            {renderOptions()}
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearFilters}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilters}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    ...textStyles.headingSmall,
    color: colors.text.primary,
  },
  modalBody: {
    flex: 1,
    padding: spacing.lg,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterChipText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  optionsContainer: {
    flex: 1,
  },
  optionsScroll: {
    flex: 1,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionItemActive: {
    backgroundColor: colors.primary.main + '20',
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  optionText: {
    ...textStyles.bodyMedium,
    color: colors.text.primary,
  },
  optionTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  clearButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  clearButtonText: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
  },
  applyButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
  },
  applyButtonText: {
    ...textStyles.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
});
