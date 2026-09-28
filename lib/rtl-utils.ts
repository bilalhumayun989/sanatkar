/**
 * RTL Utilities for Sanatkar
 * Helper functions to handle RTL/LTR styling
 */

export const rtlClass = (isRtl: boolean, rtlClass: string, ltrClass: string = '') => {
  return isRtl ? rtlClass : ltrClass;
};

export const textAlign = (isRtl: boolean) => {
  return isRtl ? 'text-right' : 'text-left';
};

export const flexDirection = (isRtl: boolean) => {
  return isRtl ? 'flex-row-reverse' : 'flex-row';
};

export const marginStart = (value: string, isRtl: boolean) => {
  return isRtl ? `mr-${value}` : `ml-${value}`;
};

export const marginEnd = (value: string, isRtl: boolean) => {
  return isRtl ? `ml-${value}` : `mr-${value}`;
};

export const paddingStart = (value: string, isRtl: boolean) => {
  return isRtl ? `pr-${value}` : `pl-${value}`;
};

export const paddingEnd = (value: string, isRtl: boolean) => {
  return isRtl ? `pl-${value}` : `pr-${value}`;
};

export const borderRadius = (isRtl: boolean, side: 'left' | 'right') => {
  if (side === 'left') {
    return isRtl ? 'rounded-r' : 'rounded-l';
  }
  return isRtl ? 'rounded-l' : 'rounded-r';
};

// Format numbers for Urdu (Eastern Arabic numerals) or English
export const formatNumber = (num: number, isUrdu: boolean = false): string => {
  if (!isUrdu) return num.toLocaleString('en-US');
  
  const urduNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map(digit => (digit >= '0' && digit <= '9' ? urduNumerals[parseInt(digit)] : digit))
    .join('');
};

// Format price with currency
export const formatPrice = (price: number, isUrdu: boolean = false): string => {
  const formattedNum = isUrdu ? formatNumber(price, true) : price.toLocaleString('en-US');
  return isUrdu ? `روپے ${formattedNum}` : `Rs. ${formattedNum}`;
};
