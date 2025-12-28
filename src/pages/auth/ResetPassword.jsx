import React, { useState } from "react";
import { HiOutlineKey } from "react-icons/hi";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import HeaderLogo from "../../components/utils/HeaderLogo";
import AuthFooter from "../../components/utils/AuthFooter";
import { useResetPasswordMutation } from "../../redux/services/api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Spinner from "../../components/Spinner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      return toast.error("All fields are required");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      await resetPassword({ password }).unwrap();
      toast.success("Password reset successfully");
      navigate("/reset-success");
    } catch (err) {
      toast.error(err?.data?.message || "Reset failed, please try again");
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
            {/* Key Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <HiOutlineKey className="text-5xl text-yellow-500" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
              New Password
            </h2>

            <form onSubmit={handleSubmit} className="w-full">
              {/* New Password Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg pr-10"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg pr-10"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                  </button>
                </div>
              </div>

              {/* Change Password Button */}
              <button
                type="submit"
                className="w-full h-12 bg-primary-500 text-white font-semibold rounded hover:opacity-90 transition-colors mb-4"
                disabled={isLoading}
              >
                {isLoading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>

       
      </div>
    </>
  );
};

export default ResetPassword;
