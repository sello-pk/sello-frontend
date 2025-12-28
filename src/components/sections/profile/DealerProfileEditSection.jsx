import React, { useState } from "react";
import { FaUpload, FaTimes, FaPlus } from "react-icons/fa";
import { FiEdit2, FiSave, FiX } from "react-icons/fi";
import toast from "react-hot-toast";

const DealerProfileEditSection = ({
  user,
  dealerFormData,
  setDealerFormData,
  dealerFiles,
  setDealerFiles,
  isEditingDealer,
  setIsEditingDealer,
  updateDealerProfile,
  isUpdatingDealer,
  refetch,
}) => {
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [paymentMethodInput, setPaymentMethodInput] = useState("");
  const [serviceInput, setServiceInput] = useState("");

  const cities = [
    "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad",
    "Multan", "Peshawar", "Quetta", "Sialkot"
  ];

  const employeeCountOptions = ["1-10", "11-50", "51-100", "100+"];
  const commonSpecialties = ["Luxury Cars", "Budget Cars", "Electric Vehicles", "SUVs", "Sports Cars", "Classic Cars", "Commercial Vehicles"];
  const commonLanguages = ["English", "Arabic", "Urdu", "Hindi", "French", "Spanish"];
  const commonPaymentMethods = ["Cash", "Credit Card", "Bank Transfer", "Cheque", "Financing Available"];
  const commonServices = ["Financing", "Trade-in", "Warranty", "Insurance", "Delivery", "Test Drive"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDealerFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (type === "avatar") {
        setDealerFiles((prev) => ({ ...prev, avatar: files[0] }));
      } else if (type === "businessLicense") {
        setDealerFiles((prev) => ({ ...prev, businessLicense: files[0] }));
      } else if (type === "showroomImages") {
        setDealerFiles((prev) => ({
          ...prev,
          showroomImages: [...(prev.showroomImages || []), ...Array.from(files)],
        }));
      }
    }
  };

  const removeShowroomImage = (index) => {
    setDealerFiles((prev) => ({
      ...prev,
      showroomImages: prev.showroomImages.filter((_, i) => i !== index),
    }));
  };

  const addToArray = (field, input, setInput) => {
    if (input.trim() && !dealerFormData[field].includes(input.trim())) {
      setDealerFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], input.trim()],
      }));
      setInput("");
    }
  };

  const removeFromArray = (field, item) => {
    setDealerFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((i) => i !== item),
    }));
  };

  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();

      // Add all form fields
      Object.keys(dealerFormData).forEach((key) => {
        if (key === "specialties" || key === "languages" || key === "paymentMethods" || key === "services") {
          formDataToSend.append(key, JSON.stringify(dealerFormData[key]));
        } else if (dealerFormData[key] !== null && dealerFormData[key] !== undefined && dealerFormData[key] !== "") {
          formDataToSend.append(key, dealerFormData[key]);
        }
      });

      // Add files
      if (dealerFiles.businessLicense) {
        formDataToSend.append("businessLicense", dealerFiles.businessLicense);
      }
      if (dealerFiles.showroomImages && dealerFiles.showroomImages.length > 0) {
        dealerFiles.showroomImages.forEach((file) => {
          formDataToSend.append("showroomImages", file);
        });
      }

      await updateDealerProfile(formDataToSend).unwrap();
      toast.success("Dealer profile updated successfully!");
      setIsEditingDealer(false);
      await refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update dealer profile");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Dealer Business Profile</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage your business information, documents, and settings
          </p>
        </div>
        {!isEditingDealer ? (
          <button
            onClick={() => setIsEditingDealer(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors"
          >
            <FiEdit2 size={18} />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditingDealer(false);
                // Reset form data
                if (user?.dealerInfo) {
                  setDealerFormData({
                    businessName: user.dealerInfo.businessName || "",
                    businessAddress: user.dealerInfo.businessAddress || "",
                    businessPhone: user.dealerInfo.businessPhone || "",
                    whatsappNumber: user.dealerInfo.whatsappNumber || "",
                    city: user.dealerInfo.city || "",
                    area: user.dealerInfo.area || "",
                    vehicleTypes: user.dealerInfo.vehicleTypes || "",
                    description: user.dealerInfo.description || "",
                    website: user.dealerInfo.website || "",
                    facebook: user.dealerInfo.socialMedia?.facebook || "",
                    instagram: user.dealerInfo.socialMedia?.instagram || "",
                    twitter: user.dealerInfo.socialMedia?.twitter || "",
                    linkedin: user.dealerInfo.socialMedia?.linkedin || "",
                    establishedYear: user.dealerInfo.establishedYear?.toString() || "",
                    employeeCount: user.dealerInfo.employeeCount || "",
                    specialties: user.dealerInfo.specialties || [],
                    languages: user.dealerInfo.languages || [],
                    paymentMethods: user.dealerInfo.paymentMethods || [],
                    services: user.dealerInfo.services || [],
                  });
                }
                setDealerFiles({ avatar: null, businessLicense: null, showroomImages: [] });
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiX size={18} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isUpdatingDealer}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
            >
              <FiSave size={18} />
              {isUpdatingDealer ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Profile Image Upload */}
        {isEditingDealer && (
          <div className="border-b border-gray-200 pb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Profile Image</h4>
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={
                    dealerFiles.avatar
                      ? URL.createObjectURL(dealerFiles.avatar)
                      : user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}`
                  }
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
                {isEditingDealer && (
                  <label className="absolute bottom-0 right-0 bg-primary-500 text-white rounded-full p-2 cursor-pointer hover:opacity-90 transition-colors">
                    <FaUpload size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "avatar")}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Profile Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "avatar")}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <FaUpload className="text-gray-400 mb-2" size={20} />
                    <span className="text-sm text-gray-600">
                      {dealerFiles.avatar
                        ? dealerFiles.avatar.name
                        : user?.avatar
                        ? "Click to change profile image"
                        : "Click to upload profile image"}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      JPG, PNG (Max 5MB)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                name="businessName"
                value={dealerFormData.businessName}
                onChange={handleInputChange}
                disabled={!isEditingDealer}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={user?.name || ""}
                disabled
                className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Phone *
              </label>
              <input
                type="tel"
                name="businessPhone"
                value={dealerFormData.businessPhone}
                onChange={handleInputChange}
                disabled={!isEditingDealer}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                placeholder="+971 XX XXX XXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                name="whatsappNumber"
                value={dealerFormData.whatsappNumber}
                onChange={handleInputChange}
                disabled={!isEditingDealer}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                placeholder="+971 XX XXX XXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <select
                name="city"
                value={dealerFormData.city}
                onChange={handleInputChange}
                disabled={!isEditingDealer}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area *
              </label>
              <input
                type="text"
                name="area"
                value={dealerFormData.area}
                onChange={handleInputChange}
                disabled={!isEditingDealer}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Address
              </label>
              <textarea
                name="businessAddress"
                value={dealerFormData.businessAddress}
                onChange={handleInputChange}
                disabled={!isEditingDealer}
                rows={3}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Description
              </label>
              <textarea
                name="description"
                value={dealerFormData.description}
                onChange={handleInputChange}
                disabled={!isEditingDealer}
                rows={4}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                placeholder="Tell us about your business..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={dealerFormData.website}
                  onChange={handleInputChange}
                  disabled={!isEditingDealer}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                  placeholder="https://www.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Established Year
                </label>
                <input
                  type="number"
                  name="establishedYear"
                  value={dealerFormData.establishedYear}
                  onChange={handleInputChange}
                  disabled={!isEditingDealer}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Count
                </label>
                <select
                  name="employeeCount"
                  value={dealerFormData.employeeCount}
                  onChange={handleInputChange}
                  disabled={!isEditingDealer}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                >
                  <option value="">Select</option>
                  {employeeCountOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Types
                </label>
                <input
                  type="text"
                  name="vehicleTypes"
                  value={dealerFormData.vehicleTypes}
                  onChange={handleInputChange}
                  disabled={!isEditingDealer}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                  placeholder="New, Used, Bikes, SUVs, etc."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        {isEditingDealer && (
          <div className="border-b border-gray-200 pb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Documents</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business License / CNIC
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, "businessLicense")}
                    className="hidden"
                    id="license-upload"
                  />
                  <label
                    htmlFor="license-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <FaUpload className="text-gray-400 mb-2" size={24} />
                    <span className="text-sm text-gray-600">
                      {dealerFiles.businessLicense
                        ? dealerFiles.businessLicense.name
                        : user?.dealerInfo?.businessLicense
                        ? "Current: " + (user.dealerInfo.businessLicense.split("/").pop() || "Uploaded")
                        : "Click to upload or drag and drop"}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG (Max 5MB)
                    </span>
                  </label>
                </div>
                {user?.dealerInfo?.businessLicense && !dealerFiles.businessLicense && (
                  <a
                    href={user.dealerInfo.businessLicense}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-500 hover:underline mt-2 inline-block"
                  >
                    View Current License
                  </a>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Showroom Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, "showroomImages")}
                    className="hidden"
                    id="showroom-upload"
                  />
                  <label
                    htmlFor="showroom-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <FaUpload className="text-gray-400 mb-2" size={24} />
                    <span className="text-sm text-gray-600">
                      Click to upload showroom images
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      JPG, PNG (Max 5MB each, up to 10 images)
                    </span>
                  </label>
                </div>
                {(dealerFiles.showroomImages.length > 0 || user?.dealerInfo?.showroomImages?.length > 0) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {user?.dealerInfo?.showroomImages?.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt={`Showroom ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        {isEditingDealer && (
                          <button
                            onClick={() => {
                              // Remove from existing images (would need backend support)
                              toast.info("Remove existing images from profile edit");
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <FaTimes size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    {dealerFiles.showroomImages.map((file, idx) => (
                      <div key={`new-${idx}`} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeShowroomImage(idx)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Specialties & Services */}
        {isEditingDealer && (
          <div className="border-b border-gray-200 pb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Specialties & Services</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialties
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {dealerFormData.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-500 rounded-full text-sm"
                    >
                      {specialty}
                      <button
                        type="button"
                        onClick={() => removeFromArray("specialties", specialty)}
                        className="hover:text-primary-500"
                      >
                        <FaTimes size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToArray("specialties", specialtyInput, setSpecialtyInput);
                      }
                    }}
                    className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Add specialty"
                  />
                  <button
                    type="button"
                    onClick={() => addToArray("specialties", specialtyInput, setSpecialtyInput)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90"
                  >
                    <FaPlus />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonSpecialties.map((specialty) => (
                    <button
                      key={specialty}
                      type="button"
                      onClick={() => {
                        if (!dealerFormData.specialties.includes(specialty)) {
                          setDealerFormData((prev) => ({
                            ...prev,
                            specialties: [...prev.specialties, specialty],
                          }));
                        }
                      }}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      + {specialty}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services Offered
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {dealerFormData.services.map((service) => (
                    <span
                      key={service}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {service}
                      <button
                        type="button"
                        onClick={() => removeFromArray("services", service)}
                        className="hover:text-green-600"
                      >
                        <FaTimes size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {commonServices.map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => {
                        if (!dealerFormData.services.includes(service)) {
                          setDealerFormData((prev) => ({
                            ...prev,
                            services: [...prev.services, service],
                          }));
                        }
                      }}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      + {service}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages Spoken
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {dealerFormData.languages.map((language) => (
                    <span
                      key={language}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-800 rounded-full text-sm"
                    >
                      {language}
                      <button
                        type="button"
                        onClick={() => removeFromArray("languages", language)}
                        className="hover:text-primary-600"
                      >
                        <FaTimes size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {commonLanguages.map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => {
                        if (!dealerFormData.languages.includes(language)) {
                          setDealerFormData((prev) => ({
                            ...prev,
                            languages: [...prev.languages, language],
                          }));
                        }
                      }}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      + {language}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Methods Accepted
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {dealerFormData.paymentMethods.map((method) => (
                    <span
                      key={method}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {method}
                      <button
                        type="button"
                        onClick={() => removeFromArray("paymentMethods", method)}
                        className="hover:text-purple-600"
                      >
                        <FaTimes size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {commonPaymentMethods.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        if (!dealerFormData.paymentMethods.includes(method)) {
                          setDealerFormData((prev) => ({
                            ...prev,
                            paymentMethods: [...prev.paymentMethods, method],
                          }));
                        }
                      }}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      + {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Social Media */}
        {isEditingDealer && (
          <div className="border-b border-gray-200 pb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook URL
                </label>
                <input
                  type="url"
                  name="facebook"
                  value={dealerFormData.facebook}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram URL
                </label>
                <input
                  type="url"
                  name="instagram"
                  value={dealerFormData.instagram}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter URL
                </label>
                <input
                  type="url"
                  name="twitter"
                  value={dealerFormData.twitter}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedin"
                  value={dealerFormData.linkedin}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://linkedin.com/..."
                />
              </div>
            </div>
          </div>
        )}

        {/* View Mode - Display Current Info */}
        {!isEditingDealer && (
          <div className="space-y-4">
            {/* Profile Image Display */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Profile Image</h4>
              <div className="flex items-center gap-4">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}`}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
                <div>
                  <p className="text-sm text-gray-600">Current profile image</p>
                  <p className="text-xs text-gray-500">Click "Edit Profile" to change</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Business Name</p>
                  <p className="font-semibold text-gray-900">
                    {user?.dealerInfo?.businessName || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold text-gray-900">
                    {user?.dealerInfo?.area || "N/A"}, {user?.dealerInfo?.city || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">
                    {user?.dealerInfo?.businessPhone || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">WhatsApp</p>
                  <p className="font-semibold text-gray-900">
                    {user?.dealerInfo?.whatsappNumber || "Not set"}
                  </p>
                </div>
                {user?.dealerInfo?.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="font-semibold text-gray-900">
                      {user.dealerInfo.description}
                    </p>
                  </div>
                )}
                {user?.dealerInfo?.specialties?.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-2">Specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {user.dealerInfo.specialties.map((specialty, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-primary-100 text-primary-500 rounded-full text-sm"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {user?.dealerInfo?.services?.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-2">Services</p>
                    <div className="flex flex-wrap gap-2">
                      {user.dealerInfo.services.map((service, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Documents Display */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Documents</h4>
              <div className="space-y-4">
                {user?.dealerInfo?.businessLicense && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Business License / CNIC</p>
                    <a
                      href={user.dealerInfo.businessLicense}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-500 font-medium"
                    >
                      <span>View License Document</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
                {user?.dealerInfo?.showroomImages?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Showroom Images ({user.dealerInfo.showroomImages.length})</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {user.dealerInfo.showroomImages.map((img, idx) => (
                        <a
                          key={idx}
                          href={img}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group"
                        >
                          <img
                            src={img}
                            alt={`Showroom ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:border-primary-500 transition-colors"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                              View Full
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {(!user?.dealerInfo?.businessLicense && (!user?.dealerInfo?.showroomImages || user.dealerInfo.showroomImages.length === 0)) && (
                  <p className="text-sm text-gray-500">No documents uploaded. Click "Edit Profile" to upload documents.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerProfileEditSection;
