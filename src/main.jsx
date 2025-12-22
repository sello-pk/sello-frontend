import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { store } from "./redux/store.js";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SupportChatProvider } from "./contexts/SupportChatContext.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import AppLoader from "./components/common/AppLoader.jsx";
import "leaflet/dist/leaflet.css";

// Google OAuth client ID – must be set explicitly
// In production, VITE_GOOGLE_CLIENT_ID is required
const envGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const isDev = import.meta.env.DEV;

// Require Google Client ID in production, warn in development
const googleClientId = envGoogleClientId;

if (!googleClientId) {
  if (isDev) {
    // Warn in development but allow app to continue
    console.warn(
      "VITE_GOOGLE_CLIENT_ID is not set. Google Login will not work until this is configured."
    );
  } else {
    // Fail fast in production if not configured correctly
    // This avoids confusing "origin not allowed" errors from Google
    // and makes the misconfiguration obvious during deployment.
    console.error(
      "VITE_GOOGLE_CLIENT_ID is required in production. Google Login will not work."
    );
    // In production, throw error to prevent deployment with misconfiguration
    throw new Error(
      "Google OAuth not configured. Please set VITE_GOOGLE_CLIENT_ID environment variable."
    );
  }
}


// App Root Component with Initial Loader
const AppRoot = () => {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Hide loader after app initializes
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 500); // Small delay to ensure smooth transition

    return () => clearTimeout(timer);
  }, []);

  return (
    <StrictMode>
      <ErrorBoundary>
        {isInitialLoad && <AppLoader />}
        <Provider store={store}>
          <BrowserRouter>
            <GoogleOAuthProvider clientId={googleClientId}>
              <SupportChatProvider>
                <App />
              </SupportChatProvider>
            </GoogleOAuthProvider>
          </BrowserRouter>
        </Provider>
      </ErrorBoundary>
    </StrictMode>
  );
};

createRoot(document.getElementById("root")).render(<AppRoot />);
