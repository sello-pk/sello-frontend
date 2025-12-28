/**
 * Token Refresh Utility
 * Handles automatic token refresh when access tokens expire
 */

const ACCESS_TOKEN_KEY = 'token';

/**
 * Store access token
 */
export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

/**
 * Get access token from storage
 */
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Clear all tokens
 */
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

/**
 * Refresh access token using refresh token
 * NOTE: Refresh token is now stored in httpOnly cookie
 * so it is NOT passed from client-side JS.
 * @returns {Promise<{accessToken: string}>} New access token (and rotated refresh cookie on server)
 */
export const refreshAccessToken = async () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        // No body needed; backend reads refresh token from httpOnly cookie
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to refresh token');
    }

    const newAccessToken = data.data?.accessToken || data.data?.token;
    
    if (!newAccessToken) {
      throw new Error('No access token in refresh response');
    }

    // Store new access token
    setAccessToken(newAccessToken);
    
    return { 
      accessToken: newAccessToken
    };
  } catch (error) {
    // If refresh fails, clear all tokens
    clearTokens();
    throw error;
  }
};

/**
 * Check if we should attempt token refresh
 * @param {number} status - HTTP status code
 * @param {string} url - Request URL
 * @returns {boolean}
 */
export const shouldRefreshToken = (status, url) => {
  // Don't refresh on auth endpoints (login, register, refresh-token itself)
  if (url?.includes('/auth/refresh-token') || 
      url?.includes('/auth/login') || 
      url?.includes('/auth/register') ||
      url?.includes('/auth/google')) {
    return false;
  }
  
  // Only refresh on 401 errors
  return status === 401;
};

