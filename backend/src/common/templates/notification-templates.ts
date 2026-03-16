/**
 * Notification Template System
 *
 * Centralized templates for SMS and Push notifications.
 * Supports multiple languages and parameterized content.
 * Used by both SMS service and Push Notification service.
 */

export enum NotificationType {
  // Transaction related
  TRANSACTION_SUCCESS = 'transaction_success',
  TRANSACTION_FAILED = 'transaction_failed',
  PAYMENT_RECEIVED = 'payment_received',
  RECHARGE_SUCCESS = 'recharge_success',
  RECHARGE_FAILED = 'recharge_failed',
  WALLET_TOPUP_SUCCESS = 'wallet_topup_success',

  // Account related
  ACCOUNT_VERIFIED = 'account_verified',
  ACCOUNT_SUSPENDED = 'account_suspended',
  PASSWORD_CHANGED = 'password_changed',
  LOGIN_ALERT = 'login_alert',
  LOGIN_SUCCESS = 'login_success',

  // KYC related
  KYC_APPROVED = 'kyc_approved',
  KYC_REJECTED = 'kyc_rejected',
  KYC_DOCUMENTS_NEEDED = 'kyc_documents_needed',

  // Promotional
  WELCOME_MESSAGE = 'welcome_message',
  CASHBACK_EARNED = 'cashback_earned',
  SPECIAL_OFFER = 'special_offer',
  REFERRAL_BONUS = 'referral_bonus',

  // Security
  SECURITY_ALERT = 'security_alert',
  OTP_SENT = 'otp_sent',
  EMAIL_VERIFIED = 'email_verified',

  // System
  MAINTENANCE_SCHEDULED = 'maintenance_scheduled',
  APP_UPDATE_AVAILABLE = 'app_update_available',
}

export interface NotificationTemplate {
  type: NotificationType;
  category: 'transaction' | 'account' | 'security' | 'kyc' | 'promotional' | 'system';
  priority: 'low' | 'normal' | 'high';
  templates: {
    push: {
      title: Record<string, string>;
      body: Record<string, string>;
      data?: Record<string, any>;
    };
    sms: {
      message: Record<string, string>;
    };
  };
}

export interface TemplateContext {
  userName?: string;
  amount?: number;
  currency?: string;
  transactionId?: string;
  orderId?: string;
  otp?: string;
  reason?: string;
  documents?: string[];
  offerName?: string;
  cashbackAmount?: number;
  referralCode?: string;
  loginLocation?: string;
  loginDevice?: string;
  maintenanceTime?: string;
  appVersion?: string;
  [key: string]: any;
}

/**
 * Centralized Notification Templates
 * Supports English, Hindi, and Kannada
 */
