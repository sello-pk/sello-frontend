import React from "react";
import { images } from "../../../assets/assets";
import { useNavigate } from "react-router-dom";
import { IoIosArrowRoundUp } from "react-icons/io";

const ExploreBrands = () => {
  const navigate = useNavigate();

  return (
    <section className="px-4 md:px-16 py-12 bg-[#F5F5F5]">
      <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8">
        {/* Text Content */}
        <div className="w-full md:w-1/2">
          <h1 className="md:text-4xl text-2xl font-semibold mb-4">
           Explore Our Premium Brands
          </h1>
          <p className="text-base text-gray-700 leading-relaxed">
            Discover a curated selection of top automotive brands known for their quality, performance, and reliability. Whether you're exploring luxury options, searching for efficiency, or comparing models among <b>cars for sale</b> across Pakistan, our premium brands give you the best driving experience.
          </p>
          <p className="text-base text-gray-700 leading-relaxed">
            No matter what you’re looking for, from family-friendly sedans to powerful SUVs, these brands help you find the right <b>car for sale in Karachi, Islamabad, Lahore</b>, or anywhere in Pakistan.
          </p>
          <button
            onClick={() => navigate("/view-all-brands")}
            className="mt-6 md:text-lg bg-primary-500 px-7 py-2.5 hover:opacity-90 rounded-md flex items-center gap-3 text-white transition-colors"
          >
            Show All Brands
            <IoIosArrowRoundUp className="text-2xl rotate-[43deg]" />
          </button>
        </div>

        {/* Image */}
        <div className="w-full md:w-1/2 flex justify-center">
          <img
            src={images.mutlipleBrandsLogo}
            alt="Multiple Brands"
            className="w-full max-w-[500px] object-contain"
          />
        </div>
      </div>
    </section>
  );
};

export default ExploreBrands;
