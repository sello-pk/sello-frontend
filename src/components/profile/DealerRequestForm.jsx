import React, { useState } from "react";
import { useRequestDealerMutation, useGetMeQuery } from "../../redux/services/api";
import toast from "react-hot-toast";
import { FiX, FiCheckCircle, FiAlertCircle, FiBriefcase, FiFileText, FiMapPin, FiPhone, FiUpload } from "react-icons/fi";
import Spinner from "../Spinner";

const DealerRequestForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    businessName: "",
    businessLicense: "",
    businessAddress: "",
    businessPhone: "",
  });
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [requestDealer, { isLoading }] = useRequestDealerMutation();
  const { data: user, refetch } = useGetMeQuery();

  // Check if user is already a dealer
  const isDealer = user?.role === "dealer";
  const isVerifiedDealer = user?.dealerInfo?.verified === true;

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    } else if (formData.businessName.trim().length < 3) {
      newErrors.businessName = "Business name must be at least 3 characters";
    }

    if (!formData.businessLicense.trim() && !businessLicenseFile) {
      newErrors.businessLicense = "Business license number or file is required";
    }

    if (!formData.businessAddress.trim()) {
      newErrors.businessAddress = "Business address is required";
    } else if (formData.businessAddress.trim().length < 10) {
      newErrors.businessAddress = "Please provide a complete address";
    }

    if (!formData.businessPhone.trim()) {
      newErrors.businessPhone = "Business phone number is required";
    } else if (!/^[\d\s\-+()]+$/.test(formData.businessPhone.trim())) {
      newErrors.businessPhone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          businessLicenseFile: "Please upload a PDF, JPG, or PNG file"
        }));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          businessLicenseFile: "File size must be less than 5MB"
        }));
        return;
      }
      setBusinessLicenseFile(file);
      if (errors.businessLicenseFile) {
        setErrors((prev) => ({ ...prev, businessLicenseFile: "" }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("businessName", formData.businessName.trim());
      if (formData.businessLicense.trim()) {
        formDataToSend.append("businessLicense", formData.businessLicense.trim());
      }
      formDataToSend.append("businessAddress", formData.businessAddress.trim());
      formDataToSend.append("businessPhone", formData.businessPhone.trim());

      // Append file if provided
      if (businessLicenseFile) {
        formDataToSend.append("businessLicense", businessLicenseFile);
      }

      // Use the API mutation - it should handle FormData
      const result = await requestDealer(formDataToSend).unwrap();

      const message = result?.dealerInfo?.verified 
        ? "Dealer account created and verified successfully!"
        : "Dealer request submitted successfully! Pending admin verification.";
      
      toast.success(message);
      setFormData({
        businessName: "",
        businessLicense: "",
        businessAddress: "",
        businessPhone: "",
      });
      setBusinessLicenseFile(null);
      setErrors({});
      refetch();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to submit dealer request. Please try again.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!isOpen) return null;

  // Show status if already a dealer
  if (isDealer) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Dealer Status</h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="p-6">
            {isVerifiedDealer ? (
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <FiCheckCircle className="text-green-600" size={32} />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Verified Dealer</h4>
                <p className="text-gray-600 mb-4">
                  Your dealer account has been verified by our admin team.
                </p>
                {user?.dealerInfo?.businessName && (
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <p className="text-sm text-gray-600 mb-1">Business Name</p>
                    <p className="font-medium text-gray-900">{user.dealerInfo.businessName}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <FiAlertCircle className="text-yellow-600" size={32} />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Pending Verification</h4>
                <p className="text-gray-600 mb-4">
                  Your dealer request is pending admin verification. You will be notified once your account is verified.
                </p>
                {user?.dealerInfo?.businessName && (
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <p className="text-sm text-gray-600 mb-1">Business Name</p>
                    <p className="font-medium text-gray-900">{user.dealerInfo.businessName}</p>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={onClose}
              className="w-full mt-6 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-white">Become a Verified Dealer</h3>
            <p className="text-primary-100 text-sm mt-1">
              Get verified and unlock dealer benefits
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FiBriefcase className="inline mr-2" size={16} />
              Business Name *
            </label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Enter your business name"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all ${
                errors.businessName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.businessName && (
              <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>
            )}
          </div>

          {/* Business License */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FiFileText className="inline mr-2" size={16} />
              Business License *
            </label>
            <div className="space-y-3">
              <input
                type="text"
                name="businessLicense"
                value={formData.businessLicense}
                onChange={handleChange}
                placeholder="Enter your business license number"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all ${
                  errors.businessLicense ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.businessLicense && (
                <p className="text-red-500 text-xs mt-1">{errors.businessLicense}</p>
              )}
              <div className="text-center text-gray-500 text-sm">OR</div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="license-upload"
                />
                <label
                  htmlFor="license-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <FiUpload className="text-gray-400 mb-2" size={24} />
                  <span className="text-sm text-gray-600">
                    {businessLicenseFile ? businessLicenseFile.name : "Click to upload license file"}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PDF, JPG, PNG (Max 5MB)
                  </span>
                </label>
              </div>
              {businessLicenseFile && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2">
                  <span className="text-sm text-green-800">{businessLicenseFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setBusinessLicenseFile(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              )}
              {errors.businessLicenseFile && (
                <p className="text-red-500 text-xs mt-1">{errors.businessLicenseFile}</p>
              )}
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Provide either license number or upload license document (will be verified by admin team)
            </p>
          </div>

          {/* Business Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FiMapPin className="inline mr-2" size={16} />
              Business Address *
            </label>
            <textarea
              name="businessAddress"
              value={formData.businessAddress}
              onChange={handleChange}
              placeholder="Enter your complete business address"
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none ${
                errors.businessAddress ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.businessAddress && (
              <p className="text-red-500 text-xs mt-1">{errors.businessAddress}</p>
            )}
          </div>

          {/* Business Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FiPhone className="inline mr-2" size={16} />
              Business Phone Number *
            </label>
            <input
              type="tel"
              name="businessPhone"
              value={formData.businessPhone}
              onChange={handleChange}
              placeholder="+971 XX XXX XXXX"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all ${
                errors.businessPhone ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.businessPhone && (
              <p className="text-red-500 text-xs mt-1">{errors.businessPhone}</p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Your request will be reviewed by our admin team</li>
              <li>• Verification typically takes 1-3 business days</li>
              <li>• You'll receive an email notification once verified</li>
              <li>• Verified dealers get priority listing placement</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transform active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Spinner fullScreen={false} />
                  Submitting...
                </>
              ) : (
                <>
                  <FiCheckCircle size={16} />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DealerRequestForm;

