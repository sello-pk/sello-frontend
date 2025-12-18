import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecentlyViewedCars } from "../../../hooks/useRecentlyViewedCars";
import LazyImage from "../../common/LazyImage";
import { images } from "../../../assets/assets";
import { FaCar } from "react-icons/fa6";

const RecentlyViewedCars = () => {
  const navigate = useNavigate();
  const { recentCars } = useRecentlyViewedCars();

  const VISIBLE_COUNT = 3; // show 3 cards at a time in the carousel
  const [startIndex, setStartIndex] = useState(0);

  const total = recentCars.length;

  // Auto-slider: advance every 4 seconds if more than VISIBLE_COUNT
  useEffect(() => {
    if (total <= VISIBLE_COUNT) return;

    const interval = setInterval(() => {
      setStartIndex((prev) => (prev + VISIBLE_COUNT) % total);
    }, 4000);

    return () => clearInterval(interval);
  }, [total]);

  // Compute currently visible cars (wrap around the list)
  let visibleCars = recentCars;
  if (total > VISIBLE_COUNT) {
    visibleCars = [];
    for (let i = 0; i < VISIBLE_COUNT; i += 1) {
      const idx = (startIndex + i) % total;
      visibleCars.push(recentCars[idx]);
    }
  }

  if (recentCars.length === 0) {
    return null; // Don't show section if no recently viewed cars
  }

  return (
    <div className="bg-white w-[63.5vw] rounded-xl shadow-md p-6 col-span-2 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
          Recently Looked Cars
        </h3>
      </div>

      {visibleCars.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No recently viewed cars
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 w-[60vw] gap-4 transition-all duration-300">
          {visibleCars.map((car) => {
            const carId = car._id;
            const carImage =
              (Array.isArray(car.images) && car.images[0]) ||
              (typeof car.images === "string" ? car.images : null) ||
              images.carPlaceholder;
            const carTitle =
              car.title ||
              `${car.make || ""} ${car.model || ""}`.trim() ||
              "Car";
            const carPrice = car.price
              ? `$${car.price.toLocaleString()}`
              : "Price on request";

            return (
              <div
                key={carId}
                onClick={() => navigate(`/cars/${carId}`)}
                className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="relative h-32 mb-3 rounded-lg overflow-hidden">
                  {carImage && carImage !== images.carPlaceholder ? (
                    <LazyImage
                      src={carImage}
                      alt={carTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <FaCar className="text-4xl text-gray-400" />
                    </div>
                  )}
                  {car.vehicleType && (
                    <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      {car.vehicleType}
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-gray-800 mb-1 line-clamp-1">
                  {carTitle}
                </h4>
                {car.year && (
                  <p className="text-sm text-gray-600 mb-1">{car.year}</p>
                )}
                <p className="text-lg font-bold text-primary-500">{carPrice}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentlyViewedCars;