export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  // Transaction Templates
  [NotificationType.TRANSACTION_SUCCESS]: {
    type: NotificationType.TRANSACTION_SUCCESS,
    category: 'transaction',
    priority: 'normal',
    templates: {
      push: {
        title: {
          en: 'Payment Successful! 🎉',
          hi: 'भुगतान सफल! 🎉',
          kn: 'ಪಾವತಿ ಯಶಸ್ವಿ! 🎉',
        },
        body: {
          en: 'Your payment of {{currency}}{{amount}} has been processed successfully.',
          hi: 'आपका {{currency}}{{amount}} का भुगतान सफलतापूर्वक संसाधित किया गया है।',
          kn: 'ನಿಮ್ಮ {{currency}}{{amount}} ಪಾವತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಂಸ್ಕರಿಸಲಾಗಿದೆ.',
        },
        data: {
          screen: 'transaction-details',
          transactionId: '{{transactionId}}',
        },
      },
      sms: {
        message: {
          en: 'Payment of {{currency}}{{amount}} successful. Txn ID: {{transactionId}}. Thank you for using WyaparPay!',
          hi: '{{currency}}{{amount}} का भुगतान सफल। लेन-देन ID: {{transactionId}}। WyaparPay का उपयोग करने के लिए धन्यवाद!',
          kn: '{{currency}}{{amount}} ಪಾವತಿ ಯಶಸ್ವಿ. ಟ್ರಾನ್ಸ್ ಐಡಿ: {{transactionId}}. WyaparPay ಬಳಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು!',
        },
      },
    },
  },

  [NotificationType.RECHARGE_SUCCESS]: {
    type: NotificationType.RECHARGE_SUCCESS,
    category: 'transaction',
    priority: 'high',
    templates: {
      push: {
        title: {
          en: 'Recharge Successful! 📱',
          hi: 'रिचार्ज सफल! 📱',
          kn: 'ರೀಚಾರ್ಜ್ ಯಶಸ್ವಿ! 📱',
        },
        body: {
          en: 'Your recharge of ₹{{amount}} is successful. Transaction ID: {{transactionId}}.',
          hi: 'आपका रिचार्ज ₹{{amount}} सफल है। लेन-देन ID: {{transactionId}}।',
          kn: 'ನಿಮ್ಮ ರೀಚಾರ್ಜ್ ₹{{amount}} ಯಶಸ್ವಿ. ವಹಿವಾಟು ಐಡಿ: {{transactionId}}.',
        },
        data: {
          screen: 'transaction-history',
          transactionId: '{{transactionId}}',
        },
      },
      sms: {
        message: {
          en: 'Dear User, Your recharge of ₹{{amount}} is successful. Transaction ID: {{transactionId}}. Enjoy seamless payments with WyapaarPay!',
          hi: 'प्रिय उपयोगकर्ता, आपका रिचार्ज ₹{{amount}} सफल है। लेन-देन ID: {{transactionId}}. WyapaarPay के साथ निर्बाध भुगतान का आनंद लें!',
          kn: 'ಪ್ರಿಯ ಬಳಕೆದಾರರೇ, ನಿಮ್ಮ ರೀಚಾರ್ಜ್ ₹{{amount}} ಯಶಸ್ವಿ. ವಹಿವಾಟು ಐಡಿ: {{transactionId}}. WyapaarPay ನೊಂದಿಗೆ ನಿರ್ವಿಘ್ನ ಪಾವತಿಗಳನ್ನು ಆನಂದಿಸಿ!',
        },
      },
    },
  },

  // Wallet Top-up Success Template
  [NotificationType.WALLET_TOPUP_SUCCESS]: {
    type: NotificationType.WALLET_TOPUP_SUCCESS,
    category: 'transaction',
    priority: 'normal',
    templates: {
      push: {
        title: {
          en: 'Wallet Top-up Successful! 💰',
          hi: 'वॉलेट टॉप-अप सफल! 💰',
          kn: 'ವಾಲೆಟ್ ಟಾಪ್-ಅಪ್ ಯಶಸ್ವಿ! 💰',
        },
        body: {
          en: '₹{{amount}} has been successfully added to your WyaparPay wallet.',
          hi: '₹{{amount}} आपके WyaparPay वॉलेट में सफलतापूर्वक जोड़ दिया गया है।',
          kn: '₹{{amount}} ನಿಮ್ಮ WyaparPay ವಾಲೆಟ್ಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ.',
        },
        data: {
          screen: 'wallet',
          transactionId: '{{transactionId}}',
        },
      },
      sms: {
        message: {
          en: 'Dear User, ₹{{amount}} has been successfully added to your WyapaarPay wallet. Txn ID: {{transactionId}}. Thank you for using WyapaarPay.',
          hi: 'प्रिय उपयोगकर्ता, ₹{{amount}} आपके WyapaarPay वॉलेट में सफलतापूर्वक जोड़ दिया गया है। Txn ID: {{transactionId}}। WyapaarPay का उपयोग करने के लिए धन्यवाद।',
          kn: 'ಪ್ರಿಯ ಬಳಕೆದಾರರೇ, ₹{{amount}} ನಿಮ್ಮ WyapaarPay ವಾಲೆಟ್ಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ. ಟ್ರಾನ್ಸ್ ಐಡಿ: {{transactionId}}. WyapaarPay ಬಳಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು.',
        },
      },
    },
  },

  [NotificationType.RECHARGE_FAILED]: {
    type: NotificationType.RECHARGE_FAILED,
    category: 'transaction',
    priority: 'high',
    templates: {
      push: {
        title: {
          en: 'Recharge Failed',
          hi: 'रिचार्ज विफल',
          kn: 'ರೀಚಾರ್ಜ್ ವಿಫಲ',
        },
        body: {
          en: 'Your recharge could not be processed. Amount has been refunded to your wallet.',
          hi: 'आपका रिचार्ज संसाधित नहीं किया जा सका। राशि आपके वॉलेट में वापस कर दी गई है।',
          kn: 'ನಿಮ್ಮ ರೀಚಾರ್ಜ್ ಸಂಸ್ಕರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮೊತ್ತವನ್ನು ನಿಮ್ಮ ವಾಲೆಟ್ಗೆ ಮರಳಿ ನೀಡಲಾಗಿದೆ.',
        },
        data: {
          screen: 'wallet',
        },
      },
      sms: {
        message: {
          en: 'Recharge failed. Amount ₹{{amount}} refunded to wallet. Txn ID: {{transactionId}}. Contact support if needed.',
          hi: 'रिचार्ज विफल। राशि ₹{{amount}} वॉलेट में वापस। लेन-देन ID: {{transactionId}}। आवश्यकता पड़ने पर सहायता से संपर्क करें।',
          kn: 'ರೀಚಾರ್ಜ್ ವಿಫಲ. ಮೊತ್ತ ₹{{amount}} ವಾಲೆಟ್ಗೆ ಮರಳಿ ನೀಡಲಾಗಿದೆ. ಟ್ರಾನ್ಸ್ ಐಡಿ: {{transactionId}}. ಅಗತ್ಯವಿದ್ದರೆ ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ.',
        },
      },
    },
  },

  // Account Templates
  [NotificationType.ACCOUNT_VERIFIED]: {
    type: NotificationType.ACCOUNT_VERIFIED,
    category: 'account',
    priority: 'high',
    templates: {
      push: {
        title: {
          en: 'Account Verified! ✅',
          hi: 'खाता सत्यापित! ✅',
          kn: 'ಖಾತೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ! ✅',
        },
        body: {
          en: 'Your WyaparPay account has been successfully verified. You can now make transactions.',
          hi: 'आपका WyaparPay खाता सफलतापूर्वक सत्यापित किया गया है। अब आप लेन-देन कर सकते हैं।',
          kn: 'ನಿಮ್ಮ WyaparPay ಖಾತೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಈಗ ನೀವು ವಹಿವಾಟುಗಳನ್ನು ಮಾಡಬಹುದು.',
        },
        data: {
          screen: 'dashboard',
        },
      },
      sms: {
        message: {
          en: 'Your WyaparPay account has been verified! You can now make payments and recharges. Welcome aboard!',
          hi: 'आपका WyaparPay खाता सत्यापित किया गया है! अब आप भुगतान और रिचार्ज कर सकते हैं। स्वागत है!',
          kn: 'ನಿಮ್ಮ WyaparPay ಖಾತೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ! ಈಗ ನೀವು ಪಾವತಿಗಳು ಮತ್ತು ರೀಚಾರ್ಜ್ ಮಾಡಬಹುದು. ಸ್ವಾಗತ!',
        },
      },
    },
  },

  // Security Templates
  [NotificationType.LOGIN_ALERT]: {
    type: NotificationType.LOGIN_ALERT,
    category: 'security',
    priority: 'high',
    templates: {
      push: {
        title: {
          en: 'New Login Detected',
          hi: 'नया लॉगिन पता चला',
          kn: 'ಹೊಸ ಲಾಗಿನ್ ಪತ್ತೆಯಾಗಿದೆ',
        },
        body: {
          en: 'New login from {{loginLocation}} using {{loginDevice}}. If this wasn\'t you, secure your account.',
          hi: '{{loginLocation}} से {{loginDevice}} का उपयोग करके नया लॉगिन। यदि यह आप नहीं थे, तो अपना खाता सुरक्षित करें।',
          kn: '{{loginLocation}} ನಿಂದ {{loginDevice}} ಬಳಸಿ ಹೊಸ ಲಾಗಿನ್. ಇದು ನೀವಲ್ಲದಿದ್ದರೆ, ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಸುರಕ್ಷಿತಗೊಳಿಸಿ.',
        },
        data: {
          screen: 'security',
        },
      },
      sms: {
        message: {
          en: 'ALERT: New login to your WyaparPay account from {{loginLocation}} ({{loginDevice}}). If this wasn\'t you, change password immediately.',
          hi: 'अलर्ट: आपके WyaparPay खाते में {{loginLocation}} ({{loginDevice}}) से नया लॉगिन। यदि यह आप नहीं थे, तो पासवर्ड तुरंत बदलें।',
          kn: 'ಎಚ್ಚರಿಕೆ: ನಿಮ್ಮ WyaparPay ಖಾತೆಗೆ {{loginLocation}} ({{loginDevice}}) ನಿಂದ ಹೊಸ ಲಾಗಿನ್. ಇದು ನೀವಲ್ಲದಿದ್ದರೆ, ಪಾಸ್ವರ್ಡ್ ತಕ್ಷಣ ಬದಲಾಯಿಸಿ.',
        },
      },
    },
  },

  // OTP Template
  [NotificationType.OTP_SENT]: {
    type: NotificationType.OTP_SENT,
    category: 'security',
    priority: 'high',
    templates: {
      push: {
        title: {
          en: 'OTP Sent',
          hi: 'ओटीपी भेजा गया',
          kn: 'OTP ಕಳುಹಿಸಲಾಗಿದೆ',
        },
        body: {
          en: 'Your verification code is {{otp}}. Valid for 10 minutes.',
          hi: 'आपका सत्यापन कोड {{otp}} है। 10 मिनट के लिए वैध।',
          kn: 'ನಿಮ್ಮ ಪರಿಶೀಲನಾ ಕೋಡ್ {{otp}}. 10 ನಿಮಿಷಗಳ ಕಾಲ ಮಾನ್ಯ.',
        },
      },
      sms: {
        message: {
          en: 'Dear User, Your OTP for WyapaarPay login is {{otp}}. Use this code to access your account. Do not share it with anyone.',
          hi: 'प्रिय उपयोगकर्ता, आपके WyapaarPay लॉगिन के लिए OTP {{otp}} है। अपने खाते में पहुंचने के लिए इस कोड का उपयोग करें। इसे किसी के साथ साझा न करें।',
          kn: 'ಪ್ರಿಯ ಬಳಕೆದಾರರೇ, ನಿಮ್ಮ WyapaarPay ಲಾಗಿನ್‌ಗಾಗಿ OTP {{otp}}. ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಪ್ರವೇಶಿಸಲು ಈ ಕೋಡ್ ಅನ್ನು ಬಳಸಿ. ಇದನ್ನು ಯಾರೊಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.',
        },
      },
    },
  },

  // Welcome Template (First Time User)
  [NotificationType.WELCOME_MESSAGE]: {
    type: NotificationType.WELCOME_MESSAGE,
    category: 'promotional',
    priority: 'normal',
    templates: {
      push: {
        title: {
          en: 'Welcome to WyaparPay! 🎉',
          hi: 'WyaparPay में आपका स्वागत है! 🎉',
          kn: 'WyaparPay ಗೆ ಸ್ವಾಗತ! 🎉',
        },
        body: {
          en: 'Your account has been created successfully. Start using services with ease.',
          hi: 'आपका खाता सफलतापूर्वक बनाया गया है। सेवाओं का उपयोग आसानी से शुरू करें।',
          kn: 'ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ. ಸೇವೆಗಳನ್ನು ಸುಲಭವಾಗಿ ಬಳಸಲು ಪ್ರಾರಂಭಿಸಿ.',
        },
        data: {
          screen: 'dashboard',
        },
      },
      sms: {
        message: {
          en: 'Dear User, Welcome to WyaparPay! Your account has been created successfully. Start using services with ease.',
          hi: 'प्रिय उपयोगकर्ता, WyaparPay में आपका स्वागत है! आपका खाता सफलतापूर्वक बनाया गया है। सेवाओं का उपयोग आसानी से शुरू करें।',
          kn: 'ಪ್ರಿಯ ಬಳಕೆದಾರರೇ, WyaparPay ಗೆ ಸ್ವಾಗತ! ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ. ಸೇವೆಗಳನ್ನು ಸುಲಭವಾಗಿ ಬಳಸಲು ಪ್ರಾರಂಭಿಸಿ.',
        },
      },
    },
  },

  // Login Success Template (Returning User)
  [NotificationType.LOGIN_SUCCESS]: {
    type: NotificationType.LOGIN_SUCCESS,
    category: 'account',
    priority: 'low',
    templates: {
      push: {
        title: {
          en: 'Login Successful!',
          hi: 'लॉगिन सफल!',
          kn: 'ಲಾಗಿನ್ ಯಶಸ್ವಿ!',
        },
        body: {
          en: 'Welcome back to WyaparPay! You have successfully logged in.',
          hi: 'WyaparPay में वापसी पर स्वागत है! आप सफलतापूर्वक लॉग इन हो गए हैं।',
          kn: 'WyaparPay ಗೆ ಮರಳಿ ಸ್ವಾಗತ! ನೀವು ಯಶಸ್ವಿಯಾಗಿ ಲಾಗ್ ಇನ್ ಆಗಿದ್ದೀರಿ.',
        },
        data: {
          screen: 'dashboard',
        },
      },
      sms: {
        message: {
          en: 'Dear User, Welcome back to WyaparPay! You have successfully logged in. Continue using services securely and effortlessly.',
          hi: 'प्रिय उपयोगकर्ता, WyaparPay में वापसी पर स्वागत है! आप सफलतापूर्वक लॉग इन हो गए हैं। सेवाओं का उपयोग सुरक्षित रूप से और आसानी से जारी रखें।',
          kn: 'ಪ್ರಿಯ ಬಳಕೆದಾರರೇ, WyaparPay ಗೆ ಮರಳಿ ಸ್ವಾಗತ! ನೀವು ಯಶಸ್ವಿಯಾಗಿ ಲಾಗ್ ಇನ್ ಆಗಿದ್ದೀರಿ. ಸೇವೆಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಮತ್ತು ಸುಲಭವಾಗಿ ಮುಂದುವರಿಸಿ.',
        },
      },
    },
  },

  // Cashback Template
  [NotificationType.CASHBACK_EARNED]: {
    type: NotificationType.CASHBACK_EARNED,
    category: 'promotional',
    priority: 'normal',
    templates: {
      push: {
        title: {
          en: 'Cashback Earned! 💰',
          hi: 'कैशबैक मिला! 💰',
          kn: 'ಕ್ಯಾಶ್‌ಬ್ಯಾಕ್ ಗಳಿಸಲಾಗಿದೆ! 💰',
        },
        body: {
          en: 'You\'ve earned ₹{{cashbackAmount}} cashback on your recent transaction!',
          hi: 'आपको अपने हालिया लेन-देन पर ₹{{cashbackAmount}} कैशबैक मिला है!',
          kn: 'ನಿಮ್ಮ ಇತ್ತೀಚಿನ ವಹಿವಾಟಿನಲ್ಲಿ ನೀವು ₹{{cashbackAmount}} ಕ್ಯಾಶ್‌ಬ್ಯಾಕ್ ಗಳಿಸಿದ್ದೀರಿ!',
        },
        data: {
          screen: 'wallet',
        },
      },
      sms: {
        message: {
          en: 'Congratulations! You\'ve earned ₹{{cashbackAmount}} cashback on your recent transaction. Amount added to wallet.',
          hi: 'बधाई हो! आपको अपने हालिया लेन-देन पर ₹{{cashbackAmount}} कैशबैक मिला है। राशि वॉलेट में जोड़ी गई है।',
          kn: 'ಅಭಿನಂದನೆಗಳು! ನಿಮ್ಮ ಇತ್ತೀಚಿನ ವಹಿವಾಟಿನಲ್ಲಿ ನೀವು ₹{{cashbackAmount}} ಕ್ಯಾಶ್‌ಬ್ಯಾಕ್ ಗಳಿಸಿದ್ದೀರಿ. ಮೊತ್ತವನ್ನು ವಾಲೆಟ್ಗೆ ಸೇರಿಸಲಾಗಿದೆ.',
        },
      },
    },
  },

  // Add more templates as needed...
  [NotificationType.TRANSACTION_FAILED]: {
    type: NotificationType.TRANSACTION_FAILED,
    category: 'transaction',
    priority: 'high',
    templates: {
      push: {
        title: {
          en: 'Transaction Failed',
          hi: 'लेन-देन विफल',
          kn: 'ವಹಿವಾಟು ವಿಫಲ',
        },
        body: {
          en: 'Your transaction could not be processed. Please try again or contact support.',
          hi: 'आपका लेन-देन संसाधित नहीं किया जा सका। कृपया पुनः प्रयास करें या सहायता से संपर्क करें।',
          kn: 'ನಿಮ್ಮ ವಹಿವಾಟನ್ನು ಸಂಸ್ಕರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ.',
        },
        data: {
          screen: 'support',
        },
      },
      sms: {
        message: {
          en: 'Transaction failed. Please try again or contact support. Txn ID: {{transactionId}}.',
          hi: 'लेन-देन विफल। कृपया पुनः प्रयास करें या सहायता से संपर्क करें। लेन-देन ID: {{transactionId}}।',
          kn: 'ವಹಿವಾಟು ವಿಫಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ. ಟ್ರಾನ್ಸ್ ಐಡಿ: {{transactionId}}.',
        },
      },
    },
  },

  // Placeholder templates for other types
  [NotificationType.PAYMENT_RECEIVED]: {
    type: NotificationType.PAYMENT_RECEIVED,
    category: 'transaction',
    priority: 'high',
    templates: {
      push: {
        title: { en: 'Payment Received', hi: 'भुगतान प्राप्त', kn: 'ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ' },
        body: { en: 'Payment received successfully', hi: 'भुगतान सफलतापूर्वक प्राप्त हुआ', kn: 'ಪಾವತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ' },
      },
      sms: {
        message: { en: 'Payment received', hi: 'भुगतान प्राप्त हुआ', kn: 'ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ' },
      },
    },
  },

  [NotificationType.ACCOUNT_SUSPENDED]: {
    type: NotificationType.ACCOUNT_SUSPENDED,
    category: 'account',
    priority: 'high',
    templates: {
      push: {
        title: { en: 'Account Suspended', hi: 'खाता निलंबित', kn: 'ಖಾತೆ ಅಮಾನತುಗೊಳಿಸಲಾಗಿದೆ' },
        body: { en: 'Your account has been suspended', hi: 'आपका खाता निलंबित किया गया है', kn: 'ನಿಮ್ಮ ಖಾತೆ ಅಮಾನತುಗೊಳಿಸಲಾಗಿದೆ' },
      },
      sms: {
        message: { en: 'Account suspended', hi: 'खाता निलंबित', kn: 'ಖಾತೆ ಅಮಾನತುಗೊಳಿಸಲಾಗಿದೆ' },
      },
    },
  },

  [NotificationType.PASSWORD_CHANGED]: {
    type: NotificationType.PASSWORD_CHANGED,
    category: 'security',
    priority: 'high',
    templates: {
      push: {
        title: { en: 'Password Changed', hi: 'पासवर्ड बदला गया', kn: 'ಪಾಸ್ವರ್ಡ್ ಬದಲಾಯಿಸಲಾಗಿದೆ' },
        body: { en: 'Your password has been changed', hi: 'आपका पासवर्ड बदल दिया गया है', kn: 'ನಿಮ್ಮ ಪಾಸ್ವರ್ಡ್ ಬದಲಾಯಿಸಲಾಗಿದೆ' },
      },
      sms: {
        message: { en: 'Password changed', hi: 'पासवर्ड बदला गया', kn: 'ಪಾಸ್ವರ್ಡ್ ಬದಲಾಯಿಸಲಾಗಿದೆ' },
      },
    },
  },

  [NotificationType.KYC_APPROVED]: {
    type: NotificationType.KYC_APPROVED,
    category: 'kyc',
    priority: 'high',
    templates: {
      push: {
        title: { en: 'KYC Approved', hi: 'KYC स्वीकृत', kn: 'KYC ಅನುಮೋದಿಸಲಾಗಿದೆ' },
        body: { en: 'Your KYC has been approved', hi: 'आपका KYC स्वीकृत किया गया है', kn: 'ನಿಮ್ಮ KYC ಅನುಮೋದಿಸಲಾಗಿದೆ' },
      },
      sms: {
        message: { en: 'KYC approved', hi: 'KYC स्वीकृत', kn: 'KYC ಅನುಮೋದಿಸಲಾಗಿದೆ' },
      },
    },
  },

  [NotificationType.KYC_REJECTED]: {
    type: NotificationType.KYC_REJECTED,
    category: 'kyc',
    priority: 'high',
    templates: {
      push: {
        title: { en: 'KYC Rejected', hi: 'KYC अस्वीकृत', kn: 'KYC ತಿರಸ್ಕರಿಸಲಾಗಿದೆ' },
        body: { en: 'Your KYC has been rejected', hi: 'आपका KYC अस्वीकृत किया गया है', kn: 'ನಿಮ್ಮ KYC ತಿರಸ್ಕರಿಸಲಾಗಿದೆ' },
      },
      sms: {
        message: { en: 'KYC rejected', hi: 'KYC अस्वीकृत', kn: 'KYC ತಿರಸ್ಕರಿಸಲಾಗಿದೆ' },
      },
    },
  },

  [NotificationType.KYC_DOCUMENTS_NEEDED]: {
    type: NotificationType.KYC_DOCUMENTS_NEEDED,
    category: 'kyc',
    priority: 'normal',
    templates: {
      push: {
        title: { en: 'Documents Needed', hi: 'दस्तावेज़ आवश्यक', kn: 'ದಾಖಲೆಗಳು ಅಗತ್ಯ' },
        body: { en: 'Please upload required documents', hi: 'कृपया आवश्यक दस्तावेज़ अपलोड करें', kn: 'ದಯವಿಟ್ಟು ಅಗತ್ಯ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' },
      },
      sms: {
        message: { en: 'Documents needed', hi: 'दस्तावेज़ आवश्यक', kn: 'ದಾಖಲೆಗಳು ಅಗತ್ಯ' },
      },
    },
  },

  [NotificationType.SPECIAL_OFFER]: {
    type: NotificationType.SPECIAL_OFFER,
    category: 'promotional',
    priority: 'low',
    templates: {
      push: {
        title: { en: 'Special Offer', hi: 'विशेष ऑफर', kn: 'ವಿಶೇಷ ಕೊಡುಗೆ' },
        body: { en: 'Check out our latest offer', hi: 'हमारे नवीनतम ऑफर देखें', kn: 'ನಮ್ಮ ಇತ್ತೀಚಿನ ಕೊಡುಗೆಯನ್ನು ಪರಿಶೀಲಿಸಿ' },
      },
      sms: {
        message: { en: 'Special offer available', hi: 'विशेष ऑफर उपलब्ध', kn: 'ವಿಶೇಷ ಕೊಡುಗೆ ಲಭ್ಯ' },
      },
    },
  },

  [NotificationType.REFERRAL_BONUS]: {
    type: NotificationType.REFERRAL_BONUS,
    category: 'promotional',
    priority: 'normal',
    templates: {
      push: {
        title: { en: 'Referral Bonus', hi: 'रेफरल बोनस', kn: 'ಉಲ್ಲೇಖ ಬೋನಸ್' },
        body: { en: 'You earned a referral bonus', hi: 'आपको रेफरल बोनस मिला', kn: 'ನೀವು ಉಲ್ಲೇಖ ಬೋನಸ್ ಗಳಿಸಿದ್ದೀರಿ' },
      },
      sms: {
        message: { en: 'Referral bonus earned', hi: 'रेफरल बोनस मिला', kn: 'ಉಲ್ಲೇಖ ಬೋನಸ್ ಗಳಿಸಲಾಗಿದೆ' },
      },
    },
  },

  [NotificationType.SECURITY_ALERT]: {
    type: NotificationType.SECURITY_ALERT,
    category: 'security',
    priority: 'high',
    templates: {
      push: {
        title: { en: 'Security Alert', hi: 'सुरक्षा अलर्ट', kn: 'ಸುರಕ್ಷತೆ ಎಚ್ಚರಿಕೆ' },
        body: { en: 'Security issue detected', hi: 'सुरक्षा समस्या का पता चला', kn: 'ಸುರಕ್ಷತೆ ಸಮಸ್ಯೆ ಪತ್ತೆಯಾಗಿದೆ' },
      },
      sms: {
        message: { en: 'Security alert', hi: 'सुरक्षा अलर्ट', kn: 'ಸುರಕ್ಷತೆ ಎಚ್ಚರಿಕೆ' },
      },
    },
  },

  [NotificationType.EMAIL_VERIFIED]: {
    type: NotificationType.EMAIL_VERIFIED,
    category: 'account',
    priority: 'normal',
    templates: {
      push: {
        title: { en: 'Email Verified', hi: 'ईमेल सत्यापित', kn: 'ಇಮೇಲ್ ಪರಿಶೀಲಿಸಲಾಗಿದೆ' },
        body: { en: 'Your email has been verified', hi: 'आपका ईमेल सत्यापित किया गया है', kn: 'ನಿಮ್ಮ ಇಮೇಲ್ ಪರಿಶೀಲಿಸಲಾಗಿದೆ' },
      },
      sms: {
        message: { en: 'Email verified', hi: 'ईमेल सत्यापित', kn: 'ಇಮೇಲ್ ಪರಿಶೀಲಿಸಲಾಗಿದೆ' },
      },
    },
  },

  [NotificationType.MAINTENANCE_SCHEDULED]: {
    type: NotificationType.MAINTENANCE_SCHEDULED,
    category: 'system',
    priority: 'normal',
    templates: {
      push: {
        title: { en: 'Maintenance Scheduled', hi: 'अनुरक्षण निर्धारित', kn: 'ನಿರ್ವಹಣೆ ನಿರ್ಧಾರಿಸಲಾಗಿದೆ' },
        body: { en: 'Scheduled maintenance at {{maintenanceTime}}', hi: '{{maintenanceTime}} पर निर्धारित अनुरक्षण', kn: '{{maintenanceTime}} ರಲ್ಲಿ ನಿರ್ಧಾರಿತ ನಿರ್ವಹಣೆ' },
      },
      sms: {
        message: { en: 'Maintenance scheduled', hi: 'अनुरक्षण निर्धारित', kn: 'ನಿರ್ವಹಣೆ ನಿರ್ಧಾರಿಸಲಾಗಿದೆ' },
      },
    },
  },

  [NotificationType.APP_UPDATE_AVAILABLE]: {
    type: NotificationType.APP_UPDATE_AVAILABLE,
    category: 'system',
    priority: 'low',
    templates: {
      push: {
        title: { en: 'Update Available', hi: 'अपडेट उपलब्ध', kn: 'ನವೀಕರಣ ಲಭ್ಯ' },
        body: { en: 'New version {{appVersion}} available', hi: 'नई संस्करण {{appVersion}} उपलब्ध', kn: 'ಹೊಸ ಆವೃತ್ತಿ {{appVersion}} ಲಭ್ಯ' },
      },
      sms: {
        message: { en: 'App update available', hi: 'ऐप अपडेट उपलब्ध', kn: 'ಆಪ್ ನವೀಕರಣ ಲಭ್ಯ' },
      },
    },
  },
};

