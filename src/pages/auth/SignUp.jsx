import React, { useState } from "react";
import HeaderLogo from "../../components/utils/HeaderLogo";
import AuthFooter from "../../components/utils/AuthFooter";
import { images } from "../../assets/assets";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import {
  useRegisterUserMutation,
  useGoogleLoginMutation,
} from "../../redux/services/api";
import Spinner from "../../components/Spinner";
import DealerSignup from "./DealerSignup";
import { setAccessToken } from "../../utils/tokenRefresh.js";

// Check if Google OAuth is configured
const hasGoogleClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showDealerForm, setShowDealerForm] = useState(false);
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    repeatPassword: "",
  });

  const [registerUser] = useRegisterUserMutation();
  const [googleLogin] = useGoogleLoginMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!data.name || !data.email || !data.password || !data.repeatPassword) {
      return toast.error("All fields are required");
    }

    if (data.password !== data.repeatPassword) {
      return toast.error("Passwords do not match");
    }

    // Create a default avatar if none is provided
    if (!avatar) {
      // Create a simple default avatar using a data URL
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFA602";
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "80px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(data.name.charAt(0).toUpperCase(), 100, 100);
      
      canvas.toBlob((blob) => {
        const defaultAvatar = new File([blob], "avatar.png", { type: "image/png" });
        submitForm(defaultAvatar);
      }, "image/png");
      return;
    }

    submitForm(avatar);
  };

  const submitForm = async (avatarFile) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("role", "individual");
    formData.append("avatar", avatarFile);

    try {
      setLoading(true);
      const res = await registerUser(formData).unwrap();
      toast.success(res.message || "Registered successfully!");
      setData({ name: "", email: "", password: "", repeatPassword: "" });
      setAvatar(null);
      navigate("/login");
    } catch (err) {
      toast.error(err?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setGoogleLoading(true);
      
      if (!credentialResponse?.credential) {
        throw new Error("No credential received from Google");
      }
      
      const token = credentialResponse.credential;
      const res = await googleLogin(token).unwrap();

      // Check response structure - handle both transformed and raw responses
      const responseToken = res?.token || res?.accessToken || res?.data?.token;
      const responseUser = res?.user || res?.data?.user;

      if (!responseToken || !responseUser) {
        console.error("Invalid Google signup response structure", { response: res });
        throw new Error("Invalid response from server. Please try again.");
      }

      // Store access token (refresh token is handled via httpOnly cookie on the server)
      setAccessToken(responseToken);
      localStorage.setItem("user", JSON.stringify(responseUser));

      toast.success("Google sign-up successful!");
      
      // Redirect based on user role
      if (responseUser?.role === "admin") {
        navigate("/admin/dashboard");
      } else if (responseUser?.role === "dealer" && responseUser?.dealerInfo?.verified) {
        navigate("/dealer/dashboard");
      } else if (responseUser?.role === "dealer" && !responseUser?.dealerInfo?.verified) {
        // Unverified dealers go to seller dashboard
        navigate("/seller/dashboard");
      } else if (responseUser?.role === "individual") {
        // Individual users go to home page, not seller dashboard
        navigate("/");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Google sign-up error", err, {
        status: err?.status,
        data: err?.data,
        message: err?.message,
        originalStatus: err?.originalStatus
      });
      
      let errorMessage = "Google sign-up failed. Please try again.";
      
      // Handle RTK Query errors
      if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.data?.error) {
        errorMessage = err.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.status === 401 || err?.originalStatus === 401) {
        errorMessage = "Authentication failed. Please check your Google account and try again.";
      } else if (err?.status === 403 || err?.originalStatus === 403) {
        errorMessage = "Access denied. Please contact support.";
      } else if (err?.status === 500 || err?.originalStatus === 500) {
        errorMessage = "Server error. Google authentication may not be configured. Please contact support.";
      }
      
      toast.error(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <div className="flex md:flex-row flex-col h-screen">
        {/* Orange Header */}
        <HeaderLogo />

        {/* Main Content - White Panel */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 ">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 md:p-8">
            {/* User Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <img
                  className="w-10 h-10"
                  src={images.userIcon}
                  alt="userIcon"
                />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
              Please enter your details.
            </h2>

            <form
              onSubmit={handleSubmit}
              className="w-full"
              encType="multipart/form-data"
            >
              {/* Full Name Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
                  type="text"
                  placeholder="Enter full name"
                />
              </div>

              {/* Email Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
                  type="email"
                  placeholder="Enter your email"
                />
              </div>

             <div className="flex gap-4 md:flex-row lg:flex-row sm:flex-col flex-col">
               {/* Password Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    value={data.password}
                    onChange={(e) =>
                      setData({ ...data, password: e.target.value })
                    }
                    className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg pr-10"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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

              {/* Repeat Password Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repeat Password
                </label>
                <div className="relative">
                  <input
                    value={data.repeatPassword}
                    onChange={(e) =>
                      setData({ ...data, repeatPassword: e.target.value })
                    }
                    className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg pr-10"
                    type={showRepeatPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                  >
                    {showRepeatPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                  </button>
                </div>
              </div>
             </div>

              {/* Terms Checkbox */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    I accept the{" "}
                    <Link
                      to="/privacy-policy"
                      className="text-primary-500 hover:underline font-medium"
                    >
                      Privacy Services
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/terms-conditon"
                      className="text-primary-500 hover:underline font-medium"
                    >
                      Terms
                    </Link>
                    .
                  </span>
                </div>
              </div>

              {/* Avatar - Hidden but still required - using a default */}
              <div className="mb-4 hidden">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatar(e.target.files[0])}
                  className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  id="avatar-input"
                />
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary-500 text-white font-semibold rounded hover:opacity-90 transition-colors mb-4 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5 inline-block"></span>
                ) : (
                  "Sign Up"
                )}
              </button>

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Google Sign Up Button */}
              <div className="mb-4 w-full">
                <div className="googleBtn">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={(error) => {
                      // Handle configuration errors gracefully - don't show errors for unconfigured OAuth
                      if (!hasGoogleClientId) {
                        return;
                      }
                      
                      // Handle actual errors when OAuth IS configured
                      if (error?.message?.includes("origin is not allowed") || error?.message?.includes("GSI_LOGGER")) {
                        toast.error("Google Sign-In configuration error. Please use email/password sign-up.");
                        return;
                      }
                      
                      // Log other errors for debugging (only if configured)
                      console.error("Google OAuth error", error);
                      
                      let errorMsg = "Google sign-up failed. ";
                      
                      if (error?.type === "popup_closed_by_user") {
                        errorMsg = "Sign-up cancelled.";
                      } else if (error?.type === "popup_failed_to_open") {
                        errorMsg = "Popup blocked. Please allow popups for this site.";
                      } else if (error?.type === "idpiframe_initialization_failed") {
                        errorMsg = "Google authentication service unavailable. Please use email/password sign-up.";
                      } else {
                        errorMsg += "Please try again or use email/password sign-up.";
                      }
                      
                      toast.error(errorMsg);
                    }}
                    useOneTap={false}
                    theme="outline"
                    shape="rectangular"
                    size="large"
                    text="signup_with"
                    auto_select={false}
                  />
                </div>
              </div>

             

              {/* Sign In Link */}
             <div className="flex md:flex-row flex-col items-center justify-between">
               <p className="text-center text-gray-600 text-base">
                Already have an account?{" "}
                <Link
                  to={"/login"}
                  className="text-primary-500 hover:underline font-medium"
                >
                  Sign in
                </Link>
                 
              </p>
              {/* Sign Up as a Dealer Button */}
              <button
                type="button"
                onClick={() => setShowDealerForm(true)}
                className="text-primary-500 hover:underline ml-6"
              >
                Sign Up as a Dealer
              </button>
             </div>
            </form>
          </div>
        </div>

        {/* Dealer Registration Form Modal */}
        {showDealerForm && (
          <DealerSignup onBack={() => setShowDealerForm(false)} />
        )}
      </div>
    </>
  );
};

export default SignUp;
