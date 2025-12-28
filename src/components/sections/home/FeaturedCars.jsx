import React, { useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetFilteredCarsQuery } from "../../../redux/services/api";
import { images } from "../../../assets/assets";
import { IoIosArrowRoundUp } from "react-icons/io";
import { FiStar } from "react-icons/fi";
import LazyImage from "../../common/LazyImage";
import { buildCarUrl } from "../../../utils/urlBuilders";

const FeaturedCars = () => {
  const navigate = useNavigate();

  // Fetch featured cars - only approved and not sold
  const { data: carsData, isLoading } = useGetFilteredCarsQuery({
    page: 1,
    limit: 12,
    featured: true, // Filter for featured cars only
  });

  // Get featured cars from the response (already filtered by API)
  const featuredCars = useMemo(() => {
    if (!carsData?.cars || !Array.isArray(carsData.cars)) return [];
    
    // Additional client-side filtering for safety (approved and not sold)
    return carsData.cars
      .filter(
        (car) =>
          car.featured === true &&
          car.isApproved !== false &&
          car.status !== "sold" &&
          !car.isSold
      )
      .slice(0, 6); // Show max 6 featured cars
  }, [carsData?.cars]);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="px-4 md:px-16 py-12 bg-[#F5F5F5]">
        <div className="flex items-center gap-2 mb-6">
          <FiStar className="text-primary-500 text-2xl" />
          <h2 className="md:text-3xl text-2xl font-semibold text-gray-900">
            Featured Cars
          </h2>
        </div>
        <div className="flex gap-6 md:gap-10 lg:gap-14 overflow-x-auto">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row bg-white rounded-lg shadow-md p-4 md:p-5 min-w-[90vw] sm:min-w-[80vw] md:min-w-[60vw] lg:min-w-[50vw] animate-pulse"
            >
              <div className="h-[200px] sm:h-[250px] md:h-[280px] w-full sm:w-[250px] md:w-[280px] bg-gray-200 rounded-md"></div>
              <div className="flex-1 sm:ml-6 mt-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Don't show section if no featured cars
  if (featuredCars.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="px-4 md:px-16 py-12 bg-[#F5F5F5]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FiStar className="text-primary-500 text-2xl md:text-3xl" />
          <h2 className="md:text-3xl text-2xl font-semibold text-gray-900">
            Featured Cars
          </h2>
        </div>
        {featuredCars.length > 0 && (
          <button
            onClick={() => navigate("/cars")}
            className="text-primary-500 hover:text-primary-500 text-sm md:text-base font-medium flex items-center gap-1"
          >
            View All Featured
            <IoIosArrowRoundUp className="text-xl rotate-[40deg]" />
          </button>
        )}
      </div>

      <div
        id="featuredCarsSlider"
        className="flex gap-6 md:gap-10 lg:gap-14 overflow-x-auto scroll-smooth pb-4"
      >
        {featuredCars.map((car) => {
          const carImage =
            car?.images?.[0] || images?.carPlaceholder || "https://via.placeholder.com/400x300?text=No+Image";
          const carMake = car?.make || "Unknown";
          const carModel = car?.model || "Unknown";
          const carYear = car?.year || "N/A";
          const carPrice = car?.price?.toLocaleString() || "N/A";
          const carMileage = car?.mileage || "N/A";
          const carFuelType = car?.fuelType || "N/A";
          const carTransmission = car?.transmission || "N/A";
          const carTitle = car?.title || `${carMake} ${carModel}`;
          const carVehicleType = car?.vehicleType || "Car";

          return (
            <div
              key={car._id || car.id}
              className="flex flex-col sm:flex-row bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 md:p-5 min-w-[90vw] sm:min-w-[80vw] md:min-w-[60vw] lg:min-w-[50vw] relative"
            >
              {/* Featured Badge */}
              <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                <FiStar className="text-white" size={12} />
                FEATURED
              </div>

              {/* Vehicle Type Badge */}
              {carVehicleType && (
                <div className="absolute top-4 right-4 z-10 bg-primary-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  {carVehicleType}
                </div>
              )}

              <div className="relative h-[200px] sm:h-[250px] md:h-[280px] w-full sm:w-[250px] md:w-[280px] rounded-md overflow-hidden">
                <LazyImage
                  src={carImage}
                  alt={carTitle}
                  className="w-full h-full object-cover"
                />
                {/* Boost Badge if boosted */}
                {car?.isBoosted && new Date(car?.boostExpiry) > new Date() && (
                  <div className="absolute bottom-2 left-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    ⚡ BOOSTED
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between mt-4 sm:mt-0 sm:ml-6 w-full">
                <div>
                  <h3 className="text-xl md:text-2xl font-medium mb-2">
                    {carMake} {carModel} - {carYear}
                  </h3>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    {carTitle}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={images?.milesIcon}
                        alt="miles icon"
                        className="w-5 h-5"
                      />
                      <span className="text-sm text-gray-600">
                        {carMileage} km
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <img
                        src={images?.fuelTypeIcon}
                        alt="fuel type icon"
                        className="w-5 h-5"
                      />
                      <span className="text-sm text-gray-600">
                        {carFuelType}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <img
                        src={images?.transmissionIcon}
                        alt="transmission icon"
                        className="w-5 h-5"
                      />
                      <span className="text-sm text-gray-600">
                        {carTransmission}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <h6 className="text-lg md:text-xl font-semibold text-primary-500">
                    PKR {carPrice}
                  </h6>
                  <button
                    onClick={() => car && navigate(buildCarUrl(car))}
                    className="flex items-center gap-2 text-primary-500 hover:text-primary-500 hover:underline text-sm md:text-base font-medium transition-colors"
                  >
                    View Details
                    <IoIosArrowRoundUp className="text-xl rotate-[40deg]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(FeaturedCars);

