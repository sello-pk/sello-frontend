import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { images } from "../../assets/assets";
import { FiSearch, FiArrowLeft, FiUser, FiMail, FiPhone, FiMessageCircle } from "react-icons/fi";
import { useGetMeQuery } from "../../redux/services/api";

const HelpSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const { data: currentUser } = useGetMeQuery();

  // Mock search results - in production, this would come from an API
  const allArticles = [
    { title: "How to create an account", category: "Account", link: "/help/account-login" },
    { title: "How to post a car for sale", category: "Selling", link: "/help/selling-cars" },
    { title: "Payment methods accepted", category: "Payments", link: "/help/payment-methods" },
    { title: "How to buy a car", category: "Buying", link: "/help/buying-cars" },
    { title: "Subscription billing", category: "Billing", link: "/help/billing" },
    { title: "Uploading photos", category: "Uploading", link: "/help/uploading" },
    { title: "Account settings", category: "Account", link: "/help/account-settings" },
    { title: "Safety guidelines", category: "Safety", link: "/help/safety" },
  ];

  const filteredResults = query
    ? allArticles.filter(
        (article) =>
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          article.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/help/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/help-center")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div
                onClick={() => navigate("/")}
                className="cursor-pointer flex items-center gap-3"
              >
                <img
                  src={images.logo}
                  alt="Sello Logo"
                  className="h-10 md:h-12"
                />
                <span className="text-xl font-bold text-primary-500 hidden md:block">
                  Help Center
                </span>
              </div>
            </div>

            <div
              onClick={() => navigate("/profile")}
              className="cursor-pointer flex items-center gap-2"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-gray-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <span className="hidden md:block text-gray-700 font-medium">
                {currentUser?.name || "Guest"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help articles..."
              className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-lg"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-6 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        {query && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Search Results for "{query}"
            </h2>

            {filteredResults.length > 0 ? (
              <div className="space-y-4">
                {filteredResults.map((article, index) => (
                  <div
                    key={index}
                    onClick={() => navigate(article.link)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-gray-50 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {article.title}
                        </h3>
                        <span className="text-sm text-primary-500">
                          {article.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">
                  No results found for "{query}"
                </p>
                <p className="text-gray-400 text-sm">
                  Try different keywords or browse our help categories
                </p>
              </div>
            )}
          </div>
        )}

        {!query && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-lg">
              Enter a search query to find help articles
            </p>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Still Need Help?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-primary-100">
            Our support team is here to assist you 24/7
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            <button
              onClick={() => navigate("/contact")}
              className="bg-white text-primary-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg"
            >
              <FiMessageCircle className="text-xl" />
              Contact Support
            </button>
            <a
              href="tel:+97145061300"
              className="flex items-center gap-2 text-white hover:text-primary-100 transition-colors"
            >
              <FiPhone className="text-xl" />
              <span className="text-lg font-medium">+971 45 061 300</span>
            </a>
            <a
              href="mailto:info@sello.ae"
              className="flex items-center gap-2 text-white hover:text-primary-100 transition-colors"
            >
              <FiMail className="text-xl" />
              <span className="text-lg font-medium">info@sello.ae</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpSearch;
