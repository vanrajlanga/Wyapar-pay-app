/**
 * Security Screen Component
 * Modern fintech-themed security settings and options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NavigationProps, Screen } from '../../types/navigation';
import { useToast } from '../../contexts/ToastContext';
import {
  colors,
  textStyles,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';

interface SecurityScreenProps extends NavigationProps {
  handleBackWithHaptic: (screen: Screen) => void;
  triggerHaptic: () => void;
}

export const SecurityScreen: React.FC<SecurityScreenProps> = ({
  handleBackWithHaptic,
  triggerHaptic,
}) => {
  const { t } = useTranslation('profile');
  const { t: tc } = useTranslation('common');
  const { showInfo, showWarning } = useToast();
  const insets = useSafeAreaInsets();

  // State for security settings
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);

  return (
    <View style={styles.container}>
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#d97706', '#f59e0b']}
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
          <Text style={styles.headerTitle}>{t('security_settings')}</Text>
          <Text style={styles.headerSubtitle}>{t('protect_your_account')}</Text>
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
          {/* Security Overview Card */}
          <View style={styles.overviewCard}>
            <LinearGradient
              colors={['#d97706', '#f59e0b']}
              style={styles.overviewGradient}
            >
              <View style={styles.overviewContent}>
                <MaterialIcons
                  name="security"
                  size={48}
                  color={colors.neutral.white}
                />
                <Text style={styles.overviewTitle}>{t('account_security')}</Text>
                <Text style={styles.overviewSubtitle}>
                  {t('account_protected')}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Authentication Methods */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('authentication_methods')}</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.settingIcon, { backgroundColor: '#dbeafe' }]}
                >
                  <MaterialIcons name="fingerprint" size={24} color="#2563eb" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{t('biometric_login')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('use_fingerprint_face_id')}
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={(value) => {
                  triggerHaptic();
                  setBiometricEnabled(value);
                  showInfo(
                    t('settings_updated'),
                    value
                      ? t('biometric_login_enabled')
                      : t('biometric_login_disabled')
                  );
                }}
                trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                thumbColor={biometricEnabled ? '#ffffff' : '#f3f4f6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}
                >
                  <MaterialIcons
                    name="verified-user"
                    size={24}
                    color="#d97706"
                  />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>
                    {t('two_factor_auth')}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {t('add_extra_security')}
                  </Text>
                </View>
              </View>
              <Switch
                value={twoFactorEnabled}
                onValueChange={(value) => {
                  triggerHaptic();
                  setTwoFactorEnabled(value);
                  showInfo(t('settings_updated'), value ? t('two_fa_enabled') : t('two_fa_disabled'));
                }}
                trackColor={{ false: '#e5e7eb', true: '#f59e0b' }}
                thumbColor={twoFactorEnabled ? '#ffffff' : '#f3f4f6'}
              />
            </View>
          </View>

          {/* Security Actions */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('security_actions')}</Text>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                triggerHaptic();
                showInfo(t('coming_soon'), t('change_password_coming_soon'));
              }}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <View
                  style={[styles.actionIcon, { backgroundColor: '#fef2f2' }]}
                >
                  <MaterialIcons name="lock" size={24} color="#dc2626" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{t('change_password')}</Text>
                  <Text style={styles.actionDescription}>
                    {t('update_account_password')}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                triggerHaptic();
                showInfo(t('coming_soon'), t('active_sessions_coming_soon'));
              }}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <View
                  style={[styles.actionIcon, { backgroundColor: '#f0f9ff' }]}
                >
                  <MaterialIcons name="devices" size={24} color="#0284c7" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{t('active_sessions')}</Text>
                  <Text style={styles.actionDescription}>
                    {t('manage_active_devices_short')}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                triggerHaptic();
                showInfo(t('coming_soon'), t('login_history_coming_soon'));
              }}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <View
                  style={[styles.actionIcon, { backgroundColor: '#f0fdf4' }]}
                >
                  <MaterialIcons name="history" size={24} color="#16a34a" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{t('login_history')}</Text>
                  <Text style={styles.actionDescription}>
                    {t('view_recent_login_activity')}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Privacy Settings */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('privacy_and_data')}</Text>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                triggerHaptic();
                showInfo(t('coming_soon'), t('data_export_coming_soon'));
              }}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <View
                  style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}
                >
                  <MaterialIcons name="download" size={24} color="#7c3aed" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{t('export_data')}</Text>
                  <Text style={styles.actionDescription}>
                    {t('download_your_data')}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                triggerHaptic();
                showInfo(t('coming_soon'), t('account_deletion_coming_soon'));
              }}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <View
                  style={[styles.actionIcon, { backgroundColor: '#fef2f2' }]}
                >
                  <MaterialIcons
                    name="delete-forever"
                    size={24}
                    color="#dc2626"
                  />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{t('delete_account')}</Text>
                  <Text style={styles.actionDescription}>
                    {t('permanently_delete_account')}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
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
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral.black,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.neutral.darkGray,
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
