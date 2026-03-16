/**
 * Login Screen Component
 * Handles password login, OTP login, and biometric authentication
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { NavigationProps } from '../../types/navigation';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useBiometric } from '../../hooks/useBiometric';
import { useToast } from '../../contexts/ToastContext';
import { SECURE_STORAGE_KEYS } from '../../constants';
import { logger } from '../../services/logger.service';

interface LoginScreenProps extends NavigationProps {}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  setCurrentScreen,
}) => {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const { showError } = useToast();

  // Local state for form inputs
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Auth context
  const { login, isLoading, restoreSession } = useAuth();

  // Biometric capabilities
  const {
    capabilities: biometricCapabilities,
    getBiometricTypeName,
    biometricLogin,
  } = useBiometric();

  /**
   * Handle password login
   */
  const handleLogin = async () => {
    logger.debug('Login attempt', {
      identifier: identifier.substring(0, 3) + '***',
      hasPassword: !!password,
      isLoading,
    });

    if (!identifier || !password) {
      logger.warn('Login attempt with missing credentials', {
        hasIdentifier: !!identifier,
        hasPassword: !!password,
      });
      return;
    }

    try {
      logger.debug('Initiating login');
      await login({ identifier, password });
      logger.info('Login successful');
      // Navigate to dashboard after successful login
      setCurrentScreen('dashboard');
    } catch (error) {
      logger.error('Login failed', error, {
        identifier: identifier.substring(0, 3) + '***',
      });
      // Error already handled by AuthContext
    }
  };

  /**
   * Handle biometric login
   */
  const handleBiometricLogin = async () => {
    logger.debug('Biometric login attempt');
    try {
      logger.debug('Initiating biometric authentication');
      const result = await biometricLogin();
      logger.debug('Biometric authentication completed', {
        success: result.success,
      });

      if (
        result.success &&
        result.token &&
        result.refreshToken &&
        result.userId
      ) {
        logger.info('Biometric authentication successful');

        // Store tokens so AuthContext can pick them up
        await SecureStore.setItemAsync(SECURE_STORAGE_KEYS.ACCESS_TOKEN, result.token);
        await SecureStore.setItemAsync(SECURE_STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);

        // Restore session in AuthContext
        const restored = await restoreSession();
        if (restored) {
          setCurrentScreen('dashboard');
        } else {
          showError(t('biometric_login_failed'), t('session_expired_relogin'));
        }
      } else {
        logger.warn('Biometric login failed', { error: result.error });
        showError(
          t('biometric_login_failed'),
          result.error ||
            t('enable_biometric_after_login')
        );
      }
    } catch (error) {
      logger.error('Biometric authentication error', error);
      // Error already handled
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Image
              source={require('../../../assets/wyaparpay-logo-horizontal.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>{tc('login')}</Text>
            <Text style={styles.subtitle}>{t('welcome')}</Text>

            <View style={styles.formContainer}>
              <Input
                placeholder={t('phone_or_email')}
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />

              <View style={styles.passwordContainer}>
                <Input
                  placeholder={t('password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={styles.passwordInput}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={24}
                    color="#9AA0A6"
                  />
                </TouchableOpacity>
              </View>

              <Button
                title={t('login_with_password')}
                variant="primary"
                onPress={() => {
                  logger.logUserAction('login_button_pressed');
                  handleLogin();
                }}
                disabled={isLoading}
              />

              <Button
                title={t('login_with_otp')}
                variant="secondary"
                onPress={() => setCurrentScreen('otp-login')}
              />

              {biometricCapabilities.isAvailable && (
                <Button
                  title={t('login_with_biometric', {
                    type: getBiometricTypeName(),
                  })}
                  variant="biometric"
                  onPress={() => {
                    logger.logUserAction('biometric_login_button_pressed');
                    handleBiometricLogin();
                  }}
                  icon={
                    <MaterialIcons
                      name="fingerprint"
                      size={24}
                      color="#F97316"
                    />
                  }
                />
              )}

              <Button
                title={t('dont_have_account') + ' ' + tc('register')}
                variant="link"
                onPress={() => setCurrentScreen('register')}
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
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Light gray background (matching website)
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#202124', // Dark text (matching website)
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#5F6368', // Gray text (matching website)
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 16,
    zIndex: 10,
    padding: 4,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#5F6368', // Gray text
    fontSize: 16,
  },
});
