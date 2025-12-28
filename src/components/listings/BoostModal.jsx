import React, { useState, useEffect } from "react";
import { FiX, FiZap, FiCheckCircle, FiCreditCard, FiClock } from "react-icons/fi";
import { 
  useBoostPostMutation, 
  useGetBoostOptionsQuery, 
  useGetMeQuery,
  useCreateBoostCheckoutMutation 
} from "../../redux/services/api";
import toast from "react-hot-toast";
import Spinner from "../Spinner";

const BoostModal = ({ isOpen, onClose, car, onSuccess }) => {
  const [selectedDuration, setSelectedDuration] = useState(7);
  const [useCredits, setUseCredits] = useState(false);
  const { data: boostOptions, isLoading: optionsLoading } = useGetBoostOptionsQuery();
  const { data: user } = useGetMeQuery();
  const [boostPost, { isLoading: isBoosting }] = useBoostPostMutation();
  const [createBoostCheckout, { isLoading: isCreatingCheckout }] = useCreateBoostCheckoutMutation();

  const durations = boostOptions?.availableDurations || [3, 7, 14, 30];
  const pricePerDay = boostOptions?.costPerDay || 5;
  const totalCost = selectedDuration * pricePerDay;
  const hasEnoughCredits = (user?.boostCredits || 0) >= totalCost;

  useEffect(() => {
    if (user?.boostCredits >= totalCost) {
      setUseCredits(true);
    }
  }, [user?.boostCredits, totalCost]);

  const handleBoost = async () => {
    if (!car?._id) {
      toast.error("Car information is missing");
      return;
    }

    try {
      if (useCredits && hasEnoughCredits) {
        // Use credits
        const result = await boostPost({
          carId: car._id,
          duration: selectedDuration,
          useCredits: true
        }).unwrap();

        toast.success(`Listing boosted successfully for ${selectedDuration} day(s)!`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        // Create Stripe checkout
        const checkout = await createBoostCheckout({
          carId: car._id,
          duration: selectedDuration
        }).unwrap();

        // Redirect to Stripe checkout
        if (checkout.url) {
          window.location.href = checkout.url;
        } else {
          toast.error("Failed to create checkout session");
        }
      }
    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || "Failed to boost listing. Please try again.";
      if (error?.data?.requiresPayment) {
        // If payment is required, create checkout
        try {
          const checkout = await createBoostCheckout({
            carId: car._id,
            duration: selectedDuration
          }).unwrap();
          if (checkout.url) {
            window.location.href = checkout.url;
          }
        } catch (checkoutError) {
          toast.error("Failed to create payment session");
        }
      } else {
        toast.error(errorMessage);
      }
    }
  };

  if (!isOpen) return null;

  const isBoosted = car?.isBoosted && new Date(car?.boostExpiry) > new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FiZap className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Boost Your Listing</h3>
              <p className="text-primary-100 text-sm">
                Get more visibility and reach more buyers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Car Info */}
          {car && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-1">
                {car.make} {car.model} {car.year}
              </h4>
              <p className="text-sm text-gray-600">PKR {car.price?.toLocaleString()}</p>
              {isBoosted && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <FiCheckCircle size={16} />
                  <span>Currently boosted until {new Date(car.boostExpiry).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <FiClock className="inline mr-2" size={16} />
              Select Boost Duration
            </label>
            <div className="grid grid-cols-5 gap-3">
              {durations.map((days) => {
                const cost = days * pricePerDay;
                const isSelected = selectedDuration === days;
                return (
                  <button
                    key={days}
                    onClick={() => setSelectedDuration(days)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary-500 bg-primary-50 text-primary-500"
                        : "border-gray-200 hover:border-primary-300 text-gray-700"
                    }`}
                  >
                    <div className="font-bold text-lg">{days}</div>
                    <div className="text-xs mt-1">day{days > 1 ? "s" : ""}</div>
                    <div className="text-xs font-semibold mt-1">PKR {cost}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Price per day</span>
              <span className="font-semibold">PKR {pricePerDay}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Duration</span>
              <span className="font-semibold">{selectedDuration} day{selectedDuration > 1 ? "s" : ""}</span>
            </div>
            <div className="border-t border-primary-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Cost</span>
                <span className="text-2xl font-bold text-primary-500">PKR {totalCost}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          {hasEnoughCredits && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCredits}
                  onChange={(e) => setUseCredits(e.target.checked)}
                  className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    Use Boost Credits
                  </div>
                  <div className="text-sm text-gray-600">
                    You have {user?.boostCredits || 0} credits available
                  </div>
                </div>
                <div className="font-bold text-primary-500">
                  -{totalCost} credits
                </div>
              </label>
            </div>
          )}

          {!useCredits && (
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
              <div className="flex items-center gap-2 mb-2">
                <FiCreditCard className="text-primary-600" size={16} />
                <span className="font-semibold text-gray-900">Secure Payment</span>
              </div>
              <p className="text-sm text-gray-600">
                You will be redirected to Stripe for secure payment processing. Your listing will be boosted immediately after payment confirmation.
              </p>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Boost Benefits</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your listing appears at the top of search results</li>
              <li>• Get 3x more views and inquiries</li>
              <li>• Priority placement in featured sections</li>
              <li>• Badge showing "Boosted" on your listing</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              disabled={isBoosting}
            >
              Cancel
            </button>
            <button
              onClick={handleBoost}
              disabled={isBoosting || isCreatingCheckout || optionsLoading}
              className="px-6 py-2 bg-primary-500 hover:opacity-90 text-white rounded-lg font-medium shadow-md hover:shadow-lg transform active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {(isBoosting || isCreatingCheckout) ? (
                <>
                  <Spinner fullScreen={false} />
                  Processing...
                </>
              ) : (
                <>
                  <FiZap size={16} />
                  {useCredits && hasEnoughCredits ? `Boost Now - ${totalCost} Credits` : `Boost Now - $${totalCost}`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoostModal;

