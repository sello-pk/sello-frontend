import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { ROUTES } from "../../routes";
import { usePolling } from "../../hooks/usePolling";
import {
    useGetAllUsersQuery,
    useGetUserByIdQuery,
    useUpdateUserMutation,
    useDeleteUserMutation,
} from "../../redux/services/adminApi";
import Spinner from "../../components/Spinner";
import { TableSkeleton } from "../../components/Skeleton";
import Pagination from "../../components/admin/Pagination";
import FilterPanel from "../../components/admin/FilterPanel";
import DataTable from "../../components/admin/DataTable";
import Tooltip from "../../components/admin/Tooltip";
import { exportToCSV, formatDateForExport } from "../../utils/exportUtils";
import { notifyActionSuccess, notifyActionError, notifyError } from "../../utils/notifications";
import toast from "react-hot-toast";
import { FiSearch, FiEdit2, FiTrash2, FiX, FiSave, FiDownload } from "react-icons/fi";
import { MdBlock, MdCheckCircle } from "react-icons/md";
import ConfirmModal from "../../components/admin/ConfirmModal";

const Users = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [userToChangeStatus, setUserToChangeStatus] = useState(null);
    const [newStatus, setNewStatus] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({});
    
    // If userId is in URL, fetch that user
    const { data: userDetail, isLoading: userDetailLoading } = useGetUserByIdQuery(
        userId,
        { skip: !userId }
    );
    
    useEffect(() => {
        if (userId && userDetail) {
            setSelectedUser(userDetail);
            setShowEditModal(true);
        }
    }, [userId, userDetail]);
    
    // Build query params - memoized to prevent unnecessary re-renders
    const queryParams = useMemo(() => ({ 
        page, 
        limit: 20, 
        search,
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(advancedFilters.dateRange?.start && { dateFrom: advancedFilters.dateRange.start }),
        ...(advancedFilters.dateRange?.end && { dateTo: advancedFilters.dateRange.end }),
        ...(advancedFilters.boostCredits?.min && { boostCreditsMin: advancedFilters.boostCredits.min }),
        ...(advancedFilters.boostCredits?.max && { boostCreditsMax: advancedFilters.boostCredits.max }),
        ...(advancedFilters.emailVerified && { emailVerified: advancedFilters.emailVerified === 'yes' })
    }), [page, search, roleFilter, statusFilter, advancedFilters]);
    
    const { data, isLoading, refetch } = useGetAllUsersQuery(queryParams);
    const [updateUser] = useUpdateUserMutation();
    const [deleteUser] = useDeleteUserMutation();

    // Enable polling for real-time updates (every 30 seconds)
    usePolling(refetch, 30000, true);

    const users = data?.users || [];
    const pagination = data?.pagination || {};

    const handleToggleStatus = useCallback((userId, currentStatus) => {
        const status = currentStatus === 'suspended' ? 'active' : 'suspended';
        setUserToChangeStatus(userId);
        setNewStatus(status);
        setShowStatusModal(true);
    }, []);

    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleStatusConfirm = useCallback(async () => {
        if (!userToChangeStatus || !newStatus) return;
        setIsUpdatingStatus(true);
        try {
            await updateUser({ userId: userToChangeStatus, status: newStatus }).unwrap();
            notifyActionSuccess(newStatus === 'suspended' ? 'suspended' : 'activated', 'User');
            refetch();
        } catch (error) {
            notifyActionError('update status for', 'user', error);
        } finally {
            setIsUpdatingStatus(false);
            setShowStatusModal(false);
            setUserToChangeStatus(null);
            setNewStatus(null);
        }
    }, [userToChangeStatus, newStatus, updateUser, refetch]);

    const handleEdit = useCallback((user) => {
        setSelectedUser(user);
        setShowEditModal(true);
        // Update URL if not already there
        if (!userId) {
            navigate(ROUTES.admin.userDetail(user._id));
        }
    }, [userId, navigate]);
    
    const handleCloseModal = useCallback(() => {
        setShowEditModal(false);
        setSelectedUser(null);
        if (userId) {
            navigate("/admin/users");
        }
    }, [userId, navigate]);

    const handleDelete = useCallback((userId) => {
        setUserToDelete(userId);
        setShowDeleteModal(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            await deleteUser(userToDelete).unwrap();
            notifyActionSuccess('deleted', 'User');
            refetch();
        } catch (error) {
            notifyActionError('delete', 'user', error);
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setUserToDelete(null);
        }
    }, [userToDelete, deleteUser, refetch]);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }, []);

    const handleExportCSV = useCallback(() => {
        if (users.length === 0) {
            notifyError("No users to export");
            return;
        }

        const headers = [
            { label: 'Name', accessor: 'name' },
            { label: 'Email', accessor: 'email' },
            { label: 'Role', accessor: 'role' },
            { label: 'Status', accessor: 'status' },
            { label: 'Boost Credits', accessor: 'boostCredits' },
            { label: 'Joined Date', accessor: (user) => formatDateForExport(user.createdAt) },
            { label: 'Last Login', accessor: (user) => formatDateForExport(user.lastLogin) },
            { label: 'Email Verified', accessor: (user) => user.isEmailVerified ? 'Yes' : 'No' },
            { label: 'Phone', accessor: 'phone' }
        ];

        exportToCSV(users, headers, `users_export_${new Date().toISOString().split('T')[0]}`);
        notifyActionSuccess('exported', 'Users');
    }, [users]);

    const handleApplyFilters = useCallback((filters) => {
        setAdvancedFilters(filters);
        setPage(1);
    }, []);

    const handleResetFilters = useCallback(() => {
        setAdvancedFilters({});
        setPage(1);
    }, []);

    const filterConfig = useMemo(() => [
        {
            id: 'dateRange',
            label: 'Joined Date Range',
            type: 'daterange'
        },
        {
            id: 'boostCredits',
            label: 'Boost Credits',
            type: 'number'
        },
        {
            id: 'emailVerified',
            label: 'Email Verified',
            type: 'select',
            options: [
                { value: 'yes', label: 'Verified' },
                { value: 'no', label: 'Not Verified' }
            ]
        }
    ], []);

    return (
        <AdminLayout>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            Manage regular users (individuals, dealers). Admin users are managed in Settings.
                        </p>
                    </div>
                    <button
                        onClick={handleExportCSV}
                        disabled={users.length === 0 || isLoading}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        aria-label="Export users to CSV"
                    >
                        <FiDownload size={18} aria-hidden="true" />
                        Export CSV
                    </button>
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

                {/* Filter Tabs and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Tabs */}
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => setRoleFilter("")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        roleFilter === "" 
                                            ? "bg-primary-500 text-white" 
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    All Users
                                </button>
                                <button
                                    onClick={() => setRoleFilter("individual")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        roleFilter === "individual" 
                                            ? "bg-primary-500 text-white" 
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    Individual
                                </button>
                                <button
                                    onClick={() => setRoleFilter("dealer")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        roleFilter === "dealer" 
                                            ? "bg-primary-500 text-white" 
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    Dealers
                                </button>
                                <button
                                    onClick={() => setStatusFilter("suspended")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        statusFilter === "suspended" 
                                            ? "bg-primary-500 text-white" 
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    Suspend
                                </button>
                                <button
                                    onClick={() => setStatusFilter("active")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        statusFilter === "active" 
                                            ? "bg-primary-500 text-white" 
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    Activate
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative w-full lg:w-80">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Table */}
                {isLoading ? (
                    <TableSkeleton rows={10} columns={7} />
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Joined Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Edit
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-700 dark:text-gray-300 text-sm">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {user.name || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                                                    user.role === 'dealer' ? 'bg-primary-500 text-white' :
                                                    user.role === 'admin' ? 'bg-purple-500 text-white' :
                                                    user.role === 'individual' ? 'bg-green-500 text-white' :
                                                    'bg-blue-500 text-white'
                                                }`}>
                                                    {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Individual'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {formatDate(user.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Tooltip content="Delete user">
                                                    <button
                                                        onClick={() => handleDelete(user._id)}
                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                        aria-label="Delete user"
                                                    >
                                                        <FiTrash2 size={18} />
                                                    </button>
                                                </Tooltip>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Tooltip content={user.status === 'suspended' ? 'Activate user' : 'Suspend user'}>
                                                    <button
                                                        onClick={() => handleToggleStatus(user._id, user.status)}
                                                        className={`transition-colors ${
                                                            user.status === 'suspended' 
                                                                ? 'text-red-600 hover:text-red-800' 
                                                                : 'text-green-600 hover:text-green-800'
                                                        }`}
                                                        aria-label={user.status === 'suspended' ? 'Activate user' : 'Suspend user'}
                                                    >
                                                        {user.status === 'suspended' ? (
                                                            <MdBlock size={20} />
                                                        ) : (
                                                            <MdCheckCircle size={20} />
                                                        )}
                                                    </button>
                                                </Tooltip>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Tooltip content="Edit user">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="text-gray-600 hover:text-primary-500 transition-colors"
                                                        aria-label="Edit user"
                                                    >
                                                        <FiEdit2 size={18} />
                                                    </button>
                                                </Tooltip>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <Pagination
                    currentPage={page}
                    totalPages={pagination.pages || 1}
                    onPageChange={setPage}
                    itemsPerPage={20}
                    totalItems={pagination.total || 0}
                />

                {/* Status Change Confirmation Modal */}
                <ConfirmModal
                    isOpen={showStatusModal}
                    onClose={() => {
                        setShowStatusModal(false);
                        setUserToChangeStatus(null);
                        setNewStatus(null);
                    }}
                    onConfirm={handleStatusConfirm}
                    title={newStatus === 'suspended' ? 'Suspend User' : 'Activate User'}
                    message={`Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'activate'} this user? ${newStatus === 'suspended' ? 'They will not be able to access their account.' : 'They will regain access to their account.'}`}
                    confirmText={newStatus === 'suspended' ? 'Suspend' : 'Activate'}
                    variant={newStatus === 'suspended' ? 'danger' : 'default'}
                />

                {/* Edit User Modal */}
                {(showEditModal || userId) && (selectedUser || userDetail) && (
                    <EditUserModal
                        user={selectedUser || userDetail}
                        onClose={handleCloseModal}
                        onUpdate={async (formData) => {
                            try {
                                const targetUser = selectedUser || userDetail;
                                await updateUser({ userId: targetUser._id, ...formData }).unwrap();
                                notifyActionSuccess('updated', 'User');
                                handleCloseModal();
                                refetch();
                            } catch (error) {
                                notifyActionError('update', 'user', error);
                            }
                        }}
                    />
                )}
            </div>
        </AdminLayout>
    );
};

// Edit User Modal Component
const EditUserModal = ({ user, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: user?.name || "",
        role: user?.role || "individual",
        status: user?.status || "active",
        boostCredits: user?.boostCredits || 0,
    });
    
    // Update form data when user changes
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                role: user.role || "individual",
                status: user.status || "active",
                boostCredits: user.boostCredits || 0,
            });
        }
    }, [user]);
    
    if (!user) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onUpdate(formData);
    };

    // Get role badge color
    const getRoleBadgeColor = useCallback((role) => {
        switch (role) {
            case 'admin':
                return 'bg-yellow-500 text-white'; // Primary color
            case 'dealer':
                return 'bg-purple-500 text-white';
            case 'individual':
                return 'bg-green-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    }, []);

    // Get status badge color
    const getStatusBadgeColor = useCallback((status) => {
        switch (status) {
            case 'active':
                return 'bg-green-500 text-white';
            case 'suspended':
                return 'bg-red-500 text-white';
            case 'inactive':
                return 'bg-gray-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
                {/* Fixed Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit User</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                </div>
                {/* Scrollable Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                        <div className="space-y-3">
                            {/* Current Role Badge */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-700">Current:</span>
                                <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getRoleBadgeColor(formData.role)}`}>
                                    {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                                </span>
                            </div>
                            {/* Role Selection */}
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white text-sm"
                            >
                                <option value="individual">Individual</option>
                                <option value="dealer">Dealer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                        <div className="space-y-3">
                            {/* Current Status Badge */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-700">Current:</span>
                                <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusBadgeColor(formData.status)}`}>
                                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                                </span>
                            </div>
                            {/* Status Selection */}
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white text-sm"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Boost Credits</label>
                        <input
                            type="number"
                            value={formData.boostCredits}
                            onChange={(e) => setFormData({ ...formData, boostCredits: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                            min="0"
                        />
                    </div>
                    
                    {/* Dealer Information Section */}
                    {user?.role === "dealer" && user?.dealerInfo && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dealer Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Business Name</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {user.dealerInfo.businessName || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Location</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {user.dealerInfo.city || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Phone</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {user.dealerInfo.businessPhone || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Verification Status</p>
                                    <span
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                                            user.dealerInfo.verified
                                                ? "bg-green-100 text-green-700"
                                                : "bg-yellow-100 text-yellow-700"
                                        }`}
                                    >
                                        {user.dealerInfo.verified ? "✓ Verified" : "Pending"}
                                    </span>
                                </div>
                                {user.dealerInfo.businessLicense && (
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-gray-600 mb-2">Business License</p>
                                        <a
                                            href={user.dealerInfo.businessLicense}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary-500 hover:underline text-sm"
                                        >
                                            View License Document
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </form>
                {/* Fixed Footer */}
                <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-200 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium transition-colors"
                    >
                        <FiSave className="inline mr-2" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Users;
