import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, Circle, useMap } from "react-leaflet";
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

// Create custom blue pulsing marker icon
const createPulsingMarker = () => {
  return L.divIcon({
    className: 'custom-pulsing-marker',
    html: `
      <div style="position: relative;">
        <div class="pulse-ring"></div>
        <div class="pulse-ring pulse-ring-delay"></div>
        <div class="marker-pin">
          <div class="marker-dot"></div>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

// Component to handle map clicks and marker dragging
function LocationMarker({ position, onPositionChange }) {
  const [markerPosition, setMarkerPosition] = useState(position);
  const markerRef = useRef(null);
  const pulsingIcon = useRef(createPulsingMarker());

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setMarkerPosition(newPos);
      onPositionChange([e.latlng.lng, e.latlng.lat]); // [longitude, latitude] for backend
    },
  });

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPos = [marker.getLatLng().lat, marker.getLatLng().lng];
        setMarkerPosition(newPos);
        onPositionChange([marker.getLatLng().lng, marker.getLatLng().lat]); // [longitude, latitude] for backend
      }
    },
  };

  return (
    <>
      <Marker
        position={markerPosition}
        draggable={true}
        eventHandlers={eventHandlers}
        ref={markerRef}
        icon={pulsingIcon.current}
      >
        <Popup>
          <div className="text-center">
            <strong>📍 Car Location</strong>
            <p className="text-xs mt-1">Drag to adjust</p>
          </div>
        </Popup>
      </Marker>
      {/* Pulsing circle effect */}
      <Circle
        center={markerPosition}
        radius={100}
        pathOptions={{
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.1,
          weight: 2,
        }}
      />
    </>
  );
}

// Component to update map view when location changes
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

const LocationPicker = ({ onLocationChange, initialLocation = null }) => {
  const [location, setLocation] = useState(() => {
    if (initialLocation) {
      try {
        const parsed = typeof initialLocation === 'string' 
          ? JSON.parse(initialLocation) 
          : initialLocation;
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");

  // Default center: Dubai, UAE
  const defaultCenter = [25.2048, 55.2708];
  const [mapCenter, setMapCenter] = useState(() => {
    if (location && Array.isArray(location) && location.length === 2) {
      // location is [longitude, latitude], convert to [latitude, longitude] for map
      return [location[1], location[0]];
    }
    return defaultCenter;
  });
  const [mapZoom, setMapZoom] = useState(13);

  // Try to get user's current location on mount, or use default
  useEffect(() => {
    if (!location) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const coords = [lng, lat]; // [longitude, latitude] for backend
            setLocation(coords);
            setMapCenter([lat, lng]);
            onLocationChange(JSON.stringify(coords));
          },
          () => {
            // If geolocation fails, use default center and set it
            const defaultCoords = [defaultCenter[1], defaultCenter[0]]; // [longitude, latitude]
            setLocation(defaultCoords);
            setMapCenter(defaultCenter);
            onLocationChange(JSON.stringify(defaultCoords));
          }
        );
      } else {
        // Geolocation not supported, use default
        const defaultCoords = [defaultCenter[1], defaultCenter[0]]; // [longitude, latitude]
        setLocation(defaultCoords);
        setMapCenter(defaultCenter);
        onLocationChange(JSON.stringify(defaultCoords));
      }
    }
  }, []);

  const handlePositionChange = (coords) => {
    setLocation(coords);
    onLocationChange(JSON.stringify(coords));
    // Try to get address for the selected location
    reverseGeocode(coords[1], coords[0]);
  };

  // Search for locations using OpenStreetMap Nominatim (free, no API key needed)
  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Try OpenStreetMap Nominatim first (free, no API key)
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
          address: item.address || {},
        }));
        setSearchResults(results);
      } else {
        // Fallback to Google Geocoding if available
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
              address: {},
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

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      // Try OpenStreetMap Nominatim first
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Sello.ae Location Picker'
          }
        }
      );
      const data = await response.json();

      if (data && data.display_name) {
        setSelectedAddress(data.display_name);
      } else {
        // Fallback to Google if available
        const googleApiKey = import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (googleApiKey) {
          const googleResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`
          );
          const googleData = await googleResponse.json();
          
          if (googleData.status === 'OK' && googleData.results.length > 0) {
            setSelectedAddress(googleData.results[0].formatted_address);
          }
        }
      }
    } catch (error) {
      console.error("Reverse geocode error:", error);
    }
  };

  // Debounce search with useEffect
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectResult = (result) => {
    const coords = [result.lon, result.lat]; // [longitude, latitude] for backend
    setLocation(coords);
    setMapCenter([result.lat, result.lon]);
    setMapZoom(15);
    setSelectedAddress(result.display_name);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    onLocationChange(JSON.stringify(coords));
    toast.success("Location selected");
  };

  return (
    <div className="w-full">
      {/* Search bar - styled like "Where to?" reference */}
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
            onChange={handleSearchChange}
            placeholder="Search for an address or place..."
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
                    <div className="text-xs text-gray-500 mt-0.5">
                      {result.lat.toFixed(4)}, {result.lon.toFixed(4)}
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

      {/* Location display bar */}
      {location && (
        <div className="mb-3 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="flex items-center px-4 py-3">
            <div className="flex-shrink-0 mr-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-0.5">Selected Location</div>
              {selectedAddress ? (
                <div className="text-sm font-medium text-gray-900 truncate">{selectedAddress}</div>
              ) : (
                <div className="text-sm font-medium text-gray-900">
                  {location[1].toFixed(4)}, {location[0].toFixed(4)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-full h-[450px] rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg relative">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} zoom={mapZoom} />
          <LocationMarker
            position={mapCenter}
            onPositionChange={handlePositionChange}
          />
        </MapContainer>
        
        {/* Instructions overlay */}
        {!location && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-[1000] border border-gray-200">
            <p className="text-sm text-gray-700 font-medium">
              🔍 Search above or click on map to set location
            </p>
          </div>
        )}
      </div>
      
      <style>{`
        .custom-pulsing-marker {
          background: transparent !important;
          border: none !important;
        }
        .pulse-ring {
          position: absolute;
          width: 40px;
          height: 40px;
          border: 3px solid #3B82F6;
          border-radius: 50%;
          top: 0;
          left: 0;
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .pulse-ring-delay {
          animation-delay: 1s;
        }
        .marker-pin {
          position: absolute;
          width: 20px;
          height: 20px;
          background: #3B82F6;
          border-radius: 50%;
          top: 10px;
          left: 10px;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .marker-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #1E40AF;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
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

export default LocationPicker;

