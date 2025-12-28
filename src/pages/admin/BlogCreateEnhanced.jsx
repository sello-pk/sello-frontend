import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateBlogMutation, useGetAllCategoriesQuery } from "../../redux/services/adminApi";
import AdminLayout from "../../components/admin/AdminLayout";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import { FiSave, FiSend, FiArrowLeft } from "react-icons/fi";
import TiptapEditor from "../../components/admin/TiptapEditor";

const BlogCreateEnhanced = () => {
    const navigate = useNavigate();
    const [createBlog, { isLoading }] = useCreateBlogMutation();
    const { data: categoriesData, isLoading: categoriesLoading } = useGetAllCategoriesQuery({ type: "blog", isActive: true });
    const blogCategories = categoriesData || [];
    
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        featuredImage: null,
        category: "",
        tags: "",
        status: "draft",
        isFeatured: false,
        metaTitle: "",
        metaDescription: "",
        publishDate: "",
        publishTime: "",
    });

    // Generate slug from title
    const generateSlug = (title) => {
        return title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "featuredImage") {
            setFormData({ ...formData, featuredImage: files[0] });
        } else if (name === "title") {
            // Auto-generate slug from title if slug is empty or matches old title
            const newSlug = !formData.slug || formData.slug === generateSlug(formData.title) 
                ? generateSlug(value) 
                : formData.slug;
            setFormData({ ...formData, [name]: value, slug: newSlug });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleContentChange = (content) => {
        setFormData(prev => ({ ...prev, content }));
    };

    const handleSubmit = async (e, status) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.title || !formData.content) {
            toast.error("Title and content are required");
            return;
        }
        
        try {
            const formDataToSend = new FormData();
            
            // Append basic fields
            formDataToSend.append("title", formData.title);
            if (formData.slug) formDataToSend.append("slug", formData.slug);
            if (formData.excerpt) formDataToSend.append("excerpt", formData.excerpt);
            
            // Tiptap returns HTML content directly
            formDataToSend.append("content", formData.content || "");
            
            // Handle featured image
            if (formData.featuredImage) {
                formDataToSend.append("featuredImage", formData.featuredImage);
            }
            
            // Handle category
            if (formData.category) {
                formDataToSend.append("category", formData.category);
            }
            
            // Handle tags
            if (formData.tags) {
                const tagsArray = formData.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag);
                formDataToSend.append("tags", JSON.stringify(tagsArray));
            }
            
            // Handle SEO fields
            if (formData.metaTitle) formDataToSend.append("metaTitle", formData.metaTitle);
            if (formData.metaDescription) formDataToSend.append("metaDescription", formData.metaDescription);
            
            // Set status
            formDataToSend.append("status", status);
            
            // Handle isFeatured
            formDataToSend.append("isFeatured", formData.isFeatured ? "true" : "false");
            
            // Handle publish date/time if provided
            // Note: Backend will handle publishedAt based on status
            if (formData.publishDate && formData.publishTime && status === "published") {
                const publishDateTime = new Date(`${formData.publishDate}T${formData.publishTime}`);
                formDataToSend.append("publishedAt", publishDateTime.toISOString());
            }

            await createBlog(formDataToSend).unwrap();
            toast.success(status === "published" ? "Blog published successfully! It will appear on the public site immediately." : "Blog saved as draft");
            // Small delay to ensure cache invalidation completes
            setTimeout(() => {
                navigate("/admin/blogs");
            }, 100);
        } catch (error) {
            toast.error(error?.data?.message || "Failed to create blog");
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/admin/blogs")}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Back to Blogs"
                        >
                            <FiArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Create New Blog Post</h2>
                            <p className="text-sm text-gray-500 mt-1">Create and manage your blog content</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => handleSubmit(e, "draft")}
                            disabled={isLoading}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                        >
                            <FiSave size={18} />
                            Save Draft
                        </button>
                        <button
                            onClick={(e) => handleSubmit(e, "published")}
                            disabled={isLoading}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
                        >
                            <FiSend size={18} />
                            Publish
                        </button>
                    </div>
                </div>

            <form className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title and Slug */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter blog post title"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Blog URL (Slug)
                                    </label>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        placeholder="auto-generated-from-title"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Short Summary */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Short Summary *
                                        <span className="text-gray-500 text-xs ml-2">
                                            ({formData.excerpt.length}/200 characters)
                                        </span>
                                    </label>
                                    <textarea
                                        name="excerpt"
                                        value={formData.excerpt}
                                        onChange={handleChange}
                                        required
                                        rows="3"
                                        maxLength={200}
                                        placeholder="Enter a brief summary of your blog post (recommended: 150-200 characters)"
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                                            formData.excerpt.length > 200 ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                    {formData.excerpt.length > 200 && (
                                        <p className="text-xs text-red-500 mt-1">Summary should be 200 characters or less</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content Editor */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Post Content *
                                    </label>
                                    
                                    {/* Tiptap Rich Text Editor */}
                                    <TiptapEditor
                                        value={formData.content || ""}
                                        onChange={handleContentChange}
                                        placeholder="Write your blog post content here..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        You can use the toolbar to format your content.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* SEO Settings */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Meta Title
                                        <span className="text-gray-500 text-xs ml-2">
                                            ({formData.metaTitle.length}/60 characters)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        name="metaTitle"
                                        value={formData.metaTitle}
                                        onChange={handleChange}
                                        maxLength={60}
                                        placeholder="Enter meta title for SEO (recommended: 50-60 characters)"
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                                            formData.metaTitle.length > 60 ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                    {formData.metaTitle.length > 60 && (
                                        <p className="text-xs text-red-500 mt-1">Meta title should be 60 characters or less</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Meta Description
                                        <span className="text-gray-500 text-xs ml-2">
                                            ({formData.metaDescription.length}/160 characters)
                                        </span>
                                    </label>
                                    <textarea
                                        name="metaDescription"
                                        value={formData.metaDescription}
                                        onChange={handleChange}
                                        rows="3"
                                        maxLength={160}
                                        placeholder="Enter meta description for SEO (recommended: 150-160 characters)"
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                                            formData.metaDescription.length > 160 ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                    {formData.metaDescription.length > 160 && (
                                        <p className="text-xs text-red-500 mt-1">Meta description should be 160 characters or less</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Publishing Options */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Publishing Options</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="pending">Pending Review</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Publish Date & Time
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="date"
                                            name="publishDate"
                                            value={formData.publishDate}
                                            onChange={handleChange}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        <input
                                            type="time"
                                            name="publishTime"
                                            value={formData.publishTime}
                                            onChange={handleChange}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    {categoriesLoading ? (
                                        <Spinner fullScreen={false} />
                                    ) : (
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">Select a category</option>
                                            {blogCategories.map((category) => (
                                                <option key={category._id} value={category._id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tags
                                    </label>
                                    <input
                                        type="text"
                                        name="tags"
                                        value={formData.tags}
                                        onChange={handleChange}
                                        placeholder="Enter tags separated by commas"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="isFeatured"
                                            checked={formData.isFeatured}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                                            className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            Feature this blog post
                                        </span>
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Featured blogs appear prominently on the homepage
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Image</h3>
                            <div className="space-y-4">
                                <div>
                                    <input
                                        type="file"
                                        name="featuredImage"
                                        onChange={handleChange}
                                        accept="image/*"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                {formData.featuredImage && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600 mb-2">Selected: {formData.featuredImage.name}</p>
                                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                                            <img
                                                src={URL.createObjectURL(formData.featuredImage)}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, featuredImage: null }))}
                                            className="mt-2 text-sm text-red-600 hover:text-red-800"
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Footer */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/admin/blogs")}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, "draft")}
                            disabled={isLoading}
                            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading && <Spinner fullScreen={false} />}
                            <FiSave size={18} />
                            Save Draft
                        </button>
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, "published")}
                            disabled={isLoading}
                            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading && <Spinner fullScreen={false} />}
                            <FiSend size={18} />
                            Publish
                        </button>
                    </div>
                </div>
            </form>
            </div>
        </AdminLayout>
    );
};

export default BlogCreateEnhanced;