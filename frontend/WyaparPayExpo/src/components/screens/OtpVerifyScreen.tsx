/**
 * OTP Verify Screen Component
 * Verify OTP code
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NavigationProps } from '../../types/navigation';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface OtpVerifyScreenProps extends NavigationProps {
  identifier: string; // Phone or email that OTP was sent to
}

export const OtpVerifyScreen: React.FC<OtpVerifyScreenProps> = ({
  setCurrentScreen,
  identifier,
}) => {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const [otp, setOtp] = useState('');
  const { loginWithOtp, requestOtp, isLoading } = useAuth();
  const { showWarning } = useToast();

  const handleVerify = async () => {
    if (!otp) {
      showWarning(t('missing_otp'), t('please_enter_otp'));
      return;
    }

    try {
      const result = await loginWithOtp({ identifier, otp });

      // Check if this is a new user (auto-registered)
      if (result?.isNewUser) {
        // Navigate to complete profile for new users
        setCurrentScreen('complete-profile');
      } else {
        // Navigate to dashboard for existing users
        setCurrentScreen('dashboard');
      }
    } catch (error) {
      // Error already handled by AuthContext
    }
  };

  const handleResend = async () => {
    try {
      await requestOtp(identifier);
    } catch (error) {
      // Error already handled by AuthContext
    }
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.brandTitle}>{tc('app_name')}</Text>
          <Text style={styles.title}>{t('verify_otp')}</Text>
          <Text style={styles.subtitle}>{t('otp_sent', { identifier })}</Text>
          <Text style={styles.otpTarget}>{identifier}</Text>

          <View style={styles.formContainer}>
            <Input
              placeholder={t('otp_helper')}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Button
              title={t('verify_otp')}
              variant="primary"
              onPress={handleVerify}
              disabled={isLoading}
            />

            <Button
              title={t('resend_otp')}
              variant="link"
              onPress={handleResend}
            />

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentScreen('landing')}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>← {tc('back')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  otpTarget: {
    fontSize: 16,
    color: '#00D4FF',
    fontWeight: '600',
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
});
