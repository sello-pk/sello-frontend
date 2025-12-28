import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

const PromptModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Enter Value", 
    message = "Please enter a value:",
    placeholder = "",
    defaultValue = "",
    confirmText = "Confirm", 
    cancelText = "Cancel",
    type = "text",
    isLoading = false
}) => {
    const [value, setValue] = useState(defaultValue);
    
    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
        }
    }, [isOpen, defaultValue]);
    
    if (!isOpen) return null;
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (value.trim()) {
            onConfirm(value.trim());
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            disabled={isLoading}
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
                        <input
                            type={type}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white mb-6"
                            autoFocus
                            required
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                            >
                                {cancelText}
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !value.trim()}
                                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoading && (
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {confirmText}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PromptModal;
