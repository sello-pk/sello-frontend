import React from "react";
import { useParams } from "react-router-dom";
import { useGetSingleCarQuery } from "../../../redux/services/api";
import { FaCheckCircle, FaStar, FaMapMarkerAlt } from "react-icons/fa";
import { FiZap } from "react-icons/fi";

const CarDetailsHeroSection = () => {
  const { id } = useParams();
  const { data: car, isLoading } = useGetSingleCarQuery(id, {
    skip: !id,
  });

  if (isLoading || !car) {
    return (
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-20 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const carTitle = `${car.year || ''} ${car.make || ''} ${car.model || ''}`.trim();
  const carSubtitle = `${car.variant || ''} ${car.transmission || ''} ${car.bodyType || ''}`.trim();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-20 py-6">
        {/* Main Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              {carTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-gray-600">
              {carSubtitle && <span>{carSubtitle}</span>}
              {car.city && (
                <>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1">
                    <FaMapMarkerAlt className="text-primary-500" size={14} />
                    <span>{car.city}</span>
                  </div>
                </>
              )}
              {car.postedBy?.isVerified && (
                <>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1 text-green-600">
                    <FaCheckCircle size={14} />
                    <span className="font-medium">Verified Seller</span>
                  </div>
                </>
              )}
              {car.postedBy?.role === "dealer" && car.postedBy?.dealerInfo?.verified && (
                <>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1 text-primary-500">
                    <FaCheckCircle size={14} />
                    <span className="font-medium">Verified Dealer</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Price and Badges */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-3xl md:text-4xl font-bold text-primary-500">
                AED {car.price?.toLocaleString() || '0'}
              </p>
              {car.isSold && (
                <p className="text-red-600 font-medium text-sm mt-1">Sold</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {car.featured && (
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <FaStar size={12} />
                  FEATURED
                </span>
              )}
              {car.isBoosted && new Date(car.boostExpiry) > new Date() && (
                <span className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <FiZap size={12} />
                  BOOSTED
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetailsHeroSection;
