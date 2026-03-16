/**
 * Complete Profile Screen Component
 * Allow new users to complete their profile after OTP registration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NavigationProps } from '../../types/navigation';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { apiService } from '../../services/api.service';
import { API_ENDPOINTS } from '../../constants';

export const CompleteProfileScreen: React.FC<NavigationProps> = ({
  setCurrentScreen,
}) => {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const { user, tokens, refreshAuth } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    // Validate if password is provided
    if (password && password.length < 6) {
      showWarning(t('weak_password'), t('password_min_6'));
      return;
    }

    if (password && password !== confirmPassword) {
      showError(t('password_mismatch'), t('passwords_do_not_match'));
      return;
    }

    try {
      setIsLoading(true);

      // Only send fields that were filled
      const updateData: any = {};
      if (name && name.trim()) updateData.name = name.trim();
      if (email && email.trim()) updateData.email = email.trim();
      if (password) updateData.password = password;

      // Call API to update profile
      await apiService.put(
        API_ENDPOINTS.USER.PROFILE,
        updateData,
        tokens?.accessToken
      );

      // Refresh user data
      if (refreshAuth) {
        await refreshAuth();
      }

      showSuccess(tc('success'), t('profile_updated'));

      // Navigate to dashboard
      setCurrentScreen('dashboard');
    } catch (error: any) {
      showError(t('update_failed'), error.message || t('update_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Navigate to dashboard without completing profile
    setCurrentScreen('dashboard');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.brandTitle}>{tc('app_name')}</Text>
            <Text style={styles.title}>{t('complete_your_profile')}</Text>
            <Text style={styles.subtitle}>
              {t('add_details_unlock_features')}
            </Text>
            <Text style={styles.phoneInfo}>
              {t('phone_label', { phone: user?.phone || t('phone_not_available') })}
            </Text>

            <View style={styles.formContainer}>
              {/* Name Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t('full_name')} <Text style={styles.optional}>{t('optional')}</Text>
                </Text>
                <Input
                  placeholder={t('enter_name')}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t('email_address')} <Text style={styles.optional}>{t('optional')}</Text>
                </Text>
                <Input
                  placeholder={t('enter_email')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t('password')}{' '}
                  <Text style={styles.optional}>
                    {t('optional_password_login')}
                  </Text>
                </Text>
                <Input
                  placeholder={t('create_password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {/* Confirm Password Field */}
              {password ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('confirm_password')}</Text>
                  <Input
                    placeholder={t('confirm_your_password')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
              ) : null}

              {/* Complete Profile Button */}
              <Button
                title={t('complete_profile')}
                variant="primary"
                onPress={handleComplete}
                disabled={isLoading}
              />

              {/* Skip Button */}
              <Button
                title={t('skip_for_now')}
                variant="secondary"
                onPress={handleSkip}
                disabled={isLoading}
              />

              <Text style={styles.skipNote}>
                {t('complete_profile_later')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00D4FF',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    textAlign: 'center',
  },
  phoneInfo: {
    fontSize: 14,
    color: '#00D4FF',
    fontWeight: '600',
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: '500',
  },
  optional: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
  },
  skipNote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 16,
  },
});
