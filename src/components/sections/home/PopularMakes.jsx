import  { useState, useMemo, useCallback, memo } from "react";
import { images } from "../../../assets/assets";
import { useNavigate } from "react-router-dom";
import { IoIosArrowRoundUp } from "react-icons/io";
import { useGetCarsQuery } from "../../../redux/services/api";
import { buildCarUrl } from "../../../utils/urlBuilders";

const PopularMakes = () => {
  const [selectBrand, setSelectBrand] = useState(null);
  const navigate = useNavigate();

  // Fetch cars for popular makes - get more to have variety
  const { data: carsData, isLoading } = useGetCarsQuery({ 
    page: 1, 
    limit: 20 
  });

  const cars = carsData?.cars || [];

  // Get unique popular brands from cars (top brands with most listings)
  const popularBrands = useMemo(() => {
    const brandCounts = {};
    cars.forEach(car => {
      if (car.make) {
        brandCounts[car.make] = (brandCounts[car.make] || 0) + 1;
      }
    });
    
    // Sort by count and get top 3-5 brands
    return Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand]) => brand);
  }, [cars]);

  // Filter cars by selected brand
  const filteredCars = useMemo(() => {
    if (!selectBrand) {
      // If no brand selected, show cars from popular brands
      return cars.filter(car => 
        popularBrands.includes(car.make)
      ).slice(0, 6);
    }
    return cars.filter(
      (car) => car.make?.toLowerCase() === selectBrand.toLowerCase()
    ).slice(0, 6);
  }, [cars, selectBrand, popularBrands]);

  const handleFilter = useCallback((brand) => {
    setSelectBrand((prev) => (prev === brand ? null : brand));
  }, []);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="px-4 md:px-16 py-12 bg-[#F5F5F5]">
        <h2 className="md:text-3xl text-2xl font-semibold mb-6 text-gray-900">
          Popular Makes
        </h2>
        <div className="flex gap-6 md:gap-10 lg:gap-14 overflow-x-auto">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col sm:flex-row bg-white rounded-lg shadow-md p-4 md:p-5 min-w-[90vw] sm:min-w-[80vw] md:min-w-[60vw] lg:min-w-[50vw] animate-pulse">
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

  // Don't show section if no cars or no popular brands
  if ((filteredCars.length === 0 || popularBrands.length === 0) && !isLoading) {
    return null;
  }

  return (
    <div className="px-4 md:px-16 py-12 bg-[#F5F5F5]">
      <div className="">
        <h2 className="md:text-3xl text-2xl font-semibold mb-6 text-gray-900">
          Popular Makes
        </h2>

        {popularBrands.length > 0 && (
          <div className="filter flex flex-wrap gap-5 mb-8">
            {popularBrands.map((brand) => (
              <button
                key={brand}
                onClick={() => handleFilter(brand)}
                className={`py-2 rounded-full text-sm md:text-base transition-colors duration-200 ${
                  selectBrand === brand
                    ? "text-primary-500 underline font-bold"
                    : "text-gray-800 hover:text-primary-400"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        )}

        <div
          id="popularMakesSlider"
          className="flex gap-6 md:gap-10 lg:gap-14 overflow-x-auto scroll-smooth"
        >
          {filteredCars.map((car) => {
            const carImage = car?.images?.[0] || images?.carPlaceholder || "https://via.placeholder.com/400x300?text=No+Image";
            const carMake = car?.make || "Unknown";
            const carModel = car?.model || "Unknown";
            const carYear = car?.year || "N/A";
            const carPrice = car?.price?.toLocaleString() || "N/A";
            const carMileage = car?.mileage || "N/A";
            const carFuelType = car?.fuelType || "N/A";
            const carTransmission = car?.transmission || "N/A";
            const carTitle = car?.title || `${carMake} ${carModel}`;

            return (
              <div
                key={car._id || car.id}
                className="flex flex-col sm:flex-row bg-white rounded-lg shadow-md p-4 md:p-5 min-w-[90vw] sm:min-w-[80vw] md:min-w-[60vw] lg:min-w-[50vw]"
              >
                <img
                  className="h-[200px] sm:h-[250px] md:h-[280px] w-full sm:w-[250px] md:w-[280px] object-cover rounded-md"
                  src={carImage}
                  alt={carTitle}
                  onError={(e) => {
                    e.target.src = images?.carPlaceholder || "https://via.placeholder.com/400x300?text=No+Image";
                  }}
                />
                <div className="flex flex-col justify-between mt-4 sm:mt-0 sm:ml-6 w-full">
                  <div>
                    <h3 className="text-xl md:text-2xl font-medium mb-2">
                      {carMake} {carModel} - {carYear}
                    </h3>
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      {carTitle}
                    </p>

                    <div>
                      <div className="flex items-center gap-5 my-3">
                        <img src={images?.milesIcon} alt="miles icon" className="w-5 h-5" />
                        <span className="text-sm">{carMileage} km</span>
                      </div>
                      <div className="flex items-center gap-5 my-3">
                        <img src={images?.fuelTypeIcon} alt="fuel type icon" className="w-5 h-5" />
                        <span className="text-sm">{carFuelType}</span>
                      </div>
                      <div className="flex items-center gap-5 my-3">
                        <img
                          src={images?.transmissionIcon}
                          alt="transmission icon"
                          className="w-5 h-5"
                        />
                        <span className="text-sm">{carTransmission}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <h6 className="text-lg md:text-xl font-semibold">
                      PKR {carPrice}
                    </h6>
                    <button
                      onClick={() => car && navigate(buildCarUrl(car))}
                      className="flex items-center gap-2 text-primary-500 hover:underline text-sm md:text-base"
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
    </div>
  );
};

export default memo(PopularMakes);
