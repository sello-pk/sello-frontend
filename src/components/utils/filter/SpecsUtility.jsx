import React, { useState, useEffect } from "react";

const SpecsUtility = ({
  groupName,
  specsTypes,
  onChange,
  multiple = false,
  value,
}) => {
  const [selected, setSelected] = useState(multiple ? [] : value || null);

  // Sync external value
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
      onChange?.(newSelected);
      return;
    }

    const nextValue = selected === titleValue ? null : titleValue;
    setSelected(nextValue);
    onChange?.(nextValue);
  };

  return (
    <div className="flex gap-3 py-3 pl-2 overflow-x-auto hideScrollbar">
      {specsTypes.map((item, index) => {
        const isChecked = multiple
          ? selected.includes(item.titleValue)
          : selected === item.titleValue;

        return (
          <div
            key={index}
            onClick={() => handleChange(item.titleValue)}
            className={`min-w-[160px] cursor-pointer rounded-lg border transition-all
              ${
                isChecked
                  ? "border-primary-500 ring-2 ring-primary-500 bg-white shadow-md"
                  : "border-gray-200 bg-[#F5F5F5] shadow-sm hover:shadow-md"
              }
            `}
          >
            {/* ROW CONTENT */}
            <div className="flex items-center gap-3 px-3 py-2">
              {/* Color / Image */}
              {item.category === "color" ? (
                <span
                  className="w-7 h-7 rounded-md border flex-shrink-0"
                  style={{
                    backgroundColor: item.hexColor || item.titleValue,
                    borderColor:
                      item.hexColor === "#FFFFFF" || item.titleValue === "White"
                        ? "#E5E7EB"
                        : "transparent",
                  }}
                />
              ) : item.image ? (
                <img
                  src={item.image}
                  alt={item.titleValue}
                  className="w-7 h-7 object-contain flex-shrink-0"
                />
              ) : null}

              {/* Text */}
              <span className="text-xs font-medium text-gray-700 truncate flex-1">
                {item.titleValue}
              </span>

              {/* Checkbox / Radio */}
              <label className="relative flex items-center flex-shrink-0">
                <input
                  type={multiple ? "checkbox" : "radio"}
                  checked={isChecked}
                  readOnly
                  name={groupName}
                  className={`peer h-5 w-5 appearance-none border border-gray-300 bg-white transition-all
                    ${multiple ? "rounded" : "rounded-full"}
                    checked:border-primary-500
                  `}
                />
                <span className="absolute inset-0 flex items-center justify-center text-primary-500 opacity-0 peer-checked:opacity-100 text-sm font-bold">
                  ✓
                </span>
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SpecsUtility;

// import React, { useState, useEffect } from "react";

// const SpecsUtility = ({ groupName, specsTypes, onChange, multiple, value }) => {
//   const [selected, setSelected] = useState(multiple ? [] : value || null);

//   // Update selected when value prop changes
//   useEffect(() => {
//     if (value !== undefined) {
//       setSelected(multiple ? (Array.isArray(value) ? value : []) : value);
//     }
//   }, [value, multiple]);

//   const handleChange = (titleValue) => {
//     if (multiple) {
//       const newSelected = selected.includes(titleValue)
//         ? selected.filter((v) => v !== titleValue)
//         : [...selected, titleValue];
//       setSelected(newSelected);
//       if (onChange) onChange(newSelected);
//       return;
//     }

//     // Single select: allow toggle-off to clear the value
//     const nextValue = selected === titleValue ? null : titleValue;
//     setSelected(nextValue);
//     if (onChange) onChange(nextValue);
//   };

//   return (
//     <div className="flex items-center gap-3 py-3 pl-2 overflow-x-auto md:scrollbar-hide hideScrollbar">
//       {specsTypes.map((item, index) => {
//         const isChecked = multiple
//           ? selected.includes(item.titleValue)
//           : selected === item.titleValue;

//         const hasIcon = !!item.image;
//         const isColor = item.category === "color";

//         // Compact sizes for all cards (reduced size):
//         // - color-only: smallest
//         // - icon cards: medium
//         // - text-only: slightly taller than color
//         const sizeClasses = isColor
//           ? "min-w-[95px] h-[75px] py-1"
//           : hasIcon
//           ? "min-w-[115px] h-[90px] py-1.5"
//           : "min-w-[105px] h-[80px] py-1.5";

//         return (
//           <div
//             key={index}
//             onClick={() => handleChange(item.titleValue)}
//             className={`bg-[#F5F5F5] rounded-lg transition-shadow duration-200 flex items-center p-2 cursor-pointer ${sizeClasses} ${
//               isChecked ? "ring-2 ring-primary-500 shadow-md" : "shadow-sm"
//             }`}
//           >
//             {/* Top section: Image + Checkbox/Radio */}
//             <div className="flex w-full justify-between items-start">
//               {item.image && (
//                 <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
//                   <img
//                     className="w-full h-full object-contain"
//                     src={item.image}
//                     alt={item.titleValue}
//                   />
//                 </div>
//               )}

//               {/* Checkbox / Radio Button */}
//               <label className="relative flex items-center cursor-pointer">
//                 <input
//                   type={multiple ? "checkbox" : "radio"}
//                   checked={isChecked}
//                   name={groupName}
//                   readOnly
//                   aria-label={item.titleValue}
//                   className={`peer h-5 w-5 appearance-none rounded-full bg-gray-100 shadow hover:shadow-md border border-gray-300 checked:border-primary-500 cursor-pointer transition-all ${
//                     multiple ? "rounded" : "rounded-full"
//                   }`}
//                 />
//                 <span className="absolute text-primary-500 opacity-0 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-3.5 w-3.5"
//                     viewBox="0 0 20 20"
//                     fill="currentColor"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 </span>
//               </label>
//             </div>

//             {/* Bottom section: Text / Color */}
//             <div className="w-full mt-auto">
//               {item.category === "color" ? (
//                 <div className="flex flex-col items-center gap-1.5 justify-center">
//                   <span
//                     className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
//                     style={{
//                       backgroundColor: item.hexColor || item.titleValue,
//                       borderColor:
//                         item.hexColor === "#FFFFFF" ||
//                         item.titleValue === "White"
//                           ? "#E5E7EB"
//                           : "transparent",
//                     }}
//                   ></span>
//                   <span className="text-xs font-medium text-gray-700 truncate text-center w-full">
//                     {item.titleValue}
//                   </span>
//                 </div>
//               ) : (
//                 <span className="text-xs font-medium text-gray-700 block text-center truncate">
//                   {item.titleValue}
//                 </span>
//               )}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default SpecsUtility;
