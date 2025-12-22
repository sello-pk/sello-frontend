import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import RangeFilter from "../../utils/filter/RangeFilter";
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
import LocationButton from "../../utils/filter/LocationButton";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCarCategories } from "../../../hooks/useCarCategories";
import { isFieldVisible } from "../../../utils/vehicleFieldConfig";

const FilterForm = ({ onFilter }) => {
  // Vehicle type options - same as CreatePostForm and HeroFilter
  const vehicleTypeOptions = ["Car", "Bus", "Truck", "Van", "Bike", "E-bike"];
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [availableModels, setAvailableModels] = useState([]);
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  
  const [filters, setFilters] = useState({
    search: "",
    vehicleType: "",
    minPrice: "",
    maxPrice: "",
    make: "",
    model: "",
    minYear: "",
    maxYear: "",
    minMileage: "",
    maxMileage: "",
    condition: "",
    sellerType: "",
    bodyType: "",
    regionalSpec: "",
    fuelType: "",
    transmission: "",
    minCylinders: "",
    maxCylinders: "",
    exteriorColor: "",
    interiorColor: "",
    minDoors: "",
    maxDoors: "",
    ownerType: "",
    warranty: "",
    minHorsePower: "",
    maxHorsePower: "",
    minEngineCapacity: "",
    maxEngineCapacity: "",
    minBatteryRange: "",
    maxBatteryRange: "",
    minMotorPower: "",
    maxMotorPower: "",
    technicalFeatures: "",
    country: "",
    city: "",
    radius: "",
    userLat: "",
    userLng: "",
  });

  // Filter categories by selected vehicle type (must be after filters declaration)
  const { makes, models, getModelsByMake, years, countries, states, cities, getCitiesByCountry, getStatesByCountry, getCitiesByState, isLoading: categoriesLoading } = useCarCategories(filters.vehicleType || null);

  // Removed internal query - parent component handles it
  // const [queryParams, setQueryParams] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read URL parameters on mount and apply filters
  useEffect(() => {
    const urlFilters = {};
    
    // Read all URL parameters
    const city = searchParams.get("city");
    const bodyType = searchParams.get("bodyType");
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const yearMin = searchParams.get("yearMin");
    const yearMax = searchParams.get("yearMax");
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");
    const carDoors = searchParams.get("carDoors");

    // Build filter object from URL params
    if (city) urlFilters.city = city;
    if (bodyType) urlFilters.bodyType = bodyType;
    if (make) {
      urlFilters.make = make;
      setSelectedMake(make);
    }
    if (model) urlFilters.model = model;
    if (yearMin) urlFilters.minYear = yearMin;
    if (yearMax) urlFilters.maxYear = yearMax;
    if (priceMin) urlFilters.minPrice = priceMin;
    if (priceMax) urlFilters.maxPrice = priceMax;
    if (carDoors) {
      urlFilters.minDoors = carDoors;
      urlFilters.maxDoors = carDoors;
    }

    // Update filters state
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
      
      // Build backend filters and trigger search
      const backendFilters = {};
      if (urlFilters.city) backendFilters.city = urlFilters.city;
      if (urlFilters.bodyType) backendFilters.bodyType = urlFilters.bodyType;
      if (urlFilters.make) backendFilters.make = urlFilters.make;
      if (urlFilters.model) backendFilters.model = urlFilters.model;
      if (urlFilters.minYear) backendFilters.yearMin = urlFilters.minYear;
      if (urlFilters.maxYear) backendFilters.yearMax = urlFilters.maxYear;
      if (urlFilters.minPrice) backendFilters.priceMin = urlFilters.minPrice;
      if (urlFilters.maxPrice) backendFilters.priceMax = urlFilters.maxPrice;
      if (urlFilters.minDoors) backendFilters.doorsMin = urlFilters.minDoors;
      if (urlFilters.maxDoors) backendFilters.doorsMax = urlFilters.maxDoors;

      // Trigger filter
      if (onFilter && Object.keys(backendFilters).length > 0) {
        onFilter(backendFilters);
      }
    }
  }, [searchParams, makes, onFilter]);

  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    
    if (field === "vehicleType") {
      // Clear fields that are not relevant to selected type
      setFilters((prev) => ({
        ...prev,
        bodyType: isFieldVisible(value, "bodyType") ? prev.bodyType : "",
        minCylinders: isFieldVisible(value, "cylinders") ? prev.minCylinders : "",
        maxCylinders: isFieldVisible(value, "cylinders") ? prev.maxCylinders : "",
        minDoors: isFieldVisible(value, "doors") ? prev.minDoors : "",
        maxDoors: isFieldVisible(value, "doors") ? prev.maxDoors : "",
        minHorsePower: isFieldVisible(value, "horsepower") ? prev.minHorsePower : "",
        maxHorsePower: isFieldVisible(value, "horsepower") ? prev.maxHorsePower : "",
        minEngineCapacity: isFieldVisible(value, "engineCapacity") ? prev.minEngineCapacity : "",
        maxEngineCapacity: isFieldVisible(value, "engineCapacity") ? prev.maxEngineCapacity : "",
        minBatteryRange: isFieldVisible(value, "batteryRange") ? prev.minBatteryRange : "",
        maxBatteryRange: isFieldVisible(value, "batteryRange") ? prev.maxBatteryRange : "",
        minMotorPower: isFieldVisible(value, "motorPower") ? prev.minMotorPower : "",
        maxMotorPower: isFieldVisible(value, "motorPower") ? prev.maxMotorPower : "",
        // Keep condition and sellerType - they apply to all vehicle types
      }));
    }
    
    // When make changes, update available models
    if (field === "make") {
      setSelectedMake(value);
      if (value) {
        const selectedMakeObj = makes.find(m => m.name === value);
        if (selectedMakeObj) {
          const makeModels = getModelsByMake[selectedMakeObj._id] || [];
          setAvailableModels(makeModels.length > 0 ? makeModels : models);
          // Reset model if it's not available for the new make
          if (filters.model && makeModels.length > 0 && !makeModels.find(m => m.name === filters.model)) {
            setFilters((prev) => ({ ...prev, model: "" }));
          }
        } else {
          setAvailableModels(models);
        }
      } else {
        // Show all models when make is cleared
        setAvailableModels(models);
      }
    }
    
    // When country changes, update available cities
    if (field === "country") {
      setSelectedCountry(value);
      if (value) {
        const selectedCountryObj = countries.find(c => c.name === value);
        if (selectedCountryObj) {
          const countryCities = getCitiesByCountry[selectedCountryObj._id] || [];
          setAvailableCities(countryCities.length > 0 ? countryCities : cities);
          // Reset city if it's not available for the new country
          if (filters.city && countryCities.length > 0 && !countryCities.find(c => c.name === filters.city)) {
            setFilters((prev) => ({ ...prev, city: "" }));
          }
        } else {
          setAvailableCities(cities);
        }
      } else {
        // Show all cities when country is cleared
        setAvailableCities(cities);
      }
    }
  };
  
  // Initialize available models - show all if no make selected, filtered if make selected
  useEffect(() => {
    if (filters.make && makes.length > 0) {
      const selectedMakeObj = makes.find(m => m.name === filters.make);
      if (selectedMakeObj) {
        const makeModels = getModelsByMake[selectedMakeObj._id] || [];
        setAvailableModels(makeModels.length > 0 ? makeModels : models);
      } else {
        setAvailableModels(models);
      }
    } else {
      // Show all models when no make is selected
      setAvailableModels(models);
    }
  }, [filters.make, makes, models, getModelsByMake]);

  // Initialize available states - show all if no country selected, filtered if country selected
  useEffect(() => {
    if (filters.country && countries.length > 0 && getStatesByCountry) {
      const selectedCountryObj = countries.find(c => c.name === filters.country);
      if (selectedCountryObj) {
        const countryStates = getStatesByCountry[selectedCountryObj._id] || [];
        setAvailableStates(countryStates.length > 0 ? countryStates : states);
      } else {
        setAvailableStates(states);
      }
    } else {
      // Show all states when no country is selected
      setAvailableStates(states);
    }
  }, [filters.country, countries, states, getStatesByCountry]);

  // Initialize available cities - show all if no country/state selected, filtered if country/state selected
  useEffect(() => {
    if (filters.country && countries.length > 0) {
      const selectedCountryObj = countries.find(c => c.name === filters.country);
      if (selectedCountryObj) {
        // If state is selected, filter cities by state, otherwise by country
        if (filters.state && getCitiesByState) {
          const selectedStateObj = availableStates.find(s => s.name === filters.state);
          if (selectedStateObj && getCitiesByState[selectedStateObj._id]) {
            const stateCities = getCitiesByState[selectedStateObj._id] || [];
            setAvailableCities(stateCities.length > 0 ? stateCities : cities);
          } else {
            // Fallback to country cities
            const countryCities = getCitiesByCountry[selectedCountryObj._id] || [];
            setAvailableCities(countryCities.length > 0 ? countryCities : cities);
          }
        } else {
          // Filter by country only
          const countryCities = getCitiesByCountry[selectedCountryObj._id] || [];
          setAvailableCities(countryCities.length > 0 ? countryCities : cities);
        }
      } else {
        setAvailableCities(cities);
      }
    } else {
      // Show all cities when no country is selected
      setAvailableCities(cities);
    }
  }, [filters.country, filters.state, countries, states, cities, getCitiesByCountry, getCitiesByState, availableStates]);

  const handleRangeChange = (type, values) => {
    if (type === "price") {
      setFilters((prev) => ({
        ...prev,
        minPrice: values[0],
        maxPrice: values[1],
      }));
    } else if (type === "year") {
      setFilters((prev) => ({
        ...prev,
        minYear: values[0],
        maxYear: values[1],
      }));
    } else if (type === "mileage") {
      setFilters((prev) => ({
        ...prev,
        minMileage: values[0],
        maxMileage: values[1],
      }));
    } else if (type === "cylinders") {
      setFilters((prev) => ({
        ...prev,
        minCylinders: values[0],
        maxCylinders: values[1],
      }));
    } else if (type === "doors") {
      setFilters((prev) => ({
        ...prev,
        minDoors: values[0],
        maxDoors: values[1],
      }));
    } else if (type === "horsePower") {
      setFilters((prev) => ({
        ...prev,
        minHorsePower: values[0],
        maxHorsePower: values[1],
      }));
    } else if (type === "engineCapacity") {
      setFilters((prev) => ({
        ...prev,
        minEngineCapacity: values[0],
        maxEngineCapacity: values[1],
      }));
    } else if (type === "batteryRange") {
      setFilters((prev) => ({
        ...prev,
        minBatteryRange: values[0],
        maxBatteryRange: values[1],
      }));
    } else if (type === "motorPower") {
      setFilters((prev) => ({
        ...prev,
        minMotorPower: values[0],
        maxMotorPower: values[1],
      }));
    }
  };

  const handleLocationChange = (locationData) => {
    if (locationData && locationData.coordinates) {
      handleChange("city", locationData.city || ""); // Map to city for text filter
    } else if (typeof locationData === "string") {
      handleChange("city", locationData);
    }
  };

  const validateFilters = (filters) => {
    if (
      filters.minPrice &&
      filters.maxPrice &&
      Number(filters.minPrice) > Number(filters.maxPrice)
    ) {
      toast.error("Minimum price cannot be greater than maximum price");
      return false;
    }
    if (
      filters.minYear &&
      filters.maxYear &&
      Number(filters.minYear) > Number(filters.maxYear)
    ) {
      toast.error("Minimum year cannot be greater than maximum year");
      return false;
    }
    if (
      filters.minMileage &&
      filters.maxMileage &&
      Number(filters.minMileage) > Number(filters.maxMileage)
    ) {
      toast.error("Minimum mileage cannot be greater than maximum mileage");
      return false;
    }
    if (
      filters.minCylinders &&
      filters.maxCylinders &&
      Number(filters.minCylinders) > Number(filters.maxCylinders)
    ) {
      toast.error("Minimum cylinders cannot be greater than maximum cylinders");
      return false;
    }
    if (
      filters.minDoors &&
      filters.maxDoors &&
      Number(filters.minDoors) > Number(filters.maxDoors)
    ) {
      toast.error("Minimum doors cannot be greater than maximum doors");
      return false;
    }
    if (
      filters.minHorsePower &&
      filters.maxHorsePower &&
      Number(filters.minHorsePower) > Number(filters.maxHorsePower)
    ) {
      toast.error(
        "Minimum horsepower cannot be greater than maximum horsepower"
      );
      return false;
    }
    if (
      filters.minEngineCapacity &&
      filters.maxEngineCapacity &&
      Number(filters.minEngineCapacity) > Number(filters.maxEngineCapacity)
    ) {
      toast.error(
        "Minimum engine capacity cannot be greater than maximum engine capacity"
      );
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateFilters(filters)) return;

    const backendFilters = {};

    // Map filters to backend query
    if (filters.search) backendFilters.search = filters.search;
    if (filters.vehicleType) backendFilters.vehicleType = filters.vehicleType;
    if (filters.minPrice) backendFilters.priceMin = filters.minPrice;
    if (filters.maxPrice) backendFilters.priceMax = filters.maxPrice;
    if (filters.minYear) backendFilters.yearMin = filters.minYear;
    if (filters.maxYear) backendFilters.yearMax = filters.maxYear;
    if (filters.minMileage) backendFilters.mileageMin = filters.minMileage;
    if (filters.maxMileage) backendFilters.mileageMax = filters.maxMileage;
    if (filters.make) backendFilters.make = filters.make;
    if (filters.model) backendFilters.model = filters.model;
    if (filters.bodyType) backendFilters.bodyType = filters.bodyType;
    if (filters.regionalSpec)
      backendFilters.regionalSpec = filters.regionalSpec;
    if (filters.fuelType) backendFilters.fuelType = filters.fuelType;
    if (filters.transmission)
      backendFilters.transmission = filters.transmission;
    if (filters.minCylinders) backendFilters.cylMin = filters.minCylinders;
    if (filters.maxCylinders) backendFilters.cylMax = filters.maxCylinders;
    if (filters.exteriorColor)
      backendFilters.colorExterior = filters.exteriorColor;
    if (filters.interiorColor)
      backendFilters.colorInterior = filters.interiorColor;
    if (filters.minDoors) backendFilters.doorsMin = filters.minDoors;
    if (filters.maxDoors) backendFilters.doorsMax = filters.maxDoors;
    if (filters.ownerType) backendFilters.ownerType = filters.ownerType;
    if (filters.warranty) backendFilters.warranty = filters.warranty;
    if (filters.minHorsePower) backendFilters.hpMin = filters.minHorsePower;
    if (filters.maxHorsePower) backendFilters.hpMax = filters.maxHorsePower;
    if (filters.minEngineCapacity)
      backendFilters.engineMin = filters.minEngineCapacity;
    if (filters.maxEngineCapacity)
      backendFilters.engineMax = filters.maxEngineCapacity;
    if (filters.minBatteryRange)
      backendFilters.batteryRangeMin = filters.minBatteryRange;
    if (filters.maxBatteryRange)
      backendFilters.batteryRangeMax = filters.maxBatteryRange;
    if (filters.minMotorPower)
      backendFilters.motorPowerMin = filters.minMotorPower;
    if (filters.maxMotorPower)
      backendFilters.motorPowerMax = filters.maxMotorPower;
    if (filters.technicalFeatures)
      backendFilters.features = filters.technicalFeatures;
    if (filters.condition) backendFilters.condition = filters.condition;
    if (filters.sellerType) backendFilters.sellerType = filters.sellerType;
    if (filters.country) backendFilters.country = filters.country;
    if (filters.city) backendFilters.city = filters.city;
    if (filters.radius) backendFilters.radius = filters.radius;
    if (filters.userLat) backendFilters.userLat = filters.userLat;
    if (filters.userLng) backendFilters.userLng = filters.userLng;

    // Remove empty values
    const cleanFilters = {};
    Object.entries(backendFilters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        cleanFilters[key] = value;
      }
    });

    // Trigger filter callback
    if (onFilter && Object.keys(cleanFilters).length > 0) {
      onFilter(cleanFilters);
      toast.success("Filters applied successfully!");
    } else if (Object.keys(cleanFilters).length === 0) {
      toast.error("Please select at least one filter");
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      vehicleType: "",
      minPrice: "",
      maxPrice: "",
      make: "",
      model: "",
      minYear: "",
      maxYear: "",
      minMileage: "",
      maxMileage: "",
      condition: "",
      sellerType: "",
      bodyType: "",
      regionalSpec: "",
      fuelType: "",
      transmission: "",
      minCylinders: "",
      maxCylinders: "",
      exteriorColor: "",
      interiorColor: "",
      minDoors: "",
      maxDoors: "",
      ownerType: "",
      warranty: "",
      minHorsePower: "",
      maxHorsePower: "",
      minEngineCapacity: "",
      maxEngineCapacity: "",
      minBatteryRange: "",
      maxBatteryRange: "",
      minMotorPower: "",
      maxMotorPower: "",
      technicalFeatures: "",
      country: "",
      city: "",
      radius: "",
      userLat: "",
      userLng: "",
    });
    // setQueryParams(null); // Removed - parent handles it
    if (onFilter) onFilter(null); // Notify parent to clear results
    setSelectedMake("");
    setSelectedCountry("");
    setAvailableModels(models);
    setAvailableCities(cities);
    toast.success("Filters cleared");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Filter Cars</h2>
          <p className="text-sm text-gray-600 mt-1">Find your perfect car with advanced filters</p>
        </div>
        <button
          type="button"
          onClick={handleClearFilters}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear All
        </button>
      </div>
      <form className="space-y-6 h-auto" onSubmit={handleSubmit}>
        {/* Vehicle Type */}
        <div className="field space-y-2">
          <label className="block mb-2 text-sm font-medium text-gray-700">Vehicle Type</label>
          <select
            value={filters.vehicleType}
            onChange={(e) => handleChange("vehicleType", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Vehicle Types</option>
            {vehicleTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Title Search */}
        <div className="field space-y-2">
          <label className="block mb-2 text-sm font-medium text-gray-700">Search by Title</label>
          <Input
            inputType="text"
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            placeholder="e.g., Toyota Camry"
          />
        </div>

        {/* Price */}
        <div className="field space-y-2">
          <div className="flex flex-col sm:flex-row w-full mx-auto gap-4 items-center">
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">Price From</label>
              <Input
                inputType="number"
                value={filters.minPrice}
                onChange={(e) => handleChange("minPrice", e.target.value)}
                placeholder="Min"
              />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">To</label>
              <Input
                inputType="number"
                value={filters.maxPrice}
                onChange={(e) => handleChange("maxPrice", e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>
          <RangeFilter
            type="price"
            min={0}
            max={100000}
            onChange={(values) => handleRangeChange("price", values)}
          />
        </div>

        {/* Car Make & Model */}
        <div className="field space-y-2">
          <div className="flex flex-col sm:flex-row w-full mx-auto gap-4 items-center">
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">Car Make</label>
              <select
                value={filters.make}
                onChange={(e) => handleChange("make", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={categoriesLoading}
              >
                <option value="">All Makes</option>
                {makes.map((make) => (
                  <option key={make._id} value={make.name}>
                    {make.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">Car Model</label>
              <select
                value={filters.model}
                onChange={(e) => handleChange("model", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={categoriesLoading}
              >
                <option value="">
                  {categoriesLoading 
                    ? "Loading..." 
                    : availableModels.length === 0 
                      ? "No models available" 
                      : "All Models"}
                </option>
                {availableModels.map((model) => (
                  <option key={model._id} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Year */}
        <div className="field space-y-2">
          <div className="flex flex-col sm:flex-row w-full mx-auto gap-4 items-center">
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">Year From</label>
              <Input
                inputType="number"
                value={filters.minYear}
                onChange={(e) => handleChange("minYear", e.target.value)}
                placeholder="Min"
              />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">To</label>
              <Input
                inputType="number"
                value={filters.maxYear}
                onChange={(e) => handleChange("maxYear", e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>
          <RangeFilter
            type="year"
            min={years && years.length > 0 ? Math.min(...years.map(y => parseInt(y.name) || 1990).filter(y => !isNaN(y))) : 1990}
            max={years && years.length > 0 ? Math.max(...years.map(y => parseInt(y.name) || new Date().getFullYear()).filter(y => !isNaN(y))) : new Date().getFullYear()}
            onChange={(values) => handleRangeChange("year", values)}
          />
        </div>

        {/* Mileage */}
        <div className="field space-y-2">
          <div className="flex flex-col sm:flex-row w-full mx-auto gap-4 items-center">
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">Mileage From</label>
              <Input
                inputType="number"
                value={filters.minMileage}
                onChange={(e) => handleChange("minMileage", e.target.value)}
                placeholder="Min"
              />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">To</label>
              <Input
                inputType="number"
                value={filters.maxMileage}
                onChange={(e) => handleChange("maxMileage", e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>
          <RangeFilter
            type="mileage"
            min={0}
            max={300000}
            onChange={(values) => handleRangeChange("mileage", values)}
          />
        </div>

        {/* Cylinders */}
        {isFieldVisible(filters.vehicleType || "Car", "cylinders") && (
        <div className="field space-y-2">
          <div className="flex flex-col sm:flex-row w-full mx-auto gap-4 items-center">
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">Cylinders From</label>
              <Input
                inputType="number"
                value={filters.minCylinders}
                onChange={(e) => handleChange("minCylinders", e.target.value)}
                placeholder="Min"
              />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">To</label>
              <Input
                inputType="number"
                value={filters.maxCylinders}
                onChange={(e) => handleChange("maxCylinders", e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>
          <RangeFilter
            type="cylinders"
            min={1}
            max={16}
            onChange={(values) => handleRangeChange("cylinders", values)}
          />
        </div>
        )}

        {/* Doors */}
        {isFieldVisible(filters.vehicleType || "Car", "doors") && (
        <div className="field space-y-2">
          <div className="flex flex-col sm:flex-row w-full mx-auto gap-4 items-center">
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">Doors From</label>
              <Input
                inputType="number"
                value={filters.minDoors}
                onChange={(e) => handleChange("minDoors", e.target.value)}
                placeholder="Min"
              />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">To</label>
              <Input
                inputType="number"
                value={filters.maxDoors}
                onChange={(e) => handleChange("maxDoors", e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>
          <RangeFilter
            type="doors"
            min={1}
            max={8}
            onChange={(values) => handleRangeChange("doors", values)}
          />
        </div>
        )}

        {/* Horsepower */}
        {isFieldVisible(filters.vehicleType || "Car", "horsepower") && (
        <div className="field space-y-2">
          <div className="flex flex-col sm:flex-row w-full mx-auto gap-4 items-center">
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">Horsepower From</label>
              <Input
                inputType="number"
                value={filters.minHorsePower}
                onChange={(e) => handleChange("minHorsePower", e.target.value)}
                placeholder="Min"
              />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">To</label>
              <Input
                inputType="number"
                value={filters.maxHorsePower}
                onChange={(e) => handleChange("maxHorsePower", e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>
          <RangeFilter
            type="horsePower"
            min={50}
            max={1000}
            onChange={(values) => handleRangeChange("horsePower", values)}
          />
        </div>
        )}

        {/* Engine Capacity */}
        {isFieldVisible(filters.vehicleType || "Car", "engineCapacity") && (
        <div className="field space-y-2">
          <div className="flex flex-col sm:flex-row w-full mx-auto gap-4 items-center">
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">Engine Capacity From</label>
              <Input
                inputType="number"
                value={filters.minEngineCapacity}
                onChange={(e) =>
                  handleChange("minEngineCapacity", e.target.value)
                }
                placeholder="Min (cc)"
              />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">To</label>
              <Input
                inputType="number"
                value={filters.maxEngineCapacity}
                onChange={(e) =>
                  handleChange("maxEngineCapacity", e.target.value)
                }
                placeholder="Max (cc)"
              />
            </div>
          </div>
          <RangeFilter
            type="engineCapacity"
            min={0}
            max={5000}
            onChange={(values) => handleRangeChange("engineCapacity", values)}
          />
        </div>
        )}

        {/* Battery Range (E-bike) */}
        {isFieldVisible(filters.vehicleType || "Car", "batteryRange") && (
        <div className="field space-y-2">
          <div className="flex flex-col sm:flex-row w-full mx-auto gap-4 items-center">
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">Battery Range From (km)</label>
              <Input
                inputType="number"
                value={filters.minBatteryRange}
                onChange={(e) => handleChange("minBatteryRange", e.target.value)}
                placeholder="Min"
              />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">To</label>
              <Input
                inputType="number"
                value={filters.maxBatteryRange}
                onChange={(e) => handleChange("maxBatteryRange", e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>
        </div>
        )}

        {/* Motor Power (E-bike) */}
        {isFieldVisible(filters.vehicleType || "Car", "motorPower") && (
        <div className="field space-y-2">
          <div className="flex flex-col sm:flex-row w-full mx-auto gap-4 items-center">
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">Motor Power From (W)</label>
              <Input
                inputType="number"
                value={filters.minMotorPower}
                onChange={(e) => handleChange("minMotorPower", e.target.value)}
                placeholder="Min"
              />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">To</label>
              <Input
                inputType="number"
                value={filters.maxMotorPower}
                onChange={(e) => handleChange("maxMotorPower", e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>
        </div>
        )}

        {/* Condition Filter */}
        <div className="field space-y-2">
          <label className="block mb-2 text-sm font-medium text-gray-700">Condition</label>
          <select
            value={filters.condition || ""}
            onChange={(e) => handleChange("condition", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Conditions</option>
            <option value="New">New</option>
            <option value="Used">Used</option>
          </select>
        </div>

        {/* Seller Type Filter */}
        <div className="field space-y-2">
          <label className="block mb-2 text-sm font-medium text-gray-700">Seller Type</label>
          <select
            value={filters.sellerType || ""}
            onChange={(e) => handleChange("sellerType", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Sellers</option>
            <option value="individual">Individual</option>
            <option value="dealer">Dealer</option>
          </select>
        </div>

        {/* Other Filters */}
        {isFieldVisible(filters.vehicleType || "Car", "bodyType") && (
        <BodyTypes
          vehicleType={filters.vehicleType || "Car"}
          onBodyTypeChange={(value) => handleChange("bodyType", value)}
        />
        )}
        <RegionalSpecs
          onChange={(value) => handleChange("regionalSpec", value)}
        />
        {/* Fuel Type - hide for E-bike */}
        {isFieldVisible(filters.vehicleType || "Car", "fuelType") && (
          <FuelSpecs onChange={(value) => handleChange("fuelType", value)} />
        )}
        {/* Transmission - hide for E-bike */}
        {isFieldVisible(filters.vehicleType || "Car", "transmission") && (
          <TransmissionSpecs
            onChange={(value) => handleChange("transmission", value)}
          />
        )}
        <ExteriorColor
          value={filters.exteriorColor}
          onChange={(value) => handleChange("exteriorColor", value)}
        />
        <InteriorColor
          value={filters.interiorColor}
          onChange={(value) => handleChange("interiorColor", value)}
        />
        <OwnerTypeSpecs
          onChange={(value) => handleChange("ownerType", value)}
        />
        <WarrantyType onChange={(value) => handleChange("warranty", value)} />
        <TechnicalFeaturesSpecs
          onChange={(value) => handleChange("technicalFeatures", value)}
        />
        
        {/* Country and City */}
        <div className="field space-y-2">
          <div className="flex flex-col sm:flex-row w-full mx-auto gap-4 items-center">
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">Country</label>
              <select
                value={filters.country}
                onChange={(e) => handleChange("country", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={categoriesLoading}
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country._id} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block mb-1">City</label>
              <select
                value={filters.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={categoriesLoading}
              >
                <option value="">
                  {categoriesLoading 
                    ? "Loading..." 
                    : availableCities.length === 0 
                      ? "No cities available" 
                      : "All Cities"}
                </option>
                {availableCities.map((city) => (
                  <option key={city._id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Location Radius Filter - Styled like reference */}
        <div className="field space-y-2">
          <label className="block mb-2 text-sm font-medium text-gray-700">📍 Find Cars Near Me</label>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                if (!navigator.geolocation) {
                  toast.error("Geolocation is not supported by your browser.");
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    handleChange("userLat", lat.toString());
                    handleChange("userLng", lng.toString());
                    toast.success("Location captured! Now select a radius.");
                  },
                  (error) => {
                    toast.error("Failed to get your location. Please allow location access.");
                  },
                  {
                    enableHighAccuracy: true,
                    timeout: 10000,
                  }
                );
              }}
              className={`w-full px-4 py-3 flex items-center justify-between transition-all ${
                filters.userLat && filters.userLng
                  ? "bg-green-50 border-l-4 border-green-500"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  filters.userLat && filters.userLng ? "bg-green-100" : "bg-blue-100"
                }`}>
                  {filters.userLat && filters.userLng ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <div className={`text-sm font-medium ${
                    filters.userLat && filters.userLng ? "text-green-700" : "text-gray-700"
                  }`}>
                    {filters.userLat && filters.userLng
                      ? "Location Captured"
                      : "Where are you?"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {filters.userLat && filters.userLng
                      ? "Select radius below"
                      : "Tap to use your current location"}
                  </div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {filters.userLat && filters.userLng && (
              <div className="border-t border-gray-200 p-3 bg-gray-50">
                <label className="block text-xs font-medium text-gray-700 mb-2">Search Radius</label>
                <select
                  value={filters.radius}
                  onChange={(e) => handleChange("radius", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Select distance</option>
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                  <option value="100">Within 100 km</option>
                </select>
                {filters.radius && (
                  <p className="text-xs text-gray-500 mt-2">
                    ✓ Will show cars within {filters.radius} km of your location
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <LocationButton onChange={handleLocationChange} />

        {/* Submit */}
        <div>
          <button
            type="submit"
            className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition-colors w-full text-xl shadow-lg shadow-gray-400 font-semibold"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default FilterForm;
