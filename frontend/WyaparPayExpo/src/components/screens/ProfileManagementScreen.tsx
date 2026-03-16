/**
 * Profile Management Screen - Modern Fintech Design
 * Clean, professional profile management with modern UX patterns
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useScreenTranslation } from '../../hooks/useScreenTranslation';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  colors,
  textStyles,
  spacing,
  borderRadius,
  shadows,
} from '../../theme';
import { Card, Button } from '../ui';
import { ProfileImageManager } from '../../services/profile-image-manager.service';
import { showComingSoonToast } from '../../utils/toast.utils';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../services/logger.service';

const { width } = Dimensions.get('window');

interface ProfileManagementScreenProps {
  setCurrentScreen: (screen: string) => void;
  currentScreen: string;
  triggerHaptic: () => void;
}

export const ProfileManagementScreen: React.FC<
  ProfileManagementScreenProps
> = ({ setCurrentScreen, currentScreen, triggerHaptic }) => {
  const { t, tc } = useScreenTranslation('profile');
  const { user, updateProfile } = useUser();
  const { showSuccess, showError } = useToast();

  // Safely get auth context
  let tokens = null;
  try {
    const authContext = useAuth();
    tokens = authContext?.tokens;
  } catch (error) {
    logger.warn('Auth context not available', { error });
  }
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.profileImage || null
  );
  const [profileImageLocal, setProfileImageLocal] = useState<string | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [isAdditionalInfoExpanded, setIsAdditionalInfoExpanded] = useState(false);
  const [personalDetails, setPersonalDetails] = useState({
    age: user?.age || '',
    gender: user?.gender || '',
    maritalStatus: user?.maritalStatus || '',
    occupation: user?.occupation || '',
    address: user?.address || '',
  });

  // Sync profile image on component mount
  useEffect(() => {
    const syncProfileImage = async () => {
      if (user?.profileImage && user?.id) {
        setIsLoadingImage(true);
        try {
          const result = await ProfileImageManager.syncProfileImage(
            user.id,
            user
          );
          if (result.success && result.localPath) {
            setProfileImageLocal(result.localPath);
          }
        } catch (error) {
          logger.error('Failed to sync profile image', error, {
            userId: user?.id,
          });
        } finally {
          setIsLoadingImage(false);
        }
      }
    };

    syncProfileImage();
  }, [user?.profileImage, user?.id]);

  const handleBackPress = () => {
    triggerHaptic();
    setCurrentScreen('dashboard');
  };

  const handleImagePicker = async () => {
    try {
      triggerHaptic();
      setShowImagePickerModal(true);
    } catch (error) {
      logger.error('Image picker error', error);
      showError(tc('error'), 'Failed to open image picker');
    }
  };

  const handleCloseImagePickerModal = () => {
    triggerHaptic();
    setShowImagePickerModal(false);
  };

  const pickImageFromCamera = async () => {
    try {
      setShowImagePickerModal(false);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showError(tc('error'), 'Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      logger.error('Camera error', error);
      showError(tc('error'), 'Failed to take photo');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      setShowImagePickerModal(false);
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError(
          tc('error'),
          'Permission to access camera roll is required!'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      logger.error('Gallery error', error);
      showError(tc('error'), 'Failed to select image');
    }
  };

  const handleImageUpload = async (imageUri: string) => {
    if (!user?.id) {
      showError(tc('error'), 'User not found');
      return;
    }

    setIsUploading(true);
    try {
      // Validate image first
      const validation = await ProfileImageManager.validateImage(imageUri);
      if (!validation.valid) {
        showError(tc('error'), validation.error || 'Invalid image');
        return;
      }

      // Get access token
      if (!tokens?.accessToken) {
        showError(tc('error'), 'Authentication required');
        return;
      }

      // Upload image to S3 and update profile
      const result = await ProfileImageManager.uploadProfileImage(
        user.id,
        imageUri,
        tokens.accessToken,
        'image/jpeg'
      );

      if (result.success) {
        setProfileImage(result.imageUrl || null);
        setProfileImageLocal(result.localPath || null);
        showSuccess(tc('success'), t('profile_updated_successfully'));
      } else {
        showError(
          tc('error'),
          result.error || t('failed_to_update_profile')
        );
      }
    } catch (error) {
      logger.error('Image upload error', error, { userId: user?.id });
      showError(tc('error'), t('failed_to_update_profile'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      triggerHaptic();

      // Update profile with new information
      const updatedProfile = {
        ...user,
        name: editedName,
        email: editedEmail,
        profileImage: profileImage ?? undefined,
        ...personalDetails,
      };

      await updateProfile(updatedProfile);
      setIsEditing(false);
      showSuccess(tc('success'), t('profile_updated_successfully'));
    } catch (error) {
      logger.error('Profile update error', error, { userId: user?.id });
      showError(tc('error'), t('failed_to_update_profile'));
    }
  };

  const handleCancelEdit = () => {
    triggerHaptic();
    setIsEditing(false);
    setEditedName(user?.name || '');
    setEditedEmail(user?.email || '');
    setPersonalDetails({
      age: user?.age || '',
      gender: user?.gender || '',
      maritalStatus: user?.maritalStatus || '',
      occupation: user?.occupation || '',
      address: user?.address || '',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={colors.neutral.white}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile_management')}</Text>
          <View style={styles.headerRight}>
            {isEditing ? (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleCancelEdit}
                activeOpacity={0.8}
              >
                <Text style={styles.headerActionText}>{tc('cancel')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => setIsEditing(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.headerActionText}>{tc('edit')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image Section */}
        <Card style={styles.profileImageCard}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImageWrapper}>
              {isLoadingImage ? (
                <View style={styles.profileImagePlaceholder}>
                  <ActivityIndicator
                    size="large"
                    color={colors.neutral.white}
                  />
                </View>
              ) : profileImageLocal ? (
                <Image
                  source={{ uri: profileImageLocal }}
                  style={styles.profileImage}
                />
              ) : profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImageInitials}>
                    {getInitials(user?.name || 'User')}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.cameraButton,
                  isUploading && styles.cameraButtonDisabled,
                ]}
                onPress={handleImagePicker}
                activeOpacity={0.8}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.neutral.white}
                  />
                ) : (
                  <MaterialIcons
                    name="camera-alt"
                    size={20}
                    color={colors.neutral.white}
                  />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.profileImageLabel}>{t('profile_picture')}</Text>
          </View>
        </Card>

        {/* Personal Details Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('personal_details')}</Text>
          </View>

          <View style={styles.detailsContainer}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('name')}</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder={t('enter_name')}
                />
              ) : (
                <Text style={styles.inputValue}>
                  {user?.name || t('not_provided')}
                </Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('email')}</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editedEmail}
                  onChangeText={setEditedEmail}
                  placeholder={t('enter_email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.inputValue}>
                  {user?.email || t('not_provided')}
                </Text>
              )}
            </View>

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('mobile_number') || 'Mobile Number'}</Text>
              <Text style={styles.inputValue}>
                {user?.phone || t('not_provided')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Additional Information Section */}
        <Card style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => {
              triggerHaptic();
              setIsAdditionalInfoExpanded(!isAdditionalInfoExpanded);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitleNoMargin}>{t('additional_information')}</Text>
            <MaterialIcons
              name={isAdditionalInfoExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={28}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {isAdditionalInfoExpanded && (
            <View style={styles.detailsContainer}>
              {/* Age */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('age')}</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.textInput}
                    value={personalDetails.age}
                    onChangeText={(text) =>
                      setPersonalDetails((prev) => ({ ...prev, age: text }))
                    }
                    placeholder={t('enter_age')}
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.inputValue}>
                    {personalDetails.age || t('not_provided')}
                  </Text>
                )}
              </View>

              {/* Gender */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('gender')}</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.textInput}
                    value={personalDetails.gender}
                    onChangeText={(text) =>
                      setPersonalDetails((prev) => ({ ...prev, gender: text }))
                    }
                    placeholder={t('enter_gender')}
                  />
                ) : (
                  <Text style={styles.inputValue}>
                    {personalDetails.gender || t('not_provided')}
                  </Text>
                )}
              </View>

              {/* Marital Status */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('marital_status')}</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.textInput}
                    value={personalDetails.maritalStatus}
                    onChangeText={(text) =>
                      setPersonalDetails((prev) => ({
                        ...prev,
                        maritalStatus: text,
                      }))
                    }
                    placeholder={t('enter_marital_status')}
                  />
                ) : (
                  <Text style={styles.inputValue}>
                    {personalDetails.maritalStatus || t('not_provided')}
                  </Text>
                )}
              </View>

              {/* Occupation */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('occupation')}</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.textInput}
                    value={personalDetails.occupation}
                    onChangeText={(text) =>
                      setPersonalDetails((prev) => ({
                        ...prev,
                        occupation: text,
                      }))
                    }
                    placeholder={t('enter_occupation')}
                  />
                ) : (
                  <Text style={styles.inputValue}>
                    {personalDetails.occupation || t('not_provided')}
                  </Text>
                )}
              </View>

              {/* Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('address')}</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={personalDetails.address}
                    onChangeText={(text) =>
                      setPersonalDetails((prev) => ({ ...prev, address: text }))
                    }
                    placeholder={t('enter_address')}
                    multiline
                    numberOfLines={3}
                  />
                ) : (
                  <Text style={styles.inputValue}>
                    {personalDetails.address || t('not_provided')}
                  </Text>
                )}
              </View>
            </View>
          )}
        </Card>

        {/* Settings Section */}
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>{tc('settings')}</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              triggerHaptic();
              setCurrentScreen('account-details');
            }}
          >
            <View style={styles.settingLeft}>
              <View
                style={[styles.settingIcon, { backgroundColor: '#dbeafe' }]}
              >
                <MaterialIcons name="person" size={24} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.settingTitle}>{t('account_details')}</Text>
                <Text style={styles.settingDescription}>
                  {t('manage_account_info')}
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              triggerHaptic();
              setCurrentScreen('security');
            }}
          >
            <View style={styles.settingLeft}>
              <View
                style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}
              >
                <MaterialIcons name="security" size={24} color="#d97706" />
              </View>
              <View>
                <Text style={styles.settingTitle}>{t('security')}</Text>
                <Text style={styles.settingDescription}>
                  {t('password_biometrics_security')}
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              triggerHaptic();
              setCurrentScreen('preferences');
            }}
          >
            <View style={styles.settingLeft}>
              <View
                style={[styles.settingIcon, { backgroundColor: '#d1fae5' }]}
              >
                <MaterialIcons name="settings" size={24} color="#059669" />
              </View>
              <View>
                <Text style={styles.settingTitle}>{t('preferences')}</Text>
                <Text style={styles.settingDescription}>
                  {t('language_notifications_display')}
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </Card>

        {/* Save Button */}
        {isEditing && (
          <View style={styles.saveButtonContainer}>
            <Button
              title={tc('save')}
              onPress={handleSaveProfile}
              variant="primary"
              style={styles.saveButton}
            />
          </View>
        )}
      </ScrollView>

      {/* Professional Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseImagePickerModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('select_profile_image')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleCloseImagePickerModal}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.text.primary}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>{t('choose_image_source')}</Text>

            <View style={styles.modalOptions}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={pickImageFromCamera}
                activeOpacity={0.7}
              >
                <View style={styles.modalOptionIcon}>
                  <MaterialIcons
                    name="camera-alt"
                    size={32}
                    color={colors.primary.main}
                  />
                </View>
                <Text style={styles.modalOptionText}>{t('take_photo')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={pickImageFromGallery}
                activeOpacity={0.7}
              >
                <View style={styles.modalOptionIcon}>
                  <MaterialIcons
                    name="photo-library"
                    size={32}
                    color={colors.primary.main}
                  />
                </View>
                <Text style={styles.modalOptionText}>
                  {t('choose_from_gallery')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={handleCloseImagePickerModal}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  header: {
    paddingTop: 50,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...textStyles.h4,
    color: colors.neutral.white,
    fontWeight: '600',
  },
  headerRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  headerActionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral.white,
    borderWidth: 2,
    borderColor: colors.neutral.white,
    shadowColor: colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  headerActionText: {
    ...textStyles.body,
    color: colors.primary.main,
    fontWeight: '700',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  profileImageCard: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageInitials: {
    ...textStyles.h2,
    color: colors.neutral.white,
    fontWeight: '600',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.neutral.white,
  },
  cameraButtonDisabled: {
    backgroundColor: colors.neutral.mediumGray,
    opacity: 0.7,
  },
  profileImageLabel: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  detailsContainer: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  inputValue: {
    ...textStyles.body,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  textInput: {
    ...textStyles.body,
    color: colors.text.primary,
    backgroundColor: colors.neutral.lightGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral.gray,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButtonContainer: {
    marginTop: spacing.lg,
  },
  saveButton: {
    width: '100%',
  },

  // Settings Section Styles
  settingsCard: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  sectionTitleNoMargin: {
    ...textStyles.h4,
    color: colors.text.primary,
    fontWeight: '600',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingTitle: {
    ...textStyles.h5,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral.lightGray,
  },
  modalSubtitle: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  modalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  modalOption: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary.bg,
    minWidth: 120,
  },
  modalOptionIcon: {
    marginBottom: spacing.sm,
  },
  modalOptionText: {
    ...textStyles.body,
    color: colors.primary.main,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalCancelButton: {
    backgroundColor: colors.neutral.lightGray,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    ...textStyles.body,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});
