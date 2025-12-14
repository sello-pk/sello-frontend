import React, { useEffect, lazy, Suspense } from "react";
import { Route, Routes, useLocation, Navigate, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Spinner from "./components/Spinner";

// Components
import Navbar from "./components/Navbar.jsx";
import BottomHeader from "./components/BottomHeader.jsx";
import Footer from "./components/Footer.jsx";
import WhatsAppChatWidget from "./components/support/WhatsAppChatWidget.jsx";

// Pages
import Home from "./pages/Home.jsx";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/SignUp.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import VerifyOtp from "./pages/auth/VerifyOtp.jsx";
import ResetSuccess from "./pages/auth/ResetSuccess.jsx";
import AcceptInvite from "./pages/auth/AcceptInvite.jsx";
import OurPrivacyPolicy from "./pages/ourPages/OurPrivacyPolicy.jsx";
import TermsCondition from "./pages/ourPages/TermsCondition.jsx";
import CarListings from "./pages/listings/CarListings.jsx";
import CarDetails from "./pages/listings/CarDetails.jsx";
import About from "./pages/about/About.jsx";
import Contact from "./pages/contact/Contact.jsx";
import CreatePost from "./pages/posts/CreatePost.jsx";
import EditCar from "./pages/posts/EditCar.jsx";
import AllBrands from "./pages/AllBrands.jsx";
import FilterPage from "./pages/filter/FilterPage.jsx";
import FilteredResults from "./pages/listings/FilteredResults.jsx";
import UserListingPage from "./pages/userListings/UserListingPage.jsx";
import LoanPlansPage from "./pages/loanPlans/LoanPlansPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";
import SavedCars from "./pages/SavedCars.jsx";
import Blog from "./pages/blog/Blog.jsx";
import AllBlog from "./pages/blog/AllBlog.jsx";
import BlogDetails from "./pages/blog/BlogDetails.jsx";
import CategoryPage from "./pages/categories/CategoryPage.jsx";
import MyChats from "./pages/chats/MyChats.jsx";
import SellerChats from "./pages/seller/SellerChats.jsx";
import DealerDashboard from "./pages/dashboards/DealerDashboard.jsx";
import SellerDashboard from "./pages/dashboards/SellerDashboard.jsx";
import HelpCenter from "./pages/help/HelpCenter.jsx";
import AccountLogin from "./pages/help/AccountLogin.jsx";
import BuyingSelling from "./pages/help/BuyingSelling.jsx";
import Payments from "./pages/help/Payments.jsx";
import Shipping from "./pages/help/Shipping.jsx";
import Safety from "./pages/help/Safety.jsx";
import BuyingCars from "./pages/help/BuyingCars.jsx";
import SellingCars from "./pages/help/SellingCars.jsx";
import PaymentMethods from "./pages/help/PaymentMethods.jsx";
import AccountSettings from "./pages/help/AccountSettings.jsx";
import FAQs from "./pages/help/FAQs.jsx";
import Policies from "./pages/help/Policies.jsx";
import Billing from "./pages/help/Billing.jsx";
import Managing from "./pages/help/Managing.jsx";
import Uploading from "./pages/help/Uploading.jsx";
import Enterprise from "./pages/help/Enterprise.jsx";
import Creators from "./pages/help/Creators.jsx";
import Features from "./pages/help/Features.jsx";
import Sales from "./pages/help/Sales.jsx";
import Sharing from "./pages/help/Sharing.jsx";
import Developers from "./pages/help/Developers.jsx";
import HelpSearch from "./pages/help/HelpSearch.jsx";
import SubscriptionSuccess from "./pages/payments/SubscriptionSuccess.jsx";
import BoostSuccess from "./pages/payments/BoostSuccess.jsx";

// Admin Pages
// Lazy load admin pages for code splitting
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard.jsx"));
const AdminUsers = lazy(() => import("./pages/admin/Users.jsx"));
const AdminListings = lazy(() => import("./pages/admin/Listings.jsx"));
const AdminDealers = lazy(() => import("./pages/admin/Dealers.jsx"));
const AdminCategories = lazy(() => import("./pages/admin/Categories.jsx"));
const BlogEdit = lazy(() => import("./pages/admin/BlogEdit.jsx"));
const AdminReports = lazy(() => import("./pages/admin/Reports.jsx"));
const AdminChatMonitoring = lazy(() => import("./pages/admin/ChatMonitoring.jsx"));
const AdminChatbot = lazy(() => import("./pages/admin/Chatbot.jsx"));
const AdminPromotions = lazy(() => import("./pages/admin/Promotions.jsx"));
const AdminPayments = lazy(() => import("./pages/admin/Payments.jsx"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications.jsx"));
const SupportChat = lazy(() => import("./pages/admin/SupportChat.jsx"));
const SupportChatbot = lazy(() => import("./pages/admin/SupportChatbot.jsx"));
const CustomerRequests = lazy(() => import("./pages/admin/CustomerRequests.jsx"));
const Banners = lazy(() => import("./pages/admin/Banners.jsx"));
const Testimonials = lazy(() => import("./pages/admin/Testimonials.jsx"));
const Settings = lazy(() => import("./pages/admin/Settings.jsx"));
const ActivityLog = lazy(() => import("./pages/admin/ActivityLog.jsx"));

// New Blog Management Pages - Lazy loaded
const BlogsOverview = lazy(() => import("./pages/admin/BlogsOverview.jsx"));
const BlogCategories = lazy(() => import("./pages/admin/BlogCategories.jsx"));
const BlogCreateEnhanced = lazy(() => import("./pages/admin/BlogCreateEnhanced.jsx"));
const BlogComments = lazy(() => import("./pages/admin/BlogComments.jsx"));
const BlogMediaLibrary = lazy(() => import("./pages/admin/BlogMediaLibrary.jsx"));

// Protected Routes
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import AdminRoute from "./components/common/AdminRoute.jsx";
import { ErrorPage } from "./components/common/ErrorBoundary.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";

// ScrollToTop component to scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Don't scroll to top for admin routes - AdminLayout handles its own scrolling
    if (pathname.startsWith("/admin")) {
      return;
    }
    
    // Scroll to top immediately on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // Use instant for immediate scroll, can change to "smooth" if preferred
    });
  }, [pathname]);

  return null;
};

