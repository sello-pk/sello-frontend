import React, { useState } from "react";
import { FiCheck, FiX, FiCreditCard, FiCalendar, FiZap, FiStar, FiTrendingUp, FiShield } from "react-icons/fi";
import {
  useGetSubscriptionPlansQuery,
  useGetMySubscriptionQuery,
  usePurchaseSubscriptionMutation,
  useCancelSubscriptionMutation,
  useGetPaymentHistoryQuery,
  useCreateSubscriptionCheckoutMutation,
} from "../../redux/services/api";
import toast from "react-hot-toast";
import Spinner from "../Spinner";
import { format } from "date-fns";
import ConfirmModal from "../admin/ConfirmModal";

const SubscriptionManagement = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [autoRenew, setAutoRenew] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data: plansData, isLoading: plansLoading } = useGetSubscriptionPlansQuery();
  const { data: mySubscription, isLoading: subLoading, refetch: refetchSubscription } = useGetMySubscriptionQuery();
  const { data: paymentHistory, isLoading: historyLoading } = useGetPaymentHistoryQuery();
  const [purchaseSubscription, { isLoading: isPurchasing }] = usePurchaseSubscriptionMutation();
  const [createSubscriptionCheckout, { isLoading: isCreatingCheckout }] = useCreateSubscriptionCheckoutMutation();
  const [cancelSubscription, { isLoading: isCancelling }] = useCancelSubscriptionMutation();

  // Extract plans and payment system status
  const plans = plansData?.data || {};
  const paymentSystemEnabled = plansData?.paymentSystemEnabled !== undefined ? plansData.paymentSystemEnabled : true;
  const subscriptionPlans = plans;
  const currentSubscription = mySubscription?.subscription;
  const planDetails = mySubscription?.planDetails;
  const isActive = currentSubscription?.isActive || false;
  const daysRemaining = currentSubscription?.endDate
    ? Math.ceil((new Date(currentSubscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    try {
      // Create checkout session (Stripe or JazzCash, depending on server config)
      const checkout = await createSubscriptionCheckout({
        plan: selectedPlan,
        autoRenew: autoRenew,
      }).unwrap();

      // If payment is not required (e.g. free plan activated directly)
      if (checkout && checkout.paymentRequired === false) {
        toast.success(checkout.message || "Plan activated successfully.");
        setShowPaymentModal(false);
        refetchSubscription();
        return;
      }

      // Redirect to external payment page (Stripe/JazzCash)
      if (checkout?.url) {
        // Stripe-style response
        window.location.href = checkout.url;
        return;
      }

      if (checkout?.paymentUrl) {
        // JazzCash-style response
        window.location.href = checkout.paymentUrl;
        return;
      }

        toast.error("Failed to create checkout session");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create checkout session. Please try again.");
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    try {
      await cancelSubscription().unwrap();
      toast.success("Subscription auto-renewal cancelled successfully");
      refetchSubscription();
      setShowCancelModal(false);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to cancel subscription");
    }
  };

  const getPlanIcon = (planKey) => {
    switch (planKey) {
      case "premium":
        return <FiStar className="text-yellow-500" size={24} />;
      case "dealer":
        return <FiShield className="text-primary-500" size={24} />;
      case "basic":
        return <FiTrendingUp className="text-green-500" size={24} />;
      default:
        return <FiZap className="text-gray-500" size={24} />;
    }
  };

  if (plansLoading || subLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner fullScreen={false} />
      </div>
    );
  }

  // If payment system is explicitly disabled, don't show anything
  if (paymentSystemEnabled === false) {
    return null;
  }

  // If no plans available but payment system is enabled, show message
  if (Object.keys(subscriptionPlans).length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">No subscription plans are currently available. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      {isActive && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Current Plan: {planDetails?.name || "Free"}</h3>
              <div className="flex items-center gap-4 text-primary-100">
                <div className="flex items-center gap-2">
                  <FiCalendar size={18} />
                  <span>
                    {daysRemaining > 0
                      ? `${daysRemaining} days remaining`
                      : "Expired"}
                  </span>
                </div>
                {currentSubscription?.endDate && (
                  <span>
                    Expires: {format(new Date(currentSubscription.endDate), "MMM dd, yyyy")}
                  </span>
                )}
              </div>
              {currentSubscription?.autoRenew && (
                <p className="text-sm text-primary-100 mt-2">Auto-renewal enabled</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{planDetails?.price ? `$${planDetails.price}` : "Free"}</div>
              <div className="text-sm text-primary-100">per month</div>
            </div>
          </div>
          {currentSubscription?.autoRenew && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isCancelling ? "Cancelling..." : "Cancel Auto-Renewal"}
            </button>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Auto-Renewal"
        message="Are you sure you want to cancel auto-renewal? Your subscription will remain active until the end date."
        confirmText="Cancel Auto-Renewal"
        variant="warning"
        isLoading={isCancelling}
      />

      {/* Subscription Plans */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {isActive ? "Upgrade Your Plan" : "Choose a Subscription Plan"}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(subscriptionPlans).map(([planKey, plan]) => {
            const isCurrentPlan = currentSubscription?.plan === planKey && isActive;
            const isUpgrade = !isActive || (planKey !== "free" && plan.price > (planDetails?.price || 0));

            return (
              <div
                key={planKey}
                className={`relative rounded-xl border-2 p-6 transition-all ${
                  isCurrentPlan
                    ? "border-primary-500 bg-primary-50"
                    : planKey === "premium"
                    ? "border-yellow-300 bg-gradient-to-br from-yellow-50 to-white"
                    : planKey === "dealer"
                    ? "border-primary-300 bg-gradient-to-br from-primary-50 to-white"
                    : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-lg"
                }`}
              >
                {planKey === "premium" && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    POPULAR
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4 bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    CURRENT
                  </div>
                )}

                <div className="text-center mb-4">
                  <div className="flex justify-center mb-2">{getPlanIcon(planKey)}</div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <FiCheck className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (isCurrentPlan) {
                      toast.info("You are already on this plan");
                      return;
                    }
                    setSelectedPlan(planKey);
                    setShowPaymentModal(true);
                  }}
                  disabled={isCurrentPlan}
                  className={`w-full py-2 rounded-lg font-semibold transition-all ${
                    isCurrentPlan
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : planKey === "premium"
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                      : planKey === "dealer"
                      ? "bg-primary-500 hover:opacity-90 text-white"
                      : "bg-primary-500 hover:opacity-90 text-white"
                  }`}
                >
                  {isCurrentPlan ? "Current Plan" : isUpgrade ? "Upgrade" : "Select Plan"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History - Only show if enabled */}
      {paymentHistory && paymentHistory.payments && paymentHistory.payments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Payment History</h3>
          <div className="space-y-3">
            {paymentHistory.payments
              .filter((p) => p.purpose === "subscription")
              .slice(0, 5)
              .map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FiCreditCard className="text-primary-500" size={20} />
                    <div>
                      <p className="font-semibold text-gray-900">
                        ${payment.amount} - {payment.purpose}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(payment.createdAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      payment.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : payment.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              ))}
          </div>
          {paymentHistory.totalSpent > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Total Spent: <span className="font-bold text-gray-900">${paymentHistory.totalSpent}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Complete Subscription</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPlan(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {subscriptionPlans[selectedPlan]?.name} Plan
                </h4>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Price</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ${subscriptionPlans[selectedPlan]?.price}
                  </span>
                </div>
              </div>

              <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                <div className="flex items-center gap-2 mb-2">
                  <FiCreditCard className="text-primary-600" size={16} />
                  <span className="font-semibold text-gray-900">Secure Payment</span>
                </div>
                <p className="text-sm text-gray-600">
                  You will be redirected to Stripe for secure payment processing. Your subscription will be activated immediately after payment confirmation.
                </p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRenew}
                    onChange={(e) => setAutoRenew(e.target.checked)}
                    className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">Auto-Renewal</div>
                    <div className="text-sm text-gray-600">
                      Automatically renew this subscription each month
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPlan(null);
                  }}
                  className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  disabled={isPurchasing}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={isPurchasing || isCreatingCheckout}
                  className="px-6 py-2 bg-primary-500 hover:opacity-90 text-white rounded-lg font-medium shadow-md hover:shadow-lg transform active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {(isPurchasing || isCreatingCheckout) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiCreditCard size={16} />
                      Subscribe - ${subscriptionPlans[selectedPlan]?.price}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;

