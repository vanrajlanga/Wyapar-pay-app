/**
 * Email Verify Screen Component
 * Verify email with code sent to user
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { NavigationProps } from '../../types/navigation';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface EmailVerifyScreenProps extends NavigationProps {
  userId: string;
  email: string;
}

export const EmailVerifyScreen: React.FC<EmailVerifyScreenProps> = ({
  setCurrentScreen,
  userId,
  email,
}) => {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const [code, setCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const { verifyEmail, resendVerification, isLoading } = useAuth();
  const { showWarning, showSuccess } = useToast();

  const handleVerify = async () => {
    if (!code) {
      showWarning('Missing Code', 'Please enter the verification code');
      return;
    }

    try {
      await verifyEmail(userId, code);
      // Show success message and redirect to login
      showSuccess(
        'Email Verified!',
        'Your email has been verified successfully.'
      );
      // Navigate to login after a short delay
      setTimeout(() => setCurrentScreen('login'), 1500);
    } catch (error) {
      // Error already handled by AuthContext
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendVerification(userId, email);
    } catch (error) {
      // Error already handled by AuthContext
    } finally {
      setIsResending(false);
    }
  };

  const handleBackWithHaptic = (screen: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentScreen(screen);
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Image
            source={require('../../../assets/wyaparpay-logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{t('verify_email')}</Text>
          <Text style={styles.subtitle}>{t('code_sent')}</Text>
          <Text style={styles.emailTarget}>{email}</Text>

          <View style={styles.formContainer}>
            <Input
              placeholder={t('enter_verification_code')}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Button
              title={t('verify_email')}
              variant="primary"
              onPress={handleVerify}
              disabled={isLoading}
            />

            <TouchableOpacity
              style={[styles.linkButton, isResending && styles.disabledButton]}
              onPress={handleResend}
              disabled={isResending}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                {isResending ? `${tc('loading')}...` : t('resend_code')}
              </Text>
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <MaterialIcons name="info" size={16} color="#00D4FF" />
              <Text style={styles.infoText}>
                Didn't receive the email? Check your spam folder or try
                resending.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => handleBackWithHaptic('register')}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>
                ← {tc('back')} {t('register')}
              </Text>
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
  logo: {
    width: 200,
    height: 80,
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
  emailTarget: {
    fontSize: 16,
    color: '#00D4FF',
    fontWeight: '600',
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
  },
  linkButton: {
    marginBottom: 16,
    alignItems: 'center',
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  disabledButton: {
    opacity: 0.5,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    lineHeight: 18,
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
