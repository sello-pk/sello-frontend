import { useState, useMemo } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
    useGetAllBannersQuery,
    useCreateBannerMutation,
    useUpdateBannerMutation,
    useDeleteBannerMutation,
} from "../../redux/services/adminApi";
import Spinner from "../../components/Spinner";
import Pagination from "../../components/admin/Pagination";
import toast from "react-hot-toast";
import { FiPlus, FiEdit, FiTrash2, FiX, FiImage } from "react-icons/fi";
import ConfirmModal from "../../components/admin/ConfirmModal";
import ActionDropdown from "../../components/admin/ActionDropdown";

const Banners = () => {
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bannerToDelete, setBannerToDelete] = useState(null);
    const [editingBanner, setEditingBanner] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;
    const [formData, setFormData] = useState({
        title: "",
        linkUrl: "",
        type: "homepage",
        position: "hero",
        isActive: true,
        order: 0,
        startDate: "",
        endDate: "",
        image: null,
    });

    const { data, isLoading, refetch } = useGetAllBannersQuery({});
    const [createBanner, { isLoading: isCreating }] = useCreateBannerMutation();
    const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerMutation();
    const [deleteBanner, { isLoading: isDeleting }] = useDeleteBannerMutation();

    const banners = data || [];
    
    // Client-side pagination
    const totalPages = Math.max(1, Math.ceil(banners.length / pageSize));
    const paginatedBanners = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return banners.slice(start, start + pageSize);
    }, [banners, currentPage, pageSize]);
    
    // Reset to page 1 when banners change
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
        setEditingBanner(null);
        setFormData({
            title: "",
            linkUrl: "",
            type: "homepage",
            position: "hero",
            isActive: true,
            order: 0,
            startDate: "",
            endDate: "",
            image: null,
        });
        setShowModal(true);
    };

    const handleEdit = (banner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title || "",
            linkUrl: banner.linkUrl || "",
            type: banner.type || "homepage",
            position: banner.position || "hero",
            isActive: banner.isActive !== undefined ? banner.isActive : true,
            order: banner.order || 0,
            startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : "",
            endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : "",
            image: null,
        });
        setShowModal(true);
    };

    const handleDeleteClick = (bannerId) => {
        setBannerToDelete(bannerId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!bannerToDelete) return;
        
        try {
            await deleteBanner(bannerToDelete).unwrap();
            toast.success("Banner deleted successfully");
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to delete banner");
        } finally {
            setShowDeleteModal(false);
            setBannerToDelete(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const submitData = new FormData();
            submitData.append("title", formData.title);
            submitData.append("linkUrl", formData.linkUrl || "");
            submitData.append("type", formData.type);
            submitData.append("position", formData.position);
            submitData.append("isActive", formData.isActive);
            submitData.append("order", formData.order);
            if (formData.startDate) submitData.append("startDate", formData.startDate);
            if (formData.endDate) submitData.append("endDate", formData.endDate);
            if (formData.image) submitData.append("image", formData.image);
            
            if (editingBanner) {
                await updateBanner({ 
                    bannerId: editingBanner._id, 
                    formData: submitData 
                }).unwrap();
                toast.success("Banner updated successfully");
            } else {
                await createBanner(submitData).unwrap();
                toast.success("Banner created successfully");
            }
            
            setShowModal(false);
            setEditingBanner(null);
            setFormData({
                title: "",
                linkUrl: "",
                type: "homepage",
                position: "hero",
                isActive: true,
                order: 0,
                startDate: "",
                endDate: "",
                image: null,
            });
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to save banner");
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Banner Management</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage homepage and promotional banners</p>
                    </div>
                    <button
                        onClick={handleOpenModal}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                    >
                        <FiPlus size={18} />
                        Add Banner
                    </button>
                </div>

                {/* Banners Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full flex justify-center items-center h-64">
                            <Spinner fullScreen={false} />
                        </div>
                    ) : paginatedBanners.length === 0 ? (
                        <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
                            No banners found
                        </div>
                    ) : (
                        paginatedBanners.map((banner) => (
                            <div key={banner._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                                    {banner.image ? (
                                        <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FiImage size={48} className="text-gray-400" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            banner.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                        }`}>
                                            {banner.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{banner.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Type: {banner.type}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Position: {banner.position}</p>
                                    <div className="flex items-center justify-end">
                                        <ActionDropdown
                                            onEdit={() => handleEdit(banner)}
                                            onDelete={() => handleDeleteClick(banner._id)}
                                            item={banner}
                                            itemName="banner"
                                            deleteConfirmMessage="Are you sure you want to delete this banner? This action cannot be undone."
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
                    totalItems={banners.length}
                />

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {editingBanner ? "Edit Banner" : "Add New Banner"}
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
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Banner Image *
                                    </label>
                                    <input
                                        type="file"
                                        name="image"
                                        onChange={handleInputChange}
                                        accept="image/*"
                                        required={!editingBanner}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Link URL
                                    </label>
                                    <input
                                        type="url"
                                        name="linkUrl"
                                        value={formData.linkUrl}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Type
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="homepage">Homepage</option>
                                            <option value="promotional">Promotional</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Position
                                        </label>
                                        <select
                                            name="position"
                                            value={formData.position}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="hero">Hero</option>
                                            <option value="sidebar">Sidebar</option>
                                            <option value="footer">Footer</option>
                                            <option value="top">Top</option>
                                            <option value="bottom">Bottom</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
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
                                        {editingBanner ? (isUpdating ? "Updating..." : "Update") : (isCreating ? "Creating..." : "Create")}
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
                        setBannerToDelete(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Banner"
                    message="Are you sure you want to delete this banner? This action cannot be undone."
                    confirmText="Delete"
                    variant="danger"
                    isLoading={isDeleting}
                />
            </div>
        </AdminLayout>
    );
};

export default Banners;

