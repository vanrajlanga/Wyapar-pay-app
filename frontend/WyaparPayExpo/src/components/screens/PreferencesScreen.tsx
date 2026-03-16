/**
 * Preferences Screen Component
 * Modern fintech-themed user preferences and settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { NavigationProps, Screen } from '../../types/navigation';
import { UserPreferences } from '../../types/user';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useBiometric } from '../../hooks/useBiometric';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import {
  colors,
  textStyles,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';
import { showComingSoonToast } from '../../utils/toast.utils';

interface PreferencesScreenProps extends NavigationProps {
  handleBackWithHaptic: (screen: Screen) => void;
  triggerHaptic: () => void;
}

export const PreferencesScreen: React.FC<PreferencesScreenProps> = ({
  handleBackWithHaptic,
  triggerHaptic,
}) => {
  const { t } = useTranslation('profile');
  const { t: tc } = useTranslation('common');
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  // Get preferences from context
  const { preferences, togglePreference } = useUser();
  const { user, tokens } = useAuth();
  const { enableBiometricLogin, disableBiometricLogin, getBiometricTypeName, isBiometricLoginEnabled } =
    useBiometric();

  // State for local preferences
  const [localPreferences, setLocalPreferences] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    showBalance: true,
    biometricLogin: false,
    darkMode: false,
    language: i18n.language || 'en',
  });

  // Check if biometric is already enabled on mount
  useEffect(() => {
    (async () => {
      const enabled = await isBiometricLoginEnabled();
      if (enabled) {
        setLocalPreferences((prev) => ({ ...prev, biometricLogin: true }));
      }
    })();
  }, []);

  // Handle toggle with haptic feedback
  const handleToggle = async (key: keyof typeof localPreferences) => {
    triggerHaptic();

    if (key === 'biometricLogin') {
      const isEnabling = !localPreferences.biometricLogin;
      if (isEnabling) {
        if (!user?.id || !tokens?.accessToken || !tokens?.refreshToken) {
          return;
        }
        const success = await enableBiometricLogin(user.id, tokens.accessToken, tokens.refreshToken);
        if (success) {
          setLocalPreferences((prev) => ({ ...prev, biometricLogin: true }));
        }
      } else {
        await disableBiometricLogin();
        setLocalPreferences((prev) => ({ ...prev, biometricLogin: false }));
      }
      return;
    }

    const newValue = !localPreferences[key];
    setLocalPreferences((prev) => ({ ...prev, [key]: newValue }));
  };

  // Handle language change
  const handleLanguageChange = async (languageCode: string) => {
    triggerHaptic();
    setLocalPreferences((prev) => ({ ...prev, language: languageCode }));
    await i18n.changeLanguage(languageCode);
  };

  return (
    <View style={styles.container}>
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#059669', '#10b981']}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => handleBackWithHaptic('account-details')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={colors.neutral.white}
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('preferences')}</Text>
          <Text style={styles.headerSubtitle}>{t('customize_your_experience')}</Text>
        </View>

        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.content}>
          {/* Preferences Overview Card */}
          <View style={styles.overviewCard}>
            <LinearGradient
              colors={['#059669', '#10b981']}
              style={styles.overviewGradient}
            >
              <View style={styles.overviewContent}>
                <MaterialIcons
                  name="settings"
                  size={48}
                  color={colors.neutral.white}
                />
                <Text style={styles.overviewTitle}>{t('app_preferences')}</Text>
                <Text style={styles.overviewSubtitle}>
                  {t('personalize_wyaparpay')}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Notification Settings */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('notifications')}</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.settingIcon, { backgroundColor: '#dbeafe' }]}
                >
                  <MaterialIcons
                    name="notifications"
                    size={24}
                    color="#2563eb"
                  />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{t('push_notifications')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('receive_app_notifications')}
                  </Text>
                </View>
              </View>
              <Switch
                value={localPreferences.pushNotifications}
                onValueChange={() => handleToggle('pushNotifications')}
                trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                thumbColor={
                  localPreferences.pushNotifications ? '#ffffff' : '#f3f4f6'
                }
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}
                >
                  <MaterialIcons name="email" size={24} color="#d97706" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{t('email_notifications')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('receive_email_updates')}
                  </Text>
                </View>
              </View>
              <Switch
                value={localPreferences.emailNotifications}
                onValueChange={() => handleToggle('emailNotifications')}
                trackColor={{ false: '#e5e7eb', true: '#f59e0b' }}
                thumbColor={
                  localPreferences.emailNotifications ? '#ffffff' : '#f3f4f6'
                }
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.settingIcon, { backgroundColor: '#d1fae5' }]}
                >
                  <MaterialIcons name="sms" size={24} color="#059669" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{t('sms_notifications')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('receive_sms_alerts')}
                  </Text>
                </View>
              </View>
              <Switch
                value={localPreferences.smsNotifications}
                onValueChange={() => handleToggle('smsNotifications')}
                trackColor={{ false: '#e5e7eb', true: '#10b981' }}
                thumbColor={
                  localPreferences.smsNotifications ? '#ffffff' : '#f3f4f6'
                }
              />
            </View>
          </View>

          {/* Privacy Settings */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('privacy_and_security')}</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.settingIcon, { backgroundColor: '#fef2f2' }]}
                >
                  <MaterialIcons name="fingerprint" size={24} color="#dc2626" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{t('biometric_login')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('use_fingerprint_face_id')}
                  </Text>
                </View>
              </View>
              <Switch
                value={localPreferences.biometricLogin}
                onValueChange={() => handleToggle('biometricLogin')}
                trackColor={{ false: '#e5e7eb', true: '#dc2626' }}
                thumbColor={
                  localPreferences.biometricLogin ? '#ffffff' : '#f3f4f6'
                }
              />
            </View>
          </View>

          {/* Language Settings */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('language')}</Text>

            {SUPPORTED_LANGUAGES.map((lang, index) => (
              <React.Fragment key={lang.code}>
                <TouchableOpacity
                  style={styles.languageItem}
                  onPress={() => handleLanguageChange(lang.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageLeft}>
                    <View style={styles.languageIcon}>
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                    </View>
                    <View style={styles.languageText}>
                      <Text style={styles.languageTitle}>
                        {lang.nativeName}
                      </Text>
                      <Text style={styles.languageSubtitle}>{lang.name}</Text>
                    </View>
                  </View>
                  <View style={styles.languageIndicator}>
                    {localPreferences.language === lang.code && (
                      <MaterialIcons name="check" size={24} color="#059669" />
                    )}
                  </View>
                </TouchableOpacity>
                {index < SUPPORTED_LANGUAGES.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            ))}
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  overviewCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewGradient: {
    borderRadius: 20,
    padding: 24,
  },
  overviewContent: {
    alignItems: 'center',
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral.white,
    marginTop: 12,
    marginBottom: 8,
  },
  overviewSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral.black,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral.black,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.neutral.darkGray,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageText: {
    flex: 1,
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral.black,
    marginBottom: 2,
  },
  languageSubtitle: {
    fontSize: 14,
    color: colors.neutral.darkGray,
  },
  languageIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginLeft: 64,
  },
  bottomSpacing: {
    height: 40,
  },
});
