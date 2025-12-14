/**
 * Export Utilities
 * Functions to export data to CSV/Excel formats
 */

import * as XLSX from 'xlsx';

/**
 * Convert data array to CSV format
 */
export const convertToCSV = (data, headers) => {
    if (!data || data.length === 0) {
        return '';
    }

    // Use provided headers or extract from first object
    const csvHeaders = headers || Object.keys(data[0]);
    
    // Create header row
    const headerRow = csvHeaders.map(header => {
        // Handle nested headers like "user.name"
        const headerLabel = typeof header === 'object' ? header.label : header;
        return `"${String(headerLabel).replace(/"/g, '""')}"`;
    }).join(',');

    // Create data rows
    const dataRows = data.map(row => {
        return csvHeaders.map(header => {
            // Handle nested paths like "user.name" or function accessors
            let value = '';
            if (typeof header === 'object' && header.accessor) {
                value = typeof header.accessor === 'function' 
                    ? header.accessor(row) 
                    : getNestedValue(row, header.accessor);
            } else if (typeof header === 'string') {
                value = getNestedValue(row, header);
            } else {
                value = row[header];
            }
            
            // Format value
            if (value === null || value === undefined) {
                value = '';
            } else if (value instanceof Date) {
                value = value.toLocaleDateString();
            } else if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
};

/**
 * Get nested value from object using dot notation
 */
const getNestedValue = (obj, path) => {
    if (!path) return '';
    return path.split('.').reduce((current, prop) => {
        return current && current[prop] !== undefined ? current[prop] : '';
    }, obj);
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent, filename) => {
    // Add BOM for Excel compatibility with special characters
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename || 'export'}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    
    // Safely remove the link element
    // Use setTimeout to ensure the click event completes before removal
    setTimeout(() => {
        if (link.parentNode === document.body) {
            document.body.removeChild(link);
        }
        // Clean up
        URL.revokeObjectURL(url);
    }, 0);
};

/**
 * Export data to CSV
 */
export const exportToCSV = (data, headers, filename) => {
    const csv = convertToCSV(data, headers);
    downloadCSV(csv, filename);
};

/**
 * Export data to Excel (XLSX) using SheetJS library
 * Note: Requires xlsx library to be installed
 */
export const exportToExcel = (data, headers, filename, sheetName = 'Sheet1') => {
    try {
        if (!data || data.length === 0) {
            throw new Error('No data to export');
        }

    // Prepare headers
    const excelHeaders = headers || Object.keys(data[0]);
    
    // Prepare data rows
    const rows = data.map(row => {
        return excelHeaders.map(header => {
            let value = '';
            if (typeof header === 'object' && header.accessor) {
                value = typeof header.accessor === 'function' 
                    ? header.accessor(row) 
                    : getNestedValue(row, header.accessor);
            } else if (typeof header === 'string') {
                value = getNestedValue(row, header);
            } else {
                value = row[header];
            }
            
            // Format value
            if (value === null || value === undefined) {
                value = '';
            } else if (value instanceof Date) {
                value = value.toLocaleDateString();
            } else if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            
            return value;
        });
    });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([
        excelHeaders.map(h => typeof h === 'object' ? h.label : h),
        ...rows
    ]);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate file and download
    XLSX.writeFile(workbook, `${filename || 'export'}.xlsx`);
    } catch (error) {
        console.error('Excel export error:', error);
        // Fallback to CSV if Excel library not available
        exportToCSV(data, headers, filename);
        throw new Error('Excel export failed. CSV export used instead. Please install xlsx library for Excel support.');
    }
};

/**
 * Format date for export
 */
export const formatDateForExport = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

/**
 * Format currency for export
 */
export const formatCurrencyForExport = (amount, currency = 'USD') => {
    if (amount === null || amount === undefined) return '';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

