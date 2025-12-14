import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

/**
 * Reusable Form Field Component with Validation
 * Provides consistent form field design with real-time validation
 */
const FormField = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    onBlur,
    error = null,
    touched = false,
    required = false,
    placeholder = '',
    disabled = false,
    className = '',
    inputClassName = '',
    validationRules = [],
    showValidationOnBlur = true,
    helpText = null,
    ...props
}) => {
    const [localError, setLocalError] = useState(null);
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        if (error) {
            setLocalError(error);
            setIsValid(false);
        } else if (touched && value) {
            validateField(value);
        } else {
            setLocalError(null);
            setIsValid(false);
        }
    }, [error, touched, value]);

    const validateField = (val) => {
        if (required && !val) {
            setLocalError(`${label || name} is required`);
            setIsValid(false);
            return false;
        }

        for (const rule of validationRules) {
            if (rule.test && !rule.test(val)) {
                setLocalError(rule.message);
                setIsValid(false);
                return false;
            }
        }

        setLocalError(null);
        setIsValid(val && val.length > 0);
        return true;
    };

    const handleBlur = (e) => {
        if (showValidationOnBlur) {
            validateField(value);
        }
        if (onBlur) {
            onBlur(e);
        }
    };

    const handleChange = (e) => {
        const newValue = e.target.value;
        onChange(e);
        
        // Real-time validation (only if field has been touched or has value)
        if (touched || newValue) {
            validateField(newValue);
        }
    };

    const displayError = localError && (touched || showValidationOnBlur);
    const showValidState = isValid && touched && !displayError;

    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            
            <div className="relative">
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={value || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors dark:bg-gray-700 dark:text-white ${
                        displayError
                            ? 'border-red-500 focus:ring-red-500'
                            : showValidState
                            ? 'border-green-500 focus:ring-green-500'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                    } ${inputClassName}`}
                    aria-invalid={displayError ? 'true' : 'false'}
                    aria-describedby={displayError ? `${name}-error` : helpText ? `${name}-help` : undefined}
                    {...props}
                />
                
                {showValidState && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <FiCheckCircle className="text-green-500" size={20} />
                    </div>
                )}
                
                {displayError && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <FiAlertCircle className="text-red-500" size={20} />
                    </div>
                )}
            </div>

            {displayError && (
                <p id={`${name}-error`} className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle size={14} />
                    {localError}
                </p>
            )}

            {helpText && !displayError && (
                <p id={`${name}-help`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {helpText}
                </p>
            )}
        </div>
    );
};

export default FormField;

