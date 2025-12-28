import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiLoader, FiXCircle, FiZap } from "react-icons/fi";
import { useGetMyCarsQuery, useVerifyPaymentSessionQuery } from "../../redux/services/api";
import toast from "react-hot-toast";

const BoostSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const { refetch: refetchCars } = useGetMyCarsQuery();
  
  // Verify payment session
  const { data: paymentData, isLoading: isVerifying, error: verifyError, refetch: refetchVerification } = useVerifyPaymentSessionQuery(
    sessionId || "",
    { skip: !sessionId }
  );

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      toast.error("No session ID provided");
      return;
    }

    // Give webhook a moment to process
    const verifyTimer = setTimeout(() => {
      if (verifyError) {
        setStatus("error");
        toast.error("Failed to verify payment. Please contact support if you were charged.");
        return;
      }

      if (!isVerifying && paymentData) {
        if (paymentData.isPaid) {
          // Check if boost is active
          if (paymentData.boostStatus?.isActive) {
            setStatus("success");
            refetchCars();
            toast.success("Post boosted successfully!");
          } else if (paymentData.boostStatus?.isBoosted === false) {
            // Payment succeeded but boost not applied yet - wait a bit more
            setTimeout(() => {
              refetchVerification();
            }, 2000);
          } else {
            // Payment succeeded
            setStatus("success");
            refetchCars();
            toast.success("Payment verified! Your listing will be boosted shortly.");
          }
        } else {
          setStatus("error");
          toast.error("Payment was not successful. Please try again.");
        }
      }
    }, 1500); // Wait 1.5s for webhook to process

    return () => clearTimeout(verifyTimer);
  }, [sessionId, paymentData, isVerifying, verifyError, refetchCars, refetchVerification]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {status === "verifying" && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <FiLoader className="text-6xl text-primary-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Payment...
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your boost payment.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
                <FiZap className="text-5xl text-yellow-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Boost Activated!
            </h2>
            <p className="text-gray-600 mb-6">
              Your listing has been boosted successfully. It will now appear at the top of search results.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/my-listings")}
                className="w-full bg-primary-500 hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                View My Listings
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <FiXCircle className="text-5xl text-red-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't verify your payment. If you were charged, please contact support with your session ID.
            </p>
            {sessionId && (
              <p className="text-sm text-gray-500 mb-6">
                Session ID: {sessionId}
              </p>
            )}
            <div className="space-y-3">
              <button
                onClick={() => navigate("/my-listings")}
                className="w-full bg-primary-500 hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Go to My Listings
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoostSuccess;

