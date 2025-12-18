import React from "react";
import { FiShield, FiCheckCircle, FiZap, FiMonitor, FiLock } from "react-icons/fi";
import { FaCar } from "react-icons/fa";

const JoinUsSection = () => {
  const features = [
    {
      title: "Trusted Car Marketplace in Pakistan",
      icon: FiShield,
      description: "Pakistan's most trusted platform for buying and selling cars",
    },
    {
      title: "Buy & Sell Used Cars Online",
      icon: FaCar,
      description: "Seamless online experience for all your car transactions",
    },
    {
      title: "Verified Listings & Fair Pricing",
      icon: FiCheckCircle,
      description: "Every listing is verified with transparent and fair pricing",
    },
    {
      title: "Fast Car Selling for Dealers & Individuals",
      icon: FiZap,
      description: "Quick and efficient selling process for everyone",
    },
    {
      title: "User-Friendly Platform",
      icon: FiMonitor,
      description: "Intuitive interface designed for the best user experience",
    },
    {
      title: "Secure & Transparent Transactions",
      icon: FiLock,
      description: "Your safety and security is our top priority",
    },
  ];

  return (
    <div className="w-full bg-gradient-to-b from-[#272525] via-[#2a2a2a] to-[#272525] rounded-tr-[50px] md:rounded-tr-[70px] overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400 rounded-full blur-3xl"></div>
      </div>

      {/* Content Section */}
      <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex md:rounded-tl-[50px] flex-col justify-between gap-8 px-6 md:px-12 lg:px-16 py-16 md:py-20 rounded-b-[30px] md:rounded-none">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <span className="text-white/90 font-bold text-xs md:text-sm uppercase tracking-widest px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
              Why Choose Us
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4">
            Why Choose Sello?
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-24 h-1.5 bg-white/30 rounded-full"></div>
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <div className="w-24 h-1.5 bg-white/30 rounded-full"></div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 hover:-translate-y-2 hover:scale-[1.02]"
            >
              {/* Hover Effect Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400/10 to-primary-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div className="text-primary-500 mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-12 h-12 md:w-14 md:h-14" />
                </div>
                
                {/* Title */}
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 leading-tight">
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Checkmark */}
                <div className="mt-4 flex items-center text-primary-500 font-semibold">
                  <FiCheckCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm">Verified</span>
                </div>
              </div>

              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary-400/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JoinUsSection;
