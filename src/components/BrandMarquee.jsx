import React, { useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCarCategories } from "../hooks/useCarCategories";

const BrandMarquee = ({ brands: propBrands = [] }) => {
  const sliderRef = useRef(null);
  const navigate = useNavigate();

  // Fetch brands from admin categories - always prioritize admin data
  const { makes, isLoading } = useCarCategories();

  // Always use admin categories if available (even if empty), only fall back to prop brands if no makes at all
  const brands = useMemo(() => {
    // If we have makes from admin, use them (filter for active ones with images)
    if (makes && makes.length > 0) {
      // Filter for active brands with images, then sort by order field
      return makes
        .filter((brand) => brand.isActive && brand.image)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    // Only use prop brands if admin categories haven't loaded yet or are empty
    // This ensures admin-uploaded logos always take precedence
    return propBrands || [];
  }, [makes, propBrands]);

  // For infinite scroll marquee, we need duplicates for seamless CSS animation
  // Only duplicate if we have multiple brands (for single brand, no need to duplicate)
  const items = useMemo(() => {
    if (brands.length === 0) return [];
    // If only 1 brand, don't duplicate (no need for infinite scroll with single item)
    if (brands.length === 1) {
      return brands;
    }
    // For multiple brands, duplicate once for seamless infinite scroll with CSS animation
    return [...brands, ...brands];
  }, [brands]);

  // Handle brand click - navigate to filter page with brand search
  const handleBrandClick = (brandName) => {
    // Navigate to filter page with make parameter
    navigate(`/filter?make=${encodeURIComponent(brandName)}`);
  };

  // Auto-scroll using CSS animation for smoother infinite scroll
  useEffect(() => {
    const el = sliderRef.current;
    if (!el || items.length === 0 || brands.length === 0) return;

    // Don't auto-scroll if only 1 brand (no need for infinite loop)
    if (brands.length === 1) return;

    // Create CSS animation for infinite scroll
    const animationName = `marquee-${brands.length}-${Date.now()}`;
    const animationDuration = Math.max(20, brands.length * 3); // 3s per brand minimum

    // Create keyframes for the animation
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes ${animationName} {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .${animationName} {
        animation: ${animationName} ${animationDuration}s linear infinite;
      }
      .${animationName}:hover {
        animation-play-state: paused;
      }
    `;
    document.head.appendChild(styleSheet);

    // Apply animation to the container
    el.classList.add(animationName);

    return () => {
      // Clean up
      if (el && el.classList.contains(animationName)) {
        el.classList.remove(animationName);
      }
      if (styleSheet.parentNode) {
        styleSheet.parentNode.removeChild(styleSheet);
      }
    };
  }, [items.length, brands.length]);

  return (
    <div className="w-full py-6 backdrop-blur-sm">
      <div
        className="relative rounded-xl px-10 py-4 overflow-hidden"
      >
        {/* Slider buttons */}
        {brands.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scroll("left")}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-100 transition-all hover:scale-110"
              aria-label="Previous brands"
            >
              <span className="text-xl font-bold text-gray-700">&#8249;</span>
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-100 transition-all hover:scale-110"
              aria-label="Next brands"
            >
              <span className="text-xl font-bold text-gray-700">&#8250;</span>
            </button>
          </>
        )}

        {/* Slider track - auto & infinite */}
        <div
          ref={sliderRef}
          className="flex gap-4 md:gap-6 overflow-x-hidden scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            scrollBehavior: "auto", // Use auto for programmatic scrolling
            // Disable snap for smooth infinite scroll
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center w-full py-8">
              <p className="text-gray-500">Loading brands...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center w-full py-8">
              <p className="text-gray-500">No brands available</p>
            </div>
          ) : (
            items.map((brand, index) => {
              const brandName =
                brand.name || brand.brandName || `brand-${index}`;
              const brandImage = brand.image || brand.img;

              return (
                <div
                  key={`brand-${brand._id || index}-${index}`}
                  data-brand-item
                  onClick={() => handleBrandClick(brandName)}
                  className="bg-white rounded-xl p-4 flex flex-col items-center justify-center w-24 h-28 md:w-32 md:h-36 shadow-sm flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow group"
                >
                  {brandImage ? (
                    <div className="flex-1 flex items-center justify-center mb-2">
                      <img
                        src={brandImage}
                        alt={brandName}
                        className="object-contain w-full h-full max-h-16 md:max-h-20"
                        loading="lazy"
                        onError={(e) => {
                          // Hide broken images instead of showing fallback
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML =
                            '<div class="text-gray-400 text-xs">No Image</div>';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center mb-2">
                      <div className="text-gray-400 text-xs">No Image</div>
                    </div>
                  )}
                  {/* Brand name below logo */}
                  <div className="text-center">
                    <p className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-primary-500 transition-colors line-clamp-2">
                      {brandName}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandMarquee;
