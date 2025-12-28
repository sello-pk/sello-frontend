import { useState, useMemo, useEffect, Fragment } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
    useGetAllCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
} from "../../redux/services/adminApi";
import Spinner from "../../components/Spinner";
import Pagination from "../../components/admin/Pagination";
import toast from "react-hot-toast";
import { FiGrid, FiUpload, FiX, FiEdit2, FiTrash2, FiEye, FiEyeOff } from "react-icons/fi";
import ConfirmModal from "../../components/admin/ConfirmModal";
import ActionDropdown from "../../components/admin/ActionDropdown";

const Categories = () => {
    const [activeTab, setActiveTab] = useState("brands"); // brands, models, years, country, state, city
    const [selectedVehicleType, setSelectedVehicleType] = useState(""); // Filter by vehicle type for car categories
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        brand: "",
        model: "",
        year: "",
        country: "",
        state: "",
        vehicleType: "", // Vehicle type for car categories
        display: "show",
        status: "active",
        image: null,
        imagePreview: null
    });

    const vehicleTypes = ["Car", "Bus", "Truck", "Van", "Bike", "E-bike"];

    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState("name");
    const [sortDirection, setSortDirection] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    // Fetch all categories (car + location, active + inactive)
    const { data, isLoading, refetch } = useGetAllCategoriesQuery({});

    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
    const [deleteCategory] = useDeleteCategoryMutation();

    const categories = data || [];

    // Filter categories by active tab and vehicle type
    const filteredCategories = useMemo(() => {
        let filtered = [];
        
        if (activeTab === "brands") {
            filtered = categories.filter(cat => cat.subType === "make" && cat.type === "car");
        } else if (activeTab === "models") {
            filtered = categories.filter(cat => cat.subType === "model" && cat.type === "car");
        } else if (activeTab === "years") {
            filtered = categories.filter(cat => cat.subType === "year" && cat.type === "car");
        } else if (activeTab === "city") {
            filtered = categories.filter(cat => cat.subType === "city" && cat.type === "location");
        } else if (activeTab === "state") {
            filtered = categories.filter(cat => cat.subType === "state" && cat.type === "location");
        } else if (activeTab === "country") {
            filtered = categories.filter(cat => cat.subType === "country" && cat.type === "location");
        }
        
        // Filter by vehicle type for car categories (brands, models, years)
        if (selectedVehicleType && ["brands", "models", "years"].includes(activeTab)) {
            filtered = filtered.filter(cat => cat.vehicleType === selectedVehicleType);
        }
        
        return filtered;
    }, [categories, activeTab, selectedVehicleType]);

    // Apply search & sort
    const processedCategories = useMemo(() => {
        let list = [...filteredCategories];

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            list = list.filter(cat => cat.name.toLowerCase().includes(term));
        }

        list.sort((a, b) => {
            const dir = sortDirection === "asc" ? 1 : -1;
            if (sortField === "status") {
                return (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1) * dir;
            }
            
            // Special sorting for years: numeric sort
            if (activeTab === "years") {
                const yearA = parseInt(a.name) || 0;
                const yearB = parseInt(b.name) || 0;
                return (yearA - yearB) * dir;
            }
            
            // default sort by name
            return a.name.localeCompare(b.name) * dir;
        });

        return list;
    }, [filteredCategories, searchTerm, sortField, sortDirection, activeTab]);

    const totalPages = Math.max(1, Math.ceil(processedCategories.length / pageSize));

    const pagedCategories = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return processedCategories.slice(start, start + pageSize);
    }, [processedCategories, currentPage, pageSize]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm, selectedVehicleType]);

    // Reset vehicle type filter when switching tabs
    useEffect(() => {
        if (!["brands", "models", "years"].includes(activeTab)) {
            setSelectedVehicleType("");
        }
    }, [activeTab]);

    // Get brands for model/year parent selection (filtered by vehicle type if selected)
    const brands = useMemo(() => {
        let filtered = categories.filter(cat => cat.subType === "make" && cat.isActive && cat.type === "car");
        // Filter by vehicle type if specified in form or if editing a category with vehicle type
        const vehicleTypeFilter = formData.vehicleType || (editingCategory?.vehicleType);
        if (vehicleTypeFilter) {
            filtered = filtered.filter(cat => cat.vehicleType === vehicleTypeFilter);
        }
        return filtered.sort((a, b) => {
            const orderA = a.order || 0;
            const orderB = b.order || 0;
            if (orderA !== orderB) return orderA - orderB;
            return (a.name || "").localeCompare(b.name || "");
        });
    }, [categories, formData.vehicleType, editingCategory]);

    // Get models for year parent selection (currently not used in form, but kept for potential future use)
    // const models = useMemo(() => {
    //     if (!formData.brand) return [];
    //     const selectedBrand = brands.find(b => b._id === formData.brand);
    //     if (!selectedBrand) return [];
    //     return categories.filter(cat =>
    //         cat.subType === "model" &&
    //         (cat.parentCategory?._id === selectedBrand._id || cat.parentCategory === selectedBrand._id) &&
    //         cat.isActive
    //     );
    // }, [categories, brands, formData.brand]);

    // Countries for state parent selection
    const countries = useMemo(() => {
        return categories.filter(cat => cat.subType === "country" && cat.isActive);
    }, [categories]);

    // States for city parent selection
    const states = useMemo(() => {
        return categories.filter(cat => cat.subType === "state" && cat.isActive);
    }, [categories]);

    // Get states filtered by country
    const getStatesByCountry = useMemo(() => {
        const map = {};
        states.forEach(state => {
            const countryId = typeof state.parentCategory === 'object' 
                ? state.parentCategory._id 
                : state.parentCategory;
            if (countryId) {
                if (!map[countryId]) {
                    map[countryId] = [];
                }
                map[countryId].push(state);
            }
        });
        return map;
    }, [states]);

    // Get cities filtered by state
    const getCitiesByState = useMemo(() => {
        const map = {};
        const cities = categories.filter(cat => cat.subType === "city" && cat.isActive);
        cities.forEach(city => {
            const stateId = typeof city.parentCategory === 'object' 
                ? city.parentCategory._id 
                : city.parentCategory;
            if (stateId) {
                if (!map[stateId]) {
                    map[stateId] = [];
                }
                map[stateId].push(city);
            }
        });
        return map;
    }, [categories]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({
                ...formData,
                image: file,
                imagePreview: URL.createObjectURL(file)
            });
        }
    };

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
            brand: "",
            model: "",
            year: "",
            country: "",
            state: "",
            vehicleType: selectedVehicleType || "", // Pre-select vehicle type if filtered
            display: "show",
            status: "active",
            image: null,
            imagePreview: null
        });
        setShowModal(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);

        const baseForm = {
            name: category.name || "",
            brand: "",
            model: "",
            year: "",
            country: "",
            state: "",
            vehicleType: category.vehicleType || "",
            display: category.isActive ? "show" : "hide",
            status: category.isActive ? "active" : "inactive",
            image: null,
            imagePreview: category.image || null
        };

        if (category.subType === "model") {
            baseForm.brand = category.parentCategory?._id || category.parentCategory || "";
        } else if (category.subType === "year") {
            baseForm.year = category.name || "";
            // Years are independent, no parent category
        } else if (category.subType === "state") {
            baseForm.country = category.parentCategory?._id || category.parentCategory || "";
        } else if (category.subType === "city") {
            baseForm.state = category.parentCategory?._id || category.parentCategory || "";
        }

        setFormData(baseForm);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isCreating || isUpdating) return;
        
        try {
            const submitData = new FormData();
            
            if (activeTab === "brands") {
                if (!formData.vehicleType) {
                    toast.error("Please select a vehicle type");
                    return;
                }
                submitData.append("name", formData.name);
                submitData.append("type", "car");
                submitData.append("subType", "make");
                submitData.append("vehicleType", formData.vehicleType);
                submitData.append("isActive", formData.status === "active");
                if (formData.image) {
                    submitData.append("image", formData.image);
                }
            } else if (activeTab === "models") {
                if (!formData.brand) {
                    toast.error("Please select a brand");
                    return;
                }
                if (!formData.vehicleType) {
                    toast.error("Please select a vehicle type");
                    return;
                }
                submitData.append("name", formData.name);
                submitData.append("type", "car");
                submitData.append("subType", "model");
                submitData.append("vehicleType", formData.vehicleType);
                submitData.append("parentCategory", formData.brand);
                submitData.append("isActive", formData.status === "active");
            } else if (activeTab === "years") {
                if (!formData.vehicleType) {
                    toast.error("Please select a vehicle type");
                    return;
                }
                // Years are independent (standalone) - no parent category required
                submitData.append("name", formData.year || formData.name);
                submitData.append("type", "car");
                submitData.append("subType", "year");
                submitData.append("vehicleType", formData.vehicleType);
                // No parentCategory - years are independent
                submitData.append("isActive", formData.status === "active");
            } else if (activeTab === "state") {
                if (!formData.country) {
                    toast.error("Please select a country");
                    return;
                }
                submitData.append("name", formData.name);
                submitData.append("type", "location");
                submitData.append("subType", "state");
                submitData.append("parentCategory", formData.country);
                submitData.append("isActive", formData.status === "active");
            } else if (activeTab === "city") {
                if (!formData.state) {
                    toast.error("Please select a state");
                    return;
                }
                submitData.append("name", formData.name);
                submitData.append("type", "location");
                submitData.append("subType", "city");
                submitData.append("parentCategory", formData.state);
                submitData.append("isActive", formData.status === "active");
            } else if (activeTab === "country") {
                submitData.append("name", formData.name);
                submitData.append("type", "location");
                submitData.append("subType", "country");
                submitData.append("isActive", formData.status === "active");
            }

            if (editingCategory) {
                // For update, we need to send the existing image URL if no new image is uploaded
                if (!formData.image && formData.imagePreview && formData.imagePreview.startsWith('http')) {
                    submitData.append("image", formData.imagePreview);
                }
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
                brand: "",
                model: "",
                year: "",
                country: "",
                state: "",
                vehicleType: selectedVehicleType || "",
                display: "show",
                status: "active",
                image: null,
                imagePreview: null
            });
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to save category");
        }
    };

    const handleDelete = (categoryId) => {
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

    const handleToggleStatus = async (category) => {
        try {
            await updateCategory({
                categoryId: category._id,
                data: { isActive: !category.isActive }
            }).unwrap();
            toast.success(`Category ${!category.isActive ? "activated" : "deactivated"} successfully`);
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update category");
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Category Management</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        Manage car brands, models, and years
                    </p>
                </div>

                {/* Tabs and Add Button */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="p-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex gap-2 flex-wrap">
                                {['brands', 'models', 'years', 'country', 'state', 'city'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            activeTab === tab
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>
                            {/* Vehicle Type Filter for Car Categories */}
                            {["brands", "models", "years"].includes(activeTab) && (
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Vehicle Type:
                                    </label>
                                    <select
                                        value={selectedVehicleType}
                                        onChange={(e) => setSelectedVehicleType(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">All Types</option>
                                        {vehicleTypes.map((vt) => (
                                            <option key={vt} value={vt}>
                                                {vt}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name"
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                />
                                <button
                                    onClick={handleOpenModal}
                                    className="px-4 py-2 bg-gray-900 dark:bg-primary-500 text-white rounded-lg hover:opacity-90 flex items-center gap-2 text-sm"
                                >
                                    <span className="text-lg">+</span>
                                    Add New Category
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <Spinner fullScreen={false} />
                    </div>
                ) : processedCategories.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">No categories found</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                        <th
                                            className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                                            onClick={() => {
                                                setSortField("name");
                                                setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
                                            }}
                                        >
                                            Name
                                        </th>
                                        {["brands", "models", "years"].includes(activeTab) && (
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Vehicle Type</th>
                                        )}
                                        {activeTab === "brands" && (
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Logo</th>
                                        )}
                                        <th
                                            className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                                            onClick={() => {
                                                setSortField("status");
                                                setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
                                            }}
                                        >
                                            Status
                                        </th>
                                        {(activeTab === "models" || activeTab === "state" || activeTab === "city") && (
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                {activeTab === "models" ? "Brand" : activeTab === "state" ? "Country" : "State"}
                                            </th>
                                        )}
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Display</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {pagedCategories.map((category) => (
                                        <tr key={category._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {category.name}
                                                    </p>
                                                    {category.parentCategory && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {typeof category.parentCategory === 'object' 
                                                                ? category.parentCategory.name 
                                                                : 'Parent'}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            {["brands", "models", "years"].includes(activeTab) && (
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                                        {category.vehicleType || "N/A"}
                                                    </span>
                                                </td>
                                            )}
                                            {activeTab === "brands" && (
                                                <td className="px-6 py-4">
                                                    {category.image ? (
                                                        <img
                                                            src={category.image}
                                                            alt={category.name}
                                                            className="w-12 h-12 object-contain rounded"
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No logo</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    category.isActive
                                                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                                }`}>
                                                    {category.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            {(activeTab === "models" || activeTab === "state" || activeTab === "city") && (
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                        {category.parentCategory 
                                                            ? (typeof category.parentCategory === 'object' 
                                                                ? category.parentCategory.name 
                                                                : 'N/A')
                                                            : 'N/A'}
                                                    </p>
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleStatus(category)}
                                                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                        category.isActive
                                                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                                    }`}
                                                >
                                                    {category.isActive ? (
                                                        <>
                                                            <FiEye size={14} />
                                                            Show
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiEyeOff size={14} />
                                                            Hide
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end">
                                                    <ActionDropdown
                                                        onEdit={() => handleEdit(category)}
                                                        onDelete={() => handleDelete(category._id)}
                                                        item={category}
                                                        itemName="category"
                                                        deleteConfirmMessage="Are you sure you want to delete this category? This action cannot be undone."
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={pageSize}
                            totalItems={processedCategories.length}
                        />
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingCategory(null);
                                    setFormData({
                                        name: "",
                                        brand: "",
                                        model: "",
                                        year: "",
                                        country: "",
                                        state: "",
                                        vehicleType: selectedVehicleType || "",
                                        display: "show",
                                        status: "active",
                                        image: null,
                                        imagePreview: null
                                    });
                                }}
                                className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <FiX size={24} />
                            </button>

                            <h3 className="text-xl font-bold mb-4 dark:text-white">
                                {editingCategory ? "Edit Category" : "Add New Category"}
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {activeTab === "brands" && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Vehicle Type *
                                            </label>
                                            <select
                                                name="vehicleType"
                                                value={formData.vehicleType}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="">Select Vehicle Type</option>
                                                {vehicleTypes.map((vt) => (
                                                    <option key={vt} value={vt}>
                                                        {vt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Brand Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter brand name"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Logo
                                            </label>
                                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                                                {formData.imagePreview ? (
                                                    <div className="space-y-2">
                                                        <img
                                                            src={formData.imagePreview}
                                                            alt="Preview"
                                                            className="w-32 h-32 object-contain mx-auto rounded"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({
                                                                    ...formData,
                                                                    image: null,
                                                                    imagePreview: null
                                                                });
                                                            }}
                                                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <FiUpload className="mx-auto mb-2 text-gray-400 dark:text-gray-500" size={32} />
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Upload Logo Here</p>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageChange}
                                                            className="hidden"
                                                            id="logo-upload"
                                                        />
                                                        <label
                                                            htmlFor="logo-upload"
                                                            className="cursor-pointer inline-block px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 text-sm"
                                                        >
                                                            Choose File
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {activeTab === "models" && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Vehicle Type *
                                            </label>
                                            <select
                                                name="vehicleType"
                                                value={formData.vehicleType}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="">Select Vehicle Type</option>
                                                {vehicleTypes.map((vt) => (
                                                    <option key={vt} value={vt}>
                                                        {vt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Brand *
                                            </label>
                                            <select
                                                name="brand"
                                                value={formData.brand}
                                                onChange={handleInputChange}
                                                required
                                                disabled={!formData.vehicleType}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                                            >
                                                <option value="">
                                                    {formData.vehicleType ? "Select Brand" : "Select Vehicle Type first"}
                                                </option>
                                                {brands.map((brand) => (
                                                    <option key={brand._id} value={brand._id}>
                                                        {brand.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Model Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter model name"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Display
                                            </label>
                                            <select
                                                name="display"
                                                value={formData.display}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="show">Show</option>
                                                <option value="hide">Hide</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {activeTab === "years" && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Vehicle Type *
                                            </label>
                                            <select
                                                name="vehicleType"
                                                value={formData.vehicleType}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="">Select Vehicle Type</option>
                                                {vehicleTypes.map((vt) => (
                                                    <option key={vt} value={vt}>
                                                        {vt}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Year *
                                            </label>
                                            <input
                                                type="number"
                                                name="year"
                                                value={formData.year || formData.name}
                                                onChange={(e) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        year: e.target.value,
                                                        name: e.target.value
                                                    }));
                                                }}
                                                placeholder="e.g., 2024"
                                                min="1900"
                                                max="2100"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {activeTab === "city" && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                City Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter city name"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                State *
                                            </label>
                                            <select
                                                name="state"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="">Select State</option>
                                                {states.map((state) => (
                                                    <option key={state._id} value={state._id}>
                                                        {state.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {activeTab === "state" && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                State Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter state name"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Country *
                                            </label>
                                            <select
                                                name="country"
                                                value={formData.country}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="">Select Country</option>
                                                {countries.map((country) => (
                                                    <option key={country._id} value={country._id}>
                                                        {country.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {activeTab === "country" && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Country Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter country name"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingCategory(null);
                                            setFormData({
                                                name: "",
                                                brand: "",
                                                model: "",
                                                year: "",
                                                country: "",
                                                state: "",
                                                display: "show",
                                                status: "active",
                                                image: null,
                                                imagePreview: null
                                            });
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating || isUpdating}
                                        className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {(isCreating || isUpdating) ? (
                                            <>
                                                <Spinner fullScreen={false} />
                                                {editingCategory ? "Updating..." : "Creating..."}
                                            </>
                                        ) : (
                                            editingCategory ? "Update" : "Create"
                                        )}
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
                        setCategoryToDelete(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Category"
                    message="Are you sure you want to delete this category? This action cannot be undone."
                    confirmText="Delete"
                    variant="danger"
                />
            </div>
        </AdminLayout>
    );
};

export default Categories;
