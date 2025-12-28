import { StrictMode, useState, useEffect } from "react";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import AppLoader from "./components/common/AppLoader.jsx";

const AppRoot = ({ children }) => {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Hide loader immediately when DOM is ready
    // Use requestAnimationFrame to ensure smooth transition
    requestAnimationFrame(() => {
      setIsInitialLoad(false);
    });
  }, []);

  return (
    <StrictMode>
      {isInitialLoad && <AppLoader />}
      {children}
    </StrictMode>
  );
};

export default AppRoot;
