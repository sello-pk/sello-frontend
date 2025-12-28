import React from 'react';
import { FiCheck, FiX, FiTrash2, FiMoreVertical } from 'react-icons/fi';

/**
 * Bulk Actions Toolbar Component
 * Displays when items are selected and provides bulk action buttons
 */
const BulkActionsToolbar = ({
    selectedCount = 0,
    onSelectAll,
    onDeselectAll,
    onBulkAction,
    actions = [],
    className = ""
}) => {
    if (selectedCount === 0) {
        return null;
    }

    return (
        <div className={`bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-4 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-primary-500 dark:text-primary-300">
                        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
                    </span>
                    <button
                        onClick={onDeselectAll}
                        className="text-sm text-primary-500 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 underline"
                    >
                        Clear selection
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => onBulkAction(action.id)}
                            disabled={action.disabled}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                action.variant === 'danger'
                                    ? 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed'
                                    : action.variant === 'success'
                                    ? 'bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed'
                                    : 'bg-primary-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                            aria-label={`${action.label} for ${selectedCount} selected items`}
                        >
                            {action.icon && <action.icon size={16} aria-hidden="true" />}
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BulkActionsToolbar;

