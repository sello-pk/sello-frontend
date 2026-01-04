import React, { useState } from "react";
import HeaderLogo from "../../components/utils/HeaderLogo";
import AuthFooter from "../../components/utils/AuthFooter";
import { BsTelephoneXFill } from "react-icons/bs";
import { FaTimes } from "react-icons/fa";
import { useForgotPasswordMutation } from "../../redux/services/api";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Spinner from "../../components/Spinner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      return toast.error("Email is required");
    }

    try {
      await forgotPassword({ email }).unwrap();
      toast.success("OTP sent successfully");
      localStorage.setItem("email", email);
      navigate("/verify-otp");
    } catch (err) {
      const errorMessage =
        err?.data?.message ||
        err?.message ||
        "Failed to send OTP. Please try again later.";
      setError(errorMessage);
      toast.error(errorMessage, { duration: 5000 });
      console.error("Forgot password error", err);
    }
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
              Forgot Password?
            </h2>
            <p className="text-gray-500 text-center mb-6">
              Please enter your details.
            </p>

            <form onSubmit={handleSubmit} className="w-full">
              {/* Email Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(""); // Clear error on type
                  }}
                  className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
                  type="email"
                  placeholder="example@gmail.com"
                />
              </div>

              {/* Error Message Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  <p className="font-semibold">Error:</p>
                  <p>{error}</p>
                </div>
              )}

              {/* Send OTP Button */}
              <button
                type="submit"
                className="w-full h-12 bg-primary-500 text-white font-semibold rounded hover:opacity-90 transition-colors mb-4"
                disabled={isLoading}
              >
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </button>

              {/* Back to Login Link */}
              <p className="text-center text-gray-600 text-sm">
                <Link
                  to={"/login"}
                  className="text-primary-500 hover:underline font-medium"
                >
                  Back to Login
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
