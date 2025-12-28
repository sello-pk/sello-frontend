import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RightSide from "../../components/utils/RightSide";
import HeaderLogo from "../../components/utils/HeaderLogo";
import {
  FaRegEye,
  FaRegEyeSlash,
  FaCheckCircle,
  FaUserShield,
} from "react-icons/fa";
import { FiMail, FiUser, FiShield, FiClock, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";
import Spinner from "../../components/Spinner";
import {
  useGetInviteByTokenQuery,
  useAcceptInviteMutation,
} from "../../redux/services/adminApi";
import { setAccessToken } from "../../utils/tokenRefresh.js";

// DetailItem component for invitation details
const DetailItem = ({ icon, label, value, badge = false }) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 text-gray-600">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          {label}
        </p>
        {badge ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary-100 text-primary-500">
            {value}
          </span>
        ) : (
          <p className="font-semibold text-gray-900 text-base break-all">
            {value}
          </p>
        )}
      </div>
    </div>
  );
};

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch invite details
  const {
    data: inviteData,
    isLoading: isLoadingInvite,
    error: inviteError,
  } = useGetInviteByTokenQuery(token);
  const [acceptInvite, { isLoading: isAccepting }] = useAcceptInviteMutation();

  useEffect(() => {
    if (inviteError) {
      const errorMessage =
        inviteError?.data?.message || "Invalid or expired invitation link.";
      toast.error(errorMessage);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  }, [inviteError, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || password.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      const res = await acceptInvite({ token, password }).unwrap();

      // Response structure after transformResponse: { user: {...}, token: "..." }
      const userData = res.user;
      const tokenData = res.token;

      if (!userData || !tokenData) {
        throw new Error("Invalid response from server");
      }

      // STEP 1: CRITICAL - Clear email and OTP FIRST before doing anything else
      // This prevents any code that checks for email from redirecting to reset-password
      localStorage.removeItem("email");
      localStorage.removeItem("otp");


      // STEP 2: Store access token and user data (refresh token handled via httpOnly cookie)
      setAccessToken(tokenData);

      const completeUserData = {
        ...userData,
        adminRole: userData.adminRole || inviteData?.role,
        permissions: userData.permissions || {},
        role: "admin",
        verified: true,
        isEmailVerified: true,
        status: "active",
      };

      localStorage.setItem("user", JSON.stringify(completeUserData));

      // STEP 3: Clear email and OTP AGAIN (defensive programming)
      localStorage.removeItem("email");
      localStorage.removeItem("otp");

      // Verify email is cleared before redirect
      const emailStillExists = localStorage.getItem("email");
      if (emailStillExists) {
        localStorage.removeItem("email");
      }

      toast.success(
        `Invitation accepted! Redirecting to admin panel as ${
          completeUserData.adminRole || inviteData?.role
        }...`
      );

      // STEP 4: Redirect immediately without delay to prevent any interference
      // Using React Router navigate with replace to avoid history issues
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      console.error("Accept invite error", err);
      toast.error(
        err?.data?.message || err?.message || "Failed to accept invitation"
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoadingInvite) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Spinner fullScreen={false} />
          <p className="mt-4 text-gray-600">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (inviteError || !inviteData) {
    return (
      <div className="flex h-screen flex-wrap flex-col md:flex-row bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="md:w-1/2 w-full flex items-center justify-center p-6">
          <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Invalid Invitation
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {inviteError?.data?.message ||
                "This invitation link is invalid or has expired."}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Go to Login
            </button>
          </div>
        </div>
        <div className="md:w-1/2 w-full hidden md:block">
          <RightSide
            rightPath="/login"
            leftPath="/register"
            text="Welcome to our platform!"
          />
        </div>
      </div>
    );
  }

  const invite = inviteData;

  return (
    <>
      {isAccepting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <Spinner fullScreen={false} />
            <p className="mt-4 text-gray-700 font-medium">
              Creating your account...
            </p>
          </div>
        </div>
      )}
      <div className="flex  flex-col md:flex-row bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
        {/* Left Side - Invitation + Password */}
        <div className=" w-full flex overflow-y-auto">
          <div className="flex justify-center px-6 md:px-12 py-10 w-full  ">
            <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 p-5 rounded-lg border border-gray-300">
              {/* LEFT COLUMN – Invitation Details */}
              <div className="md:w-1/2 w-full space-y-6">
                {/* Header */}
                <div className="text-center md:text-left">
                  <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <FiMail className="text-white text-4xl" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    You're Invited!
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Complete your account setup
                  </p>
                </div>

                {/* Invite Card */}
                <div className=" p-6">
                  <h3 className="font-semibold text-lg mb-4">
                    Invitation Details
                  </h3>

                  <div className="space-y-4">
                    <DetailItem
                      icon={<FiUser />}
                      label="Full Name"
                      value={invite.fullName}
                    />
                    <DetailItem
                      icon={<FiMail />}
                      label="Email"
                      value={invite.email}
                    />
                    <DetailItem
                      icon={<FiShield />}
                      label="Role"
                      value={invite.role}
                      badge
                    />
                    <DetailItem
                      icon={<FiClock />}
                      label="Expires"
                      value={formatDate(invite.expiresAt)}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN – Password Form */}
              <div className="md:w-1/2 w-full">
                <form
                  onSubmit={handleSubmit}
                  className=" p-8 h-full flex flex-col justify-between"
                >
                  <div>
                    <h2 className="text-2xl font-bold mb-6">
                      Create Your Password
                    </h2>

                    <div className="space-y-5">
                      {/* Password */}
                      <div>
                        <label className="text-sm font-semibold mb-2 block">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type={showPassword ? "text" : "password"}
                            className="w-full px-4 py-3 border-2 rounded-xl focus:border-primary-500 outline-none"
                            placeholder="Min 6 characters"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                          >
                            {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="text-sm font-semibold mb-2 block">
                          Confirm Password
                        </label>
                        <input
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          type="password"
                          className="w-full px-4 py-3 border-2 rounded-xl focus:border-primary-500 outline-none"
                          placeholder="Confirm password"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={
                      isAccepting ||
                      password.length < 6 ||
                      password !== confirmPassword
                    }
                    className="mt-8 w-full bg-primary-500 py-4 text-white rounded font-medium hover:opacity-90 cursor-pointer"
                  >
                    {isAccepting
                      ? "Creating Account..."
                      : "Accept Invitation & Create Account"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AcceptInvite;
