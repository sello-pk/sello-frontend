import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useCreateCarMutation } from "../../../redux/services/api";

import ImagesUpload from "../createPost/ImagesUpload";
import Input from "../../utils/filter/Input";
import BodyTypes from "../../utils/filter/BodyTypes";
import RegionalSpecs from "../../utils/filter/RegionalSpecs";
import FuelSpecs from "../../utils/filter/FuelSpecs";
import TransmissionSpecs from "../../utils/filter/TransmissionSpecs";
import CylindersSpecs from "../../utils/filter/CylindersSpecs";
import ExteriorColor from "../../utils/filter/ExteriorColor";
import InteriorColor from "../../utils/filter/InteriorColor";
import DoorsSpecs from "../../utils/filter/DoorsSpecs";
import OwnerTypeSpecs from "../../utils/filter/OwnerTypeSpecs";
import WarrantyType from "../../utils/filter/WarrantyType";
import HorsePowerSpecs from "../../utils/filter/HorsePowerSpecs";
import EngineCapacitySpecs from "../../utils/filter/EngineCapacitySpecs";
import TechnicalFeaturesSpecs from "../../utils/filter/TechnicalFeaturesSpecs";
import CarCondition from "../../utils/filter/CarCondition";
import { useCarCategories } from "../../../hooks/useCarCategories";
import LocationButton from "../../utils/filter/LocationButton";
import {
  isFieldVisible,
  getRequiredFields,
} from "../../../utils/vehicleFieldConfig";

// Helper function to get dynamic labels based on vehicle type
const getVehicleLabel = (vehicleType, fieldType) => {
  const vehicleName = vehicleType || "Vehicle";
  if (fieldType === "make") {
    return `${vehicleName} Make`;
  } else if (fieldType === "model") {
    return `${vehicleName} Model`;
  }
  return `${vehicleName} ${fieldType}`;
};

