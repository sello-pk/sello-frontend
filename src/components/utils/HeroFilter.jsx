import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCarCategories } from "../../hooks/useCarCategories";
import { useGetFilteredCarsQuery } from "../../redux/services/api";
import toast from "react-hot-toast";

const HeroFilter = () => {
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  // Vehicle type options - same as CreatePostForm
  const vehicleTypeOptions = ["Car", "Bus", "Truck", "Van", "Bike", "E-bike"];

  // Vehicle type state
  const [vehicleType, setVehicleType] = useState("");

  // Dynamic categories from admin panel - filtered by vehicle type
  const {
    makes,
    models,
    years,
    getModelsByMake,
    isLoading: categoriesLoading,
  } = useCarCategories(vehicleType || null);

  const [filters, setFilters] = useState({
    year: "",
    make: "",
    model: "",
    mileage: "",
    engine: "",
    minPrice: "",
    maxPrice: "",
  });

  const [queryParams, setQueryParams] = useState(null);

  // Fetch filtered cars when queryParams change
  const {
    data: filteredCars,
    isLoading: isSearching,
    error: searchError,
  } = useGetFilteredCarsQuery(queryParams, { skip: !queryParams });

  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    
    // Reset make and model when vehicle type changes
    if (field === "vehicleType") {
      setVehicleType(value);
      setFilters((prev) => ({ ...prev, make: "", model: "" }));
    }
  };

  // Parse mileage range to min/max values
  const parseMileage = (mileageStr) => {
    if (!mileageStr) return { min: null, max: null };
    
    if (mileageStr.includes("<")) {
      const max = parseInt(mileageStr.replace(/[^0-9]/g, ""));
      return { min: null, max: max || null };
    } else if (mileageStr.includes("+")) {
      const min = parseInt(mileageStr.replace(/[^0-9]/g, ""));
      return { min: min || null, max: null };
    } else if (mileageStr.includes("-")) {
      const parts = mileageStr.split("-").map((p) => parseInt(p.replace(/[^0-9]/g, "")));
      return { min: parts[0] || null, max: parts[1] || null };
    }
    return { min: null, max: null };
  };

  // Parse engine string to transmission and fuelType
  const parseEngine = (engineStr) => {
    if (!engineStr) return { transmission: null, fuelType: null };
    
    const transmission = engineStr.toLowerCase().includes("manual")
      ? "Manual"
      : engineStr.toLowerCase().includes("auto")
      ? "Automatic"
      : null;
    
    const fuelType = engineStr.toLowerCase().includes("electric")
      ? "Electric"
      : engineStr.toLowerCase().includes("hybrid")
      ? "Hybrid"
      : null;
    
    return { transmission, fuelType };
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    // Build backend query parameters
    const backendFilters = {};

    // Vehicle type filter
    if (vehicleType) {
      backendFilters.vehicleType = vehicleType;
    }

    // Condition from activeTab
    if (activeTab === "new") {
      backendFilters.condition = "New";
    } else if (activeTab === "used") {
      backendFilters.condition = "Used";
    }
    // "all" means no condition filter

    // Year filter
    if (filters.year) {
      backendFilters.yearMin = filters.year;
      backendFilters.yearMax = filters.year;
    }

    // Make filter
    if (filters.make) {
      backendFilters.make = filters.make;
    }

    // Model filter
    if (filters.model) {
      backendFilters.model = filters.model;
    }

    // Price filters
    if (filters.minPrice) {
      backendFilters.priceMin = filters.minPrice;
    }
    if (filters.maxPrice) {
      backendFilters.priceMax = filters.maxPrice;
    }

    // Mileage filter
    if (filters.mileage) {
      const mileageRange = parseMileage(filters.mileage);
      if (mileageRange.min !== null) {
        backendFilters.mileageMin = mileageRange.min;
      }
      if (mileageRange.max !== null) {
        backendFilters.mileageMax = mileageRange.max;
      }
    }

    // Engine/Transmission filter
    if (filters.engine) {
      const engineData = parseEngine(filters.engine);
      if (engineData.transmission) {
        backendFilters.transmission = engineData.transmission;
      }
      if (engineData.fuelType) {
        backendFilters.fuelType = engineData.fuelType;
      }
    }

    // Remove empty values
    const cleanFilters = {};
    Object.entries(backendFilters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        cleanFilters[key] = value;
      }
    });

    // Check if at least one filter is applied
    if (Object.keys(cleanFilters).length === 0) {
      toast.error("Please select at least one filter to search");
      return;
    }

    // Set query params to trigger API call
    setQueryParams(cleanFilters);
    toast.success("Searching cars...");
  };

  // Navigate to results when search completes
  useEffect(() => {
    if (filteredCars && !isSearching && queryParams) {
      navigate("/filter", {
        state: {
          filteredCars,
          isLoading: isSearching,
          filters: queryParams,
        },
      });
    }
  }, [filteredCars, isSearching, queryParams, navigate]);

  // Handle search errors
  useEffect(() => {
    if (searchError) {
      toast.error(
        searchError?.data?.message || "Failed to search cars. Please try again."
      );
    }
  }, [searchError]);

  // Year options from categories - only use dynamic data from admin
  const yearOptions = useMemo(() => {
    if (years && years.length > 0) {
      return years
        .map((y) => y.name)
        .filter(Boolean)
        .sort((a, b) => parseInt(b) - parseInt(a));
    }
    // Return empty array if no categories - no fallback dummy data
    return [];
  }, [years]);

  // Make options from categories - only use dynamic data from admin
  const makeOptions = useMemo(() => {
    if (makes && makes.length > 0) {
      return makes
        .map((m) => m.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    }
    // Return empty array if no categories - no fallback dummy data
    return [];
  }, [makes]);

  // Model options from categories, filtered by selected make when present - only use dynamic data
  const modelOptions = useMemo(() => {
    if (models && models.length > 0) {
      let modelList = [];
      if (filters.make && makes && makes.length > 0 && getModelsByMake) {
        const selectedMake = makes.find((m) => m.name === filters.make);
        if (selectedMake) {
          const listForMake = getModelsByMake[selectedMake._id] || [];
          modelList = listForMake.length > 0 ? listForMake : models;
        } else {
          modelList = models;
        }
      } else {
        // No make selected → show all models
        modelList = models;
      }
      // Sort models alphabetically
      return modelList
        .map((m) => m.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    }
    // Return empty array if no categories - no fallback dummy data
    return [];
  }, [models, makes, getModelsByMake, filters.make]);

  const mileageOptions = [
    "",
    "< 10000",
    "10000-25000",
    "25000-50000",
    "50000+",
  ];
  const engineOptions = [
    "",
    "5 Speed Manual",
    "6 Speed Auto",
    "Electric",
    "Hybrid",
  ];

  return (
    <div className=" flex items-center md:w-[96%] justify-center">
      <div className="w-full max-w-[95rem] mx-auto">
        {/* Main Filter Container */}
        <div className=" rounded-xl shadow-2xl overflow-hidden border-4  bg-primary-500">
          {/* Header Section */}
          <div className="bg-[#050B20] px-6 py-2 border-b border-[#050B20]">
            <h2 className="text-xl font-bold text-white">
              Find the Best Cars for Sale in Pakistan
            </h2>
          </div>

          {/* Tabs Section */}
          <div className="flex bg-[#050B20] border-b border-[#050B20]">
            {["all", "used", "new"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 text-xs font-bold uppercase transition-all ${
                  activeTab === tab
                    ? "bg-primary-500 text-gray-900"
                    : "bg-[#050B20]/50 text-white hover:bg-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Filter Section */}
          <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row">
            {/* Left Section - Orange Background with Filters */}
            <div className="bg-primary-500 p-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {/* Vehicle Type Filter */}
                <FilterSelect
                  label="Vehicle Type"
                  value={vehicleType}
                  onChange={(v) => handleChange("vehicleType", v)}
                  options={["", ...vehicleTypeOptions]}
                />

                {/* Year Filter */}
                <FilterSelect
                  label="Year"
                  value={filters.year}
                  onChange={(v) => handleChange("year", v)}
                  options={["", ...yearOptions]}
                  disabled={categoriesLoading}
                  emptyMessage={categoriesLoading ? "Loading..." : yearOptions.length === 0 ? "No years available" : ""}
                />

                {/* Make Filter */}
                <FilterSelect
                  label="Select make"
                  value={filters.make}
                  onChange={(v) => {
                    handleChange("make", v);
                    // Reset model when make changes
                    if (!v) handleChange("model", "");
                  }}
                  options={["", ...makeOptions]}
                  disabled={categoriesLoading}
                  emptyMessage={categoriesLoading ? "Loading..." : makeOptions.length === 0 ? "No makes available" : ""}
                />

                {/* Model Filter */}
                <FilterSelect
                  label="Select model"
                  value={filters.model}
                  onChange={(v) => handleChange("model", v)}
                  options={["", ...modelOptions]}
                  disabled={categoriesLoading}
                  emptyMessage={
                    categoriesLoading 
                      ? "Loading..." 
                      : modelOptions.length === 0
                        ? "No models available"
                        : ""
                  }
                />

                {/* Mileage Filter */}
                <FilterSelect
                  label="Moved (km)"
                  value={filters.mileage}
                  onChange={(v) => handleChange("mileage", v)}
                  options={mileageOptions}
                />

                {/* Engine Filter */}
                <FilterSelect
                  label="Select engine"
                  value={filters.engine}
                  onChange={(v) => handleChange("engine", v)}
                  options={engineOptions}
                />
              </div>
            </div>

            {/* Right Section - Dark Background with Pricing */}
            <div className="bg-gray-800 p-4 lg:w-72 flex flex-col justify-between">
              <div>
                <h4 className="text-white text-xs font-semibold mb-3">
                  Pricing ( AED )
                </h4>

                <div className="flex gap-3 mb-4">
                  <div>
                    <label className="block text-white text-xs font-medium mb-1">
                      From
                    </label>
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleChange("minPrice", e.target.value)}
                      placeholder="Min"
                      className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-xs font-medium mb-1">
                      To
                    </label>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleChange("maxPrice", e.target.value)}
                      placeholder="Max"
                      className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="w-full bg-primary-500 hover:bg-primary-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-gray-900"
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
                    Searching...
                  </>
                ) : (
                  "Search Car"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* Reusable Components */

const FilterSelect = ({ label, value, onChange, options, disabled, emptyMessage }) => (
  <div className="flex flex-col">
    <label className="text-gray-900 text-xs font-bold mb-1 uppercase">
      {label}
    </label>
    <select
      className="w-full h-9 px-3 rounded-md bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900 border border-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options.length === 0 && emptyMessage ? (
        <option value="">{emptyMessage}</option>
      ) : (
        options.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt || `Select ${label}`}
          </option>
        ))
      )}
    </select>
  </div>
);

export default HeroFilter;
