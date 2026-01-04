import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { FaTimes, FaSpinner, FaPaperPlane } from "react-icons/fa";
import { API_BASE_URL } from "../../../redux/config";
import { getAccessToken } from "../../../utils/tokenRefresh";

const InviteUserModal = ({ isOpen, onClose, onInviteSuccess, roles }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "",
    roleId: "",
  });
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        role: "",
        roleId: "",
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "role") {
      // Find the selected role object to get its ID
      // Try matching by name, displayName, or _id
      const selectedRole = roles.find(
        (r) => r.name === value || r.displayName === value || r._id === value
      );
      setFormData((prev) => ({
        ...prev,
        role: selectedRole
          ? selectedRole.displayName || selectedRole.name
          : value,
        roleId: selectedRole ? selectedRole._id : "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName?.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!formData.email?.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    // Phone is optional - removed required validation
    if (!formData.role) {
      toast.error("Please select a user role");
      return;
    }

    setLoading(true);
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        setLoading(false);
        return;
      }

      // Prepare data to send - use roleId if available, otherwise use role name
      const inviteData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        role: formData.role, // Role name/displayName
        roleId: formData.roleId || null, // Role ID from database
      };

      const response = await axios.post(
        `${API_BASE_URL}/roles/invite`,
        inviteData,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Always show invite URL if available
        if (response.data.inviteUrl) {
          // Copy to clipboard
          try {
            await navigator.clipboard.writeText(response.data.inviteUrl);
            toast.success("Invite URL copied to clipboard!", {
              duration: 3000,
            });
          } catch (err) {
            // Failed to copy to clipboard
          }

          // Show different messages based on email status
          if (response.data.emailSent) {
            toast.success(
              "Invitation sent successfully! Invite URL copied to clipboard.",
              {
                duration: 5000,
              }
            );
          } else {
            toast.error(
              "Email was NOT sent. Invite URL copied to clipboard - please share it manually.",
              {
                duration: 8000,
                icon: "⚠️",
              }
            );

            // Also show the URL in a more visible way
            setTimeout(() => {
              toast(
                <div>
                  <p className="font-semibold mb-2">
                    Invite URL (copied to clipboard):
                  </p>
                  <p className="text-xs break-all bg-gray-100 p-2 rounded">
                    {response.data.inviteUrl}
                  </p>
                </div>,
                {
                  duration: 15000,
                  style: { maxWidth: "500px" },
                  icon: "ℹ️",
                }
              );
            }, 1000);
          }
        } else {
          // Fallback if no URL in response
          if (response.data.warning) {
            toast.error(response.data.message || "Email could not be sent", {
              duration: 5000,
            });
          } else {
            toast.success("Invitation created successfully!");
          }
        }

        onInviteSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Invite error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to send invitation";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Invite New User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. john@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Phone Number{" "}
              <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +1234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              User Role
            </label>
            <div className="relative">
              <select
                name="role"
                value={formData.roleId || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.displayName || role.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The user will inherit all permissions associated with this role.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-500 hover:opacity-90 text-white rounded-lg font-medium shadow-md hover:shadow-lg transform active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <FaPaperPlane size={14} /> Send Invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteUserModal;
