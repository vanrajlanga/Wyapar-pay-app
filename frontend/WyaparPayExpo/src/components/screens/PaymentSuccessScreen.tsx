/**
 * Stunning Payment Success Screen
 * Features animated checkmark, confetti rain, smooth transitions, and modern UX
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useScreenTranslation } from '../../hooks/useScreenTranslation';
import { GenericReceiptGenerator } from '../../utils/generic-receipt.generator';
import { TransactionUtils } from '../../utils/transaction.utils';
import { NavigationProps } from '../../types/navigation';
import {
  GenericTransactionData,
  PaymentSuccessConfig,
  DEFAULT_SUCCESS_CONFIG,
  DEFAULT_COMPANY_INFO,
} from '../../types/generic-transaction';
import { GenericSharingService } from '../../services/generic-sharing.service';
import { ReceiptComponent } from '../common/ReceiptComponent';
import {
  colors,
  textStyles,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';
import { captureRef } from 'react-native-view-shot';
import { logger } from '../../services/logger.service';
import { useToast } from '../../contexts/ToastContext';

const { width, height } = Dimensions.get('window');

interface PaymentSuccessScreenProps extends NavigationProps {
  // Generic transaction data
  transactionData?: GenericTransactionData;

  // Legacy support - will be converted to GenericTransactionData
  transaction?: GenericTransactionData;
  transactionId?: string;
  amount?: number;
  operatorName?: string;
  mobileNumber?: string;
  planName?: string;

  // Configuration
  config?: PaymentSuccessConfig;

  // Callbacks
  triggerHaptic: () => void;
  onBackToDashboard?: () => void;
  onViewHistory?: () => void;
  onCustomAction?: (actionId: string) => void;
}

// Confetti Component
const ConfettiParticle: React.FC<{
  delay: number;
  duration: number;
  color: string;
  size: number;
  startX: number;
}> = ({ delay, duration, color, size, startX }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 100,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: startX + (Math.random() - 0.5) * 100,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: duration * 0.8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset and restart animation
        translateY.setValue(-50);
        translateX.setValue(startX);
        rotate.setValue(0);
        opacity.setValue(1);
        setTimeout(animate, Math.random() * 2000 + 1000);
      });
    };

    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, []);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        {
          backgroundColor: color,
          width: size,
          height: size,
          transform: [{ translateY }, { translateX }, { rotate: rotation }],
          opacity,
        },
      ]}
    />
  );
};

// Animated Checkmark Component
const AnimatedCheckmark: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(pulseAnimation, 2000);
      });
    };

    setTimeout(pulseAnimation, 1000);
  }, []);

  return (
    <View style={styles.checkmarkContainer}>
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size + 40,
            height: size + 40,
            borderRadius: (size + 40) / 2,
            transform: [{ scale: pulseScale }],
          },
        ]}
      />

      {/* Main checkmark */}
      <Animated.View
        style={[
          styles.checkmarkCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <MaterialIcons name="check" size={size * 0.6} color={color} />
      </Animated.View>
    </View>
  );
};

