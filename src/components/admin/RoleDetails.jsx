import { FiX, FiShield, FiAlertCircle, FiCheck } from "react-icons/fi";

const PERMISSION_GROUPS = {
  "User & Role Management": [
    "manageUsers",
    "createRoles",
    "editRoles",
    "deleteRoles",
    "inviteUsers",
    "resetPasswords",
  ],
  "Listings Management": [
    "viewListings",
    "approveListings",
    "editListings",
    "deleteListings",
    "featureListings",
  ],
  "Dealers Management": [
    "viewDealers",
    "approveDealers",
    "editDealers",
    "manageDealerSubscriptions",
    "viewDealerPerformance",
  ],
  "Content Management": [
    "manageBlogs",
    "publishBlogs",
    "moderateComments",
    "managePromotions",
    "createPushNotifications",
    "sendPushNotifications",
  ],
  "Support & Communication": [
    "accessChatbot",
    "viewChatbotLogs",
    "manageSupportTickets",
    "respondToInquiries",
    "escalateIssues",
  ],
  "Platform Settings": [
    "managePlatformSettings",
    "manageLogo",
    "manageLanguage",
    "manageCurrency",
    "manageCommission",
    "manageIntegrations",
  ],
  "Analytics & Reports": [
    "viewAnalytics",
    "viewFinancialReports",
    "exportReports",
  ],
  "Categories & Content": ["manageCategories", "manageCarTypes"],
  "Audit & Security": [
    "viewAuditLogs",
    "viewUserProfiles",
    "viewFullUserProfiles",
    "accessSensitiveAreas",
  ],
};

const RoleDetails = ({ role, isOpen, onClose }) => {
  if (!isOpen || !role) return null;

  const permissions = role.permissions || {};
  const enabledPermissions = Object.entries(permissions).filter(
    ([_, value]) => value === true
  );

  const getAccessLevelColor = (level) => {
    const colors = {
      FULL: "bg-red-100 text-red-800 border-red-200",
      MEDIUM_HIGH: "bg-primary-100 text-primary-800 border-primary-200",
      MEDIUM: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return colors[level] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FiShield className="text-primary-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {role.displayName}
              </h2>
              <p className="text-sm text-gray-500">{role.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Access Level
              </label>
              <div
                className={`mt-1 px-3 py-2 rounded-lg border ${getAccessLevelColor(
                  role.accessLevel
                )}`}
              >
                {role.accessLevel.replace("_", " ")}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Status
              </label>
              <div className="mt-1 px-3 py-2 rounded-lg border bg-gray-50 text-gray-700">
                {role.isActive ? "Active" : "Inactive"}
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
              Purpose
            </label>
            <p className="text-gray-700">{role.purpose}</p>
          </div>

          {/* Restrictions */}
          {role.restrictions && role.restrictions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <FiAlertCircle className="text-yellow-600 mt-0.5" size={20} />
                <h3 className="font-semibold text-yellow-900">
                  What this role can't do:
                </h3>
              </div>
              <ul className="text-sm text-yellow-800 space-y-1 ml-7">
                {role.restrictions.map((restriction, idx) => (
                  <li key={idx}>• {restriction}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Permissions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Permissions ({enabledPermissions.length} enabled)
              </label>
            </div>
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              {Object.entries(PERMISSION_GROUPS).map(
                ([groupName, groupPermissions]) => {
                  const groupEnabled = groupPermissions.filter(
                    (key) => permissions[key] === true
                  );
                  if (groupEnabled.length === 0) return null;

                  return (
                    <div
                      key={groupName}
                      className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                    >
                      <h4 className="font-semibold text-gray-800 mb-2">
                        {groupName}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {groupEnabled.map((key) => (
                          <div
                            key={key}
                            className="flex items-center gap-2 p-2 bg-green-50 rounded"
                          >
                            <FiCheck className="text-green-600" size={16} />
                            <span className="text-sm text-gray-700">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Disabled Permissions Summary */}
          {Object.values(permissions).filter((v) => v === false).length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>
                  {Object.values(permissions).filter((v) => v === false).length}
                </strong>{" "}
                permissions are disabled for this role.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleDetails;
