import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import toast from "react-hot-toast";

// Fix leaflet icon issues
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom marker icon for selected location
const createLocationIcon = (isCurrentLocation = false) => {
  return L.divIcon({
    className: "custom-location-marker",
    html: `
      <div style="position: relative;">
        <div style="width: 32px; height: 32px; background: ${
          isCurrentLocation ? "#3B82F6" : "#EF4444"
        }; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
        ${
          isCurrentLocation
            ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; background: white; border-radius: 50%;"></div>'
            : ""
        }
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Component to handle map updates
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
};

// Component to handle map click events
const MapEvents = ({ onMapClick }) => {
  const map = useMap();

  useEffect(() => {
    const handleClick = (e) => {
      onMapClick(e);
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [map, onMapClick]);

  return null;
};

const LocationPickerModal = ({
  isOpen,
  onClose,
  onSelect,
  initialLocation = null,
}) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState([25.276987, 55.296249]); // Dubai default
  const [mapZoom, setMapZoom] = useState(13);
  const [address, setAddress] = useState("");
  const [locationMode, setLocationMode] = useState("auto"); // "auto" or "manual"
  const watchIdRef = useRef(null);

  // Initialize with provided location
  useEffect(() => {
    if (initialLocation && isOpen) {
      if (Array.isArray(initialLocation)) {
        setSelectedLocation({
          lat: initialLocation[1],
          lng: initialLocation[0],
        });
        setMapCenter([initialLocation[1], initialLocation[0]]);
      } else if (initialLocation.lat && initialLocation.lng) {
        setSelectedLocation(initialLocation);
        setMapCenter([initialLocation.lat, initialLocation.lng]);
      }
    }
  }, [initialLocation, isOpen]);

  // Stop watching position
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Reverse geocode to get address
  const reverseGeocode = async (lat, lng) => {
    try {
      // Try OpenStreetMap Nominatim first (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.display_name) {
        setAddress(data.display_name);
        return;
      }
    } catch (error) {
      console.error("Reverse geocode error:", error);
    }

    // Fallback to Google Geocoding if available
    const googleApiKey =
      import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY ||
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`
        );
        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
          setAddress(data.results[0].formatted_address);
        }
      } catch (error) {
        console.error("Google geocode error:", error);
      }
    }
  };

  // Search for locations
  const searchLocation = React.useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setLocationMode("manual");

    try {
      // Try OpenStreetMap Nominatim first
      console.log("Searching for:", query);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1`
      );
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Search results:", data);

      if (data && data.length > 0) {
        const results = data.map((item) => ({ ...item }));

        const handleSelectResult = (result) => {
          setSelectedLocation(result);
          setMapCenter([result.lat, result.lon]);
          setMapZoom(15);
        };

        // Fallback to Google Places API if available
        const googleApiKey =
          import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY ||
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (googleApiKey) {
          const googleResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              query
            )}&key=${googleApiKey}`
          );
          const googleData = await googleResponse.json();

          if (googleData.status === "OK" && googleData.results.length > 0) {
            const results = googleData.results.map((item) => ({
              display_name: item.formatted_address,
              lat: item.geometry.location.lat,
              lon: item.geometry.location.lng,
            }));
            setSearchResults(results);
          } else {
            setSearchResults([]);
            toast.error("No locations found");
          }
        } else {
          setSearchResults(results);
        }
      } else {
        // Fallback to Google Places API if available
        const googleApiKey =
          import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY ||
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (googleApiKey) {
          const googleResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              query
            )}&key=${googleApiKey}`
          );
          const googleData = await googleResponse.json();

          if (googleData.status === "OK" && googleData.results.length > 0) {
            const results = googleData.results.map((item) => ({
              display_name: item.formatted_address,
              lat: item.geometry.location.lat,
              lon: item.geometry.location.lng,
            }));
            setSearchResults(results);
          } else {
            setSearchResults([]);
            toast.error("No locations found");
          }
        } else {
          setSearchResults([]);
          toast.error("No locations found");
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search location");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const timeoutId = setTimeout(() => {
        searchLocation(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchLocation]);

  // Handle map click - using event handlers in MapContainer
  const handleMapClick = React.useCallback((e) => {
    if (e && e.latlng) {
      const location = { lat: e.latlng.lat, lng: e.latlng.lng };
      setSelectedLocation(location);
      setLocationMode("manual");
      // Reverse geocode to get address
      reverseGeocode(location.lat, location.lng);
      toast.success("Location selected on map");
    }
  }, []);

  // Handle search result selection
  const handleSelectResult = (result) => {
    console.log("Selected result:", result);
    const location = { lat: result.lat, lng: result.lon };
    console.log("Created location object:", location);
    setSelectedLocation(location);
    setMapCenter([result.lat, result.lon]);
    setMapZoom(15);
    setSearchQuery(result.display_name);
    setAddress(result.display_name);
    setSearchResults([]);
    setLocationMode("manual");
    toast.success("Location selected");
  };

  // Handle confirm
  const handleConfirm = async () => {
    if (selectedLocation) {
      // Get address if not already set
      if (!address) {
        await reverseGeocode(selectedLocation.lat, selectedLocation.lng);
      }

      onSelect({
        coordinates: selectedLocation,
        address:
          address ||
          `Location (${selectedLocation.lat.toFixed(
            6
          )}, ${selectedLocation.lng.toFixed(6)})`,
        formatted:
          address ||
          `Location (${selectedLocation.lat.toFixed(
            6
          )}, ${selectedLocation.lng.toFixed(6)})`,
      });

      // Stop watching position
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      onClose();
    } else {
      toast.error("Please select a location");
    }
  };

  // Handle close
  const handleClose = () => {
    // Stop watching position
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Reset state
    setSelectedLocation(null);
    setCurrentLocation(null);
    setSearchQuery("");
    setSearchResults([]);
    setAddress("");
    setLocationMode("auto");

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Enter Address</h2>
          <button
            onClick={handleClose}
            className="text-orange-500 hover:text-orange-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Search and Controls */}
        <div className="p-4 border-b space-y-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter text to search"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectResult(result)}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  >
                    <p className="text-sm text-gray-700">
                      {result.display_name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Location Info */}
          {selectedLocation && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Selected Location:
              </p>
              <p className="text-xs text-gray-600">
                {address ||
                  `Lat: ${selectedLocation.lat.toFixed(
                    6
                  )}, Lng: ${selectedLocation.lng.toFixed(6)}`}
              </p>
              {locationMode === "auto" && (
                <p className="text-xs text-primary-600 mt-1">
                  📍 Live tracking active
                </p>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative min-h-[400px]">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "400px", width: "100%" }}
            scrollWheelZoom={true}
            key={`map-${mapCenter[0]}-${mapCenter[1]}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            <MapEvents onMapClick={handleMapClick} />

            {/* Current location marker (if auto mode) */}
            {currentLocation && locationMode === "auto" && (
              <Marker
                position={[currentLocation.lat, currentLocation.lng]}
                icon={createLocationIcon(true)}
              />
            )}

            {/* Selected location marker */}
            {selectedLocation && (
              <Marker
                position={[selectedLocation.lat, selectedLocation.lng]}
                icon={createLocationIcon(false)}
              />
            )}
          </MapContainer>

          {/* Instructions overlay */}
          {!selectedLocation && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200 z-[10]">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">💡 Click on the map</span> to
                select a location, or search above
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SELECT
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
