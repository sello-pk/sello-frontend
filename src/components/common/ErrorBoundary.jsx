import React from "react";
import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
} from "react-router-dom";

// Functional component wrapper for ErrorBoundary with navigate
const ErrorBoundaryWithNavigate = ({ children }) => {
  const navigate = useNavigate();
  return (
    <ErrorBoundaryClass navigate={navigate}>{children}</ErrorBoundaryClass>
  );
};

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error("ErrorBoundary caught an error", error, {
      componentStack: errorInfo?.componentStack,
      errorInfo,
    });

    // Send to Sentry if available
    if (window.Sentry) {
      try {
        window.Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo?.componentStack,
            },
          },
          tags: {
            errorBoundary: true,
          },
        });
      } catch (sentryError) {
        // Sentry failed, continue without it
      }
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Please try
              refreshing the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  this.props.navigate("/");
                }}
                className="w-full bg-primary-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
              >
                Go to Homepage
              </button>
              <button
                onClick={() => this.props.navigate(0)}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Refresh Page
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for React Router error handling
export const ErrorPage = () => {
  const error = useRouteError();

  let errorMessage = "An unexpected error occurred";
  let errorStatus = null;

  if (isRouteErrorResponse(error)) {
    errorStatus = error.status;
    errorMessage = error.statusText || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        {errorStatus && (
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {errorStatus}
          </h1>
        )}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {errorStatus ? "Page Not Found" : "Something went wrong"}
        </h2>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        <div className="space-y-3">
          <button
            onClick={() => navigate("/")}
            className="w-full bg-primary-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
          >
            Go to Homepage
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundaryWithNavigate;
