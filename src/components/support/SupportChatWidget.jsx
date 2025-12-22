import { useState, useEffect, useRef } from "react";
import { FiMessageSquare, FiX, FiSend, FiMinimize2, FiEdit2, FiTrash2 } from "react-icons/fi";
import { io } from "socket.io-client";
import {
    useCreateSupportChatMutation,
    useGetUserSupportChatsQuery,
    useGetSupportChatMessagesQuery,
    useSendSupportMessageMutation,
    useGetMeQuery,
} from "../../redux/services/api";
import Spinner from "../Spinner";
import toast from "react-hot-toast";
import { useSupportChat } from "../../contexts/SupportChatContext";
import { SOCKET_BASE_URL } from "../../redux/config";

const SupportChatWidget = () => {
    const {
        isOpen,
        setIsOpen,
        selectedChat,
        setSelectedChat,
        showCreateForm,
        setShowCreateForm,
    } = useSupportChat();
    const [isMinimized, setIsMinimized] = useState(false);
    const [message, setMessage] = useState("");
    const [subject, setSubject] = useState("");
    const [initialMessage, setInitialMessage] = useState("");
    const [priority, setPriority] = useState("medium");
    const [socket, setSocket] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);
    const [liveMessages, setLiveMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);

    const token = localStorage.getItem("token");

    const { data: chats, isLoading: chatsLoading, refetch: refetchChats } = useGetUserSupportChatsQuery(
        undefined,
        { skip: !isOpen, pollingInterval: 5000 }
    );
    
    const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useGetSupportChatMessagesQuery(
        selectedChat,
        { skip: !selectedChat || !isOpen, pollingInterval: 5000 }
    );
    
    const [createChat] = useCreateSupportChatMutation();
    const [sendMessage] = useSendSupportMessageMutation();
    const { data: currentUser } = useGetMeQuery();
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editMessageText, setEditMessageText] = useState("");

    // Initialize Socket.io for live chat
    useEffect(() => {
        if (!token || !isOpen) return;

        const newSocket = io(SOCKET_BASE_URL, {
            auth: { token },
            query: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000
        });

        newSocket.on('connect', () => {
            setSocketConnected(true);
            newSocket.emit('join-chats');
            if (selectedChat) {
                newSocket.emit('join-chat', selectedChat);
            }
        });

        newSocket.on('disconnect', () => {
            setSocketConnected(false);
        });

        newSocket.on('new-message', (data) => {
            const messageChatId = data.chatId || data.chat?._id;
            if (messageChatId === selectedChat) {
                setLiveMessages(prev => {
                    const exists = prev.find(m => m._id === data.message._id);
                    if (exists) return prev;
                    return [...prev, data.message];
                });
                // Only auto-scroll if user is near bottom
                if (shouldAutoScrollRef.current && messagesContainerRef.current) {
                    setTimeout(() => {
                        const container = messagesContainerRef.current;
                        if (container) {
                            container.scrollTop = container.scrollHeight;
                        }
                    }, 100);
                }
            }
            refetchChats();
        });

        newSocket.on('message-updated', (data) => {
            if (data.chatId === selectedChat) {
                setLiveMessages(prev => prev.map(msg => 
                    msg._id === data.message._id ? data.message : msg
                ));
            }
        });

        newSocket.on('message-deleted', (data) => {
            if (data.chatId === selectedChat) {
                setLiveMessages(prev => prev.filter(msg => msg._id !== data.messageId));
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [token, isOpen, selectedChat]);

    // Load messages when chat is selected
    useEffect(() => {
        if (messagesData) {
            const messagesArray = Array.isArray(messagesData) 
                ? messagesData 
                : (messagesData?.data || []);
            setLiveMessages(messagesArray);
            // Reset auto-scroll when switching chats
            shouldAutoScrollRef.current = true;
        } else {
            setLiveMessages([]);
        }
    }, [messagesData, selectedChat]);

    // Join chat room when chat is selected
    useEffect(() => {
        if (socket && selectedChat) {
            socket.emit('join-chat', selectedChat);
        }
    }, [socket, selectedChat]);

    const userChats = chats || [];
    const chatMessages = liveMessages.length > 0 ? liveMessages : (messagesData || []);

    // Auto select first chat if available
    useEffect(() => {
        if (isOpen && userChats.length > 0 && !selectedChat) {
            const openChat = userChats.find(c => c.status === 'open') || userChats[0];
            setSelectedChat(openChat._id);
        }
    }, [isOpen, userChats, selectedChat]);

    // Track user scroll to determine if we should auto-scroll
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            shouldAutoScrollRef.current = isNearBottom;
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [selectedChat, isOpen]);

    // Auto scroll to bottom only if user is near bottom
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || chatMessages.length === 0) return;
        
        if (shouldAutoScrollRef.current) {
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    }, [chatMessages]);

    const handleCreateChat = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !initialMessage.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            const result = await createChat({
                subject: subject.trim(),
                message: initialMessage.trim(),
                priority,
            }).unwrap();
            
            toast.success("Support chat created successfully");
            const chatId = result?.data?.chat?._id || result?.chat?._id;
            if (chatId) {
                setSelectedChat(chatId);
            }
            setShowCreateForm(false);
            setSubject("");
            setInitialMessage("");
            refetchChats();
        } catch (error) {
            console.error("Create support chat error:", error);
            const errorMessage = error?.data?.message || error?.message || "Failed to create support chat";
            toast.error(errorMessage);
            
            // If no admin found, show helpful message
            if (errorMessage.includes("admin") || errorMessage.includes("support system")) {
                toast.error("Support system is currently unavailable. Please try again later or contact support directly.");
            }
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedChat) return;

        const messageText = message.trim();
        setMessage("");

        try {
            if (socket && socket.connected) {
                // Send via socket for real-time
                socket.emit('send-message', {
                    chatId: selectedChat,
                    message: messageText,
                    messageType: 'text'
                });
                // Optimistically add message
                const tempMessage = {
                    _id: `temp-${Date.now()}`,
                    message: messageText,
                    sender: { _id: currentUser?._id, name: currentUser?.name || 'You' },
                    createdAt: new Date(),
                    isBot: false
                };
                setLiveMessages(prev => [...prev, tempMessage]);
                setTimeout(() => {
                    refetchMessages();
                    refetchChats();
                }, 500);
            } else {
                // Fallback to REST API
                await sendMessage({
                    chatId: selectedChat,
                    message: messageText,
                }).unwrap();
                refetchMessages();
                refetchChats();
            }
        } catch (error) {
            console.error('Send message error', error);
            toast.error(error?.data?.message || "Failed to send message");
        }
    };

    const selectedChatData = userChats.find(c => c._id === selectedChat);

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-50 group">
                {/* Wavy ripple effect circles - infinite animation */}
                <div className="absolute -inset-6 flex items-center justify-center pointer-events-none">
                    <div className="absolute w-16 h-16 rounded-full bg-[#050B20] support-ripple"></div>
                    <div className="absolute w-16 h-16 rounded-full bg-[#050B20] support-ripple-delay-1"></div>
                    <div className="absolute w-16 h-16 rounded-full bg-[#050B20] support-ripple-delay-2"></div>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl relative">
                        Get Support - Click to chat with us!
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                </div>
                
                {/* Button */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative bg-[#050B20] text-white p-4 rounded-full shadow-lg hover:bg-[#050B20] transition-all flex items-center gap-2 hover:scale-105 active:scale-95 z-10 support-button-pulse"
                    title="Get Support - Click to chat with us!"
                    aria-label="Open support chat"
                >
                    <FiMessageSquare size={24} />
                    <span className="hidden sm:inline">Support</span>
                </button>
            </div>
        );
    }

    return (
        <div
            className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl z-50 flex flex-col ${
                isMinimized ? "w-80 h-12" : "w-96 h-[600px]"
            } transition-all`}
        >
            {/* Header */}
            <div className="bg-primary-500 text-white p-4 rounded-t-lg flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FiMessageSquare />
                    <span className="font-semibold">Support Chat</span>
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
                            setIsMinimized(false);
                            setSelectedChat(null);
                            setShowCreateForm(false);
                        }}
                        className="hover:bg-primary-600 p-1 rounded"
                    >
                        <FiX size={18} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {!selectedChat && !showCreateForm ? (
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="mb-4">
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition"
                                >
                                    Start New Chat
                                </button>
                            </div>

                            {chatsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Spinner fullScreen={false} />
                                </div>
                            ) : userChats.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    No support chats yet. Start a new chat to get help.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-gray-800 mb-2">Your Chats</h3>
                                    {userChats.map((chat) => (
                                        <div
                                            key={chat._id}
                                            onClick={() => {
                                                setSelectedChat(chat._id);
                                                setShowCreateForm(false);
                                            }}
                                            className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-medium text-sm text-gray-800">
                                                    {chat.subject || "No subject"}
                                                </p>
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded ${
                                                        chat.status === "open"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : chat.status === "resolved"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                                >
                                                    {chat.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">
                                                {chat.lastMessage}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : showCreateForm ? (
                        <div className="flex-1 overflow-y-auto p-4">
                            <h3 className="font-semibold text-gray-800 mb-4">Create Support Request</h3>
                            <form onSubmit={handleCreateChat} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="What do you need help with?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Priority
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Message *
                                    </label>
                                    <textarea
                                        value={initialMessage}
                                        onChange={(e) => setInitialMessage(e.target.value)}
                                        required
                                        rows="4"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Describe your issue..."
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition"
                                    >
                                        Submit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateForm(false);
                                            setSubject("");
                                            setInitialMessage("");
                                        }}
                                        className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {selectedChatData?.subject || "Support Chat"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Status: {selectedChatData?.status || "open"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedChat(null);
                                            setShowCreateForm(false);
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messagesLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Spinner fullScreen={false} />
                                    </div>
                                ) : chatMessages.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        No messages yet. Start the conversation!
                                    </div>
                                ) : (
                                    chatMessages.map((msg) => {
                                        // Check if current user is the sender
                                        const isCurrentUser = currentUser?._id && msg.sender?._id && 
                                                             currentUser._id.toString() === msg.sender._id.toString();
                                        const isBot = msg.isBot;
                                        const canEdit = isCurrentUser && !isBot && !msg.isDeleted;
                                        const canDelete = isCurrentUser && !isBot && !msg.isDeleted;
                                        
                                        return (
                                            <div
                                                key={msg._id}
                                                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
                                            >
                                                <div className="flex items-end gap-2 max-w-[80%]">
                                                    {!isCurrentUser && !isBot && (
                                                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600 flex-shrink-0">
                                                            {msg.sender?.name?.charAt(0) || 'U'}
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`rounded-lg px-3 py-2 ${
                                                            isCurrentUser
                                                                ? "bg-primary-500 text-white rounded-tr-none"
                                                                : isBot
                                                                ? "bg-gray-200 text-gray-800 rounded-tl-none"
                                                                : "bg-gray-100 text-gray-800 rounded-tl-none"
                                                        } shadow-sm`}
                                                    >
                                                        {!isCurrentUser && !isBot && (
                                                            <p className="text-xs font-medium mb-1 text-gray-700">
                                                                {msg.sender?.name || 'User'}
                                                            </p>
                                                        )}
                                                        {isBot && (
                                                            <p className="text-xs font-medium mb-1 text-gray-700">
                                                                🤖 AI Assistant
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
                                                                        onClick={async () => {
                                                                            if (!editMessageText.trim()) {
                                                                                toast.error("Message cannot be empty");
                                                                                return;
                                                                            }
                                                                            try {
                                                                                const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
                                                                                const API_URL = BASE_URL;
                                                                                const token = localStorage.getItem("token");
                                                                                const response = await fetch(`${API_URL}/support-chat/messages/${msg._id}`, {
                                                                                    method: "PUT",
                                                                                    headers: {
                                                                                        "Content-Type": "application/json",
                                                                                        "Authorization": `Bearer ${token}`
                                                                                    },
                                                                                    body: JSON.stringify({ message: editMessageText.trim() })
                                                                                });
                                                                                const data = await response.json();
                                                                                if (response.ok && data.success) {
                                                                                    setEditingMessageId(null);
                                                                                    setEditMessageText("");
                                                                                    refetchMessages();
                                                                                    toast.success("Message updated");
                                                                                } else {
                                                                                    toast.error(data.message || "Failed to update message");
                                                                                }
                                                                            } catch (error) {
                                                                                console.error("Update error", error);
                                                                                toast.error("Failed to update message");
                                                                            }
                                                                        }}
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
                                                                    onClick={async () => {
                                                                        if (window.confirm("Are you sure you want to delete this message?")) {
                                                                            try {
                                                                                const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
                                                                                const API_URL = BASE_URL;
                                                                                const token = localStorage.getItem("token");
                                                                                const response = await fetch(`${API_URL}/support-chat/messages/${msg._id}`, {
                                                                                    method: "DELETE",
                                                                                    headers: {
                                                                                        "Authorization": `Bearer ${token}`
                                                                                    }
                                                                                });
                                                                                const data = await response.json();
                                                                                if (response.ok && data.success) {
                                                                                    refetchMessages();
                                                                                    toast.success("Message deleted");
                                                                                } else {
                                                                                    toast.error(data.message || "Failed to delete message");
                                                                                }
                                                                            } catch (error) {
                                                                                console.error("Delete error", error);
                                                                                toast.error("Failed to delete message");
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 ml-1 text-white hover:text-orange-200 transition-opacity"
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
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!message.trim()}
                                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FiSend />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default SupportChatWidget;

