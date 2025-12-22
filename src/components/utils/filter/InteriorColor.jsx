import React, { useState, useEffect, useRef, useMemo } from "react";

// Common color names to hex mapping
const colorNames = {
  black: "#000000",
  white: "#FFFFFF",
  red: "#FF0000",
  blue: "#0000FF",
  green: "#008000",
  yellow: "#FFFF00",
  orange: "#FFA500",
  purple: "#800080",
  pink: "#FFC0CB",
  brown: "#8B4513",
  gray: "#808080",
  grey: "#808080",
  silver: "#C0C0C0",
  gold: "#FFD700",
  beige: "#F5F5DC",
  tan: "#D2B48C",
  maroon: "#800000",
  navy: "#000080",
  teal: "#008080",
  burgundy: "#800020",
  champagne: "#F7E7CE",
  pearl: "#F8F6F0",
  cream: "#FFFDD0",
  ivory: "#FFFFF0",
};

// Popular interior colors
const popularInteriorColors = [
  { name: "Black", hex: "#000000" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Brown", hex: "#8B4513" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "Gray", hex: "#808080" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#FF0000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Burgundy", hex: "#800020" },
];

const InteriorColor = ({ onChange, value }) => {
  const [selectedColor, setSelectedColor] = useState(value || "");
  const [hexInput, setHexInput] = useState(value ? value.replace("#", "") : "");
  const [colorNameInput, setColorNameInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [tempColor, setTempColor] = useState(value || "#000000");
  const [tempHexInput, setTempHexInput] = useState(value ? value.replace("#", "") : "000000");
  const [tempColorName, setTempColorName] = useState("");
  const [customColors, setCustomColors] = useState([]); // Track custom colors
  const colorInputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (value) {
      setSelectedColor(value);
      setHexInput(value.replace("#", ""));
      
      // Check if it matches a popular color
      const matchingPopularColor = popularInteriorColors.find(
        (color) => color.hex.toUpperCase() === value.toUpperCase()
      );
      
      if (matchingPopularColor) {
        setColorNameInput(matchingPopularColor.name);
      } else {
        // Try to find color name from colorNames
        const foundName = Object.keys(colorNames).find(
          (name) => colorNames[name].toUpperCase() === value.toUpperCase()
        );
        if (foundName) {
          setColorNameInput(foundName);
          // Add as custom color if not in popular list
          setCustomColors(prev => {
            const exists = prev.some(c => c.hex.toUpperCase() === value.toUpperCase());
            if (!exists) {
              return [{ name: foundName, hex: value, isCustom: true }, ...prev];
            }
            return prev;
          });
        } else {
          // Add as custom color with hex as name
          setCustomColors(prev => {
            const exists = prev.some(c => c.hex.toUpperCase() === value.toUpperCase());
            if (!exists) {
              return [{ name: `Custom ${value.toUpperCase()}`, hex: value, isCustom: true }, ...prev];
            }
            return prev;
          });
        }
      }
    }
  }, [value]);

  const handleColorSelect = (hexColor, colorName) => {
    setSelectedColor(hexColor);
    setHexInput(hexColor.replace("#", ""));
    setColorNameInput(colorName || "");
    if (onChange) {
      onChange(hexColor);
    }
  };

  const openModal = () => {
    setTempColor(selectedColor || "#000000");
    setTempHexInput(selectedColor ? selectedColor.replace("#", "") : "000000");
    setTempColorName(colorNameInput);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleModalColorPickerChange = (e) => {
    const newColor = e.target.value;
    setTempColor(newColor);
    setTempHexInput(newColor.replace("#", ""));
    setTempColorName("");
  };

  const handleModalHexInputChange = (e) => {
    const inputValue = e.target.value.toUpperCase();
    if (/^[0-9A-F]{0,6}$/.test(inputValue)) {
      setTempHexInput(inputValue);
      if (inputValue.length === 6) {
        const newColor = `#${inputValue}`;
        setTempColor(newColor);
        setTempColorName("");
      }
    }
  };

  const handleModalColorNameChange = (e) => {
    const inputValue = e.target.value.toLowerCase().trim();
    setTempColorName(inputValue);

    if (colorNames[inputValue]) {
      const hexColor = colorNames[inputValue];
      setTempColor(hexColor);
      setTempHexInput(hexColor.replace("#", ""));
    }
  };

  const applyCustomColor = () => {
    // Check if the custom color matches any popular color
    const matchingPopularColor = popularInteriorColors.find(
      (color) => color.hex.toUpperCase() === tempColor.toUpperCase()
    );
    
    // If it matches a popular color, use the popular color's exact hex to ensure selection works
    const finalColor = matchingPopularColor ? matchingPopularColor.hex : tempColor;
    const finalHexInput = matchingPopularColor ? matchingPopularColor.hex.replace("#", "") : tempHexInput;
    const finalColorName = matchingPopularColor ? matchingPopularColor.name : (tempColorName || `Custom ${tempColor.toUpperCase()}`);
    
    setSelectedColor(finalColor);
    setHexInput(finalHexInput);
    setColorNameInput(finalColorName);
    
    // Add custom color to the list if it doesn't match a popular color
    if (!matchingPopularColor) {
      const customColorEntry = {
        name: finalColorName,
        hex: finalColor,
        isCustom: true
      };
      setCustomColors(prev => {
        // Remove if already exists and add to beginning
        const filtered = prev.filter(c => c.hex.toUpperCase() !== finalColor.toUpperCase());
        return [customColorEntry, ...filtered];
      });
    }
    
    if (onChange) {
      onChange(finalColor);
    }
    closeModal();
  };


  const isSelected = (hexColor) => {
    if (!selectedColor || !hexColor) return false;
    // Normalize both colors for comparison (remove # if present, uppercase)
    const normalize = (color) => color.replace("#", "").toUpperCase();
    return normalize(selectedColor) === normalize(hexColor);
  };

  // Combine custom colors (at start) with popular colors, filtering out duplicates
  const allColors = useMemo(() => {
    const customColorsList = customColors.map(c => ({ ...c, isCustom: true }));
    const popularColorsList = popularInteriorColors.filter(
      popColor => !customColors.some(custom => 
        custom.hex.toUpperCase() === popColor.hex.toUpperCase()
      )
    );
    return [...customColorsList, ...popularColorsList];
  }, [customColors]);

  return (
    <div>
      <label className="block mb-1 pl-2">Interior Color</label>
      {/* Color Cards Grid - Same style as other SpecsUtility components */}
      <div className="flex items-center gap-4 py-4 pl-2 overflow-x-auto md:scrollbar-hide hideScrollbar">
        {allColors.map((color, index) => {
          const selected = isSelected(color.hex);
          return (
            <div
              key={`${color.hex}-${index}`}
              onClick={() => handleColorSelect(color.hex, color.name)}
              className={`bg-[#F5F5F5] rounded-lg transition-shadow duration-200 flex flex-col items-center p-3 cursor-pointer min-w-[150px] h-[120px] ${
                selected ? "ring-2 ring-primary-500 shadow-md" : "shadow-sm"
              }`}
            >
              {/* Top section: Radio Button */}
              <div className="flex w-full justify-between items-start">
                {/* Color Swatch */}
                <div
                  className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: color.hex }}
                ></div>

                {/* Radio Button */}
                <label className="relative flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={selected}
                    name="interiorColor"
                    readOnly
                    aria-label={color.name}
                    className={`peer h-5 w-5 appearance-none rounded-full bg-gray-100 shadow hover:shadow-md border border-gray-300 checked:border-primary-500 cursor-pointer transition-all`}
                  />
                  <span className="absolute text-primary-500 opacity-0 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </label>
              </div>

              {/* Bottom section: Color Name */}
              <div className="w-full mt-auto">
                <span className="text-sm font-medium text-gray-700 block text-center truncate">
                  {color.name}
                </span>
                {color.isCustom && (
                  <span className="text-xs text-primary-600 block text-center mt-1">Custom</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Color Button */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={openModal}
          className="px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md border border-primary-200 transition-colors"
        >
          + Custom Color
        </button>
      </div>

      {/* Color Picker Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Select Custom Color</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Large Color Preview */}
            <div className="flex items-center justify-center">
              <div
                className="w-32 h-32 rounded-lg border-4 border-gray-300 shadow-lg"
                style={{ backgroundColor: tempColor }}
              ></div>
            </div>

            {/* Color Picker Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Picker
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-md cursor-pointer flex-shrink-0"
                  style={{ backgroundColor: tempColor }}
                  onClick={() => colorInputRef.current?.click()}
                ></div>
                <input
                  ref={colorInputRef}
                  type="color"
                  value={tempColor}
                  onChange={handleModalColorPickerChange}
                  className="sr-only"
                />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Click the color box to open color picker</p>
                  <div className="text-lg font-mono font-semibold text-gray-700">
                    {tempColor.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Hex Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hex Code
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-mono text-lg font-semibold">#</span>
                <input
                  type="text"
                  value={tempHexInput}
                  onChange={handleModalHexInputChange}
                  placeholder="000000"
                  maxLength={6}
                  className="flex-1 px-4 py-3 font-mono text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase font-semibold"
                />
              </div>
            </div>

            {/* Color Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Name (Optional)
              </label>
              <input
                type="text"
                value={tempColorName}
                onChange={handleModalColorNameChange}
                placeholder="Type color name (e.g., Red, Blue)"
                className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {tempColorName && colorNames[tempColorName.toLowerCase()] && (
                <p className="mt-1 text-xs text-green-600">✓ Color name recognized</p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCustomColor}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
              >
                Apply Color
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteriorColor;
