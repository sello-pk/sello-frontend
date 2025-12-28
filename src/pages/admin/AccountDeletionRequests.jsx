import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { usePolling } from "../../hooks/usePolling";
import {
  useGetAllDeletionRequestsQuery,
  useReviewDeletionRequestMutation,
  useGetDeletionRequestStatsQuery,
} from "../../redux/services/adminApi";
import Spinner from "../../components/Spinner";
import { TableSkeleton } from "../../components/Skeleton";
import Pagination from "../../components/admin/Pagination";
import FilterPanel from "../../components/admin/FilterPanel";
import DataTable from "../../components/admin/DataTable";
import Tooltip from "../../components/admin/Tooltip";
import {
  notifyActionSuccess,
  notifyActionError,
  notifyError,
} from "../../utils/notifications";
import {
  FiSearch,
  FiCheck,
  FiX,
  FiEye,
  FiClock,
  FiUser,
  FiCalendar,
  FiAlertTriangle,
} from "react-icons/fi";
import { MdDeleteForever, MdCheckCircle, MdCancel } from "react-icons/md";
import ConfirmModal from "../../components/admin/ConfirmModal";
import toast from "react-hot-toast";

const AccountDeletionRequests = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [requestToReview, setRequestToReview] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // Build query params - memoized to prevent unnecessary re-renders
  const queryParams = useMemo(
    () => ({
      page,
      limit: 20,
      search,
      ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
    }),
    [page, search, statusFilter]
  );

  const { data, isLoading, refetch } =
    useGetAllDeletionRequestsQuery(queryParams);
  const [reviewDeletionRequest] = useReviewDeletionRequestMutation();
  const { data: statsData, isLoading: statsLoading } =
    useGetDeletionRequestStatsQuery();

  // Enable polling for real-time updates (every 30 seconds)
  usePolling(refetch, 30000, true);

  const deletionRequests = data?.requests || [];
  const pagination = data?.pagination || {};
  const stats = statsData?.stats || {
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
  };

  const handleReviewRequest = useCallback((request, action) => {
    setRequestToReview(request);
    setReviewAction(action);
    setReviewNotes("");
    setShowReviewModal(true);
  }, []);

  const handleReviewConfirm = useCallback(async () => {
    if (!requestToReview || !reviewAction) return;
    setIsReviewing(true);
    try {
      await reviewDeletionRequest({
        requestId: requestToReview._id,
        status: reviewAction,
        reviewNotes: reviewNotes.trim() || null,
      }).unwrap();

      notifyActionSuccess(
        reviewAction === "approved" ? "approved and deleted" : "rejected",
        "Account deletion request"
      );
      refetch();
      setShowReviewModal(false);
      setRequestToReview(null);
      setReviewAction(null);
      setReviewNotes("");
    } catch (error) {
      notifyActionError("process", "account deletion request", error);
    } finally {
      setIsReviewing(false);
    }
  }, [
    requestToReview,
    reviewAction,
    reviewNotes,
    reviewDeletionRequest,
    refetch,
  ]);

  const handleViewDetails = useCallback((request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: FiClock,
        text: "Pending",
      },
      approved: {
        color: "bg-green-100 text-green-800",
        icon: MdCheckCircle,
        text: "Approved",
      },
      rejected: {
        color: "bg-red-100 text-red-800",
        icon: MdCancel,
        text: "Rejected",
      },
      completed: {
        color: "bg-gray-100 text-gray-800",
        icon: FiCheck,
        text: "Completed",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon size={12} />
        {config.text}
      </span>
    );
  };

  const getReasonText = (reason) => {
    const reasons = {
      no_longer_needed: "No longer needed",
      privacy_concerns: "Privacy concerns",
      found_alternative: "Found alternative service",
      poor_experience: "Poor experience",
      data_concerns: "Data concerns",
      account_security: "Account security",
      other: "Other",
    };
    return reasons[reason] || reason;
  };

  const columns = [
    {
      key: "user",
      label: "User",
      render: (request) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <FiUser className="text-primary-600" size={14} />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {request.user?.name}
            </div>
            <div className="text-sm text-gray-500">{request.user?.email}</div>
            <div className="text-xs text-gray-400 capitalize">
              {request.user?.role}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      render: (request) => (
        <div>
          <div className="font-medium text-gray-900">
            {getReasonText(request.reason)}
          </div>
          {request.additionalComments && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {request.additionalComments}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (request) => getStatusBadge(request.status),
    },
    {
      key: "createdAt",
      label: "Requested",
      render: (request) => (
        <div className="text-sm text-gray-900">
          {new Date(request.createdAt).toLocaleDateString()}
          <div className="text-xs text-gray-500">
            {new Date(request.createdAt).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: "reviewedAt",
      label: "Reviewed",
      render: (request) =>
        request.reviewedAt ? (
          <div className="text-sm text-gray-900">
            {new Date(request.reviewedAt).toLocaleDateString()}
            <div className="text-xs text-gray-500">
              {request.reviewedBy?.name}
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Not reviewed</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (request) => (
        <div className="flex items-center gap-2">
          <Tooltip content="View details">
            <button
              onClick={() => handleViewDetails(request)}
              className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <FiEye size={14} />
            </button>
          </Tooltip>

          {request.status === "pending" && (
            <>
              <Tooltip content="Approve and delete account">
                <button
                  onClick={() => handleReviewRequest(request, "approved")}
                  className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <FiCheck size={14} />
                </button>
              </Tooltip>
              <Tooltip content="Reject request">
                <button
                  onClick={() => handleReviewRequest(request, "rejected")}
                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiX size={14} />
                </button>
              </Tooltip>
            </>
          )}
        </div>
      ),
    },
  ];

  const filterOptions = [
    {
      key: "status",
      label: "Status",
      type: "select",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "all", label: "All Status" },
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "completed", label: "Completed" },
      ],
    },
    {
      key: "search",
      label: "Search",
      type: "search",
      value: search,
      onChange: setSearch,
      placeholder: "Search by name or email...",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Account Deletion Requests
            </h1>
            <p className="text-sm text-gray-700 mt-1">
              Manage user account deletion requests
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FiClock className="text-yellow-600" size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.approved}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MdCheckCircle className="text-green-600" size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.rejected}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <MdCancel className="text-red-600" size={20} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-600">
                  {stats.completed}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FiCheck className="text-gray-600" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <FilterPanel options={filterOptions} />

        {/* Data Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          {isLoading ? (
            <TableSkeleton />
          ) : deletionRequests.length === 0 ? (
            <div className="text-center py-12">
              <MdDeleteForever className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No deletion requests found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter !== "all" || search
                  ? "Try adjusting your filters or search criteria"
                  : "No account deletion requests have been submitted yet"}
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={deletionRequests}
              keyField="_id"
            />
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={pagination.pages}
            onPageChange={setPage}
          />
        )}

        {/* Review Confirmation Modal */}
        {showReviewModal && requestToReview && (
          <ConfirmModal
            isOpen={showReviewModal}
            onClose={() => {
              setShowReviewModal(false);
              setRequestToReview(null);
              setReviewAction(null);
              setReviewNotes("");
            }}
            onConfirm={handleReviewConfirm}
            title={`${
              reviewAction === "approved" ? "Approve" : "Reject"
            } Deletion Request`}
            message={
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Are you sure you want to{" "}
                    {reviewAction === "approved"
                      ? "approve and delete the account"
                      : "reject"}{" "}
                    for:
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">{requestToReview.user?.name}</p>
                    <p className="text-sm text-gray-600">
                      {requestToReview.user?.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      Role: {requestToReview.user?.role}
                    </p>
                  </div>
                </div>

                {reviewAction === "approved" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-800">
                      <FiAlertTriangle size={16} />
                      <span className="font-medium">Warning</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      This action will permanently delete the user account and
                      all associated data including listings, chats, and other
                      information. This cannot be undone.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes (optional)
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="Add any notes about this decision..."
                  />
                </div>
              </div>
            }
            confirmText={
              reviewAction === "approved"
                ? "Approve & Delete"
                : "Reject Request"
            }
            confirmClass={
              reviewAction === "approved"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-yellow-600 hover:bg-yellow-700"
            }
            isLoading={isReviewing}
          />
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedRequest && (
          <ConfirmModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedRequest(null);
            }}
            onConfirm={() => setShowDetailsModal(false)}
            title="Deletion Request Details"
            message={
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      User Information
                    </p>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Name:</span>{" "}
                        {selectedRequest.user?.name}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Email:</span>{" "}
                        {selectedRequest.user?.email}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Role:</span>{" "}
                        {selectedRequest.user?.role}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Member Since:</span>{" "}
                        {new Date(
                          selectedRequest.user?.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Request Information
                    </p>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span>{" "}
                        {getReasonText(selectedRequest.reason)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Status:</span>{" "}
                        {getStatusBadge(selectedRequest.status)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Requested:</span>{" "}
                        {new Date(
                          selectedRequest.createdAt
                        ).toLocaleDateString()}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">IP Address:</span>{" "}
                        {selectedRequest.ipAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedRequest.additionalComments && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Additional Comments
                    </p>
                    <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                      {selectedRequest.additionalComments}
                    </p>
                  </div>
                )}

                {selectedRequest.reviewNotes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Review Notes
                    </p>
                    <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                      {selectedRequest.reviewNotes}
                    </p>
                  </div>
                )}
              </div>
            }
            confirmText="Close"
            confirmClass="bg-gray-600 hover:bg-gray-700"
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AccountDeletionRequests;
