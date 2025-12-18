import React from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

/**
 * Reusable Pagination Component
 * Provides consistent pagination UI across all admin pages
 */
const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    showPageNumbers = true,
    showFirstLast = false,
    itemsPerPage = 20,
    totalItems = 0,
    className = ""
}) => {
    // Don't render if only one page
    if (totalPages <= 1) {
        return null;
    }

    // Calculate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            // Show all pages if total is less than max visible
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show pages around current page
            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);
            
            // Adjust if we're near the end
            if (endPage - startPage < maxVisible - 1) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
        }
        
        return pages;
    };

    const pageNumbers = getPageNumbers();
    const startItem = totalItems > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 ${className}`}>
            {/* Items Info */}
            {totalItems > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing <span className="font-medium">{startItem}</span> to{' '}
                    <span className="font-medium">{endItem}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> results
                </div>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
                {/* First Page Button */}
                {showFirstLast && currentPage > 1 && (
                    <button
                        onClick={() => onPageChange(1)}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="First page"
                        aria-label="Go to first page"
                    >
                        <FiChevronsLeft size={18} aria-hidden="true" />
                    </button>
                )}

                {/* Previous Button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    aria-label="Go to previous page"
                >
                    <FiChevronLeft size={18} aria-hidden="true" />
                    Previous
                </button>

                {/* Page Numbers */}
                {showPageNumbers && (
                    <div className="flex items-center gap-1">
                        {pageNumbers[0] > 1 && (
                            <>
                                <button
                                    onClick={() => onPageChange(1)}
                                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    aria-label="Go to page 1"
                                >
                                    1
                                </button>
                                {pageNumbers[0] > 2 && (
                                    <span className="px-2 text-gray-600 dark:text-gray-400" aria-hidden="true">...</span>
                                )}
                            </>
                        )}
                        
                        {pageNumbers.map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    pageNum === currentPage
                                        ? 'bg-primary-500 text-white border border-primary-500'
                                        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                {pageNum}
                            </button>
                        ))}
                        
                        {pageNumbers[pageNumbers.length - 1] < totalPages && (
                            <>
                                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                                    <span className="px-2 text-gray-600 dark:text-gray-400" aria-hidden="true">...</span>
                                )}
                                <button
                                    onClick={() => onPageChange(totalPages)}
                                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    aria-label={`Go to page ${totalPages}`}
                                >
                                    {totalPages}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Next Button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    aria-label="Go to next page"
                >
                    Next
                    <FiChevronRight size={18} aria-hidden="true" />
                </button>

                {/* Last Page Button */}
                {showFirstLast && currentPage < totalPages && (
                    <button
                        onClick={() => onPageChange(totalPages)}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Last page"
                        aria-label="Go to last page"
                    >
                        <FiChevronsRight size={18} aria-hidden="true" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Pagination;

