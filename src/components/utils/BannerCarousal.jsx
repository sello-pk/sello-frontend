import React, { useState, useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { slides, mdSlides } from "../../assets/banners/banner";

const BannerCarousal = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  // Use only local slides - no API dependency
  const activeSlides = [
    {
      id: "slide1",
      image: slides.banner1,
      mobileImage: mdSlides.mbBanner1,
      title: "Find Your Perfect Car",
      linkUrl: "/cars",
    },
    {
      id: "slide2",
      image: slides.banner2,
      mobileImage: mdSlides.mbBanner2,
      title: "Sell Your Car Fast",
      linkUrl: "/create-post",
    },
    {
      id: "slide3",
      image: slides.banner3,
      mobileImage: mdSlides.mbBanner3,
      title: "Browse Premium Cars",
      linkUrl: "/cars",
    },
    {
      id: "slide4",
      image: slides.banner4,
      mobileImage: mdSlides.mbBanner4,
      title: "Find Great Deals",
      linkUrl: "/cars",
    },
    {
      id: "slide5",
      image: slides.banner5,
      mobileImage: mdSlides.mbBanner5,
      title: "Quality Vehicles",
      linkUrl: "/cars",
    },
    {
      id: "slide6",
      image: slides.banner6,
      mobileImage: mdSlides.mbBanner6,
      title: "Trusted Sellers",
      linkUrl: "/cars",
    },
  ];

  // Auto-play functionality with pause on hover
  useEffect(() => {
    if (activeSlides.length > 1 && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => {
          const nextSlide = (prev + 1) % activeSlides.length;
          return nextSlide;
        });
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeSlides.length, isPaused]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 2000);
  };

  const goToPrevious = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + activeSlides.length) % activeSlides.length
    );
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 2000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 2000);
  };

  // Early returns for no banners
  if (activeSlides.length === 0) {
    return (
      <section className="relative w-full h-[90vh] md:h-[350px] lg:h-[400px] overflow-hidden bg-gray-200 flex items-center justify-center">
        <div className="text-gray-500 text-lg">No banners available</div>
      </section>
    );
  }

  return (
    <section
      className="relative w-full h-[60vh] md:h-[350px] lg:h-[400px] overflow-hidden flex items-center justify-center bg-gradient-to-r from-primary-500 to-gray-600"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel Container */}
      <div className="relative w-full h-full overflow-hidden">
        <div
          className="flex h-full transition-transform duration-1000 ease"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {activeSlides.map((slide, index) => (
            <div
              key={slide.id || index}
              className="w-full h-full flex-shrink-0 relative"
            >
              {/* Banner Image Background - Responsive Desktop/Mobile */}
              {slide.image ? (
                <>
                  {/* Desktop Image - Visible only on Desktop and larger screens */}
                  <img
                    src={slide.image}
                    alt={slide.title || `Banner ${index + 1}`}
                    className="hidden sm:block absolute inset-0 w-full h-full object-cover object-center"
                    loading="eager"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  {/* Mobile Image - Visible only on Mobile devices */}
                  <img
                    src={slide.mobileImage || slide.image}
                    alt={slide.title || `Banner ${index + 1}`}
                    className="sm:hidden absolute inset-0 w-full h-full object-contain object-center"
                    loading="eager"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 flex items-center justify-center">
                  <span className="text-white text-xl">No Banner Image</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {activeSlides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              onMouseEnter={() => setIsPaused(true)}
              className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110 group"
              aria-label="Previous slide"
            >
              <FaChevronLeft className="w-3 h-3 text-gray-800 group-hover:text-primary-500 transition-colors" />
            </button>
            <button
              onClick={goToNext}
              onMouseEnter={() => setIsPaused(true)}
              className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110 group"
              aria-label="Next slide"
            >
              <FaChevronRight className="w-3 h-3 text-gray-800 group-hover:text-primary-500 transition-colors" />
            </button>
          </>
        )}
      </div>

      {/* Pagination Dots */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex gap-2 md:gap-3">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide
                  ? "w-3 h-3 md:w-3.5 md:h-3.5 bg-white shadow-lg"
                  : "w-2.5 h-2.5 md:w-3 md:h-3 bg-white/60 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default BannerCarousal;
