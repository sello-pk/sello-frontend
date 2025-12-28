import React, { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes";
import { useGetAllContactFormsQuery, useConvertToChatMutation, useUpdateContactFormStatusMutation, useDeleteContactFormMutation } from "../../redux/services/adminApi";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import { FiSearch, FiTrash2, FiMessageSquare, FiCheckCircle, FiClock, FiXCircle, FiRefreshCw } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import ConfirmModal from "../../components/admin/ConfirmModal";
import ActionDropdown from "../../components/admin/ActionDropdown";

const ContactFormManagement = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedForm, setSelectedForm] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [formToDelete, setFormToDelete] = useState(null);

    const queryParams = {};
    if (filterStatus !== "all") {
        queryParams.status = filterStatus;
    }
    if (searchQuery && searchQuery.trim()) {
        queryParams.search = searchQuery.trim();
    }

    const { data: formsData, isLoading, error, refetch } = useGetAllContactFormsQuery(queryParams, {
        refetchOnMountOrArgChange: true,
        pollingInterval: 30000, // Poll every 30 seconds for new forms
    });

    const [convertToChat] = useConvertToChatMutation();
    const [updateStatus] = useUpdateContactFormStatusMutation();
    const [deleteForm] = useDeleteContactFormMutation();

    // Handle response structure: 
    // Backend returns: { success: true, data: { contactForms: [...], pagination: {...} } }
    // transformResponse extracts data, so formsData should be { contactForms: [...], pagination: {...} }
    const contactForms = React.useMemo(() => {
        if (!formsData) return [];
        
        // Case 1: formsData is { contactForms: [...], pagination: {...} }
        if (formsData.contactForms && Array.isArray(formsData.contactForms)) {
            return formsData.contactForms;
        }
        
        // Case 2: formsData is already an array
        if (Array.isArray(formsData)) {
            return formsData;
        }
        
        // Case 3: Nested data structure
        if (formsData.data) {
            if (Array.isArray(formsData.data.contactForms)) {
                return formsData.data.contactForms;
            }
            if (Array.isArray(formsData.data)) {
                return formsData.data;
            }
        }
        
        return [];
    }, [formsData]);


    const handleConvertToChat = async (formId) => {
        try {
            const result = await convertToChat(formId).unwrap();
            toast.success("Contact form converted to chat successfully!");
            refetch();
            if (result?.data?.chat?._id) {
                // Ensure chatId is a string
                const chatId = typeof result.data.chat._id === 'string'
                    ? result.data.chat._id
                    : result.data.chat._id.toString();
                // Redirect to support chat with the new chat ID
                navigate(`/admin/chat/${chatId}`);
            }
        } catch (error) {
            toast.error(error?.data?.message || "Failed to convert to chat");
        }
    };

    const handleStatusChange = async (formId, status) => {
        try {
            await updateStatus({ id: formId, status }).unwrap();
            toast.success("Status updated successfully");
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update status");
        }
    };

    const handleDelete = (formId) => {
        setFormToDelete(formId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!formToDelete) return;
        try {
            await deleteForm(formToDelete).unwrap();
            toast.success("Contact form deleted successfully");
            // Refetch to update the list
            await refetch();
        } catch (error) {
            toast.error(error?.data?.message || error?.message || "Failed to delete contact form");
        } finally {
            setShowDeleteModal(false);
            setFormToDelete(null);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "new":
                return <FiClock className="text-blue-500" />;
            case "in_progress":
                return <FiMessageSquare className="text-yellow-500" />;
            case "resolved":
                return <FiCheckCircle className="text-green-500" />;
            default:
                return <FiXCircle className="text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "new":
                return "bg-blue-100 text-blue-800";
            case "in_progress":
                return "bg-yellow-100 text-yellow-800";
            case "resolved":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Contact Form Management</h1>
                        <p className="text-gray-600">
                            Manage and respond to contact form submissions
                            {contactForms.length > 0 && (
                                <span className="ml-2 text-primary-500 font-semibold">
                                    ({contactForms.length} {contactForms.length === 1 ? 'form' : 'forms'})
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh"
                        >
                            <FiRefreshCw className={isLoading ? "animate-spin" : ""} size={18} />
                            <span className="hidden md:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or subject..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366] dark:bg-gray-700 dark:text-white"
                        >
                            <option value="all">All Status</option>
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800 text-sm font-semibold mb-2">Error loading contact forms</p>
                        <p className="text-red-700 text-sm mb-2">
                            {error?.data?.message || error?.message || "Unknown error occurred"}
                        </p>
                        {error?.status && (
                            <p className="text-red-600 text-xs mb-2">Status: {error.status}</p>
                        )}
                        <button
                            onClick={() => refetch()}
                            className="mt-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}


                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Spinner fullScreen={false} />
                        </div>
                    ) : contactForms.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-2">No contact forms found</p>
                            <p className="text-sm text-gray-400">
                                {searchQuery || filterStatus !== "all" 
                                    ? "Try adjusting your search or filter criteria" 
                                    : "Contact form submissions will appear here"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Subject
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Message
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contactForms.map((form) => (
                                        <tr
                                            key={form._id}
                                            className={`hover:bg-gray-50 cursor-pointer ${
                                                selectedForm === form._id ? "bg-blue-50" : ""
                                            }`}
                                            onClick={() => setSelectedForm(selectedForm === form._id ? null : form._id)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {form.firstName} {form.lastName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{form.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                                    {form.subject}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                                    {form.message}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {formatDistanceToNow(new Date(form.createdAt), { addSuffix: true })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                        form.status
                                                    )}`}
                                                >
                                                    {getStatusIcon(form.status)}
                                                    {form.status.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    {!form.chatId && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleConvertToChat(form._id);
                                                            }}
                                                            className="text-primary-500 hover:text-primary-500 flex items-center gap-1"
                                                            title="Convert to Chat"
                                                        >
                                                    )}
                                                    <select
                                                        value={form.status}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusChange(form._id, e.target.value);
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                                    >
                                                        <option value="new">New</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="resolved">Resolved</option>
                                                    </select>
                                                    <ActionDropdown
                                                        onDelete={() => handleDelete(form._id)}
                                                        item={form}
                                                        itemName="contact form"
                                                        deleteConfirmMessage="Are you sure you want to delete this contact form? This action cannot be undone."
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Selected Form Details */}
                {selectedForm && (
                    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        {(() => {
                            const form = contactForms.find(f => f._id === selectedForm);
                            if (!form) return null;
                            return (
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Contact Form Details</h3>
                                        <button
                                            onClick={() => setSelectedForm(null)}
                                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Name</label>
                                            <p className="text-gray-900">{form.firstName} {form.lastName}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Email</label>
                                            <p className="text-gray-900">{form.email}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-sm font-medium text-gray-500">Subject</label>
                                            <p className="text-gray-900">{form.subject}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-sm font-medium text-gray-500">Message</label>
                                            <p className="text-gray-900 whitespace-pre-wrap">{form.message}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Status</label>
                                            <p className="text-gray-900">
                                                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(form.status)}`}>
                                                    {form.status.replace("_", " ")}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Submitted</label>
                                            <p className="text-gray-900">
                                                {new Date(form.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        {form.chatId && (
                                          <div className="col-span-2">
                                            <label className="text-sm font-medium text-gray-500">Chat</label>
                                            <button
                                              onClick={() => navigate(ROUTES.admin.supportChatWithId(
                                                typeof form.chatId === "string"
                                                  ? form.chatId
                                                  : form.chatId?._id ||
                                                    form.chatId?.toString() ||
                                                    ""
                                              ))}
                                              className="text-primary-500 hover:underline"
                                            >
                                              View Chat Conversation
                                            </button>
                                          </div>
                                        )}
                                    </div>
                                    {!form.chatId && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => handleConvertToChat(form._id)}
                                                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                                            >
                                                Convert to Chat
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setFormToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Contact Form"
                message="Are you sure you want to delete this contact form? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </AdminLayout>
    );
};

export default ContactFormManagement;

