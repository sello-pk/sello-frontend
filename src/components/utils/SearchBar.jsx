import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGetFilteredCarsQuery, api } from "../../redux/services/api";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { images } from "../../assets/assets";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [triggerSearch, setTriggerSearch] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Trigger API query only when triggerSearch is set
  const {
    data: filteredCars,
    isLoading,
    isFetching,
    error,
  } = useGetFilteredCarsQuery(triggerSearch, {
    skip: !triggerSearch,
    refetchOnMountOrArgChange: true, // Force refetch to avoid caching
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    // Clear cache for 'Cars' tag
    dispatch(api.util.invalidateTags(["Cars"]));
    const queryParams = { search: searchTerm.trim() }; // Simplified to only 'search'
    const queryString = new URLSearchParams(queryParams).toString();
    setTriggerSearch(queryParams);
  };

  // Navigate to search results when fresh data is received
  useEffect(() => {
    if (filteredCars && !isLoading && !isFetching) {
      navigate("/search-results", {
        state: { filteredCars, isLoading: false },
      });
      setTriggerSearch(null); // Reset to prevent re-navigation
      setSearchTerm(""); // Clear search input
    }
  }, [filteredCars, isLoading, isFetching, navigate]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Search Error:", error);
      toast.error(error?.data?.message || "Failed to search cars");
    }
  }, [error]);

  return (
    <form
      onSubmit={handleSearch}
      className="border border-gray-500 rounded-lg flex items-center gap-2 px-4 py-2 bg-white text-black"
    >
      <input
        className="outline-none flex-1"
        type="text"
        placeholder="Search by title, make, or model..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button type="submit" className="focus:outline-none">
        <img className="w-4" src={images.searchIcon} alt="search" />
      </button>
    </form>
  );
};

export default SearchBar;
