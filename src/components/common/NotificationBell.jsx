import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "../../redux/config";
import { FaBell, FaCheck, FaCheckDouble } from "react-icons/fa";
import { MdNotifications, MdNotificationsActive } from "react-icons/md";
import {
  useGetUserNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from "../../redux/services/api";
import toast from "react-hot-toast";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");

  const { data: notificationsData, refetch } = useGetUserNotificationsQuery(
    { page: 1, limit: 10 },
    { pollingInterval: 30000 } // Poll every 30 seconds
  );

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

  const notifications = notificationsData?.notifications || [];
  const totalUnread = notificationsData?.unreadCount || 0;

  useEffect(() => {
    setUnreadCount(totalUnread);
  }, [totalUnread]);

  // Initialize Socket.io for real-time notifications
  useEffect(() => {
    if (!token) return;

    const newSocket = io(SOCKET_BASE_URL, {
      auth: { token },
      query: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      // Join user's notification room
      newSocket.emit("join-notifications");
    });

    newSocket.on("disconnect", () => {});

    // Listen for new notifications
    newSocket.on("new-notification", (data) => {
      // WhatsApp-style bubble toast (bottom-right, richer preview)
      toast.success(data.message || data.title || "New notification", {
        icon: "🔔",
        duration: 7000,
        position: "bottom-right",
      });

      // Refetch notifications so the bell counter updates instantly
      refetch();
    });

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [token, refetch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id).unwrap();
        refetch();
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    setIsOpen(false);

    // Navigate to action URL if available
    // For support chats, actionUrl will be:
    // - Users:  `/support?chatId=...`  → handled by SupportRouteRedirect (opens widget)
    // - Admins: `/admin/support-chatbot/:chatId` → handled by admin routes
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      refetch();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "info":
      default:
        return "ℹ️";
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notificationDate.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-current hover:opacity-80 transition-all rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="Notifications"
      >
        <div className="relative">
          {unreadCount > 0 ? (
            <MdNotificationsActive className="text-2xl text-current" />
          ) : (
            <MdNotifications
              className={`text-2xl ${
                location.pathname === "/cars"
                  ? "text-primary-500"
                  : "text-current"
              }`}
            />
          )}
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg border-2 border-white transform translate-x-1/2 -translate-y-1/2 z-10">
              {unreadCount > 99 ? "99+" : unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary-500 hover:text-primary-500 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MdNotifications className="text-4xl mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? "bg-primary-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`text-2xl ${
                          !notification.isRead ? "animate-pulse" : ""
                        }`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`text-sm font-semibold ${
                              !notification.isRead
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-1.5"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatTime(notification.createdAt)}
                          </span>
                          {notification.actionText && (
                            <span className="text-xs text-primary-500 font-medium">
                              {notification.actionText} →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
              <button
                onClick={() => navigate("/notifications")}
                className="text-sm text-primary-500 hover:text-primary-500 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
