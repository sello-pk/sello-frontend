import React, { useState } from "react";
import { FiEdit2, FiTrash2, FiCheck, FiCheckCircle } from "react-icons/fi";
import { format } from "date-fns";

const MessageBubble = ({
  message,
  isCurrentUser,
  currentUserId,
  onEdit,
  onDelete,
  showAvatar = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message || "");

  const canEdit = isCurrentUser && !message.isDeleted;
  const canDelete = isCurrentUser && !message.isDeleted;
  const isRead = message.isRead || false;

  const handleEdit = () => {
    if (editText.trim() && editText !== message.message) {
      onEdit(message._id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(message.message || "");
    setIsEditing(false);
  };

  const formatTime = (date) => {
    try {
      return format(new Date(date), "h:mm a");
    } catch {
      return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (message.isDeleted) {
    return (
      <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} my-2`}>
        <div className="max-w-[70%] px-3 py-2 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-400 italic">This message was deleted</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} group my-2`}
    >
      <div className={`flex items-end gap-2 max-w-[70%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        {showAvatar && !isCurrentUser && (
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden">
            {message.sender?.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender?.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              (message.sender?.name || "U").charAt(0).toUpperCase()
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`rounded-lg px-4 py-2 shadow-sm ${
            isCurrentUser
              ? "bg-primary-500 text-white rounded-tr-none"
              : "bg-white text-gray-900 rounded-tl-none border border-gray-200"
          }`}
        >
          {/* Sender Name (for group chats) */}
          {!isCurrentUser && message.sender?.name && (
            <p className="text-xs font-semibold mb-1 text-gray-700">
              {message.sender.name}
            </p>
          )}

          {/* Message Content */}
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleEdit();
                  } else if (e.key === "Escape") {
                    handleCancel();
                  }
                }}
                className="w-full px-2 py-1 bg-white text-gray-900 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="text-xs px-2 py-1 bg-primary-500 text-white rounded hover:opacity-90 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.message}
              </p>
              {message.isEdited && (
                <p className="text-xs italic mt-1 opacity-75">(edited)</p>
              )}
            </>
          )}

          {/* Message Footer */}
          <div className="flex items-center justify-end gap-1 mt-1">
            <span
              className={`text-xs ${
                isCurrentUser ? "text-primary-100" : "text-gray-500"
              }`}
            >
              {formatTime(message.createdAt)}
            </span>
            {isCurrentUser && (
              <span className="ml-1">
                {isRead ? (
                  <FiCheckCircle
                    className="text-blue-400"
                    size={14}
                    title="Read"
                  />
                ) : (
                  <FiCheck
                    className={isCurrentUser ? "text-primary-100" : "text-gray-400"}
                    size={14}
                    title="Sent"
                  />
                )}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {!isEditing && (canEdit || canDelete) && (
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`p-1 rounded hover:bg-opacity-20 ${
                    isCurrentUser
                      ? "hover:bg-white text-white"
                      : "hover:bg-primary-500 text-gray-600"
                  } transition-colors`}
                  title="Edit message"
                >
                  <FiEdit2 size={12} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this message?")) {
                      onDelete(message._id);
                    }
                  }}
                  className={`p-1 rounded hover:bg-opacity-20 ${
                    isCurrentUser
                      ? "hover:bg-white text-white"
                      : "hover:bg-red-500 text-gray-600"
                  } transition-colors`}
                  title="Delete message"
                >
                  <FiTrash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

