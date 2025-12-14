import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console or error reporting service
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            return (
                <ErrorFallback
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                    onReset={this.handleReset}
                    showDetails={this.props.showDetails !== false}
                />
            );
        }

        return this.props.children;
    }
}

const ErrorFallback = ({ error, errorInfo, onReset, showDetails }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl border border-gray-200 p-8">
                <div className="flex flex-col items-center text-center">
                    {/* Error Icon */}
                    <div className="mb-6">
                        <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                            <FiAlertTriangle className="text-4xl text-red-600" />
                        </div>
                    </div>

                    {/* Error Message */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        Something went wrong
                    </h1>
                    <p className="text-gray-600 mb-6 max-w-md">
                        We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
                    </p>

                    {/* Error Details (for development) */}
                    {showDetails && process.env.NODE_ENV === 'development' && error && (
                        <div className="w-full mb-6 text-left">
                            <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                                    Error Details (Development Only)
                                </summary>
                                <div className="mt-2 text-xs font-mono text-gray-600 overflow-auto max-h-48">
                                    <div className="mb-2">
                                        <strong className="text-red-600">Error:</strong>
                                        <pre className="whitespace-pre-wrap break-words">
                                            {error.toString()}
                                        </pre>
                                    </div>
                                    {errorInfo && (
                                        <div>
                                            <strong className="text-red-600">Stack Trace:</strong>
                                            <pre className="whitespace-pre-wrap break-words">
                                                {errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </details>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button
                            onClick={onReset}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                        >
                            <FiRefreshCw size={18} />
                            Try Again
                        </button>
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            <FiHome size={18} />
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ErrorBoundary;

