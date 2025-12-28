/**
 * Centralized Token Management Utility
 * Provides secure token storage and retrieval with expiration checks
 * 
 * This utility centralizes all token operations to ensure consistency
 * and makes it easier to implement security improvements (e.g., httpOnly cookies)
 */

import { getAccessToken, setAccessToken, clearTokens } from './tokenRefresh.js';

/**
 * Check if access token is expired (client-side check)
 * Note: This is a best-effort check. Server always validates tokens.
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration (exp is in seconds, Date.now() is in milliseconds)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true;
    }
    
    return false;
  } catch (error) {
    // If we can't parse the token, consider it expired
    return true;
  }
};

/**
 * Get access token with expiration check
 * Returns null if token is expired or missing
 */
export const getValidAccessToken = () => {
  const token = getAccessToken();
  if (!token) return null;
  
  if (isTokenExpired(token)) {
    // Token expired, clear it
    clearTokens();
    return null;
  }
  
  return token;
};

/**
 * Check if user is authenticated
 * Checks for valid (non-expired) access token
 */
export const isAuthenticated = () => {
  const token = getValidAccessToken();
  return !!token;
};

/**
 * Get user data from localStorage
 */
export const getUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    return null;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
  clearTokens();
  localStorage.removeItem('user');
};

/**
 * Store authentication data (access token + user)
 * Refresh token is managed server-side via httpOnly cookie.
 */
export const storeAuth = (accessToken, _refreshToken, user) => {
  setAccessToken(accessToken);
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export default {
  isTokenExpired,
  getValidAccessToken,
  isAuthenticated,
  getUser,
  clearAuth,
  storeAuth,
  // Re-export token refresh utilities
  getAccessToken,
  setAccessToken,
  clearTokens
};

