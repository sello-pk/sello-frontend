import React, { useState } from "react";
import { images } from "../../../assets/assets";
import LocationPickerModal from "../../utils/filter/LocationPickerModal";
import toast from "react-hot-toast";

const LocationButton = ({ onChange, value = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");

  // Initialize with provided value
  React.useEffect(() => {
    if (value) {
      try {
        let coords = null;
        if (typeof value === "string") {
          coords = JSON.parse(value);
        } else if (Array.isArray(value)) {
          coords = value;
        } else if (value.coordinates) {
          coords = value.coordinates;
        }

        if (coords && Array.isArray(coords) && coords.length === 2) {
          setLocation({ lat: coords[1], lng: coords[0] });
          if (value.address) {
            setAddress(value.address);
          }
        }
      } catch (error) {
        console.error("Error parsing location value:", error);
      }
    }
  }, [value]);

  const handleSelect = async (locationData) => {
    if (!locationData?.coordinates) {
      toast.error("Invalid location data");
      return;
    }

    const coords = locationData.coordinates;
    setLocation(coords);
    setAddress(locationData.address || locationData.formatted || "");

    // Convert to [longitude, latitude] format for backend
    const backendCoords = [coords.lng, coords.lat];

    // Call parent onChange with both coordinates and address
    onChange({
      coordinates: coords,
      address: locationData.address || locationData.formatted || "",
      formatted:
        locationData.formatted ||
        `${locationData.address || "Location"} (${coords.lat.toFixed(
          6
        )}, ${coords.lng.toFixed(6)})`,
      backendFormat: JSON.stringify(backendCoords),
    });
  };

  return (
    <div>
      <div
        onClick={() => setIsOpen(true)}
        className="border p-3 rounded-lg border-gray-500 cursor-pointer hover:bg-gray-100 flex items-center justify-between w-full transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <img src={images.location} alt="Location" className="w-5 h-5" />
          <p className="text-sm text-gray-700 flex-1">
            {address || "Select Location"}
          </p>
        </div>
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>

      {address && (
        <p className="text-xs text-gray-500 mt-1 pl-2">✓ Location set</p>
      )}

      <LocationPickerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={handleSelect}
        initialLocation={location ? [location.lng, location.lat] : null}
      />
    </div>
  );
};

export default LocationButton;
