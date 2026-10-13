import { palette } from '@city-market/mobile-ui';

// Values come from the shared CityMarket design tokens.
export const theme = {
  colors: {
    primary: palette.primary,
    primaryDark: palette.primaryPressed,
    primaryLight: palette.primarySoft,
    secondary: palette.text,
    background: palette.background,
    surface: palette.surface,
    error: palette.error,
    success: palette.success,
    warning: palette.warning,
    info: palette.info,
    text: palette.text,
    textMuted: palette.textMuted,
    textLight: palette.textDisabled,
    border: palette.border,
    white: palette.white,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 26,
      xxl: 36,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      black: '900' as const,
    },
  },
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 3,
    },
    medium: {
      shadowColor: '#14231A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
    card: {
      shadowColor: '#14231A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    }
  },
};
