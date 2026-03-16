/**
 * Service Icons Configuration
 *
 * Contains icons and configurations for various recharge and payment services
 * including Mobile, DTH, Broadband, Electricity, Gas, Water, etc.
 */

import {
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from '@expo/vector-icons';

export interface ServiceIconInfo {
  code: string;
  name: string;
  displayName: string;
  icon: any; // Can be require() for images or icon name string
  iconType: 'material' | 'material-community' | 'ionicons' | 'image';
  iconName?: string;
  color: string;
  gradient: string[];
  category: 'recharge' | 'bill' | 'payment' | 'transfer';
  description: string;
  active: boolean;
  sortOrder: number;
}

// Service icons (for custom SVG/PNG icons)
export const ServiceIcons = {
  MOBILE: require('../../assets/operators/mobile-recharge.svg'),
  DTH: require('../../assets/operators/dth-recharge.svg'),
  BROADBAND: require('../../assets/operators/broadband-recharge.svg'),
};

// Service configurations
export const SERVICES: Record<string, ServiceIconInfo> = {
  MOBILE_RECHARGE: {
    code: 'MOBILE_RECHARGE',
    name: 'Mobile Recharge',
    displayName: 'Mobile Recharge',
    icon: ServiceIcons.MOBILE,
    iconType: 'image',
    color: '#667eea',
    gradient: ['#667eea', '#764ba2'],
    category: 'recharge',
    description: 'Recharge prepaid mobile',
    active: true,
    sortOrder: 1,
  },
  DTH_RECHARGE: {
    code: 'DTH_RECHARGE',
    name: 'DTH Recharge',
    displayName: 'DTH Recharge',
    icon: ServiceIcons.DTH,
    iconType: 'image',
    color: '#f5576c',
    gradient: ['#f093fb', '#f5576c'],
    category: 'recharge',
    description: 'Recharge DTH connection',
    active: true,
    sortOrder: 2,
  },
  BROADBAND: {
    code: 'BROADBAND',
    name: 'Broadband',
    displayName: 'Broadband',
    icon: ServiceIcons.BROADBAND,
    iconType: 'image',
    color: '#4facfe',
    gradient: ['#4facfe', '#00f2fe'],
    category: 'bill',
    description: 'Pay broadband bills',
    active: true,
    sortOrder: 3,
  },
  ELECTRICITY: {
    code: 'ELECTRICITY',
    name: 'Electricity',
    displayName: 'Electricity Bill',
    icon: 'bolt',
    iconType: 'material',
    iconName: 'bolt',
    color: '#FFA500',
    gradient: ['#FFD700', '#FFA500'],
    category: 'bill',
    description: 'Pay electricity bills',
    active: true,
    sortOrder: 4,
  },
  WATER: {
    code: 'WATER',
    name: 'Water',
    displayName: 'Water Bill',
    icon: 'water-drop',
    iconType: 'material',
    iconName: 'water-drop',
    color: '#1E90FF',
    gradient: ['#4FC3F7', '#1E90FF'],
    category: 'bill',
    description: 'Pay water bills',
    active: true,
    sortOrder: 5,
  },
  GAS: {
    code: 'GAS',
    name: 'Gas',
    displayName: 'Gas Bill',
    icon: 'local-fire-department',
    iconType: 'material',
    iconName: 'local-fire-department',
    color: '#FF6347',
    gradient: ['#FF7F50', '#FF6347'],
    category: 'bill',
    description: 'Pay gas bills',
    active: true,
    sortOrder: 6,
  },
  CREDIT_CARD: {
    code: 'CREDIT_CARD',
    name: 'Credit Card',
    displayName: 'Credit Card Bill',
    icon: 'credit-card',
    iconType: 'material',
    iconName: 'credit-card',
    color: '#4CAF50',
    gradient: ['#66BB6A', '#4CAF50'],
    category: 'bill',
    description: 'Pay credit card bills',
    active: true,
    sortOrder: 7,
  },
  LOAN: {
    code: 'LOAN',
    name: 'Loan',
    displayName: 'Loan Repayment',
    icon: 'account-balance',
    iconType: 'material',
    iconName: 'account-balance',
    color: '#9C27B0',
    gradient: ['#AB47BC', '#9C27B0'],
    category: 'payment',
    description: 'Pay loan EMIs',
    active: true,
    sortOrder: 8,
  },
  INSURANCE: {
    code: 'INSURANCE',
    name: 'Insurance',
    displayName: 'Insurance Premium',
    icon: 'shield',
    iconType: 'material',
    iconName: 'shield',
    color: '#2196F3',
    gradient: ['#42A5F5', '#2196F3'],
    category: 'payment',
    description: 'Pay insurance premiums',
    active: true,
    sortOrder: 9,
  },
  FASTAG: {
    code: 'FASTAG',
    name: 'FASTag',
    displayName: 'FASTag Recharge',
    icon: 'directions-car',
    iconType: 'material',
    iconName: 'directions-car',
    color: '#FF9800',
    gradient: ['#FFA726', '#FF9800'],
    category: 'recharge',
    description: 'Recharge FASTag',
    active: true,
    sortOrder: 10,
  },
  METRO: {
    code: 'METRO',
    name: 'Metro',
    displayName: 'Metro Card',
    icon: 'train',
    iconType: 'material',
    iconName: 'train',
    color: '#795548',
    gradient: ['#8D6E63', '#795548'],
    category: 'recharge',
    description: 'Recharge metro card',
    active: true,
    sortOrder: 11,
  },
  MUNICIPAL_TAX: {
    code: 'MUNICIPAL_TAX',
    name: 'Municipal Tax',
    displayName: 'Municipal Tax',
    icon: 'location-city',
    iconType: 'material',
    iconName: 'location-city',
    color: '#607D8B',
    gradient: ['#78909C', '#607D8B'],
    category: 'bill',
    description: 'Pay municipal taxes',
    active: true,
    sortOrder: 12,
  },
};

// Get service by code
export const getServiceByCode = (code: string): ServiceIconInfo | undefined => {
  return SERVICES[code?.toUpperCase()];
};

// Get all active services
export const getActiveServices = (): ServiceIconInfo[] => {
  return Object.values(SERVICES)
    .filter((service) => service.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

// Get services by category
export const getServicesByCategory = (category: string): ServiceIconInfo[] => {
  return Object.values(SERVICES)
    .filter((service) => service.active && service.category === category)
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

// Get recharge services
export const getRechargeServices = (): ServiceIconInfo[] => {
  return getServicesByCategory('recharge');
};

// Get bill payment services
export const getBillPaymentServices = (): ServiceIconInfo[] => {
  return getServicesByCategory('bill');
};

// Get payment services
export const getPaymentServices = (): ServiceIconInfo[] => {
  return getServicesByCategory('payment');
};

// Service icon component helper
export const getServiceIconComponent = (service: ServiceIconInfo) => {
  if (service.iconType === 'image') {
    return {
      type: 'image',
      source: service.icon,
    };
  } else {
    const IconComponent =
      service.iconType === 'material'
        ? MaterialIcons
        : service.iconType === 'material-community'
          ? MaterialCommunityIcons
          : Ionicons;

    return {
      type: 'icon',
      Component: IconComponent,
      name: service.iconName || service.icon,
    };
  }
};
