import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useGetBlogsQuery } from "../../../../redux/services/api";

const BlogPosts = ({ search = '', category = '', sortBy = 'newest' }) => {
  const [page, setPage] = useState(1);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, category, sortBy]);
  
  const { data, isLoading, error } = useGetBlogsQuery({ 
    page, 
    limit: 12, 
    status: 'published',
    ...(search && { search }),
    ...(category && { category })
  });

  let blogs = data?.blogs || [];
  const pagination = data?.pagination || {};
  
  // Client-side sorting (since backend doesn't support sort parameter yet)
  blogs = [...blogs].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt);
      case "oldest":
        return new Date(a.publishedAt || a.createdAt) - new Date(b.publishedAt || b.createdAt);
      case "mostViewed":
        return (b.views || 0) - (a.views || 0);
      case "titleAsc":
        return (a.title || "").localeCompare(b.title || "");
      case "titleDesc":
        return (b.title || "").localeCompare(a.title || "");
      default:
        return 0;
    }
  });

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

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

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <p className="text-red-500 text-center">Error loading blogs. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">All Posts</h2>
        <p className="text-gray-600">Discover our latest articles and insights</p>
      </div>

      {/* All Posts Grid */}
      {blogs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No blog posts available yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {blogs.map((blog) => (
              <Link
                key={blog._id}
                to={`/blog/${blog.slug || blog._id}`}
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-12 pt-8 border-t border-gray-200">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-6 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-primary-500 transition-colors font-medium"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {[...Array(pagination.pages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.pages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-primary-500 text-white'
                            : 'border border-gray-300 hover:bg-gray-50 hover:border-primary-500'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === page - 2 || pageNum === page + 2) {
                    return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                  }
                  return null;
                })}
              </div>
              <span className="px-4 py-2 text-gray-600 text-sm">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="px-6 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-primary-500 transition-colors font-medium"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BlogPosts;
