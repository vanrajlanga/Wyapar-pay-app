// Import crypto polyfill FIRST (required for AWS SDK)
import './src/utils/crypto-polyfill';
// Import i18n configuration
import './src/i18n';

import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Dimensions,
  Linking,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useBiometric } from './src/hooks/useBiometric';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { apiService, ApiError } from './src/services/api.service';
import { logger } from './src/services/logger.service';
import {
  API_ENDPOINTS,
  DEFAULT_TEST_CREDENTIALS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
} from './src/constants';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { UserProvider } from './src/contexts/UserContext';
import { RechargeProvider, useRecharge } from './src/contexts/RechargeContext';
import { ToastProvider } from './src/contexts/ToastContext';
import {
  LandingScreen,
  LoginScreen,
  RegisterScreen,
  OtpLoginScreen,
  OtpVerifyScreen,
  CompleteProfileScreen,
  EmailVerifyScreen,
  AccountDetailsScreen,
  PreferencesScreen,
  SecurityScreen,
  ProfileManagementScreen,
  RechargeEntryScreen,
  RechargePlansScreen,
  RechargeReviewScreen,
  RechargeStatusScreen,
  RechargeHistoryScreen,
  DthEntryScreen,
  DthPlansScreen,
  DthReviewScreen,
  TransactionHistoryScreen,
  PaymentSuccessScreen,
  ContactUsScreen,
} from './src/components';
import ModernDashboardScreen from './src/components/screens/ModernDashboardScreen';
import { Screen } from './src/types/navigation';

