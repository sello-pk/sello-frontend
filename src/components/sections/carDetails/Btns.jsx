import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  useGetSingleCarQuery, 
  useGetMeQuery,
  useSaveCarMutation,
  useUnsaveCarMutation,
  useGetSavedCarsQuery,
  useTrackRecentlyViewedMutation,
  useCreateReportMutation
} from "../../../redux/services/api";
import CarChatWidget from "../../carChat/CarChatWidget";
import toast from "react-hot-toast";
import { FaHeart, FaRegHeart, FaShareAlt, FaPhone, FaCommentDots } from "react-icons/fa";

const Btns = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const { data: car } = useGetSingleCarQuery(id, { skip: !id });
  const { data: currentUser } = useGetMeQuery(undefined, { skip: !token });
  const { data: savedCarsData } = useGetSavedCarsQuery(undefined, { skip: !currentUser || !token });
  const [saveCar, { isLoading: isSaving }] = useSaveCarMutation();
  const [unsaveCar, { isLoading: isUnsaving }] = useUnsaveCarMutation();
  const [trackRecentlyViewed] = useTrackRecentlyViewedMutation();
  const [createReport, { isLoading: isReporting }] = useCreateReportMutation();
  const [showChat, setShowChat] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  
  const savedCars = savedCarsData || [];
  const isSaved = savedCars.some(savedCar => savedCar._id === id);
  
  // Track recently viewed when car loads
  useEffect(() => {
    if (id && currentUser) {
      trackRecentlyViewed(id).catch(err => console.error('Failed to track view:', err));
    }
  }, [id, currentUser, trackRecentlyViewed]);

  const handleShare = () => {
    try {
      const currentUrl = window.location.href;
      if (navigator.share) {
        navigator.share({
          title: "Sello - Car Details",
          text: "Check out this car I found on Sello!",
          url: currentUrl,
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(currentUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      // Share failed
    }
  };
  
  const isSold = !!car?.isSold;

  const handleChat = () => {
    if (!currentUser) {
      toast.error("Please login to chat with seller");
      return;
    }
    if (car && currentUser._id === car.postedBy?._id) {
      toast.error("You cannot chat with yourself");
      return;
    }
    if (isSold) {
      toast.error("This car has been sold. Chat is disabled.");
      return;
    }
    setShowChat(true);
  };
  
  const handleCall = () => {
    if (isSold) {
      toast.error("This car has been sold. Calling is disabled.");
      return;
    }
    if (car && car.contactNumber) {
      window.location.href = `tel:${car.contactNumber}`;
    } else {
      toast.error("Contact number not available");
    }
  };

  const handleSaveListing = async () => {
    if (!currentUser) {
      toast.error("Please login to save listings");
      navigate("/login");
      return;
    }

    try {
      if (isSaved) {
        await unsaveCar(id).unwrap();
        toast.success("Listing removed from saved");
      } else {
        await saveCar(id).unwrap();
        toast.success("Listing saved successfully");
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to save listing");
    }
  };

  return (
    <>
      <div className="px-4 md:px-20 py-6 bg-[#F9FAFB] border-b border-gray-200">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Left Side - Action Buttons */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Contact Seller / Chat Button */}
            {!isSold && (
              <button
                onClick={handleChat}
                disabled={!currentUser || (car && currentUser._id === car.postedBy?._id)}
                className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaCommentDots />
                {currentUser && car && currentUser._id === car.postedBy?._id
                  ? "Your Listing"
                  : "Contact Seller"}
              </button>
            )}

            {/* Call Button */}
            {!isSold && car?.contactNumber && (
              <button
                onClick={handleCall}
                className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-colors"
              >
                <FaPhone />
                Call Now
              </button>
            )}

            {/* Save Listing Button */}
            {currentUser && (
              <button
                onClick={handleSaveListing}
                disabled={isSaving || isUnsaving}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isSaved
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } disabled:opacity-50`}
              >
                {isSaved ? <FaHeart /> : <FaRegHeart />}
                {isSaved ? "Saved" : "Save Listing"}
              </button>
            )}

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-primary-100 text-primary-500 px-6 py-3 rounded-lg font-semibold hover:bg-primary-200 transition-colors"
            >
              <FaShareAlt />
              Share
            </button>
          </div>

          {/* Right Side - Status & Report */}
          <div className="flex items-center gap-4">
            {isSold && (
              <span className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold">
                Sold
              </span>
            )}
            
            {/* Report Button */}
            <button
              onClick={() => {
                if (!currentUser) {
                  toast.error("Please login to report");
                  navigate("/login");
                  return;
                }
                setShowReportModal(true);
              }}
              disabled={isReporting}
              className="px-4 py-2 text-red-600 hover:text-red-700 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isReporting ? "Submitting..." : "Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Car Chat Widget */}
      {showChat && car && currentUser && (
        <CarChatWidget
          carId={car._id}
          sellerId={car.postedBy?._id || car.postedBy}
          carTitle={`${car.make} ${car.model} - ${car.year}`}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          if (!isReporting) {
            setShowReportModal(false);
            setReportReason("");
            setReportDescription("");
          }
        }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Report Listing</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please select a reason for reporting this listing:
            </p>
            
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg mb-4"
            >
              <option value="">Select a reason</option>
              <option value="Spam">Spam</option>
              <option value="Inappropriate Content">Inappropriate Content</option>
              <option value="Misleading Information">Misleading Information</option>
              <option value="Fake Listing">Fake Listing</option>
              <option value="Harassment">Harassment</option>
              <option value="Other">Other</option>
            </select>

            <textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Additional details (optional)"
              className="w-full p-2 border border-gray-300 rounded-lg mb-4 h-24 resize-none"
              maxLength={1000}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason("");
                  setReportDescription("");
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isReporting}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!reportReason) {
                    toast.error("Please select a reason");
                    return;
                  }
                  
                  try {
                    await createReport({
                      targetType: "Car",
                      targetId: car._id,
                      reason: reportReason,
                      description: reportDescription
                    }).unwrap();
                    
                    toast.success("Report submitted successfully. Our team will review it shortly.");
                    setShowReportModal(false);
                    setReportReason("");
                    setReportDescription("");
                  } catch (error) {
                    toast.error(error?.data?.message || "Failed to submit report. Please try again.");
                  }
                }}
                disabled={isReporting || !reportReason}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReporting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Btns;
