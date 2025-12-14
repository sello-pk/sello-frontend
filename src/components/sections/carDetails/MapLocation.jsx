// MapView.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import toast from "react-hot-toast";

// Fix leaflet icon issues (ESM friendly)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom icon for user location (blue circle - like reference)
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-location-marker',
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="width: 24px; height: 24px; background: #3B82F6; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Custom icon for car location (red teardrop - like reference)
const createCarLocationIcon = () => {
  return L.divIcon({
    className: 'custom-car-location-marker',
    html: `
      <div style="position: relative;">
        <div style="width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 20px solid #EF4444; position: relative;">
          <div style="width: 8px; height: 8px; background: white; border-radius: 50%; position: absolute; top: -16px; left: -4px; border: 2px solid #EF4444;"></div>
        </div>
        <div style="width: 16px; height: 16px; background: black; border-radius: 50%; position: absolute; top: 8px; left: -8px; border: 2px solid white;"></div>
      </div>
    `,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
  });
};

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Calculate route using OpenRouteService (free API)
const calculateRoute = async (startLat, startLng, endLat, endLng) => {
  try {
    // Using OpenRouteService Directions API
    // You can get a free API key from https://openrouteservice.org/
    // For now, using a demo key (replace with your own in production)
    const apiKey = import.meta.env.VITE_ORS_API_KEY || '5b3ce3597851110001cf6248e77c3e7b';
    
    // Format: [longitude, latitude] for API
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startLng},${startLat}&end=${endLng},${endLat}`,
      {
        headers: {
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        }
      }
    );

    if (!response.ok) {
      throw new Error('Route calculation failed');
    }

    const data = await response.json();
    
    if (data.features && data.features[0]) {
      const geometry = data.features[0].geometry;
      const properties = data.features[0].properties;
      
      // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
      const routeCoordinates = geometry.coordinates.map(coord => [coord[1], coord[0]]);
      const distance = properties.segments[0].distance / 1000; // Convert to km
      const duration = properties.segments[0].duration / 60; // Convert to minutes
      
      return {
        route: routeCoordinates,
        distance: distance,
        duration: duration
      };
    }
    return null;
  } catch (error) {
    console.error("Route calculation error:", error);
    // Fallback: return straight line distance with estimated route
    const distance = calculateDistance(startLat, startLng, endLat, endLng);
    const duration = distance * 2; // Rough estimate: 2 min per km (average city speed)
    
    // Create a simple curved route for visual effect
    const midLat = (startLat + endLat) / 2;
    const midLng = (startLng + endLng) / 2;
    const offset = distance * 0.1; // Small offset for curve
    
    return {
      route: [
        [startLat, startLng],
        [midLat + offset, midLng + offset],
        [endLat, endLng]
      ],
      distance: distance,
      duration: duration
    };
  }
};

// Component to update map view
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

const MapView = ({ coordinates = [25.203, 55.2719], carLocation = null }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [travelTime, setTravelTime] = useState(null);
  const [route, setRoute] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(coordinates);
  const [mapZoom, setMapZoom] = useState(13);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Use ref to track coordinates and prevent infinite loops
  const coordinatesRef = useRef(coordinates);
  const prevCoordinatesRef = useRef(coordinates);
  
  // Check if coordinates actually changed
  const coordinatesChanged = useMemo(() => {
    const prev = prevCoordinatesRef.current;
    const curr = coordinates;
    
    if (!prev || !curr || !Array.isArray(prev) || !Array.isArray(curr)) {
      if (prev !== curr) {
        prevCoordinatesRef.current = curr;
        coordinatesRef.current = curr;
        return true;
      }
      return false;
    }
    
    if (prev.length !== curr.length || prev[0] !== curr[0] || prev[1] !== curr[1]) {
      prevCoordinatesRef.current = curr;
      coordinatesRef.current = curr;
      return true;
    }
    return false;
  }, [coordinates]);

  // Get car coordinates
  const getCarCoordinates = () => {
    if (carLocation && carLocation.coordinates && carLocation.coordinates.length === 2) {
      // carLocation.coordinates is [longitude, latitude]
      return {
        lat: carLocation.coordinates[1],
        lng: carLocation.coordinates[0]
      };
    } else if (coordinates && coordinates.length === 2) {
      // coordinates is [latitude, longitude]
      return {
        lat: coordinates[0],
        lng: coordinates[1]
      };
    }
    return null;
  };

  // Calculate route when both locations are available
  useEffect(() => {
    if (userLocation && getCarCoordinates()) {
      const carCoords = getCarCoordinates();
      if (!carCoords) return;
      
      setIsCalculatingRoute(true);
      
      calculateRoute(
        userLocation[0], userLocation[1],
        carCoords.lat, carCoords.lng
      ).then((routeData) => {
        if (routeData) {
          setRoute(routeData.route);
          setDistance(routeData.distance);
          setTravelTime(routeData.duration);
        }
        setIsCalculatingRoute(false);
      }).catch(() => {
        setIsCalculatingRoute(false);
      });
    }
  }, [userLocation, coordinatesChanged]);

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          setShowLocationPicker(false);
          toast.success("Location updated");
        },
        (err) => {
          setError("Unable to get your location");
          console.error("Geolocation error:", err);
          toast.error("Failed to get location. Please allow location access.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      toast.error("Geolocation not supported");
    }
  };

  // Auto-get location on mount (optional)
  useEffect(() => {
    // Don't auto-get, let user choose
  }, []);

  // Update coordinates ref is handled in coordinatesChanged useMemo

  // Update map center when user location is found
  useEffect(() => {
    const currentCoords = coordinatesRef.current;
    if (!currentCoords || !Array.isArray(currentCoords) || currentCoords.length !== 2) {
      return;
    }
    
    if (userLocation && Array.isArray(userLocation) && userLocation.length === 2) {
      // Center between user and car location
      const centerLat = (userLocation[0] + currentCoords[0]) / 2;
      const centerLng = (userLocation[1] + currentCoords[1]) / 2;
      
      // Only update if actually different
      const [existingLat, existingLng] = mapCenter;
      if (Math.abs(centerLat - existingLat) > 0.0001 || Math.abs(centerLng - existingLng) > 0.0001) {
        setMapCenter([centerLat, centerLng]);
        setMapZoom(12);
      }
    } else {
      // Only update if coordinates actually changed
      const [currentLat, currentLng] = currentCoords;
      const [existingLat, existingLng] = mapCenter;
      
      // Check if coordinates are actually different (with small tolerance for floating point)
      if (Math.abs(currentLat - existingLat) > 0.0001 || Math.abs(currentLng - existingLng) > 0.0001) {
        setMapCenter([currentLat, currentLng]);
        setMapZoom(13);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, coordinatesChanged]);

  // Search for locations
  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Sello.ae Location Picker'
          }
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const results = data.map((item) => ({
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }));
        setSearchResults(results);
      } else {
        const googleApiKey = import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (googleApiKey) {
          const googleResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${googleApiKey}`
          );
          const googleData = await googleResponse.json();
          
          if (googleData.status === 'OK' && googleData.results.length > 0) {
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
  };

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const timeoutId = setTimeout(() => {
        searchLocation(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSelectResult = (result) => {
    // If user is selecting their location
    if (showLocationPicker) {
      setUserLocation([result.lat, result.lon]);
      setShowLocationPicker(false);
      toast.success("Your location set");
    } else {
      // Just viewing/searching
      setMapCenter([result.lat, result.lon]);
      setMapZoom(15);
      setSearchQuery(result.display_name);
      setSearchResults([]);
      toast.success("Location found");
    }
  };

  // Handle map click to set user location
  const handleMapClick = (e) => {
    if (showLocationPicker) {
      setUserLocation([e.latlng.lat, e.latlng.lng]);
      setShowLocationPicker(false);
      toast.success("Location set");
    }
  };

  const userLocationIcon = createUserLocationIcon();
  const carLocationIcon = createCarLocationIcon();

  const carCoords = getCarCoordinates();

  return (
    <div className="w-full">
      {/* Top Navigation Bar - Like reference screenshot */}
      {userLocation && carCoords && (
        <div className="mb-3 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex items-center gap-4">
                {travelTime !== null && (
                  <div>
                    <div className="text-xs text-gray-500">Time</div>
                    <div className="text-sm font-bold text-gray-900">
                      {Math.round(travelTime)} min
                    </div>
                  </div>
                )}
                {distance !== null && (
                  <div>
                    <div className="text-xs text-gray-500">Distance</div>
                    <div className="text-sm font-bold text-gray-900">
                      {distance.toFixed(1)} km
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setUserLocation(null);
                  setRoute(null);
                  setDistance(null);
                  setTravelTime(null);
                  toast.success("Route cleared");
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                title="Clear route"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Selection Bar */}
      <div className="mb-3 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="flex items-center px-4 py-3">
          <div className="flex-1">
            {userLocation ? (
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Your Location</div>
                <div className="text-sm font-medium text-gray-900">
                  {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Set Your Location</div>
                <div className="text-sm text-gray-400">To see route and distance</div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (showLocationPicker) {
                setShowLocationPicker(false);
                setSearchQuery("");
                setSearchResults([]);
              } else {
                setShowLocationPicker(true);
              }
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              userLocation
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {showLocationPicker ? "Cancel" : userLocation ? "Change" : "Set Location"}
          </button>
          {!showLocationPicker && (
            <button
              onClick={getCurrentLocation}
              className="ml-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              title="Use current location"
            >
              📍
            </button>
          )}
        </div>
      </div>

      {/* Search bar */}
      {showLocationPicker && (
        <div className="mb-3 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden relative">
        <div className="flex items-center px-4 py-3">
          <div className="flex-shrink-0 mr-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for nearby places..."
            className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400"
          />
          {isSearching && (
            <div className="flex-shrink-0 ml-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
          {searchQuery && !isSearching && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 max-h-60 overflow-y-auto z-[1000] shadow-lg">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelectResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {result.display_name}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        </div>
      )}
      
      {error && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}
      
      <div className="w-full h-[450px] md:h-[500px] rounded-lg overflow-hidden border border-gray-300 shadow-md relative" style={{ zIndex: 1 }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", zIndex: 1, position: "relative" }}
          eventHandlers={showLocationPicker ? {
            click: handleMapClick
          } : {}}
        >
          <MapUpdater center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Route line - Blue line connecting user and car */}
          {route && route.length > 0 && (
            <Polyline
              positions={route}
              pathOptions={{
                color: '#3B82F6',
                weight: 5,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          )}
          
          {/* Car location marker - Red teardrop */}
          {carCoords && (
            <Marker position={[carCoords.lat, carCoords.lng]} icon={carLocationIcon}>
              <Popup>
                <div className="text-center">
                  <strong className="text-red-600">🚗 Car Location</strong>
                  {distance !== null && (
                    <p className="text-xs mt-1 text-gray-600">{distance.toFixed(1)} km away</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* User location marker - Blue circle */}
          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon}>
              <Popup>
                <div className="text-center">
                  <strong className="text-blue-600">📍 Your Location</strong>
                  {distance !== null && (
                    <p className="text-xs mt-1 text-gray-600">{distance.toFixed(1)} km from car</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Loading indicator for route calculation */}
          {isCalculatingRoute && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-[1000] border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-700">Calculating route...</span>
              </div>
            </div>
          )}

          {/* Instructions when location picker is active */}
          {showLocationPicker && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-[1000] border border-gray-200">
              <p className="text-sm text-gray-700 font-medium">
                🔍 Search above or click on map to set your location
              </p>
            </div>
          )}
        </MapContainer>
      </div>

      <style>{`
        .custom-user-location-marker, .custom-car-location-marker {
          background: transparent !important;
          border: none !important;
        }
        .user-pulse-ring, .car-pulse-ring {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          top: 0;
          left: 0;
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .user-pulse-ring {
          border: 3px solid #3B82F6;
        }
        .user-pulse-ring-delay {
          animation-delay: 1s;
        }
        .car-pulse-ring {
          border: 3px solid #EF4444;
        }
        .user-marker-pin, .car-marker-pin {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          top: 10px;
          left: 10px;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .user-marker-pin {
          background: #3B82F6;
        }
        .car-marker-pin {
          background: #EF4444;
        }
        .user-marker-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #1E40AF;
          border-radius: 50%;
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default MapView;
