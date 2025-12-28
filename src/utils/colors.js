/**
 * Standardized Color Scheme
 * Ensures consistent color usage across the admin panel
 */

/**
 * Primary color palette - using orange/yellow as primary
 */
export const colors = {
    primary: {
        DEFAULT: '#FFA602', // primary-500
        50: '#FFF8E6',
        100: '#FFECB3',
        200: '#FFDF80',
        300: '#FFD24D',
        400: '#FFC51A',
        500: '#FFA602', // Main primary color
        600: '#CC8502',
        700: '#996402',
        800: '#664301',
        900: '#332201',
    },
    
    // Status colors
    success: {
        DEFAULT: '#10B981', // green-500
        light: '#D1FAE5',   // green-100
        dark: '#059669',     // green-600
    },
    
    danger: {
        DEFAULT: '#EF4444', // red-500
        light: '#FEE2E2',   // red-100
        dark: '#DC2626',    // red-600
    },
    
    warning: {
        DEFAULT: '#F59E0B', // yellow-500
        light: '#FEF3C7',   // yellow-100
        dark: '#D97706',    // yellow-600
    },
    
    // Info (secondary) uses a softer orange variant instead of blue
    info: {
        DEFAULT: '#FFB84D', // soft orange
        light: '#FFF3E0',
        dark: '#FF8C1A',
    },
    
    // Neutral colors
    gray: {
        DEFAULT: '#6B7280', // gray-500
        light: '#F3F4F6',   // gray-100
        dark: '#374151',    // gray-700
    },
};

/**
 * Get color class for a given color and variant
 * @param {string} colorName - Color name (primary, success, danger, etc.)
 * @param {string} variant - Variant (DEFAULT, light, dark, or number 50-900)
 * @returns {string} Tailwind class
 */
export const getColorClass = (colorName, variant = 'DEFAULT') => {
    const color = colors[colorName];
    if (!color) return '';
    
    if (variant === 'DEFAULT') {
        return `text-${colorName}-500 bg-${colorName}-500`;
    }
    
    if (['light', 'dark'].includes(variant)) {
        return `text-${colorName}-${variant === 'light' ? '100' : '600'} bg-${colorName}-${variant === 'light' ? '100' : '600'}`;
    }
    
    return `text-${colorName}-${variant} bg-${colorName}-${variant}`;
};

/**
 * Standard button color classes
 */
export const buttonColors = {
    primary: 'bg-primary-500 hover:opacity-90 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    info: 'bg-primary-100 hover:bg-primary-200 text-primary-700',
};

/**
 * Standard badge color classes
 */
export const badgeColors = {
    primary: 'bg-primary-100 text-primary-500',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-primary-50 text-primary-600',
    gray: 'bg-gray-100 text-gray-800',
};

