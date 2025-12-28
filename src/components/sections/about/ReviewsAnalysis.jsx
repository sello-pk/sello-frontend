import React from "react";
import { FiStar } from "react-icons/fi";

const ReviewsAnalysis = () => {
  const subRatings = [
    { name: "Friendliness", rating: 5 },
    { name: "Communication", rating: 5 },
    { name: "Knowledge", rating: 5 },
    { name: "Ordering process", rating: 5 },
  ];

  const ratingDistribution = [
    { stars: 5, percentage: 89, color: "bg-green-500" },
    { stars: 4, percentage: 9, color: "bg-primary-400" },
    { stars: 3, percentage: 1, color: "bg-primary-400" },
    { stars: 2, percentage: 0, color: "bg-red-400" },
    { stars: 1, percentage: 0, color: "bg-red-600" },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-100 to-gray-50 pt-8 md:pt-12">
      <div className="bg-gradient-to-br from-[#272525] via-[#2a2a2a] to-[#1f1f1f] rounded-tl-[60px] md:rounded-tl-[80px] px-6 sm:px-8 md:px-12 lg:px-16 py-12 md:py-16 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-72 h-72 bg-primary-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative">
          {/* Title Section */}
          <div className="mb-10 md:mb-12">
            <div className="inline-block mb-4">
              <span className="text-primary-400 font-bold text-xs md:text-sm uppercase tracking-widest px-4 py-2 bg-primary-500/20 rounded-full">
                Customer Satisfaction
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
              Here's What Customers Think of Sello
            </h2>

            {/* Rating Summary */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 text-primary-400">
                  <FiStar className="w-full h-full" fill="currentColor" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl md:text-4xl font-bold text-primary-400">
                      4.8
                    </span>
                    <span className="text-xl md:text-2xl text-gray-300">out of 5</span>
                  </div>
                  <div className="flex text-primary-400 gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar key={star} className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                  209,321
                </div>
                <div className="text-base md:text-lg text-gray-400">
                  Sello Buyer Reviews
                </div>
              </div>
            </div>
          </div>

          {/* Sub Ratings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-12">
            {subRatings.map((rating, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-5 md:p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base md:text-lg font-semibold text-gray-200 capitalize">
                    {rating.name}
                  </span>
                  <div className="flex text-primary-400 gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar key={star} className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" />
                    ))}
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full transition-all duration-1000 group-hover:from-primary-300 group-hover:to-primary-400"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Rating Distribution */}
          <div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-8">
              Rating Distribution
            </h3>

            <div className="space-y-4 max-w-2xl">
              {ratingDistribution.map((item, index) => (
                <div key={index} className="group">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="w-16 md:w-20 text-sm md:text-base font-bold text-gray-300">
                      {item.stars} star{item.stars !== 1 ? "s" : ""}
                    </span>
                    <div className="flex-1 relative">
                      <div className="h-4 md:h-5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out group-hover:shadow-lg group-hover:shadow-${item.color}/50`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="w-12 md:w-16 text-right text-sm md:text-base font-bold text-gray-200">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsAnalysis;
