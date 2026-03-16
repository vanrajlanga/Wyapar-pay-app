/**
 * Recharge Entry Screen - Modern Fintech Design
 * Clean, intuitive mobile recharge entry with modern UX
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Conditionally import expo-contacts (not available in Expo Go)
let Contacts: any = null;
try {
  Contacts = require('expo-contacts');
} catch (e) {
  // expo-contacts not available in Expo Go
  console.log('expo-contacts not available, contact picker disabled');
}
import { useTranslation } from 'react-i18next';
import { useRecharge } from '../../contexts/RechargeContext';
import { NavigationProps } from '../../types/navigation';
import { VALIDATION } from '../../constants';
import { getOperatorLogoUri, getOperatorByCode } from '../../constants/operators';
import { Favorite } from '../../types/recharge';
import {
  colors,
  textStyles,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';
import { Card, Button } from '../ui';
import { showComingSoonToast } from '../../utils/toast.utils';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../services/logger.service';

interface RechargeEntryScreenProps extends NavigationProps {
  triggerHaptic?: () => void;
}

export const RechargeEntryScreen: React.FC<RechargeEntryScreenProps> = ({
  setCurrentScreen,
  triggerHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
}) => {
  const { t } = useTranslation('recharge');
  const { t: tc } = useTranslation('common');
  const { showError, showWarning, showInfo } = useToast();
  const insets = useSafeAreaInsets();

  const {
    detectOperator,
    loadOperators,
    loadCircles,
    loadFavorites,
    updateFormData,
    operators,
    circles,
    favorites,
    detectedOperator,
    isDetecting,
    isLoadingFavorites,
    error,
  } = useRecharge();

  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedOperatorCode, setSelectedOperatorCode] = useState('');
  const [selectedCircleCode, setSelectedCircleCode] = useState('');
  const [isManualSelection, setIsManualSelection] = useState(false);
  const [showFavorites, setShowFavorites] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadOperators();
    loadFavorites();

    // Modern entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Auto-detect operator when 10 digits entered
  useEffect(() => {
    if (mobileNumber.length === 10 && !isManualSelection) {
      logger.debug('Triggering operator detection', { mobileNumber });
      detectOperator(mobileNumber)
        .then((result) => {
          logger.debug('Operator detection completed', {
            operator: result?.operatorCode,
          });
        })
        .catch((error) => {
          logger.error('Operator detection failed', error, { mobileNumber });
        });
    }
  }, [mobileNumber]);

  // Auto-select detected operator
  useEffect(() => {
    if (detectedOperator && !isManualSelection) {
      setSelectedOperatorCode(detectedOperator.operatorCode);
      if (detectedOperator.operatorCode) {
        loadCircles(detectedOperator.operatorCode);
      }
      if (detectedOperator.circleCode) {
        setSelectedCircleCode(detectedOperator.circleCode);
      }
    }
  }, [detectedOperator]);

  // Load circles when operator selected
  useEffect(() => {
    if (selectedOperatorCode) {
      loadCircles(selectedOperatorCode);
    }
  }, [selectedOperatorCode]);

  const handleMobileChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 10) {
      setMobileNumber(cleaned);
      if (cleaned.length < 10) {
        setSelectedOperatorCode('');
        setSelectedCircleCode('');
        setIsManualSelection(false);
      }
    }
  };

  const handleOperatorSelect = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOperatorCode(code);
    setIsManualSelection(true);
    setSelectedCircleCode(''); // Reset circle when operator changes
  };

  const handleCircleSelect = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCircleCode(code);
  };

  const handleFavoriteSelect = (fav: Favorite) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMobileNumber(fav.accountNumber);
    if (fav.operatorCode) {
      setSelectedOperatorCode(fav.operatorCode);
      setIsManualSelection(true);
    }
    if (fav.circleCode) {
      setSelectedCircleCode(fav.circleCode);
    }
  };

  const handleContactPicker = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Check if expo-contacts is available (not available in Expo Go)
      if (!Contacts) {
        showInfo(
          'Not Available',
          'Contact picker requires a development build. Please enter the number manually.'
        );
        return;
      }
      
      // Request permission to access contacts
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        showWarning(
          'Permission Required',
          'Please grant permission to access contacts to use this feature.'
        );
        return;
      }

      // Open contact picker - get contacts with phone numbers
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      if (data.length === 0) {
        showInfo('No Contacts', 'No contacts found on this device.');
        return;
      }

      // Filter contacts that have phone numbers
      const contactsWithPhones = data.filter(
        (contact: any) => contact.phoneNumbers && contact.phoneNumbers.length > 0
      );

      if (contactsWithPhones.length === 0) {
        showInfo('No Phone Numbers', 'No contacts with phone numbers found.');
        return;
      }

      // Show contact selection - for simplicity, we'll use presentFormAsync or Alert
      // For a better UX, you could implement a custom modal with a list
      // Here we use the native contact form
      const contact: any = await Contacts.presentContactPickerAsync();
      
      if (contact && contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        // Get the first phone number
        let phoneNumber = contact.phoneNumbers[0].number || '';
        
        // Clean the phone number - remove all non-numeric characters
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        // Remove country code if present (for India +91 or 91)
        if (phoneNumber.length > 10) {
          if (phoneNumber.startsWith('91')) {
            phoneNumber = phoneNumber.substring(2);
          } else if (phoneNumber.startsWith('0')) {
            phoneNumber = phoneNumber.substring(1);
          }
        }
        
        // Take only first 10 digits
        phoneNumber = phoneNumber.slice(0, 10);
        
        if (phoneNumber.length === 10) {
          setMobileNumber(phoneNumber);
          // Reset operator/circle selection to trigger auto-detection
          setSelectedOperatorCode('');
          setSelectedCircleCode('');
          setIsManualSelection(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          showWarning(
            'Invalid Number',
            'The selected contact does not have a valid 10-digit mobile number.'
          );
        }
      }
    } catch (error) {
      logger.error('Contact picker error', error);
      // Fallback for platforms that don't support presentContactPickerAsync
      showError(
        'Error',
        'Unable to access contacts. Please enter the number manually.'
      );
    }
  };

  const handleContinue = () => {
    if (!mobileNumber || mobileNumber.length !== 10) return;
    if (!selectedOperatorCode) return;
    if (!selectedCircleCode) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const selectedOperator = operators.find(
      (op) => op.code === selectedOperatorCode
    );
    const selectedCircle = circles.find(
      (c) => c.circleCode === selectedCircleCode
    );

    updateFormData({
      mobileNumber,
      operatorCode: selectedOperatorCode,
      operatorName: selectedOperator?.name || selectedOperatorCode,
      circleCode: selectedCircleCode,
      circleName: selectedCircle?.circleName || selectedCircleCode,
    });

    setCurrentScreen('recharge-plans');
  };

  const isValid =
    mobileNumber.length === 10 && selectedOperatorCode && selectedCircleCode;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Header */}
      <LinearGradient
        colors={colors.gradients.warm}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentScreen('dashboard');
            }}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{t('title')}</Text>
            <Text style={styles.headerSubtitle}>{t('subtitle')}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Mobile Number Input */}
            <Card variant="default" style={styles.inputCard}>
              <Text style={styles.label}>{t('mobile_number')}</Text>
              <View style={styles.inputContainer}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={t('enter_mobile')}
                  placeholderTextColor={colors.neutral.mediumGray}
                  value={mobileNumber}
                  onChangeText={handleMobileChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus
                />
                {isDetecting && (
                  <ActivityIndicator color={colors.primary.main} />
                )}
                {mobileNumber.length === 10 && !isDetecting && (
                  <MaterialIcons
                    name="check-circle"
                    size={24}
                    color={colors.success.main}
                  />
                )}
                {/* Contact Picker Button */}
                <TouchableOpacity
                  style={[styles.contactButton, !Contacts && styles.contactButtonDisabled]}
                  onPress={handleContactPicker}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="contacts"
                    size={22}
                    color={Contacts ? colors.primary.main : colors.neutral.mediumGray}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>{mobileNumber.length}/10 digits</Text>

              {/* Auto-detection result - Card Style */}
              {detectedOperator && !isManualSelection && mobileNumber.length === 10 && !isDetecting && (
                <View style={styles.detectedOperatorCard}>
                  {/* Colored top strip */}
                  <View style={styles.detectedCardTopStrip} />

                  <View style={styles.detectedOperatorContent}>
                    {/* Operator Logo */}
                    <View style={styles.detectedOperatorLogoContainer}>
                      <Image
                        source={getOperatorLogoUri(detectedOperator.operatorCode)}
                        style={styles.detectedOperatorLogo}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Operator Info */}
                    <View style={styles.detectedOperatorInfo}>
                      <View style={styles.detectedOperatorHeader}>
                        <Text style={styles.detectedLabel}>Operator</Text>
                        <View style={styles.autoDetectedChip}>
                          <View style={styles.autoDetectedDotSmall} />
                          <Text style={styles.autoDetectedChipText}>Auto-detected</Text>
                        </View>
                      </View>
                      <Text style={styles.detectedOperatorName}>
                        {detectedOperator.operatorName}
                      </Text>
                      {detectedOperator.circleName && (
                        <Text style={styles.detectedCircleName}>
                          in {detectedOperator.circleName}
                        </Text>
                      )}
                    </View>

                    {/* Actions */}
                    <View style={styles.detectedOperatorActions}>
                      <TouchableOpacity
                        onPress={() => {
                          triggerHaptic();
                          setIsManualSelection(true);
                        }}
                        style={styles.detectedChangeBtn}
                      >
                        <Text style={styles.detectedChangeBtnText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {error && mobileNumber.length === 10 && (
                <View style={styles.errorContainer}>
                  <MaterialIcons
                    name="error-outline"
                    size={16}
                    color={colors.error.main}
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </Card>

            {/* Recent & Favorites */}
            {showFavorites && favorites.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('recent_recharges')}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {favorites.slice(0, 5).map((fav) => (
                    <TouchableOpacity
                      key={fav.id}
                      style={styles.favoriteChip}
                      onPress={() => handleFavoriteSelect(fav)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.favoriteIcon}>
                        <MaterialIcons
                          name="phone-android"
                          size={20}
                          color={colors.primary.main}
                        />
                      </View>
                      <Text style={styles.favoriteNumber}>
                        {fav.accountNumber.slice(0, 5)}...
                      </Text>
                      {fav.operatorName && (
                        <Text style={styles.favoriteOperator}>
                          {fav.operatorName}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Operator Selection - Show when number incomplete OR not auto-detected */}
            {(mobileNumber.length < 10 || (mobileNumber.length === 10 && (!detectedOperator || isManualSelection))) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('select_operator')}</Text>
                  {selectedOperatorCode && !isManualSelection && (
                    <View style={styles.autoDetectedBadge}>
                      <View style={styles.autoDetectedDot} />
                      <Text style={styles.autoDetectedText}>Auto-detected</Text>
                    </View>
                  )}
                </View>
                <View style={styles.operatorGrid}>
                  {operators.map((op) => (
                    <TouchableOpacity
                      key={op.code}
                      style={[
                        styles.operatorCard,
                        selectedOperatorCode === op.code &&
                          styles.operatorCardSelected,
                      ]}
                      onPress={() => handleOperatorSelect(op.code)}
                      activeOpacity={0.7}
                    >
                      {selectedOperatorCode === op.code && (
                        <View style={styles.selectedBadge}>
                          <MaterialIcons
                            name="check-circle"
                            size={18}
                            color={colors.success.main}
                          />
                        </View>
                      )}
                      <View
                        style={[
                          styles.operatorIconContainer,
                          {
                            backgroundColor:
                              selectedOperatorCode === op.code
                                ? colors.primary.bg
                                : colors.neutral.lightGray,
                          },
                        ]}
                      >
                        <Image
                          source={getOperatorLogoUri(op.code)}
                          style={styles.operatorLogo}
                          resizeMode="contain"
                        />
                      </View>
                      <Text
                        style={[
                          styles.operatorName,
                          selectedOperatorCode === op.code &&
                            styles.operatorNameSelected,
                        ]}
                      >
                        {op.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Circle Selection - Show when number incomplete OR not auto-detected */}
            {selectedOperatorCode && circles.length > 0 && (mobileNumber.length < 10 || (mobileNumber.length === 10 && (!detectedOperator || isManualSelection))) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('select_circle')}</Text>
                </View>
                <View style={styles.circleGrid}>
                  {circles.map((circle) => (
                    <TouchableOpacity
                      key={circle.circleCode}
                      style={[
                        styles.circleChip,
                        selectedCircleCode === circle.circleCode &&
                          styles.circleChipSelected,
                      ]}
                      onPress={() => handleCircleSelect(circle.circleCode)}
                      activeOpacity={0.7}
                    >
                      {selectedCircleCode === circle.circleCode && (
                        <MaterialIcons
                          name="check"
                          size={16}
                          color="#FFF"
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.circleText,
                          selectedCircleCode === circle.circleCode &&
                            styles.circleTextSelected,
                        ]}
                      >
                        {circle.circleName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </View>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title={t('continue_to_plans')}
          onPress={handleContinue}
          variant="primary"
          size="large"
          fullWidth
          disabled={!isValid}
          icon={<MaterialIcons name="arrow-forward" size={20} color="#FFF" />}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: spacing['3xl'] + spacing.base,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    ...shadows.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerTitle: {
    ...textStyles.h4,
    color: colors.neutral.white,
  },
  headerSubtitle: {
    ...textStyles.caption,
    color: colors.neutral.white,
    opacity: 0.9,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: spacing.lg,
  },

  // Input Card
  inputCard: {
    marginBottom: 20,
  },
  label: {
    ...textStyles.label,
    color: colors.neutral.darkGray,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...shadows.sm,
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  countryCodeText: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.neutral.black,
  },
  input: {
    flex: 1,
    ...textStyles.h5,
    color: colors.neutral.black,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  contactButtonDisabled: {
    backgroundColor: colors.neutral.lightGray,
    borderColor: colors.neutral.mediumGray,
  },
  hint: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
    marginTop: spacing.xs,
  },
  detectedOperatorCard: {
    marginTop: spacing.md,
    backgroundColor: colors.primary.bg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#FFD6B0',
    overflow: 'hidden',
    ...shadows.sm,
  },
  detectedCardTopStrip: {
    height: 3,
    backgroundColor: colors.primary.main,
  },
  detectedOperatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  detectedOperatorLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    ...shadows.sm,
  },
  detectedOperatorLogo: {
    width: 38,
    height: 38,
  },
  detectedOperatorInfo: {
    flex: 1,
  },
  detectedOperatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  detectedLabel: {
    ...textStyles.caption,
    color: colors.neutral.darkGray,
    fontSize: 11,
    fontWeight: '500',
  },
  autoDetectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 6,
    gap: 3,
  },
  autoDetectedDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.neutral.white,
    opacity: 0.8,
  },
  autoDetectedChipText: {
    fontSize: 10,
    color: colors.neutral.white,
    fontWeight: '600',
  },
  detectedOperatorName: {
    ...textStyles.body,
    color: colors.neutral.black,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  detectedCircleName: {
    ...textStyles.caption,
    color: colors.neutral.darkGray,
    fontSize: 12,
  },
  detectedOperatorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detectedChangeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    backgroundColor: colors.neutral.white,
  },
  detectedChangeBtnText: {
    color: colors.primary.main,
    fontWeight: '600',
    fontSize: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.error.bg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.error.main,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error.dark,
    marginLeft: spacing.xs,
    flex: 1,
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    ...textStyles.h5,
    color: colors.neutral.black,
    flex: 1,
  },
  autoDetectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 'auto',
  },
  autoDetectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 5,
  },
  autoDetectedText: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '500',
  },

  // Favorites
  favoriteChip: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginRight: spacing.md,
    alignItems: 'center',
    minWidth: 100,
    ...shadows.sm,
  },
  favoriteIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  favoriteNumber: {
    ...textStyles.bodySmall,
    fontWeight: '600',
    color: colors.neutral.black,
    marginBottom: spacing.xs / 2,
  },
  favoriteOperator: {
    ...textStyles.caption,
    color: colors.neutral.mediumGray,
    fontSize: 10,
  },

  // Operator Grid
  operatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
  operatorCard: {
    width: '31%',
    marginHorizontal: '1%',
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    ...shadows.sm,
  },
  operatorCardSelected: {
    borderColor: colors.success.main,
    backgroundColor: colors.success.bg,
  },
  selectedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    ...shadows.md,
  },
  operatorIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  operatorLogo: {
    width: 40,
    height: 40,
  },
  operatorName: {
    ...textStyles.caption,
    color: colors.neutral.darkGray,
    textAlign: 'center',
    fontWeight: '500',
  },
  operatorNameSelected: {
    color: colors.success.dark,
    fontWeight: '600',
  },

  // Circle Grid
  circleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  circleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral.gray,
  },
  circleChipSelected: {
    backgroundColor: colors.secondary.main,
    borderColor: colors.secondary.main,
  },
  circleText: {
    ...textStyles.bodySmall,
    color: colors.neutral.darkGray,
    fontWeight: '500',
  },
  circleTextSelected: {
    color: colors.neutral.white,
    fontWeight: '600',
  },

  // Footer
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
  },
});
