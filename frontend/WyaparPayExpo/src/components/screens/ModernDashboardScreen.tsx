/**
 * Modern Mobile Dashboard Screen - Inspired by modern fintech apps
 * Mobile-first design with pull-to-refresh, carousel banners, haptic feedback
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NavigationProps } from '../../types/navigation';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  transactionService,
  Transaction,
} from '../../services/transaction.service';
import {
  colors,
  textStyles,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';
import { logger } from '../../services/logger.service';
import { showComingSoonToast } from '../../utils/toast.utils';
import { TOAST_MESSAGES } from '../../constants';

const { width, height } = Dimensions.get('window');
const MOBILE_WIDTH = 375; // iPhone standard width

interface ModernDashboardScreenProps extends NavigationProps {
  triggerHaptic: () => void;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  gradient: string[];
  amount: string;
  amountLabel: string;
}

export const ModernDashboardScreen: React.FC<ModernDashboardScreenProps> = ({
  setCurrentScreen,
  triggerHaptic,
}) => {
  const { user } = useUser();
  const { tokens, logout } = useAuth();
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  // State
  const [balance, setBalance] = useState(2450.0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [showAllServicesModal, setShowAllServicesModal] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const carouselAnim = useRef(new Animated.Value(0)).current;

  // Carousel timer
  const carouselTimer = useRef<NodeJS.Timeout | null>(null);

  // Offers data
  const offers: Offer[] = [
    {
      id: '1',
      title: '🎉 Mega Cashback!',
      description: 'Get up to 25% cashback on all transactions',
      buttonText: 'Claim Now',
      gradient: ['#ec4899', '#f97316'],
      amount: '25%',
      amountLabel: 'OFF',
    },
    {
      id: '2',
      title: '⚡ Flash Sale!',
      description: '₹100 instant cashback on first recharge',
      buttonText: 'Get ₹100',
      gradient: ['#7c3aed', '#2563eb'],
      amount: '₹100',
      amountLabel: 'FREE',
    },
    {
      id: '3',
      title: '🔥 Bill Bonanza!',
      description: 'Pay 3 bills & get ₹200 cashback guaranteed',
      buttonText: 'Start Now',
      gradient: ['#10b981', '#14b8a6'],
      amount: '₹200',
      amountLabel: 'BONUS',
    },
    {
      id: '4',
      title: '🎯 Refer Frenzy!',
      description: 'Refer 5 friends & earn ₹1000 instantly',
      buttonText: 'Refer Now',
      gradient: ['#eab308', '#ef4444'],
      amount: '₹1K',
      amountLabel: 'EARN',
    },
    {
      id: '5',
      title: '💎 VIP Weekend!',
      description: 'Double cashback on all weekend transactions',
      buttonText: 'Go VIP',
      gradient: ['#4f46e5', '#7c3aed'],
      amount: '2X',
      amountLabel: 'CASH',
    },
  ];

  // Load data
  const loadData = useCallback(async () => {
    try {
      if (!tokens?.accessToken) return;

      setIsLoading(true);
      const transactions = await transactionService.getRecentTransactions(
        5,
        tokens.accessToken
      );
      setRecentTransactions(transactions);
      logger.info('Dashboard data loaded successfully');
    } catch (error: any) {
      // If it's a 401 error, the token is invalid - trigger logout silently
      if (error?.statusCode === 401) {
        logger.warn('Token is invalid, triggering logout from dashboard');
        await logout();
        return;
      }
      // Only log other errors
      logger.error('Failed to load dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  }, [tokens?.accessToken, logout]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    triggerHaptic();
    await loadData();
    setRefreshing(false);
  }, [loadData, triggerHaptic]);

  // Initialize
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    loadData();
  }, [loadData]);

  // Separate effect for carousel to prevent multiple timers
  useEffect(() => {
    startCarousel();

    // Cleanup: stop carousel when component unmounts
    return () => {
      stopCarousel();
    };
  }, []);

  // Animate carousel when currentOfferIndex changes
  useEffect(() => {
    Animated.timing(carouselAnim, {
      toValue: currentOfferIndex,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [currentOfferIndex]);

  // Carousel functions
  const startCarousel = () => {
    // Clear any existing timer first to prevent multiple timers
    stopCarousel();

    // Carousel auto-scroll interval - 6 seconds for comfortable reading
    const CAROUSEL_INTERVAL_MS = 6000;
    carouselTimer.current = setInterval(() => {
      setCurrentOfferIndex((prev) => {
        const nextIndex = (prev + 1) % offers.length;
        return nextIndex;
      });
    }, CAROUSEL_INTERVAL_MS);
  };

  const stopCarousel = () => {
    if (carouselTimer.current) {
      clearInterval(carouselTimer.current);
      carouselTimer.current = null;
    }
  };

  const goToOffer = (index: number) => {
    triggerHaptic();
    setCurrentOfferIndex(index);
    stopCarousel();
    setTimeout(startCarousel, 6000);
  };

  // Add money functions
  const handleAddMoney = async () => {
    if (!addMoneyAmount || parseFloat(addMoneyAmount) <= 0) {
      showWarning('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      triggerHaptic();
      const amount = parseFloat(addMoneyAmount);
      setBalance((prev) => prev + amount);
      setShowAddMoneyModal(false);
      setAddMoneyAmount('');

      // Show success notification
      showSuccess('Success', `₹${amount} added to your wallet!`);
    } catch (error) {
      showError('Error', 'Failed to add money. Please try again.');
    }
  };

  const handleQuickAmount = (amount: string) => {
    triggerHaptic();
    setAddMoneyAmount(amount);
  };

  // Transaction helpers
  const getTransactionIcon = (category?: string) => {
    switch (category) {
      case 'mobile_recharge':
        return 'phone-android';
      case 'dth_recharge':
        return 'tv';
      case 'electricity_bill':
        return 'flash-on';
      case 'gas_bill':
        return 'local-gas-station';
      case 'water_bill':
        return 'water-drop';
      case 'wallet_topup':
        return 'add-circle';
      default:
        return 'receipt';
    }
  };

  const getTransactionColor = (category?: string) => {
    switch (category) {
      case 'mobile_recharge':
        return '#10b981';
      case 'dth_recharge':
        return '#8b5cf6';
      case 'electricity_bill':
        return '#eab308';
      case 'gas_bill':
        return '#f97316';
      case 'water_bill':
        return '#3b82f6';
      case 'wallet_topup':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getTransactionDescription = (transaction: Transaction) => {
    // If description exists, use it
    if (transaction.description && transaction.description.trim()) {
      return transaction.description;
    }

    // Generate from metadata for recharge transactions
    if ((transaction.type === 'recharge' || transaction.category === 'mobile_recharge') && transaction.metadata) {
      const metadata = transaction.metadata as any;
      const operator = metadata.operator || metadata.operatorName || metadata.operatorCode || '';
      const mobile = metadata.mobile_number || metadata.mobileNumber || '';
      const amount = transaction.amount;

      if (operator && mobile) {
        return `${operator} ₹${Number(amount).toFixed(0)} - ${mobile}`;
      } else if (operator) {
        return `${operator} Mobile Recharge`;
      } else if (mobile) {
        return `Mobile Recharge - ${mobile}`;
      }
    }

    // Fallback to category-based description
    const typeLabels: Record<string, string> = {
      mobile_recharge: 'Mobile Recharge',
      dth_recharge: 'DTH Recharge',
      electricity_bill: 'Electricity Bill',
      water_bill: 'Water Bill',
      gas_bill: 'Gas Bill',
      wallet_topup: 'Wallet Top-up',
      wallet_transfer: 'Wallet Transfer',
    };

    return typeLabels[transaction.category || ''] || typeLabels[transaction.type || ''] || 'Transaction';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

    const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    const day = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    return `${day} at ${time}`;
  };

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    triggerHaptic();
    switch (action) {
      case 'mobile':
        setCurrentScreen('recharge-entry');
        break;
      case 'dth':
        setCurrentScreen('dth-entry');
        break;
      case 'electricity':
        showComingSoonToast('Electricity bill payment coming soon!');
        break;
      case 'gas':
        showComingSoonToast('Gas bill payment coming soon!');
        break;
      case 'more':
        showComingSoonToast('More services coming soon!');
        break;
    }
  };

  const handleOfferAction = (offer: Offer) => {
    triggerHaptic();
    showComingSoonToast(`${offer.title} - This offer is coming soon!`);
  };

  // Render functions - Status bar removed

  const renderHeader = () => {
    // Get first name from user's full name
    const firstName = user?.name?.split(' ')[0] || 'User';

    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              setCurrentScreen('profile-management');
            }}
          >
            {user?.profileImage || user?.profileImageLocal ? (
              <Image
                source={{ uri: user?.profileImageLocal || user?.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileInitial}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{t('hello', { name: firstName })}</Text>
            <Text style={styles.appTitle}>WyaparPay</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="notifications" size={24} color="#6b7280" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/wyaparpay-logo-horizontal.jpeg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    );
  };

  // TODO: Uncomment when wallet functionality is ready
  /* const renderBalanceCard = () => (
    <Animated.View
      style={[
        styles.balanceCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <LinearGradient
        colors={['#F97316', '#DC2626']}
        style={styles.balanceGradient}
      >
        <View style={styles.balanceHeader}>
          <View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              ₹{isBalanceVisible ? balance.toFixed(2) : '••••••'}
            </Text>
            <Text style={styles.balanceUpdate}>Last updated: just now</Text>
          </View>
          <TouchableOpacity
            style={styles.hideButton}
            onPress={() => {
              triggerHaptic();
              setIsBalanceVisible(!isBalanceVisible);
            }}
          >
            <Text style={styles.hideButtonText}>👁️ Hide</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.balanceActions}>
          <TouchableOpacity
            style={styles.balanceActionButton}
            onPress={() => setShowAddMoneyModal(true)}
          >
            <Text style={styles.balanceActionText}>+ Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.balanceActionButton}>
            <Text style={styles.balanceActionText}>💸 Send Money</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  ); */

  // Services data - shared between quick actions and modal
  const allServices = [
    { id: 'mobile', icon: 'phone-android', label: t('mobile_recharge').replace(' ', '\n'), gradient: ['#10b981', '#059669'], iconColor: '#ffffff', comingSoon: false },
    { id: 'dth', icon: 'live-tv', label: t('dth_recharge').replace(' ', '\n'), gradient: ['#8b5cf6', '#7c3aed'], iconColor: '#ffffff', comingSoon: false },
    { id: 'electricity', icon: 'flash-on', label: t('electricity_bill').replace(' ', '\n'), gradient: ['#eab308', '#d97706'], iconColor: '#ffffff', comingSoon: true },
    { id: 'gas', icon: 'local-gas-station', label: t('gas_cylinder').replace(' ', '\n'), gradient: ['#f97316', '#ea580c'], iconColor: '#ffffff', comingSoon: true },
    { id: 'water', icon: 'water-drop', label: t('water_bill').replace(' ', '\n'), gradient: ['#3b82f6', '#2563eb'], iconColor: '#ffffff', comingSoon: true },
    { id: 'broadband', icon: 'wifi', label: t('broadband_bill').replace(' ', '\n'), gradient: ['#6366f1', '#4f46e5'], iconColor: '#ffffff', comingSoon: true },
    { id: 'creditcard', icon: 'credit-card', label: t('credit_card').replace(' ', '\n'), gradient: ['#ec4899', '#db2777'], iconColor: '#ffffff', comingSoon: true },
    { id: 'fastag', icon: 'local-shipping', label: t('fastag').replace(' ', '\n'), gradient: ['#14b8a6', '#0d9488'], iconColor: '#ffffff', comingSoon: true },
    { id: 'insurance', icon: 'security', label: t('insurance').replace(' ', '\n'), gradient: ['#f59e0b', '#d97706'], iconColor: '#ffffff', comingSoon: true },
    { id: 'loan', icon: 'account-balance', label: t('loan_repayment').replace(' ', '\n'), gradient: ['#06b6d4', '#0891b2'], iconColor: '#ffffff', comingSoon: true },
  ];

  const renderQuickActions = () => {
    return (
      <View style={styles.quickActionsContainer}>
        <View style={styles.servicesHeader}>
          <Text style={styles.sectionTitleNoMargin}>{t('services')}</Text>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              setShowAllServicesModal(true);
            }}
            style={styles.viewMoreButton}
          >
            <Text style={styles.viewMoreText}>{t('view_more')}</Text>
            <MaterialIcons name="chevron-right" size={18} color="#2563eb" />
          </TouchableOpacity>
        </View>
        <View style={styles.quickActionsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            {allServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.quickAction}
                onPress={() => handleQuickAction(service.id)}
                activeOpacity={service.comingSoon ? 0.7 : 0.8}
              >
                <View style={styles.quickActionIconWrapper}>
                  <LinearGradient
                    colors={(service.comingSoon ? ['#9ca3af', '#6b7280'] : service.gradient) as [string, string, ...string[]]}
                    style={styles.quickActionIcon}
                  >
                    <MaterialIcons name={service.icon as any} size={28} color={service.iconColor} />
                  </LinearGradient>
                  {service.comingSoon && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>SOON</Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.quickActionText,
                  service.comingSoon && styles.quickActionTextDisabled
                ]}>{service.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Scroll hint gradient on right edge */}
          <LinearGradient
            colors={['transparent', 'rgba(248, 250, 252, 0.9)', '#f8fafc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scrollHintGradient}
            pointerEvents="none"
          />
        </View>
        {/* Swipe hint text */}
        <View style={styles.swipeHintContainer}>
          <MaterialIcons name="swipe" size={14} color="#9ca3af" />
          <Text style={styles.swipeHintText}>{t('swipe_for_more')}</Text>
        </View>
      </View>
    );
  };

  const renderAllServicesModal = () => (
    <Modal
      visible={showAllServicesModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAllServicesModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowAllServicesModal(false)}
      >
        <TouchableOpacity
          style={styles.allServicesModalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHandle} />
          <View style={styles.allServicesHeader}>
            <Text style={styles.allServicesTitle}>{t('all_services')}</Text>
            <TouchableOpacity
              onPress={() => setShowAllServicesModal(false)}
              style={styles.closeModalButton}
            >
              <MaterialIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.allServicesGrid}
          >
            {allServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.allServicesItem}
                onPress={() => {
                  setShowAllServicesModal(false);
                  handleQuickAction(service.id);
                }}
                activeOpacity={service.comingSoon ? 0.7 : 0.8}
              >
                <View style={styles.allServicesIconWrapper}>
                  <LinearGradient
                    colors={(service.comingSoon ? ['#9ca3af', '#6b7280'] : service.gradient) as [string, string, ...string[]]}
                    style={styles.allServicesIcon}
                  >
                    <MaterialIcons name={service.icon as any} size={32} color={service.iconColor} />
                  </LinearGradient>
                  {service.comingSoon && (
                    <View style={styles.comingSoonBadgeLarge}>
                      <Text style={styles.comingSoonTextLarge}>Soon</Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.allServicesText,
                  service.comingSoon && styles.allServicesTextDisabled
                ]}>{service.label.replace('\n', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Scroll indicator hint */}
          <View style={styles.scrollIndicatorHint}>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#9ca3af" />
            <Text style={styles.scrollIndicatorText}>Scroll for more</Text>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderOffersCarousel = () => (
    <View style={styles.carouselContainer}>
      <View style={styles.carouselWrapper}>
        <Animated.View
          style={[
            styles.carouselContent,
            {
              transform: [
                {
                  translateX: carouselAnim.interpolate({
                    inputRange: [0, offers.length - 1],
                    outputRange: [0, -(width - 32) * (offers.length - 1)],
                  }),
                },
              ],
            },
          ]}
        >
          {offers.map((offer, index) => (
            <TouchableOpacity
              key={offer.id}
              style={styles.offerSlide}
              onPress={() => handleOfferAction(offer)}
            >
              <LinearGradient
                colors={offer.gradient as [string, string, ...string[]]}
                style={styles.offerGradient}
              >
                <View style={styles.offerContent}>
                  <View style={styles.offerLeft}>
                    <Text style={styles.offerTitle}>{offer.title}</Text>
                    <Text style={styles.offerDescription}>
                      {offer.description}
                    </Text>
                    <TouchableOpacity style={styles.offerButton}>
                      <Text style={styles.offerButtonText}>
                        {offer.buttonText}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.offerRight}>
                    <Text style={styles.offerAmount}>{offer.amount}</Text>
                    <Text style={styles.offerAmountLabel}>
                      {offer.amountLabel}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Carousel Indicators */}
        <View style={styles.carouselIndicators}>
          {offers.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.carouselDot,
                index === currentOfferIndex && styles.carouselDotActive,
              ]}
              onPress={() => goToOffer(index)}
            />
          ))}
        </View>
      </View>
    </View>
  );

  const renderRecentTransactions = () => (
    <View style={styles.transactionsContainer}>
      <View style={styles.transactionsHeader}>
        <Text style={styles.sectionTitle}>{t('recent_transactions')}</Text>
        <TouchableOpacity
          onPress={() => setCurrentScreen('transaction-history')}
        >
          <Text style={styles.viewAllText}>{t('view_all_transactions')}</Text>
        </TouchableOpacity>
      </View>

      {recentTransactions.length === 0 ? (
        <View style={styles.emptyTransactions}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="receipt" size={32} color="#d1d5db" />
          </View>
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptyDescription}>
            Your transaction history will appear here
          </Text>
        </View>
      ) : (
        <View style={styles.transactionsList}>
          {recentTransactions.slice(0, 3).map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View
                  style={[
                    styles.transactionIcon,
                    {
                      backgroundColor:
                        getTransactionColor(transaction.category) + '20',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={getTransactionIcon(transaction.category) as any}
                    size={24}
                    color={getTransactionColor(transaction.category)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.transactionDescription} numberOfLines={1}>
                    {getTransactionDescription(transaction)}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.createdAt)}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color:
                        transaction.type === 'credit' ? '#10b981' : '#ef4444',
                    },
                  ]}
                >
                  {transaction.type === 'credit' ? '+' : '-'}₹
                  {typeof transaction.amount === 'number'
                    ? transaction.amount.toFixed(2)
                    : transaction.amount}
                </Text>
                <Text style={styles.transactionStatus}>
                  {transaction.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderServices = () => (
    <View style={styles.servicesContainer}>
      <Text style={styles.sectionTitle}>Services</Text>
      <View style={styles.servicesGrid}>
        <View style={styles.serviceCard}>
          <View style={[styles.serviceIcon, { backgroundColor: '#ede9fe' }]}>
            <MaterialIcons name="payment" size={24} color="#7c3aed" />
          </View>
          <Text style={styles.serviceTitle}>Payment Gateway</Text>
          <Text style={styles.serviceDescription}>
            Accept payments from customers
          </Text>
          <TouchableOpacity style={styles.serviceButton}>
            <Text style={styles.serviceButtonText}>Manage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.serviceCard}>
          <View style={[styles.serviceIcon, { backgroundColor: '#dcfce7' }]}>
            <MaterialIcons name="group-add" size={24} color="#10b981" />
          </View>
          <Text style={styles.serviceTitle}>Refer & Earn</Text>
          <Text style={styles.serviceDescription}>Earn ₹100 per referral</Text>
          <TouchableOpacity style={styles.serviceButton}>
            <Text style={styles.serviceButtonText}>Share Link</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSupport = () => (
    <View style={styles.supportCard}>
      <View style={styles.supportLeft}>
        <View style={[styles.supportIcon, { backgroundColor: '#dbeafe' }]}>
          <MaterialIcons name="support-agent" size={24} color="#2563eb" />
        </View>
        <View>
          <Text style={styles.supportTitle}>24/7 Support</Text>
          <Text style={styles.supportDescription}>
            Need help? We're here for you
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.supportButton}
        onPress={() => {
          triggerHaptic();
          setCurrentScreen('contact-us');
        }}
      >
        <Text style={styles.supportButtonText}>Chat Now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBottomNavigation = () => (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <TouchableOpacity
        style={[styles.navItem, styles.navItemActive]}
        onPress={() => triggerHaptic()}
      >
        <MaterialIcons name="home" size={24} color="#667eea" />
        <Text style={[styles.navText, styles.navTextActive]}>{t('home')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          triggerHaptic();
          setCurrentScreen('transaction-history');
        }}
      >
        <MaterialIcons name="history" size={24} color="#6b7280" />
        <Text style={styles.navText}>{t('history')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          triggerHaptic();
          showComingSoonToast(t('coming_soon'));
        }}
      >
        <MaterialIcons name="qr-code-scanner" size={24} color="#6b7280" />
        <Text style={styles.navText}>{t('scan')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          triggerHaptic();
          showComingSoonToast(t('coming_soon'));
        }}
      >
        <MaterialIcons name="local-offer" size={24} color="#6b7280" />
        <Text style={styles.navText}>{t('offers')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          triggerHaptic();
          setCurrentScreen('profile-management');
        }}
      >
        <MaterialIcons name="account-circle" size={24} color="#6b7280" />
        <Text style={styles.navText}>{t('profile')}</Text>
      </TouchableOpacity>
    </View>
  );

  // TODO: Uncomment when wallet functionality is ready
  /* const renderAddMoneyModal = () => (
    <Modal
      visible={showAddMoneyModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddMoneyModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowAddMoneyModal(false)}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add Money</Text>

          <View style={styles.amountInputContainer}>
            <Text style={styles.amountLabel}>Amount</Text>
            <View style={styles.amountInputWrapper}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={addMoneyAmount}
                onChangeText={setAddMoneyAmount}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.quickAmountsContainer}>
            <Text style={styles.quickAmountsLabel}>Quick amounts</Text>
            <View style={styles.quickAmountsGrid}>
              {['500', '1000', '2000'].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => handleQuickAmount(amount)}
                >
                  <Text style={styles.quickAmountText}>₹{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddMoneyModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addMoneyButton}
              onPress={handleAddMoney}
            >
              <Text style={styles.addMoneyButtonText}>Add Money</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  ); */

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 + insets.bottom }, // 80px for nav + bottom safe area
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#667eea"
            colors={['#667eea']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* TODO: Uncomment when wallet functionality is ready */}
        {/* {renderBalanceCard()} */}
        {renderQuickActions()}
        {renderOffersCarousel()}
        {renderRecentTransactions()}
        {renderServices()}
        {renderSupport()}

        {/* Bottom padding for navigation */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderBottomNavigation()}
      {/* TODO: Uncomment when wallet functionality is ready */}
      {/* {renderAddMoneyModal()} */}
      {renderAllServicesModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Status Bar
  statusBar: {
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  statusBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBarTime: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batteryContainer: {
    width: 24,
    height: 12,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 2,
    padding: 1,
  },
  battery: {
    width: 16,
    height: 8,
    backgroundColor: 'white',
    borderRadius: 1,
  },

  // Header
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 48 : 50,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#F97316',
  },
  profileImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  greetingContainer: {
    marginLeft: 4,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  appTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    // paddingBottom is set dynamically with safe area insets
  },

  // Balance Card
  balanceCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.md,
  },
  balanceGradient: {
    padding: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  balanceLabel: {
    color: '#dbeafe',
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceUpdate: {
    color: '#dbeafe',
    fontSize: 12,
  },
  hideButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hideButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceActionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },

  // Quick Actions
  quickActionsContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitleNoMargin: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  quickActionsWrapper: {
    position: 'relative',
  },
  quickActionsScroll: {
    paddingHorizontal: 12,
    gap: 12,
    paddingRight: 40, // Extra padding for scroll hint
  },
  scrollHintGradient: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
  },
  swipeHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 4,
  },
  swipeHintText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  quickAction: {
    alignItems: 'center',
    width: 85,
  },
  quickActionIconWrapper: {
    position: 'relative',
    paddingTop: 8,
    paddingRight: 8,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  comingSoonText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...shadows.md,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 14,
  },
  quickActionTextDisabled: {
    color: '#9ca3af',
  },

  // Carousel
  carouselContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  carouselWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 150,
    ...shadows.md,
  },
  carouselContent: {
    flexDirection: 'row',
    height: '100%',
  },
  offerSlide: {
    width: width - 32,
    height: '100%',
  },
  offerGradient: {
    flex: 1,
    paddingVertical: 20,
    paddingLeft: 20,
    paddingRight: 16,
    justifyContent: 'center',
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offerLeft: {
    flex: 1,
    maxWidth: width - 180,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  offerDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 10,
    lineHeight: 16,
  },
  offerButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  offerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
  },
  offerRight: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    paddingHorizontal: 8,
  },
  offerAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    includeFontPadding: false,
    textAlign: 'center',
    marginBottom: 4,
  },
  offerAmountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    letterSpacing: 1,
  },
  carouselIndicators: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: [{ translateX: -40 }],
    flexDirection: 'row',
    gap: 8,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  carouselDotActive: {
    backgroundColor: 'white',
  },

  // Transactions
  transactionsContainer: {
    marginBottom: 24,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  emptyTransactions: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#f3f4f6',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    flexShrink: 1,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '400',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 11,
    color: '#10b981',
    textTransform: 'capitalize',
    fontWeight: '600',
  },

  // Services
  servicesContainer: {
    marginBottom: 24,
  },
  servicesGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    ...shadows.sm,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  serviceButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  serviceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },

  // Support
  supportCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  supportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  supportDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  supportButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  supportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    flexDirection: 'row',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navItemActive: {
    // Active state handled by text color
  },
  navText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  navTextActive: {
    color: '#667eea',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 48,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  amountInputContainer: {
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#6b7280',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
    color: '#111827',
  },
  quickAmountsContainer: {
    marginBottom: 24,
  },
  quickAmountsLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAmountButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  addMoneyButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addMoneyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // All Services Modal
  allServicesModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '75%',
  },
  allServicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  allServicesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeModalButton: {
    padding: 4,
  },
  allServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  allServicesItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 24,
  },
  allServicesIconWrapper: {
    position: 'relative',
    paddingTop: 8,
    paddingRight: 10,
    marginBottom: 8,
  },
  allServicesIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  allServicesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 16,
  },
  allServicesTextDisabled: {
    color: '#9ca3af',
  },
  comingSoonBadgeLarge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  comingSoonTextLarge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  scrollIndicatorHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 4,
  },
  scrollIndicatorText: {
    fontSize: 12,
    color: '#9ca3af',
  },

  // Bottom padding
  bottomPadding: {
    height: 20,
  },
});

export default ModernDashboardScreen;
