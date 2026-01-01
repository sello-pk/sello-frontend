import { useState, useEffect } from "react";

const STORAGE_KEY = "recentlyViewedCars";
const MAX_RECENT_CARS = 10; // Maximum number of recently viewed cars to store
const MAX_AGE_DAYS = 30; // How long to keep items (like real apps)
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

/**
 * Hook to manage recently viewed cars
 * Stores car IDs in localStorage and provides methods to add and retrieve them
 */
export const useRecentlyViewedCars = () => {
  const [recentCars, setRecentCars] = useState([]);

  // Load recently viewed cars from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const array = Array.isArray(parsed) ? parsed : [];

        const now = Date.now();
        const filtered = array.filter((item) => {
          if (!item.viewedAt) return true;
          const viewedTime = new Date(item.viewedAt).getTime();
          if (Number.isNaN(viewedTime)) return true;
          return now - viewedTime <= MAX_AGE_MS;
        });

        setRecentCars(filtered.slice(0, MAX_RECENT_CARS));

        // Persist cleaned list back to storage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (error) {
      console.error("Error loading recently viewed cars:", error);
      setRecentCars([]);
    }
  }, []); // Empty dependency array - run only once on mount

  /**
   * Add a car to recently viewed
   * @param {Object} car - Car object with _id
   */
  const addRecentlyViewed = (car) => {
    if (!car || !car._id) return;

    try {
      setRecentCars((prev) => {
        const now = Date.now();

        // Remove if already exists (to avoid duplicates)
        let filtered = prev.filter((c) => c._id !== car._id);

        // Also drop very old items
        filtered = filtered.filter((item) => {
          if (!item.viewedAt) return true;
          const viewedTime = new Date(item.viewedAt).getTime();
          if (Number.isNaN(viewedTime)) return true;
          return now - viewedTime <= MAX_AGE_MS;
        });

        // Add to beginning and limit to MAX_RECENT_CARS
        const updated = [
          {
            _id: car._id,
            title: car.title || `${car.make} ${car.model}`,
            make: car.make,
            model: car.model,
            year: car.year,
            price: car.price,
            images: car.images || [],
            vehicleType: car.vehicleType || "Car",
            viewedAt: new Date().toISOString(),
          },
          ...filtered,
        ].slice(0, MAX_RECENT_CARS);

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error("Error saving recently viewed car:", error);
    }
  };

  /**
   * Clear all recently viewed cars
   */
  const clearRecentlyViewed = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setRecentCars([]);
    } catch (error) {
      console.error("Error clearing recently viewed cars:", error);
    }
  };

  return {
    recentCars,
    addRecentlyViewed,
    clearRecentlyViewed,
  };
};
