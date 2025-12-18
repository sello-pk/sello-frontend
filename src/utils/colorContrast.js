/**
 * Color Contrast Utilities
 * Ensures WCAG AA compliance (minimum 4.5:1 for normal text, 3:1 for large text)
 * 
 * Common fixes:
 * - Gray text on white: Use text-gray-700 instead of text-gray-500
 * - Light text on light backgrounds: Use darker text colors
 * - Button text: Ensure sufficient contrast
 */

/**
 * WCAG AA compliant text colors for different backgrounds
 */
export const textColors = {
    // On white/light backgrounds
    onWhite: {
        primary: 'text-gray-900',      // High contrast
        secondary: 'text-gray-700',     // Good contrast (was gray-500)
        muted: 'text-gray-600',         // Acceptable contrast
        disabled: 'text-gray-400',      // For disabled states only
    },
    
    // On dark backgrounds
    onDark: {
        primary: 'text-white',
        secondary: 'text-gray-200',
        muted: 'text-gray-300',
        disabled: 'text-gray-500',
    },
    
    // On primary color backgrounds
    onPrimary: {
        primary: 'text-white',
        secondary: 'text-white',
        muted: 'text-white opacity-90',
    },
    
    // On gray backgrounds
    onGray: {
        primary: 'text-gray-900',
        secondary: 'text-gray-700',
        muted: 'text-gray-600',
    },
};

/**
 * WCAG AA compliant background colors
 */
export const backgroundColors = {
    // Light backgrounds
    light: {
        default: 'bg-white',
        subtle: 'bg-gray-50',
        muted: 'bg-gray-100',
    },
    
    // Dark backgrounds
    dark: {
        default: 'bg-gray-900',
        subtle: 'bg-gray-800',
        muted: 'bg-gray-700',
    },
    
    // Primary backgrounds
    primary: {
        default: 'bg-primary-500',
        light: 'bg-primary-100',
        dark: 'bg-primary-600',
    },
};

/**
 * Get appropriate text color for a given background
 * @param {string} backgroundType - Type of background (white, dark, primary, gray)
 * @param {string} textType - Type of text (primary, secondary, muted)
 * @returns {string} Tailwind class for text color
 */
export const getTextColor = (backgroundType = 'white', textType = 'primary') => {
    const colors = textColors[`on${backgroundType.charAt(0).toUpperCase() + backgroundType.slice(1)}`] || textColors.onWhite;
    return colors[textType] || colors.primary;
};

/**
 * Common contrast fixes for admin panel
 */
export const contrastFixes = {
    // Replace low contrast text
    replaceLowContrast: {
        'text-gray-500': 'text-gray-700',      // Better contrast on white
        'text-gray-400': 'text-gray-600',     // Better contrast on white
        'text-gray-300': 'text-gray-700',     // Much better contrast
    },
    
    // Button text colors
    buttonText: {
        primary: 'text-white',
        secondary: 'text-gray-900',
        danger: 'text-white',
        success: 'text-white',
    },
    
    // Link colors
    link: {
        default: 'text-primary-500 hover:text-primary-500',
        muted: 'text-primary-500 hover:text-primary-500',
    },
};

