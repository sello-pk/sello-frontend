import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaSave, FaSpinner, FaGlobe, FaShieldAlt, FaCheckCircle, FaBell, FaCamera, FaUpload, FaDollarSign } from "react-icons/fa";
import Tooltip from "../Tooltip";
import { API_BASE_URL } from "../../../redux/config";
import { getAccessToken } from "../../../utils/tokenRefresh";

const ToggleSwitch = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
      checked ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-700"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const GeneralSettingsTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState({
    // General
    siteName: "",
    contactEmail: "",
    siteLogo: "", // URL - Site logo
    businessLogo: "", // URL - Keep for backward compatibility
    maxListingsPerDealer: 50,
    commissionRate: 5,
    
    // Security
    allowRegistration: true,
    requireEmailVerification: false,
    maintenanceMode: false,
    
    // Approvals
    autoApproveDealers: false,
    autoApproveListings: false,
    
    // Notifications
    enableEmailNotifications: true,
    enablePushNotifications: true,
    
    // Payment System
    paymentSystemEnabled: true,
    showSubscriptionPlans: true,
    showSubscriptionTab: true,
    showPaymentHistory: true,
    enableAutoRenewal: true,
    requirePaymentApproval: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        return;
      }
      const response = await axios.get(
        `${API_BASE_URL}/settings`,
        { 
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        const fetchedSettings = {};
        const flatSettings = response.data.data.flat || [];
        
        flatSettings.forEach(s => {
          // Convert value based on type
          let parsedValue = s.value;
          if (s.type === "boolean") {
            parsedValue = s.value === true || s.value === "true" || s.value === 1;
          } else if (s.type === "number") {
            parsedValue = Number(s.value) || 0;
          }
          fetchedSettings[s.key] = parsedValue;
        });

        setSettings(prev => ({
          ...prev,
          ...fetchedSettings,
          // If siteLogo doesn't exist but businessLogo does, use businessLogo
          siteLogo: fetchedSettings.siteLogo || fetchedSettings.businessLogo || prev.siteLogo
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Basic validation
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        setUploading(false);
        return;
      }
      const response = await axios.post(
        `${API_BASE_URL}/upload`,
        formData,
        {
          headers: { 
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        }
      );

      if (response.data.success) {
        handleChange("siteLogo", response.data.data.url);
        // Also update businessLogo for backward compatibility
        handleChange("businessLogo", response.data.data.url);
        toast.success("Site logo uploaded successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const validateSettings = () => {
    const errors = [];

    // Site name validation
    if (!settings.siteName?.trim()) {
      errors.push("Site name is required");
    } else if (settings.siteName.trim().length < 2) {
      errors.push("Site name must be at least 2 characters");
    } else if (settings.siteName.trim().length > 100) {
      errors.push("Site name must be less than 100 characters");
    }

    // Contact email validation
    if (!settings.contactEmail?.trim()) {
      errors.push("Contact email is required");
    } else if (!/^\S+@\S+\.\S+$/.test(settings.contactEmail)) {
      errors.push("Please enter a valid contact email address");
    } else if (settings.contactEmail.length > 255) {
      errors.push("Contact email must be less than 255 characters");
    }

    // Max listings per dealer validation
    if (settings.maxListingsPerDealer !== undefined) {
      const maxListings = Number(settings.maxListingsPerDealer);
      if (isNaN(maxListings) || maxListings < 1) {
        errors.push("Max listings per dealer must be at least 1");
      } else if (maxListings > 10000) {
        errors.push("Max listings per dealer cannot exceed 10,000");
      }
    }

    // Commission rate validation
    if (settings.commissionRate !== undefined) {
      const commission = Number(settings.commissionRate);
      if (isNaN(commission) || commission < 0) {
        errors.push("Commission rate cannot be negative");
      } else if (commission > 100) {
        errors.push("Commission rate cannot exceed 100%");
      }
    }

    // Logo URL validation (if provided)
    if (settings.siteLogo && settings.siteLogo.trim()) {
      try {
        new URL(settings.siteLogo);
      } catch {
        errors.push("Site logo must be a valid URL");
      }
    }

    return errors;
  };

  const handleSave = async () => {
    // Validation
    const validationErrors = validateSettings();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    setSaving(true);
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        setSaving(false);
        return;
      }
      const settingsToSave = [
        { key: "siteName", value: settings.siteName, category: "general", type: "string" },
        { key: "contactEmail", value: settings.contactEmail, category: "general", type: "string" },
        { key: "siteLogo", value: settings.siteLogo || settings.businessLogo || "", category: "general", type: "string" },
        { key: "businessLogo", value: settings.siteLogo || settings.businessLogo || "", category: "general", type: "string" }, // Backward compatibility
        { key: "maxListingsPerDealer", value: settings.maxListingsPerDealer || 50, category: "general", type: "number" },
        { key: "commissionRate", value: settings.commissionRate || 5, category: "payment", type: "number" },
        { key: "allowRegistration", value: settings.allowRegistration || false, category: "general", type: "boolean" },
        { key: "requireEmailVerification", value: settings.requireEmailVerification || false, category: "email", type: "boolean" },
        { key: "maintenanceMode", value: settings.maintenanceMode || false, category: "general", type: "boolean" },
        { key: "autoApproveDealers", value: settings.autoApproveDealers || false, category: "general", type: "boolean" },
        { key: "autoApproveListings", value: settings.autoApproveListings || false, category: "general", type: "boolean" },
        { key: "enableEmailNotifications", value: settings.enableEmailNotifications || false, category: "email", type: "boolean" },
        { key: "enablePushNotifications", value: settings.enablePushNotifications || false, category: "general", type: "boolean" },
        { key: "paymentSystemEnabled", value: settings.paymentSystemEnabled !== undefined ? settings.paymentSystemEnabled : true, category: "payment", type: "boolean" },
        { key: "showSubscriptionPlans", value: settings.showSubscriptionPlans !== undefined ? settings.showSubscriptionPlans : true, category: "payment", type: "boolean" },
        { key: "showSubscriptionTab", value: settings.showSubscriptionTab !== undefined ? settings.showSubscriptionTab : true, category: "payment", type: "boolean" },
        { key: "showPaymentHistory", value: settings.showPaymentHistory !== undefined ? settings.showPaymentHistory : true, category: "payment", type: "boolean" },
        { key: "enableAutoRenewal", value: settings.enableAutoRenewal !== undefined ? settings.enableAutoRenewal : true, category: "payment", type: "boolean" },
        { key: "requirePaymentApproval", value: settings.requirePaymentApproval !== undefined ? settings.requirePaymentApproval : false, category: "payment", type: "boolean" }
      ];

      const promises = settingsToSave.map(setting => 
        axios.post(
          `${API_BASE_URL}/settings`,
          setting,
          { 
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      );

      await Promise.all(promises);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
        <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Marketplace Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
          <FaGlobe className="text-primary-500" />
            <h3 className="font-bold text-gray-800 dark:text-white">General Settings</h3>
          </div>
            <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary-500 hover:opacity-90 text-white rounded-lg font-bold shadow-md hover:shadow-lg transform active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <FaSpinner className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <FaSave /> Save All Settings
              </>
            )}
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Upload Section */}
          <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-6 mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                {(settings.siteLogo || settings.businessLogo) ? (
                  <img src={settings.siteLogo || settings.businessLogo} alt="Site Logo" className="w-full h-full object-cover" />
                ) : (
                  <FaCamera className="text-gray-300 dark:text-gray-500 text-3xl" />
                )}
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <FaSpinner className="text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-medium text-gray-800 dark:text-white">Site Logo</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Upload your site logo. Recommended size: 512x512px. This will be displayed across the site.
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors shadow-sm">
                <FaUpload />
                <span>{uploading ? "Uploading..." : "Upload New Logo"}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                  disabled={uploading}
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Site Name
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleChange("siteName", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => handleChange("contactEmail", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Max Listings Per Dealer
            </label>
            <input
              type="number"
              value={settings.maxListingsPerDealer}
              onChange={(e) => handleChange("maxListingsPerDealer", Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Commission Rate (%)
            </label>
            <input
              type="number"
              value={settings.commissionRate}
              onChange={(e) => handleChange("commissionRate", Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Security & Access */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
          <FaShieldAlt className="text-primary-500" />
          <h3 className="font-bold text-gray-800 dark:text-white">Security & Access</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-800 dark:text-white">Allow User Registration</h4>
                <Tooltip content="When disabled, new users cannot create accounts. Only admins can invite users.">
                  <span className="text-gray-400 hover:text-gray-600 cursor-help text-sm">ℹ️</span>
                </Tooltip>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Let new users sign up for an account. When disabled, registration is blocked.</p>
            </div>
            <ToggleSwitch 
              checked={settings.allowRegistration} 
              onChange={(val) => handleChange("allowRegistration", val)} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-800 dark:text-white">Email Verification</h4>
                <Tooltip content="Users must verify their email before they can log in. Unverified users will be blocked from accessing the platform.">
                  <span className="text-gray-400 hover:text-gray-600 cursor-help text-sm">ℹ️</span>
                </Tooltip>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Require email verification before login. Unverified users cannot access the platform.</p>
            </div>
            <ToggleSwitch 
              checked={settings.requireEmailVerification} 
              onChange={(val) => handleChange("requireEmailVerification", val)} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-800 dark:text-white">Maintenance Mode</h4>
                <Tooltip content="When enabled, only admins can access the platform. All other users will see a maintenance message.">
                  <span className="text-gray-400 hover:text-gray-600 cursor-help text-sm">ℹ️</span>
                </Tooltip>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Show maintenance page to all non-admin users. Admins can still access the platform.</p>
            </div>
            <ToggleSwitch 
              checked={settings.maintenanceMode} 
              onChange={(val) => handleChange("maintenanceMode", val)} 
            />
          </div>
        </div>
      </div>

      {/* Approval Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
          <FaCheckCircle className="text-primary-500" />
          <h3 className="font-bold text-gray-800 dark:text-white">Approval Settings</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-800 dark:text-white">Auto-Approve Dealers</h4>
                <Tooltip content="When enabled, new dealer registrations are automatically verified. When disabled, admins must manually approve each dealer.">
                  <span className="text-gray-400 hover:text-gray-600 cursor-help text-sm">ℹ️</span>
                </Tooltip>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Automatically approve new dealer applications. When disabled, manual approval is required.</p>
            </div>
            <ToggleSwitch 
              checked={settings.autoApproveDealers} 
              onChange={(val) => handleChange("autoApproveDealers", val)} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-800 dark:text-white">Auto-Approve Listings</h4>
                <Tooltip content="When enabled, new car listings are automatically approved and visible. When disabled, listings require admin approval before being published.">
                  <span className="text-gray-400 hover:text-gray-600 cursor-help text-sm">ℹ️</span>
                </Tooltip>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Automatically approve new car listings. When disabled, manual approval is required.</p>
            </div>
            <ToggleSwitch 
              checked={settings.autoApproveListings} 
              onChange={(val) => handleChange("autoApproveListings", val)} 
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
          <FaBell className="text-primary-500" />
          <h3 className="font-bold text-gray-800 dark:text-white">Notification Settings</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white">Email Notifications</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Send system emails to users</p>
            </div>
            <ToggleSwitch 
              checked={settings.enableEmailNotifications} 
              onChange={(val) => handleChange("enableEmailNotifications", val)} 
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white">Push Notifications</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Send push notifications to mobile devices</p>
            </div>
            <ToggleSwitch 
              checked={settings.enablePushNotifications} 
              onChange={(val) => handleChange("enablePushNotifications", val)} 
            />
          </div>
        </div>
      </div>

      {/* Payment System Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
          <FaDollarSign className="text-primary-500" />
          <h3 className="font-bold text-gray-800 dark:text-white">Payment System Control</h3>
        </div>
        <div className="p-6 space-y-4">
          {/* Main Toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white">Enable Payment System</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Master switch for entire payment system. When disabled, all payment features are hidden.</p>
            </div>
            <ToggleSwitch 
              checked={settings.paymentSystemEnabled !== undefined ? settings.paymentSystemEnabled : true} 
              onChange={(val) => handleChange("paymentSystemEnabled", val)} 
            />
          </div>

          {/* Granular Controls */}
          {settings.paymentSystemEnabled !== false && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white">Show Subscription Plans</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Display subscription plans to users on client side</p>
                </div>
                <ToggleSwitch 
                  checked={settings.showSubscriptionPlans !== undefined ? settings.showSubscriptionPlans : true} 
                  onChange={(val) => handleChange("showSubscriptionPlans", val)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white">Show Subscription/Payment Tab</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Show the Payments tab in dealer dashboard. When disabled, the entire tab is hidden.</p>
                </div>
                <ToggleSwitch 
                  checked={settings.showSubscriptionTab !== undefined ? settings.showSubscriptionTab : true} 
                  onChange={(val) => handleChange("showSubscriptionTab", val)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white">Show Payment History</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Allow users to view their payment history</p>
                </div>
                <ToggleSwitch 
                  checked={settings.showPaymentHistory !== undefined ? settings.showPaymentHistory : true} 
                  onChange={(val) => handleChange("showPaymentHistory", val)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white">Enable Auto-Renewal</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Allow users to enable automatic subscription renewal</p>
                </div>
                <ToggleSwitch 
                  checked={settings.enableAutoRenewal !== undefined ? settings.enableAutoRenewal : true} 
                  onChange={(val) => handleChange("enableAutoRenewal", val)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white">Require Payment Approval</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manually approve all subscription purchases</p>
                </div>
                <ToggleSwitch 
                  checked={settings.requirePaymentApproval !== undefined ? settings.requirePaymentApproval : false} 
                  onChange={(val) => handleChange("requirePaymentApproval", val)} 
                />
              </div>
            </>
          )}

          {settings.paymentSystemEnabled === false && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Payment system is disabled. All payment-related features are hidden on the client side.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default GeneralSettingsTab;
