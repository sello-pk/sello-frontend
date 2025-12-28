import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Tooltip Component
 * Provides helpful tooltips for icons and buttons
 */
const Tooltip = ({
  children,
  content,
  position = "top",
  delay = 200,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();

        // Create a temporary element to measure tooltip size
        const tempTooltip = document.createElement("div");
        tempTooltip.style.cssText =
          "position: fixed; visibility: hidden; z-index: -9999; padding: 8px 12px; font-size: 14px; white-space: nowrap;";
        tempTooltip.textContent = content;
        document.body.appendChild(tempTooltip);
        const tooltipRect = tempTooltip.getBoundingClientRect();
        document.body.removeChild(tempTooltip);

        let top = 0;
        let left = 0;

        switch (position) {
          case "top":
            top = triggerRect.top - tooltipRect.height - 8;
            left =
              triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            break;
          case "bottom":
            top = triggerRect.bottom + 8;
            left =
              triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            break;
          case "left":
            top =
              triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            left = triggerRect.left - tooltipRect.width - 8;
            break;
          case "right":
            top =
              triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            left = triggerRect.right + 8;
            break;
          default:
            top = triggerRect.top - tooltipRect.height - 8;
            left =
              triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        }

        // Adjust if tooltip goes off screen
        if (left < 8) left = 8;
        if (left + tooltipRect.width > window.innerWidth - 8) {
          left = window.innerWidth - tooltipRect.width - 8;
        }
        if (top < 8) {
          top = triggerRect.bottom + 8; // Show below if no space above
        }
        if (top + tooltipRect.height > window.innerHeight - 8) {
          top = triggerRect.top - tooltipRect.height - 8; // Show above if no space below
        }

        setTooltipPosition({ top, left });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      className={`inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible &&
        content &&
        createPortal(
          <div
            ref={tooltipRef}
            className="fixed z-[9999] px-3 py-2 text-xs md:text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none max-w-xs md:max-w-sm break-words"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: "translate(0, 0)",
            }}
            role="tooltip"
          >
            {content}
            <div
              className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
                position === "top"
                  ? "bottom-[-4px] left-1/2 -translate-x-1/2"
                  : position === "bottom"
                  ? "top-[-4px] left-1/2 -translate-x-1/2"
                  : position === "left"
                  ? "right-[-4px] top-1/2 -translate-y-1/2"
                  : "left-[-4px] top-1/2 -translate-y-1/2"
              }`}
            />
          </div>,
          document.body
        )}
    </div>
  );
};

export default Tooltip;