const CreatePostForm = () => {
  const navigate = useNavigate();
  const [availableModels, setAvailableModels] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    vehicleType: "Car", // Default to Car
    vehicleTypeCategory: "", // Category ID reference
    make: "",
    model: "",
    variant: "",
    year: "",
    condition: "",
    price: "",
    colorExterior: "",
    colorInterior: "",
    fuelType: "",
    engineCapacity: "",
    transmission: "",
    mileage: "",
    features: [],
    regionalSpec: "",
    bodyType: "",
    country: "",
    city: "",
    location: "",
    sellerType: "",
    carDoors: "",
    contactNumber: "",
    geoLocation: "",
    horsepower: "",
    warranty: "",
    numberOfCylinders: "",
    ownerType: "",
    batteryRange: "",
    motorPower: "",
    images: [],
  });

  // Filter categories by selected vehicle type (must be after formData declaration)
  const {
    makes,
    models,
    getModelsByMake,
    years,
    countries,
    cities,
    getCitiesByCountry,
    isLoading: categoriesLoading,
  } = useCarCategories(formData.vehicleType);

  const [createCar, { isLoading }] = useCreateCarMutation();

  // Initialize available models - optimized with useMemo-like logic
  useEffect(() => {
    if (!formData.make || makes.length === 0) {
      setAvailableModels(models);
      return;
    }

    const selectedMakeObj = makes.find((m) => m.name === formData.make);
    if (selectedMakeObj && getModelsByMake[selectedMakeObj._id]) {
      const makeModels = getModelsByMake[selectedMakeObj._id];
      setAvailableModels(makeModels.length > 0 ? makeModels : models);
    } else {
      setAvailableModels(models);
    }
  }, [formData.make, makes, models, getModelsByMake]);

  // Initialize available years - optimized
  // Years can be independent or tied to models
  useEffect(() => {
    if (!formData.model || availableModels.length === 0) {
      // Show all years when no model is selected
      setAvailableYears(years);
      return;
    }

    const selectedModelObj = availableModels.find(
      (m) => m.name === formData.model
    );
    if (selectedModelObj) {
      // Filter years by model if they have parentCategory
      const modelYears = years.filter((y) => {
        if (!y.parentCategory) return true; // Include independent years
        const parentId =
          typeof y.parentCategory === "object"
            ? y.parentCategory._id
            : y.parentCategory;
        return parentId === selectedModelObj._id;
      });
      setAvailableYears(modelYears.length > 0 ? modelYears : years);
    } else {
      setAvailableYears(years);
    }
  }, [formData.model, availableModels, years]);

  // Initialize available cities - optimized
  useEffect(() => {
    if (!formData.country || countries.length === 0) {
      setAvailableCities(cities);
      return;
    }

    const selectedCountryObj = countries.find(
      (c) => c.name === formData.country
    );
    if (selectedCountryObj && getCitiesByCountry[selectedCountryObj._id]) {
      const countryCities = getCitiesByCountry[selectedCountryObj._id];
      setAvailableCities(countryCities.length > 0 ? countryCities : cities);
    } else {
      setAvailableCities(cities);
    }
  }, [formData.country, countries, cities, getCitiesByCountry]);

  const handleChange = (field, value) => {
    // Handle features to ensure it's a flat array with no duplicates
    if (field === "features") {
      let flatValue = [];
      if (Array.isArray(value)) {
        flatValue = value
          .flat()
          .filter((item) => typeof item === "string" && item.trim());
      } else if (typeof value === "string" && value.trim()) {
        flatValue = value.split(",").map((item) => item.trim());
      }
      // Remove duplicates by converting to Set and back to array
      const uniqueFeatures = [...new Set(flatValue)];
      setFormData((prev) => ({ ...prev, [field]: uniqueFeatures }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // When make changes, update available models
      if (field === "make") {
        if (value) {
          const selectedMakeObj = makes.find((m) => m.name === value);
          if (selectedMakeObj) {
            const makeModels = getModelsByMake[selectedMakeObj._id] || [];
            setAvailableModels(makeModels.length > 0 ? makeModels : models);
            // Reset model if it's not available for the new make
            if (
              formData.model &&
              makeModels.length > 0 &&
              !makeModels.find((m) => m.name === formData.model)
            ) {
              setFormData((prev) => ({ ...prev, model: "" }));
            }
          } else {
            setAvailableModels(models);
          }
        } else {
          // Show all models when make is cleared
          setAvailableModels(models);
        }
      }

      // When model changes, update available years
      if (field === "model") {
        const selectedModelObj = availableModels.find((m) => m.name === value);
        if (selectedModelObj) {
          // Filter years by model if they have parentCategory, include independent years
          const modelYears = years.filter((y) => {
            if (!y.parentCategory) return true; // Include independent years
            const parentId =
              typeof y.parentCategory === "object"
                ? y.parentCategory._id
                : y.parentCategory;
            return parentId === selectedModelObj._id;
          });
          setAvailableYears(modelYears.length > 0 ? modelYears : years);
          // Reset year if it's not available for the new model
          if (
            formData.year &&
            modelYears.length > 0 &&
            !modelYears.find((y) => y.name === formData.year.toString())
          ) {
            setFormData((prev) => ({ ...prev, year: "" }));
          }
        } else {
          setAvailableYears(years);
        }
      }

      // When country changes, update available cities
      if (field === "country") {
        if (value) {
          const selectedCountryObj = countries.find((c) => c.name === value);
          if (selectedCountryObj) {
            const countryCities =
              getCitiesByCountry[selectedCountryObj._id] || [];
            setAvailableCities(
              countryCities.length > 0 ? countryCities : cities
            );
            // Reset city if it's not available for the new country
            if (
              formData.city &&
              countryCities.length > 0 &&
              !countryCities.find((c) => c.name === formData.city)
            ) {
              setFormData((prev) => ({ ...prev, city: "" }));
            }
          } else {
            setAvailableCities(cities);
          }
        } else {
          // Show all cities when country is cleared
          setAvailableCities(cities);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Early validation - check images first (most common issue)
    if (!formData.images || formData.images.length === 0) {
      toast.error("Please upload at least one car image");
      return;
    }

    // Validate required fields dynamically based on vehicle type
    const requiredFields = getRequiredFields(formData.vehicleType);

    const missing = requiredFields.filter((key) => {
      const value = formData[key];
      return !value || (typeof value === "string" && value.trim() === "");
    });

    if (missing.length) {
      toast.error(`Missing required fields: ${missing.join(", ")}`);
      return;
    }

    // Validate price
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price (must be greater than 0)");
      return;
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(formData.year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      toast.error(`Year must be between 1900 and ${currentYear + 1}`);
      return;
    }

    // Validate contact number
    if (!/^\+?\d{9,15}$/.test(formData.contactNumber)) {
      toast.error("Invalid contact number. Must be 9-15 digits.");
      return;
    }
    // geoLocation is optional - use default if not provided
    let parsedGeoLocation = null;
    if (formData.geoLocation) {
      try {
        if (Array.isArray(formData.geoLocation)) {
          parsedGeoLocation = formData.geoLocation;
        } else if (
          typeof formData.geoLocation === "string" &&
          formData.geoLocation.trim()
        ) {
          parsedGeoLocation = JSON.parse(formData.geoLocation);
        }
      } catch {
        // Invalid format, will use default
        parsedGeoLocation = null;
      }

      // Validate format if provided
      if (
        parsedGeoLocation &&
        (!Array.isArray(parsedGeoLocation) ||
          parsedGeoLocation.length !== 2 ||
          Number(parsedGeoLocation[0]) === 0 ||
          Number(parsedGeoLocation[1]) === 0 ||
          Number.isNaN(Number(parsedGeoLocation[0])) ||
          Number.isNaN(Number(parsedGeoLocation[1])))
      ) {
        // Invalid format, use default
        parsedGeoLocation = null;
      }
    }

    // Use default location (Lahore, Pakistan) if not provided
    if (!parsedGeoLocation) {
      parsedGeoLocation = [74.3587, 31.5204]; // [longitude, latitude] for Lahore, Pakistan
    }

    const data = new FormData();

    // Only set defaults for fields that are visible for this vehicle type
    const defaults = {
      colorExterior: formData.colorExterior || "N/A",
      colorInterior: formData.colorInterior || "N/A",
      mileage: formData.mileage || "0",
      location: formData.location || "",
      description: formData.description || "",
      features: formData.features.length ? formData.features : [],
    };

    // Add conditional defaults only if fields are visible
    if (isFieldVisible(formData.vehicleType, "horsepower")) {
      defaults.horsepower = formData.horsepower || "N/A";
    }
    if (isFieldVisible(formData.vehicleType, "doors")) {
      defaults.carDoors = formData.carDoors || "4";
    }
    if (isFieldVisible(formData.vehicleType, "cylinders")) {
      defaults.numberOfCylinders = formData.numberOfCylinders || "4";
    }

    // Optimize FormData construction - build in single pass
    // Add images first
    if (formData.images && formData.images.length > 0) {
      formData.images.forEach((img) => {
        if (img instanceof File) {
          data.append("images", img);
        }
      });
    }

    // Add features array as comma-separated string (more reliable with FormData)
    if (defaults.features && defaults.features.length > 0) {
      const validFeatures = defaults.features
        .filter((f) => f && typeof f === "string" && f.trim())
        .map((f) => f.trim());
      // Remove duplicates before appending
      const uniqueFeatures = [...new Set(validFeatures)];
      if (uniqueFeatures.length > 0) {
        data.append("features", uniqueFeatures.join(","));
      }
    }

    // Add all other fields efficiently
    const fieldsToAppend = [
      "title",
      "description",
      "vehicleType",
      "make",
      "model",
      "year",
      "condition",
      "price",
      "colorExterior",
      "colorInterior",
      "fuelType",
      "engineCapacity",
      "transmission",
      "mileage",
      "regionalSpec",
      "bodyType",
      "country",
      "city",
      "location",
      "sellerType",
      "carDoors",
      "contactNumber",
      "geoLocation",
      "horsepower",
      "warranty",
      "numberOfCylinders",
      "ownerType",
      "batteryRange",
      "motorPower",
    ];

    // Add vehicleTypeCategory if provided
    if (formData.vehicleTypeCategory) {
      data.append("vehicleTypeCategory", formData.vehicleTypeCategory);
    }

    fieldsToAppend.forEach((key) => {
      // Special handling for geoLocation - always append (will use default if not provided)
      if (key === "geoLocation") {
        // Always append geoLocation (parsedGeoLocation is guaranteed to have a value - either from form or default)
        data.append(key, JSON.stringify(parsedGeoLocation));
      } else {
        // Check if field should be sent based on visibility
        let shouldSend = true;

        // Don't send fields that aren't visible for this vehicle type
        if (
          key === "fuelType" &&
          !isFieldVisible(formData.vehicleType, "fuelType")
        ) {
          shouldSend = false;
        } else if (
          key === "transmission" &&
          !isFieldVisible(formData.vehicleType, "transmission")
        ) {
          shouldSend = false;
        } else if (
          key === "regionalSpec" &&
          !isFieldVisible(formData.vehicleType, "regionalSpec")
        ) {
          shouldSend = false;
        } else if (
          key === "bodyType" &&
          !isFieldVisible(formData.vehicleType, "bodyType")
        ) {
          shouldSend = false;
        } else if (
          key === "engineCapacity" &&
          !isFieldVisible(formData.vehicleType, "engineCapacity")
        ) {
          shouldSend = false;
        } else if (
          key === "horsepower" &&
          !isFieldVisible(formData.vehicleType, "horsepower")
        ) {
          shouldSend = false;
        } else if (
          key === "carDoors" &&
          !isFieldVisible(formData.vehicleType, "doors")
        ) {
          shouldSend = false;
        } else if (
          key === "numberOfCylinders" &&
          !isFieldVisible(formData.vehicleType, "cylinders")
        ) {
          shouldSend = false;
        } else if (
          key === "batteryRange" &&
          !isFieldVisible(formData.vehicleType, "batteryRange")
        ) {
          shouldSend = false;
        } else if (
          key === "motorPower" &&
          !isFieldVisible(formData.vehicleType, "motorPower")
        ) {
          shouldSend = false;
        } else if (
          (key === "sellerType" || key === "warranty" || key === "ownerType") &&
          formData.vehicleType !== "Car"
        ) {
          shouldSend = false;
        } else if (
          (key === "colorExterior" ||
            key === "colorInterior" ||
            key === "features") &&
          formData.vehicleType !== "Car"
        ) {
          shouldSend = false;
        }

        if (shouldSend) {
          const value =
            defaults[key] !== undefined ? defaults[key] : formData[key];
          if (value !== null && value !== undefined && value !== "") {
            data.append(key, String(value));
          }
        }
      }
    });

    try {
      const res = await createCar(data).unwrap();

      // Show success message (may include upgrade notification)
      if (res.message && res.message.includes("upgraded")) {
        toast.success(res.message, { duration: 5000 });
      } else {
        toast.success("Car post created successfully!");
      }

      // Update user data if role was upgraded
      if (res.data?.user) {
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (currentUser) {
          currentUser.role = res.data.user.role;
          localStorage.setItem("user", JSON.stringify(currentUser));
        }
      }

      setFormData({
        title: "",
        description: "",
        vehicleType: "Car",
        vehicleTypeCategory: "",
        make: "",
        model: "",
        year: "",
        condition: "",
        price: "",
        colorExterior: "",
        colorInterior: "",
        fuelType: "",
        engineCapacity: "",
        transmission: "",
        mileage: "",
        features: [],
        regionalSpec: "",
        bodyType: "",
        country: "",
        city: "",
        location: "",
        sellerType: "",
        carDoors: "",
        contactNumber: "",
        geoLocation: "",
        horsepower: "",
        warranty: "",
        numberOfCylinders: "",
        ownerType: "",
        batteryRange: "",
        motorPower: "",
        images: [],
      });
      setAvailableModels([]);
      setAvailableYears([]);
      setAvailableCities([]);
      navigate(`/my-listings`);
    } catch (err) {
      // Better error handling with specific messages
      const errorMessage =
        err?.data?.message || err?.message || "Failed to create car post";

      // Provide more specific error messages
      if (errorMessage.includes("validation")) {
        toast.error("Please check all required fields and try again");
      } else if (
        errorMessage.includes("image") ||
        errorMessage.includes("file")
      ) {
        toast.error("Image upload failed. Please try again with valid images");
      } else if (
        errorMessage.includes("unauthorized") ||
        errorMessage.includes("auth")
      ) {
        toast.error("Session expired. Please login again");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 md:px-20 py-8 md:py-10"
      encType="multipart/form-data"
    >
      <h1 className="text-center md:text-3xl font-semibold">Create Post</h1>

      {/* Vehicle Type Selection - Top of Form */}
      <div className="mb-6">
        <label className="block mb-3 text-center font-medium">
          Vehicle Type *
        </label>
        <div className="flex justify-center gap-4 flex-wrap">
          {["Car", "Bus", "Truck", "Van", "Bike", "E-bike"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                const newVehicleType = type;
                handleChange("vehicleType", newVehicleType);
                // Reset vehicleTypeCategory when vehicleType changes
                handleChange("vehicleTypeCategory", "");

                // Clear fields that are not visible for the new vehicle type
                if (!isFieldVisible(newVehicleType, "bodyType")) {
                  handleChange("bodyType", "");
                }
                if (!isFieldVisible(newVehicleType, "cylinders")) {
                  handleChange("numberOfCylinders", "");
                }
                if (!isFieldVisible(newVehicleType, "doors")) {
                  handleChange("carDoors", "");
                }
                if (!isFieldVisible(newVehicleType, "horsepower")) {
                  handleChange("horsepower", "");
                }
                if (!isFieldVisible(newVehicleType, "engineCapacity")) {
                  handleChange("engineCapacity", "");
                }
                if (!isFieldVisible(newVehicleType, "batteryRange")) {
                  handleChange("batteryRange", "");
                }
                if (!isFieldVisible(newVehicleType, "motorPower")) {
                  handleChange("motorPower", "");
                }
                if (!isFieldVisible(newVehicleType, "fuelType")) {
                  handleChange("fuelType", "");
                }
                if (!isFieldVisible(newVehicleType, "transmission")) {
                  handleChange("transmission", "");
                }
                if (!isFieldVisible(newVehicleType, "regionalSpec")) {
                  handleChange("regionalSpec", "");
                }
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                formData.vehicleType === type
                  ? "bg-primary-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Container */}
      <div className="border-[1px] border-gray-700 rounded-md px-5 py-5 my-4">
        <div className="my-2">
          <ImagesUpload
            onImagesChange={(files) => handleChange("images", files)}
          />
        </div>

        {/* Title - Full Width */}
        <div className="mb-2 pl-2">
          <label className="block mb-1">Title</label>
          <Input
            inputType="text"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="e.g., 2017 Toyota Fortuner V8"
            required
          />
        </div>

        {/* Make, Model, Year in same row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 pl-2">
          <div>
            <label className="block mb-1">
              {getVehicleLabel(formData.vehicleType, "make")} *
            </label>
            <select
              value={formData.make}
              onChange={(e) => handleChange("make", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={categoriesLoading}
            >
              <option value="">Select Make</option>
              {makes.map((make) => (
                <option key={make._id} value={make.name}>
                  {make.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">
              {getVehicleLabel(formData.vehicleType, "model")} *
            </label>
            <select
              value={formData.model}
              onChange={(e) => handleChange("model", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
              disabled={categoriesLoading}
            >
              <option value="">
                {categoriesLoading
                  ? "Loading..."
                  : availableModels.length === 0
                  ? "No models available"
                  : formData.make
                  ? "Select Model"
                  : "Select Model (or select Make to filter)"}
              </option>
              {availableModels.map((model) => (
                <option key={model._id} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Year *</label>
            <select
              value={formData.year}
              onChange={(e) => handleChange("year", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={categoriesLoading}
            >
              <option value="">
                {categoriesLoading
                  ? "Loading..."
                  : availableYears.length === 0
                  ? "No years available (add in admin)"
                  : "Select Year"}
              </option>
              {availableYears.map((year) => (
                <option key={year._id} value={year.name}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price - Full Width */}
        <div className="mb-2 pl-2">
          <label className="block mb-1">Price</label>
          <Input
            inputType="number"
            value={formData.price}
            onChange={(e) => handleChange("price", e.target.value)}
            placeholder="Enter price"
            required
          />
        </div>

        {/* Seller Type, Contact Number, Mileage in same row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 pl-2">
          {formData.vehicleType === "Car" && (
            <div>
              <label className="block mb-1">Seller Type</label>
              <select
                value={formData.sellerType}
                onChange={(e) => handleChange("sellerType", e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select</option>
                <option value="individual">Individual</option>
                <option value="dealer">Dealer</option>
              </select>
            </div>
          )}
          <div
            className={formData.vehicleType === "Car" ? "" : "md:col-span-3"}
          >
            <label className="block mb-1">Contact Number</label>
            <Input
              inputType="tel"
              value={formData.contactNumber}
              onChange={(e) => handleChange("contactNumber", e.target.value)}
              placeholder="e.g., +971532345332"
              required
            />
          </div>
          <div
            className={formData.vehicleType === "Car" ? "" : "md:col-span-3"}
          >
            <label className="block mb-1">Mileage (km)</label>
            <Input
              inputType="number"
              value={formData.mileage}
              onChange={(e) => handleChange("mileage", e.target.value)}
              placeholder="e.g., 50000"
            />
          </div>
        </div>

        {/* Country, City, Address in same row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 pl-2">
          <div>
            <label className="block mb-1">Country</label>
            <select
              value={formData.country || ""}
              onChange={(e) => handleChange("country", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={categoriesLoading}
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country._id} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">City</label>
            <select
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
              disabled={categoriesLoading}
            >
              <option value="">
                {categoriesLoading
                  ? "Loading..."
                  : availableCities.length === 0
                  ? "No cities available"
                  : formData.country
                  ? "Select City"
                  : "Select City (or select Country to filter)"}
              </option>
              {availableCities.map((city) => (
                <option key={city._id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Address</label>
            <Input
              inputType="text"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Enter address"
            />
          </div>
        </div>

        {/* Condition - Full Width */}
        <div className="mb-2 pl-2">
          <label className="block mb-1">Condition</label>
          <CarCondition onChange={(val) => handleChange("condition", val)} />
        </div>

        {/* Fuel Type - Full Width */}
        {isFieldVisible(formData.vehicleType, "fuelType") && (
          <div className="mb-2 pl-2">
            <label className="block mb-1">Fuel Type</label>
            <FuelSpecs
              vehicleType={formData.vehicleType}
              value={formData.fuelType}
              onChange={(val) => handleChange("fuelType", val)}
            />
          </div>
        )}

        {/* Regional Spec - Full Width */}
        {isFieldVisible(formData.vehicleType, "regionalSpec") && (
          <div className="mb-2 pl-2">
            <label className="block mb-1">Regional Spec</label>
            <RegionalSpecs
              onChange={(val) => handleChange("regionalSpec", val)}
            />
          </div>
        )}

        {/* Body Type - Full Width */}
        {isFieldVisible(formData.vehicleType, "bodyType") && (
          <div className="mb-2 pl-2">
            <label className="block mb-1">Body Type</label>
            <BodyTypes
              vehicleType={formData.vehicleType}
              value={formData.bodyType}
              onChange={(val) => handleChange("bodyType", val)}
            />
          </div>
        )}

        {/* Transmission - Full Width */}
        {isFieldVisible(formData.vehicleType, "transmission") && (
          <div className="mb-2 pl-2">
            <label className="block mb-1">Transmission</label>
            <TransmissionSpecs
              onChange={(val) => handleChange("transmission", val)}
            />
          </div>
        )}

        {/* Number of Cylinders - Full Width */}
        {isFieldVisible(formData.vehicleType, "cylinders") && (
          <div className="mb-2 pl-2">
            <label className="block mb-1">Number of Cylinders</label>
            <CylindersSpecs
              onChange={(val) => handleChange("numberOfCylinders", val)}
            />
          </div>
        )}

        {/* Exterior Color - Full Width */}
        {formData.vehicleType === "Car" && (
          <div className="mb-2 pl-2">
            <ExteriorColor
              value={formData.colorExterior}
              onChange={(val) => handleChange("colorExterior", val)}
            />
          </div>
        )}

        {/* Interior Color - Full Width */}
        {formData.vehicleType === "Car" && (
          <div className="mb-2 pl-2">
            <InteriorColor
              value={formData.colorInterior}
              onChange={(val) => handleChange("colorInterior", val)}
            />
          </div>
        )}

        {/* Car Doors - Full Width */}
        {isFieldVisible(formData.vehicleType, "doors") && (
          <div className="mb-2 pl-2">
            <label className="block mb-1">Car Doors</label>
            <DoorsSpecs onChange={(val) => handleChange("carDoors", val)} />
          </div>
        )}

        {/* Engine Capacity - Full Width */}
        {isFieldVisible(formData.vehicleType, "engineCapacity") && (
          <div className="mb-2 pl-2">
            <label className="block mb-1">Engine Capacity</label>
            <EngineCapacitySpecs
              onChange={(val) => handleChange("engineCapacity", val)}
            />
          </div>
        )}

        {/* Owner Type - Full Width */}
        {formData.vehicleType === "Car" && (
          <div className="mb-2 pl-2">
            <label className="block mb-1">Owner Type</label>
            <OwnerTypeSpecs
              onChange={(val) => handleChange("ownerType", val)}
            />
          </div>
        )}

        {/* Warranty - Full Width */}
        {formData.vehicleType === "Car" && (
          <div className="mb-2 pl-2">
            <label className="block mb-1">Warranty</label>
            <WarrantyType onChange={(val) => handleChange("warranty", val)} />
          </div>
        )}

        {isFieldVisible(formData.vehicleType, "horsepower") && (
          <div className="mb-2 pl-2">
            <label className="block mb-1">Horsepower</label>
            <HorsePowerSpecs
              onChange={(val) => handleChange("horsepower", val)}
            />
          </div>
        )}

        {isFieldVisible(formData.vehicleType, "batteryRange") && (
          <div className="pl-2">
            <label className="block mb-1">Battery Range (km)</label>
            <Input
              inputType="number"
              value={formData.batteryRange}
              onChange={(e) => handleChange("batteryRange", e.target.value)}
              placeholder="e.g., 50"
            />
          </div>
        )}

        {isFieldVisible(formData.vehicleType, "motorPower") && (
          <div className="pl-2">
            <label className="block mb-1">Motor Power (W)</label>
            <Input
              inputType="number"
              value={formData.motorPower}
              onChange={(e) => handleChange("motorPower", e.target.value)}
              placeholder="e.g., 250"
            />
          </div>
        )}

        {formData.vehicleType === "Car" && (
          <div>
            <label className="block mb-1 pl-2">Features</label>
            <TechnicalFeaturesSpecs
              onChange={(val) => handleChange("features", val)}
            />
          </div>
        )}

        {/* Location Picker - Like Uber (Before Description) */}
        <div className="mb-2 pl-2">
          <label className="block mb-1">Location *</label>
          <LocationButton
            value={formData.geoLocation}
            onChange={(locationData) => {
              // LocationButton returns { coordinates: {lat, lng}, address, formatted, backendFormat }
              if (locationData?.backendFormat) {
                handleChange("geoLocation", locationData.backendFormat);
              } else if (locationData?.coordinates) {
                // Fallback: Convert to [longitude, latitude] format for backend
                const coords = [
                  locationData.coordinates.lng,
                  locationData.coordinates.lat,
                ];
                handleChange("geoLocation", JSON.stringify(coords));
              }
              // Also update location address if provided
              if (locationData.address) {
                handleChange("location", locationData.address);
              }
            }}
            placeholder="Select location on map or use current location"
          />
        </div>

        <div className="mt-2 mb-2 pl-2">
          <label className="block mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder={
              formData.vehicleType === "Car"
                ? "Describe the car..."
                : "Describe the vehicle..."
            }
            rows={3}
            className="w-full p-2 border rounded resize-y"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary-500 text-white px-4 my-5 py-2 rounded hover:opacity-90 transition-colors w-full text-xl shadow-lg shadow-gray-400 font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {isLoading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CreatePostForm;
