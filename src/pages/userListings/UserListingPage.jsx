import React from "react";
import UserListingHero from "@components/userListings/UserListingHero";
import BrandMarquee from "@components/BrandMarquee";
import { Link } from "react-router-dom";
import { GoArrowUpRight } from "react-icons/go";
import UserListings from "@components/userListings/UsreListings";
import BannerInUesrListings from "@components/userListings/BannerInUesrListings";
import Ads from "@components/utils/Ads";
import ReviewSectionInUser from "@components/userListings/ReviewSectionInUser";
import ContactMap from "@components/userListings/ContactMap";
import NewsLatter from "@components/utils/NewsLatter";

const UserListingPage = () => {
  return (
    <div>
      <UserListingHero />
      <div className="py-5 px-10">
        <div className=" flex items-center justify-between w-full">
          <h2 className="md:text-3xl text-xl font-semibold">
            Explore Our Premium Brands
          </h2>
          <Link
            to={"/view-all-brands"}
            className="flex items-center gap-2 text-lg"
          >
            Show All Brands <GoArrowUpRight />{" "}
          </Link>
        </div>
        {/* BrandMarquee will fetch brands from admin categories automatically */}
        <BrandMarquee />
      </div>
      <UserListings />
      <BannerInUesrListings />
      <Ads />
      <ReviewSectionInUser />
      <ContactMap />
      <NewsLatter />
    </div>
  );
};

export default UserListingPage;
