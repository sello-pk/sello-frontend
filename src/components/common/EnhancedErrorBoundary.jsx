// Global error boundary for React components
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `error_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log error to monitoring service
    this.logError(error, errorInfo, errorId);
  }

  logError(error, errorInfo, errorId) {
    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("React Error Boundary caught error:", errorData);
    }

    // Send to error reporting service
    this.sendErrorToService(errorData);
  }

  sendErrorToService(errorData) {
    try {
      // Send to your error reporting endpoint
      fetch("/api/errors/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorData),
        credentials: "include",
      }).catch((err) => {
        // Fallback logging if error reporting fails
        console.error("Failed to report error:", err);
      });
    } catch (err) {
      console.error("Error reporting failed:", err);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h1>Something went wrong</h1>
          <p>We're sorry, but something unexpected happened.</p>

          {process.env.NODE_ENV === "development" && (
            <details style={{ marginTop: "20px", textAlign: "left" }}>
              <summary>Error Details (Development Only)</summary>
              <pre
                style={{
                  background: "#f5f5f5",
                  padding: "10px",
                  borderRadius: "4px",
                  overflow: "auto",
                  maxHeight: "300px",
                }}
              >
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div style={{ marginTop: "20px" }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => navigate(0)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>

          {this.state.errorId && (
            <p style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
              Error ID: {this.state.errorId}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for async error handling
export const useAsyncError = () => {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
};

// Async error boundary wrapper
export const AsyncErrorBoundary = ({ children }) => {
  const setError = useAsyncError();

  const handleAsyncError = React.useCallback(
    (error) => {
      setError(error);
    },
    [setError]
  );

  return (
    <ErrorBoundary>
      <AsyncErrorContext.Provider value={handleAsyncError}>
        {children}
      </AsyncErrorContext.Provider>
    </ErrorBoundary>
  );
};

const AsyncErrorContext = React.createContext(null);

export default ErrorBoundary;