/**
 * Template Manager Class
 * Handles template resolution and content generation
 */
export class NotificationTemplateManager {
  /**
   * Get template by type
   */
  static getTemplate(type: NotificationType): NotificationTemplate {
    const template = NOTIFICATION_TEMPLATES[type];
    if (!template) {
      throw new Error(`Template not found for type: ${type}`);
    }
    return template;
  }

  /**
   * Render template with context variables
   */
  static renderPushTitle(type: NotificationType, language: string = 'en', context: TemplateContext = {}): string {
    const template = this.getTemplate(type);
    const titleTemplate = template.templates.push.title[language] || template.templates.push.title.en;

    return this.interpolateString(titleTemplate, context);
  }

  /**
   * Render push notification body
   */
  static renderPushBody(type: NotificationType, language: string = 'en', context: TemplateContext = {}): string {
    const template = this.getTemplate(type);
    const bodyTemplate = template.templates.push.body[language] || template.templates.push.body.en;

    return this.interpolateString(bodyTemplate, context);
  }

  /**
   * Render SMS message
   */
  static renderSmsMessage(type: NotificationType, language: string = 'en', context: TemplateContext = {}): string {
    const template = this.getTemplate(type);
    const smsTemplate = template.templates.sms.message[language] || template.templates.sms.message.en;

    return this.interpolateString(smsTemplate, context);
  }

  /**
   * Get push notification data payload
   */
  static getPushData(type: NotificationType, context: TemplateContext = {}): Record<string, any> {
    const template = this.getTemplate(type);
    const data = template.templates.push.data || {};

    // Interpolate string values in data object
    const interpolatedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        interpolatedData[key] = this.interpolateString(value, context);
      } else {
        interpolatedData[key] = value;
      }
    }

    return interpolatedData;
  }

  /**
   * Interpolate template variables
   */
  private static interpolateString(template: string, context: TemplateContext): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = context[key];
      if (value === undefined || value === null) {
        return match; // Keep original if not found
      }
      return String(value);
    });
  }

  /**
   * Get all available languages
   */
  static getSupportedLanguages(): string[] {
    return ['en', 'hi', 'kn'];
  }

  /**
   * Get template categories
   */
  static getCategories(): string[] {
    return ['transaction', 'account', 'security', 'kyc', 'promotional', 'system'];
  }
}
