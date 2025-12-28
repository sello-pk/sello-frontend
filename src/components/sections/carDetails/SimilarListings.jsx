import React from 'react';
import { useGetSimilarListingsQuery } from '../../../redux/services/api';
import { Link } from 'react-router-dom';
import { FaCar, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import LazyImage from '../../common/LazyImage';

const SimilarListings = ({ carId }) => {
    const { data, isLoading, error } = useGetSimilarListingsQuery(carId, {
        skip: !carId
    });

    const similarCars = Array.isArray(data) ? data : (data?.data || []);

    // Don't show anything while loading - let it render empty
    if (error || (!isLoading && (!similarCars || similarCars.length === 0))) {
        return null;
    }

    // Show skeleton while loading
    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 md:px-20 py-12 bg-white">
                <div className="mb-8">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse">
                            <div className="h-48 bg-gray-200"></div>
                            <div className="p-4">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-20 py-12 bg-white">
            <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Similar Listings
                </h2>
                <p className="text-gray-600">Cars similar to this one</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {similarCars.map((car) => (
                    <Link
                        key={car._id}
                        to={`/cars/${car._id}`}
                        className="bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-200 transition-all duration-300 overflow-hidden group transform hover:-translate-y-1"
                    >
                        <div className="relative h-48 overflow-hidden">
                            <LazyImage
                                src={car.images?.[0] || '/placeholder-car.jpg'}
                                alt={car.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {car.isBoosted && (
                                <span className="absolute top-2 right-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                                    Boosted
                                </span>
                            )}
                            {car.isSold && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="bg-red-500 text-white px-4 py-2 rounded font-semibold">
                                        Sold
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary-500 transition-colors">
                                {car.title || `${car.make} ${car.model}`}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <span className="flex items-center gap-1">
                                    <FaCalendarAlt /> {car.year}
                                </span>
                                <span className="flex items-center gap-1">
                                    <FaCar /> {car.mileage?.toLocaleString() || '0'} km
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                                <FaMapMarkerAlt />
                                <span>{car.city}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-primary-500">
                                    PKR {car.price?.toLocaleString() || '0'}
                                </span>
                                {car.postedBy?.isVerified && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                        Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default SimilarListings;

