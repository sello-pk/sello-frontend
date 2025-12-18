import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { useGetAuditLogsQuery } from "../../redux/services/adminApi";
import { TableSkeleton } from "../../components/Skeleton";
import Pagination from "../../components/admin/Pagination";
import FilterPanel from "../../components/admin/FilterPanel";
import toast from "react-hot-toast";
import { FiSearch, FiClock, FiUser, FiActivity, FiInfo } from "react-icons/fi";

const ActivityLog = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({});

    // Build query params
    const queryParams = {
        page,
        limit: 50,
        ...(search && { actor: search }), // Search by actor email or ID
        ...(advancedFilters.action && { action: advancedFilters.action }),
        ...(advancedFilters.actor && { actor: advancedFilters.actor }),
        ...(advancedFilters.target && { target: advancedFilters.target }),
        ...(advancedFilters.dateRange?.start && { dateFrom: advancedFilters.dateRange.start }),
        ...(advancedFilters.dateRange?.end && { dateTo: advancedFilters.dateRange.end })
    };

    const { data, isLoading, refetch } = useGetAuditLogsQuery(queryParams);

    const logs = data?.logs || [];
    const pagination = data?.pagination || {};

    useEffect(() => {
        setPage(1);
    }, [search, advancedFilters]);

    const handleApplyFilters = (filters) => {
        setAdvancedFilters(filters);
        setPage(1);
    };

    const handleResetFilters = () => {
        setAdvancedFilters({});
        setPage(1);
    };

    const getActionLabel = (action) => {
        const actionLabels = {
            role_created: "Role Created",
            role_updated: "Role Updated",
            role_deleted: "Role Deleted",
            user_invited: "User Invited",
            user_role_changed: "User Role Changed",
            user_approved: "User Approved",
            user_rejected: "User Rejected",
            password_reset: "Password Reset",
            listing_approved: "Listing Approved",
            listing_rejected: "Listing Rejected",
            dealer_approved: "Dealer Approved",
            dealer_rejected: "Dealer Rejected",
            permission_changed: "Permission Changed",
            settings_changed: "Settings Changed",
            financial_access: "Financial Access",
            sensitive_action: "Sensitive Action"
        };
        return actionLabels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getActionColor = (action) => {
        if (action.includes('deleted') || action.includes('rejected')) {
            return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
        }
        if (action.includes('approved') || action.includes('created')) {
            return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
        }
        if (action.includes('updated') || action.includes('changed')) {
            return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
        }
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filterConfig = [
        {
            id: 'action',
            label: 'Action Type',
            type: 'select',
            options: [
                { value: 'role_created', label: 'Role Created' },
                { value: 'role_updated', label: 'Role Updated' },
                { value: 'role_deleted', label: 'Role Deleted' },
                { value: 'user_invited', label: 'User Invited' },
                { value: 'user_role_changed', label: 'User Role Changed' },
                { value: 'user_approved', label: 'User Approved' },
                { value: 'user_rejected', label: 'User Rejected' },
                { value: 'listing_approved', label: 'Listing Approved' },
                { value: 'listing_rejected', label: 'Listing Rejected' },
                { value: 'dealer_approved', label: 'Dealer Approved' },
                { value: 'dealer_rejected', label: 'Dealer Rejected' },
                { value: 'settings_changed', label: 'Settings Changed' },
                { value: 'permission_changed', label: 'Permission Changed' }
            ]
        },
        {
            id: 'dateRange',
            label: 'Date Range',
            type: 'daterange'
        }
    ];

    return (
        <AdminLayout>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                            <FiActivity className="text-2xl text-primary-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h2>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                Track all admin actions and system changes
                            </p>
                        </div>
                    </div>
                </div>

                {/* Advanced Filters */}
                <FilterPanel
                    isOpen={showAdvancedFilters}
                    onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                    filters={filterConfig}
                    className="mb-4"
                />

                {/* Search */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 p-4">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by actor email or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                    </div>
                </div>

                {/* Logs Table */}
                {isLoading ? (
                    <TableSkeleton rows={10} columns={6} />
                ) : logs.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <FiInfo className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
                        <p className="text-gray-700 dark:text-gray-300 text-lg">No activity logs found</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Timestamp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Actor
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Action
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Target
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            IP Address
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {logs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <FiClock size={16} className="text-gray-400 dark:text-gray-500" />
                                                    {formatDate(log.timestamp)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FiUser size={16} className="text-gray-400 dark:text-gray-500" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {log.actor?.name || 'Unknown'}
                                                        </div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                                            {log.actorEmail || log.actor?.email || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                                                    {getActionLabel(log.action)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.target ? (
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                        {log.target?.name || log.targetEmail || 'N/A'}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.details && Object.keys(log.details).length > 0 ? (
                                                    <details className="cursor-pointer">
                                                        <summary className="text-sm text-primary-500 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                                                            View Details
                                                        </summary>
                                                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs font-mono text-gray-700 dark:text-gray-300 max-w-md">
                                                            <pre className="whitespace-pre-wrap">
                                                                {JSON.stringify(log.details, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </details>
                                                ) : (
                                                    <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {log.ipAddress || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                <Pagination
                    currentPage={page}
                    totalPages={pagination.pages || 1}
                    onPageChange={setPage}
                    itemsPerPage={50}
                    totalItems={pagination.total || 0}
                />
            </div>
        </AdminLayout>
    );
};

export default ActivityLog;

