import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import FilterResultsSection from "../../components/sections/filter/FilterResultsSection";
import SortAndViewOptions from "../../components/listings/SortAndViewOptions";
import { FiX, FiFilter } from "react-icons/fi";
import Breadcrumb from "../../components/common/Breadcrumb";

const FilteredResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { filteredCars, isLoading, filters } = location.state || {};
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);

  const searchTerm = searchParams.get("search") || filters?.search || "";

  // Sort cars based on selected option
  const sortedCars = useMemo(() => {
    if (!filteredCars?.cars || !Array.isArray(filteredCars.cars)) return [];
    
    const cars = [...filteredCars.cars];
    
    switch (sortBy) {
      case "price-low":
        return cars.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price-high":
        return cars.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "year-new":
        return cars.sort((a, b) => (b.year || 0) - (a.year || 0));
      case "year-old":
        return cars.sort((a, b) => (a.year || 0) - (b.year || 0));
      case "mileage-low":
        return cars.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
      case "mileage-high":
        return cars.sort((a, b) => (b.mileage || 0) - (a.mileage || 0));
      case "oldest":
        return cars.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      case "newest":
      default:
        return cars.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  }, [filteredCars?.cars, sortBy]);

  const activeFilters = filters ? Object.entries(filters).filter(([_, value]) => value) : [];
  const totalResults = sortedCars.length || filteredCars?.total || 0;

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Search Results', path: '/search-results' }
  ];

  const removeFilter = (key) => {
    // Navigate to filter page with updated filters
    const newFilters = { ...filters };
    delete newFilters[key];
    
    // Build URL params from remaining filters
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    
    navigate(`/filter?${params.toString()}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {searchTerm ? `Search Results for "${searchTerm}"` : "Search Results"}
          </h1>
          {searchTerm && (
            <p className="text-gray-600">
              Found {totalResults} {totalResults === 1 ? "car" : "cars"} matching your search
            </p>
          )}
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FiFilter size={16} />
                Active Filters
              </h3>
              <button
                onClick={() => navigate("/filter", { replace: true })}
                className="text-sm text-primary-500 hover:text-primary-500 font-medium"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-2 bg-primary-50 text-primary-500 px-3 py-1 rounded-full text-sm font-medium"
                >
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: {value}</span>
                  <button
                    onClick={() => removeFilter(key)}
                    className="hover:text-primary-500"
                  >
                    <FiX size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sort and View Options */}
        {totalResults > 0 && (
          <SortAndViewOptions
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewChange={setViewMode}
            totalResults={totalResults}
          />
        )}

        {/* Results */}
        <FilterResultsSection 
          filteredCars={{ ...filteredCars, cars: sortedCars }} 
          isLoading={isLoading}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default FilteredResults;

