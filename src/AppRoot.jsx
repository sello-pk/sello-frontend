import { StrictMode, useState, useEffect } from "react";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import AppLoader from "./components/common/AppLoader.jsx";

const AppRoot = ({ children }) => {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Simple timeout approach - more reliable
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <StrictMode>
      {isInitialLoad && <AppLoader />}
      <div
        style={{
          opacity: isInitialLoad ? 0 : 1,
          transition: "opacity 0.3s ease-in-out",
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </StrictMode>
  );
};

export default AppRoot;
