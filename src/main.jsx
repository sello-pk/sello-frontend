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

// Check if Google OAuth is configured
const hasGoogleClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
const fallbackClientId = "90770038046-jpumef82nch1o3amujieujs2m1hr73rt.apps.googleusercontent.com";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || fallbackClientId;
const isUsingFallback = !hasGoogleClientId;


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
