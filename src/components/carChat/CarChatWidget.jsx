import { useState, useEffect, useRef } from "react";
import { FiMessageSquare, FiX, FiSend, FiMinimize2, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useGetMeQuery } from "../../redux/services/api";
import Spinner from "../Spinner";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const CarChatWidget = ({ carId, sellerId, carTitle, onClose }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [chatId, setChatId] = useState(null);
    const [socket, setSocket] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editMessageText, setEditMessageText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const { data: currentUser } = useGetMeQuery();
    const token = localStorage.getItem("token");
    // Get BASE_URL from environment or use default
    const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    // Ensure API_URL has /api suffix
    const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;
    // SOCKET_URL should not have /api
    const SOCKET_URL = BASE_URL.endsWith('/api') ? BASE_URL.replace('/api', '') : BASE_URL;

    // Initialize or get chat
    useEffect(() => {
        if (!carId || !token || !currentUser) return;

        const initializeChat = async () => {
            try {
                setIsLoading(true);
                // Try to get existing chat first
                let response;
                try {
                    response = await fetch(`${API_URL}/car-chat/car/${carId}`, {
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    });
                } catch (fetchError) {
                    console.error("Network error:", fetchError);
                    toast.error("Cannot connect to server. Please check your connection.");
                    return;
                }

                if (response.status === 404) {
                    // Create new chat
                    try {
                        response = await fetch(`${API_URL}/car-chat/car/${carId}`, {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json"
                            }
                        });
                    } catch (fetchError) {
                        console.error("Network error creating chat:", fetchError);
                        toast.error("Cannot connect to server. Please check your connection.");
                        return;
                    }
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    toast.error(errorData.message || "Failed to initialize chat");
                    return;
                }

                const data = await response.json();
                if (data.success && data.data) {
                    setChatId(data.data._id);
                    // Load messages
                    await loadMessages(data.data._id);
                } else {
                    toast.error(data.message || "Failed to initialize chat");
                }
            } catch (error) {
                console.error("Initialize chat error:", error);
                if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
                    toast.error("Cannot connect to server. Please make sure the server is running.");
                } else {
                    toast.error("Failed to initialize chat");
                }
            } finally {
                setIsLoading(false);
            }
        };

        initializeChat();
    }, [carId, token, currentUser]);

    // Initialize Socket.io
    useEffect(() => {
        if (!token || !chatId) return;

        let newSocket;
        try {
            newSocket = io(SOCKET_URL, {
                auth: { token },
                query: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                timeout: 10000,
                forceNew: false,
            });

            newSocket.on('connect', () => {
                setSocketConnected(true);
                if (chatId) {
                    newSocket.emit('join-chat', chatId);
                }
            });

            newSocket.on('disconnect', (reason) => {
                setSocketConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Car chat socket connection error:', error);
                setSocketConnected(false);
                // Don't show error toast - fallback to REST API
            });

            newSocket.on('new-message', (data) => {
                if (data.chatId === chatId) {
                    setMessages(prev => {
                        // Check if message already exists
                        const exists = prev.find(m => m._id === data.message._id);
                        if (exists) return prev;
                        
                        // Remove any temporary messages with same content (optimistic updates)
                        const filtered = prev.filter(m => 
                            !m._id.startsWith('temp-') || 
                            m.message !== data.message.message
                        );
                        
                        return [...filtered, data.message];
                    });
                    setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                }
            });

            newSocket.on('message-updated', (data) => {
                if (data.chatId === chatId) {
                    setMessages(prev => prev.map(msg =>
                        msg._id === data.message._id ? data.message : msg
                    ));
                }
            });

            newSocket.on('message-deleted', (data) => {
                if (data.chatId === chatId) {
                    setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
                }
            });

            setSocket(newSocket);
        } catch (error) {
            console.error('Error initializing socket:', error);
            setSocketConnected(false);
        }

        return () => {
            if (newSocket) {
                newSocket.close();
            }
        };
    }, [token, chatId, SOCKET_URL]);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadMessages = async (chatIdToLoad) => {
        try {
            const response = await fetch(`${API_URL}/car-chat/${chatIdToLoad}/messages`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success && data.data) {
                setMessages(data.data);
            }
        } catch (error) {
            console.error("Load messages error:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !chatId) return;

        const messageText = message.trim();
        setMessage("");

        try {
            if (socket && socket.connected) {
                // Optimistically add message for instant feedback
                const tempId = `temp-${Date.now()}`;
                const tempMessage = {
                    _id: tempId,
                    message: messageText,
                    sender: { _id: currentUser._id, role: currentUser.role, name: currentUser.name },
                    createdAt: new Date(),
                };
                setMessages(prev => [...prev, tempMessage]);
                
                // Send via socket - real message will replace temp one
                socket.emit('send-message', {
                    chatId: chatId,
                    message: messageText,
                    messageType: 'text'
                });
            } else {
                // Fallback to REST API
                try {
                    const response = await fetch(`${API_URL}/car-chat/${chatId}/messages`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ message: messageText })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || "Failed to send message");
                    }
                    
                    const data = await response.json();
                    if (data.success) {
                        setMessages(prev => [...prev, data.data]);
                    } else {
                        toast.error(data.message || "Failed to send message");
                    }
                } catch (fetchError) {
                    if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('ERR_CONNECTION_REFUSED')) {
                        toast.error("Cannot connect to server. Please check your connection.");
                    } else {
                        toast.error(fetchError.message || "Failed to send message");
                    }
                }
            }
        } catch (error) {
            console.error("Send message error:", error);
            toast.error("Failed to send message");
        }
    };

    const handleEditMessage = async (messageId) => {
        if (!editMessageText.trim()) {
            toast.error("Message cannot be empty");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/car-chat/messages/${messageId}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: editMessageText.trim() })
            });
            const data = await response.json();
            if (data.success) {
                setEditingMessageId(null);
                setEditMessageText("");
                await loadMessages(chatId);
                toast.success("Message updated");
            } else {
                toast.error(data.message || "Failed to update message");
            }
        } catch (error) {
            toast.error("Failed to update message");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;

        try {
            const response = await fetch(`${API_URL}/car-chat/messages/${messageId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setMessages(prev => prev.filter(msg => msg._id !== messageId));
                toast.success("Message deleted");
            } else {
                toast.error(data.message || "Failed to delete message");
            }
        } catch (error) {
            toast.error("Failed to delete message");
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed bottom-6 left-6 bg-white rounded-lg shadow-2xl z-40 flex flex-col ${
                isMinimized ? "w-80 h-12" : "w-96 h-[600px]"
            } transition-all`}
        >
            {/* Header */}
            <div className="bg-primary-500 text-white p-4 rounded-t-lg flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FiMessageSquare />
                    <span className="font-semibold">Chat with Seller</span>
                    {socketConnected && (
                        <span className="text-xs bg-green-500 px-2 py-0.5 rounded">Live</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="hover:bg-primary-600 p-1 rounded"
                    >
                        <FiMinimize2 size={18} />
                    </button>
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            if (onClose) onClose();
                        }}
                        className="hover:bg-primary-600 p-1 rounded"
                    >
                        <FiX size={18} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Chat Info */}
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <p className="text-sm font-medium text-gray-800 truncate">
                            {carTitle || "Car Listing"}
                        </p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#ECE5DD]">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Spinner fullScreen={false} />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                No messages yet. Start the conversation!
                            </div>
                        ) : (
                            messages
                                .filter(msg => !msg.isDeleted)
                                .map((msg) => {
                                    const isCurrentUser = currentUser?._id && msg.sender?._id &&
                                        currentUser._id.toString() === msg.sender._id.toString();
                                    const canEdit = isCurrentUser && !msg.isDeleted;
                                    const canDelete = isCurrentUser && !msg.isDeleted;

                                    return (
                                        <div
                                            key={msg._id}
                                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
                                        >
                                            <div className="flex items-end gap-2 max-w-[80%]">
                                                {!isCurrentUser && (
                                                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden">
                                                        {msg.sender?.avatar ? (
                                                            <img
                                                                src={msg.sender.avatar}
                                                                alt={msg.sender?.name || 'User'}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            (msg.sender?.name || 'U').charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                )}
                                                <div
                                                    className={`rounded-lg px-3 py-2 ${
                                                        isCurrentUser
                                                            ? "bg-primary-500 text-white rounded-tr-none"
                                                            : "bg-white text-gray-800 rounded-tl-none"
                                                    } shadow-sm`}
                                                >
                                                    {!isCurrentUser && (
                                                        <p className="text-xs font-medium mb-1 text-gray-700">
                                                            {msg.sender?.name || 'User'}
                                                        </p>
                                                    )}
                                                    {editingMessageId === msg._id ? (
                                                        <div className="space-y-2">
                                                            <input
                                                                type="text"
                                                                value={editMessageText}
                                                                onChange={(e) => setEditMessageText(e.target.value)}
                                                                className="w-full px-2 py-1 bg-white text-gray-800 rounded border"
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleEditMessage(msg._id)}
                                                                    className="text-xs px-2 py-1 bg-white text-primary-500 rounded hover:bg-gray-100"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingMessageId(null);
                                                                        setEditMessageText("");
                                                                    }}
                                                                    className="text-xs px-2 py-1 bg-white text-gray-600 rounded hover:bg-gray-100"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm">{msg.message}</p>
                                                            {msg.isEdited && (
                                                                <p className="text-xs italic mt-1 opacity-75">
                                                                    (edited)
                                                                </p>
                                                            )}
                                                        </>
                                                    )}
                                                    <div className="flex items-center justify-end gap-1 mt-1">
                                                        <span className={`text-xs ${
                                                            isCurrentUser ? 'text-primary-100' : 'text-gray-500'
                                                        }`}>
                                                            {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                        {canEdit && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingMessageId(msg._id);
                                                                    setEditMessageText(msg.message);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 ml-1 text-white hover:text-primary-200"
                                                                title="Edit message"
                                                            >
                                                                <FiEdit2 size={12} />
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button
                                                                onClick={() => handleDeleteMessage(msg._id)}
                                                                className="opacity-0 group-hover:opacity-100 ml-1 text-white hover:text-primary-200"
                                                                title="Delete message"
                                                            >
                                                                <FiTrash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                disabled={!chatId}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!message.trim() || !chatId}
                                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FiSend />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CarChatWidget;

