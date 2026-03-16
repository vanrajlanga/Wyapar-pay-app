/**
 * DTH Plans Screen
 * Matches RechargePlansScreen design — category tabs + expandable plan cards
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationProps } from '../../types/navigation';
import { colors, textStyles, spacing, borderRadius, shadows } from '../../theme';
import { rechargeService } from '../../services/recharge.service';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../contexts/ToastContext';

interface DthPlan {
  PlanName: string;
  Channels?: string;
  PaidChannels?: string;
  HdChannels?: string;
  last_update?: string;
  PricingList: { Amount: string; Month: string }[];
}

interface DthLanguageGroup {
  Language?: string;
  PackCount?: string;
  Details: DthPlan[];
}

interface DthPlansScreenProps extends NavigationProps {
  dthOperatorId?: string;
  dthOperatorName?: string;
  onPlanSelected?: (plan: { name: string; amount: number; months: string }) => void;
}

export const DthPlansScreen: React.FC<DthPlansScreenProps> = ({
  setCurrentScreen,
  dthOperatorId,
  dthOperatorName,
  onPlanSelected,
}) => {
  const { t } = useTranslation('recharge');
  const { t: tc } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const { showError } = useToast();

  const [plans, setPlans] = useState<Record<string, DthLanguageGroup[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (dthOperatorId) fetchPlans();
  }, [dthOperatorId]);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const result = await rechargeService.getDthPlans(dthOperatorId!);
      setPlans(result.plans || {});
      const cats = Object.keys(result.plans || {});
      setCategories(cats);
      if (cats.length > 0) setSelectedCategory(cats[0]);
    } catch (error: any) {
      showError(tc('error'), t('failed_load_dth_plans'));
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlans: DthPlan[] = (plans[selectedCategory] || []).flatMap(g => g.Details || []);

  const handleSelectPricing = (plan: DthPlan, pricing: { Amount: string; Month: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const amountStr = pricing.Amount.replace(/[₹,]/g, '').trim();
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      showError(tc('error'), t('invalid_plan_amount'));
      return;
    }
    if (onPlanSelected) {
      onPlanSelected({
        name: `${plan.PlanName} - ${pricing.Month}`,
        amount,
        months: pricing.Month,
      });
    }
    setCurrentScreen('dth-review');
  };

  const toggleExpand = (planName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedPlan(prev => (prev === planName ? null : planName));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={colors.gradients.primary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentScreen('dth-entry');
          }}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.neutral.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <MaterialIcons name="tv" size={18} color={colors.neutral.white} style={{ marginBottom: 2 }} />
          <Text style={styles.headerTitle}>{dthOperatorName || t('dth_plans')}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loaderText}>{t('loading_plans')}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]}
        >
          {/* Sticky Category Tabs */}
          <View style={styles.stickyTabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTabsContent}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryTab, isSelected && styles.categoryTabSelected]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(cat);
                      setExpandedPlan(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={isSelected ? styles.categoryTabTextSelected : styles.categoryTabText}>
                      {cat}
                    </Text>
                    {isSelected && <View style={styles.categoryTabUnderline} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Plans List */}
          <View style={styles.content}>
            {currentPlans.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="info-outline" size={48} color={colors.neutral.mediumGray} />
                <Text style={styles.emptyStateTitle}>{t('no_plans')}</Text>
                <Text style={styles.emptyStateSubtitle}>{t('try_different_category_short')}</Text>
              </View>
            ) : (
              currentPlans.map((plan, idx) => {
                const isExpanded = expandedPlan === plan.PlanName;
                const firstPrice = plan.PricingList?.[0];

                return (
                  <TouchableOpacity
                    key={`${plan.PlanName}-${idx}`}
                    style={styles.planCard}
                    onPress={() => toggleExpand(plan.PlanName)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.planMainContent}>
                      {/* Left: Price */}
                      <View style={styles.planPriceSection}>
                        <Text style={styles.planAmount}>{firstPrice?.Amount || '-'}</Text>
                        <Text style={styles.planAmountLabel}>{t('from')}</Text>
                      </View>

                      {/* Right: Details */}
                      <View style={styles.planDetailsSection}>
                        <Text style={styles.planName}>{plan.PlanName}</Text>
                        {plan.Channels ? (
                          <Text style={styles.planMeta}>{plan.Channels}</Text>
                        ) : null}
                        {plan.HdChannels ? (
                          <Text style={styles.planMeta}>{plan.HdChannels}</Text>
                        ) : null}
                        <Text style={styles.planDurationCount}>
                          {plan.PricingList?.length || 0} duration{plan.PricingList?.length !== 1 ? 's' : ''} available
                        </Text>
                      </View>

                      {/* Chevron */}
                      <MaterialIcons
                        name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                        size={24}
                        color={colors.neutral.mediumGray}
                        style={styles.chevronIcon}
                      />
                    </View>

                    {/* Expanded Pricing List */}
                    {isExpanded && (
                      <View style={styles.pricingContainer}>
                        <View style={styles.pricingDivider} />
                        <Text style={styles.pricingLabel}>{t('select_duration')}</Text>
                        {(plan.PricingList || []).map((pricing, pIdx) => (
                          <TouchableOpacity
                            key={pIdx}
                            style={styles.pricingRow}
                            onPress={() => handleSelectPricing(plan, pricing)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.pricingLeft}>
                              <MaterialIcons
                                name="access-time"
                                size={16}
                                color={colors.neutral.mediumGray}
                              />
                              <Text style={styles.pricingMonth}>{pricing.Month}</Text>
                            </View>
                            <LinearGradient
                              colors={colors.gradients.primary}
                              style={styles.pricingBtn}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                            >
                              <Text style={styles.pricingAmount}>{pricing.Amount}</Text>
                              <MaterialIcons name="arrow-forward" size={14} color={colors.neutral.white} />
                            </LinearGradient>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
      )}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.lg,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.neutral.white,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loaderText: {
    ...textStyles.body,
    color: colors.neutral.mediumGray,
    marginTop: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  stickyTabsContainer: {
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
    paddingVertical: spacing.xs,
    ...shadows.sm,
  },
  categoryTabsContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.lg,
  },
  categoryTab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    position: 'relative',
  },
  categoryTabSelected: {
    backgroundColor: 'transparent',
  },
  categoryTabText: {
    ...textStyles.body,
    color: colors.neutral.mediumGray,
    fontWeight: '500',
    fontSize: 14,
  },
  categoryTabTextSelected: {
    ...textStyles.body,
    color: colors.neutral.black,
    fontWeight: '700',
    fontSize: 14,
  },
  categoryTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary.main,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: spacing.sm,
  },
  emptyStateTitle: {
    ...textStyles.h4,
    color: colors.neutral.darkGray,
    marginTop: spacing.md,
  },
  emptyStateSubtitle: {
    ...textStyles.body,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  planMainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  planPriceSection: {
    marginRight: spacing.md,
    alignItems: 'flex-start',
    minWidth: 60,
  },
  planAmount: {
    fontSize: 22,
    color: colors.neutral.black,
    fontWeight: '700',
    lineHeight: 26,
  },
  planAmountLabel: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
    fontSize: 11,
  },
  planDetailsSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  planName: {
    ...textStyles.body,
    color: colors.neutral.black,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 3,
  },
  planMeta: {
    ...textStyles.caption,
    color: colors.neutral.darkGray,
    fontSize: 12,
    marginBottom: 2,
  },
  planDurationCount: {
    ...textStyles.caption,
    color: colors.primary.main,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  chevronIcon: {
    marginTop: 2,
  },
  pricingContainer: {
    marginTop: spacing.md,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: colors.neutral.lightGray,
    marginBottom: spacing.md,
  },
  pricingLabel: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    fontSize: 11,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  pricingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pricingMonth: {
    ...textStyles.body,
    color: colors.neutral.darkGray,
    fontSize: 14,
  },
  pricingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  pricingAmount: {
    ...textStyles.body,
    color: colors.neutral.white,
    fontWeight: '700',
    fontSize: 14,
  },
  bottomSpacer: {
    height: spacing['3xl'],
  },
});

export default DthPlansScreen;
