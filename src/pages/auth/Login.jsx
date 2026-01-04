import React, { useState } from "react";
import HeaderLogo from "../../components/utils/HeaderLogo";
import AuthFooter from "../../components/utils/AuthFooter";
import { images } from "../../assets/assets";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import {
  useLoginUserMutation,
  useGoogleLoginMutation,
  api,
} from "../../redux/services/api";
import { setAccessToken } from "../../utils/tokenRefresh.js";
import { store } from "../../redux/store";
import Spinner from "../../components/Spinner";

// Check if Google OAuth is configured
const hasGoogleClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [data, setData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });

  const navigate = useNavigate();
  const [loginUser, { isLoading }] = useLoginUserMutation();
  const [googleLogin] = useGoogleLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!data.email || !data.password) {
      toast.error("All fields are required");
      return;
    }

    try {
      const res = await loginUser({
        email: data.email,
        password: data.password,
        rememberMe: !!data.rememberMe,
      }).unwrap();

      if (!res) {
        throw new Error("Empty response from server");
      }

      // Validate response structure
      if (!res || (!res.token && !res.data?.token)) {
        throw new Error("Invalid response from server. Missing token.");
      }

      if (!res.user && !res.data?.user) {
        throw new Error("Invalid response from server. Missing user data.");
      }

      // Store tokens using utility functions for consistency
      const token = res.token || res.accessToken || res.data?.token;
      const user = res.user || res.data?.user;

      if (!token || !user) {
        throw new Error("Failed to extract login credentials from response.");
      }

      // Store access token (refresh token is handled via httpOnly cookie on the server)
      setAccessToken(token);

      // Store user data
      localStorage.setItem("user", JSON.stringify(user));

      // Invalidate and refetch user queries (mutation already does this, but ensure it happens)
      if (api?.util?.invalidateTags) {
        store.dispatch(api.util.invalidateTags(["User"]));
      }

      toast.success("Login successful");

      // Small delay to allow state updates
      setTimeout(() => {
        // Redirect based on user role - be strict about admin checks
        const userRole = user?.role?.toLowerCase()?.trim();

        // Redirect based on user role - be conservative about admin redirects
        // Only redirect to admin if role is explicitly "admin" (AdminRoute will handle final check)
        if (userRole === "admin") {
          // Check if user object has admin-related properties (indicating real admin)
          // If unsure, let AdminRoute handle the check
          if (
            "adminRole" in user ||
            "roleId" in user ||
            user?.status === "active"
          ) {
            navigate("/admin/dashboard");
          } else {
            // Role is "admin" but missing admin properties - redirect to home for safety
            navigate("/");
          }
        } else if (userRole === "dealer" && user?.dealerInfo?.verified) {
          navigate("/dealer/dashboard");
        } else if (userRole === "dealer" && !user?.dealerInfo?.verified) {
          // Unverified dealers go to seller dashboard
          navigate("/seller/dashboard");
        } else if (userRole === "individual") {
          // Individual users go to home page, not seller dashboard
          navigate("/");
        } else {
          // Default: redirect to home page
          navigate("/");
        }
      }, 100);
    } catch (err) {
      console.error("Login error", err);
      const errorMessage =
        err?.data?.message || err?.message || "Login failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      if (!credentialResponse?.credential) {
        throw new Error("No credential received from Google");
      }

      const token = credentialResponse.credential;
      const res = await googleLogin(token).unwrap();

      // Check response structure - handle both transformed and raw responses
      const responseToken = res?.token || res?.accessToken || res?.data?.token;
      const responseUser = res?.user || res?.data?.user;

      if (!responseToken || !responseUser) {
        console.error("Invalid Google login response structure", {
          response: res,
        });
        throw new Error("Invalid response from server. Please try again.");
      }

      // Store access token (refresh token is handled via httpOnly cookie on the server)
      setAccessToken(responseToken);
      localStorage.setItem("user", JSON.stringify(responseUser));

      // Invalidate and refetch user queries
      if (api?.util?.invalidateTags) {
        store.dispatch(api.util.invalidateTags(["User"]));
      }

      toast.success("Google login successful");

      // Small delay to allow state updates
      setTimeout(() => {
        // Redirect based on user role - be strict about admin checks
        const userRole = responseUser?.role?.toLowerCase()?.trim();

        // Redirect based on user role - be conservative about admin redirects
        // Only redirect to admin if role is explicitly "admin" (AdminRoute will handle final check)
        if (userRole === "admin") {
          // Check if user object has admin-related properties (indicating real admin)
          // If unsure, let AdminRoute handle the check
          if (
            "adminRole" in responseUser ||
            "roleId" in responseUser ||
            responseUser?.status === "active"
          ) {
            navigate("/admin/dashboard");
          } else {
            // Role is "admin" but missing admin properties - redirect to home for safety
            navigate("/");
          }
        } else if (
          userRole === "dealer" &&
          responseUser?.dealerInfo?.verified
        ) {
          navigate("/dealer/dashboard");
        } else if (
          userRole === "dealer" &&
          !responseUser?.dealerInfo?.verified
        ) {
          // Unverified dealers go to seller dashboard
          navigate("/seller/dashboard");
        } else if (userRole === "individual") {
          // Individual users go to home page, not seller dashboard
          navigate("/");
        } else {
          // Default: redirect to home page
          navigate("/");
        }
      }, 100);
    } catch (err) {
      console.error("Google login error", err, {
        status: err?.status,
        data: err?.data,
        message: err?.message,
        originalStatus: err?.originalStatus,
        error: err?.error,
        serverMessage: err?.data?.message || err?.data?.error || err?.message,
      });

      let errorMessage = "Google login failed. Please try again.";

      // Handle RTK Query errors - check nested data structure
      const errorData = err?.data || err;

      // Prioritize server error message
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error) {
        errorMessage =
          typeof errorData.error === "string"
            ? errorData.error
            : errorData.error?.message || "Server error occurred";
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.status === 401 || err?.originalStatus === 401) {
        errorMessage = "Authentication failed. Please try logging in again.";
      } else if (err?.status === 403 || err?.originalStatus === 403) {
        errorMessage = "Access denied. Please contact support.";
      } else if (err?.status === 500 || err?.originalStatus === 500) {
        // Show server error message if available, otherwise generic message
        errorMessage =
          errorData?.message ||
          errorData?.error ||
          "Server error. Please check server logs for details.";
        console.error("Server error details", { errorData });
      } else if (
        err?.status === "FETCH_ERROR" ||
        err?.status === "PARSING_ERROR" ||
        err?.message?.includes("Failed to fetch")
      ) {
        errorMessage =
          "Unable to connect to server. Please ensure the backend server is running and try again.";
      } else if (
        err?.error === "TypeError: Failed to fetch" ||
        err?.data?.error === "TypeError: Failed to fetch"
      ) {
        errorMessage =
          "Server connection failed. Please check if the backend server is running on port 4000.";
      }

      toast.error(errorMessage);
    } finally {
      // no-op
    }
  };

  return (
    <>
      <div className="flex md:flex-row flex-col h-screen bg-gray-50">
        {/* Orange Header */}
        <HeaderLogo />

        {/* Main Content - White Panel */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 md:p-8">
            {/* User Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <img
                  className="w-10 h-10"
                  src={images?.userIcon || "/user-icon.png"}
                  alt="userIcon"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/user-icon.png";
                  }}
                />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">
              Welcome Back
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
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
                  type="email"
                  placeholder="Enter your email"
                />
              </div>

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

              {/* Checkbox and Links */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                    checked={data.rememberMe}
                    onChange={(e) =>
                      setData({ ...data, rememberMe: e.target.checked })
                    }
                  />
                  <span className="text-sm text-gray-700">
                    Remember for 30 days
                  </span>
                </div>
                <Link
                  to={"/forgot-password"}
                  className="text-sm text-primary-500 hover:underline"
                >
                  Forgot Password
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full h-12 bg-primary-500 text-white font-semibold rounded hover:opacity-90 transition-colors mb-4"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
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

              {/* Google Sign In Button */}
              <div className="mb-4 w-full">
                <div className="googleBtn">
                  <GoogleLogin
                    onSuccess={handleGoogleLoginSuccess}
                    onError={(error) => {
                      // Handle configuration errors gracefully - don't show errors for unconfigured OAuth
                      if (!hasGoogleClientId) {
                        return;
                      }

                      // Handle actual errors when OAuth IS configured
                      if (
                        error?.message?.includes("origin is not allowed") ||
                        error?.message?.includes("GSI_LOGGER")
                      ) {
                        toast.error(
                          "Google Sign-In configuration error. Please use email/password login."
                        );
                        return;
                      }

                      // Log other errors for debugging (only if configured)
                      console.error("Google OAuth error", error);

                      let errorMsg = "Google login failed. ";

                      if (error?.type === "popup_closed_by_user") {
                        errorMsg = "Login cancelled.";
                      } else if (error?.type === "popup_failed_to_open") {
                        errorMsg =
                          "Popup blocked. Please allow popups for this site.";
                      } else if (
                        error?.type === "idpiframe_initialization_failed"
                      ) {
                        errorMsg =
                          "Google authentication service unavailable. Please use email/password login.";
                      } else {
                        errorMsg +=
                          "Please try again or use email/password login.";
                      }

                      toast.error(errorMsg);
                    }}
                    useOneTap={false}
                    theme="outline"
                    shape="rectangular"
                    size="large"
                    text="signin_with"
                    auto_select={false}
                  />
                </div>
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-gray-600 text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  to={"/sign-up"}
                  className="text-primary-500 hover:underline font-medium"
                >
                  Sign up now
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
