import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsTelephoneXFill } from "react-icons/bs";
import { FaTimes } from "react-icons/fa";
import HeaderLogo from "../../components/utils/HeaderLogo";
import AuthFooter from "../../components/utils/AuthFooter";
import OtpFields from "../../components/OTPFields";
import Spinner from "../../components/Spinner";
import { useVerifyOtpMutation } from "../../redux/services/api";
import { toast } from "react-hot-toast";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp || otp.length < 4) {
      return toast.error("Please enter a valid OTP");
    }

    try {
      await verifyOtp(otp).unwrap();
      toast.success("OTP verified successfully");
      navigate("/reset-password");
    } catch (err) {
      toast.error(err?.data?.message || "Invalid OTP, please try again.");
    }
  };

  const handleResend = () => {
    toast.success("OTP resent successfully");
    // You can add resend OTP logic here
  };

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Orange Header */}
        <HeaderLogo />

        {/* Main Content - White Panel */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 md:p-8">
            {/* Phone Icon with X */}
            <div className="flex justify-center mb-4">
              <div className="relative w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <BsTelephoneXFill className="text-4xl text-gray-600" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <FaTimes className="text-white text-xs" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">
              OTP
            </h2>
            <p className="text-gray-500 text-center mb-6">
              Please enter the OTP sent to your registered email address.
            </p>

            <form onSubmit={handleSubmit} className="w-full">
              {/* OTP Fields */}
              <div className="mb-6">
                <OtpFields value={otp} onChange={setOtp} />
              </div>

              {/* Verify OTP Button */}
              <button
                type="submit"
                className="w-full h-12 bg-primary-500 text-white font-semibold rounded hover:opacity-90 transition-colors mb-4"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>

              {/* Resend OTP Link */}
              <p className="text-center text-gray-600 text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-primary-500 hover:underline font-medium"
                >
                  Resend OTP
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyOtp;