export const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({
  setCurrentScreen,
  transactionData,
  transaction,
  transactionId,
  amount,
  operatorName,
  mobileNumber,
  planName,
  config = {},
  triggerHaptic,
  onBackToDashboard,
  onViewHistory,
  onCustomAction,
}) => {
  const { t, tc } = useScreenTranslation('payment-success');
  const [isSharing, setIsSharing] = useState(false);
  const receiptRef = useRef<View>(null);
  const { showSuccess, showError } = useToast();

  // Animation values
  const slideUp = useRef(new Animated.Value(height)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const amountScale = useRef(new Animated.Value(0.8)).current;
  const buttonsSlide = useRef(new Animated.Value(50)).current;

  // Merge config with defaults
  const finalConfig = { ...DEFAULT_SUCCESS_CONFIG, ...config };

  // Convert legacy props to GenericTransactionData if needed
  const successTransactionData: GenericTransactionData =
    transactionData ||
    GenericReceiptGenerator.createFromLegacyTransaction(
      transaction || {
        id: transactionId || 'TXN123456789',
        amount: amount || 0,
        status: 'success',
        type: 'recharge',
        createdAt: new Date().toISOString(),
        metadata: {
          mobileNumber: mobileNumber || 'N/A',
          operatorName: operatorName || 'N/A',
          planName: planName || 'N/A',
        },
      },
      'recharge',
      finalConfig.companyInfo || DEFAULT_COMPANY_INFO
    );

  // Animation sequence
  useEffect(() => {
    const animateSequence = () => {
      // 1. Screen slides up from bottom
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // 2. Content fades in
      setTimeout(() => {
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 200);

      // 3. Amount scales in
      setTimeout(() => {
        Animated.spring(amountScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }, 700);

      // 4. Buttons slide in
      setTimeout(() => {
        Animated.timing(buttonsSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 1000);
    };

    animateSequence();

    // Auto-hide after 5 seconds
    const autoHideTimer = setTimeout(() => {
      handleBackToDashboard();
    }, 5000);

    return () => clearTimeout(autoHideTimer);
  }, []);

  const handleShareReceipt = async () => {
    try {
      setIsSharing(true);
      triggerHaptic();

      // Capture the receipt as an image
      if (receiptRef.current) {
        logger.debug('Capturing receipt image');
        const imageUri = await captureRef(receiptRef.current, {
          format: 'png',
          quality: 0.8,
          result: 'tmpfile',
        });
        logger.debug('Receipt image captured', { imageUri });

        // Share the image
        const result = await Share.share({
          url: imageUri,
          title: `Payment Receipt - ${successTransactionData.companyInfo?.name || 'WyaparPay'}`,
          message: `Payment Receipt for ₹${successTransactionData.amount.toFixed(2)}`,
        });

        if (result.action === 'sharedAction') {
          showSuccess(tc('success'), t('receipt_shared_successfully'));
        }
      } else {
        logger.debug('ReceiptRef not available, using text sharing fallback');
        // Fallback to text sharing if image capture fails
        const result = await GenericSharingService.shareReceipt(
          successTransactionData,
          finalConfig
        );

        if (result.success) {
          showSuccess(tc('success'), t('receipt_shared_successfully'));
        } else {
          showError(tc('error'), t('failed_to_share_receipt'));
        }
      }
    } catch (error) {
      logger.error('Failed to share receipt', error);

      // Fallback to text sharing on error
      try {
        const result = await GenericSharingService.shareReceipt(
          successTransactionData,
          finalConfig
        );

        if (result.success) {
          showSuccess(tc('success'), t('receipt_shared_successfully'));
        } else {
          showError(tc('error'), t('failed_to_share_receipt'));
        }
      } catch (fallbackError) {
        logger.error('Fallback share failed', fallbackError);
        showError(tc('error'), t('failed_to_share_receipt'));
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleBackToDashboard = () => {
    triggerHaptic();

    // Slide down animation before navigating
    Animated.timing(slideUp, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onBackToDashboard) {
        onBackToDashboard();
      } else {
        setCurrentScreen('dashboard');
      }
    });
  };

  const handleViewTransaction = () => {
    triggerHaptic();
    if (onViewHistory) {
      onViewHistory();
    } else {
      setCurrentScreen('transaction-history');
    }
  };

  // Generate confetti particles
  const confettiColors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
  ];
  const confettiParticles = Array.from({ length: 20 }, (_, i) => (
    <ConfettiParticle
      key={i}
      delay={i * 100}
      duration={3000 + Math.random() * 2000}
      color={confettiColors[i % confettiColors.length]}
      size={8 + Math.random() * 8}
      startX={Math.random() * width}
    />
  ));

  return (
    <View style={styles.container}>
      {/* Confetti Background */}
      <View style={styles.confettiContainer}>{confettiParticles}</View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        <LinearGradient
          colors={['#10B981', '#059669', '#047857']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Success Icon */}
          <Animated.View
            style={[
              styles.successSection,
              {
                opacity: fadeIn,
              },
            ]}
          >
            <AnimatedCheckmark size={120} color="#FFFFFF" />

            <Text style={styles.successTitle}>
              {finalConfig.title || t('payment_successful')}
            </Text>

            <Text style={styles.successSubtitle}>
              {finalConfig.subtitle || t('transaction_completed')}
            </Text>
          </Animated.View>

          {/* Amount Display */}
          <Animated.View
            style={[
              styles.amountSection,
              {
                opacity: fadeIn,
                transform: [{ scale: amountScale }],
              },
            ]}
          >
            <Text style={styles.amountLabel}>{t('amount_paid')}</Text>
            <Text style={styles.amountValue}>
              ₹{successTransactionData.amount.toFixed(2)}
            </Text>
            <Text style={styles.transactionId}>
              {t('txn_id', { id: successTransactionData.transactionId })}
            </Text>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            style={[
              styles.buttonSection,
              {
                opacity: fadeIn,
                transform: [{ translateY: buttonsSlide }],
              },
            ]}
          >
            {/* Back to Home Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleBackToDashboard}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="home" size={24} color="#059669" />
                <Text style={styles.primaryButtonText}>{t('back_to_home')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Share Receipt Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleShareReceipt}
              disabled={isSharing}
              activeOpacity={0.8}
            >
              <View style={styles.secondaryButtonContent}>
                <MaterialIcons
                  name="share"
                  size={24}
                  color={isSharing ? '#9CA3AF' : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: isSharing ? '#9CA3AF' : '#FFFFFF' },
                  ]}
                >
                  {t('share_receipt')}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Additional Info */}
          <Animated.View
            style={[
              styles.infoSection,
              {
                opacity: fadeIn,
              },
            ]}
          >
            <View style={styles.infoCard}>
              <MaterialIcons name="info" size={20} color="#10B981" />
              <Text style={styles.infoText}>
                {t('receipt_saved_message')}
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Hidden Receipt Component for Image Capture */}
      <View ref={receiptRef} style={styles.hiddenReceiptContainer}>
        <ReceiptComponent
          transactionData={successTransactionData}
          config={finalConfig}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  confettiParticle: {
    position: 'absolute',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 40,
  },
  successSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  checkmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pulseRing: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  checkmarkCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  successSubtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  transactionId: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  buttonSection: {
    width: '100%',
    marginBottom: 32,
  },
  primaryButton: {
    marginBottom: 16,
    borderRadius: 16,
    ...shadows.lg,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    width: '100%',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 12,
    flex: 1,
  },
  hiddenReceiptContainer: {
    position: 'absolute',
    left: -2000,
    top: -2000,
    width: 400,
    height: 600,
    opacity: 1,
    pointerEvents: 'none',
    backgroundColor: '#1A1A1A',
  },
});
