/**
 * Recharge Plans Screen - Production-Ready
 * Showcases operator plans with categories, USPs, and detailed offerings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useRecharge } from '../../contexts/RechargeContext';
import { NavigationProps } from '../../types/navigation';
import { RechargePlan } from '../../types/recharge';
import {
  colors,
  textStyles,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';

interface RechargePlansScreenProps extends NavigationProps {}

// Helper function to format description for better readability
const formatDescription = (description: string): string => {
  if (!description) return 'Check details for more information';

  // Replace separators with bullets for better readability
  return description
    .replace(/\s*\|\s*/g, '\n• ') // Replace | with bullet points
    .replace(/Calls\s*:/gi, '📞 Calls:')
    .replace(/Data\s*:/gi, '📡 Data:')
    .replace(/SMS\s*:/gi, '💬 SMS:')
    .replace(/Details\s*:/gi, 'ℹ️ ')
    .trim();
};

export const RechargePlansScreen: React.FC<RechargePlansScreenProps> = ({
  setCurrentScreen,
}) => {
  const { t } = useTranslation('recharge');
  const { t: tc } = useTranslation('common');
  const insets = useSafeAreaInsets();

  const { loadPlans, updateFormData, formData, plans, isLoadingPlans } =
    useRecharge();

  const [selectedCategory, setSelectedCategory] = useState('Popular');
  const [customAmount, setCustomAmount] = useState('');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);

  // Animation values for expanded cards
  const [expandAnimations] = useState<{ [key: string]: Animated.Value }>({});

  // Load ALL plans initially (without category filter) to determine available categories
  useEffect(() => {
    if (formData && formData.operatorCode && formData.circleCode) {
      // Load plans for the selected category
      loadPlans(formData.operatorCode, formData.circleCode, selectedCategory as any);
    }
  }, [formData, selectedCategory]);



  // All standard categories - always show these
  const categories = [
    { name: 'Popular', icon: 'star', color: '#FFD700', key: 'POPULAR' },
    { name: 'Data', icon: 'language', color: '#2196F3', key: 'DATA' },
    {
      name: 'Unlimited',
      icon: 'all-inclusive',
      color: '#9C27B0',
      key: 'UNLIMITED',
    },
    {
      name: 'Talktime',
      icon: 'phone',
      color: '#4CAF50',
      key: 'TALKTIME',
    },
  ];

  // Filter plans by selected category
  const filteredPlans = plans.filter((plan) =>
    selectedCategory === 'Popular'
      ? plan.category === 'POPULAR'
      : plan.category === selectedCategory.toUpperCase()
  );

  // Get USP badge for plan
  const getUSPBadge = (
    plan: RechargePlan
  ): { text: string; color: string } | null => {
    if (plan.amount >= 600) {
      return { text: 'BEST VALUE', color: '#4CAF50' };
    }
    if (plan.data?.includes('Unlimited')) {
      return { text: 'UNLIMITED', color: '#9C27B0' };
    }
    if (plan.validity?.includes('84')) {
      return { text: 'LONG VALIDITY', color: '#FF9800' };
    }
    if (plan.amount <= 100) {
      return { text: 'BUDGET FRIENDLY', color: '#00BCD4' };
    }
    return null;
  };

  // Get highlight features (max 3)
  const getHighlights = (plan: RechargePlan): string[] => {
    const highlights: string[] = [];
    if (plan.data) highlights.push(plan.data);
    if (plan.calling && plan.calling !== 'NA') highlights.push(plan.calling);
    if (plan.validity) highlights.push(plan.validity);
    return highlights.slice(0, 3);
  };

  const handlePlanSelect = (plan: RechargePlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPlan(plan);
    setCustomAmount(''); // Clear custom amount when plan is selected
  };

  const toggleExpandPlan = (planId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!expandAnimations[planId]) {
      expandAnimations[planId] = new Animated.Value(0);
    }

    if (expandedPlanId === planId) {
      // Collapse
      Animated.timing(expandAnimations[planId], {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
      setExpandedPlanId(null);
    } else {
      // Collapse previous if any
      if (expandedPlanId && expandAnimations[expandedPlanId]) {
        Animated.timing(expandAnimations[expandedPlanId], {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }

      // Expand new
      Animated.timing(expandAnimations[planId], {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setExpandedPlanId(planId);
    }
  };

  const handleContinue = () => {
    if (!selectedPlan && !customAmount) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (customAmount) {
      updateFormData({ amount: parseFloat(customAmount) });
    } else if (selectedPlan) {
      updateFormData({
        amount: Number(selectedPlan.amount), // Convert string to number
        planId: selectedPlan.id,
      });
    }

    setCurrentScreen('recharge-review');
  };

  const isValid =
    selectedPlan || (customAmount && parseFloat(customAmount) > 0);

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
            setCurrentScreen('recharge-entry');
          }}
          style={styles.backButton}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={colors.neutral.white}
          />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('select_plan')}</Text>
          <Text style={styles.headerSubtitle}>
            {formData?.mobileNumber || ''} •{' '}
            {formData?.operatorName || formData?.operatorCode || ''}
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </LinearGradient>

      {isLoadingPlans ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loaderText}>{tc('loading')}...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[1]}
        >
          {/* Custom Amount */}
          <View style={styles.customAmountCard}>
            <Text style={styles.customAmountLabel}>{t('custom_amount')}</Text>
            <View style={styles.customAmountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.customAmountInput}
                placeholder={t('enter_amount')}
                placeholderTextColor={colors.neutral.mediumGray}
                value={customAmount}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  setCustomAmount(cleaned);
                  if (cleaned) {
                    setSelectedPlan(null);
                  }
                }}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Category Tabs - Becomes Sticky When Scrolling */}
          <View style={styles.stickyTabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTabsContent}
            >
              {categories.map((category) => {
                const isSelected = selectedCategory === category.name;
                return (
                  <TouchableOpacity
                    key={category.name}
                    style={[
                      styles.categoryTab,
                      isSelected && styles.categoryTabSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(category.name);
                      setSelectedPlan(null);
                      setExpandedPlanId(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={
                        isSelected
                          ? styles.categoryTabTextSelected
                          : styles.categoryTabText
                      }
                    >
                      {category.name}
                    </Text>
                    {isSelected && <View style={styles.categoryTabUnderline} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Plans List */}
          <View style={styles.content}>
            {filteredPlans.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons
                  name="info-outline"
                  size={48}
                  color={colors.neutral.mediumGray}
                />
                <Text style={styles.emptyStateTitle}>
                  {t('no_plans_available')}
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  {t('try_different_category')}
                </Text>
              </View>
            ) : (
              filteredPlans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                const isExpanded = expandedPlanId === plan.id;
                const expandAnim =
                  expandAnimations[plan.id] || new Animated.Value(0);
                const usp = getUSPBadge(plan);
                const highlights = getHighlights(plan);

                const maxHeight = expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 400], // Increased for more details
                });

                // Build dynamic description from plan data
                const buildDescription = () => {
                  const parts = [];
                  if (plan.data) parts.push(`Data: ${plan.data}`);
                  if (plan.calling) parts.push(`Calls: ${plan.calling}`);
                  if (plan.validity) parts.push(`Validity: ${plan.validity}`);
                  if (plan.sms) parts.push(`SMS: ${plan.sms}`);

                  // Add benefits preview
                  if (plan.benefits && plan.benefits.length > 0) {
                    const benefitsPreview = plan.benefits.slice(0, 2).join(', ');
                    parts.push(`Additional Benefits: ${benefitsPreview}${plan.benefits.length > 2 ? '...' : ''}`);
                  }

                  // Fallback to description if available
                  if (parts.length === 0 && plan.description) {
                    return plan.description;
                  }

                  return parts.join(' | ');
                };

                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                    ]}
                    onPress={() => handlePlanSelect(plan)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.planMainContent}>
                      {/* Left: Price */}
                      <View style={styles.planPriceSection}>
                        <Text style={styles.planAmount}>₹{plan.amount}</Text>
                      </View>

                      {/* Right: Details */}
                      <View style={styles.planDetailsSection}>
                        {/* Top Row: Validity and Data Labels */}
                        <View style={styles.planTopRow}>
                          <View style={styles.planDetailColumn}>
                            <Text style={styles.planLabel}>Validity</Text>
                            <Text style={styles.planValue}>
                              {plan.validity || 'NA'}
                            </Text>
                          </View>
                          <View style={styles.planDetailColumn}>
                            <Text style={styles.planLabel}>Data</Text>
                            <Text style={styles.planValue}>
                              {plan.data || 'NA'}
                            </Text>
                          </View>
                        </View>

                        {/* Dynamic Description - hidden when expanded (bullet points take over) */}
                        {!isExpanded && (
                          <Text
                            style={styles.planDescription}
                            numberOfLines={2}
                          >
                            {buildDescription()}
                          </Text>
                        )}

                        {/* View More Link */}
                        <TouchableOpacity
                          style={styles.viewMoreButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleExpandPlan(plan.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.viewMoreText}>
                            {isExpanded ? 'View Less' : 'View More'}
                          </Text>
                        </TouchableOpacity>

                        {/* Expandable Full Details */}
                        {isExpanded && (
                          <Animated.View style={styles.expandedDetails}>
                            <View style={styles.benefitsDivider} />

                            {/* Show all available plan details */}
                            {plan.data && (
                              <View style={styles.benefitItem}>
                                <Text style={styles.benefitBullet}>•</Text>
                                <Text style={styles.benefitText}>Data: {plan.data}</Text>
                              </View>
                            )}
                            {plan.calling && (
                              <View style={styles.benefitItem}>
                                <Text style={styles.benefitBullet}>•</Text>
                                <Text style={styles.benefitText}>Calls: {plan.calling}</Text>
                              </View>
                            )}
                            {plan.sms && (
                              <View style={styles.benefitItem}>
                                <Text style={styles.benefitBullet}>•</Text>
                                <Text style={styles.benefitText}>SMS: {plan.sms}</Text>
                              </View>
                            )}
                            {plan.validity && (
                              <View style={styles.benefitItem}>
                                <Text style={styles.benefitBullet}>•</Text>
                                <Text style={styles.benefitText}>Validity: {plan.validity}</Text>
                              </View>
                            )}

                            {/* Additional benefits from API */}
                            {plan.benefits?.map((benefit, index) => (
                              <View key={`benefit-${index}`} style={styles.benefitItem}>
                                <Text style={styles.benefitBullet}>•</Text>
                                <Text style={styles.benefitText}>{benefit}</Text>
                              </View>
                            ))}

                            {/* Show description if no benefits */}
                            {(!plan.benefits || plan.benefits.length === 0) && plan.description && (
                              <View style={styles.benefitItem}>
                                <Text style={styles.benefitBullet}>•</Text>
                                <Text style={styles.benefitText}>{plan.description}</Text>
                              </View>
                            )}
                          </Animated.View>
                        )}
                      </View>

                      {/* Right Arrow */}
                      <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color={isSelected ? colors.primary.main : colors.neutral.mediumGray}
                        style={styles.chevronIcon}
                      />
                    </View>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <View style={styles.selectionIndicatorBorder} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
      )}

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isValid && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.8}
        >
          {isValid ? (
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.continueGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons
                name="arrow-forward"
                size={20}
                color={colors.neutral.white}
              />
              <Text style={styles.continueText}>
                Pay ₹{selectedPlan?.amount || customAmount}
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.continueDisabled}>
              <Text style={styles.continueTextDisabled}>
                {t('select_plan_or_amount')}
              </Text>
            </View>
          )}
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.neutral.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: colors.neutral.white,
    opacity: 0.9,
  },
  headerSpacer: {
    width: 40,
  },
  stickyTabsContainer: {
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
    paddingVertical: spacing.xs,
    ...shadows.sm,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    ...textStyles.body,
    color: colors.neutral.darkGray,
    marginTop: spacing.md,
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
    fontWeight: '600',
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

  customAmountCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  customAmountLabel: {
    ...textStyles.body,
    color: colors.neutral.black,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  customAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.gray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral.white,
    height: 48,
  },
  currencySymbol: {
    ...textStyles.body,
    color: colors.neutral.darkGray,
    marginRight: spacing.xs,
    lineHeight: 48,
  },
  customAmountInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.neutral.black,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyStateTitle: {
    ...textStyles.h4,
    color: colors.neutral.darkGray,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateSubtitle: {
    ...textStyles.body,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
  },
  plansList: {
    gap: spacing.md,
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
  planCardSelected: {
    borderColor: colors.primary.main,
    borderWidth: 2,
    backgroundColor: '#F8FBFF',
  },
  planMainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  planPriceSection: {
    marginRight: spacing.lg,
  },
  planDetailsSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  planTopRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  planDetailColumn: {
    flex: 1,
  },
  planLabel: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
    fontSize: 11,
    marginBottom: 2,
  },
  planValue: {
    ...textStyles.body,
    color: colors.neutral.black,
    fontWeight: '600',
    fontSize: 13,
  },
  viewMoreButton: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  viewMoreText: {
    ...textStyles.bodySmall,
    color: '#007AFF',
    fontWeight: '500',
    fontSize: 13,
  },
  chevronIcon: {
    marginTop: 4,
  },
  expandedDetails: {
    marginTop: spacing.md,
  },
  selectionIndicatorBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary.main,
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  validityBadge: {
    backgroundColor: colors.accent.bg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  validityText: {
    ...textStyles.caption,
    color: colors.accent.main,
    fontWeight: 'bold',
  },
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  highlightChip: {
    backgroundColor: colors.primary.bg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  highlightText: {
    ...textStyles.caption,
    color: colors.primary.main,
    fontWeight: '500',
  },
  uspBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  uspText: {
    ...textStyles.caption,
    fontWeight: 'bold',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary.bg,
    borderRadius: borderRadius.sm,
  },
  detailsButtonText: {
    ...textStyles.caption,
    color: colors.primary.main,
    marginRight: spacing.xs,
  },
  planAmount: {
    fontSize: 24,
    color: colors.neutral.black,
    fontWeight: '700',
    lineHeight: 28,
  },
  planHighlights: {
    marginTop: spacing.sm,
  },
  planHighlight: {
    ...textStyles.bodySmall,
    color: colors.neutral.darkGray,
    marginBottom: spacing.xs,
  },
  descriptionContainer: {
    marginTop: spacing.sm,
  },
  planDescription: {
    ...textStyles.bodySmall,
    color: colors.neutral.darkGray,
    lineHeight: 18,
    fontSize: 12,
  },
  benefitsContainer: {
    overflow: 'hidden',
  },
  benefitsDivider: {
    height: 1,
    backgroundColor: colors.neutral.lightGray,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  benefitsTitle: {
    ...textStyles.h6,
    color: colors.neutral.black,
    marginBottom: spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  benefitBullet: {
    ...textStyles.bodySmall,
    color: colors.neutral.darkGray,
    marginRight: spacing.xs,
    marginTop: 1,
  },
  benefitText: {
    ...textStyles.bodySmall,
    color: colors.neutral.darkGray,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  additionalInfo: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
    marginLeft: spacing.xs,
  },
  selectionIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  selectionGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
  },
  continueButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  continueText: {
    ...textStyles.button,
    color: colors.neutral.white,
    fontWeight: '600',
    fontSize: 17,
    marginLeft: spacing.sm,
  },
  continueDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.neutral.lightGray,
  },
  continueTextDisabled: {
    ...textStyles.h5,
    color: colors.neutral.mediumGray,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: spacing['3xl'],
  },
});
