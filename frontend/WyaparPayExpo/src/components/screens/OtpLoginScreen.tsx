/**
 * OTP Login Screen Component
 * Request OTP for login
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

interface OtpLoginScreenProps extends NavigationProps {
  onOtpSent?: (identifier: string) => void;
}

export const OtpLoginScreen: React.FC<OtpLoginScreenProps> = ({
  setCurrentScreen,
  onOtpSent,
}) => {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const [identifier, setIdentifier] = useState('');
  const { requestOtp, isLoading } = useAuth();
  const { showWarning } = useToast();

  const handleSendOtp = async () => {
    if (!identifier) {
      showWarning(t('missing_information'), t('enter_phone_or_email'));
      return;
    }

    try {
      await requestOtp(identifier);
      // Call callback to store identifier in parent
      if (onOtpSent) {
        onOtpSent(identifier);
      }
      // Navigate to OTP verify screen after successful OTP request
      setCurrentScreen('otp-verify');
    } catch (error) {
      // Error already handled by AuthContext
    }
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.brandTitle}>{tc('app_name')}</Text>
          <Text style={styles.title}>{t('login_with_otp')}</Text>
          <Text style={styles.subtitle}>{t('phone_or_email')}</Text>

          <View style={styles.formContainer}>
            <Input
              placeholder={t('phone_or_email')}
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType="email-address"
            />

            <Button
              title={t('send_otp')}
              variant="primary"
              onPress={handleSendOtp}
              disabled={isLoading}
            />

            <Button
              title={`${tc('back')} ${t('login_with_password')}`}
              variant="link"
              onPress={() => setCurrentScreen('login')}
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
