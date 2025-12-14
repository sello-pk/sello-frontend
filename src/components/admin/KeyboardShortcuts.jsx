import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { notifyInfo } from '../../utils/notifications';

/**
 * Keyboard Shortcuts Handler Component
 * Provides keyboard shortcuts for admin panel navigation and actions
 */
const KeyboardShortcuts = ({ onQuickSearch, onSave = null }) => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if user is typing in an input, textarea, or contenteditable
            if (
                e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.isContentEditable
            ) {
                // Allow Ctrl+S for save even in inputs
                if (e.ctrlKey && e.key === 's' && onSave) {
                    e.preventDefault();
                    onSave();
                    return;
                }
                return;
            }

            // Ctrl+K or Cmd+K: Quick Search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (onQuickSearch) {
                    onQuickSearch();
                } else {
                    // Default: focus search input if available
                    const searchInput = document.querySelector('input[type="text"][placeholder*="Search"], input[type="search"]');
                    if (searchInput) {
                        searchInput.focus();
                    } else {
                        notifyInfo('Press Ctrl+K to search (no search field found)');
                    }
                }
                return;
            }

            // Ctrl+S or Cmd+S: Save (if save handler provided)
            if ((e.ctrlKey || e.metaKey) && e.key === 's' && onSave) {
                e.preventDefault();
                onSave();
                return;
            }

            // Escape: Close modals/dropdowns
            if (e.key === 'Escape') {
                // Close any open modals
                const modals = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
                modals.forEach(modal => {
                    const closeButton = modal.querySelector('button[aria-label*="close"], button[aria-label*="Close"], .close-button');
                    if (closeButton) {
                        closeButton.click();
                    }
                });
                return;
            }

            // Number keys for quick navigation (when not in input)
            if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                const shortcuts = {
                    '1': '/admin/dashboard',
                    '2': '/admin/users',
                    '3': '/admin/listings',
                    '4': '/admin/dealers',
                    '5': '/admin/categories',
                    '6': '/admin/blogs',
                    '7': '/admin/analytics',
                    '8': '/admin/payments',
                    '9': '/admin/settings'
                };

                if (shortcuts[e.key] && location.pathname !== shortcuts[e.key]) {
                    navigate(shortcuts[e.key]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [navigate, location, onQuickSearch, onSave]);

    return null; // This component doesn't render anything
};

export default KeyboardShortcuts;

