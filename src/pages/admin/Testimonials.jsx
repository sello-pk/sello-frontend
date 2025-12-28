import { useState, useMemo } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
    useGetAllTestimonialsQuery,
    useCreateTestimonialMutation,
    useUpdateTestimonialMutation,
    useDeleteTestimonialMutation,
} from "../../redux/services/adminApi";
import Spinner from "../../components/Spinner";
import Pagination from "../../components/admin/Pagination";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2, FiX, FiStar, FiUser } from "react-icons/fi";
import ConfirmModal from "../../components/admin/ConfirmModal";
import ActionDropdown from "../../components/admin/ActionDropdown";

const Testimonials = () => {
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [testimonialToDelete, setTestimonialToDelete] = useState(null);
    const [editingTestimonial, setEditingTestimonial] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;
    const [formData, setFormData] = useState({
        name: "",
        role: "",
        company: "",
        text: "",
        rating: 5,
        isActive: true,
        order: 0,
        featured: false,
        image: null,
    });

    const { data, isLoading, refetch } = useGetAllTestimonialsQuery({});
    const [createTestimonial, { isLoading: isCreating }] = useCreateTestimonialMutation();
    const [updateTestimonial, { isLoading: isUpdating }] = useUpdateTestimonialMutation();
    const [deleteTestimonial, { isLoading: isDeleting }] = useDeleteTestimonialMutation();

    const testimonials = data || [];
    
    // Client-side pagination
    const totalPages = Math.max(1, Math.ceil(testimonials.length / pageSize));
    const paginatedTestimonials = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return testimonials.slice(start, start + pageSize);
    }, [testimonials, currentPage, pageSize]);
    
    // Reset to page 1 when testimonials change
    useMemo(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalPages]);

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "image") {
            setFormData(prev => ({ ...prev, image: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleOpenModal = () => {
        setEditingTestimonial(null);
        setFormData({
            name: "",
            role: "",
            company: "",
            text: "",
            rating: 5,
            isActive: true,
            order: 0,
            featured: false,
            image: null,
        });
        setShowModal(true);
    };

    const handleEdit = (testimonial) => {
        setEditingTestimonial(testimonial);
        setFormData({
            name: testimonial.name || "",
            role: testimonial.role || "",
            company: testimonial.company || "",
            text: testimonial.text || "",
            rating: testimonial.rating || 5,
            isActive: testimonial.isActive !== undefined ? testimonial.isActive : true,
            order: testimonial.order || 0,
            featured: testimonial.featured || false,
            image: null,
        });
        setShowModal(true);
    };

    const handleDeleteClick = (testimonialId) => {
        setTestimonialToDelete(testimonialId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!testimonialToDelete) return;
        
        try {
            await deleteTestimonial(testimonialToDelete).unwrap();
            toast.success("Testimonial deleted successfully");
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to delete testimonial");
        } finally {
            setShowDeleteModal(false);
            setTestimonialToDelete(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.text) {
            toast.error("Name and text are required");
            return;
        }
        
        try {
            const submitData = new FormData();
            submitData.append("name", formData.name);
            submitData.append("role", formData.role || "");
            submitData.append("company", formData.company || "");
            submitData.append("text", formData.text);
            submitData.append("rating", formData.rating);
            submitData.append("isActive", formData.isActive);
            submitData.append("order", formData.order);
            submitData.append("featured", formData.featured);
            if (formData.image) submitData.append("image", formData.image);
            
            if (editingTestimonial) {
                await updateTestimonial({ 
                    testimonialId: editingTestimonial._id, 
                    formData: submitData 
                }).unwrap();
                toast.success("Testimonial updated successfully");
            } else {
                await createTestimonial(submitData).unwrap();
                toast.success("Testimonial created successfully");
            }
            
            setShowModal(false);
            setEditingTestimonial(null);
            setFormData({
                name: "",
                role: "",
                company: "",
                text: "",
                rating: 5,
                isActive: true,
                order: 0,
                featured: false,
                image: null,
            });
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to save testimonial");
        }
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <FiStar
                key={i}
                className={i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}
                size={16}
            />
        ));
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Testimonials Management</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage customer testimonials and reviews</p>
                    </div>
                    <button
                        onClick={handleOpenModal}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                    >
                        <FiPlus size={18} />
                        Add Testimonial
                    </button>
                </div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full flex justify-center items-center h-64">
                            <Spinner fullScreen={false} />
                        </div>
                    ) : paginatedTestimonials.length === 0 ? (
                        <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
                            No testimonials found
                        </div>
                    ) : (
                        paginatedTestimonials.map((testimonial) => (
                            <div key={testimonial._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                        {testimonial.image ? (
                                            <img src={testimonial.image} alt={testimonial.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <FiUser size={24} className="text-gray-400 dark:text-gray-500" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h3>
                                        {testimonial.role && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                                        )}
                                        {testimonial.company && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.company}</p>
                                        )}
                                        <div className="flex items-center gap-1 mt-1">
                                            {renderStars(testimonial.rating || 5)}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{testimonial.text}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        {testimonial.featured && (
                                            <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
                                                Featured
                                            </span>
                                        )}
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            testimonial.isActive ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                        }`}>
                                            {testimonial.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <ActionDropdown
                                            onEdit={() => handleEdit(testimonial)}
                                            onDelete={() => handleDeleteClick(testimonial._id)}
                                            item={testimonial}
                                            itemName="testimonial"
                                            deleteConfirmMessage="Are you sure you want to delete this testimonial? This action cannot be undone."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={pageSize}
                    totalItems={testimonials.length}
                />

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Role
                                        </label>
                                        <input
                                            type="text"
                                            name="role"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            placeholder="e.g. CEO, Customer"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Company
                                        </label>
                                        <input
                                            type="text"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleInputChange}
                                            placeholder="Company name"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Testimonial Text *
                                    </label>
                                    <textarea
                                        name="text"
                                        value={formData.text}
                                        onChange={handleInputChange}
                                        required
                                        rows="4"
                                        placeholder="Enter the testimonial text..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Rating
                                    </label>
                                    <select
                                        name="rating"
                                        value={formData.rating}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="5">5 Stars</option>
                                        <option value="4">4 Stars</option>
                                        <option value="3">3 Stars</option>
                                        <option value="2">2 Stars</option>
                                        <option value="1">1 Star</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        User Image
                                    </label>
                                    <input
                                        type="file"
                                        name="image"
                                        onChange={handleInputChange}
                                        accept="image/*"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Order
                                        </label>
                                        <input
                                            type="number"
                                            name="order"
                                            value={formData.order}
                                            onChange={handleInputChange}
                                            min="0"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Status
                                        </label>
                                        <select
                                            name="isActive"
                                            value={formData.isActive}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === "true" }))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Featured
                                        </label>
                                        <select
                                            name="featured"
                                            value={formData.featured}
                                            onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.value === "true" }))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="false">No</option>
                                            <option value="true">Yes</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating || isUpdating}
                                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {(isCreating || isUpdating) && <Spinner fullScreen={false} />}
                                        {editingTestimonial ? (isUpdating ? "Updating..." : "Update") : (isCreating ? "Creating..." : "Create")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setTestimonialToDelete(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Testimonial"
                    message="Are you sure you want to delete this testimonial? This action cannot be undone."
                    confirmText="Delete"
                    variant="danger"
                    isLoading={isDeleting}
                />
            </div>
        </AdminLayout>
    );
};

export default Testimonials;

