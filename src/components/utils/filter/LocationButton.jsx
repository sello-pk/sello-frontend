import React, { useState } from "react";
import { images } from "../../../assets/assets";
import LocationPickerModal from "../../utils/filter/LocationPickerModal";

const LocationButton = ({ onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");

  const handleSelect = async (coords) => {
    setLocation(coords);

    try {
      // Call Google Geocoding API
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${
          coords.lat
        },${coords.lng}&key=${
          import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY
        }`
      );
      const data = await res.json();

      if (data.status === "OK" && data.results.length > 0) {
        const formattedAddress = data.results[0].formatted_address;
        setAddress(formattedAddress);

        // Store both coords and address in parent form
        onChange({
          coordinates: coords,
          address: formattedAddress,
          formatted: `${formattedAddress} (${coords.lat.toFixed(
            6
          )}, ${coords.lng.toFixed(6)})`,
        });
      } else {
        setAddress("Unknown location");
        onChange({
          coordinates: coords,
          address: "Unknown location",
          formatted: `Unknown location (${coords.lat.toFixed(
            6
          )}, ${coords.lng.toFixed(6)})`,
        });
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setAddress("Unknown location");
      onChange({
        coordinates: coords,
        address: "Unknown location",
        formatted: `Unknown location (${coords.lat.toFixed(
          6
        )}, ${coords.lng.toFixed(6)})`,
      });
    }
  };

  return (
    <div>
      <div
        onClick={() => setIsOpen(true)}
        className="border p-3 rounded-lg border-gray-500 cursor-pointer hover:bg-gray-100 flex items-center justify-between w-full"
      >
        <img src={images.location} alt="" />
        <p className="text-sm">{address || "Select Location"}</p>
      </div>

      <LocationPickerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={handleSelect}
      />
    </div>
  );
};

export default LocationButton;
