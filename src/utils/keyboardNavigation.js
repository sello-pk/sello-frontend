/**
 * Keyboard Navigation Utilities
 * Improves keyboard accessibility and focus management
 */

/**
 * Handle keyboard navigation for lists
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Array} items - Array of items to navigate
 * @param {number} currentIndex - Current focused index
 * @param {Function} setIndex - Function to set new index
 * @param {Function} onSelect - Function to call when item is selected (Enter/Space)
 */
export const handleListNavigation = (event, items, currentIndex, setIndex, onSelect) => {
    const { key } = event;
    
    switch (key) {
        case 'ArrowDown':
            event.preventDefault();
            if (currentIndex < items.length - 1) {
                setIndex(currentIndex + 1);
            }
            break;
        case 'ArrowUp':
            event.preventDefault();
            if (currentIndex > 0) {
                setIndex(currentIndex - 1);
            }
            break;
        case 'Home':
            event.preventDefault();
            setIndex(0);
            break;
        case 'End':
            event.preventDefault();
            setIndex(items.length - 1);
            break;
        case 'Enter':
        case ' ':
            event.preventDefault();
            if (onSelect && currentIndex >= 0 && currentIndex < items.length) {
                onSelect(items[currentIndex], currentIndex);
            }
            break;
        default:
            break;
    }
};

/**
 * Trap focus within a modal or container
 * @param {HTMLElement} container - Container element to trap focus in
 * @param {Function} onEscape - Function to call when Escape is pressed
 */
export const trapFocus = (container, onEscape) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event) => {
        if (event.key === 'Escape' && onEscape) {
            onEscape();
            return;
        }

        if (event.key !== 'Tab') return;

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement?.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement?.focus();
            }
        }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    firstElement?.focus();

    return () => {
        container.removeEventListener('keydown', handleKeyDown);
    };
};

/**
 * Get focusable elements in a container
 * @param {HTMLElement} container - Container element
 * @returns {NodeList} List of focusable elements
 */
export const getFocusableElements = (container) => {
    if (!container) return [];
    
    return container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
};

/**
 * Restore focus to a previously focused element
 * @param {HTMLElement} element - Element to restore focus to
 */
export const restoreFocus = (element) => {
    if (element && typeof element.focus === 'function') {
        element.focus();
    }
};

/**
 * Save current focus for later restoration
 * @returns {HTMLElement} Currently focused element
 */
export const saveFocus = () => {
    return document.activeElement;
};

