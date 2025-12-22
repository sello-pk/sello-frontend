import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { images } from "../../assets/assets";
import {
  FiSearch,
  FiUser,
  FiCreditCard,
  FiTruck,
  FiShield,
  FiSettings,
  FiHelpCircle,
  FiFileText,
  FiShoppingCart,
  FiTag,
  FiMail,
  FiPhone,
  FiMessageCircle,
  FiBook,
  FiCode,
  FiUsers,
  FiBarChart,
  FiShare2,
} from "react-icons/fi";
import { useGetMeQuery } from "../../redux/services/api";

const HelpCenter = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: currentUser } = useGetMeQuery();

  const popularTopics = [
    {
      id: 1,
      title: "Account & Login",
      icon: FiUser,
      color: "bg-primary-500",
      link: "/help/account-login",
    },
    {
      id: 2,
      title: "Buying & Selling",
      icon: FiShoppingCart,
      color: "bg-primary-500",
      link: "/help/buying-selling",
    },
    {
      id: 3,
      title: "Payments & Refunds",
      icon: FiCreditCard,
      color: "bg-primary-500",
      link: "/help/payments",
    },
    {
      id: 4,
      title: "Shipping & Delivery",
      icon: FiTruck,
      color: "bg-primary-500",
      link: "/help/shipping",
    },
    {
      id: 5,
      title: "Safety & Security",
      icon: FiShield,
      color: "bg-primary-500",
      link: "/help/safety",
    },
  ];

  const categories = [
    {
      id: 1,
      title: "Buying Cars",
      icon: FiShoppingCart,
      description: "Learn how to browse and purchase vehicles",
      link: "/help/buying-cars",
    },
    {
      id: 2,
      title: "Selling Cars",
      icon: FiTag,
      description: "Post and manage your car listings",
      link: "/help/selling-cars",
    },
    {
      id: 3,
      title: "Payment Methods",
      icon: FiCreditCard,
      description: "Payment options and transactions",
      link: "/help/payment-methods",
    },
    {
      id: 4,
      title: "Account Settings",
      icon: FiSettings,
      description: "Manage your profile and preferences",
      link: "/help/account-settings",
    },
    {
      id: 5,
      title: "FAQs",
      icon: FiHelpCircle,
      description: "Frequently asked questions",
      link: "/help/faqs",
    },
    {
      id: 6,
      title: "Policies & Terms",
      icon: FiFileText,
      description: "Terms of service and privacy policy",
      link: "/help/policies",
    },
    {
      id: 7,
      title: "Billing & Membership",
      icon: FiCreditCard,
      description: "Subscription and billing information",
      link: "/help/billing",
    },
    {
      id: 8,
      title: "Managing & Organizing",
      icon: FiBarChart,
      description: "Organize your listings and dashboard",
      link: "/help/managing",
    },
    {
      id: 9,
      title: "Uploading",
      icon: FiShare2,
      description: "Upload images and documents",
      link: "/help/uploading",
    },
    {
      id: 10,
      title: "Video Enterprise",
      icon: FiUsers,
      description: "Enterprise solutions and features",
      link: "/help/enterprise",
    },
    {
      id: 11,
      title: "Creators",
      icon: FiUsers,
      description: "Resources for content creators",
      link: "/help/creators",
    },
    {
      id: 12,
      title: "Features",
      icon: FiSettings,
      description: "Platform features and capabilities",
      link: "/help/features",
    },
    {
      id: 13,
      title: "Sales",
      icon: FiBarChart,
      description: "Sales tips and strategies",
      link: "/help/sales",
    },
    {
      id: 14,
      title: "Embedding & Sharing",
      icon: FiShare2,
      description: "Share and embed listings",
      link: "/help/sharing",
    },
    {
      id: 15,
      title: "Developers",
      icon: FiCode,
      description: "API documentation and developer resources",
      link: "/help/developers",
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or filter help articles
      navigate(`/help/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div
              onClick={() => navigate("/")}
              className="cursor-pointer flex items-center gap-3"
            >
              <img
                src={images.logo}
                alt="Sello Logo"
                className="h-12 md:h-16"
              />
              <span className="text-2xl font-bold text-primary-500 hidden md:block">
                Help Center
              </span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-4 md:mx-8">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="How can we help you today?"
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              </form>
            </div>

            {/* User Profile */}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Popular Topics Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Popular Topics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {popularTopics.map((topic) => {
              const IconComponent = topic.icon;
              return (
                <div
                  key={topic.id}
                  onClick={() => navigate(topic.link)}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 cursor-pointer transform hover:-translate-y-1 group"
                >
                  <div
                    className={`${topic.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <IconComponent className="text-white text-2xl" />
                  </div>
                  <h3 className="text-center font-semibold text-gray-900 group-hover:text-primary-500 transition-colors">
                    {topic.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </section>

        {/* Browse by Categories */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Browse by Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={category.id}
                  onClick={() => navigate(category.link)}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-primary-300 p-6 cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                        <IconComponent className="text-primary-500 text-xl" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-500 transition-colors">
                        {category.title}
                      </h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact Support Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Still Need Help?
            </h2>
            <p className="text-lg md:text-xl mb-8 text-primary-100">
              Our support team is here to assist you 24/7
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-8">
              <button
                onClick={() => navigate("/contact")}
                className="bg-white text-primary-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg"
              >
                <FiMessageCircle className="text-xl" />
                Contact Support
              </button>
              <a
                href="tel:+971501234567"
                className="flex items-center gap-2 text-white hover:text-primary-100 transition-colors"
              >
                <FiPhone className="text-xl" />
                <span className="text-lg font-medium">+971 50 123 4567</span>
              </a>
              <a
                href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL || "support@example.com"}`}
                className="flex items-center gap-2 text-white hover:text-primary-100 transition-colors"
              >
                <FiMail className="text-xl" />
                <span className="text-lg font-medium">{import.meta.env.VITE_SUPPORT_EMAIL || "support@example.com"}</span>
              </a>
            </div>
            <div className="pt-6 border-t border-primary-400">
              <button
                onClick={() => navigate("/help/faqs")}
                className="text-primary-100 hover:text-white font-medium underline transition-colors"
              >
                Browse Frequently Asked Questions →
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HelpCenter;

