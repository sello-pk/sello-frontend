import { useState } from "react";
import {
    useGetAllCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
} from "../../redux/services/adminApi";
import AdminLayout from "../../components/admin/AdminLayout";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2, FiX, FiBook } from "react-icons/fi";
import ConfirmationModal from "../../components/admin/ConfirmationModal";
import ActionDropdown from "../../components/admin/ActionDropdown";

const BlogCategories = () => {
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: ""
    });

    const { data, isLoading, refetch } = useGetAllCategoriesQuery({ type: "blog" });
    const [createCategory] = useCreateCategoryMutation();
    const [updateCategory] = useUpdateCategoryMutation();
    const [deleteCategory] = useDeleteCategoryMutation();

    const categories = data || [];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleOpenModal = () => {
        setEditingCategory(null);
        setFormData({
            name: "",
            slug: "",
            description: ""
        });
        setShowModal(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name || "",
            slug: category.slug || "",
            description: category.description || ""
        });
        setShowModal(true);
    };

    const handleDeleteClick = (categoryId) => {
        setCategoryToDelete(categoryId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return;
        
        try {
            await deleteCategory(categoryToDelete).unwrap();
            toast.success("Category deleted successfully");
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to delete category");
        } finally {
            setShowDeleteModal(false);
            setCategoryToDelete(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const submitData = new FormData();
            submitData.append("name", formData.name);
            submitData.append("slug", formData.slug);
            submitData.append("description", formData.description);
            submitData.append("type", "blog");
            
            if (editingCategory) {
                await updateCategory({ 
                    categoryId: editingCategory._id, 
                    data: submitData 
                }).unwrap();
                toast.success("Category updated successfully");
            } else {
                await createCategory(submitData).unwrap();
                toast.success("Category created successfully");
            }
            
            setShowModal(false);
            setEditingCategory(null);
            setFormData({
                name: "",
                slug: "",
                description: ""
            });
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to save category");
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Blog Categories</h2>
                    <p className="text-sm text-gray-500 mt-1">Organize your blog posts with categories.</p>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                >
                    <FiPlus size={18} />
                    Categories
                </button>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Slug</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Posts</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center">
                                        <Spinner fullScreen={false} />
                                    </td>
                                </tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{category.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {category.slug}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            0
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {category.order || 0}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionDropdown
                                                onEdit={() => handleEdit(category)}
                                                onDelete={() => handleDeleteClick(category._id)}
                                                item={category}
                                                itemName="category"
                                                deleteConfirmMessage="Are you sure you want to delete this category? This action cannot be undone. Blogs in this category will need to be reassigned."
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <FiX size={20} />
                        </button>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {editingCategory ? "Edit Category" : "Add New Category"}
                        </h3>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug
                                </label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    placeholder="auto-generated-from-name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90"
                                >
                                    {editingCategory ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Category"
                message="Are you sure you want to delete this category? This action cannot be undone."
                confirmText="Delete"
                confirmButtonClass="bg-red-500 hover:bg-red-600"
            />
            </div>
        </AdminLayout>
    );
};

export default BlogCategories;