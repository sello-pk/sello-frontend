import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { usePolling } from "../../hooks/usePolling";
import {
    useGetAllListingsQuery,
    useApproveCarMutation,
    useFeatureCarMutation,
    useDeleteCarMutation,
    usePromoteCarMutation,
} from "../../redux/services/adminApi";
import Spinner from "../../components/Spinner";
import Pagination from "../../components/admin/Pagination";
import BulkActionsToolbar from "../../components/admin/BulkActionsToolbar";
import FilterPanel from "../../components/admin/FilterPanel";
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from "../../utils/exportUtils";
import { notifyActionSuccess, notifyActionError, notifyBulkActionSuccess, notifyBulkActionError, notifyError } from "../../utils/notifications";
import toast from "react-hot-toast";
import { FiSearch, FiEdit2, FiTrash2, FiEye, FiGrid, FiZap, FiCheck, FiX, FiDownload } from "react-icons/fi";
import ConfirmModal from "../../components/admin/ConfirmModal";
import PromptModal from "../../components/admin/PromptModal";
import Tooltip from "../../components/admin/Tooltip";

const Listings = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [brandFilter, setBrandFilter] = useState("all");
    const [brands, setBrands] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [showChargeModal, setShowChargeModal] = useState(false);
    const [carToDelete, setCarToDelete] = useState(null);
    const [carToPromote, setCarToPromote] = useState(null);
    const [promoteDuration, setPromoteDuration] = useState("7");
    const [selectedCars, setSelectedCars] = useState(new Set());
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({});

    const { data, isLoading, refetch } = useGetAllListingsQuery({ 
        page, 
        limit: 20, 
        search,
        status: statusFilter,
        brand: brandFilter,
        ...(advancedFilters.dateRange?.start && { dateFrom: advancedFilters.dateRange.start }),
        ...(advancedFilters.dateRange?.end && { dateTo: advancedFilters.dateRange.end }),
        ...(advancedFilters.priceRange?.min && { priceMin: advancedFilters.priceRange.min }),
        ...(advancedFilters.priceRange?.max && { priceMax: advancedFilters.priceRange.max }),
        ...(advancedFilters.yearRange?.min && { yearMin: advancedFilters.yearRange.min }),
        ...(advancedFilters.yearRange?.max && { yearMax: advancedFilters.yearRange.max }),
        ...(advancedFilters.condition && { condition: advancedFilters.condition }),
        ...(advancedFilters.fuelType && { fuelType: advancedFilters.fuelType }),
        ...(advancedFilters.transmission && { transmission: advancedFilters.transmission }),
        ...(advancedFilters.isApproved !== undefined && { isApproved: advancedFilters.isApproved === 'yes' }),
        ...(advancedFilters.featured !== undefined && { featured: advancedFilters.featured === 'yes' })
    });

    const [approveCar] = useApproveCarMutation();
    const [featureCar] = useFeatureCarMutation();
    const [deleteCar] = useDeleteCarMutation();
    const [promoteCar, { isLoading: isPromoting }] = usePromoteCarMutation();

    const cars = data?.cars || [];
    const pagination = data?.pagination || {};

    // Extract brands from response
    useEffect(() => {
        if (data?.brands) {
            setBrands(data.brands);
        }
    }, [data]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
        setSelectedCars(new Set()); // Clear selection when filters change
    }, [statusFilter, brandFilter, search, advancedFilters]);

    const handleApprove = async (carId, isApproved) => {
        try {
            await approveCar({ carId, isApproved }).unwrap();
            notifyActionSuccess(isApproved ? "approved" : "rejected", "Car");
            refetch();
        } catch (error) {
            notifyActionError(isApproved ? "approve" : "reject", "car", error);
        }
    };

    const handleFeature = async (carId, featured) => {
        try {
            await featureCar({ carId, featured }).unwrap();
            notifyActionSuccess(featured ? "featured" : "unfeatured", "Car");
            refetch();
        } catch (error) {
            notifyActionError(featured ? "feature" : "unfeature", "car", error);
        }
    };

    const handleDelete = (carId) => {
        setCarToDelete(carId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!carToDelete) return;
        try {
            await deleteCar(carToDelete).unwrap();
            notifyActionSuccess("deleted", "Car");
            refetch();
        } catch (error) {
            notifyActionError("delete", "car", error);
        } finally {
            setShowDeleteModal(false);
            setCarToDelete(null);
        }
    };

    const handlePromote = (carId) => {
        setCarToPromote(carId);
        setPromoteDuration("7");
        setShowPromoteModal(true);
    };

    // Bulk action handlers
    const handleSelectCar = (carId) => {
        setSelectedCars(prev => {
            const newSet = new Set(prev);
            if (newSet.has(carId)) {
                newSet.delete(carId);
            } else {
                newSet.add(carId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedCars.size === cars.length) {
            setSelectedCars(new Set());
        } else {
            setSelectedCars(new Set(cars.map(car => car._id)));
        }
    };

    const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
    const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    const handleBulkApprove = async () => {
        if (selectedCars.size === 0) return;
        setIsBulkProcessing(true);
        try {
            const promises = Array.from(selectedCars).map(carId =>
                approveCar({ carId, isApproved: true }).unwrap()
            );
            await Promise.all(promises);
            notifyBulkActionSuccess("approved", selectedCars.size);
            setSelectedCars(new Set());
            setShowBulkApproveModal(false);
            refetch();
        } catch (error) {
            notifyBulkActionError("approve", error);
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleBulkReject = async () => {
        if (selectedCars.size === 0) return;
        setIsBulkProcessing(true);
        try {
            const promises = Array.from(selectedCars).map(carId =>
                approveCar({ carId, isApproved: false }).unwrap()
            );
            await Promise.all(promises);
            notifyBulkActionSuccess("rejected", selectedCars.size);
            setSelectedCars(new Set());
            setShowBulkRejectModal(false);
            refetch();
        } catch (error) {
            notifyBulkActionError("reject", error);
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedCars.size === 0) return;
        setIsBulkProcessing(true);
        try {
            const promises = Array.from(selectedCars).map(carId =>
                deleteCar(carId).unwrap()
            );
            await Promise.all(promises);
            notifyBulkActionSuccess("deleted", selectedCars.size);
            setSelectedCars(new Set());
            setShowBulkDeleteModal(false);
            refetch();
        } catch (error) {
            notifyBulkActionError("delete", error);
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleExportCSV = () => {
        if (cars.length === 0) {
            notifyError("No listings to export");
            return;
        }

        const headers = [
            { label: 'Title', accessor: 'title' },
            { label: 'Make', accessor: 'make' },
            { label: 'Model', accessor: 'model' },
            { label: 'Year', accessor: 'year' },
            { label: 'Price', accessor: (car) => formatCurrencyForExport(car.price) },
            { label: 'Condition', accessor: 'condition' },
            { label: 'Mileage', accessor: 'mileage' },
            { label: 'Fuel Type', accessor: 'fuelType' },
            { label: 'Transmission', accessor: 'transmission' },
            { label: 'City', accessor: 'city' },
            { label: 'Location', accessor: 'location' },
            { label: 'Status', accessor: 'status' },
            { label: 'Approved', accessor: (car) => car.isApproved ? 'Yes' : 'No' },
            { label: 'Featured', accessor: (car) => car.featured ? 'Yes' : 'No' },
            { label: 'Boosted', accessor: (car) => car.isBoosted ? 'Yes' : 'No' },
            { label: 'Created Date', accessor: (car) => formatDateForExport(car.createdAt) },
            { label: 'Posted By', accessor: (car) => car.postedBy?.name || car.postedBy || 'N/A' }
        ];

        exportToCSV(cars, headers, `listings_export_${new Date().toISOString().split('T')[0]}`);
        notifyActionSuccess("exported", "Listings");
    };

    const handleApplyFilters = (filters) => {
        setAdvancedFilters(filters);
        setPage(1);
    };

    const handleResetFilters = () => {
        setAdvancedFilters({});
        setPage(1);
    };

    const filterConfig = [
        {
            id: 'dateRange',
            label: 'Created Date Range',
            type: 'daterange'
        },
        {
            id: 'priceRange',
            label: 'Price Range',
            type: 'number'
        },
        {
            id: 'yearRange',
            label: 'Year Range',
            type: 'number'
        },
        {
            id: 'condition',
            label: 'Condition',
            type: 'select',
            options: [
                { value: 'new', label: 'New' },
                { value: 'used', label: 'Used' },
                { value: 'certified', label: 'Certified Pre-Owned' }
            ]
        },
        {
            id: 'fuelType',
            label: 'Fuel Type',
            type: 'select',
            options: [
                { value: 'petrol', label: 'Petrol' },
                { value: 'diesel', label: 'Diesel' },
                { value: 'electric', label: 'Electric' },
                { value: 'hybrid', label: 'Hybrid' }
            ]
        },
        {
            id: 'transmission',
            label: 'Transmission',
            type: 'select',
            options: [
                { value: 'manual', label: 'Manual' },
                { value: 'automatic', label: 'Automatic' },
                { value: 'cvt', label: 'CVT' }
            ]
        },
        {
            id: 'isApproved',
            label: 'Approval Status',
            type: 'select',
            options: [
                { value: 'yes', label: 'Approved' },
                { value: 'no', label: 'Not Approved' }
            ]
        },
        {
            id: 'featured',
            label: 'Featured',
            type: 'select',
            options: [
                { value: 'yes', label: 'Featured' },
                { value: 'no', label: 'Not Featured' }
            ]
        }
    ];

    const handlePromoteDurationConfirm = (duration) => {
        setPromoteDuration(duration);
        setShowPromoteModal(false);
        setShowChargeModal(true);
    };

    const handlePromoteConfirm = async (chargeUser) => {
        if (!carToPromote) return;
        const days = parseInt(promoteDuration) || 7;
        
        try {
            await promoteCar({
                carId: carToPromote,
                duration: days,
                chargeUser: chargeUser,
                priority: 100
            }).unwrap();
            notifyActionSuccess(`promoted for ${days} days${chargeUser ? ' (user will be charged)' : ' (free promotion)'}`, "Car");
            refetch();
        } catch (error) {
            notifyActionError("promote", "car", error);
        } finally {
            setShowChargeModal(false);
            setCarToPromote(null);
            setPromoteDuration("7");
        }
    };

    const getStatusBadge = (car) => {
        if (car.isSold) {
            return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">Sold</span>;
        }
        if (car.isApproved === false && car.rejectionReason) {
            return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Rejected</span>;
        }
        if (car.isApproved === true) {
            return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Approved</span>;
        }
        return <span className="px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800">Pending</span>;
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Car Listings Management</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Review and manage all car listings
                        </p>
                    </div>
                    <button
                        onClick={handleExportCSV}
                        disabled={cars.length === 0 || isLoading}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        <FiDownload size={18} />
                        Export CSV
                    </button>
                </div>

                {/* Filter Tabs and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Status Tabs */}
                        <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => setStatusFilter("all")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        statusFilter === "all" 
                                            ? "bg-primary-500 text-white" 
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setStatusFilter("pending")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        statusFilter === "pending" 
                                            ? "bg-primary-500 text-white" 
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    Pending
                                </button>
                                <button
                                    onClick={() => setStatusFilter("approved")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        statusFilter === "approved" 
                                            ? "bg-primary-500 text-white" 
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    Approved
                                </button>
                                <button
                                    onClick={() => setStatusFilter("rejected")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        statusFilter === "rejected" 
                                            ? "bg-primary-500 text-white" 
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    Rejected
                                </button>
                                <button
                                    onClick={() => setStatusFilter("sold")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        statusFilter === "sold" 
                                            ? "bg-primary-500 text-white" 
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    Sold
                                </button>
                            </div>

                            {/* Search and Brand Filter */}
                            <div className="flex gap-2 w-full lg:w-auto">
                                <div className="relative flex-1 lg:w-64">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by title Or Brand..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    />
                                </div>
                                <select
                                    value={brandFilter}
                                    onChange={(e) => setBrandFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                >
                                    <option value="all">All Brands</option>
                                    {brands.map((brand) => (
                                        <option key={brand} value={brand}>
                                            {brand}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced Filters */}
                <FilterPanel
                    isOpen={showAdvancedFilters}
                    onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                    filters={filterConfig}
                    className="mb-4"
                />

                {/* Bulk Actions Toolbar */}
                <BulkActionsToolbar
                    selectedCount={selectedCars.size}
                    onDeselectAll={() => setSelectedCars(new Set())}
                    onBulkAction={(actionId) => {
                        if (actionId === 'approve') {
                            setShowBulkApproveModal(true);
                        } else if (actionId === 'reject') {
                            setShowBulkRejectModal(true);
                        } else if (actionId === 'delete') {
                            setShowBulkDeleteModal(true);
                        }
                    }}
                    actions={[
                        { id: 'approve', label: 'Approve Selected', icon: FiCheck, variant: 'success' },
                        { id: 'reject', label: 'Reject Selected', icon: FiX, variant: 'default' },
                        { id: 'delete', label: 'Delete Selected', icon: FiTrash2, variant: 'danger' }
                    ]}
                />

                {/* Table */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <Spinner fullScreen={false} />
                    </div>
                ) : cars.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">No listings found</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedCars.size === cars.length && cars.length > 0}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Image</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Brand</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Location</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Upload</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {cars.map((car) => (
                                        <tr key={car._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedCars.has(car._id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCars.has(car._id)}
                                                    onChange={() => handleSelectCar(car._id)}
                                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                                    {car.images && car.images.length > 0 ? (
                                                        <img
                                                            src={car.images[0]}
                                                            alt={car.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-900 dark:text-white">{car.make}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    ${car.price?.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {car.city || car.location || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(car)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {car.postedBy?.name || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {formatDate(car.createdAt)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {!car.isSold && car.isApproved !== true && (
                                                        <Tooltip content="Approve this listing">
                                                            <button
                                                                onClick={() => handleApprove(car._id, true)}
                                                                className="text-green-600 hover:text-green-700 transition-colors"
                                                                aria-label="Approve listing"
                                                            >
                                                                <FiCheck size={18} />
                                                            </button>
                                                        </Tooltip>
                                                    )}
                                                    {!car.isSold && car.isApproved === true && (
                                                        <Tooltip content="Unapprove this listing">
                                                            <button
                                                                onClick={() => handleApprove(car._id, false)}
                                                                className="text-primary-600 hover:text-primary-700 transition-colors"
                                                                aria-label="Unapprove listing"
                                                            >
                                                                <FiX size={18} />
                                                            </button>
                                                        </Tooltip>
                                                    )}
                                                    {!car.isSold && (
                                                        <Tooltip content={car.featured ? "Remove from featured listings" : "Feature this listing"}>
                                                            <button
                                                                onClick={() => handleFeature(car._id, !car.featured)}
                                                                className={`${car.featured ? 'text-purple-600 hover:text-purple-700' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                                                                aria-label={car.featured ? "Unfeature listing" : "Feature listing"}
                                                            >
                                                                <FiEye size={18} />
                                                            </button>
                                                        </Tooltip>
                                                    )}
                                                    {!car.isSold && car.isApproved === true && (
                                                        <Tooltip content={car.isBoosted ? "This listing is already promoted" : "Promote this listing (requires payment)"}>
                                                            <button
                                                                onClick={() => handlePromote(car._id)}
                                                                disabled={isPromoting}
                                                                className={`${car.isBoosted ? 'text-yellow-600 hover:text-yellow-700' : 'text-gray-400 hover:text-gray-600'} transition-colors disabled:opacity-50`}
                                                                aria-label={car.isBoosted ? "Already promoted" : "Promote listing"}
                                                            >
                                                                <FiZap size={18} />
                                                            </button>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip content="Delete this listing">
                                                        <button
                                                            onClick={() => handleDelete(car._id)}
                                                            className="text-red-600 hover:text-red-700 transition-colors"
                                                            aria-label="Delete listing"
                                                        >
                                                            <FiTrash2 size={18} />
                                                        </button>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                <Pagination
                    currentPage={page}
                    totalPages={pagination.pages || 1}
                    onPageChange={setPage}
                    itemsPerPage={20}
                    totalItems={pagination.total || 0}
                />

                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setCarToDelete(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Car Listing"
                    message="Are you sure you want to delete this car listing? This action cannot be undone."
                    confirmText="Delete"
                    variant="danger"
                />

                {/* Bulk Approve Confirmation Modal */}
                <ConfirmModal
                    isOpen={showBulkApproveModal}
                    onClose={() => {
                        if (!isBulkProcessing) {
                            setShowBulkApproveModal(false);
                        }
                    }}
                    onConfirm={handleBulkApprove}
                    title="Approve Selected Listings"
                    message={`Are you sure you want to approve ${selectedCars.size} car listing(s)? They will be visible to all users.`}
                    confirmText="Approve All"
                    variant="success"
                    isLoading={isBulkProcessing}
                />

                {/* Bulk Reject Confirmation Modal */}
                <ConfirmModal
                    isOpen={showBulkRejectModal}
                    onClose={() => {
                        if (!isBulkProcessing) {
                            setShowBulkRejectModal(false);
                        }
                    }}
                    onConfirm={handleBulkReject}
                    title="Reject Selected Listings"
                    message={`Are you sure you want to reject ${selectedCars.size} car listing(s)? They will be hidden from users.`}
                    confirmText="Reject All"
                    variant="warning"
                    isLoading={isBulkProcessing}
                />

                {/* Bulk Delete Confirmation Modal */}
                <ConfirmModal
                    isOpen={showBulkDeleteModal}
                    onClose={() => {
                        if (!isBulkProcessing) {
                            setShowBulkDeleteModal(false);
                        }
                    }}
                    onConfirm={handleBulkDelete}
                    title="Delete Selected Car Listings"
                    message={`Are you sure you want to delete ${selectedCars.size} car listing(s)? This action cannot be undone.`}
                    confirmText="Delete All"
                    variant="danger"
                    isLoading={isBulkProcessing}
                />

                {/* Promote Duration Modal */}
                <PromptModal
                    isOpen={showPromoteModal}
                    onClose={() => {
                        setShowPromoteModal(false);
                        setCarToPromote(null);
                    }}
                    onConfirm={handlePromoteDurationConfirm}
                    title="Promote Car Listing"
                    message="Enter promotion duration in days:"
                    placeholder="7"
                    defaultValue="7"
                    type="number"
                    confirmText="Continue"
                />

                {/* Charge User Confirmation Modal */}
                <ConfirmModal
                    isOpen={showChargeModal}
                    onClose={() => {
                        setShowChargeModal(false);
                        setCarToPromote(null);
                    }}
                    onConfirm={() => handlePromoteConfirm(true)}
                    onCancel={() => handlePromoteConfirm(false)}
                    title="Charge User?"
                    message={`Charge the user for this ${promoteDuration}-day promotion?`}
                    confirmText="Yes, Charge User"
                    cancelText="No, Free Promotion"
                    variant="warning"
                />
            </div>
        </AdminLayout>
    );
};

export default Listings;
