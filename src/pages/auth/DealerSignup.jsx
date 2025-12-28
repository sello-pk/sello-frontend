import React, { useState, useMemo, useEffect } from "react";
import HeaderLogo from "../../components/utils/HeaderLogo";
import { FaRegEye, FaRegEyeSlash, FaUpload, FaPlus, FaTimes } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useRegisterUserMutation,
} from "../../redux/services/api";
import Spinner from "../../components/Spinner";
import { FiX, FiChevronDown } from "react-icons/fi";
import { useCarCategories } from "../../hooks/useCarCategories";

const DealerSignup = ({ onBack }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [cnicFile, setCnicFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    dealerName: "",
    ownerFullName: "",
    mobileNumber: "",
    whatsappNumber: "",
    email: "",
    country: "",
    state: "",
    city: "",
    area: "",
    vehicleTypes: "",
    password: "",
    confirmPassword: "",
    
    // Step 2: Business Details
    description: "",
    website: "",
    establishedYear: "",
    employeeCount: "",
    specialties: [],
    languages: [],
    paymentMethods: [],
    services: [],
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
  });
  
  const [errors, setErrors] = useState({});
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [paymentMethodInput, setPaymentMethodInput] = useState("");
  const [serviceInput, setServiceInput] = useState("");

  const [registerUser] = useRegisterUserMutation();
  const navigate = useNavigate();

  // Fetch categories from admin
  const { countries, states, cities, getStatesByCountry, getCitiesByState, isLoading: categoriesLoading } = useCarCategories();

  // Filter states by selected country
  const availableStates = useMemo(() => {
    if (!formData.country) return [];
    const statesMap = getStatesByCountry || {};
    return statesMap[formData.country] || [];
  }, [formData.country, getStatesByCountry]);

  // Filter cities by selected state
  const availableCities = useMemo(() => {
    if (!formData.state) return [];
    const citiesMap = getCitiesByState || {};
    return citiesMap[formData.state] || [];
  }, [formData.state, getCitiesByState]);

  // Reset state when country changes
  useEffect(() => {
    if (formData.country) {
      setFormData(prev => ({ ...prev, state: "", city: "" }));
    }
  }, [formData.country]);

  // Reset city when state changes
  useEffect(() => {
    if (formData.state) {
      setFormData(prev => ({ ...prev, city: "" }));
    }
  }, [formData.state]);

  const employeeCountOptions = ["1-10", "11-50", "51-100", "100+"];
  const commonSpecialties = ["Luxury Cars", "Budget Cars", "Electric Vehicles", "SUVs", "Sports Cars", "Classic Cars", "Commercial Vehicles"];
  const commonLanguages = ["English", "Arabic", "Urdu", "Hindi", "French", "Spanish"];
  const commonPaymentMethods = ["Cash", "Credit Card", "Bank Transfer", "Cheque", "Financing Available"];
  const commonServices = ["Financing", "Trade-in", "Warranty", "Insurance", "Delivery", "Test Drive"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    
    // Validate URL fields (social media and website)
    if (['website', 'facebook', 'instagram', 'twitter', 'linkedin'].includes(name) && value) {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(value) && !value.startsWith('http://') && !value.startsWith('https://')) {
        // Allow partial URLs - will be fixed on backend
      }
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === "avatar") {
        setAvatar(file);
      } else if (type === "cnic") {
        setCnicFile(file);
      }
    }
  };

  const addToArray = (field, input, setInput) => {
    if (input.trim() && !formData[field].includes(input.trim())) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], input.trim()]
      }));
      setInput("");
    }
  };

  const removeFromArray = (field, item) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((i) => i !== item)
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.dealerName.trim()) newErrors.dealerName = "Dealer/Showroom name is required";
    if (!formData.ownerFullName.trim()) newErrors.ownerFullName = "Owner full name is required";
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = "Mobile number is required";
    if (!formData.whatsappNumber.trim()) newErrors.whatsappNumber = "WhatsApp number is required";
    if (!formData.email.trim()) newErrors.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = "Please enter a valid email address";
    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.area.trim()) newErrors.area = "Area is required";
    if (!formData.vehicleTypes.trim()) newErrors.vehicleTypes = "Type of vehicles is required";
    if (!cnicFile) newErrors.cnicFile = "CNIC/Business License is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      } else {
        toast.error("Please fix the errors in the form");
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep < totalSteps) {
      handleNext();
      return;
    }

    if (!validateStep1()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    let avatarFile = avatar;
    if (!avatarFile) {
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFA602";
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "80px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(formData.dealerName.charAt(0).toUpperCase(), 100, 100);
      
      canvas.toBlob((blob) => {
        avatarFile = new File([blob], "avatar.png", { type: "image/png" });
        submitForm(avatarFile);
      }, "image/png");
      return;
    }

    submitForm(avatarFile);
  };

  const submitForm = async (avatarFile) => {
    const registrationData = new FormData();
    registrationData.append("name", formData.ownerFullName);
    registrationData.append("email", formData.email);
    registrationData.append("password", formData.password);
    registrationData.append("role", "dealer");
    registrationData.append("avatar", avatarFile);
    
    // Basic dealer information
    registrationData.append("dealerName", formData.dealerName);
    registrationData.append("mobileNumber", formData.mobileNumber);
    registrationData.append("whatsappNumber", formData.whatsappNumber);
    // Send category IDs for location
    if (formData.country) registrationData.append("country", formData.country);
    if (formData.state) registrationData.append("state", formData.state);
    if (formData.city) registrationData.append("city", formData.city);
    registrationData.append("area", formData.area);
    registrationData.append("vehicleTypes", formData.vehicleTypes);
    registrationData.append("cnicFile", cnicFile);
    
    // Enhanced dealer information
    if (formData.description) registrationData.append("description", formData.description);
    if (formData.website) registrationData.append("website", formData.website);
    if (formData.establishedYear) registrationData.append("establishedYear", formData.establishedYear);
    if (formData.employeeCount) registrationData.append("employeeCount", formData.employeeCount);
    if (formData.specialties.length > 0) registrationData.append("specialties", JSON.stringify(formData.specialties));
    if (formData.languages.length > 0) registrationData.append("languages", JSON.stringify(formData.languages));
    if (formData.paymentMethods.length > 0) registrationData.append("paymentMethods", JSON.stringify(formData.paymentMethods));
    if (formData.services.length > 0) registrationData.append("services", JSON.stringify(formData.services));
    if (formData.facebook) registrationData.append("facebook", formData.facebook);
    if (formData.instagram) registrationData.append("instagram", formData.instagram);
    if (formData.twitter) registrationData.append("twitter", formData.twitter);
    if (formData.linkedin) registrationData.append("linkedin", formData.linkedin);

    try {
      setLoading(true);
      const res = await registerUser(registrationData).unwrap();
      toast.success("Dealer registration submitted successfully! Pending admin verification.");
      navigate("/login");
    } catch (err) {
      toast.error(err?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl my-8">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Dealer Registration</h2>
              <p className="text-sm text-gray-500 mt-1">Step {currentStep} of {totalSteps}</p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step 
                      ? "bg-primary-500 border-primary-500 text-white" 
                      : "bg-white border-gray-300 text-gray-400"
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? "bg-primary-500" : "bg-gray-300"
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Basic Info</span>
              <span>Business Details</span>
              <span>Review & Submit</span>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(100vh-300px)]">
            <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dealer/Showroom Name *
                      </label>
                      <input
                        name="dealerName"
                        value={formData.dealerName}
                        onChange={handleChange}
                        className={`w-full py-2 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.dealerName ? "border-red-500" : "border-gray-300"
                        }`}
                        type="text"
                        placeholder="Enter dealer/showroom name"
                      />
                      {errors.dealerName && (
                        <p className="text-red-500 text-xs mt-1">{errors.dealerName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Owner Full Name *
                      </label>
                      <input
                        name="ownerFullName"
                        value={formData.ownerFullName}
                        onChange={handleChange}
                        className={`w-full py-2 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.ownerFullName ? "border-red-500" : "border-gray-300"
                        }`}
                        type="text"
                        placeholder="Enter owner full name"
                      />
                      {errors.ownerFullName && (
                        <p className="text-red-500 text-xs mt-1">{errors.ownerFullName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        className={`w-full py-2 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.mobileNumber ? "border-red-500" : "border-gray-300"
                        }`}
                        type="tel"
                        placeholder="+971 XX XXX XXXX"
                      />
                      {errors.mobileNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WhatsApp Number *
                      </label>
                      <input
                        name="whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={handleChange}
                        className={`w-full py-2 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.whatsappNumber ? "border-red-500" : "border-gray-300"
                        }`}
                        type="tel"
                        placeholder="+971 XX XXX XXXX"
                      />
                      {errors.whatsappNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.whatsappNumber}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full py-2 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      type="email"
                      placeholder="Enter your email address"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country *
                      </label>
                      <div className="relative">
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          className={`w-full py-2 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none ${
                            errors.country ? "border-red-500" : "border-gray-300"
                          } ${categoriesLoading ? "bg-gray-100 cursor-not-allowed" : ""}`}
                          disabled={categoriesLoading}
                        >
                          <option value="">
                            {categoriesLoading ? "Loading countries..." : "Select Country"}
                          </option>
                          {countries.map((country) => (
                            <option key={country._id} value={country._id}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.country && (
                        <p className="text-red-500 text-xs mt-1">{errors.country}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <div className="relative">
                        <select
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className={`w-full py-2 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none ${
                            errors.state ? "border-red-500" : "border-gray-300"
                          } ${!formData.country || categoriesLoading ? "bg-gray-100 cursor-not-allowed" : ""}`}
                          disabled={!formData.country || categoriesLoading}
                        >
                          <option value="">
                            {!formData.country ? "Select country first" : availableStates.length === 0 ? "No states available" : "Select State"}
                          </option>
                          {availableStates.map((state) => (
                            <option key={state._id} value={state._id}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.state && (
                        <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <div className="relative">
                        <select
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className={`w-full py-2 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none ${
                            errors.city ? "border-red-500" : "border-gray-300"
                          } ${!formData.state || categoriesLoading ? "bg-gray-100 cursor-not-allowed" : ""}`}
                          disabled={!formData.state || categoriesLoading}
                        >
                          <option value="">
                            {!formData.state ? "Select state first" : availableCities.length === 0 ? "No cities available" : "Select City"}
                          </option>
                          {availableCities.map((city) => (
                            <option key={city._id} value={city._id}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.city && (
                        <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                      )}
                    </div>
                  </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area *
                      </label>
                      <input
                        name="area"
                        value={formData.area}
                        onChange={handleChange}
                        className={`w-full py-2 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.area ? "border-red-500" : "border-gray-300"
                        }`}
                        type="text"
                        placeholder="Enter area"
                      />
                      {errors.area && (
                        <p className="text-red-500 text-xs mt-1">{errors.area}</p>
                      )}
                    </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type of Vehicles *
                    </label>
                    <input
                      name="vehicleTypes"
                      value={formData.vehicleTypes}
                      onChange={handleChange}
                      className={`w-full py-2 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.vehicleTypes ? "border-red-500" : "border-gray-300"
                      }`}
                      type="text"
                      placeholder="New, Used, Bikes, SUVs, etc."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple types with commas
                    </p>
                    {errors.vehicleTypes && (
                      <p className="text-red-500 text-xs mt-1">{errors.vehicleTypes}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload CNIC / Business License *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-500 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, "cnic")}
                        className="hidden"
                        id="cnic-upload"
                      />
                      <label
                        htmlFor="cnic-upload"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <FaUpload className="text-gray-400 mb-2" size={24} />
                        <span className="text-sm text-gray-600">
                          {cnicFile ? cnicFile.name : "Click to upload or drag and drop"}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          PDF, JPG, PNG (Max 5MB)
                        </span>
                      </label>
                    </div>
                    {errors.cnicFile && (
                      <p className="text-red-500 text-xs mt-1">{errors.cnicFile}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`w-full py-2 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10 ${
                            errors.password ? "border-red-500" : "border-gray-300"
                          }`}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`w-full py-2 px-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10 ${
                            errors.confirmPassword ? "border-red-500" : "border-gray-300"
                          }`}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Business Details */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Business Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Tell us about your business..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        type="url"
                        className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://www.example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Established Year
                      </label>
                      <input
                        name="establishedYear"
                        value={formData.establishedYear}
                        onChange={handleChange}
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="2020"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Count
                    </label>
                    <select
                      name="employeeCount"
                      value={formData.employeeCount}
                      onChange={handleChange}
                      className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select employee count</option>
                      {employeeCountOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specialties
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.specialties.map((specialty) => (
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
                        className="flex-1 py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Add specialty"
                      />
                      <button
                        type="button"
                        onClick={() => addToArray("specialties", specialtyInput, setSpecialtyInput)}
                        className="px-4 py-2 bg-primary-500 text-white rounded hover:opacity-90"
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
                            if (!formData.specialties.includes(specialty)) {
                              setFormData((prev) => ({
                                ...prev,
                                specialties: [...prev.specialties, specialty]
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Languages Spoken
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.languages.map((language) => (
                        <span
                          key={language}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {language}
                          <button
                            type="button"
                            onClick={() => removeFromArray("languages", language)}
                            className="hover:text-blue-600"
                          >
                            <FaTimes size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={languageInput}
                        onChange={(e) => setLanguageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addToArray("languages", languageInput, setLanguageInput);
                          }
                        }}
                        className="flex-1 py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Add language"
                      />
                      <button
                        type="button"
                        onClick={() => addToArray("languages", languageInput, setLanguageInput)}
                        className="px-4 py-2 bg-primary-500 text-white rounded hover:opacity-90"
                      >
                        <FaPlus />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {commonLanguages.map((language) => (
                        <button
                          key={language}
                          type="button"
                          onClick={() => {
                            if (!formData.languages.includes(language)) {
                              setFormData((prev) => ({
                                ...prev,
                                languages: [...prev.languages, language]
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Methods Accepted
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.paymentMethods.map((method) => (
                        <span
                          key={method}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {method}
                          <button
                            type="button"
                            onClick={() => removeFromArray("paymentMethods", method)}
                            className="hover:text-green-600"
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
                            if (!formData.paymentMethods.includes(method)) {
                              setFormData((prev) => ({
                                ...prev,
                                paymentMethods: [...prev.paymentMethods, method]
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Services Offered
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.services.map((service) => (
                        <span
                          key={service}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                        >
                          {service}
                          <button
                            type="button"
                            onClick={() => removeFromArray("services", service)}
                            className="hover:text-purple-600"
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
                            if (!formData.services.includes(service)) {
                              setFormData((prev) => ({
                                ...prev,
                                services: [...prev.services, service]
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facebook URL
                      </label>
                      <input
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleChange}
                        type="url"
                        className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://facebook.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instagram URL
                      </label>
                      <input
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        type="url"
                        className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Twitter URL
                      </label>
                      <input
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleChange}
                        type="url"
                        className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://twitter.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn URL
                      </label>
                      <input
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleChange}
                        type="url"
                        className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://linkedin.com/..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Review Your Information</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Basic Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Business Name:</span>
                          <p className="font-medium">{formData.dealerName}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Owner:</span>
                          <p className="font-medium">{formData.ownerFullName}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <p className="font-medium">{formData.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <p className="font-medium">{formData.mobileNumber}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Location:</span>
                          <p className="font-medium">
                            {formData.area}
                            {formData.city && `, ${cities.find(c => c._id === formData.city)?.name || formData.city}`}
                            {formData.state && `, ${states.find(s => s._id === formData.state)?.name || formData.state}`}
                            {formData.country && `, ${countries.find(c => c._id === formData.country)?.name || formData.country}`}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Vehicle Types:</span>
                          <p className="font-medium">{formData.vehicleTypes}</p>
                        </div>
                      </div>
                    </div>

                    {(formData.description || formData.website || formData.specialties.length > 0) && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Business Details</h4>
                        <div className="text-sm space-y-2">
                          {formData.description && (
                            <div>
                              <span className="text-gray-600">Description:</span>
                              <p className="font-medium">{formData.description}</p>
                            </div>
                          )}
                          {formData.website && (
                            <div>
                              <span className="text-gray-600">Website:</span>
                              <p className="font-medium">{formData.website}</p>
                            </div>
                          )}
                          {formData.specialties.length > 0 && (
                            <div>
                              <span className="text-gray-600">Specialties:</span>
                              <p className="font-medium">{formData.specialties.join(", ")}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        required
                        className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        I accept the{" "}
                        <Link
                          to="/privacy-policy"
                          className="text-primary-500 hover:underline font-medium"
                        >
                          Privacy Policy
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/terms-conditon"
                          className="text-primary-500 hover:underline font-medium"
                        >
                          Terms & Conditions
                        </Link>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-500 text-white font-semibold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Spinner fullScreen={false} />
                      Submitting...
                    </span>
                  ) : currentStep < totalSteps ? (
                    "Next"
                  ) : (
                    "Register Now"
                  )}
                </button>
              </div>

              {/* Login Link */}
              <p className="text-center text-gray-600 text-sm mt-4">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary-500 hover:underline font-medium"
                >
                  Login
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default DealerSignup;
