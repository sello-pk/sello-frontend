import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGetDashboardStatsQuery } from "../../redux/services/adminApi";
import AdminLayout from "../../components/admin/AdminLayout";
import Spinner from "../../components/Spinner";
import { StatsCardSkeleton, CardSkeleton } from "../../components/Skeleton";
import {
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
  FiList,
  FiDollarSign,
  FiShoppingBag,
  FiFileText,
  FiGrid,
  FiLayout,
} from "react-icons/fi";
import TooltipComponent from "../../components/admin/Tooltip";
import { BiSolidCarGarage } from "react-icons/bi";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
} from "recharts";

const Dashboard = () => {
  const [isCompactView, setIsCompactView] = useState(false);
  const navigate = useNavigate();
  const {
    data: stats,
    isLoading,
    isError,
    error,
  } = useGetDashboardStatsQuery();

  // Handle authentication errors - redirect to login
  useEffect(() => {
    if (
      isError &&
      (error?.status === 401 ||
        error?.originalStatus === 401 ||
        error?.status === 403 ||
        error?.originalStatus === 403)
    ) {
      // Token is invalid or user is not authorized
      // Clear token and user data

      // Log error details in development only
      if (import.meta.env.DEV) {
        console.error("⚠️ Dashboard access denied:", {
          errorStatus: error?.status || error?.originalStatus,
          errorMessage: error?.data?.message || error?.message,
        });
      }

      // Clear token and user data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Use navigate for client-side routing (but keep window.location for auth errors to clear state)
      navigate("/login");
    }
  }, [isError, error, navigate]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <StatsCardSkeleton count={8} />
          <CardSkeleton count={2} />
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    // Don't show error UI for auth errors (will redirect)
    if (
      error?.status === 401 ||
      error?.originalStatus === 401 ||
      error?.status === 403 ||
      error?.originalStatus === 403
    ) {
      return (
        <AdminLayout>
          <div className="flex justify-center items-center h-64">
            <Spinner fullScreen={false} />
          </div>
        </AdminLayout>
      );
    }

    // Show error for other types of errors
    const errorMessage =
      error?.data?.message || error?.message || "Please try again later";
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-red-500 text-lg font-semibold mb-2">
            Error loading dashboard
          </p>
          <p className="text-gray-600 text-sm">{errorMessage}</p>
          <button
            onClick={() => navigate(0)}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 transition-colors"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  // Ensure we have valid stats data
  if (!stats) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No data available
          </p>
        </div>
      </AdminLayout>
    );
  }

  const metrics = stats?.metrics || [];
  const salesTrends = stats?.salesTrends || [];
  const userGrowth = stats?.userGrowth || [];

  // Icon mapping for metrics
  const getIcon = (iconType) => {
    switch (iconType) {
      case "users":
        return <FiUsers size={28} />;
      case "dealers":
        return <BiSolidCarGarage size={28} />;
      case "listings":
        return <FiList size={28} />;
      case "requests":
        return <FiFileText size={28} />;
      case "sold":
        return <FiShoppingBag size={28} />;
      case "revenue":
        return <FiDollarSign size={28} />;
      default:
        return <FiUsers size={28} />;
    }
  };

  // Color mapping for metrics (exact colors from screenshot)
  const getCardColor = (index) => {
    const colors = [
      { bg: "bg-green-50", icon: "bg-green-500", text: "text-green-700" }, // Total Users - Green
      { bg: "bg-primary-50", icon: "bg-primary-500", text: "text-primary-700" }, // Total Dealers - Primary
      { bg: "bg-green-50", icon: "bg-green-500", text: "text-green-700" }, // Active Listings - Green
      { bg: "bg-red-50", icon: "bg-red-500", text: "text-red-700" }, // Customer Requests - Red
      { bg: "bg-purple-50", icon: "bg-purple-500", text: "text-purple-700" }, // Total Cars Sold - Purple
      { bg: "bg-primary-50", icon: "bg-primary-500", text: "text-primary-500" }, // Revenue - Primary
    ];
    return colors[index % colors.length];
  };

  // Sparkline component for trend visualization
  const SparklineChart = ({ data, isPositive }) => {
    if (!data || data.length === 0) return null;

    const color = isPositive ? "#10b981" : "#ef4444";

    return (
      <ResponsiveContainer width="100%" height={30}>
        <LineChart
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Generate simple trend data for sparkline
  const generateTrendData = (change) => {
    const isPositive = change >= 0;
    return [
      { value: isPositive ? 20 : 80 },
      { value: isPositive ? 35 : 65 },
      { value: isPositive ? 28 : 72 },
      { value: isPositive ? 45 : 55 },
      { value: isPositive ? 38 : 62 },
      { value: isPositive ? 60 : 40 },
      { value: isPositive ? 55 : 45 },
      { value: isPositive ? 70 : 30 },
    ];
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard Overview
            </h1>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              Welcome back! Here's what's happening with your platform today.
            </p>
          </div>
          <div className="flex gap-2">
            <TooltipComponent content="Expanded view shows detailed metrics with charts">
              <button
                onClick={() => setIsCompactView(false)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  !isCompactView
                    ? "bg-primary-500 text-white shadow-md"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
                aria-label="Switch to expanded view"
                aria-pressed={!isCompactView}
              >
                <FiLayout size={18} aria-hidden="true" />
                Expanded
              </button>
            </TooltipComponent>
            <TooltipComponent content="Compact view shows summary cards only">
              <button
                onClick={() => setIsCompactView(true)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  isCompactView
                    ? "bg-primary-500 text-white shadow-md"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
                aria-label="Switch to compact view"
                aria-pressed={isCompactView}
              >
                <FiGrid size={18} aria-hidden="true" />
                Compact
              </button>
            </TooltipComponent>
          </div>
        </div>

        {/* Metric Cards */}
        {isCompactView ? (
          /* Compact View - Two rows of 3 cards each */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {metrics.map((metric, index) => {
              const isPositive = metric.change >= 0;
              const changeText = Math.abs(metric.change).toFixed(0);
              const colors = getCardColor(index);
              const trendData = generateTrendData(metric.change);

              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-100 dark:border-gray-700"
                >
                  {/* Icon and Title Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {metric.title}
                      </p>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metric.value.toLocaleString()}
                      </h3>
                    </div>
                    <div className="relative flex-shrink-0">
                      {/* Large soft circular glow background */}
                      <div
                        className={`absolute w-24 h-24 -top-5 -right-5 ${colors.bg} rounded-full blur-3xl opacity-30`}
                      ></div>
                      {/* Icon container - rounded square with shadow */}
                      <div
                        className={`relative w-14 h-14 ${colors.icon} rounded-2xl flex items-center justify-center text-white shadow-lg`}
                      >
                        {getIcon(metric.icon)}
                      </div>
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="mb-2">
                    <SparklineChart data={trendData} isPositive={isPositive} />
                  </div>

                  {/* Change Indicator */}
                  <div className="flex items-center gap-1.5">
                    {isPositive ? (
                      <FiTrendingUp className="text-green-600" size={14} />
                    ) : (
                      <FiTrendingDown className="text-red-600" size={14} />
                    )}
                    <span
                      className={`text-xs font-semibold ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {changeText}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      vs last month
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Expanded View - Single row with spacing */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {metrics.map((metric, index) => {
              const isPositive = metric.change >= 0;
              const changeText = Math.abs(metric.change).toFixed(0);
              const colors = getCardColor(index);
              const trendData = generateTrendData(metric.change);

              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 border border-gray-100 dark:border-gray-700"
                >
                  {/* Icon with layered background effect */}
                  <div className="relative mb-3">
                    {/* Large soft circular glow background */}
                    <div
                      className={`absolute w-24 h-24 -top-5 -left-5 ${colors.bg} rounded-full blur-3xl opacity-30`}
                    ></div>
                    {/* Icon container - rounded square with shadow */}
                    <div
                      className={`relative w-14 h-14 ${colors.icon} rounded-2xl flex items-center justify-center text-white shadow-lg`}
                    >
                      {getIcon(metric.icon)}
                    </div>
                  </div>

                  {/* Title */}
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {metric.title}
                  </p>

                  {/* Value */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {metric.value.toLocaleString()}
                  </h3>

                  {/* Sparkline */}
                  <div className="mb-2">
                    <SparklineChart data={trendData} isPositive={isPositive} />
                  </div>

                  {/* Change Indicator */}
                  <div className="flex items-center gap-1.5">
                    {isPositive ? (
                      <FiTrendingUp className="text-green-600" size={14} />
                    ) : (
                      <FiTrendingDown className="text-red-600" size={14} />
                    )}
                    <span
                      className={`text-xs font-semibold ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {changeText}%
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      vs last month
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Sales Trends Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
              Sales Trends
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={salesTrends}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFA602" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#FFA602" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="0"
                  stroke="#f3f4f6"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  style={{ fontSize: "11px", fontWeight: "500" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: "11px", fontWeight: "500" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#FFA602"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Users Growth Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
              Users Growth
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={userGrowth}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barGap={2}
              >
                <CartesianGrid
                  strokeDasharray="0"
                  stroke="#f3f4f6"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  style={{ fontSize: "11px", fontWeight: "500" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: "11px", fontWeight: "500" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="activeUsers"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={35}
                  name="Active Users"
                />
                <Bar
                  dataKey="newDealers"
                  fill="#FFA602"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={35}
                  name="New Dealers"
                />
                <Bar
                  dataKey="newUsers"
                  fill="#ef4444"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={35}
                  name="New Users"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
