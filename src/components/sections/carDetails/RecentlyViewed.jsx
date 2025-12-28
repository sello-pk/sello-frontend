import React, { useEffect, useRef, useState } from "react";
import { useGetRecentlyViewedQuery } from "../../../redux/services/api";
import { Link } from "react-router-dom";
import { FaCalendarAlt } from "react-icons/fa";
import LazyImage from "../../common/LazyImage";

const PAGE_SIZE = 6; // show 6 at a time for a nice grid
const MAX_LIMIT = 48; // hard cap from backend to avoid huge payloads

const RecentlyViewed = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Local pagination state for infinite scroll (hooks must be first)
  const [page, setPage] = useState(1);
  const loadMoreRef = useRef(null);

  const { data, isLoading, error } = useGetRecentlyViewedQuery(
    { limit: MAX_LIMIT },
    { skip: !token }
  );

  const recentlyViewed = Array.isArray(data) ? data : [];

  const total = recentlyViewed.length;
  const visibleCount = Math.min(page * PAGE_SIZE, total);
  const visibleItems = recentlyViewed.slice(0, visibleCount);
  const hasMore = visibleCount < total;

  // Infinite scroll using IntersectionObserver
  useEffect(() => {
    if (!hasMore) return;

    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setPage((prev) => prev + 1);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 1.0,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore]);

  // Don't show anything on error or if no data after loading
  if (error || (!isLoading && (!recentlyViewed || recentlyViewed.length === 0))) {
    return null;
  }

  // Skeleton while loading first page
  if (isLoading && recentlyViewed.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-20 py-12 bg-gray-50">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(PAGE_SIZE)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse"
            >
              <div className="h-32 bg-gray-200" />
              <div className="p-3">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-20 py-12 bg-gray-50">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Recently Viewed
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            Continue browsing cars you&apos;ve recently looked at.
          </p>
        </div>
        {total > PAGE_SIZE && (
          <button
            type="button"
            onClick={() => setPage(Math.ceil(total / PAGE_SIZE))}
            className="text-sm font-medium text-primary-500 hover:text-primary-500 underline-offset-4 hover:underline"
          >
            View All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {visibleItems.map((car) => (
          <Link
            key={car._id}
            to={`/cars/${car._id}`}
            className="bg-white rounded-lg shadow-sm hover:shadow-lg border border-gray-200 transition-all duration-300 overflow-hidden group transform hover:-translate-y-1"
          >
            <div className="relative h-32 overflow-hidden">
              <LazyImage
                src={car.images?.[0] || "/placeholder-car.jpg"}
                alt={car.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm mb-1 line-clamp-1 group-hover:text-primary-500 transition-colors">
                {car.title || `${car.make} ${car.model}`}
              </h3>
              <div className="text-xs text-gray-600 mb-2">
                <span className="flex items-center gap-1">
                  <FaCalendarAlt /> {car.year}
                </span>
              </div>
              <span className="text-sm font-bold text-primary-500">
                PKR {car.price?.toLocaleString() || "0"}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={loadMoreRef} className="mt-6 h-6 w-full flex justify-center items-center">
          {/* subtle loading indicator when more is being revealed */}
          <span className="h-1 w-16 rounded-full bg-gray-200 animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default RecentlyViewed;

