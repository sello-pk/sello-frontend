import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiMoreVertical, FiEdit, FiTrash2, FiEye, FiCopy } from "react-icons/fi";

/**
 * Reusable Action Dropdown Component with Portal
 * Prevents scrollbar issues by rendering outside scrollable containers
 */
const ActionDropdown = ({
  actions = [],
  onDelete,
  onEdit,
  onView,
  onCopy,
  item,
  itemName = "item",
  deleteConfirmMessage = "Are you sure you want to delete this item? This action cannot be undone.",
  showDeleteConfirm = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleToggle = (e) => {
    e.stopPropagation();
    
    if (isOpen) {
      setIsOpen(false);
      setPosition({ top: 0, left: 0 });
    } else {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 192; // w-48 = 192px
      const dropdownHeight = actions.length * 40 + 20; // Approximate height
      const gap = 8; // mt-2 = 8px
      
      let top = rect.bottom + gap;
      let left = rect.right - dropdownWidth;
      
      // Check if dropdown would go off-screen to the right
      if (left < 0) {
        left = rect.left;
      }
      
      // Check if dropdown would go off-screen to the bottom
      const viewportHeight = window.innerHeight;
      if (top + dropdownHeight > viewportHeight) {
        // Position above the button instead
        top = rect.top - dropdownHeight - gap;
        // If still off-screen at top, position at bottom of viewport
        if (top < 0) {
          top = viewportHeight - dropdownHeight - 10;
        }
      }
      
      setPosition({ top, left });
      setIsOpen(true);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isOpen) return;

      const isDropdownButton = buttonRef.current && buttonRef.current.contains(event.target);
      const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);

      if (!isDropdownButton && !isInsideDropdown) {
        setIsOpen(false);
        setPosition({ top: 0, left: 0 });
      }
    };

    if (isOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Update dropdown position on scroll/resize
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 192;
      const dropdownHeight = actions.length * 40 + 20;
      const gap = 8;
      
      let top = rect.bottom + gap;
      let left = rect.right - dropdownWidth;
      
      if (left < 0) {
        left = rect.left;
      }
      
      const viewportHeight = window.innerHeight;
      if (top + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - gap;
        if (top < 0) {
          top = viewportHeight - dropdownHeight - 10;
        }
      }
      
      setPosition({ top, left });
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, actions.length]);

  const handleAction = (action, handler) => {
    if (handler) {
      handler(item);
    }
    setIsOpen(false);
    setPosition({ top: 0, left: 0 });
  };

  // Build actions list
  const actionList = [];
  
  if (onView) {
    actionList.push({
      label: "View Details",
      icon: FiEye,
      onClick: () => handleAction("view", onView),
      className: "text-gray-700 hover:bg-gray-100"
    });
  }
  
  if (onEdit) {
    actionList.push({
      label: "Edit",
      icon: FiEdit,
      onClick: () => handleAction("edit", onEdit),
      className: "text-gray-700 hover:bg-gray-100"
    });
  }
  
  if (onCopy) {
    actionList.push({
      label: "Copy",
      icon: FiCopy,
      onClick: () => handleAction("copy", onCopy),
      className: "text-gray-700 hover:bg-gray-100"
    });
  }
  
  if (onDelete) {
    actionList.push({
      label: "Delete",
      icon: FiTrash2,
      onClick: () => {
        if (showDeleteConfirm) {
          // Trigger delete with confirmation - parent should handle modal
          onDelete(item);
        } else {
          handleAction("delete", onDelete);
        }
        setIsOpen(false);
        setPosition({ top: 0, left: 0 });
      },
      className: "text-red-600 hover:bg-red-50"
    });
  }
  
  // Add custom actions
  actions.forEach(action => {
    actionList.push({
      ...action,
      onClick: () => {
        if (action.onClick) action.onClick(item);
        setIsOpen(false);
        setPosition({ top: 0, left: 0 });
      }
    });
  });

  return (
    <>
      <div className="relative inline-block">
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
          aria-label="Actions menu"
        >
          <FiMoreVertical size={20} />
        </button>
      </div>

      {/* Portal Dropdown - Rendered outside scrollable container */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] py-1"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto'
          }}
        >
          {actionList.map((action, index) => {
            const Icon = action.icon;
            const isLast = index === actionList.length - 1;
            const isDelete = action.label === "Delete";
            
            return (
              <React.Fragment key={index}>
                {isDelete && actionList.length > 1 && (
                  <hr className="my-1 border-gray-200" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${action.className || "text-gray-700 hover:bg-gray-100"}`}
                >
                  {Icon && <Icon size={14} />}
                  {action.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};

export default ActionDropdown;

