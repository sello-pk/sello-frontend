import React, { useState, useRef, useEffect } from "react";
import { images, menuLinks } from "../assets/assets";
import { Link, useNavigate, useLocation } from "react-router-dom";
import SearchBar from "./utils/SearchBar";
import { FaCirclePlus, FaBars, FaXmark } from "react-icons/fa6";
import gsap from "gsap";
import { useGetMeQuery } from "../redux/services/api";
import NotificationBell from "./common/NotificationBell";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef(null);
  const linkRefs = useRef([]);

  // Track token in state so skip option re-evaluates when token changes
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // Get user from localStorage as fallback
  const getCachedUser = () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (e) {
      // Error parsing cached user - silent fail
    }
    return null;
  };

  // Only fetch if token exists
  const {
    data: currentUser,
    isLoading,
    refetch,
  } = useGetMeQuery(undefined, {
    skip: !token,
  });

  // Use cached user as fallback while loading or if query is skipped
  const cachedUser = getCachedUser();
  const user = currentUser || cachedUser;

  // Update token state when localStorage changes (after login)
  useEffect(() => {
    const checkToken = () => {
      const currentToken = localStorage.getItem("token");
      if (currentToken !== token) {
        setToken(currentToken);
      }
    };

    // Check immediately
    checkToken();

    // Listen for storage events (from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        setToken(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check periodically for same-tab changes (localStorage.setItem doesn't trigger storage event)
    const interval = setInterval(checkToken, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [token]);

  const isActive = (path) => location.pathname === path;

  const openDrawer = () => {
    setOpen(true);
    setTimeout(() => {
      gsap.fromTo(
        drawerRef.current,
        { xPercent: 100 },
        { xPercent: 0, duration: 0.8, ease: "bounce.out" }
      );
      gsap.fromTo(
        linkRefs.current,
        { x: 100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          ease: "back.out(1.7)",
          stagger: 0.1,
          delay: 0.2,
        }
      );
    }, 10);
  };

  const closeDrawer = () => {
    gsap.to(linkRefs.current, {
      x: 100,
      opacity: 0,
      duration: 0.4,
      ease: "back.in(1.3)",
      stagger: { each: 0.1, from: "end" },
    });
    gsap.to(drawerRef.current, {
      xPercent: 100,
      duration: 0.8,
      ease: "bounce.in",
      delay: 0.4,
      onComplete: () => setOpen(false),
    });
  };

  const avatarFallback = () => {
    if (!user) return images.avatarIcon;
    if (user.avatar) return user.avatar;
    const name = user.name || user.email || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name.charAt(0)
    )}`;
  };

  return (
    <>
      <nav
        className={`w-full px-3 sm:px-4 md:px-6 lg:px-8 py-2 flex items-center justify-between sticky top-0 z-50 ${
          location.pathname === "/cars" ||
          location.pathname === "/users" ||
          location.pathname === "/blog"
            ? "md:bg-[#f5f5f5] md:text-gray-600"
            : "bg-primary-500 text-white"
        }`}
      >
        {/* Logo */}
        <Link
          to="/"
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="cursor-pointer flex-shrink-0"
        >
          <img
            className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto"
            src={
              location.pathname === "/cars" ||
              location.pathname === "/users" ||
              location.pathname === "/blog"
                ? images.blackLogo
                : images.logo
            }
            alt="logo"
          />
        </Link>

        {/* Desktop Search Bar */}
        <div className="hidden lg:block w-full max-w-xs flex-shrink-0">
          <SearchBar />
        </div>

        {/* Desktop Links */}
        <div
          className={`hidden lg:flex items-center gap-4 xl:gap-6 text-sm lg:text-base ${
            location.pathname === "/cars" ||
            location.pathname === "/users" ||
            location.pathname === "/blog"
              ? "text-gray-600"
              : "text-white"
          }`}
        >
          {menuLinks.map((link, index) => (
            <Link
              key={index}
              to={link.path}
              className={`hover:opacity-80 transition-opacity ${
                isActive(link.path) ? "font-bold" : ""
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* User Avatar / Login + Actions */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 text-white flex-shrink-0">
          {/* Create Post Button (Desktop) */}
          <button
            onClick={() => navigate("/create-post")}
            className={`hidden sm:flex gap-1 sm:gap-2 items-center text-xs sm:text-sm lg:text-base hover:opacity-80 transition-opacity ${
              location.pathname === "/cars" ||
              location.pathname === "/users" ||
              location.pathname === "/blog"
                ? "text-gray-600"
                : "text-white"
            }`}
            title="Create Post"
          >
            <FaCirclePlus className="text-sm sm:text-base" />
            <span className="hidden md:inline">Sale Your Car</span>
          </button>

          {!isLoading && currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              {/* Dashboard Links */}
              {currentUser.role === "admin" && (
                <Link
                  to="/admin/dashboard"
                  className="hidden md:block text-xs px-2 py-1 bg-primary-500 rounded hover:opacity-90 text-white transition-colors"
                >
                  Admin
                </Link>
              )}
              {user?.role === "dealer" && user?.dealerInfo?.verified && (
                <Link
                  to="/dealer/dashboard"
                  className="hidden md:block text-xs px-2 py-1 bg-primary-500 rounded hover:opacity-90 text-white transition-colors"
                >
                  Dealer
                </Link>
              )}
              {user?.role === "dealer" && !user?.dealerInfo?.verified && (
                <Link
                  to="/seller/dashboard"
                  className="hidden md:block text-xs px-2 py-1 bg-primary-500 rounded hover:opacity-90 text-white transition-colors"
                >
                  Dashboard
                </Link>
              )}

              {/* Notification Bell */}
              <NotificationBell />

              {/* Avatar */}
              <div
                onClick={() => navigate("/profile")}
                className="cursor-pointer w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white flex-shrink-0"
                title="Profile"
              >
                <img
                  src={avatarFallback()}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-primary-500 rounded text-xs sm:text-sm lg:text-base text-white hover:opacity-90 transition-colors"
            >
              Login
            </button>
          )}

          {/* Mobile Menu */}
          <button
            onClick={openDrawer}
            title="Menu"
            className={`lg:hidden ${
              location.pathname === "/cars" ||
              location.pathname === "/users" ||
              location.pathname === "/blog"
                ? "text-gray-600"
                : "text-white"
            }`}
          >
            <FaBars size={20} className="sm:hidden" />
            <FaBars size={24} className="hidden sm:block" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {open && (
        <div
          ref={drawerRef}
          className="fixed top-0 right-0 w-[85%] sm:w-[75%] md:w-[60%] h-full z-50 text-primary-500 px-4 sm:px-6 py-4 sm:py-6 bg-primary-300 shadow-xl lg:hidden"
        >
          {/* Close Button */}
          <div className="flex justify-end text-2xl sm:text-3xl mb-4 sm:mb-6">
            <button onClick={closeDrawer}>
              <FaXmark />
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-4 sm:mb-6">
            <SearchBar />
          </div>

          {/* Drawer Menu Links */}
          <div className="flex flex-col gap-3 sm:gap-4 text-base sm:text-lg">
            {menuLinks.map((link, index) => (
              <Link
                key={index}
                to={link.path}
                ref={(el) => (linkRefs.current[index] = el)}
                onClick={closeDrawer}
                className={`border-b border-primary-300 pb-2 ${
                  isActive(link.path) ? "font-bold text-black" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Create Post (Mobile) */}
            <button
              onClick={() => {
                closeDrawer();
                navigate("/create-post");
              }}
              className="mt-4 flex items-center gap-2 text-primary-500 text-base sm:text-lg"
            >
              <FaCirclePlus />
              Create Post
            </button>

            {/* Dashboard Links (Mobile) */}
            {!isLoading && user?.role === "admin" && (
              <Link
                to="/admin/dashboard"
                onClick={closeDrawer}
                className="mt-4 flex items-center gap-2 text-primary-500 border-t border-primary-300 pt-4 text-base sm:text-lg"
              >
                <span>Admin Panel</span>
              </Link>
            )}
            {!isLoading &&
              user?.role === "dealer" &&
              user?.dealerInfo?.verified && (
                <Link
                  to="/dealer/dashboard"
                  onClick={closeDrawer}
                  className="mt-4 flex items-center gap-2 text-primary-500 border-t border-primary-300 pt-4 text-base sm:text-lg"
                >
                  <span>Dealer Dashboard</span>
                </Link>
              )}
            {!isLoading &&
              user?.role === "dealer" &&
              !user?.dealerInfo?.verified && (
                <Link
                  to="/seller/dashboard"
                  onClick={closeDrawer}
                  className="mt-4 flex items-center gap-2 text-primary-500 border-t border-primary-300 pt-4 text-base sm:text-lg"
                >
                  <span>My Dashboard</span>
                </Link>
              )}
            {/* Individual users don't have a dashboard */}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
