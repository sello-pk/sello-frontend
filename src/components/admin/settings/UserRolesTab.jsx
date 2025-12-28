import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../routes";
import axios from "axios";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../../redux/config";
import { getAccessToken } from "../../../utils/tokenRefresh";
import { useDeleteUserMutation } from "../../../redux/services/adminApi";
import {
  FaPlus,
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaShieldAlt,
  FaUserShield,
  FaEye,
  FaUserTimes,
  FaKey,
  FaSpinner,
  FaTimes,
  FaCopy,
  FaPaperPlane,
} from "react-icons/fa";
import InviteUserModal from "./InviteUserModal";
import RoleForm from "./RoleForm";
import ConfirmModal from "../ConfirmModal";

const UserRolesTab = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("users"); // 'users' or 'roles'
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal & Form States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which user's dropdown is open
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [userToAssignRole, setUserToAssignRole] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [assigningRole, setAssigningRole] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const dropdownRefs = useRef({});
  const buttonRefs = useRef({});
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, userId: null });
  const [deleteUser] = useDeleteUserMutation();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all admin users (including team members) - fetch with high limit to get all
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        setLoading(false);
        return;
      }
      const usersRes = await axios.get(
        `${API_BASE_URL}/admin/users?role=admin&limit=1000`,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const [rolesRes, invitesRes] = await Promise.all([
        axios.get(
          `${API_BASE_URL}/roles`,
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        axios.get(
          `${API_BASE_URL}/roles/invites/all`,
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      ]);

      if (usersRes.data.success) {
        // Extract users array from response - the API returns { data: { users: [], pagination: {} } }
        const usersData = usersRes.data.data?.users || [];
        // Filter to ensure we only show admin users (role='admin' or have adminRole)
        const adminUsers = usersData.filter(
          (user) =>
            user.role === "admin" || (user.adminRole && user.adminRole !== null)
        );
        setUsers(adminUsers);
      } else {
        toast.error(usersRes.data?.message || "Failed to load admin users");
      }

      if (rolesRes.data.success) {
        const rolesData = rolesRes.data.data || rolesRes.data || [];
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      }

      if (invitesRes.data.success) {
        const invitesData = invitesRes.data.data || invitesRes.data || [];
        setInvites(Array.isArray(invitesData) ? invitesData : []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!openDropdown) return;

      const dropdownElement = dropdownRefs.current[openDropdown];
      const buttonElement = buttonRefs.current[openDropdown];
      
      // Check if click is on the dropdown button or inside the dropdown
      const isDropdownButton = buttonElement && buttonElement.contains(event.target);
      const isInsideDropdown = dropdownElement && dropdownElement.contains(event.target);

      // If click is outside both the dropdown and the button, close it
      if (!isDropdownButton && !isInsideDropdown) {
        setOpenDropdown(null);
        setDropdownPosition({ top: 0, left: 0, userId: null });
      }
    };

    if (openDropdown) {
      // Small delay to avoid immediate closure when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openDropdown]);

  // Update dropdown position on scroll/resize
  useEffect(() => {
    if (!openDropdown || !dropdownPosition.userId) return;

    const updatePosition = () => {
      const button = buttonRefs.current[dropdownPosition.userId];
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const dropdownWidth = 192;
      const dropdownHeight = 200;
      const gap = 8;
      
      let top = rect.bottom + gap;
      let left = rect.right - dropdownWidth;
      
      // Check if dropdown would go off-screen to the right
      if (left < 0) {
        left = rect.left;
      }
      
      // Check if dropdown would go off-screen to the bottom
      const viewportHeight = window.innerHeight;
      if (top + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - gap;
        if (top < 0) {
          top = viewportHeight - dropdownHeight - 10;
        }
      }
      
      setDropdownPosition(prev => ({ ...prev, top, left }));
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [openDropdown, dropdownPosition.userId]);

  const handleEditRole = (role) => {
    setEditingRole(role);
    setIsRoleFormOpen(true);
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setIsRoleFormOpen(true);
  };

  const handleCloneRole = (role) => {
    const clonedRole = {
      ...role,
      displayName: `${role.displayName} (Copy)`,
      name: `${role.name}-copy-${Date.now()}`,
      _id: undefined,
      isPreset: false,
    };
    setEditingRole(clonedRole);
    setIsRoleFormOpen(true);
  };

  const handleDeleteRole = (roleId) => {
    setRoleToDelete(roleId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        return;
      }
      const response = await axios.delete(
        `${API_BASE_URL}/roles/${roleToDelete}`,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Role deleted successfully");
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete role");
    } finally {
      setShowDeleteModal(false);
      setRoleToDelete(null);
    }
  };

  const handleRoleFormSuccess = () => {
    setIsRoleFormOpen(false);
    setEditingRole(null);
    fetchData();
  };

  const handleViewUser = (user) => {
    setOpenDropdown(null);
    // Navigate to admin users page with user ID to view details
    navigate(ROUTES.admin.userDetail(user._id));
  };

  const handleDropdownToggle = (userId, event) => {
    event.stopPropagation();
    
    if (openDropdown === userId) {
      setOpenDropdown(null);
      setDropdownPosition({ top: 0, left: 0, userId: null });
    } else {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const dropdownWidth = 192; // w-48 = 192px
      const dropdownHeight = 200; // Approximate height
      const gap = 8; // mt-2 = 8px
      
      // Calculate position: below the button, aligned to the right
      let top = rect.bottom + gap;
      let left = rect.right - dropdownWidth;
      
      // Check if dropdown would go off-screen to the right
      if (left < 0) {
        left = rect.left; // Align to left edge of button
      }
      
      // Check if dropdown would go off-screen to the bottom
      const viewportHeight = window.innerHeight;
      if (top + dropdownHeight > viewportHeight) {
        // Position above the button instead
        top = rect.top - dropdownHeight - gap;
        // If still off-screen at top, position at bottom of viewport
        if (top < 0) {
          top = viewportHeight - dropdownHeight - 10;
        }
      }
      
      setDropdownPosition({ top, left, userId });
      setOpenDropdown(userId);
    }
  };

  const handleEditUserRole = async (user) => {
    setOpenDropdown(null);

    // Wait a bit for roles to be loaded if they're not yet
    if (roles.length === 0) {
      toast.error("Roles are still loading. Please try again in a moment.");
      return;
    }

    // Find user's role by multiple methods
    let userRole = null;

    // Method 1: Match by roleId (ObjectId comparison - convert both to strings)
    if (user.roleId) {
      const roleIdStr = user.roleId.toString();
      userRole = roles.find((r) => {
        const rIdStr = r._id?.toString();
        return rIdStr === roleIdStr;
      });
    }

    // Method 2: Match by adminRole against displayName (exact match)
    if (!userRole && user.adminRole) {
      userRole = roles.find(
        (r) => r.displayName === user.adminRole || r.name === user.adminRole
      );
    }

    // Method 3: Case-insensitive match
    if (!userRole && user.adminRole) {
      const adminRoleLower = user.adminRole.toLowerCase();
      userRole = roles.find(
        (r) =>
          r.displayName?.toLowerCase() === adminRoleLower ||
          r.name?.toLowerCase() === adminRoleLower
      );
    }

    if (userRole) {
      // User has a role - edit the role definition
      setEditingRole(userRole);
      setIsRoleFormOpen(true);
    } else {
      // User doesn't have a role - show assign role modal
      setUserToAssignRole(user);
      setShowAssignRoleModal(true);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRoleId || !userToAssignRole) {
      toast.error("Please select a role");
      return;
    }

    setAssigningRole(true);
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        setAssigningRole(false);
        return;
      }
      const selectedRole = roles.find(
        (r) => r._id.toString() === selectedRoleId
      );

      if (!selectedRole) {
        toast.error("Selected role not found");
        return;
      }

      // Update user's role via admin API
      const response = await axios.put(
        `${API_BASE_URL}/admin/users/${userToAssignRole._id}`,
        {
          adminRole: selectedRole.displayName || selectedRole.name,
          roleId: selectedRoleId,
          permissions: selectedRole.permissions || {},
        },
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success(
          `Role "${
            selectedRole.displayName || selectedRole.name
          }" assigned successfully!`
        );
        setShowAssignRoleModal(false);
        setUserToAssignRole(null);
        setSelectedRoleId("");
        fetchData(); // Refresh the user list
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Assign role error:", error);
      }
      toast.error(error.response?.data?.message || "Failed to assign role");
    } finally {
      setAssigningRole(false);
    }
  };

  const handleRemoveFromTeam = (user) => {
    setOpenDropdown(null);
    setUserToDelete(user._id);
    setShowDeleteUserModal(true);
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await deleteUser(userToDelete).unwrap();
      toast.success("User deleted successfully");
      fetchData();
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Failed to delete user");
    } finally {
      setIsDeletingUser(false);
      setShowDeleteUserModal(false);
      setUserToDelete(null);
    }
  };

  const handleResetPassword = (user) => {
    toast.info(`Reset password for ${user.name} - Feature coming soon`);
    setOpenDropdown(null);
    // You can implement this functionality
  };

  if (isRoleFormOpen) {
    return (
      <RoleForm
        role={editingRole}
        onSuccess={handleRoleFormSuccess}
        onCancel={() => setIsRoleFormOpen(false)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex space-x-4 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSection("users")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeSection === "users"
                ? "bg-white text-primary-500 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
            aria-label="Switch to User Management section"
            aria-pressed={activeSection === "users"}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveSection("roles")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeSection === "roles"
                ? "bg-white text-primary-500 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
            aria-label="Switch to Roles & Permissions section"
            aria-pressed={activeSection === "roles"}
          >
            Roles & Permissions
          </button>
        </div>

        {activeSection === "users" ? (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 bg-primary-500 hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            aria-label="Invite a new user to the team"
          >
            <FaUserPlus aria-hidden="true" /> Invite User
          </button>
        ) : (
          <button
            onClick={handleCreateRole}
            className="flex items-center gap-2 bg-primary-500 hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            aria-label="Create a new role"
          >
            <FaPlus aria-hidden="true" /> New Role
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* USERS SECTION */}
          {activeSection === "users" && (
            <div className="space-y-8">
              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Active Users Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-gray-800">Team Members</h3>
                </div>
                <div className="overflow-x-auto overflow-y-visible">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                        <th className="px-6 py-3 font-semibold">User</th>
                        <th className="px-6 py-3 font-semibold">Email</th>
                        <th className="px-6 py-3 font-semibold">Role</th>
                        <th className="px-6 py-3 font-semibold">Joined</th>
                        <th className="px-6 py-3 font-semibold">Number</th>
                        <th className="px-6 py-3 font-semibold text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(() => {
                        const filteredUsers = users.filter((user) => {
                          if (!searchQuery) return true;
                          const query = searchQuery.toLowerCase();
                          return (
                            user.name?.toLowerCase().includes(query) ||
                            user.email?.toLowerCase().includes(query)
                          );
                        });

                        return filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <tr
                              key={user._id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 font-bold text-sm">
                                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                                  </div>
                                  <span className="font-medium text-gray-800">
                                    {user.name || "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-600 text-sm">
                                {user.email || "N/A"}
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {user.adminRole || user.role || "Admin"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-500 text-sm">
                                {user.createdAt
                                  ? new Date(user.createdAt).toLocaleDateString(
                                      "en-US",
                                      {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      }
                                    )
                                  : "N/A"}
                              </td>
                              <td className="px-6 py-4 text-gray-500 text-sm">
                                {user.phone || "N/A"}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="relative inline-block">
                                  <button
                                    ref={(el) => {
                                      if (el) buttonRefs.current[user._id] = el;
                                    }}
                                    onClick={(e) => handleDropdownToggle(user._id, e)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                                    aria-label="User actions menu"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="6"
                              className="px-6 py-8 text-center text-gray-500"
                            >
                              {searchQuery
                                ? "No users found matching your search."
                                : "No team members found."}
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Invites Table */}
              {invites.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800">
                      Pending Invitations
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                          <th className="px-6 py-3 font-semibold">Email</th>
                          <th className="px-6 py-3 font-semibold">Role</th>
                          <th className="px-6 py-3 font-semibold">Sent By</th>
                          <th className="px-6 py-3 font-semibold">Sent Date</th>
                          <th className="px-6 py-3 font-semibold">Status</th>
                          <th className="px-6 py-3 font-semibold text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invites.map((invite) => {
                          // Construct invite URL
                          const frontendUrl =
                            import.meta.env.VITE_FRONTEND_URL ||
                            (typeof window !== "undefined"
                              ? window.location.origin
                              : "") ||
                            import.meta.env.VITE_API_URL?.replace("/api", "") ||
                            "http://localhost:5173";
                          const inviteUrl = invite.token
                            ? `${frontendUrl}/accept-invite/${invite.token}`
                            : null;

                          const handleCopyInviteUrl = async () => {
                            if (!inviteUrl) {
                              toast.error("Invite URL not available");
                              return;
                            }

                            try {
                              await navigator.clipboard.writeText(inviteUrl);
                              toast.success("Invite URL copied to clipboard!", {
                                duration: 3000,
                              });

                              // Also show the URL in a toast
                              setTimeout(() => {
                                toast.info(
                                  <div>
                                    <p className="font-semibold mb-2">
                                      Invite URL (copied):
                                    </p>
                                    <p className="text-xs break-all bg-gray-100 p-2 rounded">
                                      {inviteUrl}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                      Share this URL with {invite.email}
                                    </p>
                                  </div>,
                                  {
                                    duration: 15000,
                                    style: { maxWidth: "500px" },
                                  }
                                );
                              }, 500);
                            } catch (err) {
                              console.error("Failed to copy:", err);
                              // Fallback: show the URL in an alert
                              toast.info(
                                <div>
                                  <p className="font-semibold mb-2">
                                    Invite URL:
                                  </p>
                                  <p className="text-xs break-all bg-gray-100 p-2 rounded">
                                    {inviteUrl}
                                  </p>
                                </div>,
                                {
                                  duration: 20000,
                                  style: { maxWidth: "500px" },
                                }
                              );
                            }
                          };

                          return (
                            <tr
                              key={invite._id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 text-gray-800 font-medium text-sm">
                                {invite.email}
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {invite.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-500 text-sm">
                                {invite.invitedBy?.name || "Unknown"}
                              </td>
                              <td className="px-6 py-4 text-gray-500 text-sm">
                                {new Date(
                                  invite.createdAt
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    invite.status === "pending"
                                      ? "bg-primary-100 text-primary-500"
                                      : invite.status === "accepted"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {invite.status.charAt(0).toUpperCase() +
                                    invite.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {invite.status === "pending" && inviteUrl ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={handleCopyInviteUrl}
                                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary-500 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                                      title="Copy invite URL to share with user"
                                    >
                                      <FaCopy size={12} /> Copy URL
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">
                                    -
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ROLES SECTION */}
          {activeSection === "roles" && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search roles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Roles Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                        <th className="px-6 py-3 font-semibold">Role Name</th>
                        <th className="px-6 py-3 font-semibold">Description</th>
                        <th className="px-6 py-3 font-semibold text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {roles
                        .filter((role) => {
                          if (!searchQuery) return true;
                          const query = searchQuery.toLowerCase();
                          return (
                            role.displayName?.toLowerCase().includes(query) ||
                            role.name?.toLowerCase().includes(query) ||
                            role.purpose?.toLowerCase().includes(query)
                          );
                        })
                        .map((role) => (
                          <tr
                            key={role._id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">
                                  {role.displayName || role.name}
                                </span>
                                {role.isPreset && (
                                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200">
                                    System
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600 text-sm">
                              {role.purpose ||
                                role.description ||
                                "No description"}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditRole(role)}
                                  className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                  title="Edit"
                                >
                                  <FaEdit size={14} />
                                </button>
                                <button
                                  onClick={() => handleCloneRole(role)}
                                  className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                  title="Clone"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                </button>
                                {!role.isPreset && (
                                  <button
                                    onClick={() => handleDeleteRole(role._id)}
                                    className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                                    title="Delete"
                                  >
                                    <FaTrash size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      {roles.filter((role) => {
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        return (
                          role.displayName?.toLowerCase().includes(query) ||
                          role.name?.toLowerCase().includes(query) ||
                          role.purpose?.toLowerCase().includes(query)
                        );
                      }).length === 0 && (
                        <tr>
                          <td
                            colSpan="3"
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            {searchQuery
                              ? "No roles found matching your search."
                              : "No roles found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteSuccess={fetchData}
        roles={roles}
      />

      {/* Delete Role Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setRoleToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone. Users with this role will need to be reassigned."
        confirmText="Delete"
        variant="danger"
      />

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteUserModal}
        onClose={() => {
          setShowDeleteUserModal(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUserConfirm}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone. All associated data will be permanently deleted."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeletingUser}
      />

      {/* Assign Role Modal */}
      {showAssignRoleModal && userToAssignRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                Assign Role to {userToAssignRole.name}
              </h3>
              <button
                onClick={() => {
                  setShowAssignRoleModal(false);
                  setUserToAssignRole(null);
                  setSelectedRoleId("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={assigningRole}
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-sm">
                This user doesn't have a role assigned. Please select a role
                from the list below.
              </p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                    disabled={assigningRole}
                  >
                    <option value="">Choose a role...</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.displayName || role.name}{" "}
                        {role.purpose ? `- ${role.purpose}` : ""}
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
              </div>

              {selectedRoleId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> The user will inherit all permissions
                    associated with the selected role.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAssignRoleModal(false);
                  setUserToAssignRole(null);
                  setSelectedRoleId("");
                }}
                disabled={assigningRole}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRole}
                disabled={assigningRole || !selectedRoleId}
                className="px-6 py-2 bg-primary-500 hover:opacity-90 text-white rounded-lg font-medium shadow-md hover:shadow-lg transform active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {assigningRole ? (
                  <>
                    <FaSpinner className="animate-spin" /> Assigning...
                  </>
                ) : (
                  <>
                    <FaUserPlus size={14} /> Assign Role
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portal Dropdown - Rendered outside scrollable container */}
      {openDropdown && dropdownPosition.userId && (() => {
        const user = users.find(u => u._id === dropdownPosition.userId);
        if (!user) return null;

        return createPortal(
          <div
            ref={(el) => {
              if (el) dropdownRefs.current[dropdownPosition.userId] = el;
            }}
            className="fixed w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] py-1"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto'
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewUser(user);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
            >
              <FaEye size={14} />
              View Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditUserRole(user);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
            >
              <FaEdit size={14} />
              Edit Role
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResetPassword(user);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
            >
              <FaKey size={14} />
              Reset Password
            </button>
            <hr className="my-1 border-gray-200" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFromTeam(user);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <FaTrash size={14} />
              Delete User
            </button>
          </div>,
          document.body
        );
      })()}
    </div>
  );
};

export default UserRolesTab;
