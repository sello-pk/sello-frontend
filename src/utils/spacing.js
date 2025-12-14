/**
 * Standardized Spacing Scale
 * Based on Tailwind's spacing scale for consistency across admin panel
 * 
 * Usage:
 * import { spacing } from '../utils/spacing';
 * className={`p-${spacing.md}`} // Not directly usable in Tailwind
 * 
 * Instead, use Tailwind classes directly with these values as reference:
 * - xs: 0.5rem (8px) - p-2, m-2, gap-2
 * - sm: 0.75rem (12px) - p-3, m-3, gap-3
 * - md: 1rem (16px) - p-4, m-4, gap-4
 * - lg: 1.5rem (24px) - p-6, m-6, gap-6
 * - xl: 2rem (32px) - p-8, m-8, gap-8
 * - 2xl: 3rem (48px) - p-12, m-12, gap-12
 */

export const spacing = {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
};

/**
 * Standard spacing classes for common patterns
 */
export const spacingClasses = {
    // Container padding
    container: 'p-6',
    containerSm: 'p-4',
    containerLg: 'p-8',
    
    // Section spacing
    section: 'mb-6',
    sectionLg: 'mb-8',
    sectionXl: 'mb-12',
    
    // Card padding
    card: 'p-6',
    cardSm: 'p-4',
    cardLg: 'p-8',
    
    // Gap between items
    gap: 'gap-4',
    gapSm: 'gap-2',
    gapLg: 'gap-6',
    gapXl: 'gap-8',
    
    // Form spacing
    formField: 'mb-4',
    formFieldSm: 'mb-2',
    formFieldLg: 'mb-6',
    
    // Button spacing
    button: 'px-4 py-2',
    buttonSm: 'px-3 py-1.5',
    buttonLg: 'px-6 py-3',
};

/**
 * Helper function to get consistent spacing
 * @param {string} size - Size key (xs, sm, md, lg, xl, 2xl)
 * @returns {string} Spacing value
 */
export const getSpacing = (size = 'md') => {
    return spacing[size] || spacing.md;
};

