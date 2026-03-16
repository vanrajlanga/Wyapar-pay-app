/**
 * Account Details Screen Component
 * Modern fintech-themed user profile and account settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NavigationProps, Screen } from '../../types/navigation';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  colors,
  textStyles,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';

interface AccountDetailsScreenProps extends NavigationProps {
  handleBackWithHaptic: (screen: Screen) => void;
  triggerHaptic: () => void;
}

export const AccountDetailsScreen: React.FC<AccountDetailsScreenProps> = ({
  setCurrentScreen,
  handleBackWithHaptic,
  triggerHaptic,
}) => {
  const { t } = useTranslation('profile');
  const { t: tc } = useTranslation('common');
  const { showInfo, showSuccess } = useToast();
  const insets = useSafeAreaInsets();

  // Get user data from context
  const { profile } = useUser();
  const { user, logout } = useAuth();

  // Use profile if available, fallback to auth user data
  const userData = profile ||
    user || {
      id: '',
      name: '',
      phone: '',
      email: '',
      isEmailVerified: false,
      age: '',
      gender: '',
      maritalStatus: '',
      occupation: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    };

  // Dropdown expanded state
  const [isPersonalExpanded, setIsPersonalExpanded] = useState(false);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);

  // State for editing additional information
  const [isEditingAdditionalInfo, setIsEditingAdditionalInfo] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState({
    age: (userData as any)?.age || '',
    gender: (userData as any)?.gender || '',
    maritalStatus: (userData as any)?.maritalStatus || '',
    occupation: (userData as any)?.occupation || '',
  });
  const [addressInfo, setAddressInfo] = useState({
    address: (userData as any)?.address || '',
    city: (userData as any)?.city || '',
    state: (userData as any)?.state || '',
    pincode: (userData as any)?.pincode || '',
  });

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentScreen('landing');
    } catch (error) {
      // Error already handled by AuthContext
    }
  };

  return (
    <View style={styles.container}>
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => handleBackWithHaptic('profile-management')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={colors.neutral.white}
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('account_details')}</Text>
          <Text style={styles.headerSubtitle}>{t('manage_your_profile')}</Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => handleBackWithHaptic('profile-management')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="close" size={20} color={colors.neutral.white} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.content}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.profileGradient}
            >
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatar}>
                  <MaterialIcons
                    name="account-circle"
                    size={60}
                    color={colors.neutral.white}
                  />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {userData.name || 'User'}
                  </Text>
                  <Text style={styles.profileEmail}>
                    {userData.email || 'user@example.com'}
                  </Text>
                  <View style={styles.verificationBadge}>
                    <MaterialIcons
                      name={userData.isEmailVerified ? 'verified' : 'pending'}
                      size={16}
                      color={colors.neutral.white}
                    />
                    <Text style={styles.verificationText}>
                      {userData.isEmailVerified
                        ? t('email_verified')
                        : t('email_not_verified')}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsCard}>
            <Text style={styles.sectionTitle}>{t('quick_actions')}</Text>

            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => {
                  triggerHaptic();
                  setCurrentScreen('preferences');
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: '#dbeafe' },
                  ]}
                >
                  <MaterialIcons name="settings" size={24} color="#2563eb" />
                </View>
                <Text style={styles.quickActionText}>{t('preferences')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => {
                  triggerHaptic();
                  setCurrentScreen('security');
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: '#fef3c7' },
                  ]}
                >
                  <MaterialIcons name="security" size={24} color="#d97706" />
                </View>
                <Text style={styles.quickActionText}>{t('security')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => {
                  triggerHaptic();
                  showInfo(t('coming_soon'), t('feature_coming_soon'));
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: '#d1fae5' },
                  ]}
                >
                  <MaterialIcons name="info" size={24} color="#059669" />
                </View>
                <Text style={styles.quickActionText}>{t('about')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => {
                  triggerHaptic();
                  showInfo(t('coming_soon'), t('feature_coming_soon'));
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: '#f3e8ff' },
                  ]}
                >
                  <MaterialIcons name="help" size={24} color="#7c3aed" />
                </View>
                <Text style={styles.quickActionText}>{tc('help')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Personal Information — collapsible */}
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => {
                triggerHaptic();
                setIsPersonalExpanded(!isPersonalExpanded);
                if (isEditingAdditionalInfo) setIsEditingAdditionalInfo(false);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownHeaderLeft}>
                <View style={styles.dropdownIconBox}>
                  <MaterialIcons name="person" size={18} color="#667eea" />
                </View>
                <Text style={styles.dropdownTitle}>{t('personal_info')}</Text>
              </View>
              <View style={styles.dropdownHeaderRight}>
                {isPersonalExpanded && !isEditingAdditionalInfo && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      triggerHaptic();
                      setIsEditingAdditionalInfo(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="edit" size={18} color="#667eea" />
                  </TouchableOpacity>
                )}
                <MaterialIcons
                  name={isPersonalExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={24}
                  color="#94a3b8"
                />
              </View>
            </TouchableOpacity>

            {isPersonalExpanded && (
              <View style={styles.dropdownContent}>
                <View style={styles.infoGrid}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>{t('age')}</Text>
                      {isEditingAdditionalInfo ? (
                        <TextInput
                          style={styles.infoInput}
                          value={additionalInfo.age}
                          onChangeText={(text) =>
                            setAdditionalInfo({ ...additionalInfo, age: text })
                          }
                          placeholder={t('enter_age')}
                          keyboardType="numeric"
                        />
                      ) : (
                        <Text style={styles.infoValue}>
                          {additionalInfo.age || t('not_provided')}
                        </Text>
                      )}
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>{t('gender')}</Text>
                      {isEditingAdditionalInfo ? (
                        <TextInput
                          style={styles.infoInput}
                          value={additionalInfo.gender}
                          onChangeText={(text) =>
                            setAdditionalInfo({ ...additionalInfo, gender: text })
                          }
                          placeholder={t('enter_gender')}
                        />
                      ) : (
                        <Text style={styles.infoValue}>
                          {additionalInfo.gender || t('not_provided')}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>{t('marital_status')}</Text>
                      {isEditingAdditionalInfo ? (
                        <TextInput
                          style={styles.infoInput}
                          value={additionalInfo.maritalStatus}
                          onChangeText={(text) =>
                            setAdditionalInfo({ ...additionalInfo, maritalStatus: text })
                          }
                          placeholder={t('enter_marital_status')}
                        />
                      ) : (
                        <Text style={styles.infoValue}>
                          {additionalInfo.maritalStatus || t('not_provided')}
                        </Text>
                      )}
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>{t('occupation')}</Text>
                      {isEditingAdditionalInfo ? (
                        <TextInput
                          style={styles.infoInput}
                          value={additionalInfo.occupation}
                          onChangeText={(text) =>
                            setAdditionalInfo({ ...additionalInfo, occupation: text })
                          }
                          placeholder={t('enter_occupation')}
                        />
                      ) : (
                        <Text style={styles.infoValue}>
                          {additionalInfo.occupation || t('not_provided')}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {isEditingAdditionalInfo && (
                  <View style={styles.saveButtonContainer}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => { triggerHaptic(); setIsEditingAdditionalInfo(false); }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelButtonText}>{tc('cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={() => {
                        triggerHaptic();
                        setIsEditingAdditionalInfo(false);
                        showSuccess(tc('success'), t('profile_updated_successfully'));
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.saveButtonText}>{tc('save')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Address Information — collapsible */}
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => {
                triggerHaptic();
                setIsAddressExpanded(!isAddressExpanded);
                if (isEditingAddress) setIsEditingAddress(false);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownHeaderLeft}>
                <View style={styles.dropdownIconBox}>
                  <MaterialIcons name="location-on" size={18} color="#667eea" />
                </View>
                <Text style={styles.dropdownTitle}>{t('address_information')}</Text>
              </View>
              <View style={styles.dropdownHeaderRight}>
                {isAddressExpanded && !isEditingAddress && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      triggerHaptic();
                      setIsEditingAddress(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="edit" size={18} color="#667eea" />
                  </TouchableOpacity>
                )}
                <MaterialIcons
                  name={isAddressExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={24}
                  color="#94a3b8"
                />
              </View>
            </TouchableOpacity>

            {isAddressExpanded && (
              <View style={styles.dropdownContent}>
                <View style={styles.addressContainer}>
                  <View style={styles.addressItem}>
                    <Text style={styles.infoLabel}>{t('address')}</Text>
                    {isEditingAddress ? (
                      <TextInput
                        style={[styles.infoInput, styles.addressInput]}
                        value={addressInfo.address}
                        onChangeText={(text) =>
                          setAddressInfo({ ...addressInfo, address: text })
                        }
                        placeholder={t('enter_full_address')}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    ) : (
                      <Text style={styles.infoValue}>
                        {addressInfo.address || t('not_provided')}
                      </Text>
                    )}
                  </View>

                  <View style={styles.addressRow}>
                    <View style={[styles.infoItem, styles.addressItemHalf]}>
                      <Text style={styles.infoLabel}>{t('city')}</Text>
                      {isEditingAddress ? (
                        <TextInput
                          style={styles.infoInput}
                          value={addressInfo.city}
                          onChangeText={(text) =>
                            setAddressInfo({ ...addressInfo, city: text })
                          }
                          placeholder={t('enter_city')}
                        />
                      ) : (
                        <Text style={styles.infoValue}>
                          {addressInfo.city || t('not_provided')}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.infoItem, styles.addressItemHalf]}>
                      <Text style={styles.infoLabel}>{t('state')}</Text>
                      {isEditingAddress ? (
                        <TextInput
                          style={styles.infoInput}
                          value={addressInfo.state}
                          onChangeText={(text) =>
                            setAddressInfo({ ...addressInfo, state: text })
                          }
                          placeholder={t('enter_state')}
                        />
                      ) : (
                        <Text style={styles.infoValue}>
                          {addressInfo.state || t('not_provided')}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>{t('pincode')}</Text>
                    {isEditingAddress ? (
                      <TextInput
                        style={styles.infoInput}
                        value={addressInfo.pincode}
                        onChangeText={(text) =>
                          setAddressInfo({ ...addressInfo, pincode: text })
                        }
                        placeholder={t('enter_pincode')}
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    ) : (
                      <Text style={styles.infoValue}>
                        {addressInfo.pincode || t('not_provided')}
                      </Text>
                    )}
                  </View>
                </View>

                {isEditingAddress && (
                  <View style={styles.saveButtonContainer}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => { triggerHaptic(); setIsEditingAddress(false); }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelButtonText}>{tc('cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={() => {
                        triggerHaptic();
                        setIsEditingAddress(false);
                        showSuccess(tc('success'), t('address_updated_successfully'));
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.saveButtonText}>{tc('save')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Logout Section */}
          <View style={styles.logoutCard}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                showSuccess(t('logged_out'), t('logged_out_message'));
                handleLogout();
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={styles.logoutGradient}
              >
                <MaterialIcons
                  name="logout"
                  size={20}
                  color={colors.neutral.white}
                />
                <Text style={styles.logoutText}>{t('logout')}</Text>
              </LinearGradient>
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
  closeButton: {
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
  profileCard: {
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
  profileGradient: {
    borderRadius: 20,
    padding: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral.white,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral.white,
    marginLeft: 4,
  },
  quickActionsCard: {
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    marginBottom: 12,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral.black,
    textAlign: 'center',
  },
  infoCard: {
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
  editButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
  },
  infoGrid: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  infoInput: {
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addressContainer: {
    gap: 16,
  },
  addressItem: {
    marginBottom: 0,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addressItemHalf: {
    flex: 1,
  },
  addressInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral.black,
  },
  dropdownContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  saveButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral.white,
    textAlign: 'center',
  },
  logoutCard: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButton: {
    borderRadius: 20,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral.white,
  },
  bottomSpacing: {
    height: 40,
  },
});
