import React from 'react';

/**
 * Lightweight route loader for Suspense fallbacks
 * Shows a minimal loading indicator without full page overlay
 */
const RouteLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] py-12">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
};

export default RouteLoader;