function AppContent() {
  // Load custom fonts - MUST be called before any conditional returns
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  // Initialize push notifications - MUST be called before any conditional returns
  const {
    expoPushToken,
    isPermissionGranted,
    error: pushError,
    sendTestNotification,
    getNotificationStats,
  } = usePushNotifications();

  // Get authentication state - MUST be called before any conditional returns
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');

  // Minimal state for OTP flow (just to pass identifier between screens)
  const [otpIdentifier, setOtpIdentifier] = useState('');

  // DTH flow state
  const [dthData, setDthData] = useState<{
    subscriberId: string;
    dthOperatorId: string;
    dthOperatorName: string;
    selectedPlan?: { name: string; amount: number; months: string };
  }>({ subscriberId: '', dthOperatorId: '', dthOperatorName: '' });

  // Minimal state for email verification flow
  const [emailVerification, setEmailVerification] = useState({
    email: '',
    userId: '',
  });

  // Get recharge context for payment success screen
  const { lastTransaction } = useRecharge();

  // ============================================
  // NOTE: User data and preferences moved to UserContext!
  // Old state variables (userData, preferences) removed
  // ============================================

  // Animation values - ALL hooks must be declared BEFORE any conditional returns
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const titleSlideAnim = useRef(new Animated.Value(0)).current;
  const subtitleSlideAnim = useRef(new Animated.Value(0)).current;
  const descriptionSlideAnim = useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = useRef(new Animated.Value(0)).current;
  const reachUsSliderAnim = useRef(new Animated.Value(0)).current;
  const sliderHeightAnim = useRef(new Animated.Value(80)).current;
  const contactIconsOpacity = useRef(new Animated.Value(0)).current;
  const [showContactIcons, setShowContactIcons] = useState(false);

  // Check authentication on mount - Navigate to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentScreen === 'landing') {
      setCurrentScreen('dashboard');
    }
  }, [authLoading, isAuthenticated]);

  // Landing page animations - MUST be before any conditional returns
  useEffect(() => {
    if (currentScreen === 'landing') {
      // Reset all animations first
      fadeAnim.setValue(0);
      slideAnim.setValue(0);
      scaleAnim.setValue(0.8);
      titleSlideAnim.setValue(0);
      subtitleSlideAnim.setValue(0);
      descriptionSlideAnim.setValue(0);
      buttonSlideAnim.setValue(0);

      // Start animations with staggered timing
      setTimeout(() => {
        // Main container animation
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();

        // Staggered individual element animations
        setTimeout(() => {
          Animated.timing(titleSlideAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start();
        }, 200);

        setTimeout(() => {
          Animated.timing(subtitleSlideAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start();
        }, 400);

        setTimeout(() => {
          Animated.timing(descriptionSlideAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start();
        }, 600);

        setTimeout(() => {
          Animated.timing(buttonSlideAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start();
        }, 800);
      }, 200);
    } else {
      // Reset animations when leaving landing page
      fadeAnim.setValue(0);
      slideAnim.setValue(0);
      scaleAnim.setValue(0.8);
      titleSlideAnim.setValue(0);
      subtitleSlideAnim.setValue(0);
      descriptionSlideAnim.setValue(0);
      buttonSlideAnim.setValue(0);
    }
  }, [currentScreen]);

  // Show loading screen while fonts or auth are loading - AFTER all hooks
  if (!fontsLoaded || authLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1a1a2e',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
          Loading WyaparPay...
        </Text>
      </View>
    );
  }

  const toggleContactIcons = () => {
    const newState = !showContactIcons;
    setShowContactIcons(newState);

    // Animate height change and icons opacity
    Animated.parallel([
      Animated.timing(sliderHeightAnim, {
        toValue: newState ? 140 : 80,
        duration: 300,
        useNativeDriver: false, // Height animation requires layout changes
      }),
      Animated.timing(contactIconsOpacity, {
        toValue: newState ? 1 : 0,
        duration: newState ? 400 : 200, // Slower fade in, faster fade out
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePhoneCall = () => {
    Linking.openURL('tel:+919876543210');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@wyaparpay.com');
  };

  const handleWhatsApp = () => {
    Linking.openURL(
      'whatsapp://send?phone=919876543210&text=Hello, I need support for WyaparPay'
    );
  };

  // Haptic feedback helper
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Back button with haptic feedback
  const handleBackWithHaptic = (screen: Screen) => {
    triggerHaptic();
    setCurrentScreen(screen);
  };

  // ============================================
  // NOTE: Old preference and logout handlers removed!
  // These are now handled by:
  // - UserContext (loadPreferences, togglePreference)
  // - AuthContext (logout)
  // ============================================

  // ============================================
  // NOTE: OTP and Email verification handlers removed!
  // These are now handled by:
  // - OtpLoginScreen (uses useAuth().requestOtp())
  // - OtpVerifyScreen (uses useAuth().loginWithOtp())
  // - EmailVerifyScreen (uses useAuth().verifyEmail() and resendVerification())
  // ============================================
  // NOTE: Old renderLandingScreen function removed!
  // Landing screen now uses extracted LandingScreen component
  // ============================================

  // ============================================
  // NOTE: Old render functions for Login, Register, OTP, and EmailVerify screens removed!
  // These now use extracted components from src/components/screens/
  // ============================================

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return (
          <LandingScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
          />
        );

      case 'login':
        return (
          <LoginScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
          />
        );

      case 'register':
        return (
          <RegisterScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
            onRegistrationSuccess={(userId, email) => {
              setEmailVerification({ userId, email });
            }}
          />
        );

      case 'otp-login':
        return (
          <OtpLoginScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
            onOtpSent={setOtpIdentifier}
          />
        );

      case 'otp-verify':
        return (
          <OtpVerifyScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
            identifier={otpIdentifier}
          />
        );

      case 'complete-profile':
        return (
          <CompleteProfileScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
          />
        );

      case 'email-verify':
        return (
          <EmailVerifyScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
            userId={emailVerification.userId}
            email={emailVerification.email}
          />
        );

      case 'account-details':
        return (
          <AccountDetailsScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
            handleBackWithHaptic={handleBackWithHaptic}
            triggerHaptic={triggerHaptic}
          />
        );

      case 'dashboard':
        return (
          <ModernDashboardScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
            triggerHaptic={triggerHaptic}
          />
        );

      case 'preferences':
        return (
          <PreferencesScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
            handleBackWithHaptic={handleBackWithHaptic}
            triggerHaptic={triggerHaptic}
          />
        );

      case 'security':
        return (
          <SecurityScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
            handleBackWithHaptic={handleBackWithHaptic}
            triggerHaptic={triggerHaptic}
          />
        );

      case 'profile-management':
        return (
          <ProfileManagementScreen
            setCurrentScreen={(screen: string) =>
              setCurrentScreen(screen as Screen)
            }
            currentScreen={currentScreen}
            triggerHaptic={triggerHaptic}
          />
        );

      case 'recharge-entry':
        return (
          <RechargeEntryScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
            triggerHaptic={triggerHaptic}
          />
        );

      case 'recharge-plans':
        return (
          <RechargePlansScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
          />
        );

      case 'recharge-review':
        return (
          <RechargeReviewScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
          />
        );

      case 'recharge-status':
        return (
          <RechargeStatusScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
          />
        );

      case 'recharge-history':
        return (
          <RechargeHistoryScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
          />
        );

      case 'dth-entry':
        return (
          <DthEntryScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
            onDthData={({ subscriberId, operator }) => {
              setDthData(prev => ({
                ...prev,
                subscriberId,
                dthOperatorId: operator.id,
                dthOperatorName: operator.displayName,
              }));
            }}
          />
        );

      case 'dth-plans':
        return (
          <DthPlansScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
            dthOperatorId={dthData.dthOperatorId}
            dthOperatorName={dthData.dthOperatorName}
            onPlanSelected={(plan) => {
              setDthData(prev => ({ ...prev, selectedPlan: plan }));
            }}
          />
        );

      case 'dth-review':
        return (
          <DthReviewScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
            subscriberId={dthData.subscriberId}
            dthOperatorId={dthData.dthOperatorId}
            dthOperatorName={dthData.dthOperatorName}
            selectedPlan={dthData.selectedPlan}
          />
        );

      case 'transaction-history':
        return (
          <TransactionHistoryScreen
            setCurrentScreen={(screen: string) =>
              setCurrentScreen(screen as Screen)
            }
            triggerHaptic={triggerHaptic}
          />
        );

      case 'payment-success':
        return (
          <PaymentSuccessScreen
            setCurrentScreen={(screen: string) =>
              setCurrentScreen(screen as Screen)
            }
            currentScreen={currentScreen}
            triggerHaptic={triggerHaptic}
            onBackToDashboard={() => setCurrentScreen('dashboard')}
            onViewHistory={() => setCurrentScreen('transaction-history')}
            transactionId={lastTransaction?.transactionId}
            amount={typeof lastTransaction?.amount === 'number' ? lastTransaction.amount : parseFloat(String(lastTransaction?.amount || '0'))}
            operatorName={lastTransaction?.operator}
            mobileNumber={lastTransaction?.mobileNumber}
            planName={(lastTransaction as any)?.planName}
          />
        );

      case 'contact-us':
        return (
          <ContactUsScreen
            setCurrentScreen={(screen: string) =>
              setCurrentScreen(screen as Screen)
            }
            currentScreen={currentScreen}
            triggerHaptic={triggerHaptic}
          />
        );

      default:
        return (
          <LandingScreen
            setCurrentScreen={setCurrentScreen}
            currentScreen={currentScreen}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      {renderCurrentScreen()}
    </View>
  );
}

// Main App component with providers
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserProvider>
          <RechargeProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </RechargeProvider>
        </UserProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23', // WyaparPay brand dark color
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  loginLogo: {
    width: 200,
    height: 80,
    marginBottom: 20,
  },
  registerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
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
  input: {
    width: '100%',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#ffffff',
  },
  primaryButtonText: {
    color: '#0F0F23',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButton: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00D4FF',
    gap: 10,
  },
  biometricButtonText: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
  otpTarget: {
    fontSize: 16,
    color: '#00D4FF',
    fontWeight: '600',
    marginBottom: 32,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emailVerifyInfo: {
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
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#0F0F23',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    padding: 8,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 20,
  },
  profileIconEmoji: {
    fontSize: 20,
  },
  dashboardScrollView: {
    flex: 1,
  },
  dashboardScrollContent: {
    paddingBottom: 20,
  },
  dashboardContent: {
    paddingHorizontal: 16,
  },
  balanceCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  balanceCardContent: {
    // Style definitions
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceTrend: {
    fontSize: 14,
    color: '#4CAF50',
  },
  transactionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardContent: {
    // Style definitions
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  viewAllTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#00D4FF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  transactionAmountCredit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  quickActionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00D4FF',
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F0F23',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  secondaryActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00D4FF',
  },
  rechargeBillsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  rechargeBillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  rechargeBillItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  rechargeBillIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rechargeBillLabel: {
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'center',
  },
  offersCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  offerItem: {
    flexDirection: 'column',
    gap: 12,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerDetails: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  offerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  offerButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  offerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F0F23',
  },
  bottomSpacing: {
    height: 40,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#0F0F23',
  },
  closeButton: {
    padding: 8,
  },
  accountHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerSpacer: {
    width: 40,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  profileStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileStatusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#ffffff',
  },
  logoutCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  preferencesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preferenceText: {
    fontSize: 16,
    color: '#ffffff',
  },
  securityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  securityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  securityItemTitle: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  securityItemSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
