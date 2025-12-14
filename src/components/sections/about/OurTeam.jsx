import React from "react";
import { aboutImages } from "../../../assets/about/aboutAssets";

const OurTeam = () => {
  const teamMembers = [
    {
      id: 1,
      name: "John Doe",
      position: "CEO",
      description:
        "Promoted to CEO in 2023 and charged with driving our next phase of growth, having successfully led our Commercial, Operations, and International teams.",
      image: aboutImages.team,
    },
    {
      id: 2,
      name: "Jane Smith",
      position: "CTO",
      description:
        "Leading our technology strategy with over 15 years of experience in building scalable platforms and managing global engineering teams.",
      image: aboutImages.team,
    },
  ];

  return (
    <div className="bg-gradient-to-b from-primary-500 via-primary-600 to-primary-700 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-gradient-to-br from-gray-50 to-white py-16 md:py-20 px-4 sm:px-6 lg:px-12 rounded-tr-[60px] md:rounded-tr-[80px]">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-block mb-4">
            <span className="text-primary-600 font-bold text-xs md:text-sm uppercase tracking-widest px-4 py-2 bg-primary-100 rounded-full">
              Meet The Team
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4">
            Our Team
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full"></div>
          </div>
          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            The passionate people behind Sello's success
          </p>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 max-w-6xl mx-auto">
          {teamMembers.map((member, index) => (
            <div
              key={member.id}
              className="group relative bg-white rounded-3xl p-8 md:p-10 shadow-2xl hover:shadow-3xl transition-all duration-500 border border-gray-100 hover:-translate-y-2 hover:scale-[1.02]"
            >
              {/* Background Gradient on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative">
                {/* Image Container */}
                <div className="relative w-full max-w-[320px] sm:max-w-[400px] h-[300px] sm:h-[380px] mx-auto mb-8 flex justify-center items-end">
                  {/* Animated Background Shapes */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[120px] bg-gradient-to-br from-primary-400 to-primary-600 -rotate-3 rounded-2xl z-0 opacity-80 group-hover:opacity-100 group-hover:rotate-[-5deg] transition-all duration-500"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[75%] h-[90px] bg-gradient-to-br from-gray-800 to-gray-900 rotate-2 rounded-2xl z-10 group-hover:rotate-[4deg] transition-all duration-500"></div>

                  {/* Team Member Image */}
                  <div className="relative z-20 transform group-hover:scale-105 transition-transform duration-500">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-500/20 to-transparent rounded-full blur-xl"></div>
                    <img
                      src={member.image}
                      alt={member.name}
                      className="relative max-h-[240px] sm:max-h-[300px] object-contain w-auto drop-shadow-2xl"
                    />
                  </div>
                </div>

                {/* Text Content */}
                <div className="text-center px-4">
                  <div className="mb-4">
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-300">
                      {member.name}
                    </h3>
                    <div className="inline-block px-4 py-1.5 bg-primary-100 rounded-full">
                      <p className="font-bold text-primary-700 text-sm md:text-base uppercase tracking-wide">
                        {member.position}
                      </p>
                    </div>
                  </div>
                  <div className="h-1 w-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-700 text-base sm:text-lg leading-relaxed font-medium">
                    {member.description}
                  </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-12 h-12 bg-primary-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-primary-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OurTeam;
