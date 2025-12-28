import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiLayout,
  FiUsers,
  FiList,
  FiBriefcase,
  FiBarChart2,
  FiMessageSquare,
  FiCpu,
  FiUser,
  FiHeart,
  FiBell,
  FiLogOut,
  FiMenu,
  FiX,
  FiFileText,
  FiSettings,
  FiGrid,
  FiDollarSign,
  FiStar,
  FiMail,
  FiActivity,
} from "react-icons/fi";
import { images } from "../../assets/assets";
import { useGetMeQuery, useLogoutMutation } from "../../redux/services/api";
import { canAccessMenu } from "../../utils/roleAccess";
import ErrorBoundary from "../common/ErrorBoundary";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { useTheme } from "../../contexts/ThemeContext";
import { FiSun, FiMoon, FiTrash2 } from "react-icons/fi";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useGetMeQuery();
  const [logout] = useLogoutMutation();
  const sidebarNavRef = useRef(null);
  const mainContentRef = useRef(null);
  const prevPathRef = useRef(location.pathname);

  // Preserve sidebar scroll position on mount
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem("sidebarScrollPosition");
    if (savedScrollPosition && sidebarNavRef.current) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (sidebarNavRef.current) {
          sidebarNavRef.current.scrollTop = parseInt(savedScrollPosition, 10);
        }
      }, 0);
    }
  }, []); // Only run on mount

  // Save sidebar scroll position and scroll main content to top on navigation
  const handleSidebarLinkClick = () => {
    if (sidebarNavRef.current) {
      sessionStorage.setItem(
        "sidebarScrollPosition",
        sidebarNavRef.current.scrollTop.toString()
      );
    }
  };

  // Track route changes and handle transitions
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      setIsRouteChanging(true);
      if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
      }
      // Short delay to show transition
      const timer = setTimeout(() => {
        setIsRouteChanging(false);
        prevPathRef.current = location.pathname;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const allMenuItems = [
    { path: "/admin/dashboard", icon: FiLayout, label: "Dashboard" },
    { path: "/admin/users", icon: FiUsers, label: "User Management" },
    { path: "/admin/listings", icon: FiList, label: "Listings" },
    { path: "/admin/dealers", icon: FiBriefcase, label: "Dealer Management" },
    { path: "/admin/categories", icon: FiGrid, label: "Categories" },
    { path: "/admin/blogs", icon: FiFileText, label: "Blog Management" },
    {
      path: "/admin/testimonials",
      icon: FiStar,
      label: "Reviews & Testimonials",
    },
    {
      path: "/admin/analytics",
      icon: FiBarChart2,
      label: "Reports & Analytics",
    },
    { path: "/admin/activity-log", icon: FiActivity, label: "Activity Log" },
    { path: "/admin/chat", icon: FiMessageSquare, label: "Chat Monitoring" },
    { path: "/admin/chatbot", icon: FiCpu, label: "Support Chatbot" },
    {
      path: "/admin/customer-requests",
      icon: FiUser,
      label: "Customer Requests",
    },
    {
      path: "/admin/account-deletion-requests",
      icon: FiTrash2,
      label: "Account Deletion",
    },
    { path: "/admin/promotions", icon: FiHeart, label: "Promotions" },
    { path: "/admin/payments", icon: FiDollarSign, label: "Payments" },
    { path: "/admin/notifications", icon: FiBell, label: "Notifications" },
    { path: "/admin/settings", icon: FiSettings, label: "Settings" },
  ];

  // Filter menu items based on user's role
  // Super Admin sees all, team members see only their allowed tabs
  // If user data is loading or there's an error, show all menu items as fallback
  const menuItems =
    userLoading || userError
      ? allMenuItems
      : allMenuItems.filter((item) => canAccessMenu(user, item.path));

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      // clearTokens is called by transformResponse, but ensure cleanup
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Logout error:", error);
      }
      // Clear tokens even if logout request fails
      const { clearTokens } = await import("../../utils/tokenRefresh");
      clearTokens();
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 relative">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Dark Grey */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        } fixed lg:static h-full bg-[#050B20] dark:bg-gray-900 text-white transition-all duration-300 flex flex-col z-50`}
      >
        {/* Logo - Primary Orange Header */}
        <div className="bg-primary-500 px-4 py-2 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center justify-center gap-1 h-full w-full">
              <img
                src={images.logo}
                alt="logo"
                className="w-24 h-24 scale-150 object-contain"
              />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:opacity-90 rounded-lg text-white"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav
          ref={sidebarNavRef}
          className="flex-1 overflow-y-auto py-4 scrollbar"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Check if current path matches or starts with the item path (for sections with sub-routes)
            const isMainItemActive =
              location.pathname === item.path ||
              (item.path === "/admin/blogs" &&
                location.pathname.startsWith("/admin/blog")) ||
              (item.path === "/admin/categories" &&
                location.pathname.startsWith("/admin/categor"));

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleSidebarLinkClick}
                className={`flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isMainItemActive
                    ? "bg-primary-500 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle & Logout */}
        <div className="p-4 border-t border-gray-700 dark:border-gray-700 space-y-2">
          <button
            onClick={toggleTheme}
            className="flex items-center space-x-3 bg-gray-700 dark:bg-gray-800 px-4 py-3 w-full rounded-lg text-white font-semibold hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
            {sidebarOpen && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 bg-primary-500 px-4 py-3 w-full rounded-lg text-white font-semibold hover:opacity-90 transition-colors"
            aria-label="Logout"
          >
            <FiLogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-primary-500 dark:bg-primary-600 text-white py-3 px-4 flex items-center justify-between shadow-md z-30">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:opacity-90 dark:hover:opacity-90 rounded-lg"
            aria-label="Toggle menu"
          >
            <FiMenu size={24} />
          </button>
          <h1 className="text-lg font-bold">Admin Panel</h1>
          <button
            onClick={toggleTheme}
            className="p-2 hover:opacity-90 dark:hover:opacity-90 rounded-lg"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
        </header>

        {/* Page Content */}
        <main
          ref={mainContentRef}
          className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 lg:p-6"
        >
          <ErrorBoundary>
            {isRouteChanging ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
              </div>
            ) : (
              children
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Keyboard Shortcuts Handler */}
      <KeyboardShortcuts />
    </div>
  );
};

export default AdminLayout;
