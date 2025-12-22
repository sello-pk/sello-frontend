import React, { useState, useRef, useEffect } from "react";

const ColorPicker = ({ value, onChange, label }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [customColor, setCustomColor] = useState(value || "#000000");
  const pickerRef = useRef(null);

  useEffect(() => {
    if (value && value.startsWith("#")) {
      setCustomColor(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    if (onChange) {
      onChange(newColor);
    }
  };

  return (
    <div className="relative" ref={pickerRef}>
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          style={{ backgroundColor: customColor }}
          onClick={() => setShowPicker(!showPicker)}
        ></div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {label || "Custom Color"}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  setCustomColor(val);
                  if (val.length === 7 && onChange) {
                    onChange(val);
                  }
                }
              }}
              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="#000000"
            />
            {showPicker && (
              <input
                type="color"
                value={customColor}
                onChange={handleColorChange}
                className="w-10 h-10 cursor-pointer border border-gray-300 rounded"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
