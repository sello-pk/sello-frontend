/**
 * Role-based access control for admin panel tabs
 * Super Admin = Full access to all tabs
 * Team members = Limited access based on their role
 */

/**
 * Check if user is Super Admin or original admin (has full access)
 * - Original admins (adminRole is null/undefined) have full access
 * - Super Admin role has full access
 * - Team members (with specific adminRole) have limited access
 */
export const isSuperAdmin = (user) => {
    if (!user || user.role !== "admin") {
        return false;
    }

    // Original admins (adminRole is null/undefined) have full access
    if (!user.adminRole || user.adminRole === null) {
        return true;
    }

    // Super Admin role has full access
    if (user.adminRole === "Super Admin") {
        return true;
    }

    // Users with inviteUsers permission also have full access
    const permissions = user.permissions || {};
    if (permissions.inviteUsers === true) {
        return true;
    }

    return false;
};

/**
 * Role-based menu access mapping
 * Each role can only see specific tabs
 */
const ROLE_MENU_ACCESS = {
    "Super Admin": [
        "/admin/dashboard",
        "/admin/users",
        "/admin/listings",
        "/admin/dealers",
        "/admin/categories",
        "/admin/blogs",
        "/admin/testimonials",
        "/admin/analytics",
        "/admin/chat",
        "/admin/chatbot",
        "/admin/customer-requests",
        "/admin/promotions",
        "/admin/payments",
        "/admin/notifications",
        "/admin/settings",
    ],
    "Moderator": [
        "/admin/dashboard",
        "/admin/listings",        // Approve/edit/reject listings
        "/admin/dealers",         // View dealers, communicate
        "/admin/blogs",           // Moderate blog comments
        // Categories would be under listings or separate
    ],
    "Support Agent": [
        "/admin/dashboard",
        "/admin/chat",            // Chat monitoring
        "/admin/chatbot",         // Support chatbot
        "/admin/customer-requests",       // Customer requests and contact forms
    ],
    "Content Manager": [
        "/admin/dashboard",
        "/admin/blogs",           // Write/edit/publish blogs
        "/admin/testimonials",    // Manage reviews and testimonials
        "/admin/promotions",      // Manage promotions
        "/admin/notifications",   // Create push notifications
    ],
    "Dealer Manager": [
        "/admin/dashboard",
        "/admin/dealers",         // View/approve/edit dealer profiles
        "/admin/listings",        // View listings per dealer (view only)
    ],
    "Blogs/Content Agent": [
        "/admin/dashboard",
        "/admin/blogs",           // Write/edit/publish blogs
        "/admin/testimonials",    // Manage reviews and testimonials
        "/admin/promotions",      // Manage promotions
        "/admin/notifications",   // Create push notifications
    ],
    "Marketing Team": [
        "/admin/dashboard",
        "/admin/blogs",           // Write/edit/publish blogs
        "/admin/testimonials",    // Manage reviews and testimonials
        "/admin/promotions",      // Manage promotions
        "/admin/notifications",   // Create push notifications
    ],
    "Custom": [
        "/admin/dashboard",
        // Custom roles get access based on their permissions
        // This will be handled by permission checks
        "/admin/settings",
    ],
};

/**
 * Get allowed menu paths for a user based on their role
 */
export const getAllowedMenuPaths = (user) => {
    if (!user || user.role !== "admin") {
        return [];
    }

    // Super Admin or original admin gets all tabs
    if (isSuperAdmin(user)) {
        return ROLE_MENU_ACCESS["Super Admin"];
    }

    // Get allowed paths based on adminRole for team members
    const adminRole = user.adminRole;
    if (!adminRole) {
        // Fallback: if no adminRole, give full access (original admin)
        return ROLE_MENU_ACCESS["Super Admin"];
    }

    return ROLE_MENU_ACCESS[adminRole] || ROLE_MENU_ACCESS["Support Agent"];
};

/**
 * Check if user can access a specific menu path
 */
export const canAccessMenu = (user, path) => {
    if (!user || user.role !== "admin") {
        return false;
    }

    // Super Admin can access everything
    if (isSuperAdmin(user)) {
        return true;
    }

    const allowedPaths = getAllowedMenuPaths(user);
    return allowedPaths.includes(path);
};