// Route guard to ensure CarDetails only renders on valid car routes
const CarDetailsRouteGuard = ({ children }) => {
  const location = useLocation();
  const { id } = useParams();
  
  // CRITICAL: Get current URL from window to verify actual route
  const actualPath = window.location.pathname;
  
  // ABSOLUTE CHECK - If we're on home route, don't render at all
  // Check both location.pathname AND window.location.pathname for safety
  if (location.pathname === '/' || location.pathname === '/home' || 
      actualPath === '/' || actualPath === '/home') {
    return null;
  }
  
  // Strict validation - only allow rendering on valid car detail routes
  // Must check actualPath, not just location.pathname
  const pathToCheck = actualPath || location.pathname;
  const pathParts = pathToCheck.split('/').filter(Boolean);
  
  const isValidRoute = 
    pathToCheck.startsWith('/cars/') &&
    pathToCheck !== '/cars' &&
    pathParts.length === 2 &&
    pathParts[0] === 'cars' &&
    pathParts[1] &&
    pathParts[1].trim() !== '' &&
    id &&
    typeof id === 'string' &&
    id.trim() !== '' &&
    id === pathParts[1];
  
  // If not valid, don't render
  if (!isValidRoute) {
    return null;
  }
  return <>{children}</>;
};


const App = () => {
  const location = useLocation();

  const hideNavbarFooter = [
    "/login",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/verify-otp",
    "/reset-success",
    "/accept-invite",
  ];

  return (
    <ThemeProvider>
      <ScrollToTop />
      <Toaster />

      {/* Show Navbar + BottomHeader except for auth pages + admin */}
      {!hideNavbarFooter.includes(location.pathname) &&
        !location.pathname.startsWith("/admin") && (
          <>
            <Navbar />
            <BottomHeader />
          </>
        )}

      <Routes>
        {/* HOME - Exact path match, declared first */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-success" element={<ResetSuccess />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />

        {/* Public pages */}
        <Route path="/privacy-policy" element={<OurPrivacyPolicy />} />
        <Route path="/terms-conditon" element={<TermsCondition />} />
        <Route path="/cars" element={<CarListings />} />
        {/* Car Details - Only match if path starts with /cars/ and has an ID */}
        {/* Use a function to validate before rendering */}
        <Route 
          path="/cars/:id" 
          element={
            <CarDetailsRouteGuard>
              <CarDetails />
            </CarDetailsRouteGuard>
          } 
        />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/view-all-brands" element={<AllBrands />} />
        <Route path="/filter" element={<FilterPage />} />
        <Route path="/search-results" element={<FilteredResults />} />
        <Route path="/loan-plans" element={<LoanPlansPage />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/all" element={<AllBlog />} />
        <Route path="/blog/:id" element={<BlogDetails />} />
        <Route path="/help-center" element={<HelpCenter />} />
        <Route path="/help/search" element={<HelpSearch />} />
        <Route path="/help/account-login" element={<AccountLogin />} />
        <Route path="/help/buying-selling" element={<BuyingSelling />} />
        <Route path="/help/payments" element={<Payments />} />
        <Route path="/help/shipping" element={<Shipping />} />
        <Route path="/help/safety" element={<Safety />} />
        <Route path="/help/buying-cars" element={<BuyingCars />} />
        <Route path="/help/selling-cars" element={<SellingCars />} />
        <Route path="/help/payment-methods" element={<PaymentMethods />} />
        <Route path="/help/account-settings" element={<AccountSettings />} />
        <Route path="/help/faqs" element={<FAQs />} />
        <Route path="/help/policies" element={<Policies />} />
        <Route path="/help/billing" element={<Billing />} />
        <Route path="/help/managing" element={<Managing />} />
        <Route path="/help/uploading" element={<Uploading />} />
        <Route path="/help/enterprise" element={<Enterprise />} />
        <Route path="/help/creators" element={<Creators />} />
        <Route path="/help/features" element={<Features />} />
        <Route path="/help/sales" element={<Sales />} />
        <Route path="/help/sharing" element={<Sharing />} />
        <Route path="/help/developers" element={<Developers />} />

        {/* Payment Success Pages */}
        <Route path="/subscription/success" element={<SubscriptionSuccess />} />
        <Route path="/boost/success" element={<BoostSuccess />} />

        {/* Protected User Routes */}
        <Route
          path="/create-post"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-car/:id"
          element={
            <ProtectedRoute>
              <EditCar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-listings"
          element={
            <ProtectedRoute>
              <UserListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved-cars"
          element={
            <ProtectedRoute>
              <SavedCars />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-chats"
          element={
            <ProtectedRoute>
              <MyChats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/chats"
          element={
            <ProtectedRoute>
              <SellerChats />
            </ProtectedRoute>
          }
        />

        {/* Dashboard Routes */}
        <Route
          path="/dealer/dashboard"
          element={
            <ProtectedRoute>
              <DealerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/dashboard"
          element={
            <ProtectedRoute>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<Suspense fallback={<Spinner fullScreen={true} />}><AdminDashboard /></Suspense>} />
          <Route path="/admin/users" element={<Suspense fallback={<Spinner fullScreen={true} />}><AdminUsers /></Suspense>} />
          <Route path="/admin/users/:userId" element={<Suspense fallback={<Spinner fullScreen={true} />}><AdminUsers /></Suspense>} />
          <Route path="/admin/listings" element={<Suspense fallback={<Spinner fullScreen={true} />}><AdminListings /></Suspense>} />
          <Route path="/admin/dealers" element={<Suspense fallback={<Spinner fullScreen={true} />}><AdminDealers /></Suspense>} />
          <Route path="/admin/categories" element={<Suspense fallback={<Spinner fullScreen={true} />}><AdminCategories /></Suspense>} />
          {/* Blog Management Routes */}
          <Route path="/admin/blogs" element={<Suspense fallback={<Spinner fullScreen={true} />}><BlogsOverview /></Suspense>} />
          <Route path="/admin/blog-categories" element={<Suspense fallback={<Spinner fullScreen={true} />}><BlogCategories /></Suspense>} />
          <Route path="/admin/blogs/create" element={<Suspense fallback={<Spinner fullScreen={true} />}><BlogCreateEnhanced /></Suspense>} />
          <Route path="/admin/blogs/:id/edit" element={<Suspense fallback={<Spinner fullScreen={true} />}><BlogEdit /></Suspense>} />
          <Route path="/admin/blog-comments" element={<Suspense fallback={<Spinner fullScreen={true} />}><BlogComments /></Suspense>} />
          <Route path="/admin/blog-media" element={<Suspense fallback={<Spinner fullScreen={true} />}><BlogMediaLibrary /></Suspense>} />
          <Route path="/admin/analytics" element={<Suspense fallback={<Spinner fullScreen={true} />}><AdminReports /></Suspense>} />
          <Route path="/admin/activity-log" element={<Suspense fallback={<Spinner fullScreen={true} />}><ActivityLog /></Suspense>} />
          <Route path="/admin/chat" element={<Suspense fallback={<Spinner fullScreen={true} />}><AdminChatMonitoring /></Suspense>} />
          <Route path="/admin/chatbot" element={<Suspense fallback={<Spinner fullScreen={true} />}><AdminChatbot /></Suspense>} />
          <Route path="/admin/promotions" element={<Suspense fallback={<Spinner fullScreen={true} />}><AdminPromotions /></Suspense>} />
          <Route path="/admin/payments" element={<Suspense fallback={<Spinner fullScreen={true} />}><AdminPayments /></Suspense>} />
          <Route path="/admin/notifications" element={<Suspense fallback={<Spinner fullScreen={true} />}><AdminNotifications /></Suspense>} />
          <Route path="/admin/support-chat" element={<Suspense fallback={<Spinner fullScreen={true} />}><SupportChat /></Suspense>} />
          <Route path="/admin/support-chatbot" element={<Suspense fallback={<Spinner fullScreen={true} />}><SupportChatbot /></Suspense>} />
          <Route path="/admin/customer-requests" element={<Suspense fallback={<Spinner fullScreen={true} />}><CustomerRequests /></Suspense>} />
          <Route path="/admin/customers" element={<Navigate to="/admin/customer-requests" replace />} />
          <Route path="/admin/banners" element={<Suspense fallback={<Spinner fullScreen={true} />}><Banners /></Suspense>} />
          <Route path="/admin/testimonials" element={<Suspense fallback={<Spinner fullScreen={true} />}><Testimonials /></Suspense>} />
          <Route path="/admin/settings" element={<Suspense fallback={<Spinner fullScreen={true} />}><Settings /></Suspense>} />
        </Route>
      </Routes>

      {/* Show Footer except for auth pages & admin */}
      {!hideNavbarFooter.includes(location.pathname) &&
        !location.pathname.startsWith("/admin") && <Footer />}

      {/* Support Chat Widget - Show on all pages except auth and admin */}
      {!hideNavbarFooter.includes(location.pathname) &&
        !location.pathname.startsWith("/admin") && <WhatsAppChatWidget />}
    </ThemeProvider>
  );
};

export default App;