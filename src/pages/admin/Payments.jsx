import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
    useGetAllPaymentsQuery,
    useGetAllSubscriptionsQuery,
    useAdminUpdateSubscriptionMutation,
    useAdminCancelSubscriptionMutation,
    useGetAllSubscriptionPlansQuery,
    useCreateSubscriptionPlanMutation,
    useUpdateSubscriptionPlanMutation,
    useDeleteSubscriptionPlanMutation,
    useToggleSubscriptionPlanStatusMutation,
} from "../../redux/services/adminApi";
import Spinner from "../../components/Spinner";
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from "../../utils/exportUtils";
import toast from "react-hot-toast";
import { FiDollarSign, FiCreditCard, FiCalendar, FiUser, FiCheckCircle, FiXCircle, FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiDownload } from "react-icons/fi";
import ConfirmModal from "../../components/admin/ConfirmModal";
import PromptModal from "../../components/admin/PromptModal";

const Payments = () => {
    const [activeTab, setActiveTab] = useState("payments"); // payments, subscriptions, or plans
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [subscriptionToCancel, setSubscriptionToCancel] = useState(null);
    const [subscriptionToUpdate, setSubscriptionToUpdate] = useState(null);
    const [updatePlan, setUpdatePlan] = useState("basic");
    const [updateDuration, setUpdateDuration] = useState("30");
    
    // Plan Management States
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [showDeletePlanModal, setShowDeletePlanModal] = useState(null);
    const [planFormData, setPlanFormData] = useState({
        name: "",
        displayName: "",
        price: "",
        duration: 30,
        features: [""],
        maxListings: -1,
        boostCredits: 0,
        isActive: true,
        isDefault: false,
        order: 0,
        description: "",
        visible: true,
        allowedRoles: ["all"],
        minUserLevel: 0,
        requiresApproval: false
    });

    const { data: paymentsData, isLoading: paymentsLoading, refetch: refetchPayments } = useGetAllPaymentsQuery({ 
        page, 
        limit: 50 
    });
    const { data: subscriptionsData, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useGetAllSubscriptionsQuery({ 
        page, 
        limit: 50,
        status: statusFilter === "all" ? undefined : statusFilter
    });
    const [updateSubscription] = useAdminUpdateSubscriptionMutation();
    const [cancelSubscription] = useAdminCancelSubscriptionMutation();
    
    // Plan Management
    const { data: plansData, isLoading: plansLoading, refetch: refetchPlans } = useGetAllSubscriptionPlansQuery({ includeInactive: true });
    const [createPlan, { isLoading: isCreatingPlan }] = useCreateSubscriptionPlanMutation();
    const [updatePlanMutation, { isLoading: isUpdatingPlan }] = useUpdateSubscriptionPlanMutation();
    const [deletePlan] = useDeleteSubscriptionPlanMutation();
    const [togglePlanStatus] = useToggleSubscriptionPlanStatusMutation();
    
    const plans = plansData || [];

    const payments = paymentsData?.payments || [];
    const subscriptions = subscriptionsData?.subscriptions || [];

    const handleUpdateSubscription = async (userId, plan, duration) => {
        try {
            await updateSubscription({ userId, plan, duration }).unwrap();
            toast.success("Subscription updated successfully");
            refetchSubscriptions();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update subscription");
        }
    };

    const handleCancelSubscription = (userId) => {
        setSubscriptionToCancel(userId);
        setShowCancelModal(true);
    };

    const handleCancelConfirm = async () => {
        if (!subscriptionToCancel) return;
        try {
            await cancelSubscription(subscriptionToCancel).unwrap();
            toast.success("Subscription cancelled successfully");
            refetchSubscriptions();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to cancel subscription");
        } finally {
            setShowCancelModal(false);
            setSubscriptionToCancel(null);
        }
    };

    const handleUpdateClick = (userId) => {
        setSubscriptionToUpdate(userId);
        setUpdatePlan("basic");
        setUpdateDuration("30");
        setShowUpdateModal(true);
    };

    const handleUpdateConfirm = async () => {
        if (!subscriptionToUpdate) return;
        try {
            await updateSubscription({ 
                userId: subscriptionToUpdate, 
                plan: updatePlan, 
                duration: parseInt(updateDuration) 
            }).unwrap();
            toast.success("Subscription updated successfully");
            refetchSubscriptions();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update subscription");
        } finally {
            setShowUpdateModal(false);
            setSubscriptionToUpdate(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            completed: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            failed: "bg-red-100 text-red-800"
        };
        return badges[status] || "bg-gray-100 text-gray-800";
    };

    const handleExportPayments = () => {
        if (payments.length === 0) {
            toast.error("No payments to export");
            return;
        }

        const headers = [
            { label: 'Payment ID', accessor: '_id' },
            { label: 'User', accessor: (payment) => payment.user?.name || payment.userId || 'N/A' },
            { label: 'Email', accessor: (payment) => payment.user?.email || 'N/A' },
            { label: 'Amount', accessor: (payment) => formatCurrencyForExport(payment.amount) },
            { label: 'Currency', accessor: 'currency' },
            { label: 'Status', accessor: 'status' },
            { label: 'Payment Method', accessor: 'paymentMethod' },
            { label: 'Transaction ID', accessor: 'transactionId' },
            { label: 'Description', accessor: 'description' },
            { label: 'Date', accessor: (payment) => formatDateForExport(payment.createdAt) }
        ];

        exportToCSV(payments, headers, `payments_export_${new Date().toISOString().split('T')[0]}`);
        toast.success("Payments exported successfully");
    };

    const handleExportSubscriptions = () => {
        if (subscriptions.length === 0) {
            toast.error("No subscriptions to export");
            return;
        }

        const headers = [
            { label: 'User', accessor: (sub) => sub.user?.name || sub.userId || 'N/A' },
            { label: 'Email', accessor: (sub) => sub.user?.email || 'N/A' },
            { label: 'Plan', accessor: 'plan' },
            { label: 'Status', accessor: (sub) => sub.isActive ? 'Active' : 'Inactive' },
            { label: 'Start Date', accessor: (sub) => formatDateForExport(sub.startDate) },
            { label: 'End Date', accessor: (sub) => formatDateForExport(sub.endDate) },
            { label: 'Auto Renewal', accessor: (sub) => sub.autoRenewal ? 'Yes' : 'No' },
            { label: 'Created Date', accessor: (sub) => formatDateForExport(sub.createdAt) }
        ];

        exportToCSV(subscriptions, headers, `subscriptions_export_${new Date().toISOString().split('T')[0]}`);
        toast.success("Subscriptions exported successfully");
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Management</h2>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            Manage all payments and subscriptions
                        </p>
                    </div>
                    {activeTab === "payments" && (
                        <button
                            onClick={handleExportPayments}
                            disabled={payments.length === 0 || paymentsLoading}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            <FiDownload size={18} />
                            Export CSV
                        </button>
                    )}
                    {activeTab === "subscriptions" && (
                        <button
                            onClick={handleExportSubscriptions}
                            disabled={subscriptions.length === 0 || subscriptionsLoading}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            <FiDownload size={18} />
                            Export CSV
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab("payments")}
                                className={`px-6 py-3 font-medium text-sm ${
                                    activeTab === "payments"
                                        ? "border-b-2 border-primary-500 text-primary-500"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                <FiCreditCard className="inline mr-2" />
                                All Payments
                            </button>
                            <button
                                onClick={() => setActiveTab("subscriptions")}
                                className={`px-6 py-3 font-medium text-sm ${
                                    activeTab === "subscriptions"
                                        ? "border-b-2 border-primary-500 text-primary-500"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                <FiCalendar className="inline mr-2" />
                                Subscriptions
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {activeTab === "payments" && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        {paymentsLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spinner fullScreen={false} />
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-gray-500">No payments found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Purpose</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Method</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Transaction ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {payments.map((payment) => (
                                            <tr key={payment._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{payment.userName}</p>
                                                        <p className="text-xs text-gray-500">{payment.userEmail}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        ${payment.amount?.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-600 capitalize">{payment.purpose}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-600 capitalize">{payment.paymentMethod || 'N/A'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(payment.status)}`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-600">{formatDate(payment.createdAt)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-500 font-mono">{payment.transactionId || 'N/A'}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "subscriptions" && (
                    <div className="space-y-6">
                        {/* Filters */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="all">All</option>
                                    <option value="active">Active</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                        </div>

                        {/* Subscriptions List */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            {subscriptionsLoading ? (
                                <div className="flex justify-center items-center h-64">
                                    <Spinner fullScreen={false} />
                                </div>
                            ) : subscriptions.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-gray-500">No subscriptions found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">User</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Plan</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Start Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">End Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Total Spent</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {subscriptions.map((sub) => (
                                                <tr key={sub.userId} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{sub.userName}</p>
                                                            <p className="text-xs text-gray-500">{sub.userEmail}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-medium text-gray-900 capitalize">{sub.plan}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {sub.isActive ? (
                                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                                                <FiCheckCircle size={12} />
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                                                                <FiXCircle size={12} />
                                                                Expired
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600">{formatDate(sub.startDate)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600">{formatDate(sub.endDate)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-medium text-gray-900">${sub.totalSpent?.toFixed(2) || '0.00'}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {!sub.isActive && (
                                                                <button
                                                                    onClick={() => handleUpdateClick(sub.userId)}
                                                                    className="text-primary-500 hover:text-primary-500 text-sm font-medium"
                                                                >
                                                                    Activate
                                                                </button>
                                                            )}
                                                            {sub.isActive && (
                                                                <button
                                                                    onClick={() => handleCancelSubscription(sub.userId)}
                                                                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Plans Management Tab */}
                {activeTab === "plans" && (
                    <div className="space-y-6">
                        {/* Header with Add Button */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Subscription Plans</h3>
                                <p className="text-sm text-gray-500">Manage subscription plans that users can purchase</p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingPlan(null);
                                    setPlanFormData({
                                        name: "",
                                        displayName: "",
                                        price: "",
                                        duration: 30,
                                        features: [""],
                                        maxListings: -1,
                                        boostCredits: 0,
                                        isActive: true,
                                        isDefault: false,
                                        order: 0,
                                        description: "",
                                        visible: true,
                                        allowedRoles: ["all"],
                                        minUserLevel: 0,
                                        requiresApproval: false
                                    });
                                    setShowPlanModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors"
                            >
                                <FiPlus size={18} />
                                Add New Plan
                            </button>
                        </div>

                        {/* Plans List */}
                        {plansLoading ? (
                            <div className="flex justify-center items-center h-64 bg-white rounded-lg border border-gray-200">
                                <Spinner fullScreen={false} />
                            </div>
                        ) : plans.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                <p className="text-gray-500 text-lg">No plans found. Create your first plan to get started.</p>
                            </div>
                        ) : (
                            <>
                            {/* Filter Controls */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-700">Filter:</span>
                                <select
                                    onChange={(e) => {
                                        // You can add filtering logic here
                                    }}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="all">All Plans</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                    <option value="visible">Visible to Users</option>
                                    <option value="hidden">Hidden from Users</option>
                                </select>
                                <div className="ml-auto text-sm text-gray-600">
                                    Total: {plans.length} plan{plans.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map((plan) => (
                                    <div
                                        key={plan._id}
                                        className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
                                            plan.isActive ? "border-gray-200" : "border-gray-300 opacity-75"
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-900">{plan.displayName}</h4>
                                                <p className="text-sm text-gray-500">{plan.name}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await togglePlanStatus(plan._id).unwrap();
                                                            toast.success(`Plan ${plan.isActive ? 'deactivated' : 'activated'}`);
                                                            refetchPlans();
                                                        } catch (error) {
                                                            toast.error(error?.data?.message || "Failed to toggle plan status");
                                                        }
                                                    }}
                                                    className="text-gray-600 hover:text-gray-800"
                                                    title={plan.isActive ? "Deactivate" : "Activate"}
                                                >
                                                    {plan.isActive ? <FiToggleRight size={24} className="text-green-500" /> : <FiToggleLeft size={24} className="text-gray-400" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="text-3xl font-bold text-gray-900">${plan.price}</div>
                                            <div className="text-sm text-gray-500">per {plan.duration} days</div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-sm text-gray-600 mb-2">Features:</p>
                                            <ul className="space-y-1">
                                                {plan.features && plan.features.length > 0 ? (
                                                    plan.features.map((feature, idx) => (
                                                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                                            <FiCheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="text-sm text-gray-400">No features listed</li>
                                                )}
                                            </ul>
                                        </div>

                                        <div className="mb-4 text-sm text-gray-600 space-y-1">
                                            <div>Max Listings: {plan.maxListings === -1 ? "Unlimited" : plan.maxListings}</div>
                                            <div>Boost Credits: {plan.boostCredits}</div>
                                            {plan.isDefault && (
                                                <div className="text-primary-500 font-semibold">Default Plan</div>
                                            )}
                                            {plan.visible === false && (
                                                <div className="text-red-600 font-semibold">Hidden from Users</div>
                                            )}
                                            {plan.allowedRoles && plan.allowedRoles.length > 0 && plan.allowedRoles[0] !== "all" && (
                                                <div className="text-blue-600">Restricted to: {plan.allowedRoles.join(", ")}</div>
                                            )}
                                            {plan.requiresApproval && (
                                                <div className="text-primary-600">Requires Approval</div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => {
                                                    setEditingPlan(plan);
                                                    setPlanFormData({
                                                        name: plan.name,
                                                        displayName: plan.displayName,
                                                        price: plan.price.toString(),
                                                        duration: plan.duration,
                                                        features: plan.features.length > 0 ? plan.features : [""],
                                                        maxListings: plan.maxListings,
                                                        boostCredits: plan.boostCredits,
                                                        isActive: plan.isActive,
                                                        isDefault: plan.isDefault,
                                                        order: plan.order,
                                                        description: plan.description || "",
                                                        visible: plan.visible !== undefined ? plan.visible : true,
                                                        allowedRoles: plan.allowedRoles && plan.allowedRoles.length > 0 ? plan.allowedRoles : ["all"],
                                                        minUserLevel: plan.minUserLevel || 0,
                                                        requiresApproval: plan.requiresApproval || false
                                                    });
                                                    setShowPlanModal(true);
                                                }}
                                                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <FiEdit2 size={16} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setShowDeletePlanModal(plan._id)}
                                                className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            </>
                        )}
                    </div>
                )}

                {/* Cancel Subscription Modal */}
                <ConfirmModal
                    isOpen={showCancelModal}
                    onClose={() => {
                        setShowCancelModal(false);
                        setSubscriptionToCancel(null);
                    }}
                    onConfirm={handleCancelConfirm}
                    title="Cancel Subscription"
                    message="Are you sure you want to cancel this subscription?"
                    confirmText="Cancel Subscription"
                    variant="danger"
                />

                {/* Update Subscription Modal */}
                {showUpdateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Update Subscription</h3>
                                    <button
                                        onClick={() => {
                                            setShowUpdateModal(false);
                                            setSubscriptionToUpdate(null);
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <FiXCircle size={20} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                                        <select
                                            value={updatePlan}
                                            onChange={(e) => setUpdatePlan(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">Select Plan</option>
                                            {plans.filter(p => p.isActive).map((plan) => (
                                                <option key={plan._id} value={plan.name}>
                                                    {plan.displayName} - ${plan.price}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
                                        <input
                                            type="number"
                                            value={updateDuration}
                                            onChange={(e) => setUpdateDuration(e.target.value)}
                                            min="1"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div className="flex gap-3 justify-end pt-4">
                                        <button
                                            onClick={() => {
                                                setShowUpdateModal(false);
                                                setSubscriptionToUpdate(null);
                                            }}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdateConfirm}
                                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90"
                                        >
                                            Update
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Plan Confirmation Modal */}
                <ConfirmModal
                    isOpen={!!showDeletePlanModal}
                    onClose={() => setShowDeletePlanModal(null)}
                    onConfirm={async () => {
                        if (!showDeletePlanModal) return;
                        try {
                            await deletePlan(showDeletePlanModal).unwrap();
                            toast.success("Plan deleted successfully");
                            refetchPlans();
                        } catch (error) {
                            toast.error(error?.data?.message || "Failed to delete plan");
                        } finally {
                            setShowDeletePlanModal(null);
                        }
                    }}
                    title="Delete Subscription Plan"
                    message="Are you sure you want to delete this plan? This action cannot be undone. Users with active subscriptions on this plan will need to be migrated."
                    confirmText="Delete"
                    variant="danger"
                />

                {/* Plan Form Modal */}
                {showPlanModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {editingPlan ? "Edit Plan" : "Create New Plan"}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowPlanModal(false);
                                            setEditingPlan(null);
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <FiXCircle size={24} />
                                    </button>
                                </div>

                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    try {
                                        const planData = {
                                            name: planFormData.name.trim(),
                                            displayName: planFormData.displayName.trim(),
                                            price: parseFloat(planFormData.price),
                                            duration: parseInt(planFormData.duration),
                                            features: planFormData.features.filter(f => f.trim()),
                                            maxListings: parseInt(planFormData.maxListings),
                                            boostCredits: parseInt(planFormData.boostCredits),
                                            isActive: planFormData.isActive,
                                            isDefault: planFormData.isDefault,
                                            order: parseInt(planFormData.order),
                                            description: planFormData.description.trim()
                                        };

                                        if (editingPlan) {
                                            await updatePlanMutation({ planId: editingPlan._id, ...planData }).unwrap();
                                            toast.success("Plan updated successfully");
                                        } else {
                                            await createPlan(planData).unwrap();
                                            toast.success("Plan created successfully");
                                        }
                                        setShowPlanModal(false);
                                        setEditingPlan(null);
                                        refetchPlans();
                                    } catch (error) {
                                        toast.error(error?.data?.message || "Failed to save plan");
                                    }
                                }} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name (ID) *</label>
                                            <input
                                                type="text"
                                                value={planFormData.name}
                                                onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                                placeholder="e.g., basic, premium"
                                                required
                                                disabled={!!editingPlan}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Lowercase, no spaces (used as identifier)</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                                            <input
                                                type="text"
                                                value={planFormData.displayName}
                                                onChange={(e) => setPlanFormData({ ...planFormData, displayName: e.target.value })}
                                                placeholder="e.g., Basic Plan"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={planFormData.price}
                                                onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days) *</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={planFormData.duration}
                                                onChange={(e) => setPlanFormData({ ...planFormData, duration: parseInt(e.target.value) || 30 })}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                                            <input
                                                type="number"
                                                value={planFormData.order}
                                                onChange={(e) => setPlanFormData({ ...planFormData, order: parseInt(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Listings</label>
                                            <input
                                                type="number"
                                                value={planFormData.maxListings === -1 ? "" : planFormData.maxListings}
                                                onChange={(e) => setPlanFormData({ ...planFormData, maxListings: e.target.value === "" ? -1 : parseInt(e.target.value) })}
                                                placeholder="-1 for unlimited"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">-1 = Unlimited</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Boost Credits</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={planFormData.boostCredits}
                                                onChange={(e) => setPlanFormData({ ...planFormData, boostCredits: parseInt(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                                        {planFormData.features.map((feature, idx) => (
                                            <div key={idx} className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={feature}
                                                    onChange={(e) => {
                                                        const newFeatures = [...planFormData.features];
                                                        newFeatures[idx] = e.target.value;
                                                        setPlanFormData({ ...planFormData, features: newFeatures });
                                                    }}
                                                    placeholder="Feature description"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                                {planFormData.features.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newFeatures = planFormData.features.filter((_, i) => i !== idx);
                                                            setPlanFormData({ ...planFormData, features: newFeatures });
                                                        }}
                                                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <FiTrash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setPlanFormData({ ...planFormData, features: [...planFormData.features, ""] })}
                                            className="text-sm text-primary-500 hover:text-primary-500 font-medium"
                                        >
                                            + Add Feature
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={planFormData.description}
                                            onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                                            rows="3"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={planFormData.isActive}
                                                    onChange={(e) => setPlanFormData({ ...planFormData, isActive: e.target.checked })}
                                                    className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Active</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={planFormData.isDefault}
                                                    onChange={(e) => setPlanFormData({ ...planFormData, isDefault: e.target.checked })}
                                                    className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Default Plan</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={planFormData.visible}
                                                    onChange={(e) => setPlanFormData({ ...planFormData, visible: e.target.checked })}
                                                    className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Visible to Users</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={planFormData.requiresApproval}
                                                    onChange={(e) => setPlanFormData({ ...planFormData, requiresApproval: e.target.checked })}
                                                    className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Requires Approval</span>
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Roles</label>
                                            <div className="flex flex-wrap gap-3">
                                                {["all", "user", "dealer"].map((role) => (
                                                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={planFormData.allowedRoles.includes(role)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setPlanFormData({
                                                                        ...planFormData,
                                                                        allowedRoles: role === "all" ? ["all"] : [...planFormData.allowedRoles.filter(r => r !== "all"), role]
                                                                    });
                                                                } else {
                                                                    setPlanFormData({
                                                                        ...planFormData,
                                                                        allowedRoles: planFormData.allowedRoles.filter(r => r !== role)
                                                                    });
                                                                }
                                                            }}
                                                            className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                                                        />
                                                        <span className="text-sm text-gray-700 capitalize">{role}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Select which user roles can see and purchase this plan</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum User Level</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={planFormData.minUserLevel}
                                                onChange={(e) => setPlanFormData({ ...planFormData, minUserLevel: parseInt(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Minimum user level required to purchase (0 = all users)</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPlanModal(false);
                                                setEditingPlan(null);
                                            }}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isCreatingPlan || isUpdatingPlan}
                                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                                        >
                                            {isCreatingPlan || isUpdatingPlan ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Payments;

