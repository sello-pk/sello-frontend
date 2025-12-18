// Centralized application route paths
// Update these in one place when URLs change.

export const ROUTES = {
  auth: {
    login: "/login",
    register: "/sign-up",
    forgotPassword: "/forgot-password",
  },
  user: {
    home: "/",
    notifications: "/notifications",
    privacyPolicy: "/privacy-policy",
    helpCenter: "/help-center",
    terms: "/terms-conditon",
  },
  admin: {
    dashboard: "/admin/dashboard",
    users: "/admin/users",
    userDetail: (id = ":id") => `/admin/users/${id}`,
    supportChat: "/admin/support-chat",
    supportChatWithId: (chatId = ":chatId") =>
      `/admin/support-chat?chatId=${chatId}`,
    supportChatbot: "/admin/support-chatbot",
    supportChatbotWithId: (chatId = ":chatId") =>
      `/admin/support-chatbot?chatId=${chatId}`,
    blogsEdit: (id = ":id") => `/admin/blogs/${id}/edit`,
  },
};


