import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGetFilteredCarsQuery } from "../../../redux/services/api";
import { images } from "../../../assets/assets";
import { IoIosArrowRoundUp, IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { FiStar, FiZap } from "react-icons/fi";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import LazyImage from "../../common/LazyImage";
import { useSaveCarMutation, useUnsaveCarMutation, useGetSavedCarsQuery } from "../../../redux/services/api";
import toast from "react-hot-toast";
import { buildCarUrl } from "../../../utils/urlBuilders";

const FeaturedCarsCarousel = () => {
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const token = localStorage.getItem("token");
  
  // Fetch featured cars
  const { data: carsData, isLoading } = useGetFilteredCarsQuery({
    page: 1,
    limit: 20,
    featured: "true", // Send as string to ensure URLSearchParams converts it correctly
  });

  // Get saved cars if user is logged in
  const { data: savedCarsData } = useGetSavedCarsQuery(undefined, {
    skip: !token,
  });
  const [saveCar, { isLoading: isSaving }] = useSaveCarMutation();
  const [unsaveCar, { isLoading: isUnsaving }] = useUnsaveCarMutation();

  // Extract saved car IDs
  const savedCars = React.useMemo(() => {
    if (!savedCarsData || !Array.isArray(savedCarsData)) return [];
    return savedCarsData.map(car => car._id || car.id).filter(Boolean);
  }, [savedCarsData]);

  // Filter featured cars
  const featuredCars = React.useMemo(() => {
    // RTK Query extracts the 'data' field from backend response
    // Backend returns { success: true, data: { cars: [...] } }
    // RTK Query returns { cars: [...], total: ..., ... }
    const cars = carsData?.cars || carsData?.data?.cars || [];
    if (!Array.isArray(cars)) {
      return [];
    }
    const filtered = cars
      .filter(
        (car) =>
          car.featured === true &&
          car.isApproved !== false &&
          car.status !== "sold" &&
          !car.isSold
      )
      .slice(0, 12); // Show max 12 featured cars
    return filtered;
  }, [carsData]);

  // Auto-scroll carousel
  useEffect(() => {
    if (featuredCars.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredCars.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [featuredCars.length]);

  // Scroll to current slide
  useEffect(() => {
    if (sliderRef.current) {
      const cardWidth = sliderRef.current.children[0]?.offsetWidth || 400;
      const gap = 24;
      const scrollPosition = currentIndex * (cardWidth + gap);
      sliderRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredCars.length) % featuredCars.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredCars.length);
  };

  const toggleSave = async (carId, e) => {
    e.stopPropagation();
    if (!token) {
      toast.error("Please login to save cars");
      navigate("/login");
      return;
    }

    try {
      if (savedCars.includes(carId)) {
        await unsaveCar(carId).unwrap();
        toast.success("Car removed from saved");
      } else {
        await saveCar(carId).unwrap();
        toast.success("Car saved successfully");
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update saved cars");
    }
  };

  if (isLoading) {
    return (
      <section className="relative overflow-hidden">
        {/* Enhanced Flag Banner Background */}
        <div className="absolute inset-0">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/90 via-primary-400/95 to-primary-500/90"></div>
          
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.15]">
            <div 
              className="w-full h-full"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)'
              }}
            ></div>
          </div>
          
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full -ml-40 -mb-40 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 md:px-16 relative z-10">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </section>
    );
  }

  if (featuredCars.length === 0) {
    return null;
  }

  return (
    <section className="relative py-16 bg-[#050B20] overflow-hidden">
      {/* Enhanced Flag Banner Background with Primary-500 Shade */}
      <div className="absolute inset-0">
        {/* Main gradient overlay for depth */}
        <div className="absolute inset-0"></div>
        
        {/* Subtle diagonal stripe pattern - Flag style */}
        <div className="absolute inset-0 opacity-[0.12]">
          <div 
            className="w-full h-full"
          ></div>
        </div>
        
        {/* Soft circular decorative elements with blur */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/15 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/15 rounded-full -ml-48 -mb-48 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white/10 rounded-full blur-3xl"></div>
        
        {/* Wave effect at bottom */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-40 opacity-20"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.4) 100%)'
          }}
        ></div>
        
        {/* Additional subtle texture */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.5) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        ></div>
      </div>

      <div className="container mx-auto px-4 md:px-16 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/25 backdrop-blur-md rounded-full p-4 shadow-lg ring-2 ring-white/20">
              <FiStar className="text-white text-3xl md:text-4xl drop-shadow-lg" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                Featured Cars
              </h2>
              <p className="text-white/95 text-sm md:text-base drop-shadow-md">
                Hand-picked premium vehicles just for you
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/cars")}
            className="hidden md:flex items-center gap-2 bg-white/25 hover:bg-white/35 backdrop-blur-md text-white px-6 py-3 rounded-lg transition-all font-medium shadow-lg ring-2 ring-white/20 hover:ring-white/30 hover:scale-105"
          >
            View All
            <IoIosArrowRoundUp className="text-xl rotate-[40deg]" />
          </button>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          {featuredCars.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-lg transition-all transform hover:scale-110"
                aria-label="Previous"
              >
                <IoIosArrowBack className="text-2xl text-primary-500" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-lg transition-all transform hover:scale-110"
                aria-label="Next"
              >
                <IoIosArrowForward className="text-2xl text-primary-500" />
              </button>
            </>
          )}

          {/* Carousel */}
          <div
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-4"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitScrollbar: { display: "none" },
            }}
          >
            {featuredCars.map((car, index) => {
              const carId = car._id;
              const carImage = car?.images?.[0] || images.carPlaceholder;
              const carMake = car?.make || "Unknown";
              const carModel = car?.model || "Unknown";
              const carYear = car?.year || "N/A";
              const carPrice = car?.price?.toLocaleString() || "N/A";
              const carMileage = car?.mileage || "N/A";
              const carFuelType = car?.fuelType || "N/A";
              const carTransmission = car?.transmission || "N/A";
              const carVehicleType = car?.vehicleType || "Car";
              const isSaved = savedCars.includes(carId);

              return (
                <div
                  key={carId}
                  onClick={() => navigate(buildCarUrl(car))}
                  className="min-w-[320px] md:min-w-[380px] bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-2 flex-shrink-0"
                >
                  <div className="relative">
                    {/* Featured Flag Banner */}
                    <div className="absolute top-0 left-0 z-20 bg-primary-500  px-6 py-2 rounded-br-lg shadow-lg flex items-center gap-2">
                      <FiStar className="text-white" size={16} />
                      <span className="font-bold text-sm">FEATURED</span>
                    </div>

                    {/* Vehicle Type Badge */}
                    <div className="absolute top-0 right-0 z-20 bg-primary-500 px-3 py-2 rounded-bl-lg shadow-lg">
                      <span className="font-semibold text-xs">{carVehicleType}</span>
                    </div>

                    {/* Car Image */}
                    <div className="relative h-48 md:h-56 overflow-hidden rounded-t-xl">
                      <LazyImage
                        src={carImage}
                        alt={`${carMake} ${carModel}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                      {/* Boost Badge */}
                      {car?.isBoosted && new Date(car?.boostExpiry) > new Date() && (
                        <div className="absolute bottom-2 left-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-lg">
                          <FiZap size={12} />
                          BOOSTED
                        </div>
                      )}

                      {/* Save Button */}
                      <button
                        onClick={(e) => toggleSave(carId, e)}
                        disabled={isSaving || isUnsaving}
                        className="absolute bottom-2 right-2 bg-white/90 hover:bg-white backdrop-blur-sm p-2 rounded-full shadow-lg transition-all disabled:opacity-50 z-10"
                        title={isSaved ? "Remove from saved" : "Save car"}
                      >
                        {isSaved ? (
                          <BsBookmarkFill className="text-primary-500 text-xl" />
                        ) : (
                          <BsBookmark className="text-gray-600 hover:text-primary-500 text-xl transition-colors" />
                        )}
                      </button>
                    </div>

                    {/* Car Details */}
                    <div className="p-5">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 line-clamp-1">
                        {carMake} {carModel} - {carYear}
                      </h3>

                      {/* Specs */}
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <img
                            src={images?.milesIcon}
                            alt="miles"
                            className="w-4 h-4"
                          />
                          <span>{carMileage} km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <img
                            src={images?.fuelTypeIcon}
                            alt="fuel"
                            className="w-4 h-4"
                          />
                          <span>{carFuelType}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <img
                            src={images?.transmissionIcon}
                            alt="transmission"
                            className="w-4 h-4"
                          />
                          <span>{carTransmission}</span>
                        </div>
                      </div>

                      {/* Price and CTA */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-sm text-gray-500">Price</p>
                          <p className="text-2xl font-bold text-primary-500">
                            PKR {carPrice}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(buildCarUrl(car));
                          }}
                          className="bg-primary-500 hover:opacity-90 px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                          View Details
                          <IoIosArrowRoundUp className="text-lg rotate-[40deg]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel Indicators */}
          {featuredCars.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {featuredCars.slice(0, Math.min(5, featuredCars.length)).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-white w-8"
                      : "bg-white/50 w-2 hover:bg-white/75"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default FeaturedCarsCarousel;

