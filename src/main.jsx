import * as React from "react";
import * as ReactDOM from "react-dom/client";

// 🔥 REQUIRED FOR CPANEL + LEGACY VENDOR CODE
window.React = React;
window.ReactDOM = ReactDOM;

import "./index.css";
import App from "./App.jsx";
import { store } from "./redux/store.js";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SupportChatProvider } from "./contexts/SupportChatContext.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import AppRoot from "./AppRoot.jsx";
import { BrowserRouter } from "react-router-dom";
import { logger } from "./utils/logger.js";
import "leaflet/dist/leaflet.css";

// Google OAuth client ID
const envGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const isDev = import.meta.env.DEV;
const googleClientId = envGoogleClientId;

if (!googleClientId) {
  if (isDev) {
    logger.warn(
      "VITE_GOOGLE_CLIENT_ID is not set. Google Login will not work."
    );
  } else {
    throw new Error(
      "Google OAuth not configured. Please set VITE_GOOGLE_CLIENT_ID."
    );
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppRoot>
      <Provider store={store}>
        <BrowserRouter>
          <ErrorBoundary>
            <GoogleOAuthProvider clientId={googleClientId}>
              <SupportChatProvider>
                <App />
              </SupportChatProvider>
            </GoogleOAuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </Provider>
    </AppRoot>
  </React.StrictMode>
);
