import { useState, useMemo } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
    useGetAllCustomerRequestsQuery,
    useGetCustomerRequestStatisticsQuery,
    useUpdateCustomerRequestMutation,
    useDeleteCustomerRequestMutation,
    useAddCustomerRequestResponseMutation,
    useGetAllContactFormsQuery,
    useUpdateContactFormStatusMutation,
    useDeleteContactFormMutation,
    useConvertToChatMutation,
} from "../../redux/services/adminApi";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import { FiSearch, FiEdit2, FiTrash2, FiMessageSquare, FiClock, FiCheckCircle, FiEye, FiUser, FiX, FiMail } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { ROUTES } from "../../routes";
import ConfirmModal from "../../components/admin/ConfirmModal";
import ActionDropdown from "../../components/admin/ActionDropdown";

const CustomerRequests = () => {
    const [requestType, setRequestType] = useState("all"); // "all", "requests", "contact_forms"
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [responseMessage, setResponseMessage] = useState("");
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState(null);

    const { data: stats } = useGetCustomerRequestStatisticsQuery();
    
    // Fetch customer requests
    const { data: requestsData, isLoading: isLoadingRequests, refetch: refetchRequests } = useGetAllCustomerRequestsQuery(
        {
            status: activeTab !== "all" ? activeTab : undefined,
            search: searchQuery || undefined,
        },
        {
            pollingInterval: 5000,
            refetchOnMountOrArgChange: true,
            skip: requestType === "contact_forms" // Skip if only showing contact forms
        }
    );

    // Fetch contact forms
    const contactFormQueryParams = {};
    if (activeTab !== "all") {
        contactFormQueryParams.status = activeTab;
    }
    if (searchQuery) {
        contactFormQueryParams.search = searchQuery;
    }
    
    const { data: contactFormsData, isLoading: isLoadingContactForms, refetch: refetchContactForms } = useGetAllContactFormsQuery(
        contactFormQueryParams,
        {
            pollingInterval: 5000,
            refetchOnMountOrArgChange: true,
            skip: requestType === "requests" // Skip if only showing customer requests
        }
    );

    const [updateRequest, { isLoading: isUpdating }] = useUpdateCustomerRequestMutation();
    const [deleteRequest, { isLoading: isDeleting }] = useDeleteCustomerRequestMutation();
    const [addResponse, { isLoading: isAddingResponse }] = useAddCustomerRequestResponseMutation();
    const [updateContactFormStatus] = useUpdateContactFormStatusMutation();
    const [deleteContactForm] = useDeleteContactFormMutation();
    const [convertToChat] = useConvertToChatMutation();

    const requests = requestsData?.requests || [];
    
    // Process contact forms data
    const contactForms = useMemo(() => {
        if (!contactFormsData) return [];
        if (contactFormsData.contactForms && Array.isArray(contactFormsData.contactForms)) {
            return contactFormsData.contactForms;
        }
        if (Array.isArray(contactFormsData)) {
            return contactFormsData;
        }
        if (contactFormsData.data) {
            if (Array.isArray(contactFormsData.data.contactForms)) {
                return contactFormsData.data.contactForms;
            }
            if (Array.isArray(contactFormsData.data)) {
                return contactFormsData.data;
            }
        }
        return [];
    }, [contactFormsData]);

    // Combine and format all items for display
    const allItems = useMemo(() => {
        const items = [];
        
        if (requestType === "all" || requestType === "requests") {
            requests.forEach(req => {
                items.push({
                    ...req,
                    itemType: "customer_request",
                    displayName: req.user?.name || "Unknown User",
                    displayEmail: req.user?.email || "No email",
                    displaySubject: req.subject,
                    displayMessage: req.description,
                });
            });
        }
        
        if (requestType === "all" || requestType === "contact_forms") {
            contactForms.forEach(form => {
                items.push({
                    ...form,
                    itemType: "contact_form",
                    displayName: `${form.firstName || ""} ${form.lastName || ""}`.trim() || "Unknown",
                    displayEmail: form.email || "No email",
                    displaySubject: form.subject,
                    displayMessage: form.message,
                    // Map contact form status to customer request status format
                    status: form.status === "new" ? "open" : form.status === "in_progress" ? "in_progress" : form.status === "resolved" ? "resolved" : "closed",
                });
            });
        }
        
        // Sort by date (newest first)
        return items.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });
    }, [requests, contactForms, requestType]);

    const isLoading = isLoadingRequests || isLoadingContactForms;

    const handleStatusChange = async (requestId, newStatus) => {
        try {
            await updateRequest({
                requestId,
                status: newStatus
            }).unwrap();
            toast.success("Request status updated successfully");
            refetchRequests();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update status");
        }
    };

    const handlePriorityChange = async (requestId, newPriority) => {
        try {
            await updateRequest({
                requestId,
                priority: newPriority
            }).unwrap();
            toast.success("Request priority updated successfully");
            refetchRequests();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update priority");
        }
    };

    const handleAssign = async (requestId, assignedTo) => {
        try {
            await updateRequest({
                requestId,
                assignedTo
            }).unwrap();
            toast.success("Request assigned successfully");
            refetchRequests();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to assign request");
        }
    };

    const handleDelete = (requestId) => {
        setRequestToDelete(requestId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!requestToDelete) return;
        try {
            await deleteRequest(requestToDelete).unwrap();
            toast.success("Request deleted successfully");
            refetchRequests();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to delete request");
        } finally {
            setShowDeleteModal(false);
            setRequestToDelete(null);
        }
    };

    const handleAddResponse = async () => {
        if (!responseMessage.trim() || !selectedRequest) {
            toast.error("Response message is required");
            return;
        }

        try {
            await addResponse({
                requestId: selectedRequest,
                message: responseMessage.trim()
            }).unwrap();
            toast.success("Response added successfully");
            setShowResponseModal(false);
            setResponseMessage("");
            setSelectedRequest(null);
            refetchRequests();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to add response");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "open": return "bg-primary-50 text-primary-800 border-primary-200";
            case "in_progress": return "bg-primary-100 text-primary-800 border-primary-300";
            case "resolved": return "bg-green-100 text-green-800 border-green-200";
            case "closed": return "bg-gray-100 text-gray-800 border-gray-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "urgent": return "bg-red-100 text-red-800";
            case "high": return "bg-primary-100 text-primary-800";
            case "medium": return "bg-primary-50 text-primary-800";
            case "low": return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getTypeLabel = (type) => {
        const types = {
            support: "Support",
            inquiry: "Inquiry",
            complaint: "Complaint",
            feature_request: "Feature Request",
            bug_report: "Bug Report",
            other: "Other"
        };
        return types[type] || type;
    };

    return (
        <AdminLayout>
            <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Customer Requests</h1>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">Manage support tickets, customer inquiries, and contact forms</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => {
                                refetchRequests();
                                refetchContactForms();
                            }}
                            className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 dark:hover:border-primary-600 transition-colors duration-200"
                            title="Refresh data"
                        >
                            <FiMessageSquare size={20} />
                        </button>
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center">
                            <FiMessageSquare className="mr-2" size={20} />
                            <span className="font-semibold">{allItems.length} Total Items</span>
                        </div>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Open Requests</p>
                                <p className="text-2xl font-bold text-primary-600">
                                    {stats?.openRequests || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100">
                                <FiMessageSquare className="text-primary-500 text-xl" />
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">Requests awaiting response</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-primary-200 dark:border-primary-800/30 p-5 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {stats?.inProgressRequests || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100">
                                <FiClock className="text-primary-500 text-xl" />
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">Requests being handled</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-primary-200 dark:border-primary-800/30 p-5 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                                <p className="text-2xl font-bold text-primary-600">
                                    {stats?.totalRequests || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100">
                                <FiMessageSquare className="text-primary-500 text-xl" />
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">All customer requests</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-green-200 dark:border-green-800/30 p-5 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Resolved</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {stats?.resolvedRequests || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                                <FiCheckCircle className="text-green-500 text-xl" />
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">Successfully closed</p>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex flex-col gap-4 mb-5">
                        {/* Request Type Filter */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setRequestType("all")}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    requestType === "all" 
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                All Types
                            </button>
                            <button
                                onClick={() => setRequestType("requests")}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    requestType === "requests" 
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                <FiMessageSquare className="inline mr-2" size={16} />
                                Customer Requests
                            </button>
                            <button
                                onClick={() => setRequestType("contact_forms")}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    requestType === "contact_forms" 
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                <FiMail className="inline mr-2" size={16} />
                                Contact Forms
                            </button>
                        </div>
                        
                        {/* Status Filter */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveTab("all")}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    activeTab === "all" 
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                All Status
                            </button>
                            <button
                                onClick={() => setActiveTab("open")}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    activeTab === "open" 
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                Open
                            </button>
                            <button
                                onClick={() => setActiveTab("in_progress")}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    activeTab === "in_progress" 
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                In Progress
                            </button>
                            <button
                                onClick={() => setActiveTab("resolved")}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                    activeTab === "resolved" 
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                Resolved
                            </button>
                        </div>
                        <div className="relative w-full md:w-80">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by subject, user, or request ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <FiX size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Spinner fullScreen={false} />
                            </div>
                        ) : allItems.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                                <FiMessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
                                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No items found</p>
                                <p className="text-gray-500">There are no items matching your criteria</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Item Type
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Subject
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Priority
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Assigned To
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {allItems.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {item.itemType === "contact_form" ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-800">
                                                        <FiMail className="mr-1" size={12} />
                                                        Contact Form
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-800">
                                                        <FiMessageSquare className="mr-1" size={12} />
                                                        Request
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {item._id?.toString().substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-semibold overflow-hidden border-2 border-white shadow-sm">
                                                        {item.user?.avatar ? (
                                                            <img
                                                                src={item.user.avatar}
                                                                alt={item.user.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            (item.displayName || 'U').charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {item.displayName || "Unknown User"}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {item.displayEmail || "No email"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.itemType === "contact_form" ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        Contact
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {getTypeLabel(item.type)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                                {item.displaySubject}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {item.itemType === "customer_request" && item.priority ? (
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${{
                                                        urgent: 'bg-red-100 text-red-800 border border-red-200',
                                                        high: 'bg-primary-100 text-primary-800 border border-primary-200',
                                                        medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
                                                        low: 'bg-green-100 text-green-800 border border-green-200'
                                                    }[item.priority] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                                                        <span className={`w-2 h-2 rounded-full mr-2 ${
                                                            item.priority === 'urgent' ? 'bg-red-500' :
                                                            item.priority === 'high' ? 'bg-primary-500' :
                                                            item.priority === 'medium' ? 'bg-primary-400' :
                                                            item.priority === 'low' ? 'bg-gray-400' :
                                                            'bg-gray-500'
                                                        }`}></span>
                                                        {item.priority?.charAt(0).toUpperCase() + item.priority?.slice(1) || 'Medium'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {item.itemType === "contact_form" ? (
                                                    <select
                                                        value={item.status === "open" ? "new" : item.status}
                                                        onChange={(e) => {
                                                            const newStatus = e.target.value;
                                                            handleContactFormStatusChange(item._id, newStatus);
                                                        }}
                                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all ${{
                                                            new: 'bg-primary-50 text-primary-700 border-primary-200',
                                                            in_progress: 'bg-primary-100 text-primary-700 border-primary-300',
                                                            resolved: 'bg-green-50 text-green-700 border-green-200',
                                                        }[item.status === "open" ? "new" : item.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
                                                    >
                                                        <option value="new">New</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="resolved">Resolved</option>
                                                    </select>
                                                ) : (
                                                    <select
                                                        value={item.status}
                                                        onChange={(e) => handleStatusChange(item._id, e.target.value)}
                                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all ${{
                                                            open: 'bg-primary-50 text-primary-700 border-primary-200',
                                                            in_progress: 'bg-primary-100 text-primary-700 border-primary-300',
                                                            resolved: 'bg-green-50 text-green-700 border-green-200',
                                                            closed: 'bg-gray-50 text-gray-700 border-gray-200'
                                                        }[item.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
                                                    >
                                                        <option value="open">Open</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="resolved">Resolved</option>
                                                        <option value="closed">Closed</option>
                                                    </select>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.assignedTo ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center text-xs font-semibold overflow-hidden border border-gray-300">
                                                            {item.assignedTo?.avatar ? (
                                                                <img
                                                                    src={item.assignedTo.avatar}
                                                                    alt={item.assignedTo.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                (item.assignedTo?.name || 'A').charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <span className="font-medium">{item.assignedTo?.name || "Assigned"}</span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full text-xs font-medium">
                                                        <FiUser className="mr-1.5" size={14} />
                                                        Unassigned
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.createdAt 
                                                    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                                                    : "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(item._id);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="p-2 text-primary-600 hover:text-white bg-primary-50 hover:bg-primary-500 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                        title="View details"
                                                    >
                                                        <FiEye size={18} />
                                                    </button>
                                                    {item.itemType === "contact_form" && !item.chatId && (
                                                        <button
                                                            onClick={() => handleConvertToChat(item._id)}
                                                            className="p-2 text-primary-600 hover:text-white bg-primary-50 hover:bg-primary-500 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                            title="Convert to Chat"
                                                        >
                                                            <FiMessageSquare size={18} />
                                                        </button>
                                                    )}
                                                    {item.itemType === "customer_request" && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequest(item._id);
                                                                setShowResponseModal(true);
                                                            }}
                                                            className="p-2 text-primary-600 hover:text-white bg-primary-50 hover:bg-primary-500 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                            title="Add response"
                                                        >
                                                            <FiMessageSquare size={18} />
                                                        </button>
                                                    )}
                                                    <ActionDropdown
                                                        onDelete={() => handleDelete(item._id)}
                                                        item={item}
                                                        itemName="item"
                                                        deleteConfirmMessage="Are you sure you want to delete this item? This action cannot be undone."
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Response Modal */}
            {showResponseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg transform transition-all duration-300 scale-100">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-2xl font-bold text-gray-900">Add Response</h3>
                            <button
                                onClick={() => {
                                    setShowResponseModal(false);
                                    setResponseMessage("");
                                    setSelectedRequest(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <FiX size={24} />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Response Message</label>
                                <textarea
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition shadow-sm"
                                    rows={6}
                                    placeholder="Enter your detailed response to the customer..."
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    onClick={() => {
                                        setShowResponseModal(false);
                                        setResponseMessage("");
                                        setSelectedRequest(null);
                                    }}
                                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddResponse}
                                    disabled={!responseMessage.trim() || isAddingResponse}
                                    className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
                                >
                                    {isAddingResponse ? (
                                        <>
                                            <Spinner fullScreen={false} />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <FiMessageSquare size={18} />
                                            Send Response
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
                            <h3 className="text-2xl font-bold text-gray-900">Request Details</h3>
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedRequest(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <FiX size={24} />
                            </button>
                        </div>
                        {(() => {
                            const item = allItems.find(i => i._id === selectedRequest);
                            if (!item) return <div>Item not found</div>;
                            
                            return (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Item Type</p>
                                            <p className="text-sm text-gray-900">
                                                {item.itemType === "contact_form" ? "Contact Form" : "Customer Request"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <p className="text-sm font-semibold text-gray-700 mb-1">ID</p>
                                            <p className="text-sm text-gray-900 font-mono">{item._id}</p>
                                        </div>
                                        {item.itemType === "customer_request" && (
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-sm font-semibold text-gray-700 mb-1">Type</p>
                                                <p className="text-sm text-gray-900">{getTypeLabel(item.type)}</p>
                                            </div>
                                        )}
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Status</p>
                                            <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                                {item.status?.replace('_', ' ').charAt(0).toUpperCase() + item.status?.replace('_', ' ').slice(1) || 'Open'}
                                            </span>
                                        </div>
                                        {item.itemType === "customer_request" && item.priority && (
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-sm font-semibold text-gray-700 mb-1">Priority</p>
                                                <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getPriorityColor(item.priority)}`}>
                                                    {item.priority?.charAt(0).toUpperCase() + item.priority?.slice(1) || 'Medium'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Name</p>
                                            <p className="text-sm text-gray-900">{item.displayName || "Unknown"}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Email</p>
                                            <p className="text-sm text-gray-900">{item.displayEmail || "No email"}</p>
                                        </div>
                                        {item.itemType === "customer_request" && (
                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                <p className="text-sm font-semibold text-gray-700 mb-1">Assigned To</p>
                                                <p className="text-sm text-gray-900">{item.assignedTo?.name || "Unassigned"}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-sm font-semibold text-gray-700 mb-2">Subject</p>
                                        <p className="text-sm text-gray-900">{item.displaySubject}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-sm font-semibold text-gray-700 mb-2">{item.itemType === "contact_form" ? "Message" : "Description"}</p>
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.displayMessage || item.description}</p>
                                    </div>
                                    {item.itemType === "contact_form" && item.chatId && (
                                      <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-sm font-semibold text-gray-700 mb-2">Chat</p>
                                        <a
                                          href={ROUTES.admin.supportChatWithId(
                                            typeof item.chatId === "string"
                                              ? item.chatId
                                              : item.chatId?._id || item.chatId?.toString() || ""
                                          )}
                                          className="text-primary-500 hover:underline"
                                        >
                                          View Chat Conversation
                                        </a>
                                      </div>
                                    )}
                                    {item.itemType === "customer_request" && item.responses && item.responses.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-3">Responses</p>
                                            <div className="space-y-3">
                                                {item.responses.map((response, idx) => (
                                                    <div key={idx} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {response.responder?.name || "Admin"}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(response.createdAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm text-gray-700">{response.message}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setRequestToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Item"
                message={(() => {
                    const item = allItems.find(i => i._id === requestToDelete);
                    const itemType = item?.itemType === "contact_form" ? "contact form" : "customer request";
                    return `Are you sure you want to delete this ${itemType}? This action cannot be undone.`;
                })()}
                confirmText="Delete"
                variant="danger"
                isLoading={isDeleting}
            />
        </AdminLayout>
    );
};

export default CustomerRequests;

