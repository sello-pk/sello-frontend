import React, { useState, useMemo, useCallback, memo } from 'react';
import { FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/**
 * Reusable Data Table Component
 * Provides consistent table design across all admin pages
 * Optimized with React.memo and useMemo/useCallback to prevent unnecessary re-renders
 */
const DataTable = memo(({
    columns = [],
    data = [],
    isLoading = false,
    onRowClick = null,
    onSort = null,
    sortable = true,
    selectable = false,
    selectedRows = new Set(),
    onSelectRow = null,
    onSelectAll = null,
    emptyMessage = "No data found",
    loadingComponent = null,
    className = "",
    rowClassName = "",
    stickyHeader = false
}) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = useCallback((columnKey) => {
        if (!sortable || !onSort) return;

        const direction = 
            sortConfig.key === columnKey && sortConfig.direction === 'asc' 
                ? 'desc' 
                : 'asc';
        
        setSortConfig({ key: columnKey, direction });
        onSort(columnKey, direction);
    }, [sortable, onSort, sortConfig]);

    const getSortIcon = useCallback((columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <FiChevronUp className="opacity-0" size={16} />;
        }
        return sortConfig.direction === 'asc' 
            ? <FiChevronUp size={16} />
            : <FiChevronDown size={16} />;
    }, [sortConfig]);

    const allSelected = useMemo(() => 
        data.length > 0 && selectedRows.size === data.length, 
        [data.length, selectedRows.size]
    );
    const someSelected = useMemo(() => 
        selectedRows.size > 0 && selectedRows.size < data.length,
        [selectedRows.size, data.length]
    );

    const handleSelectAll = useCallback((checked) => {
        if (onSelectAll) {
            onSelectAll(checked);
        }
    }, [onSelectAll]);

    const handleSelectRow = useCallback((rowId, checked) => {
        if (onSelectRow) {
            onSelectRow(rowId, checked);
        }
    }, [onSelectRow]);

    const handleRowClick = useCallback((row) => {
        if (onRowClick) {
            onRowClick(row);
        }
    }, [onRowClick]);

    if (isLoading) {
        return loadingComponent || (
            <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className={`bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
                        <tr>
                            {selectable && (
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(input) => {
                                            if (input) input.indeterminate = someSelected;
                                        }}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                </th>
                            )}
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider ${
                                        column.className || ''
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.label}
                                        {sortable && column.sortable !== false && onSort && (
                                            <button
                                                onClick={() => handleSort(column.key)}
                                                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                            >
                                                {getSortIcon(column.key)}
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {data.map((row, rowIndex) => {
                            const isSelected = selectedRows.has(row.id || row._id || rowIndex);
                            return (
                                <tr
                                    key={row.id || row._id || rowIndex}
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                        isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                    } ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName}`}
                                    onClick={() => handleRowClick(row)}
                                >
                                    {selectable && (
                                        <td 
                                            className="px-6 py-4"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => handleSelectRow(row.id || row._id || rowIndex, e.target.checked)}
                                                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                                            />
                                        </td>
                                    )}
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`px-6 py-4 ${column.cellClassName || ''}`}
                                        >
                                            {column.render 
                                                ? column.render(row, rowIndex)
                                                : row[column.key] || '—'
                                            }
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    return (
        prevProps.data === nextProps.data &&
        prevProps.isLoading === nextProps.isLoading &&
        prevProps.columns === nextProps.columns &&
        prevProps.selectedRows === nextProps.selectedRows &&
        prevProps.onRowClick === nextProps.onRowClick &&
        prevProps.onSort === nextProps.onSort &&
        prevProps.onSelectRow === nextProps.onSelectRow &&
        prevProps.onSelectAll === nextProps.onSelectAll
    );
});

DataTable.displayName = 'DataTable';

export default DataTable;

