import React, { useState } from 'react';
import { FiFilter, FiX, FiCalendar, FiChevronDown, FiChevronUp } from 'react-icons/fi';

/**
 * Reusable Filter Panel Component
 * Provides advanced filtering options for admin pages
 */
const FilterPanel = ({
    isOpen,
    onToggle,
    onApply,
    onReset,
    filters = [],
    className = ""
}) => {
    const [localFilters, setLocalFilters] = useState({});

    const handleFilterChange = (filterId, value) => {
        setLocalFilters(prev => ({
            ...prev,
            [filterId]: value
        }));
    };

    const handleApply = () => {
        onApply(localFilters);
    };

    const handleReset = () => {
        setLocalFilters({});
        onReset();
    };

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white ${className}`}
            >
                <FiFilter size={18} />
                <span>Advanced Filters</span>
            </button>
        );
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FiFilter size={20} className="text-primary-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
                </div>
                <button
                    onClick={onToggle}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    <FiX size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filters.map((filter) => (
                    <div key={filter.id}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {filter.label}
                        </label>
                        {filter.type === 'select' && (
                            <select
                                value={localFilters[filter.id] || ''}
                                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                            >
                                <option value="">All</option>
                                {filter.options?.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        )}
                        {filter.type === 'multiselect' && (
                            <MultiSelectFilter
                                value={localFilters[filter.id] || []}
                                onChange={(value) => handleFilterChange(filter.id, value)}
                                options={filter.options || []}
                            />
                        )}
                        {filter.type === 'daterange' && (
                            <DateRangeFilter
                                value={localFilters[filter.id] || { start: '', end: '' }}
                                onChange={(value) => handleFilterChange(filter.id, value)}
                            />
                        )}
                        {filter.type === 'text' && (
                            <input
                                type="text"
                                value={localFilters[filter.id] || ''}
                                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                                placeholder={filter.placeholder || 'Enter value...'}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                            />
                        )}
                        {filter.type === 'number' && (
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={localFilters[filter.id]?.min || ''}
                                    onChange={(e) => handleFilterChange(filter.id, {
                                        ...(localFilters[filter.id] || {}),
                                        min: e.target.value
                                    })}
                                    placeholder="Min"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                                />
                                <input
                                    type="number"
                                    value={localFilters[filter.id]?.max || ''}
                                    onChange={(e) => handleFilterChange(filter.id, {
                                        ...(localFilters[filter.id] || {}),
                                        max: e.target.value
                                    })}
                                    placeholder="Max"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleReset}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                    Reset
                </button>
                <button
                    onClick={handleApply}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
};

/**
 * Multi-Select Filter Component
 */
const MultiSelectFilter = ({ value = [], onChange, options = [] }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (optionValue) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm text-left flex items-center justify-between"
            >
                <span className="text-gray-700 dark:text-gray-300">
                    {value.length === 0 ? 'Select options...' : `${value.length} selected`}
                </span>
                {isOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
            </button>
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {options.map((option) => (
                            <label
                                key={option.value}
                                className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={value.includes(option.value)}
                                    onChange={() => toggleOption(option.value)}
                                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

/**
 * Date Range Filter Component
 */
const DateRangeFilter = ({ value = { start: '', end: '' }, onChange }) => {
    return (
        <div className="flex gap-2">
            <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                <input
                    type="date"
                    value={value.start || ''}
                    onChange={(e) => onChange({ ...value, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                />
            </div>
            <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                <input
                    type="date"
                    value={value.end || ''}
                    onChange={(e) => onChange({ ...value, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                />
            </div>
        </div>
    );
};

export default FilterPanel;

