/**
 * Register Screen Component
 * Handles new user registration
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
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { NavigationProps } from '../../types/navigation';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface RegisterScreenProps extends NavigationProps {
  onRegistrationSuccess?: (userId: string, email: string) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  setCurrentScreen,
  onRegistrationSuccess,
}) => {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const { t: te } = useTranslation('errors');
  const { showError, showWarning } = useToast();

  // Local state for form inputs
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email validation state
  const [emailError, setEmailError] = useState('');

  // Auth context
  const { register, isLoading } = useAuth();

  // Password validation state
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  /**
   * Validate password requirements
   */
  const validatePassword = (pwd: string) => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push(t('at_least_8_chars'));
    if (!/[A-Z]/.test(pwd)) errors.push(t('one_uppercase'));
    if (!/[a-z]/.test(pwd)) errors.push(t('one_lowercase'));
    if (!/[0-9]/.test(pwd)) errors.push(t('one_number'));
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd))
      errors.push(t('one_special_char'));
    setPasswordErrors(errors);
    return errors.length === 0;
  };

  /**
   * Handle password change with validation
   */
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (text.length > 0) {
      validatePassword(text);
    } else {
      setPasswordErrors([]);
    }
  };

  /**
   * Validate email format
   */
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(text)) {
        setEmailError(t('valid_email'));
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  };

  /**
   * Validate phone number format
   */
  const validatePhone = (phoneNum: string): boolean => {
    // Remove any non-digit characters
    const cleaned = phoneNum.replace(/\D/g, '');
    // Check if it's exactly 10 digits
    return cleaned.length === 10;
  };

  /**
   * Handle registration
   */
  const handleRegister = async () => {
    // Validation
    if (!name || !phone || !email || !password || !confirmPassword) {
      showError(t('missing_fields'), t('fill_all_fields'));
      return;
    }

    // Validate phone number
    if (!validatePhone(phone)) {
      showWarning(
        t('invalid_phone'),
        t('valid_10_digit')
      );
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showWarning(t('invalid_email'), t('valid_email'));
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      showWarning(
        t('weak_password'),
        `${t('password_helper')}: ${passwordErrors.join(', ')}`
      );
      return;
    }

    if (password !== confirmPassword) {
      showError(t('password_mismatch'), t('passwords_do_not_match'));
      return;
    }

    try {
      const result = await register({ name, phone, email, password });

      // Pass registration data to parent
      if (onRegistrationSuccess) {
        onRegistrationSuccess(result.userId, result.email);
      }

      // Navigate to email verification screen
      setCurrentScreen('email-verify');
    } catch (error) {
      // Error already handled by AuthContext
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
            <Text style={styles.title}>{t('register')}</Text>
            <Text style={styles.subtitle}>{t('create_account')}</Text>

            <View style={styles.formContainer}>
              <Input
                placeholder={t('full_name')}
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />

              <Input
                placeholder={t('phone_number')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
                maxLength={10}
              />

              <View>
                <Input
                  placeholder={t('email_address')}
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                {emailError ? (
                  <Text style={styles.emailErrorText}>{emailError}</Text>
                ) : null}
              </View>

              <View>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder={t('password')}
                    placeholderTextColor="#9AA0A6"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialIcons
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={24}
                      color="#9AA0A6"
                    />
                  </TouchableOpacity>
                </View>
                {password.length > 0 && (
                  <View style={styles.passwordRequirements}>
                    <Text style={styles.requirementsTitle}>
                      {t('password_helper')}
                    </Text>
                    {[
                      t('at_least_8_chars'),
                      t('one_uppercase'),
                      t('one_lowercase'),
                      t('one_number'),
                      t('one_special_char'),
                    ].map((req) => (
                      <Text
                        key={req}
                        style={
                          passwordErrors.includes(req)
                            ? styles.errorText
                            : styles.successText
                        }
                      >
                        {passwordErrors.includes(req) ? '✗' : '✓'} {req}
                      </Text>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('confirm_password')}
                  placeholderTextColor="#9AA0A6"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <MaterialIcons
                    name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                    size={24}
                    color="#9AA0A6"
                  />
                </TouchableOpacity>
              </View>

              <Button
                title={t('register')}
                variant="primary"
                onPress={handleRegister}
                disabled={isLoading}
              />

              <Button
                title={`${t('already_have_account')} ${t('login')}`}
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
  helperText: {
    fontSize: 12,
    color: '#9AA0A6', // Medium gray
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 4,
  },
  emailErrorText: {
    fontSize: 12,
    color: '#FF6B6B', // Red for error
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  passwordRequirements: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)', // Orange with opacity
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  requirementsTitle: {
    fontSize: 13,
    color: '#F97316', // Orange-500
    fontWeight: '600',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginBottom: 3,
  },
  successText: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 3,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#5F6368', // Gray text
    fontSize: 16,
  },
  passwordInputContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 8,
  },
  passwordInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    paddingRight: 56, // More space for eye icon
    color: '#202124',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
    height: 56,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 16,
    padding: 4,
    zIndex: 1,
  },
});
