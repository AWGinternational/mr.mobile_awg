/**
 * Mr. Mobile - Enterprise Design System
 * Consistent color scheme for all modules
 * Designed for Pakistani mobile shop chain management
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Main primary
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Success (Money, Confirmations, Stock Available)
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Main success
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Warning (Pending, Low Stock, Alerts)
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Main warning
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Danger (Errors, Out of Stock, Delete)
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Main danger
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Neutral (Text, Backgrounds, Borders)
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Module Accent Colors (Subtle differentiation)
  modules: {
    // Sales & POS - Primary Blue (Main business)
    pos: '#3B82F6',
    sales: '#3B82F6',
    
    // Financial - Emerald (Money related)
    dailyClosing: '#10B981',
    payments: '#10B981',
    banking: '#059669',
    
    // Supply Chain - Amber/Orange (Supply operations)
    suppliers: '#F59E0B',
    purchases: '#F97316',
    inventory: '#FB923C',
    
    // Products - Teal (Catalog)
    products: '#14B8A6',
    categories: '#0D9488',
    
    // Customers - Indigo (People)
    customers: '#6366F1',
    loans: '#8B5CF6',
    
    // Reports - Slate (Analytics)
    reports: '#64748B',
    analytics: '#475569',
  }
}

/**
 * Component-specific color mappings
 */
export const componentColors = {
  // Buttons
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50',
  },

  // Badges
  badge: {
    active: 'bg-green-100 text-green-800 border-green-300',
    inactive: 'bg-gray-100 text-gray-800 border-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    danger: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
  },

  // Cards
  card: {
    default: 'bg-white border-gray-200 hover:border-blue-300',
    selected: 'bg-blue-50 border-blue-500 ring-2 ring-blue-400',
    error: 'bg-red-50 border-red-300',
    success: 'bg-green-50 border-green-300',
  },

  // Text
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    muted: 'text-gray-400',
    success: 'text-green-600',
    warning: 'text-orange-600',
    danger: 'text-red-600',
  },

  // Backgrounds
  background: {
    primary: 'bg-gray-50',
    secondary: 'bg-white',
    accent: 'bg-blue-50',
    success: 'bg-green-50',
    warning: 'bg-orange-50',
    danger: 'bg-red-50',
  }
}

/**
 * Semantic color system for common use cases
 */
export const semanticColors = {
  // Stock status
  stock: {
    inStock: colors.success[500],      // Green
    lowStock: colors.warning[500],     // Orange
    outOfStock: colors.danger[500],    // Red
  },

  // Payment status
  payment: {
    paid: colors.success[500],         // Green
    pending: colors.warning[500],      // Orange
    failed: colors.danger[500],        // Red
    refunded: colors.neutral[500],     // Gray
  },

  // Order/Sale status
  order: {
    completed: colors.success[500],    // Green
    processing: colors.primary[500],   // Blue
    cancelled: colors.danger[500],     // Red
    pending: colors.warning[500],      // Orange
  },

  // User roles
  role: {
    superAdmin: colors.primary[700],   // Dark Blue
    shopOwner: colors.primary[500],    // Blue
    worker: colors.neutral[500],       // Gray
  }
}

/**
 * Module-specific color schemes
 */
export const moduleThemes = {
  pos: {
    primary: colors.primary[600],
    accent: colors.success[500],
    gradient: 'from-blue-600 to-blue-700',
  },
  
  inventory: {
    primary: colors.modules.inventory,
    accent: colors.warning[500],
    gradient: 'from-orange-500 to-orange-600',
  },
  
  financial: {
    primary: colors.success[600],
    accent: colors.success[400],
    gradient: 'from-green-600 to-green-700',
  },
  
  customers: {
    primary: colors.modules.customers,
    accent: colors.modules.loans,
    gradient: 'from-indigo-600 to-purple-600',
  }
}

/**
 * Typography system
 */
export const typography = {
  // Headings
  h1: 'text-3xl font-bold text-gray-900',
  h2: 'text-2xl font-bold text-gray-900',
  h3: 'text-xl font-bold text-gray-900',
  h4: 'text-lg font-semibold text-gray-900',
  h5: 'text-base font-semibold text-gray-900',
  
  // Body text
  body: 'text-sm text-gray-700',
  bodyLarge: 'text-base text-gray-700',
  bodySmall: 'text-xs text-gray-600',
  
  // Special
  price: 'text-2xl font-extrabold text-green-600',
  priceSmall: 'text-lg font-bold text-green-600',
  label: 'text-sm font-medium text-gray-700',
  caption: 'text-xs text-gray-500',
  code: 'font-mono text-sm bg-gray-100 px-2 py-1 rounded',
}

/**
 * Spacing system (Tailwind compatible)
 */
export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
}

/**
 * Border radius system
 */
export const radius = {
  none: '0',
  sm: '0.125rem',   // 2px
  default: '0.375rem', // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  full: '9999px',
}

/**
 * Shadow system
 */
export const shadows = {
  sm: 'shadow-sm',
  default: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
  none: 'shadow-none',
}

/**
 * Helper function to get module color
 */
export function getModuleColor(moduleName: string): string {
  return colors.modules[moduleName as keyof typeof colors.modules] || colors.primary[500]
}

/**
 * Helper function to get status color
 */
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    active: colors.success[500],
    pending: colors.warning[500],
    inactive: colors.neutral[500],
    cancelled: colors.danger[500],
    completed: colors.success[500],
  }
  
  return statusMap[status.toLowerCase()] || colors.neutral[500]
}
