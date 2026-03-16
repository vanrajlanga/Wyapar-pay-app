#!/bin/bash

# This script documents the i18n integration pattern for remaining screens
# The assistant will apply these changes manually to each screen

echo "=== I18N Integration Pattern ==="
echo ""
echo "For each screen:"
echo "1. Add: import { useTranslation } from 'react-i18next';"
echo "2. Add hooks: const { t } = useTranslation('namespace');"
echo "              const { t: tc } = useTranslation('common');"
echo "3. Replace hardcoded strings with t('key') or tc('key')"
echo ""
echo "Remaining screens:"
echo "- OtpLoginScreen (auth namespace)"
echo "- OtpVerifyScreen (auth namespace)"
echo "- EmailVerifyScreen (auth namespace)"
echo "- AccountDetailsScreen (profile namespace)"
echo "- PreferencesScreen (profile namespace) + Language Selector"
echo "- SecurityScreen (profile namespace)"
echo "- Recharge screens (recharge namespace) x4"
echo ""
echo "All translations already exist in JSON files!"

