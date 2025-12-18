import React from "react";
import { Link } from "react-router-dom";
import { useVehicleCategories } from "../../../hooks/useVehicleCategories";
import { FaCar, FaBus, FaTruck, FaMotorcycle, FaBolt } from "react-icons/fa6";
import { FaShuttleVan } from "react-icons/fa";
import BuySellCards from "../../utils/BuySellCards";

const categoryIcons = {
    Car: FaCar,
    Bus: FaBus,
    Truck: FaTruck,
    Van: FaShuttleVan,
    Bike: FaMotorcycle,
    "E-bike": FaBolt,
};

const fallbackDescriptions = {
  "Car": "Cars, sedans, SUVs, and other passenger vehicles",
  "Bus": "Buses and commercial passenger vehicles",
  "Truck": "Trucks and heavy-duty vehicles",
  "Van": "Vans and utility vehicles",
  "Bike": "Motorcycles and bikes",
  "E-bike": "Electric bikes and scooters",
};

const BrowsByTypeSection = () => {
  const { categories, isLoading } = useVehicleCategories();

  // Default categories if none are loaded
  const defaultCategories = [
    { 
      name: "Car", 
      slug: "car",
      description: "Cars, sedans, SUVs, and other passenger vehicles"
    },
    { 
      name: "Bus", 
      slug: "bus",
      description: "Buses and commercial passenger vehicles"
    },
    { 
      name: "Truck", 
      slug: "truck",
      description: "Trucks and heavy-duty vehicles"
    },
    { 
      name: "Van", 
      slug: "van",
      description: "Vans and utility vehicles"
    },
    { 
      name: "Bike", 
      slug: "bike",
      description: "Motorcycles and bikes"
    },
    { 
      name: "E-bike", 
      slug: "e-bike",
      description: "Electric bikes and scooters"
    },
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-12 px-4 md:px-16">
      {/* Section Header */}
      <div className="mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2">
          Browse by Vehicle Type
        </h2>
        <p className="text-gray-600 text-center text-sm md:text-base">
          Explore our wide range of vehicles
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 max-w-7xl mx-auto">
        {displayCategories.map((category) => {
          const description = category.description || fallbackDescriptions[category.name];
          const Icon = categoryIcons[category.name] || FaCar;
          return (
            <Link
              key={category._id || category.slug}
              to={`/category/${category.slug}`}
              className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-primary-200"
            >
              {/* Card Content */}
              <div className="flex flex-col items-center justify-center p-6 md:p-8 min-h-[200px] md:min-h-[240px] gap-3">
                {/* Icon Container */}
                <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mb-2 rounded-full bg-primary-50 group-hover:bg-primary-100 transition-colors duration-300">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-14 h-14 md:w-16 md:h-16 object-contain"
                    />
                  ) : (
                    <Icon className="text-5xl md:text-6xl text-primary-500 group-hover:text-primary-500 transition-colors duration-300" />
                  )}
                </div>

                {/* Category Name */}
                <h3 className="text-base md:text-lg font-bold text-gray-800 text-center group-hover:text-primary-500 transition-colors duration-300">
                  {category.name}
                </h3>

                {/* Description */}
                {description && (
                  <p className="text-xs md:text-sm text-gray-500 text-center leading-relaxed mt-1 line-clamp-3">
                    {description}
                  </p>
                )}

                {/* Hover Arrow Indicator */}
                <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg
                    className="w-5 h-5 text-primary-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Hover Overlay Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:to-primary-500/10 transition-all duration-300 rounded-2xl pointer-events-none" />
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default BrowsByTypeSection;
