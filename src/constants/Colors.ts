/**
 * Admin Dashboard color palette with reusable color codes
 * Includes brand colors and theme-specific variations
 */

// Brand Colors - EPickup Brand Palette
export const BrandColors = {
  yellow: 'rgba(237, 167, 34, 1)', // Primary yellow
  blue: 'rgba(5, 1, 91, 1)', // Primary blue
  primary: 'rgba(5, 1, 91, 1)', // Primary blue (same as blue)
  // Additional colors for components
  white: '#FFFFFF',
  black: '#000000',
  lightGray: '#F5F5F5',
  mediumGray: '#9E9E9E',
  darkGray: '#424242',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  lightBlue: '#E3F2FD',
  // Extended palette for admin dashboard
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  orange: '#f97316',
  indigo: '#6366f1',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  teal: '#14b8a6',
  lime: '#84cc16',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
  fuchsia: '#d946ef',
  slate: '#64748b',
  zinc: '#71717a',
  neutral: '#737373',
  stone: '#78716c',
  red: '#ef4444',
  green: '#22c55e',
};

// Theme Colors
const tintColorLight = BrandColors.blue;
const tintColorDark = BrandColors.yellow;

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  // Global color palette accessible regardless of theme
  brand: BrandColors,
};

// Admin Dashboard specific color schemes
export const AdminColors = {
  // Primary brand colors
  primary: BrandColors.blue,
  secondary: BrandColors.yellow,
  
  // Status colors
  success: BrandColors.success,
  warning: BrandColors.warning,
  error: BrandColors.error,
  info: BrandColors.info,
  
  // Metric card colors
  drivers: BrandColors.blue,
  verified: BrandColors.success,
  bookings: BrandColors.yellow,
  alerts: BrandColors.error,
  support: BrandColors.purple,
  health: BrandColors.cyan,
  revenue: BrandColors.emerald,
  analytics: BrandColors.amber,
  notifications: BrandColors.pink,
  customers: BrandColors.indigo,
  
  // Background colors
  background: {
    primary: '#f8fafc',
    secondary: '#e2e8f0',
    card: '#ffffff',
    paper: '#f8fafc',
  },
  
  // Text colors
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  
  // Border colors
  border: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.12)',
    dark: 'rgba(0, 0, 0, 0.23)',
  },
  
  // Shadow colors
  shadow: {
    light: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    heavy: '0 8px 25px rgba(0, 0, 0, 0.15)',
  },
};

export default AdminColors;
