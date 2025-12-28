import { useState, useEffect, useRef } from "react";
import { FiMessageSquare, FiX, FiSend, FiPaperclip, FiTrash2 } from "react-icons/fi";
import { IoMdCheckmark, IoMdDoneAll } from "react-icons/io";
import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "../../redux/config";
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

const WhatsAppChatWidget = () => {
    const {
        isOpen,
        setIsOpen,
        selectedChat,
        setSelectedChat,
        showCreateForm,
        setShowCreateForm,
    } = useSupportChat();
    
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState("");
    const [subject, setSubject] = useState("");
    const [initialMessage, setInitialMessage] = useState("");
    const [priority, setPriority] = useState("medium");
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);

    const token = localStorage.getItem("token");
    const [userId, setUserId] = useState(null);

    const { data: user } = useGetMeQuery(undefined, { skip: !token });
    const { data: chats, isLoading: chatsLoading, refetch: refetchChats } = useGetUserSupportChatsQuery(
        undefined,
        { 
            skip: !isOpen,
            pollingInterval: 5000, // Poll every 5 seconds for new chats
            refetchOnMountOrArgChange: true
        }
    );

    useEffect(() => {
        if (user?._id) {
            setUserId(user._id);
            localStorage.setItem("userId", user._id);
        }
    }, [user]);
    
    const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useGetSupportChatMessagesQuery(
        selectedChat,
        { 
            skip: !selectedChat || !isOpen,
            pollingInterval: 3000, // Poll every 3 seconds for new messages
            refetchOnMountOrArgChange: true
        }
    );
    
    const [createChat] = useCreateSupportChatMutation();
    const [sendMessage] = useSendSupportMessageMutation();

    const userChats = chats || [];
    const selectedChatData = userChats.find(c => c._id === selectedChat);

    // Initialize Socket.io
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

        newSocket.on('disconnect', (reason) => {
            setSocketConnected(false);
        });

        newSocket.on('joined-chat', (chatId) => {
        });

        newSocket.on('new-message', (data) => {
            const messageChatId = data.chatId || data.chat?._id;
            if (messageChatId === selectedChat) {
                setMessages(prev => {
                    const exists = prev.find(m => m._id === data.message._id);
                    if (exists) return prev;
                    // Remove any temporary messages with same content
                    const filtered = prev.filter(m => !m._id?.startsWith('temp-'));
                    return [...filtered, data.message];
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
            // Refetch messages to ensure we have the latest
            if (messageChatId === selectedChat) {
                setTimeout(() => refetchMessages(), 300);
            }
        });

        newSocket.on('typing', (data) => {
            if (data.chatId === selectedChat) {
                setTypingUsers(data.userNames || []);
            }
        });

        newSocket.on('message-seen', (data) => {
            setMessages(prev => prev.map(msg => 
                msg._id === data.messageId 
                    ? { ...msg, seenBy: data.seenBy }
                    : msg
            ));
        });

        newSocket.on('message-deleted', (data) => {
            if (data.chatId === selectedChat) {
                setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error', error);
            // Don't show error toast on every reconnect attempt
            if (error.message.includes('Authentication')) {
                toast.error('Authentication failed. Please login again.');
            }
        });

        newSocket.on('error', (error) => {
            console.error('Socket error', error);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [token, isOpen, selectedChat]);

    // Load messages when chat is selected
    useEffect(() => {
        if (messagesData) {
            // Handle both array and object with data property
            const messagesArray = Array.isArray(messagesData) 
                ? messagesData 
                : (messagesData?.data || []);
            setMessages(messagesArray);
            // Reset auto-scroll when switching chats
            shouldAutoScrollRef.current = true;
        } else {
            setMessages([]);
        }
    }, [messagesData, selectedChat]);

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
        if (!container || messages.length === 0) return;
        
        if (shouldAutoScrollRef.current) {
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    }, [messages]);

    // Mark messages as seen
    useEffect(() => {
        if (selectedChat && messages.length > 0 && socket && userId) {
            messages.forEach(msg => {
                const msgSenderId = msg.sender?._id || msg.sender;
                if (!msg.isRead && msgSenderId && msgSenderId.toString() !== userId.toString()) {
                    socket.emit('message-seen', { messageId: msg._id, chatId: selectedChat });
                }
            });
        }
    }, [messages, selectedChat, socket, userId]);

    // Handle typing indicator
    const handleTyping = () => {
        if (!socket || !selectedChat) return;

        setIsTyping(true);
        socket.emit('typing', { chatId: selectedChat, isTyping: true });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit('typing', { chatId: selectedChat, isTyping: false });
        }, 1000);
    };

    // Auto select first chat
    useEffect(() => {
        if (isOpen && userChats.length > 0 && !selectedChat) {
            const openChat = userChats.find(c => c.status === 'open') || userChats[0];
            if (openChat?._id) {
                setSelectedChat(openChat._id);
                if (socket) {
                    socket.emit('join-chat', openChat._id);
                }
            }
        }
    }, [isOpen, userChats, selectedChat, socket]);

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
                if (socket) {
                    socket.emit('join-chat', chatId);
                }
            }
            setShowCreateForm(false);
            setSubject("");
            setInitialMessage("");
            refetchChats();
        } catch (error) {
            console.error("Create support chat error", error);
            toast.error(error?.data?.message || "Failed to create support chat");
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedChat) return;

        const messageText = message.trim();
        setMessage("");

        try {
            if (socket && socket.connected) {
                socket.emit('send-message', {
                    chatId: selectedChat,
                    message: messageText,
                    messageType: 'text'
                });
            } else {
                // Fallback to REST API if socket not connected
                const result = await sendMessage({
                    chatId: selectedChat,
                    message: messageText,
                }).unwrap();
                
                // Add message to local state immediately
                if (result?.data) {
                    setMessages(prev => {
                        const exists = prev.find(m => m._id === result.data._id);
                        if (exists) return prev;
                        return [...prev, result.data];
                    });
                }
                
                refetchMessages();
                refetchChats();
            }
        } catch (error) {
            console.error('Send message error', error);
            toast.error(error?.data?.message || "Failed to send message");
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const formData = new FormData();
        formData.append('message', '📎 Attachment');
        files.forEach(file => {
            formData.append('attachments', file);
        });

        try {
            // Use REST API for file uploads
            await sendMessage({
                chatId: selectedChat,
                message: '📎 Attachment',
                attachments: files
            }).unwrap();
            refetchMessages();
            refetchChats();
        } catch (error) {
            toast.error("Failed to upload file");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!socket || !selectedChat) return;
        
        socket.emit('delete-message', { messageId, chatId: selectedChat });
    };

    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
        return d.toLocaleDateString();
    };

    const formatMessageTime = (date) => {
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-[#050B20] text-white p-4 rounded-full shadow-lg hover:bg-[#050B20] transition-all z-50 flex items-center gap-2"
            >
                <FiMessageSquare size={24} />
                <span className="hidden sm:inline">Support</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl z-50 flex flex-col w-96 h-[600px] transition-all">
            {/* Header */}
            <div className="bg-primary-500 text-white p-4 rounded-t-lg flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <FiMessageSquare />
                    </div>
                    <div>
                        <p className="font-semibold">Support Chat</p>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                            <p className="text-xs text-white/80">
                                {socketConnected ? 'Live' : 'Polling'}
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setIsOpen(false);
                        setSelectedChat(null);
                        setShowCreateForm(false);
                    }}
                    className="hover:bg-white/20 p-1 rounded"
                >
                    <FiX size={20} />
                </button>
            </div>

            {!selectedChat && !showCreateForm ? (
                <div className="flex-1 overflow-y-auto p-4 bg-[#ECE5DD]">
                    <div className="mb-4">
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:opacity-90 transition"
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
                            {userChats.map((chat) => (
                                <div
                                    key={chat._id}
                                    onClick={() => {
                                        setSelectedChat(chat._id);
                                        setShowCreateForm(false);
                                        setMessages([]); // Clear messages when switching chats
                                        if (socket) {
                                            socket.emit('join-chat', chat._id);
                                        }
                                        // Refetch messages for the new chat
                                        setTimeout(() => {
                                            refetchMessages();
                                        }, 100);
                                    }}
                                    className="p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-medium text-sm text-gray-800">
                                            {chat.subject || "Support Chat"}
                                        </p>
                                        <span className="text-xs text-gray-500">
                                            {formatTime(chat.lastMessageAt)}
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
                <div className="flex-1 overflow-y-auto p-4 bg-[#ECE5DD]">
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
                                className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:opacity-90 transition"
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
                    <div className="p-4 border-b border-gray-200 bg-primary-500 text-white">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">
                                    {selectedChatData?.subject || "Support Chat"}
                                </p>
                                <p className="text-xs text-white/80">
                                    {selectedChatData?.status || "open"}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedChat(null);
                                    setShowCreateForm(false);
                                }}
                                className="text-white hover:text-white/80"
                            >
                                Back
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#ECE5DD] bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern id=%22grid%22 width=%2260%22 height=%2260%22 patternUnits=%22userSpaceOnUse%22%3E%3Cpath d=%22M 60 0 L 0 0 0 60%22 fill=%22none%22 stroke=%22%23d4d4d4%22 stroke-width=%221%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23grid)%22 opacity=%220.1%22/%3E%3C/svg%3E')]">
                                {messagesLoading ? (
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
                                    // Check if message is from current user
                                    const msgSenderId = msg.sender?._id || msg.sender;
                                    const isUser = msgSenderId && (
                                        msgSenderId.toString() === userId?.toString() || 
                                        msgSenderId === userId
                                    );
                                    const isBot = msg.isBot || !msg.sender;
                                
                                return (
                                    <div
                                        key={msg._id}
                                        className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
                                    >
                                        <div className="flex items-end gap-2 max-w-[80%]">
                                            {!isUser && !isBot && (
                                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600 flex-shrink-0">
                                                    {msg.sender?.name?.charAt(0) || 'A'}
                                                </div>
                                            )}
                                            <div
                                                className={`rounded-lg px-3 py-2 ${
                                                    isUser
                                                        ? "bg-primary-100 rounded-tr-none"
                                                        : isBot
                                                        ? "bg-gray-200 rounded-tl-none"
                                                        : "bg-white rounded-tl-none"
                                                } shadow-sm`}
                                            >
                                                {!isUser && !isBot && (
                                                    <p className="text-xs font-semibold text-gray-700 mb-1">
                                                        {msg.sender?.name || 'Support'}
                                                    </p>
                                                )}
                                                {isBot && (
                                                    <p className="text-xs font-semibold text-gray-700 mb-1">
                                                        🤖 AI Assistant
                                                    </p>
                                                )}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="space-y-2 mb-2">
                                                        {msg.attachments.map((url, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={url}
                                                                alt="Attachment"
                                                                className="max-w-full rounded"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                <p className={`text-sm ${isUser ? 'text-gray-800' : 'text-gray-800'}`}>
                                                    {msg.message}
                                                </p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className="text-xs text-gray-500">
                                                        {formatMessageTime(msg.createdAt)}
                                                    </span>
                                                    {isUser && (
                                                        <>
                                                            {msg.seenBy && msg.seenBy.length > 0 ? (
                                                                <IoMdDoneAll className="text-primary-500" size={16} />
                                                            ) : msg.isRead ? (
                                                                <IoMdDoneAll className="text-gray-400" size={16} />
                                                            ) : (
                                                                <IoMdCheckmark className="text-gray-400" size={16} />
                                                            )}
                                                        </>
                                                    )}
                                                    {isUser && (
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg._id)}
                                                            className="opacity-0 group-hover:opacity-100 ml-1 text-red-500 hover:text-red-700"
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
                        {typingUsers.length > 0 && (
                            <div className="flex justify-start">
                                <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                                    <p className="text-xs text-gray-500 italic">
                                        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                                    </p>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200 bg-white">
                        <div className="flex gap-2 items-center">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-gray-600 hover:text-gray-800"
                            >
                                <FiPaperclip size={20} />
                            </button>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                    handleTyping();
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!message.trim()}
                                className="p-2 bg-primary-500 text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FiSend size={20} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default WhatsAppChatWidget;

