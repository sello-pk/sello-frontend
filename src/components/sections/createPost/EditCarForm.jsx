import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { extractCarIdFromSlug } from "../../../utils/urlBuilders";
import {
  useEditCarMutation,
  useGetSingleCarQuery,
  useGetMeQuery,
} from "../../../redux/services/api";

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
import { images } from "../../../assets/assets";
import { useCarCategories } from "../../../hooks/useCarCategories";
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

const EditCarForm = () => {
  const { id: routeParam } = useParams();
  const extractedCarId = extractCarIdFromSlug(routeParam);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    vehicleType: "Car", // Default vehicle type
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
    images: [],
    existingImages: [], // URLs of existing images
  });

  // Load car data
  const {
    data: car,
    isLoading: isLoadingCar,
    error: carError,
  } = useGetSingleCarQuery(id, {
    skip: !id,
  });
  const { data: currentUser } = useGetMeQuery();

  // Filter categories by vehicle type from formData
  const {
    makes,
    models,
    getModelsByMake,
    years,
    isLoading: categoriesLoading,
  } = useCarCategories(formData.vehicleType);
  const [selectedMake, setSelectedMake] = useState("");
  const [availableModels, setAvailableModels] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  const [editCar, { isLoading }] = useEditCarMutation();

  // Populate form when car data loads
  useEffect(() => {
    if (car && car.postedBy) {
      // Check if user owns this car
      const postedById =
        typeof car.postedBy === "object" ? car.postedBy._id : car.postedBy;
      if (
        currentUser &&
        postedById &&
        currentUser._id !== postedById &&
        currentUser.role !== "admin"
      ) {
        toast.error("You don't have permission to edit this car");
        navigate("/my-listings");
        return;
      }

      const geoLoc = car.geoLocation?.coordinates
        ? `[${car.geoLocation.coordinates[0]}, ${car.geoLocation.coordinates[1]}]`
        : "";

      setFormData({
        title: car.title || "",
        description: car.description || "",
        vehicleType: car.vehicleType || "Car", // Include vehicle type
        make: car.make || "",
        model: car.model || "",
        year: car.year?.toString() || "",
        condition: car.condition || "",
        price: car.price?.toString() || "",
        colorExterior: car.colorExterior || "",
        colorInterior: car.colorInterior || "",
        fuelType: car.fuelType || "",
        engineCapacity: car.engineCapacity || "",
        transmission: car.transmission || "",
        mileage: car.mileage?.toString() || "",
        features: Array.isArray(car.features) ? car.features : [],
        regionalSpec: car.regionalSpec || "",
        bodyType: car.bodyType || "",
        city: car.city || "",
        location: car.location || "",
        sellerType: car.sellerType || "",
        carDoors: car.carDoors?.toString() || "",
        contactNumber: car.contactNumber || "",
        geoLocation: geoLoc,
        horsepower: car.horsepower || "",
        numberOfCylinders: car.numberOfCylinders?.toString() || "",
        ownerType: car.ownerType || "",
        images: [],
        existingImages: Array.isArray(car.images)
          ? car.images.filter((img) => img)
          : [],
      });

      // Set available models and years based on loaded car
      if (car.make && makes && makes.length > 0) {
        const selectedMakeObj = makes.find((m) => m && m.name === car.make);
        if (selectedMakeObj && selectedMakeObj._id) {
          setSelectedMake(car.make);
          const makeModels =
            (getModelsByMake && getModelsByMake[selectedMakeObj._id]) || [];
          setAvailableModels(makeModels);

          if (car.model && makeModels.length > 0) {
            const selectedModelObj = makeModels.find(
              (m) => m && m.name === car.model
            );
            if (
              selectedModelObj &&
              selectedModelObj._id &&
              years &&
              years.length > 0
            ) {
              const modelYears = years.filter((y) => {
                if (!y || !y.parentCategory) return false;
                const parentId =
                  typeof y.parentCategory === "object"
                    ? y.parentCategory?._id || null
                    : y.parentCategory;
                return parentId && parentId === selectedModelObj._id;
              });
              setAvailableYears(modelYears);
            }
          }
        }
      }
    }
  }, [car, makes, getModelsByMake, years, currentUser, navigate]);

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
        setSelectedMake(value);
        const selectedMakeObj =
          makes && makes.length > 0
            ? makes.find((m) => m && m.name === value)
            : null;
        if (selectedMakeObj && selectedMakeObj._id) {
          const makeModels =
            (getModelsByMake && getModelsByMake[selectedMakeObj._id]) || [];
          setAvailableModels(makeModels);
          // Reset model if it's not available for the new make
          if (
            formData.model &&
            !makeModels.find((m) => m && m.name === formData.model)
          ) {
            setFormData((prev) => ({ ...prev, model: "" }));
          }
        }
      }

      // When model changes, update available years
      if (field === "model") {
        const selectedModelObj =
          availableModels && availableModels.length > 0
            ? availableModels.find((m) => m && m.name === value)
            : null;
        if (
          selectedModelObj &&
          selectedModelObj._id &&
          years &&
          years.length > 0
        ) {
          const modelYears = years.filter((y) => {
            if (!y || !y.parentCategory) return false;
            const parentId =
              typeof y.parentCategory === "object"
                ? y.parentCategory?._id || null
                : y.parentCategory;
            return parentId && parentId === selectedModelObj._id;
          });
          setAvailableYears(modelYears);
          // Reset year if it's not available for the new model
          if (
            formData.year &&
            !modelYears.find((y) => y && y.name === formData.year.toString())
          ) {
            setFormData((prev) => ({ ...prev, year: "" }));
          }
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
    if (!/^\+?\d{9,15}$/.test(formData.contactNumber)) {
      toast.error("Invalid contact number. Must be 9-15 digits.");
      return;
    }
    let parsedGeoLocation;
    try {
      parsedGeoLocation = formData.geoLocation
        ? JSON.parse(formData.geoLocation)
        : null;
      if (
        !parsedGeoLocation ||
        !Array.isArray(parsedGeoLocation) ||
        parsedGeoLocation.length !== 2 ||
        parsedGeoLocation[0] === 0 ||
        parsedGeoLocation[1] === 0
      ) {
        toast.error("Invalid geoLocation. Please capture valid coordinates.");
        return;
      }
    } catch {
      toast.error("Invalid geoLocation format. Use [longitude, latitude].");
      return;
    }

    const data = new FormData();
    const defaults = {
      colorExterior: formData.colorExterior || "N/A",
      colorInterior: formData.colorInterior || "N/A",
      horsepower: formData.horsepower || "N/A",
      mileage: formData.mileage || "0",
      carDoors: formData.carDoors || "4",
      numberOfCylinders: formData.numberOfCylinders || "4",
      location: formData.location || "",
      description: formData.description || "",
      features: formData.features.length ? formData.features : [],
    };

    // Add existing images (URLs) to keep them
    if (formData.existingImages && formData.existingImages.length > 0) {
      formData.existingImages.forEach((imgUrl) => {
        data.append("existingImages[]", imgUrl);
      });
    }

    // Add new image files
    if (formData.images && formData.images.length > 0) {
      formData.images.forEach((img) => {
        if (img instanceof File) {
          data.append("images", img);
        }
      });
    }

    // Add other fields
    Object.keys(formData).forEach((key) => {
      if (key === "images" || key === "existingImages") {
        // Already handled above
        return;
      } else if (key === "features") {
        // Append each feature individually to FormData
        defaults.features.forEach((feature) =>
          data.append("features[]", feature)
        );
      } else {
        data.append(
          key,
          defaults[key] !== undefined ? defaults[key] : formData[key]
        );
      }
    });

    try {
      await editCar({ carId: id, formData: data }).unwrap();
      toast.success("Car updated successfully!");
      navigate(`/cars/${id}`);
    } catch (err) {
      console.error("Edit Car Error:", err);
      toast.error(err?.data?.message || "Failed to update car");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 md:px-20 py-12"
      encType="multipart/form-data"
    >
      <h1 className="text-center md:text-3xl font-semibold">Edit Car</h1>
      {isLoadingCar && <p className="text-center">Loading car data...</p>}
      {carError && (
        <p className="text-center text-red-500">Failed to load car data</p>
      )}
      {!isLoadingCar && !car && (
        <p className="text-center text-red-500">Car not found</p>
      )}
      <div className="border-[1px] border-gray-700 rounded-md px-5 py-6 my-5">
        <div className="my-2">
          {/* Display existing images */}
          {formData.existingImages && formData.existingImages.length > 0 && (
            <div className="mb-4">
              <label className="block mb-2">Existing Images</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.existingImages.map((imgUrl, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={imgUrl}
                      alt={`Existing ${idx + 1}`}
                      className="w-24 h-24 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          existingImages: prev.existingImages.filter(
                            (_, i) => i !== idx
                          ),
                        }));
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <label className="block mb-2">Add New Images</label>
          <ImagesUpload
            onImagesChange={(files) => handleChange("images", files)}
          />
        </div>

        <div className="mb-2">
          <label className="block mb-1">Title</label>
          <Input
            inputType="text"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="e.g., 2017 Toyota Fortuner V8"
            required
          />
        </div>

        <div className="mb-2">
          <label className="block mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Describe the car..."
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="price mt-5 mb-2">
          <label className="block mb-1">Price</label>
          <Input
            inputType="number"
            value={formData.price}
            onChange={(e) => handleChange("price", e.target.value)}
            placeholder="Enter price"
            required
          />
        </div>

        <div className="mb-2">
          <label className="block mb-1">City</label>
          <Input
            inputType="text"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Enter city"
            required
          />
        </div>

        <div className="mb-2">
          <label className="block mb-1">Contact Number</label>
          <Input
            inputType="tel"
            value={formData.contactNumber}
            onChange={(e) => handleChange("contactNumber", e.target.value)}
            placeholder="e.g., +971532345332"
            required
          />
        </div>

        <div className="flex gap-6 my-2 w-full items-center">
          <div className="w-1/2">
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
          <div className="w-1/2">
            <label className="block mb-1">
              {getVehicleLabel(formData.vehicleType, "model")} *
            </label>
            <select
              value={formData.model}
              onChange={(e) => handleChange("model", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={categoriesLoading || !formData.make}
            >
              <option value="">Select Model</option>
              {availableModels.map((model) => (
                <option key={model._id} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-6 my-2 w-full items-center">
          <div className="w-1/2">
            <label className="block mb-1">Year *</label>
            <select
              value={formData.year}
              onChange={(e) => handleChange("year", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              disabled={categoriesLoading || !formData.model}
            >
              <option value="">Select Year</option>
              {availableYears.length > 0
                ? availableYears.map((year) => (
                    <option key={year._id} value={year.name}>
                      {year.name}
                    </option>
                  ))
                : // Fallback: show years from 1990 to current year if no categories
                  Array.from(
                    { length: new Date().getFullYear() - 1989 },
                    (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    }
                  )}
            </select>
          </div>
          <div className="w-1/2">
            <label className="block mb-1">Mileage (km)</label>
            <Input
              inputType="number"
              value={formData.mileage}
              onChange={(e) => handleChange("mileage", e.target.value)}
              placeholder="e.g., 50000"
            />
          </div>
        </div>

        {isFieldVisible(formData.vehicleType, "bodyType") && (
          <div>
            <label className="block mb-1">Body Type</label>
            <BodyTypes
              vehicleType={formData.vehicleType}
              onBodyTypeChange={(val) => handleChange("bodyType", val)}
            />
          </div>
        )}

        {isFieldVisible(formData.vehicleType, "regionalSpec") && (
          <div>
            <label className="block mb-1">Regional Spec</label>
            <RegionalSpecs
              onChange={(val) => handleChange("regionalSpec", val)}
            />
          </div>
        )}

        {isFieldVisible(formData.vehicleType, "fuelType") && (
          <div>
            <label className="block mb-1">Fuel Type</label>
            <FuelSpecs
              vehicleType={formData.vehicleType}
              onChange={(val) => handleChange("fuelType", val)}
            />
          </div>
        )}

        {isFieldVisible(formData.vehicleType, "transmission") && (
          <div>
            <label className="block mb-1">Transmission</label>
            <TransmissionSpecs
              onChange={(val) => handleChange("transmission", val)}
            />
          </div>
        )}

        {isFieldVisible(formData.vehicleType, "cylinders") && (
          <div>
            <label className="block mb-1">Number of Cylinders</label>
            <CylindersSpecs
              onChange={(val) => handleChange("numberOfCylinders", val)}
            />
          </div>
        )}

        <div>
          <ExteriorColor
            value={formData.colorExterior}
            onChange={(val) => handleChange("colorExterior", val)}
          />
        </div>

        <div>
          <InteriorColor
            value={formData.colorInterior}
            onChange={(val) => handleChange("colorInterior", val)}
          />
        </div>

        {isFieldVisible(formData.vehicleType, "doors") && (
          <div>
            <label className="block mb-1">Car Doors</label>
            <DoorsSpecs onChange={(val) => handleChange("carDoors", val)} />
          </div>
        )}

        <div>
          <label className="block mb-1">Owner Type</label>
          <OwnerTypeSpecs onChange={(val) => handleChange("ownerType", val)} />
        </div>

        <div>
          <label className="block mb-1">Warranty</label>
          <WarrantyType onChange={(val) => handleChange("warranty", val)} />
        </div>

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

        {isFieldVisible(formData.vehicleType, "horsepower") && (
          <div>
            <label className="block mb-1">Horsepower</label>
            <HorsePowerSpecs
              onChange={(val) => handleChange("horsepower", val)}
            />
          </div>
        )}

        {isFieldVisible(formData.vehicleType, "engineCapacity") && (
          <div>
            <label className="block mb-1">Engine Capacity</label>
            <EngineCapacitySpecs
              onChange={(val) => handleChange("engineCapacity", val)}
            />
          </div>
        )}

        <div>
          <label className="block mb-1">Features</label>
          <TechnicalFeaturesSpecs
            onChange={(val) => handleChange("features", val)}
          />
        </div>

        <div>
          <label className="block mb-1">Condition</label>
          <CarCondition onChange={(val) => handleChange("condition", val)} />
        </div>

        <div className="mb-2">
          <label className="block mb-1">Address</label>
          <Input
            inputType="text"
            value={formData.location}
            onChange={(e) => handleChange("location", e.target.value)}
            placeholder="Enter address"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary-500 text-white px-4 my-5 py-2 rounded hover:opacity-90 transition-colors w-full text-xl shadow-lg shadow-gray-400 font-semibold disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update Car"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditCarForm;
