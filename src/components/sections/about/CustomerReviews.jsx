import React from "react";
import { FiStar } from "react-icons/fi";

const reviews = [
  {
    name: "Ahmed R.",
    location: "Karachi",
    review:
      "Sello made it incredibly easy to buy a used car in Pakistan. The listings were detailed, prices were fair, and I found my car within days. The platform is smooth and trustworthy. Highly recommended for anyone looking to buy a car online.",
    rating: 5,
  },
  {
    name: "Hina S.",
    location: "Lahore",
    review:
      "I sold my car through Sello, and the process was fast and hassle-free. I received genuine buyer inquiries and closed the deal quickly. This is by far one of the best car selling websites in Pakistan.",
    rating: 5,
  },
  {
    name: "Usman K.",
    location: "Islamabad",
    review:
      "Sello is a reliable and professional online car marketplace in Pakistan. The filters helped me find the exact model I wanted within my budget. Great experience from start to finish.",
    rating: 5,
  },
];

const CustomerReviews = () => {
  return (
    <div className="bg-gradient-to-b from-[#272525] to-[#1f1f1f] relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-400 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 px-6 md:px-10 lg:px-16 py-16 md:py-20 w-full rounded-tr-[60px] md:rounded-tr-[80px]">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-block mb-4">
            <span className="text-primary-600 font-bold text-xs md:text-sm uppercase tracking-widest px-4 py-2 bg-primary-100 rounded-full">
              Customer Testimonials
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4">
            Hear From Our Happy Customers
          </h2>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full"></div>
          </div>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Real experiences from our valued customers across Pakistan
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-primary-200 hover:-translate-y-1"
            >
              {/* Background Gradient on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Quote Icon */}
              <div className="absolute top-6 left-6 md:top-8 md:left-8 text-primary-200 text-6xl md:text-7xl font-serif opacity-20 group-hover:opacity-30 transition-opacity duration-500">
                "
              </div>

              <div className="relative">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl md:text-2xl text-gray-900">
                          {review.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <svg
                            className="w-4 h-4 text-primary-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p className="font-semibold text-base md:text-lg text-primary-600">
                            {review.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-primary-400">
                    {[...Array(review.rating)].map((_, i) => (
                      <FiStar key={i} className="w-6 h-6 md:w-7 md:h-7 drop-shadow-lg" fill="currentColor" />
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div className="pl-0 sm:pl-4">
                  <p className="text-gray-700 text-base md:text-lg leading-relaxed font-medium italic relative z-10">
                    "{review.review}"
                  </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-4 right-4 w-20 h-20 bg-primary-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerReviews;
