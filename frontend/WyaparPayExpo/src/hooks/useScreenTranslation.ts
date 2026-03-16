/**
 * Custom Hook for Screen-Level Translations
 *
 * Provides a unified interface for accessing translations across multiple namespaces.
 * This hook reduces boilerplate and ensures consistent translation patterns.
 *
 * @example
 * ```typescript
 * const { t, tc, te, language, changeLanguage } = useScreenTranslation('dashboard');
 *
 * // Use namespace translation
 * <Text>{t('wallet_balance')}</Text>
 *
 * // Use common translation
 * <Button title={tc('continue')} />
 *
 * // Use error translation
 * <Text>{te('network_error')}</Text>
 *
 * // Change language
 * changeLanguage('hi');
 * ```
 */

import { useTranslation } from 'react-i18next';

export type TranslationNamespace =
  | 'auth'
  | 'dashboard'
  | 'recharge'
  | 'profile'
  | 'common'
  | 'errors'
  | 'payment-success'
  | 'transactions'
  | 'contact';

export interface ScreenTranslation {
  /** Translation function for the specified namespace */
  t: (key: string, options?: any) => string;

  /** Translation function for common namespace */
  tc: (key: string, options?: any) => string;

  /** Translation function for errors namespace */
  te: (key: string, options?: any) => string;

  /** i18n instance for advanced usage */
  i18n: any;

  /** Current language code (en, hi, kn) */
  language: string;

  /** Function to change language */
  changeLanguage: (lang: string) => Promise<any>;

  /** Check if language is RTL (for future support) */
  isRTL: boolean;
}

/**
 * Hook for screen-level translations with multiple namespace support
 */
export const useScreenTranslation = (
  namespace: TranslationNamespace
): ScreenTranslation => {
  const { t, i18n } = useTranslation(namespace);
  const { t: tc } = useTranslation('common');
  const { t: te } = useTranslation('errors');

  return {
    t,
    tc,
    te,
    i18n,
    language: i18n.language,
    changeLanguage: i18n.changeLanguage.bind(i18n),
    isRTL: ['ar', 'ur', 'he'].includes(i18n.language), // For future RTL support
  };
};
