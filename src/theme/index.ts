export const theme = {
  colors: {
    primary: '#7c3aed', // Vibrant Purple
    primaryDark: '#6d28d9',
    primaryLight: '#f5f3ff',
    secondary: '#1e293b', // Deep Slate
    background: '#f8fafc', // Light gray-blue
    surface: '#ffffff',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6',
    text: '#1e293b',
    textMuted: '#64748b',
    textLight: '#94a3b8',
    border: '#e2e8f0',
    white: '#ffffff',
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
      shadowColor: '#7c3aed',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
    card: {
      shadowColor: '#1e293b',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    }
  },
};
