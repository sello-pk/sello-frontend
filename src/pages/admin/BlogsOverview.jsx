import { useState } from "react";
import {
  useGetAllBlogsQuery,
  useGetAllCategoriesQuery,
  useDeleteBlogMutation,
} from "../../redux/services/adminApi";
import AdminLayout from "../../components/admin/AdminLayout";
import Spinner from "../../components/Spinner";
import Pagination from "../../components/admin/Pagination";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiPlus,
  FiFilter,
  FiFileText,
  FiBook,
  FiCheckCircle,
  FiMessageSquare,
  FiClock,
  FiAlertCircle,
  FiGrid,
  FiSearch,
  FiX,
} from "react-icons/fi";
import ConfirmationModal from "../../components/admin/ConfirmationModal";
import ActionDropdown from "../../components/admin/ActionDropdown";

const BlogsOverview = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const { data: blogsData, isLoading: blogsLoading, refetch: refetchBlogs } = useGetAllBlogsQuery({
    page,
    limit: 10,
  });
  const { data: categoriesData } =
    useGetAllCategoriesQuery({ type: "blog" });
  const [deleteBlog] = useDeleteBlogMutation();

  const blogs = blogsData?.blogs || [];
  const pagination = blogsData?.pagination || {};
  const categories = categoriesData || [];

  // Calculate metrics - need to get all blogs for accurate counts
  const totalBlogs = blogsData?.pagination?.total || 0;
  const publishedBlogs = blogs.filter(
    (blog) => blog.status === "published"
  ).length;
  const draftBlogs = blogs.filter((blog) => blog.status === "draft").length;
  const pendingBlogs = blogs.filter(
    (blog) => blog.status === "pending" || !blog.status || blog.status === ""
  ).length;
  const reviewedBlogs = blogs.filter(
    (blog) => blog.status === "archived"
  ).length;
  const totalCategories = categories.length;
  const totalComments = 0; // Placeholder - would need comments API
  const totalViews = blogs.reduce((sum, blog) => sum + (blog.views || 0), 0);

  const handleDeleteClick = (blogId) => {
    setBlogToDelete(blogId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!blogToDelete) return;

    try {
      await deleteBlog(blogToDelete).unwrap();
      toast.success("Blog deleted successfully");
      // Refetch blogs list to show updated data
      refetchBlogs();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete blog");
    } finally {
      setShowDeleteModal(false);
      setBlogToDelete(null);
    }
  };

  // Filter and sort blogs
  const filteredBlogs = blogs
    .filter((blog) => {
      if (filter === "all") return true;
      if (filter === "published") return blog.status === "published";
      if (filter === "draft") return blog.status === "draft";
      if (filter === "scheduled") return blog.status === "scheduled";
      if (filter === "pending")
        return blog.status === "pending" || !blog.status || blog.status === "";
      if (filter === "reviewed") return blog.status === "archived";
      return true;
    })
    .filter((blog) => {
      if (categoryFilter === "") return true;
      return blog.category?._id === categoryFilter;
    })
    .filter((blog) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        blog.title?.toLowerCase().includes(query) ||
        blog.excerpt?.toLowerCase().includes(query) ||
        blog.author?.name?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
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

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Content & Blog Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage blog posts, categories, and engagement
          </p>
        </div>

        {/* Stats Cards - Match reference design exactly */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-6">
          {/* Total Posts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Posts
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-10">
                  {totalBlogs}
                </h3>
              </div>
              <div className="relative flex-shrink-0">
                <div className="absolute w-20 h-20 bg-blue-50 rounded-full blur-2xl opacity-40 -top-3 -right-3"></div>
                <div className="relative w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-md">
                  <FiFileText size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* Published Posts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Published Posts
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-6">
                  {publishedBlogs}
                </h3>
              </div>
              <div className="relative flex-shrink-0">
                <div className="absolute w-20 h-20 bg-green-50 rounded-full blur-2xl opacity-40 -top-3 -right-3"></div>
                <div className="relative w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-md">
                  <FiCheckCircle size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* Draft Posts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Draft Posts
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-10">
                  {draftBlogs}
                </h3>
              </div>
              <div className="relative flex-shrink-0">
                <div className="absolute w-20 h-20 bg-purple-50 rounded-full blur-2xl opacity-40 -top-3 -right-3"></div>
                <div className="relative w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white shadow-md">
                  <FiClock size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* Pending Posts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Pending Posts
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-6">
                  {pendingBlogs}
                </h3>
              </div>
              <div className="relative flex-shrink-0">
                <div className="absolute w-20 h-20 bg-primary-50 rounded-full blur-2xl opacity-40 -top-3 -right-3"></div>
                <div className="relative w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-md">
                  <FiAlertCircle size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* Reviewed Posts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Reviewed Posts
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-6">
                  {reviewedBlogs}
                </h3>
              </div>
              <div className="relative flex-shrink-0">
                <div className="absolute w-20 h-20 bg-green-50 rounded-full blur-2xl opacity-40 -top-3 -right-3"></div>
                <div className="relative w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-md">
                  <FiCheckCircle size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* Total Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Categories
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-6">
                  {totalCategories}
                </h3>
              </div>
              <div className="relative flex-shrink-0">
                <div className="absolute w-20 h-20 bg-red-50 rounded-full blur-2xl opacity-40 -top-3 -right-3"></div>
                <div className="relative w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-md">
                  <FiBook size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* Total Comments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Comments
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-6">
                  {totalComments}
                </h3>
              </div>
              <div className="relative flex-shrink-0">
                <div className="absolute w-20 h-20 bg-purple-50 rounded-full blur-2xl opacity-40 -top-3 -right-3"></div>
                <div className="relative w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white shadow-md">
                  <FiMessageSquare size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* Total Views */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Views
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-10">
                  {totalViews}
                </h3>
              </div>
              <div className="relative flex-shrink-0">
                <div className="absolute w-20 h-20 bg-primary-50 rounded-full blur-2xl opacity-40 -top-3 -right-3"></div>
                <div className="relative w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-md">
                  <FiEye size={28} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Link
            to="/admin/blog-categories"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
          >
            <FiGrid size={18} />
            Categories
          </Link>
          <Link
            to="/admin/blog-comments"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
          >
            <FiMessageSquare size={18} />
            Comments
          </Link>
          <Link
            to="/admin/blogs/create"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 flex items-center gap-2 transition-colors"
          >
            <FiPlus size={18} />
            New Post
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="space-y-4">
            {/* Search and Sort Row */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search blogs by title, excerpt, or author..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="mostViewed">Most Viewed</option>
                <option value="titleAsc">Title (A-Z)</option>
                <option value="titleDesc">Title (Z-A)</option>
              </select>
              
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status:
              </span>

            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                filter === "all"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Filter all blogs"
              aria-pressed={filter === "all"}
            >
              All
            </button>

            <button
              onClick={() => setFilter("published")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                filter === "published"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Filter published blogs"
              aria-pressed={filter === "published"}
            >
              Published
            </button>

            <button
              onClick={() => setFilter("draft")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                filter === "draft"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Filter draft blogs"
              aria-pressed={filter === "draft"}
            >
              Draft
            </button>

            <button
              onClick={() => setFilter("scheduled")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                filter === "scheduled"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Filter scheduled blogs"
              aria-pressed={filter === "scheduled"}
            >
              Scheduled
            </button>

            <button
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                filter === "pending"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Filter pending blogs"
              aria-pressed={filter === "pending"}
            >
              Pending
            </button>

            <button
              onClick={() => setFilter("reviewed")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                filter === "reviewed"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Filter reviewed blogs"
              aria-pressed={filter === "reviewed"}
            >
              Reviewed
            </button>
            
            {/* Clear Filters */}
            {(searchQuery || categoryFilter || filter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("");
                  setFilter("all");
                  setSortBy("newest");
                }}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center gap-1 ml-auto"
              >
                <FiX size={14} />
                Clear All
              </button>
            )}
          </div>
          </div>
        </div>

        {/* Blogs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {blogsLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center">
                      <Spinner fullScreen={false} />
                    </td>
                  </tr>
                ) : filteredBlogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  filteredBlogs.map((blog) => (
                    <tr
                      key={blog._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {blog.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {blog.author?.name || "Admin"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(blog.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            blog.status === "published"
                              ? "bg-green-100 text-green-800"
                              : blog.status === "draft"
                              ? "bg-purple-100 text-purple-800"
                              : blog.status === "pending" || !blog.status
                              ? "bg-primary-100 text-primary-800"
                              : blog.status === "archived"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {blog.status
                            ? blog.status.charAt(0).toUpperCase() +
                              blog.status.slice(1)
                            : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {blog.views || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        0
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ActionDropdown
                          onView={() => window.open(`/blog/${blog.slug || blog._id}`, '_blank')}
                          onEdit={() => navigate(`/admin/blogs/${blog._id}/edit`)}
                          onDelete={(item) => handleDeleteClick(item._id || item)}
                          item={blog}
                          itemName="blog"
                          deleteConfirmMessage="Are you sure you want to delete this blog? This action cannot be undone."
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={pagination.pages || 1}
          onPageChange={setPage}
          itemsPerPage={20}
          totalItems={pagination.total || 0}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Blog"
          message="Are you sure you want to delete this blog? This action cannot be undone."
          confirmText="Delete"
          confirmButtonClass="bg-red-500 hover:bg-red-600"
        />
      </div>
    </AdminLayout>
  );
};

export default BlogsOverview;
