import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import BlogsHeroSection from "../../components/sections/blogs/BlogsHeroSection";
import BlogPosts from "../../components/sections/blogs/allBlogs/BlogPosts";
import NewsLatter from "../../components/utils/NewsLatter";
import SEO from "../../components/common/SEO";
import { useGetAllCategoriesQuery } from "../../redux/services/adminApi";
import { FiSearch, FiX } from "react-icons/fi";

const AllBlog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  
  const { data: categoriesData } = useGetAllCategoriesQuery({ type: "blog", isActive: true });
  const categories = categoriesData || [];

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryFilter) params.set('category', categoryFilter);
    if (sortBy && sortBy !== 'newest') params.set('sort', sortBy);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setSortBy('newest');
    setSearchParams({});
  };
  
  // Update sort when URL param changes
  React.useEffect(() => {
    const sortParam = searchParams.get('sort');
    if (sortParam) {
      setSortBy(sortParam);
    } else {
      setSortBy('newest');
    }
  }, [searchParams]);

  return (
    <div>
      <SEO
        title="All Blog Posts | Sello"
        description="Browse all our blog posts about cars, automotive news, buying guides, and more."
      />
      <BlogsHeroSection />
      
      {/* Filters Section */}
      <div className="bg-gray-50 py-6 px-4 md:px-16">
        <form onSubmit={handleSearch} className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search blog posts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                const params = new URLSearchParams();
                if (search) params.set('search', search);
                if (categoryFilter) params.set('category', categoryFilter);
                if (e.target.value !== 'newest') params.set('sort', e.target.value);
                setSearchParams(params);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="mostViewed">Most Viewed</option>
              <option value="titleAsc">Title (A-Z)</option>
              <option value="titleDesc">Title (Z-A)</option>
            </select>
            
            {/* Search Button */}
            <button
              type="submit"
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors"
            >
              Search
            </button>
            
            {/* Clear Filters */}
            {(search || categoryFilter) && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <FiX size={18} />
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      <BlogPosts search={search} category={categoryFilter} sortBy={sortBy} />
      <NewsLatter />
    </div>
  );
};

export default AllBlog;
