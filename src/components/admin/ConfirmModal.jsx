import React, { useEffect, useRef } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import {
  trapFocus,
  saveFocus,
  restoreFocus,
} from "../../utils/keyboardNavigation";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = saveFocus();

      // Trap focus in modal
      const cleanup = trapFocus(modalRef.current, onClose);

      return () => {
        cleanup?.();
        // Restore focus when modal closes
        if (previousFocusRef.current) {
          restoreFocus(previousFocusRef.current);
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      button: "bg-red-500 hover:bg-red-600 text-white",
      icon: "text-red-500",
    },
    warning: {
      button: "bg-yellow-500 hover:bg-yellow-600 text-white",
      icon: "text-yellow-500",
    },
    success: {
      button: "bg-green-500 hover:bg-green-600 text-white",
      icon: "text-green-500",
    },
    info: {
      button: "bg-blue-500 hover:bg-blue-600 text-white",
      icon: "text-blue-500",
    },
    default: {
      button: "bg-primary-500 hover:opacity-90 text-white",
      icon: "text-primary-500",
    },
  };

  const styles = variantStyles[variant] || variantStyles.danger;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        tabIndex={-1}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiAlertTriangle className={styles.icon} size={24} />
            <h3
              id="confirm-modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {title}
            </h3>
            <button
              onClick={onClose}
              className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
              aria-label="Close modal"
            >
              <FiX size={20} aria-hidden="true" />
            </button>
          </div>
          <p id="confirm-modal-message" className="text-gray-600 mb-6">
            {message}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              aria-label={cancelText}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 ${styles.button} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              aria-label={confirmText}
            >
              {isLoading && (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
