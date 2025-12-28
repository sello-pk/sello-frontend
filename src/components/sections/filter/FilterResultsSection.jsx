import React from "react";
import FilteredCarsResults from "./FilteredCarsResults";

const FilterResultsSection = ({ filteredCars, isLoading, viewMode = "grid" }) => {
  // Show skeleton or empty state while loading instead of spinner
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle different data structures
  const cars = Array.isArray(filteredCars?.cars) 
    ? filteredCars.cars 
    : Array.isArray(filteredCars?.data)
    ? filteredCars.data
    : Array.isArray(filteredCars)
    ? filteredCars
    : [];
  
  if (!cars || cars.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No cars found</h3>
        <p className="text-gray-500 mb-4">
          Try adjusting your search criteria or filters
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <FilteredCarsResults 
      filteredCars={filteredCars?.cars ? filteredCars : { data: cars, total: filteredCars?.total || cars.length }} 
      isLoading={isLoading} 
    />
  );
};

export default FilterResultsSection;
