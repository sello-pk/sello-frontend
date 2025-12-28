import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiMessageSquare, FiSend, FiEdit2, FiTrash2, FiArrowLeft, FiImage, FiBell } from "react-icons/fi";
import {
    useGetSellerBuyerChatsQuery,
    useGetCarChatMessagesQuery,
    useSendCarChatMessageMutation,
    useEditCarChatMessageMutation,
    useDeleteCarChatMessageMutation,
    useGetMeQuery,
} from "../../redux/services/api";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "../../redux/config";

const SellerChats = () => {
    const navigate = useNavigate();
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState("");
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editMessageText, setEditMessageText] = useState("");
    const [socket, setSocket] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);

    const { data: currentUser } = useGetMeQuery();
    const { data: chats = [], isLoading: chatsLoading, refetch: refetchChats } = useGetSellerBuyerChatsQuery(
        undefined,
        { pollingInterval: 5000 }
    );
    // Use a longer polling interval - socket will handle real-time updates
    const { data: messagesData = [], isLoading: messagesLoading, refetch: refetchMessages } = useGetCarChatMessagesQuery(
        selectedChat,
        { 
            skip: !selectedChat, 
            // Use longer polling interval - socket handles real-time
            pollingInterval: 10000 
        }
    );
    const [sendMessage] = useSendCarChatMessageMutation();
    const [editMessage] = useEditCarChatMessageMutation();
    const [deleteMessage] = useDeleteCarChatMessageMutation();

    const token = localStorage.getItem("token");

    // Update messages when data changes
    useEffect(() => {
        if (messagesData && Array.isArray(messagesData)) {
            setMessages(messagesData.filter(msg => !msg.isDeleted));
            // Reset auto-scroll when switching chats
            shouldAutoScrollRef.current = true;
        }
    }, [messagesData]);

    // Initialize Socket.io
    useEffect(() => {
        if (!token || !selectedChat) return;

        let newSocket;
        try {
            newSocket = io(SOCKET_BASE_URL, {
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
                newSocket.emit('join-chats');
                if (selectedChat) {
                    newSocket.emit('join-chat', selectedChat);
                }
            });

            newSocket.on('disconnect', () => {
                setSocketConnected(false);
            });

            newSocket.on('new-message', (data) => {
                if (data.chatId === selectedChat) {
                    // Refetch messages - RTK Query will deduplicate based on message IDs
                    // The useEffect will sync messagesData to local messages state
                    refetchMessages();
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

            newSocket.on('new-notification', (data) => {
                toast.success(data.message || "New message from buyer!");
                refetchChats();
            });

            newSocket.on('message-deleted', (data) => {
                if (data.chatId === selectedChat) {
                    setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
                }
            });

            newSocket.on('message-updated', (data) => {
                if (data.chatId === selectedChat) {
                    setMessages(prev =>
                        prev.map(msg => msg._id === data.message._id ? data.message : msg)
                    );
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
    }, [token, selectedChat]);

    // Join chat room when selected chat changes
    useEffect(() => {
        if (socket && selectedChat) {
            socket.emit('join-chat', selectedChat);
            refetchMessages();
        }
    }, [selectedChat, socket]);

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
    }, [selectedChat]);

    // Auto-scroll to bottom only if user is near bottom
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || messages.length === 0) return;
        
        if (shouldAutoScrollRef.current) {
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedChat) return;

        const messageText = message.trim();
        setMessage("");

        try {
            if (socket && socket.connected) {
                // Send via socket for real-time updates
                socket.emit('send-message', {
                    chatId: selectedChat,
                    message: messageText,
                    messageType: 'text'
                });
                // Don't refetch - socket event will update the messages
                refetchChats(); // Only update chat list
            } else {
                // Fallback to REST API if socket not connected
                await sendMessage({
                    chatId: selectedChat,
                    message: messageText,
                }).unwrap();
                refetchMessages();
                refetchChats();
            }
        } catch (error) {
            toast.error(error?.data?.message || "Failed to send message");
        }
    };

    const handleEditMessage = async (messageId) => {
        if (!editMessageText.trim()) return;

        try {
            await editMessage({
                messageId,
                message: editMessageText.trim(),
            }).unwrap();
            setEditingMessageId(null);
            setEditMessageText("");
            refetchMessages();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to edit message");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;

        try {
            await deleteMessage(messageId).unwrap();
            refetchMessages();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to delete message");
        }
    };

    const selectedChatData = chats.find(c => c._id === selectedChat);
    const buyer = selectedChatData?.buyer || selectedChatData?.participants?.find(
        p => p._id.toString() !== currentUser?._id?.toString()
    );

    const getUnreadCount = (chat) => {
        if (chat.unreadCount && typeof chat.unreadCount === 'object') {
            return chat.unreadCount[currentUser?._id] || 0;
        }
        return 0;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <FiArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Buyer Messages</h1>
                            <p className="text-gray-600 mt-1">Manage conversations with buyers</p>
                        </div>
                    </div>
                    {socketConnected && (
                        <div className="flex items-center gap-2 text-green-600">
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                            <span className="text-sm">Connected</span>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex h-[calc(100vh-200px)]">
                        {/* Chat List Sidebar */}
                        <div className="w-1/3 border-r border-gray-200 flex flex-col">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {chatsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Spinner fullScreen={false} />
                                    </div>
                                ) : chats.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8 px-4">
                                        No buyer conversations yet
                                    </div>
                                ) : (
                                    chats.map((chat) => {
                                        const unreadCount = getUnreadCount(chat);
                                        const chatBuyer = chat.buyer || chat.participants?.find(
                                            p => p._id.toString() !== currentUser?._id?.toString()
                                        );
                                        const isSelected = chat._id === selectedChat;

                                        return (
                                            <div
                                                key={chat._id}
                                                onClick={() => setSelectedChat(chat._id)}
                                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                                    isSelected ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                        {chatBuyer?.avatar ? (
                                                            <img
                                                                src={chatBuyer.avatar}
                                                                alt={chatBuyer.name}
                                                                className="w-full h-full rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            chatBuyer?.name?.charAt(0)?.toUpperCase() || 'B'
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h3 className="font-semibold text-gray-900 truncate">
                                                                {chatBuyer?.name || "Buyer"}
                                                            </h3>
                                                            {unreadCount > 0 && (
                                                                <span className="bg-primary-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                                                                    {unreadCount}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 truncate mb-1">
                                                            {chat.car?.title || "Car Listing"}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {chat.lastMessage || "No messages yet"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Chat Window */}
                        <div className="flex-1 flex flex-col">
                            {selectedChat ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-gray-200 bg-white">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                                                    {buyer?.avatar ? (
                                                        <img
                                                            src={buyer.avatar}
                                                            alt={buyer.name}
                                                            className="w-full h-full rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        buyer?.name?.charAt(0)?.toUpperCase() || 'B'
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {buyer?.name || "Buyer"}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {selectedChatData?.car?.title || "Car Listing"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-[#ECE5DD] space-y-3">
                                        {messagesLoading ? (
                                            <div className="flex justify-center py-8">
                                                <Spinner fullScreen={false} />
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="text-center text-gray-500 py-8">
                                                No messages yet. Start the conversation!
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const isCurrentUser = currentUser?._id && msg.sender?._id &&
                                                    currentUser._id.toString() === msg.sender._id.toString();
                                                const isEditing = editingMessageId === msg._id;

                                                return (
                                                    <div
                                                        key={msg._id}
                                                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div
                                                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                                                isCurrentUser
                                                                    ? 'bg-primary-500 text-white'
                                                                    : 'bg-white text-gray-900'
                                                            }`}
                                                        >
                                                            {isEditing ? (
                                                                <div className="space-y-2">
                                                                    <input
                                                                        type="text"
                                                                        value={editMessageText}
                                                                        onChange={(e) => setEditMessageText(e.target.value)}
                                                                        className="w-full px-2 py-1 border rounded text-gray-900"
                                                                        autoFocus
                                                                        onKeyPress={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                handleEditMessage(msg._id);
                                                                            }
                                                                            if (e.key === 'Escape') {
                                                                                setEditingMessageId(null);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleEditMessage(msg._id)}
                                                                            className="text-xs bg-white text-primary-500 px-2 py-1 rounded"
                                                                        >
                                                                            Save
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingMessageId(null);
                                                                                setEditMessageText("");
                                                                            }}
                                                                            className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <p className="text-sm">{msg.message}</p>
                                                                    <div className="flex items-center justify-between mt-1">
                                                                        <span className="text-xs opacity-70">
                                                                            {new Date(msg.createdAt).toLocaleTimeString([], {
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </span>
                                                                        {isCurrentUser && (
                                                                            <div className="flex gap-1 ml-2">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setEditingMessageId(msg._id);
                                                                                        setEditMessageText(msg.message);
                                                                                    }}
                                                                                    className="opacity-70 hover:opacity-100"
                                                                                >
                                                                                    <FiEdit2 size={12} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteMessage(msg._id)}
                                                                                    className="opacity-70 hover:opacity-100"
                                                                                >
                                                                                    <FiTrash2 size={12} />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-4 border-t border-gray-200 bg-white">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }}
                                                placeholder="Type a message..."
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                            <button
                                                onClick={handleSendMessage}
                                                disabled={!message.trim()}
                                                className="p-2 bg-primary-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <FiSend size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                        <FiMessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>Select a conversation to start chatting</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerChats;

