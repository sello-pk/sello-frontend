import React, { useState, useEffect } from "react";

const SpecsUtility = ({ groupName, specsTypes, onChange, multiple, value }) => {
  const [selected, setSelected] = useState(multiple ? [] : (value || null));

  // Update selected when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSelected(multiple ? (Array.isArray(value) ? value : []) : value);
    }
  }, [value, multiple]);

  const handleChange = (titleValue) => {
    if (multiple) {
      const newSelected = selected.includes(titleValue)
        ? selected.filter((v) => v !== titleValue)
        : [...selected, titleValue];
      setSelected(newSelected);
      if (onChange) onChange(newSelected);
      return;
    }

    // Single select: allow toggle-off to clear the value
    const nextValue = selected === titleValue ? null : titleValue;
    setSelected(nextValue);
    if (onChange) onChange(nextValue);
  };

  return (
    <div className="flex items-center gap-4 py-4 pl-2 overflow-x-auto md:scrollbar-hide hideScrollbar">
      {specsTypes.map((item, index) => {
        const isChecked = multiple
          ? selected.includes(item.titleValue)
          : selected === item.titleValue;

        return (
          <div
            key={index}
            onClick={() => handleChange(item.titleValue)}
            className={`bg-[#F5F5F5] rounded-lg transition-shadow duration-200 flex flex-col items-center p-3 cursor-pointer min-w-[150px] h-[120px] ${
              isChecked ? "ring-2 ring-primary-500 shadow-md" : "shadow-sm"
            }`}
          >
            {/* Top section: Image + Checkbox/Radio */}
            <div className="flex w-full justify-between items-start">
              {item.image && (
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                  <img
                    className="w-full h-full object-contain"
                    src={item.image}
                    alt={item.titleValue}
                  />
                </div>
              )}

              {/* Checkbox / Radio Button */}
              <label className="relative flex items-center cursor-pointer">
                <input
                  type={multiple ? "checkbox" : "radio"}
                  checked={isChecked}
                  name={groupName}
                  readOnly
                  aria-label={item.titleValue}
                  className={`peer h-5 w-5 appearance-none rounded-full bg-gray-100 shadow hover:shadow-md border border-gray-300 checked:border-primary-500 cursor-pointer transition-all ${
                    multiple ? "rounded" : "rounded-full"
                  }`}
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

            {/* Bottom section: Text / Color */}
            <div className="w-full mt-auto">
              {item.category === "color" ? (
                <div className="flex flex-col items-center gap-2 justify-center">
                  <span
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                    style={{ 
                      backgroundColor: item.hexColor || item.titleValue,
                      borderColor: item.hexColor === "#FFFFFF" || item.titleValue === "White" ? "#E5E7EB" : "transparent"
                    }}
                  ></span>
                  <span className="text-xs font-medium text-gray-700 truncate text-center w-full">
                    {item.titleValue}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-700 block text-center truncate">
                  {item.titleValue}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SpecsUtility;
