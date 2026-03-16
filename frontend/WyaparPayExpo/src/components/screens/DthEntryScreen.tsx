/**
 * DTH Entry Screen
 * Subscriber ID input + operator selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationProps } from '../../types/navigation';
import { colors, textStyles, spacing, borderRadius, shadows } from '../../theme';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../contexts/ToastContext';

const DTH_LOGOS = {
  AIRTEL: require('../../../assets/operators/airtel-dth.png'),
  DISH:   require('../../../assets/operators/dish-tv.png'),
  SUN:    require('../../../assets/operators/sun.png'),
  TATA:   require('../../../assets/operators/tata.png'),
  VIDEOCON: require('../../../assets/operators/Videocon_d2h.png'),
};

interface DthOperator {
  id: string;
  name: string;
  displayName: string;
  logo: any;
  color: string;
}

const DTH_OPERATORS: DthOperator[] = [
  { id: '23', name: 'AIRTEL DTH',   displayName: 'Airtel DTH',   logo: DTH_LOGOS.AIRTEL,   color: '#E8003D' },
  { id: '25', name: 'DISH DTH',     displayName: 'Dish TV',       logo: DTH_LOGOS.DISH,     color: '#F97316' },
  { id: '26', name: 'SUN DTH',      displayName: 'Sun Direct',    logo: DTH_LOGOS.SUN,      color: '#FFB800' },
  { id: '27', name: 'TATA SKY DTH', displayName: 'Tata Play',     logo: DTH_LOGOS.TATA,     color: '#0066CC' },
  { id: '28', name: 'VIDEOCON DTH', displayName: 'Videocon D2H',  logo: DTH_LOGOS.VIDEOCON, color: '#6B21A8' },
];

interface DthEntryScreenProps extends NavigationProps {
  onDthData?: (data: { subscriberId: string; operator: DthOperator }) => void;
}

export const DthEntryScreen: React.FC<DthEntryScreenProps> = ({
  setCurrentScreen,
  onDthData,
}) => {
  const { t } = useTranslation('recharge');
  const insets = useSafeAreaInsets();
  const { showError } = useToast();

  const [subscriberId, setSubscriberId] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<DthOperator | null>(null);

  const handleContinue = () => {
    if (!subscriberId.trim()) {
      showError(t('required'), t('enter_subscriber_id_error'));
      return;
    }
    if (!selectedOperator) {
      showError(t('required'), t('select_dth_operator'));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onDthData) onDthData({ subscriberId: subscriberId.trim(), operator: selectedOperator });
    setCurrentScreen('dth-plans');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <LinearGradient colors={colors.gradients.primary} style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.neutral.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialIcons name="tv" size={22} color={colors.neutral.white} />
            <Text style={styles.headerTitle}>{t('dth_recharge')}</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Subscriber ID Input */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('subscriber_id')}</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="perm-identity" size={20} color={colors.neutral.mediumGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('enter_subscriber_id')}
                placeholderTextColor={colors.neutral.mediumGray}
                value={subscriberId}
                onChangeText={setSubscriberId}
                keyboardType="numeric"
                returnKeyType="done"
              />
              {subscriberId.length > 0 && (
                <TouchableOpacity onPress={() => setSubscriberId('')}>
                  <MaterialIcons name="cancel" size={18} color={colors.neutral.mediumGray} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.hint}>{t('subscriber_id_hint')}</Text>
          </View>

          {/* Operator Selection */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('select_operator')}</Text>
            <View style={styles.operatorGrid}>
              {DTH_OPERATORS.map((op) => {
                const isSelected = selectedOperator?.id === op.id;
                return (
                  <TouchableOpacity
                    key={op.id}
                    style={[styles.operatorCard, isSelected && styles.operatorCardSelected]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedOperator(op);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.operatorIcon, { backgroundColor: op.color + '18' }]}>
                      <Image source={op.logo} style={styles.operatorLogo} resizeMode="contain" />
                    </View>
                    <Text style={[styles.operatorName, isSelected && styles.operatorNameSelected]}>
                      {op.displayName}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <MaterialIcons name="check-circle" size={16} color={colors.primary.main} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity
            style={[
              styles.continueBtn,
              (!subscriberId || !selectedOperator) && styles.continueBtnDisabled,
            ]}
            onPress={handleContinue}
            disabled={!subscriberId || !selectedOperator}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={(!subscriberId || !selectedOperator) ? ['#ccc', '#aaa'] : colors.gradients.primary}
              style={styles.continueBtnGradient}
            >
              <Text style={styles.continueBtnText}>{t('view_plans')}</Text>
              <MaterialIcons name="arrow-forward" size={20} color={colors.neutral.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.neutral.white,
    fontWeight: '600',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
    gap: spacing.sm,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.neutral.darkGray,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral.gray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  inputIcon: { marginRight: 4 },
  input: {
    flex: 1,
    ...textStyles.body,
    color: colors.neutral.black,
    padding: 0,
  },
  hint: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
  },
  operatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  operatorCard: {
    width: '30%',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.neutral.gray,
    backgroundColor: colors.neutral.offWhite,
    gap: 6,
    position: 'relative',
  },
  operatorCardSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.bg,
  },
  operatorIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorLogo: {
    width: 36,
    height: 36,
  },
  operatorName: {
    ...textStyles.caption,
    color: colors.neutral.darkGray,
    textAlign: 'center',
    fontWeight: '500',
  },
  operatorNameSelected: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray,
  },
  continueBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  continueBtnDisabled: { opacity: 0.6 },
  continueBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  continueBtnText: {
    ...textStyles.body,
    color: colors.neutral.white,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default DthEntryScreen;
