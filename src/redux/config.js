// Centralized frontend configuration for API and sockets
// This keeps all environment-dependent URLs in one place.
import { logger } from "@utils/logger";

// Base API URL (must include /api in your backend)
// Priority:
// 1. VITE_API_URL from environment (REQUIRED in production)
// 2. localhost API for dev only
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:4000/api"
    : (() => {
        logger.error("VITE_API_URL is required in production!");
        return ""; // Fail fast in production if not configured
      })());

// Socket base URL (same host as API but without /api)
export const SOCKET_BASE_URL = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL.replace("/api", "")
  : API_BASE_URL;

// Admin API route prefixes
export const ADMIN_API_PREFIX = "/admin";
