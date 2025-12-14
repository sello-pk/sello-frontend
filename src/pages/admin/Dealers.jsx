import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import {
    useGetAllDealersQuery,
    useVerifyDealerMutation,
    useGetUserByIdQuery,
} from "../../redux/services/adminApi";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import { FiSearch, FiGrid, FiCheckCircle, FiXCircle, FiEye, FiEdit2, FiX } from "react-icons/fi";

const Dealers = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [selectedDealer, setSelectedDealer] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const { data, isLoading, refetch } = useGetAllDealersQuery({ 
        page, 
        limit: 20,
        search 
    });
    const [verifyDealer] = useVerifyDealerMutation();
    const { data: dealerDetails, isLoading: detailsLoading } = useGetUserByIdQuery(
        selectedDealer,
        { skip: !selectedDealer }
    );

    const dealers = data?.dealers || [];
    const pagination = data?.pagination || {};

    // Reset to page 1 when search changes
    useEffect(() => {
        setPage(1);
    }, [search]);

    const handleVerify = async (userId, verified) => {
        try {
            await verifyDealer({ userId, verified }).unwrap();
            toast.success(`Dealer ${verified ? "verified" : "unverified"} successfully`);
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update dealer");
        }
    };

    const handleViewDetails = (dealerId) => {
        setSelectedDealer(dealerId);
        setShowDetailsModal(true);
    };

    const handleEdit = (dealerId) => {
        navigate(`/admin/users/${dealerId}`);
    };

    const handleCloseModal = () => {
        setShowDetailsModal(false);
        setSelectedDealer(null);
    };

    const getPlanBadge = (plan) => {
        const planColors = {
            free: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
            basic: "bg-blue-100 text-blue-800",
            premium: "bg-purple-100 text-purple-800",
            dealer: "bg-primary-100 text-primary-800"
        };
        return planColors[plan] || planColors.free;
    };

    const getStatusBadge = (dealer) => {
        if (dealer.dealerInfo?.verified) {
            return (
                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 flex items-center gap-1">
                    <FiCheckCircle size={12} />
                    Verified
                </span>
            );
        }
        return (
            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 flex items-center gap-1">
                <FiXCircle size={12} />
                Not Verified
            </span>
        );
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dealer Management</h2>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        Manage verified dealers and subscriptions
                    </p>
                </div>

                {/* All Dealers Label and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">All Dealers</h3>
                            <div className="flex-1 max-w-md ml-4">
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <Spinner fullScreen={false} />
                    </div>
                ) : dealers.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <p className="text-gray-700 dark:text-gray-300 text-lg">No dealers found</p>
                    </div>
                ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Business Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Location</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Plan</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Listings Limit</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Sales</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {dealers.map((dealer) => (
                                        <tr key={dealer._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                                                        {dealer.avatar ? (
                                                            <img
                                                                src={dealer.avatar}
                                                                alt={dealer.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            (dealer.name?.charAt(0) || 'D').toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {dealer.dealerInfo?.businessName || dealer.name || "N/A"}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {dealer.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm text-gray-900 dark:text-white">{dealer.email || "N/A"}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {dealer.dealerInfo?.businessPhone || dealer.contactNumber || "N/A"}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                                    {dealer.dealerInfo?.businessAddress || dealer.city || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadge(dealer.subscription?.plan || 'free')}`}>
                                                        {(dealer.subscription?.plan || 'free').charAt(0).toUpperCase() + (dealer.subscription?.plan || 'free').slice(1)}
                                                    </span>
                                                    {dealer.subscription?.isActive && dealer.subscription?.endDate && new Date(dealer.subscription.endDate) > new Date() ? (
                                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                            Active until {new Date(dealer.subscription.endDate).toLocaleDateString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Inactive</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(dealer)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {dealer.listingsCount || 0}
                                                    </span>
                                                    {dealer.subscription?.plan === 'free' && dealer.listingsCount >= 5 && (
                                                        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                                            Limit reached
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {dealer.salesCount || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleVerify(dealer._id, !dealer.dealerInfo?.verified)}
                                                        className={`${
                                                            dealer.dealerInfo?.verified
                                                                ? 'text-yellow-600 hover:text-yellow-700'
                                                                : 'text-green-600 hover:text-green-700'
                                                        } transition-colors`}
                                                        title={dealer.dealerInfo?.verified ? "Unverify" : "Verify"}
                                                        aria-label={dealer.dealerInfo?.verified ? `Unverify dealer ${dealer.dealerInfo?.businessName || dealer.name}` : `Verify dealer ${dealer.dealerInfo?.businessName || dealer.name}`}
                                                    >
                                                        {dealer.dealerInfo?.verified ? (
                                                            <FiXCircle size={18} aria-hidden="true" />
                                                        ) : (
                                                            <FiCheckCircle size={18} aria-hidden="true" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewDetails(dealer._id)}
                                                        className="text-blue-600 hover:text-blue-700 transition-colors"
                                                        title="View Details"
                                                        aria-label={`View details for dealer ${dealer.dealerInfo?.businessName || dealer.name}`}
                                                    >
                                                        <FiEye size={18} aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(dealer._id)}
                                                        className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                                        title="Edit"
                                                        aria-label={`Edit dealer ${dealer.dealerInfo?.businessName || dealer.name}`}
                                                    >
                                                        <FiEdit2 size={18} aria-hidden="true" />
                                                    </button>
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
                {pagination.pages > 1 && (
                    <div className="mt-6 flex justify-center items-center gap-2">
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
                            aria-label="Go to previous page"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                            Page {page} of {pagination.pages}
                        </span>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page >= pagination.pages}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
                            aria-label="Go to next page"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Dealer Details Modal */}
                {showDetailsModal && selectedDealer && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Dealer Details</h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    aria-label="Close dealer details modal"
                                >
                                    <FiX size={24} aria-hidden="true" />
                                </button>
                            </div>
                            <div className="p-6">
                                {detailsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Spinner fullScreen={false} />
                                    </div>
                                ) : dealerDetails ? (
                                    <div className="space-y-6">
                                        {/* Basic Information */}
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Business Name</p>
                                                    <p className="font-medium dark:text-white">{dealerDetails.dealerInfo?.businessName || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Owner Name</p>
                                                    <p className="font-medium dark:text-white">{dealerDetails.name || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                                                    <p className="font-medium dark:text-white">{dealerDetails.email || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                                                    <p className="font-medium dark:text-white">{dealerDetails.dealerInfo?.businessPhone || dealerDetails.phone || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">WhatsApp</p>
                                                    <p className="font-medium dark:text-white">{dealerDetails.dealerInfo?.whatsappNumber || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                                                    <p className="font-medium dark:text-white">{dealerDetails.dealerInfo?.area || "N/A"}, {dealerDetails.dealerInfo?.city || "N/A"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Business Details */}
                                        {(dealerDetails.dealerInfo?.description || dealerDetails.dealerInfo?.website || dealerDetails.dealerInfo?.establishedYear) && (
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Details</h4>
                                                <div className="space-y-3">
                                                    {dealerDetails.dealerInfo?.description && (
                                                        <div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                                                            <p className="font-medium dark:text-white">{dealerDetails.dealerInfo.description}</p>
                                                        </div>
                                                    )}
                                                    {dealerDetails.dealerInfo?.website && (
                                                        <div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">Website</p>
                                                            <a href={dealerDetails.dealerInfo.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                                                {dealerDetails.dealerInfo.website}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {dealerDetails.dealerInfo?.establishedYear && (
                                                        <div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">Established Year</p>
                                                            <p className="font-medium dark:text-white">{dealerDetails.dealerInfo.establishedYear}</p>
                                                        </div>
                                                    )}
                                                    {dealerDetails.dealerInfo?.employeeCount && (
                                                        <div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">Employee Count</p>
                                                            <p className="font-medium dark:text-white">{dealerDetails.dealerInfo.employeeCount}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Specialties & Services */}
                                        {(dealerDetails.dealerInfo?.specialties?.length > 0 || dealerDetails.dealerInfo?.services?.length > 0 || dealerDetails.dealerInfo?.languages?.length > 0) && (
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Specialties & Services</h4>
                                                <div className="space-y-3">
                                                    {dealerDetails.dealerInfo?.specialties?.length > 0 && (
                                                        <div>
                                                            <p className="text-sm text-gray-600">Specialties</p>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {dealerDetails.dealerInfo.specialties.map((specialty, idx) => (
                                                                    <span key={idx} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                                                                        {specialty}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {dealerDetails.dealerInfo?.services?.length > 0 && (
                                                        <div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">Services</p>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {dealerDetails.dealerInfo.services.map((service, idx) => (
                                                                    <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                                                        {service}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {dealerDetails.dealerInfo?.languages?.length > 0 && (
                                                        <div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">Languages</p>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {dealerDetails.dealerInfo.languages.map((lang, idx) => (
                                                                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                                                        {lang}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Social Media */}
                                        {(dealerDetails.dealerInfo?.socialMedia?.facebook || dealerDetails.dealerInfo?.socialMedia?.instagram || dealerDetails.dealerInfo?.socialMedia?.twitter) && (
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Media</h4>
                                                <div className="space-y-2">
                                                    {dealerDetails.dealerInfo.socialMedia.facebook && (
                                                        <a href={dealerDetails.dealerInfo.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                                                            Facebook
                                                        </a>
                                                    )}
                                                    {dealerDetails.dealerInfo.socialMedia.instagram && (
                                                        <a href={dealerDetails.dealerInfo.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="block text-pink-600 hover:underline">
                                                            Instagram
                                                        </a>
                                                    )}
                                                    {dealerDetails.dealerInfo.socialMedia.twitter && (
                                                        <a href={dealerDetails.dealerInfo.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="block text-blue-400 hover:underline">
                                                            Twitter
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Documents & Media */}
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Documents & Media</h4>
                                            <div className="space-y-4">
                                                {/* Profile Avatar */}
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-2">Profile Image</p>
                                                    {dealerDetails.avatar ? (
                                                        <div className="flex items-center gap-4">
                                                            <img
                                                                src={dealerDetails.avatar}
                                                                alt="Profile"
                                                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                                                            />
                                                            <a
                                                                href={dealerDetails.avatar}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline text-sm"
                                                            >
                                                                View Full Image
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">No profile image uploaded</p>
                                                    )}
                                                </div>

                                                {/* Business License */}
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-2">Business License / CNIC</p>
                                                    {dealerDetails.dealerInfo?.businessLicense ? (
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                <span className="text-2xl">📄</span>
                                                            </div>
                                                            <div>
                                                                <a
                                                                    href={dealerDetails.dealerInfo.businessLicense}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:underline font-medium"
                                                                >
                                                                    View License Document
                                                                </a>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {dealerDetails.dealerInfo.businessLicense.split("/").pop()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">No license document uploaded</p>
                                                    )}
                                                </div>

                                                {/* Showroom Images */}
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-2">Showroom Images</p>
                                                    {dealerDetails.dealerInfo?.showroomImages?.length > 0 ? (
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            {dealerDetails.dealerInfo.showroomImages.map((img, idx) => (
                                                                <div key={idx} className="relative group">
                                                                    <img
                                                                        src={img}
                                                                        alt={`Showroom ${idx + 1}`}
                                                                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                                                    />
                                                                    <a
                                                                        href={img}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg"
                                                                    >
                                                                        <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                                                                            View Full
                                                                        </span>
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">No showroom images uploaded</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Verification Status */}
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h4>
                                            <div className="flex items-center gap-3">
                                                {getStatusBadge(dealerDetails)}
                                                {dealerDetails.dealerInfo?.verifiedAt && (
                                                    <p className="text-sm text-gray-600">
                                                        Verified on: {new Date(dealerDetails.dealerInfo.verifiedAt).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Failed to load dealer details</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Dealers;
