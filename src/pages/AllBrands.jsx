import React from "react";
import { useNavigate } from "react-router-dom";
import { useCarCategories } from "../hooks/useCarCategories";
import { useGetCarCountsByMakeQuery } from "../redux/services/api";
import Spinner from "../components/Spinner";

const AllBrands = () => {
  const navigate = useNavigate();
  const { makes, isLoading: categoriesLoading } = useCarCategories();
  
  // Fetch car counts by make from API
  const { data: carCountsByMake = {}, isLoading: countsLoading } = useGetCarCountsByMakeQuery();

  // Filter active brands with images and sort by order
  const activeBrands = React.useMemo(() => {
    if (!makes || makes.length === 0) return [];
    
    // Create a case-insensitive lookup map for counts
    const countsMapNormalized = {};
    Object.keys(carCountsByMake || {}).forEach(key => {
      const normalizedKey = key.trim().toLowerCase();
      countsMapNormalized[normalizedKey] = carCountsByMake[key];
    });
    
    return makes
      .filter(brand => brand.isActive && brand.image)
      .map(brand => {
        // Try to find count with case-insensitive matching
        const brandNameNormalized = (brand.name || "").trim().toLowerCase();
        const postCount = countsMapNormalized[brandNameNormalized] || 0;
        
        return {
          ...brand,
          postCount: postCount
        };
      })
      .sort((a, b) => {
        // Sort by order field first, then alphabetically
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [makes, carCountsByMake]);

  const isLoading = categoriesLoading || countsLoading;

  const handleBrandClick = (brandName) => {
    // Navigate to filter page with make parameter
    navigate(`/filter?make=${encodeURIComponent(brandName)}`);
  };

  return (
    <div className="min-h-screen bg-white pt-24 md:pt-28 pb-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 text-gray-900">
          All Car Brands
        </h1>
        <p className="text-center text-gray-600 mb-12 text-sm md:text-base">
          Explore our wide selection of car brands
        </p>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner fullScreen={false} />
        </div>
      ) : activeBrands.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No brands available at the moment.</p>
          <p className="text-gray-400 text-sm mt-2">Brands will appear here once uploaded by admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-6 place-items-center">
            {activeBrands.map((brand) => {
              const brandName = brand.name || "Unknown Brand";
              const brandImage = brand.image;

            return (
              <div
                key={brand._id || brand.slug}
                onClick={() => handleBrandClick(brandName)}
                className="flex flex-col items-center justify-center cursor-pointer group transition-all hover:scale-105"
              >
                <div className="relative bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow w-full h-24 md:h-28 flex items-center justify-center mb-2">
                  {brandImage ? (
                    <img
                      src={brandImage}
                      alt={brandName}
                      className="h-12 md:h-16 w-auto object-contain grayscale group-hover:grayscale-0 transition-all"
                      loading="lazy"
                      onError={(e) => {
                        // Hide broken images
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="text-gray-400 text-xs text-center">No Image</div>';
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-xs text-center">No Image</div>
                  )}
                  {/* Post count badge/bubble on the logo */}
                  {brand.postCount > 0 ? (
                    <div className="absolute -top-2 -right-2 bg-primary-500 text-white rounded-full min-w-[20px] h-5 md:h-6 px-1.5 md:px-2 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white z-10">
                      {brand.postCount > 99 ? '99+' : brand.postCount}
                    </div>
                  ) : null}
                </div>
                {/* Brand name below logo */}
                <div className="text-center">
                  <p className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-primary-500 transition-colors line-clamp-2 max-w-[100px]">
                    {brandName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};

export default AllBrands;
