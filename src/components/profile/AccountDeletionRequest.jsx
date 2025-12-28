import React, { useState } from "react";
import { FiAlertTriangle, FiX, FiCheck } from "react-icons/fi";
import {
  useCreateDeletionRequestMutation,
  useGetDeletionRequestStatusQuery,
} from "../../redux/services/api";
import toast from "react-hot-toast";

const AccountDeletionRequest = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reason, setReason] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [createDeletionRequest, { isLoading }] =
    useCreateDeletionRequestMutation();

  // Check if user already has a deletion request
  const { data: requestStatus } = useGetDeletionRequestStatusQuery(undefined, {
    skip: !showModal,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason) {
      toast.error("Please select a reason for deletion");
      return;
    }

    try {
      await createDeletionRequest({
        reason,
        additionalComments: additionalComments.trim() || null,
      }).unwrap();

      toast.success("Account deletion request submitted successfully");
      setShowModal(false);
      setShowConfirmModal(false);
      setReason("");
      setAdditionalComments("");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to submit deletion request");
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setReason("");
    setAdditionalComments("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowConfirmModal(false);
    setReason("");
    setAdditionalComments("");
  };

  const handleConfirmRequest = () => {
    setShowConfirmModal(true);
  };

  const reasons = [
    { value: "no_longer_needed", label: "No longer need the service" },
    { value: "privacy_concerns", label: "Privacy concerns" },
    { value: "found_alternative", label: "Found an alternative service" },
    { value: "poor_experience", label: "Poor experience with the platform" },
    { value: "data_concerns", label: "Concerns about data usage" },
    { value: "account_security", label: "Account security concerns" },
    { value: "other", label: "Other" },
  ];

  if (requestStatus?.status === "pending") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FiAlertTriangle className="text-yellow-600" size={20} />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-800">
              Deletion Request Pending
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              Your account deletion request is under review. You submitted it on{" "}
              {new Date(requestStatus.createdAt).toLocaleDateString()}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (requestStatus?.status === "approved") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FiAlertTriangle className="text-red-600" size={20} />
          <div className="flex-1">
            <h4 className="font-medium text-red-800">
              Account Deletion Approved
            </h4>
            <p className="text-sm text-red-700 mt-1">
              Your account deletion request has been approved and will be
              processed shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (requestStatus?.status === "rejected") {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FiX className="text-gray-600" size={20} />
          <div className="flex-1">
            <h4 className="font-medium text-gray-800">
              Deletion Request Rejected
            </h4>
            <p className="text-sm text-gray-700 mt-1">
              Your account deletion request was reviewed and rejected.{" "}
              {requestStatus.reviewNotes &&
                `Reason: ${requestStatus.reviewNotes}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Account Management
        </h3>
        <div className="space-y-4">
          <div className="border-l-4 border-red-500 pl-4">
            <p className="text-sm text-gray-600 mb-2">Delete Your Account</p>
            <p className="text-xs text-gray-500 mb-3">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
            >
              Request Account Deletion
            </button>
          </div>
        </div>
      </div>

      {/* Deletion Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX size={24} />
            </button>

            <div className="mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Request Account Deletion
              </h3>
              <p className="text-gray-600 text-center text-sm">
                This action will submit a request to permanently delete your
                account. An admin will review your request before proceeding.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for deletion <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  required
                >
                  <option value="">Select a reason</option>
                  {reasons.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional comments (optional)
                </label>
                <textarea
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                  placeholder="Please provide any additional information..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {additionalComments.length}/500 characters
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <FiAlertTriangle
                    className="text-red-600 mt-0.5 flex-shrink-0"
                    size={16}
                  />
                  <div className="text-sm text-red-700">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Your request will be reviewed by an admin</li>
                      <li>Once approved, this action cannot be undone</li>
                      <li>
                        All your data, listings, and activity will be
                        permanently deleted
                      </li>
                      <li>
                        You will lose access to your account immediately after
                        approval
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountDeletionRequest;
