import React from "react";
import HeaderLogo from "../../components/utils/HeaderLogo";
import AuthFooter from "../../components/utils/AuthFooter";
import { IoShieldCheckmark } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

const ResetSuccess = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Orange Header */}
      <HeaderLogo />

      {/* Main Content - White Panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 md:p-8">
          {/* Shield Icon with Checkmark */}
          <div className="flex justify-center mb-4">
            <div className="relative w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <IoShieldCheckmark className="text-5xl text-primary-500" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">
            Password Changed Successfully!
          </h2>
          <p className="text-gray-500 text-center mb-8">
            You can now login with your new password.
          </p>

          {/* Large Green Checkmark Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center">
              <svg
                className="w-16 h-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Go to Login Button */}
          <button
            onClick={() => navigate("/login")}
            className="w-full h-12 bg-primary-500 text-white font-semibold rounded hover:opacity-90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>

     
    </div>
  );
};

export default ResetSuccess;
