import React, { useState, useRef, useEffect } from 'react';

/**
 * Tooltip Component
 * Provides helpful tooltips for icons and buttons
 */
const Tooltip = ({
    children,
    content,
    position = 'top',
    delay = 200,
    className = ''
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);
    let timeoutId = null;

    const showTooltip = () => {
        timeoutId = setTimeout(() => {
            if (triggerRef.current && tooltipRef.current) {
                const triggerRect = triggerRef.current.getBoundingClientRect();
                const tooltipRect = tooltipRef.current.getBoundingClientRect();
                const scrollY = window.scrollY || window.pageYOffset;
                const scrollX = window.scrollX || window.pageXOffset;

                let top = 0;
                let left = 0;

                switch (position) {
                    case 'top':
                        top = triggerRect.top + scrollY - tooltipRect.height - 8;
                        left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
                        break;
                    case 'bottom':
                        top = triggerRect.bottom + scrollY + 8;
                        left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
                        break;
                    case 'left':
                        top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
                        left = triggerRect.left + scrollX - tooltipRect.width - 8;
                        break;
                    case 'right':
                        top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
                        left = triggerRect.right + scrollX + 8;
                        break;
                    default:
                        top = triggerRect.top + scrollY - tooltipRect.height - 8;
                        left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
                }

                // Adjust if tooltip goes off screen
                if (left < 8) left = 8;
                if (left + tooltipRect.width > window.innerWidth - 8) {
                    left = window.innerWidth - tooltipRect.width - 8;
                }
                if (top < scrollY + 8) {
                    top = scrollY + 8;
                }

                setTooltipPosition({ top, left });
            }
            setIsVisible(true);
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []);

    return (
        <div
            ref={triggerRef}
            className={`relative inline-block ${className}`}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
        >
            {children}
            {isVisible && content && (
                <div
                    ref={tooltipRef}
                    className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none whitespace-nowrap"
                    style={{
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`,
                        transform: 'translate(0, 0)'
                    }}
                    role="tooltip"
                >
                    {content}
                    <div
                        className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
                            position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
                            position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
                            position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
                            'left-[-4px] top-1/2 -translate-y-1/2'
                        }`}
                    />
                </div>
            )}
        </div>
    );
};

export default Tooltip;

