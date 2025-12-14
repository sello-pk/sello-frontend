import toast from 'react-hot-toast';

/**
 * Standardized Notification Utility
 * Provides consistent toast notifications across the admin panel
 */

/**
 * Show success notification
 */
export const notifySuccess = (message, options = {}) => {
    return toast.success(message, {
        duration: options.duration || 4000,
        position: options.position || 'top-right',
        ...options
    });
};

/**
 * Show error notification
 */
export const notifyError = (message, options = {}) => {
    return toast.error(message, {
        duration: options.duration || 5000,
        position: options.position || 'top-right',
        ...options
    });
};

/**
 * Show info notification
 */
export const notifyInfo = (message, options = {}) => {
    return toast(message, {
        duration: options.duration || 4000,
        position: options.position || 'top-right',
        icon: 'ℹ️',
        ...options
    });
};

/**
 * Show warning notification
 */
export const notifyWarning = (message, options = {}) => {
    return toast(message, {
        duration: options.duration || 4000,
        position: options.position || 'top-right',
        icon: '⚠️',
        ...options
    });
};

/**
 * Show loading notification (returns toast ID for later updates)
 */
export const notifyLoading = (message, options = {}) => {
    return toast.loading(message, {
        position: options.position || 'top-right',
        ...options
    });
};

/**
 * Update a loading notification to success
 */
export const notifyLoadingSuccess = (toastId, message) => {
    return toast.success(message, {
        id: toastId
    });
};

/**
 * Update a loading notification to error
 */
export const notifyLoadingError = (toastId, message) => {
    return toast.error(message, {
        id: toastId
    });
};

/**
 * Show promise notification (for async operations)
 */
export const notifyPromise = (promise, messages) => {
    return toast.promise(
        promise,
        {
            loading: messages.loading || 'Processing...',
            success: messages.success || 'Operation completed successfully',
            error: messages.error || 'Operation failed'
        },
        {
            position: 'top-right'
        }
    );
};

/**
 * Show action success notification with consistent format
 */
export const notifyActionSuccess = (action, item = 'item') => {
    return notifySuccess(`${item} ${action} successfully`);
};

/**
 * Show action error notification with consistent format
 */
export const notifyActionError = (action, item = 'item', error = null) => {
    const errorMessage = error?.data?.message || error?.message || 'Unknown error occurred';
    return notifyError(`Failed to ${action} ${item}. ${errorMessage}`);
};

/**
 * Show bulk action success notification
 */
export const notifyBulkActionSuccess = (action, count) => {
    return notifySuccess(`${count} item(s) ${action} successfully`);
};

/**
 * Show bulk action error notification
 */
export const notifyBulkActionError = (action, error = null) => {
    const errorMessage = error?.data?.message || error?.message || 'Unknown error occurred';
    return notifyError(`Failed to ${action} some items. ${errorMessage}`);
};

