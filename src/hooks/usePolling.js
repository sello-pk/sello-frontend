import { useEffect, useRef } from 'react';

/**
 * Custom hook for polling data at regular intervals
 * @param {Function} refetch - Function to refetch data
 * @param {number} interval - Polling interval in milliseconds (default: 30000 = 30 seconds)
 * @param {boolean} enabled - Whether polling is enabled (default: true)
 */
export const usePolling = (refetch, interval = 30000, enabled = true) => {
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!enabled || !refetch) return;

        // Initial fetch
        refetch();

        // Set up polling interval
        intervalRef.current = setInterval(() => {
            refetch();
        }, interval);

        // Cleanup on unmount or when dependencies change
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [refetch, interval, enabled]);

    // Function to manually stop polling
    const stopPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // Function to start polling
    const startPolling = () => {
        if (!intervalRef.current && enabled) {
            intervalRef.current = setInterval(() => {
                refetch();
            }, interval);
        }
    };

    return { stopPolling, startPolling };
};

