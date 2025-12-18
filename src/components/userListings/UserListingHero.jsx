import React from "react";
import { GoArrowUpRight } from "react-icons/go";
import { useNavigate } from "react-router-dom";
import { usersBrowseByCarType } from "../../assets/images/carDetails/types/bodyTypes";
import { images } from "../../assets/assets";

const UserListingHero = () => {
  const navigate = useNavigate();
  return (
    <div className="md:h-[80vh] bg-primary flex flex-col md:flex-row items-center justify-between">
      {/* Left Section */}
      <div className="w-full md:w-[60%] flex items-center px-6 md:px-20 py-10 md:py-0">
        <div>
          <h1 className="text-2xl md:text-5xl font-bold mb-8 md:mb-14">
            Your Listings
          </h1>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 my-5 md:my-7">
            <button
              onClick={() => navigate("/create-post")}
              className="flex items-center justify-center space-x-3 bg-primary-500 text-white px-5 py-2.5 rounded text-base md:text-lg hover:bg-primary-600 font-medium w-full sm:w-auto transition-colors"
            >
              <span>ADD Posts</span>
              <GoArrowUpRight />
            </button>
            <button
              onClick={() => navigate("/contact")}
              className="flex items-center justify-center space-x-3 bg-white text-primary-500 px-5 py-2.5 rounded text-base md:text-lg hover:bg-primary-500 hover:text-white font-medium border-[1px] border-primary-500 w-full sm:w-auto transition-colors"
            >
              <span>Contact Us</span>
              <GoArrowUpRight />
            </button>
          </div>

          {/* Text Links */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-7 text-sm md:text-base">
            <p>Or Browse Featured Model</p>
            <p>Sell Your Car</p>
          </div>

          {/* Car Types */}
          <div className="flex flex-wrap gap-4 md:gap-8 mt-6 md:mt-10">
            {usersBrowseByCarType.map((item) => (
              <div
                key={item.id}
                className="flex rounded-md px-3 cursor-pointer items-center gap-2 bg-white"
              >
                <h4 className="title text-sm md:text-base">
                  {item.titleValue}
                </h4>
                <img
                  src={item.image}
                  alt="body type"
                  className="h-10 md:h-12"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Section (Image) */}
      <div className="w-full md:w-[40%] h-64 md:h-full">
        <img
          src={images.userHeroSectionImg}
          alt="userHero section image"
          className="h-full rounded-bl-[155px] w-full object-cover"
        />
      </div>
    </div>
  );
};

export default UserListingHero;
