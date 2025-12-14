import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetSingleCarQuery,
  useGetMeQuery,
  useMarkCarAsSoldMutation,
} from "../../../redux/services/api";
import { images } from "../../../assets/assets";
import MapView from "./MapLocation";
import CarChatWidget from "../../carChat/CarChatWidget";
import toast from "react-hot-toast";
import {
  FaCheckCircle,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTachometerAlt,
  FaGasPump,
  FaCog,
  FaCar,
  FaDoorOpen,
  FaCog as FaEngine,
  FaPalette,
  FaShieldAlt,
  FaUser,
  FaStar,
} from "react-icons/fa";

const CarDetailsEtc = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const {
    data: car,
    isLoading,
    error,
    refetch,
  } = useGetSingleCarQuery(id, {
    skip: !id,
  });
  const { data: currentUser } = useGetMeQuery(undefined, { skip: !token });
  const [markCarAsSold] = useMarkCarAsSoldMutation();
  const [showMore, setShowMore] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-20 py-12 bg-white">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-20 py-12">
        <p className="text-red-500 text-center">
          Failed to load car details. Please try again later.
        </p>
      </div>
    );
  }

  const coordinates =
    car.geoLocation?.coordinates?.length === 2
      ? [car.geoLocation.coordinates[1], car.geoLocation.coordinates[0]]
      : [25.217136, 55.284207];

  const specs = [
    {
      icon: FaTachometerAlt,
      label: "Mileage",
      value: `${car.mileage?.toLocaleString() || "N/A"} km`,
    },
    { icon: FaGasPump, label: "Fuel Type", value: car.fuelType || "N/A" },
    { icon: FaCog, label: "Transmission", value: car.transmission || "N/A" },
    { icon: FaCar, label: "Body Type", value: car.bodyType || "N/A" },
    { icon: FaDoorOpen, label: "Doors", value: car.carDoors || "N/A" },
    { icon: FaEngine, label: "Engine", value: car.engineCapacity || "N/A" },
    { icon: FaCalendarAlt, label: "Year", value: car.year || "N/A" },
    { icon: FaShieldAlt, label: "Condition", value: car.condition || "N/A" },
  ];

  const additionalSpecs = [
    {
      label: "Interior Color",
      value: car.colorInterior,
      color: car.colorInterior,
    },
    {
      label: "Exterior Color",
      value: car.colorExterior,
      color: car.colorExterior,
    },
    { label: "Regional Specs", value: car.regionalSpec },
    { label: "Cylinders", value: car.numberOfCylinders },
    { label: "Seats", value: car.seats || "4" },
    { label: "Seller Type", value: car.sellerType },
    { label: "Warranty", value: car.warranty },
    {
      label: "Horsepower",
      value: car.horsepower ? `${car.horsepower} HP` : "N/A",
    },
  ];

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-20 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Specifications Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FaCar className="text-primary-500" />
                Specifications
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {specs.map((spec, idx) => {
                  const Icon = spec.icon;
                  return (
                    <div key={idx} className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="bg-primary-50 rounded-full p-3">
                          <Icon className="text-primary-600 text-xl" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">
                            {spec.label}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {spec.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Additional Specs */}
              {showMore && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {additionalSpecs.map((spec, idx) => (
                      <div key={idx}>
                        <p className="text-xs text-gray-500 font-medium">
                          {spec.label}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {spec.color ? (
                            <>
                              <p className="text-sm font-semibold text-gray-900">
                                {spec.value}
                              </p>
                              <div
                                className="w-5 h-5 rounded-full border border-gray-300"
                                style={{ backgroundColor: spec.color }}
                              ></div>
                            </>
                          ) : (
                            <p className="text-sm font-semibold text-gray-900">
                              {spec.value || "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
                >
                  {showMore ? "Show Less" : "Show More Details"}
                  <span className="text-lg">{showMore ? "↑" : "↓"}</span>
                </button>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Description
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {car.description || "No description available."}
              </p>
            </div>

            {/* Features Card */}
            {car.features && car.features.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Features
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {car.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <FaCheckCircle
                        className="text-green-500 flex-shrink-0"
                        size={16}
                      />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Map Card */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative"
              style={{ zIndex: 1 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-primary-500" />
                Location
              </h2>
              <div
                className="rounded-lg overflow-hidden border border-gray-200 relative"
                style={{ zIndex: 1 }}
              >
                <MapView
                  coordinates={coordinates}
                  carLocation={car.geoLocation}
                />
              </div>
              {car.location && (
                <p className="mt-4 text-sm text-gray-600 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-primary-500" size={14} />
                  {car.location}, {car.city}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Seller/Dealer Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaUser className="text-primary-500" />
                {car.postedBy?.role === "dealer"
                  ? "Dealer Information"
                  : "Seller Information"}
              </h3>

              <div className="flex items-start gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-primary-500 flex items-center justify-center text-2xl font-bold text-white uppercase overflow-hidden flex-shrink-0">
                  {car.postedBy?.avatar ? (
                    <img
                      src={car.postedBy.avatar}
                      alt={car.postedBy?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    car.postedBy?.name?.[0] || "U"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-lg text-gray-900 truncate">
                      {car.postedBy?.role === "dealer" &&
                      car.postedBy?.dealerInfo?.businessName
                        ? car.postedBy.dealerInfo.businessName
                        : car.postedBy?.name || "Unknown Seller"}
                    </p>
                    {car.postedBy?.role === "dealer" &&
                      car.postedBy?.dealerInfo?.verified && (
                        <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-semibold">
                          <FaCheckCircle size={10} />
                          VERIFIED
                        </span>
                      )}
                    {car.postedBy?.isVerified &&
                      car.postedBy?.role !== "dealer" && (
                        <span className="bg-[#050B20] text-[#050B20] text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <FaCheckCircle size={10} />
                          Verified
                        </span>
                      )}
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <FaStar className="text-yellow-500" size={12} />
                    <span className="font-semibold">
                      {car.postedBy?.sellerRating?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-gray-400">
                      ({car.postedBy?.reviewCount || 0} reviews)
                    </span>
                  </div>

                  {car.postedBy?.role === "dealer" &&
                    car.postedBy?.dealerInfo && (
                      <div className="space-y-1 text-sm text-gray-600">
                        {(car.postedBy.dealerInfo?.businessAddress ||
                          car.postedBy.dealerInfo?.city) && (
                          <p className="flex items-center gap-1">
                            <FaMapMarkerAlt size={12} />
                            {[
                              car.postedBy.dealerInfo?.businessAddress,
                              car.postedBy.dealerInfo?.city,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                        {(car.postedBy.dealerInfo?.businessPhone ||
                          car.postedBy.dealerInfo?.whatsappNumber) && (
                          <p className="flex items-center gap-1">
                            <FaPhone size={12} />
                            {car.postedBy.dealerInfo?.businessPhone ||
                              car.postedBy.dealerInfo?.whatsappNumber ||
                              ""}
                          </p>
                        )}
                      </div>
                    )}
                </div>
              </div>

              {/* Contact Buttons */}
              {!car.isSold &&
                currentUser &&
                currentUser._id !== car.postedBy?._id && (
                  <div className="space-y-3 mt-6">
                    <button
                      onClick={() => setShowChat(true)}
                      className="w-full bg-primary-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaEnvelope />
                      Contact Seller
                    </button>
                    {car.contactNumber && (
                      <a
                        href={`tel:${car.contactNumber}`}
                        className="w-full bg-white border-2 border-primary-500 text-primary-600 px-4 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaPhone />
                        Call Now
                      </a>
                    )}
                  </div>
                )}

              {/* Owner Actions */}
              {currentUser &&
                car.postedBy &&
                currentUser._id === car.postedBy._id && (
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Status:
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          car.isSold
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {car.isSold ? "Sold" : "Available"}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/edit-car/${car._id}`)}
                      className="w-full bg-[#050B20] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#050B20]/90 transition-colors"
                    >
                      Edit Listing
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          window.confirm(
                            `Mark this car as ${
                              car.isSold ? "available" : "sold"
                            }?`
                          )
                        ) {
                          try {
                            setIsUpdatingStatus(true);
                            await markCarAsSold({
                              carId: car._id,
                              isSold: !car.isSold,
                            }).unwrap();
                            toast.success(
                              `Car marked as ${
                                !car.isSold ? "sold" : "available"
                              }`
                            );
                            refetch();
                          } catch (error) {
                            toast.error(
                              error?.data?.message || "Failed to update status"
                            );
                          } finally {
                            setIsUpdatingStatus(false);
                          }
                        }
                      }}
                      disabled={isUpdatingStatus}
                      className="w-full bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
                    >
                      {isUpdatingStatus
                        ? "Updating..."
                        : car.isSold
                        ? "Mark as Available"
                        : "Mark as Sold"}
                    </button>
                  </div>
                )}
            </div>

            {/* Additional Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Listing Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Listing ID:</span>
                  <span className="font-medium text-gray-900">
                    {car._id?.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted:</span>
                  <span className="font-medium text-gray-900">
                    {car.createdAt
                      ? new Date(car.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Views:</span>
                  <span className="font-medium text-gray-900">
                    {car.views || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Car Chat Widget */}
      {showChat &&
        car &&
        currentUser &&
        currentUser._id !== car.postedBy?._id && (
          <CarChatWidget
            carId={car._id}
            sellerId={car.postedBy?._id || car.postedBy}
            carTitle={`${car.make} ${car.model} - ${car.year}`}
            onClose={() => setShowChat(false)}
          />
        )}
    </div>
  );
};

export default CarDetailsEtc;
