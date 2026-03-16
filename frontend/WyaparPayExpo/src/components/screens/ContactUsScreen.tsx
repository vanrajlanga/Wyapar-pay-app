import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NavigationProps } from '../../types/navigation';

interface ContactUsScreenProps extends NavigationProps {
  triggerHaptic?: () => void;
}

const CONTACT_METHODS = [
  {
    icon: 'phone' as const,
    title: 'Phone Support',
    subtitle: '24/7 Customer Support',
    value: '+91-7795445566',
    action: () => Linking.openURL('tel:+917795445566'),
    color: '#10b981',
    bg: '#d1fae5',
  },
  {
    icon: 'email' as const,
    title: 'Email Support',
    subtitle: 'We respond within 24 hours',
    value: 'support@wyaparpay.com',
    action: () => Linking.openURL('mailto:support@wyaparpay.com'),
    color: '#3b82f6',
    bg: '#dbeafe',
  },
  {
    icon: 'location-on' as const,
    title: 'Registered Office',
    subtitle: 'WyaparPay Private Limited',
    value: 'Bangalore, Karnataka, India',
    color: '#f97316',
    bg: '#fff7ed',
  },
];

const SUPPORT_HOURS = [
  { label: 'Phone Support', value: '24/7' },
  { label: 'Email Support', value: '24/7' },
  { label: 'Chat Support', value: '9 AM - 9 PM IST' },
  { label: 'Office Hours', value: 'Mon-Fri, 9 AM - 6 PM IST' },
];

export const ContactUsScreen: React.FC<ContactUsScreenProps> = ({
  setCurrentScreen,
  triggerHaptic,
}) => {
  const { t } = useTranslation('contact');
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ea580c" />

      {/* Header */}
      <LinearGradient colors={['#f97316', '#ea580c', '#dc2626']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => { triggerHaptic?.(); setCurrentScreen('dashboard'); }}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('title')}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="support-agent" size={40} color="#f97316" />
          </View>
          <Text style={styles.heroTitle}>{t('hero_title')}</Text>
          <Text style={styles.heroSubtitle}>{t('hero_subtitle')}</Text>
        </View>

        {/* Contact Methods */}
        {CONTACT_METHODS.map((method, index) => (
          <TouchableOpacity
            key={index}
            style={styles.contactCard}
            activeOpacity={method.action ? 0.7 : 1}
            onPress={() => { triggerHaptic?.(); method.action?.(); }}
          >
            <View style={[styles.contactIcon, { backgroundColor: method.bg }]}>
              <MaterialIcons name={method.icon} size={24} color={method.color} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{method.title}</Text>
              <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
              <Text style={[styles.contactValue, { color: method.color }]}>{method.value}</Text>
            </View>
            {method.action && (
              <MaterialIcons name="chevron-right" size={22} color="#d1d5db" />
            )}
          </TouchableOpacity>
        ))}

        {/* Support Hours */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="access-time" size={20} color="#f97316" />
            <Text style={styles.sectionTitle}>{t('support_hours')}</Text>
          </View>
          {SUPPORT_HOURS.map((item, index) => (
            <View key={index} style={[styles.hoursRow, index < SUPPORT_HOURS.length - 1 && styles.hoursRowBorder]}>
              <Text style={styles.hoursLabel}>{item.label}</Text>
              <Text style={styles.hoursValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Grievance Officer */}
        <View style={[styles.sectionCard, styles.grievanceCard]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="gavel" size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>{t('grievance_officer')}</Text>
          </View>
          {[
            { label: 'Email', value: 'grievance@wyaparpay.com' },
            { label: 'Phone', value: '+91-7795445566' },
            { label: 'Response Time', value: 'Within 30 days (RBI guidelines)' },
          ].map((item, index) => (
            <View key={index} style={styles.grievanceRow}>
              <Text style={styles.grievanceLabel}>{item.label}</Text>
              <Text style={styles.grievanceValue}>{item.value}</Text>
            </View>
          ))}
          <Text style={styles.grievanceNote}>
            {t('grievance_note')}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            activeOpacity={0.8}
            onPress={() => Linking.openURL('tel:+917795445566')}
          >
            <LinearGradient colors={['#f97316', '#dc2626']} style={styles.quickActionGradient}>
              <MaterialIcons name="call" size={20} color="#fff" />
              <Text style={styles.quickActionText}>{t('call_now')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            activeOpacity={0.8}
            onPress={() => Linking.openURL('mailto:support@wyaparpay.com')}
          >
            <View style={styles.quickActionOutline}>
              <MaterialIcons name="email" size={20} color="#f97316" />
              <Text style={styles.quickActionOutlineText}>{t('email_us')}</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Contact Cards
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  // Hours
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  hoursRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  hoursLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  // Grievance
  grievanceCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  grievanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  grievanceLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  grievanceValue: {
    fontSize: 13,
    color: '#1e3a5f',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  grievanceNote: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 12,
    lineHeight: 16,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  quickActionButton: {
    flex: 1,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  quickActionOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#f97316',
    gap: 8,
  },
  quickActionOutlineText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f97316',
  },
});
