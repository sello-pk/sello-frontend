import React, { useEffect, useRef, lazy, Suspense } from "react";
import { Route, Routes, useLocation, Navigate, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AppLoader from "./components/common/AppLoader";

// Components
import Navbar from "./components/Navbar.jsx";
import BottomHeader from "./components/BottomHeader.jsx";
import Footer from "./components/Footer.jsx";
import WhatsAppChatWidget from "./components/support/WhatsAppChatWidget.jsx";

// Critical pages - keep as regular imports for faster initial load
import Home from "./pages/Home.jsx";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/SignUp.jsx";

// Lazy load auth pages
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword.jsx"));
const VerifyOtp = lazy(() => import("./pages/auth/VerifyOtp.jsx"));
const ResetSuccess = lazy(() => import("./pages/auth/ResetSuccess.jsx"));
const AcceptInvite = lazy(() => import("./pages/auth/AcceptInvite.jsx"));

// Lazy load public pages
const OurPrivacyPolicy = lazy(() => import("./pages/ourPages/OurPrivacyPolicy.jsx"));
const TermsCondition = lazy(() => import("./pages/ourPages/TermsCondition.jsx"));
const CarListings = lazy(() => import("./pages/listings/CarListings.jsx"));
const CarDetails = lazy(() => import("./pages/listings/CarDetails.jsx"));
const About = lazy(() => import("./pages/about/About.jsx"));
const Contact = lazy(() => import("./pages/contact/Contact.jsx"));
const AllBrands = lazy(() => import("./pages/AllBrands.jsx"));
const FilterPage = lazy(() => import("./pages/filter/FilterPage.jsx"));
const FilteredResults = lazy(() => import("./pages/listings/FilteredResults.jsx"));
const LoanPlansPage = lazy(() => import("./pages/loanPlans/LoanPlansPage.jsx"));
const Blog = lazy(() => import("./pages/blog/Blog.jsx"));
const AllBlog = lazy(() => import("./pages/blog/AllBlog.jsx"));
const BlogDetails = lazy(() => import("./pages/blog/BlogDetails.jsx"));
const CategoryPage = lazy(() => import("./pages/categories/CategoryPage.jsx"));

// Lazy load protected pages
const CreatePost = lazy(() => import("./pages/posts/CreatePost.jsx"));
const EditCar = lazy(() => import("./pages/posts/EditCar.jsx"));
const UserListingPage = lazy(() => import("./pages/userListings/UserListingPage.jsx"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage.jsx"));
const SavedCars = lazy(() => import("./pages/SavedCars.jsx"));
const MyChats = lazy(() => import("./pages/chats/MyChats.jsx"));
const SellerChats = lazy(() => import("./pages/seller/SellerChats.jsx"));
const DealerDashboard = lazy(() => import("./pages/dashboards/DealerDashboard.jsx"));
const SellerDashboard = lazy(() => import("./pages/dashboards/SellerDashboard.jsx"));

// Lazy load help pages
const HelpCenter = lazy(() => import("./pages/help/HelpCenter.jsx"));
const AccountLogin = lazy(() => import("./pages/help/AccountLogin.jsx"));
const BuyingSelling = lazy(() => import("./pages/help/BuyingSelling.jsx"));
const Payments = lazy(() => import("./pages/help/Payments.jsx"));
const Shipping = lazy(() => import("./pages/help/Shipping.jsx"));
const Safety = lazy(() => import("./pages/help/Safety.jsx"));
const BuyingCars = lazy(() => import("./pages/help/BuyingCars.jsx"));
const SellingCars = lazy(() => import("./pages/help/SellingCars.jsx"));
const PaymentMethods = lazy(() => import("./pages/help/PaymentMethods.jsx"));
const AccountSettings = lazy(() => import("./pages/help/AccountSettings.jsx"));
const FAQs = lazy(() => import("./pages/help/FAQs.jsx"));
const Policies = lazy(() => import("./pages/help/Policies.jsx"));
const Billing = lazy(() => import("./pages/help/Billing.jsx"));
const Managing = lazy(() => import("./pages/help/Managing.jsx"));
const Uploading = lazy(() => import("./pages/help/Uploading.jsx"));
const Enterprise = lazy(() => import("./pages/help/Enterprise.jsx"));
const Creators = lazy(() => import("./pages/help/Creators.jsx"));
const Features = lazy(() => import("./pages/help/Features.jsx"));
const Sales = lazy(() => import("./pages/help/Sales.jsx"));
const Sharing = lazy(() => import("./pages/help/Sharing.jsx"));
const Developers = lazy(() => import("./pages/help/Developers.jsx"));
const HelpSearch = lazy(() => import("./pages/help/HelpSearch.jsx"));

// Lazy load payment pages
const SubscriptionSuccess = lazy(() => import("./pages/payments/SubscriptionSuccess.jsx"));
const BoostSuccess = lazy(() => import("./pages/payments/BoostSuccess.jsx"));

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
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // Prevent browser's default scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Only scroll if pathname actually changed (not on initial mount/refresh)
    const pathnameChanged = prevPathnameRef.current !== pathname;
    prevPathnameRef.current = pathname;

    // Don't scroll to top for admin routes - AdminLayout handles its own scrolling
    if (pathname.startsWith("/admin")) {
      return;
    }
    
    // Only scroll on route change, not on refresh
    if (pathnameChanged) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "instant",
        });
      });
    } else {
      // On initial load/refresh, ensure we're at top
      if (window.scrollY > 0) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "instant",
        });
      }
    }
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
        <Route path="/forgot-password" element={<Suspense fallback={<AppLoader />}><ForgotPassword /></Suspense>} />
        <Route path="/reset-password" element={<Suspense fallback={<AppLoader />}><ResetPassword /></Suspense>} />
        <Route path="/verify-otp" element={<Suspense fallback={<AppLoader />}><VerifyOtp /></Suspense>} />
        <Route path="/reset-success" element={<Suspense fallback={<AppLoader />}><ResetSuccess /></Suspense>} />
        <Route path="/accept-invite/:token" element={<Suspense fallback={<AppLoader />}><AcceptInvite /></Suspense>} />

        {/* Public pages */}
        <Route path="/privacy-policy" element={<Suspense fallback={<AppLoader />}><OurPrivacyPolicy /></Suspense>} />
        <Route path="/terms-conditon" element={<Suspense fallback={<AppLoader />}><TermsCondition /></Suspense>} />
        <Route path="/cars" element={<Suspense fallback={<AppLoader />}><CarListings /></Suspense>} />
        {/* Car Details - Only match if path starts with /cars/ and has an ID */}
        {/* Use a function to validate before rendering */}
        <Route 
          path="/cars/:id" 
          element={
            <CarDetailsRouteGuard>
              <Suspense fallback={<AppLoader />}>
                <CarDetails />
              </Suspense>
            </CarDetailsRouteGuard>
          } 
        />
        <Route path="/category/:slug" element={<Suspense fallback={<AppLoader />}><CategoryPage /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<AppLoader />}><About /></Suspense>} />
        <Route path="/contact" element={<Suspense fallback={<AppLoader />}><Contact /></Suspense>} />
        <Route path="/view-all-brands" element={<Suspense fallback={<AppLoader />}><AllBrands /></Suspense>} />
        <Route path="/filter" element={<Suspense fallback={<AppLoader />}><FilterPage /></Suspense>} />
        <Route path="/search-results" element={<Suspense fallback={<AppLoader />}><FilteredResults /></Suspense>} />
        <Route path="/loan-plans" element={<Suspense fallback={<AppLoader />}><LoanPlansPage /></Suspense>} />
        <Route path="/blog" element={<Suspense fallback={<AppLoader />}><Blog /></Suspense>} />
        <Route path="/blog/all" element={<Suspense fallback={<AppLoader />}><AllBlog /></Suspense>} />
        <Route path="/blog/:id" element={<Suspense fallback={<AppLoader />}><BlogDetails /></Suspense>} />
        <Route path="/help-center" element={<Suspense fallback={<AppLoader />}><HelpCenter /></Suspense>} />
        <Route path="/help/search" element={<Suspense fallback={<AppLoader />}><HelpSearch /></Suspense>} />
        <Route path="/help/account-login" element={<Suspense fallback={<AppLoader />}><AccountLogin /></Suspense>} />
        <Route path="/help/buying-selling" element={<Suspense fallback={<AppLoader />}><BuyingSelling /></Suspense>} />
        <Route path="/help/payments" element={<Suspense fallback={<AppLoader />}><Payments /></Suspense>} />
        <Route path="/help/shipping" element={<Suspense fallback={<AppLoader />}><Shipping /></Suspense>} />
        <Route path="/help/safety" element={<Suspense fallback={<AppLoader />}><Safety /></Suspense>} />
        <Route path="/help/buying-cars" element={<Suspense fallback={<AppLoader />}><BuyingCars /></Suspense>} />
        <Route path="/help/selling-cars" element={<Suspense fallback={<AppLoader />}><SellingCars /></Suspense>} />
        <Route path="/help/payment-methods" element={<Suspense fallback={<AppLoader />}><PaymentMethods /></Suspense>} />
        <Route path="/help/account-settings" element={<Suspense fallback={<AppLoader />}><AccountSettings /></Suspense>} />
        <Route path="/help/faqs" element={<Suspense fallback={<AppLoader />}><FAQs /></Suspense>} />
        <Route path="/help/policies" element={<Suspense fallback={<AppLoader />}><Policies /></Suspense>} />
        <Route path="/help/billing" element={<Suspense fallback={<AppLoader />}><Billing /></Suspense>} />
        <Route path="/help/managing" element={<Suspense fallback={<AppLoader />}><Managing /></Suspense>} />
        <Route path="/help/uploading" element={<Suspense fallback={<AppLoader />}><Uploading /></Suspense>} />
        <Route path="/help/enterprise" element={<Suspense fallback={<AppLoader />}><Enterprise /></Suspense>} />
        <Route path="/help/creators" element={<Suspense fallback={<AppLoader />}><Creators /></Suspense>} />
        <Route path="/help/features" element={<Suspense fallback={<AppLoader />}><Features /></Suspense>} />
        <Route path="/help/sales" element={<Suspense fallback={<AppLoader />}><Sales /></Suspense>} />
        <Route path="/help/sharing" element={<Suspense fallback={<AppLoader />}><Sharing /></Suspense>} />
        <Route path="/help/developers" element={<Suspense fallback={<AppLoader />}><Developers /></Suspense>} />

        {/* Payment Success Pages */}
        <Route path="/subscription/success" element={<Suspense fallback={<AppLoader />}><SubscriptionSuccess /></Suspense>} />
        <Route path="/boost/success" element={<Suspense fallback={<AppLoader />}><BoostSuccess /></Suspense>} />

        {/* Protected User Routes */}
        <Route
          path="/create-post"
          element={
            <ProtectedRoute>
              <Suspense fallback={<AppLoader />}>
                <CreatePost />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-car/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<AppLoader />}>
                <EditCar />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-listings"
          element={
            <ProtectedRoute>
              <Suspense fallback={<AppLoader />}>
                <UserListingPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Suspense fallback={<AppLoader />}>
                <ProfilePage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved-cars"
          element={
            <ProtectedRoute>
              <Suspense fallback={<AppLoader />}>
                <SavedCars />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-chats"
          element={
            <ProtectedRoute>
              <Suspense fallback={<AppLoader />}>
                <MyChats />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/chats"
          element={
            <ProtectedRoute>
              <Suspense fallback={<AppLoader />}>
                <SellerChats />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Dashboard Routes */}
        <Route
          path="/dealer/dashboard"
          element={
            <ProtectedRoute>
              <Suspense fallback={<AppLoader />}>
                <DealerDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/dashboard"
          element={
            <ProtectedRoute>
              <Suspense fallback={<AppLoader />}>
                <SellerDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<Suspense fallback={<AppLoader />}><AdminDashboard /></Suspense>} />
          <Route path="/admin/users" element={<Suspense fallback={<AppLoader />}><AdminUsers /></Suspense>} />
          <Route path="/admin/users/:userId" element={<Suspense fallback={<AppLoader />}><AdminUsers /></Suspense>} />
          <Route path="/admin/listings" element={<Suspense fallback={<AppLoader />}><AdminListings /></Suspense>} />
          <Route path="/admin/dealers" element={<Suspense fallback={<AppLoader />}><AdminDealers /></Suspense>} />
          <Route path="/admin/categories" element={<Suspense fallback={<AppLoader />}><AdminCategories /></Suspense>} />
          {/* Blog Management Routes */}
          <Route path="/admin/blogs" element={<Suspense fallback={<AppLoader />}><BlogsOverview /></Suspense>} />
          <Route path="/admin/blog-categories" element={<Suspense fallback={<AppLoader />}><BlogCategories /></Suspense>} />
          <Route path="/admin/blogs/create" element={<Suspense fallback={<AppLoader />}><BlogCreateEnhanced /></Suspense>} />
          <Route path="/admin/blogs/:id/edit" element={<Suspense fallback={<AppLoader />}><BlogEdit /></Suspense>} />
          <Route path="/admin/blog-comments" element={<Suspense fallback={<AppLoader />}><BlogComments /></Suspense>} />
          <Route path="/admin/blog-media" element={<Suspense fallback={<AppLoader />}><BlogMediaLibrary /></Suspense>} />
          <Route path="/admin/analytics" element={<Suspense fallback={<AppLoader />}><AdminReports /></Suspense>} />
          <Route path="/admin/activity-log" element={<Suspense fallback={<AppLoader />}><ActivityLog /></Suspense>} />
          <Route path="/admin/chat" element={<Suspense fallback={<AppLoader />}><AdminChatMonitoring /></Suspense>} />
          <Route path="/admin/chatbot" element={<Suspense fallback={<AppLoader />}><AdminChatbot /></Suspense>} />
          <Route path="/admin/promotions" element={<Suspense fallback={<AppLoader />}><AdminPromotions /></Suspense>} />
          <Route path="/admin/payments" element={<Suspense fallback={<AppLoader />}><AdminPayments /></Suspense>} />
          <Route path="/admin/notifications" element={<Suspense fallback={<AppLoader />}><AdminNotifications /></Suspense>} />
          <Route path="/admin/support-chat" element={<Suspense fallback={<AppLoader />}><SupportChat /></Suspense>} />
          <Route path="/admin/support-chatbot" element={<Suspense fallback={<AppLoader />}><SupportChatbot /></Suspense>} />
          <Route path="/admin/customer-requests" element={<Suspense fallback={<AppLoader />}><CustomerRequests /></Suspense>} />
          <Route path="/admin/customers" element={<Navigate to="/admin/customer-requests" replace />} />
          <Route path="/admin/banners" element={<Suspense fallback={<AppLoader />}><Banners /></Suspense>} />
          <Route path="/admin/testimonials" element={<Suspense fallback={<AppLoader />}><Testimonials /></Suspense>} />
          <Route path="/admin/settings" element={<Suspense fallback={<AppLoader />}><Settings /></Suspense>} />
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