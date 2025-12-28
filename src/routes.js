/**
 * Route Constants
 * Centralized route definitions for the application
 */

export const ROUTES = {
  // Public routes
  home: '/',
  cars: '/cars',
  carDetails: (id) => `/cars/${id}`,
  blog: '/blog',
  blogDetails: (id) => `/blog/${id}`,
  about: '/about',
  contact: '/contact',
  login: '/login',
  signUp: '/sign-up',
  forgotPassword: '/forgot-password',
  
  // User routes
  createPost: '/create-post',
  editCar: (id) => `/edit-car/${id}`,
  myListings: '/my-listings',
  profile: '/profile',
  savedCars: '/saved-cars',
  myChats: '/my-chats',
  
  // Admin routes
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    userDetail: (userId) => `/admin/users/${userId}`,
    listings: '/admin/listings',
    dealers: '/admin/dealers',
    categories: '/admin/categories',
    blogs: '/admin/blogs',
    blogCreate: '/admin/blogs/create',
    blogEdit: (id) => `/admin/blogs/${id}/edit`,
    blogCategories: '/admin/blog-categories',
    blogComments: '/admin/blog-comments',
    blogMedia: '/admin/blog-media',
    analytics: '/admin/analytics',
    activityLog: '/admin/activity-log',
    chat: '/admin/chat',
    chatbot: '/admin/chatbot',
    supportChatWithId: (chatId) => `/admin/chat/${chatId}`,
    supportChatbotWithId: (chatId) => `/admin/support-chatbot/${chatId}`,
    promotions: '/admin/promotions',
    settings: '/admin/settings',
    contactForm: '/admin/contact-form',
    customerRequests: '/admin/customer-requests',
  }
};

