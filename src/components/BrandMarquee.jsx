import React, { useRef, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCarCategories } from "../hooks/useCarCategories";

const BrandMarquee = ({ brands: propBrands = [] }) => {
  const sliderRef = useRef(null);
  const navigate = useNavigate();
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollRef = useRef(null);
  
  // Fetch brands from admin categories - always prioritize admin data
  const { makes, isLoading } = useCarCategories();
  
  // Always use admin categories if available (even if empty), only fall back to prop brands if no makes at all
  const brands = useMemo(() => {
    // If we have makes from admin, use them (filter for active ones with images)
    if (makes && makes.length > 0) {
      // Filter for active brands with images, then sort by order field
      return makes
        .filter(brand => brand.isActive && brand.image)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    // Only use prop brands if admin categories haven't loaded yet or are empty
    // This ensures admin-uploaded logos always take precedence
    return propBrands || [];
  }, [makes, propBrands]);

  // For infinite scroll marquee, we need duplicates for seamless loop
  // Only duplicate if we have multiple brands (for single brand, no need to duplicate)
  const items = useMemo(() => {
    if (brands.length === 0) return [];
    // If only 1 brand, don't duplicate (no need for infinite scroll with single item)
    if (brands.length === 1) {
      return brands;
    }
    // For multiple brands, duplicate twice for seamless infinite scroll
    return [...brands, ...brands];
  }, [brands]);
  
  // Handle brand click - navigate to filter page with brand search
  const handleBrandClick = (brandName) => {
    // Navigate to filter page with make parameter
    navigate(`/filter?make=${encodeURIComponent(brandName)}`);
  };

  const scroll = (direction) => {
    if (!sliderRef.current) return;
    const amount = direction === "left" ? -400 : 400;
    sliderRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  // Auto-scroll for infinite loop (only if we have multiple brands)
  useEffect(() => {
    const el = sliderRef.current;
    if (!el || items.length === 0 || brands.length === 0) return;
    
    // Don't auto-scroll if only 1 brand (no need for infinite loop)
    if (brands.length === 1) return;

    // Wait for DOM to render and calculate widths
    const initScroll = () => {
      if (!el) return;
      
      // Ensure we start at the beginning
      el.scrollLeft = 0;

      // Calculate the width of one set of brands (original array, not duplicated)
      // Since we duplicate twice, scrollWidth / 2 gives us the width of one set
      const calculateSingleSetWidth = () => {
        // Get the first brand element to calculate width
        const firstBrand = el.querySelector('[data-brand-item]');
        if (!firstBrand) return el.scrollWidth / 2;
        
        const brandWidth = firstBrand.offsetWidth;
        const gap = 24; // gap-6 = 24px
        return brands.length * (brandWidth + gap);
      };
      
      const singleSetWidth = calculateSingleSetWidth();

      // Clear any existing interval
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }

      const speed = 0.8; // px per tick (smooth scroll speed)
      
      autoScrollRef.current = setInterval(() => {
        if (!el || isPaused) return;

        // Get current scroll position
        const currentScroll = el.scrollLeft;
        const maxScroll = el.scrollWidth - el.clientWidth;
        
        // Reset when we've scrolled through one complete set of brands
        // This prevents showing duplicates - reset happens at exactly half the total width
        if (currentScroll >= singleSetWidth - 10) {
          // Reset to start for seamless loop (without animation for instant reset)
          el.scrollLeft = 0;
        } else if (currentScroll < maxScroll) {
          // Continue scrolling
          el.scrollLeft = currentScroll + speed;
        }
      }, 16); // ~60fps for smooth animation
    };

    // Small delay to ensure DOM is ready and images are loaded
    const timeout = setTimeout(initScroll, 200);

    return () => {
      clearTimeout(timeout);
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [items.length, brands.length, isPaused]);

  return (
    <div className="w-full py-6 backdrop-blur-sm">
      <div 
        className="relative rounded-xl px-10 py-4 overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
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
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'auto', // Use auto for programmatic scrolling
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
              const brandName = brand.name || brand.brandName || `brand-${index}`;
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
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="text-gray-400 text-xs">No Image</div>';
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
