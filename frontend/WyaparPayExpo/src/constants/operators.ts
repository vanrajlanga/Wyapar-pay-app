/**
 * Mobile Operator Configuration
 *
 * Contains operator details including logos, brand colors, and metadata
 * for all major Indian telecom operators
 */

export interface OperatorInfo {
  code: string;
  name: string;
  displayName: string;
  logo: any; // Require image
  brandColor: string;
  category: 'prepaid' | 'postpaid' | 'both';
  active: boolean;
  sortOrder: number;
  kwikApiOperatorId?: string; // KWIKAPI operator ID (opid) for recharge API
}

// Operator logos (High-quality PNG logos)
export const OperatorLogos = {
  AIRTEL: require('../../assets/operators/airtel-logo-icon.png'),
  JIO: require('../../assets/operators/jio-logo-icon.png'),
  VI: require('../../assets/operators/vi-mobile-icon.png'),
  BSNL: require('../../assets/operators/bsnl-logo-icon.png'),
  MTNL: require('../../assets/operators/mtnl.svg'),
  DEFAULT: require('../../assets/operators/default.svg'),
};

// Operator configurations with KWIKAPI operator IDs (verified from KWIKAPI API)
export const OPERATORS: Record<string, OperatorInfo> = {
  AIRTEL: {
    code: 'AIRTEL',
    name: 'Airtel',
    displayName: 'Airtel',
    logo: OperatorLogos.AIRTEL,
    brandColor: '#ED1C24',
    category: 'both',
    active: true,
    sortOrder: 1,
    kwikApiOperatorId: '1', // KWIKAPI operator ID
  },
  JIO: {
    code: 'JIO',
    name: 'Jio',
    displayName: 'Reliance Jio',
    logo: OperatorLogos.JIO,
    brandColor: '#0A1172',
    category: 'both',
    active: true,
    sortOrder: 2,
    kwikApiOperatorId: '8', // KWIKAPI operator ID - "Reliance Jio"
  },
  VI: {
    code: 'VI',
    name: 'Vi',
    displayName: 'Vi (Vodafone Idea)',
    logo: OperatorLogos.VI,
    brandColor: '#9B1D73',
    category: 'both',
    active: true,
    sortOrder: 3,
    kwikApiOperatorId: '3', // KWIKAPI operator ID - "VI"
  },
  BSNL: {
    code: 'BSNL',
    name: 'BSNL',
    displayName: 'BSNL',
    logo: OperatorLogos.BSNL,
    brandColor: '#FF9900',
    category: 'both',
    active: true,
    sortOrder: 4,
    kwikApiOperatorId: '4', // KWIKAPI operator ID - "Bsnl Topup"
  },
  MTNL: {
    code: 'MTNL',
    name: 'MTNL',
    displayName: 'MTNL',
    logo: OperatorLogos.MTNL,
    brandColor: '#00A651',
    category: 'both',
    active: true,
    sortOrder: 5,
    kwikApiOperatorId: '14', // KWIKAPI operator ID
  },
};

// Get operator by code
export const getOperatorByCode = (code: string): OperatorInfo => {
  const operator = OPERATORS[code?.toUpperCase()];
  return (
    operator || {
      code: code || 'UNKNOWN',
      name: code || 'Unknown',
      displayName: code || 'Unknown Operator',
      logo: OperatorLogos.DEFAULT,
      brandColor: '#6B7280',
      category: 'both',
      active: false,
      sortOrder: 999,
    }
  );
};

// Get all active operators
export const getActiveOperators = (): OperatorInfo[] => {
  return Object.values(OPERATORS)
    .filter((op) => op.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

// Detect operator from mobile number (basic heuristics)
export const detectOperatorFromNumber = (
  mobileNumber: string
): string | null => {
  if (!mobileNumber || mobileNumber.length < 10) {
    return null;
  }

  // Remove country code and formatting
  const number = mobileNumber.replace(/[^0-9]/g, '').slice(-10);

  // Series starting digits for major operators (Indian market)
  const operatorSeries: Record<string, string[]> = {
    JIO: [
      '88',
      '89',
      '70',
      '71',
      '72',
      '73',
      '74',
      '75',
      '76',
      '77',
      '78',
      '79',
    ],
    AIRTEL: [
      '99',
      '98',
      '97',
      '96',
      '95',
      '94',
      '93',
      '92',
      '91',
      '90',
      '87',
      '86',
      '85',
      '84',
      '83',
      '82',
      '81',
      '80',
    ],
    VI: ['99', '98', '97', '96', '95', '94', '93', '92', '91', '90'],
    BSNL: ['94', '95', '96', '97', '98', '99'],
    MTNL: ['98', '99'],
  };

  const firstTwo = number.substring(0, 2);

  for (const [operator, series] of Object.entries(operatorSeries)) {
    if (series.includes(firstTwo)) {
      return operator;
    }
  }

  return null;
};

// Normalize operator name/code to standard code
export const normalizeOperatorCode = (nameOrCode: string): string => {
  if (!nameOrCode) return 'UNKNOWN';

  const normalized = nameOrCode.toLowerCase().trim();

  // Map common operator names to codes
  if (normalized.includes('jio') || normalized.includes('reliance')) {
    return 'JIO';
  }
  if (normalized.includes('airtel')) {
    return 'AIRTEL';
  }
  if (normalized.includes('vi') || normalized.includes('vodafone') || normalized.includes('idea')) {
    return 'VI';
  }
  if (normalized.includes('bsnl')) {
    return 'BSNL';
  }
  if (normalized.includes('mtnl')) {
    return 'MTNL';
  }

  // If already a valid code, return uppercase
  return nameOrCode.toUpperCase();
};

// Get operator logo URI
export const getOperatorLogoUri = (code: string): any => {
  const normalizedCode = normalizeOperatorCode(code);
  const operator = getOperatorByCode(normalizedCode);
  return operator.logo;
};

// Get operator brand color
export const getOperatorColor = (code: string): string => {
  const normalizedCode = normalizeOperatorCode(code);
  const operator = getOperatorByCode(normalizedCode);
  return operator.brandColor;
};
