import React from "react";
import { Link } from "react-router-dom";
import { useGetBlogsQuery } from "../../../redux/services/api";
import { formatDate } from "../../../utils/format";
import { buildBlogUrl } from "../../../utils/urlBuilders";

const LatestBlogsSection = () => {
  const { data, isLoading } = useGetBlogsQuery({ 
    limit: 12, 
    status: 'published' 
  });

  const blogs = data?.blogs || [];

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-gray-200"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
      {/* Header Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Latest Blog Posts</h2>
          <p className="text-gray-600">Stay updated with our latest articles and insights</p>
        </div>
        <Link 
          to="/blog" 
          className="text-primary-500 hover:text-primary-500 font-medium flex items-center gap-2 transition-colors"
        >
          View All
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {blogs.map((blog) => (
          <Link
            key={blog._id}
            to={buildBlogUrl(blog)}
            className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
          >
            {/* Blog Image */}
            <div className="w-full h-48 md:h-56 overflow-hidden bg-gray-200">
              <img
                src={blog.featuredImage || "https://via.placeholder.com/600x400?text=No+Image"}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            {/* Blog Content */}
            <div className="p-6 flex-1 flex flex-col">
              {/* Category */}
              {blog.category && (
                <span className="inline-block text-xs font-semibold text-primary-500 mb-3 uppercase tracking-wide">
                  {blog.category.name}
                </span>
              )}

              {/* Title */}
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-500 transition-colors leading-tight">
                {blog.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4 line-clamp-3 flex-1">
                {blog.excerpt || blog.content?.replace(/<[^>]*>/g, '').substring(0, 150) + "..."}
              </p>

              {/* Author and Date Info */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  {blog.author?.avatar ? (
                    <img
                      src={blog.author.avatar}
                      alt={blog.author.name || "Author"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-semibold">
                      {(blog.author?.name || "A")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{blog.author?.name || "Admin"}</p>
                    <p className="text-xs text-gray-500">{formatDate(blog.publishedAt || blog.createdAt)}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{blog.readTime || 5} min</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LatestBlogsSection;
