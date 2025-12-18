import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { io } from "socket.io-client";
import {
    useGetAllSupportChatsQuery,
    useGetSupportChatMessagesAdminQuery,
    useSendAdminResponseMutation,
    useUpdateSupportChatStatusMutation,
} from "../../redux/services/adminApi";
import { useGetMeQuery } from "../../redux/services/api";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import { FiSend, FiPaperclip, FiTrash2, FiSearch, FiMoreVertical, FiEdit2 } from "react-icons/fi";
import { IoMdCheckmark, IoMdDoneAll } from "react-icons/io";
import { formatDistanceToNow } from "date-fns";
import ConfirmModal from "../../components/admin/ConfirmModal";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL, SOCKET_BASE_URL } from "../../redux/config";

const SupportChat = () => {
    const [searchParams] = useSearchParams();
    const chatIdFromUrl = searchParams.get('chatId');
    
    // Helper function to ensure chatId is a string
    const getChatIdString = (chatId) => {
        if (!chatId) return null;
        if (typeof chatId === 'string') return chatId;
        if (chatId?._id) return String(chatId._id);
        return String(chatId);
    };
    
    const [socket, setSocket] = useState(null);
    const [selectedChat, setSelectedChat] = useState(() => getChatIdString(chatIdFromUrl));
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [socketConnected, setSocketConnected] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editMessageText, setEditMessageText] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
    const shouldAutoScrollRef = useRef(true); // Track if we should auto-scroll

    const token = localStorage.getItem("token");

    // If chatId is in URL, fetch all chats (no status filter) to ensure we find it
    const shouldFetchAll = !!chatIdFromUrl;
    
    const { data: chatsData, isLoading: chatsLoading, refetch: refetchChats } = useGetAllSupportChatsQuery({
        status: (shouldFetchAll || filterStatus === "all") ? undefined : filterStatus,
        search: searchQuery || undefined,
    }, {
        pollingInterval: 5000, // Poll every 5 seconds for new chats
        refetchOnMountOrArgChange: true,
        // Refetch when chatId is in URL to ensure we have the chat
        refetchOnFocus: true
    });

    const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useGetSupportChatMessagesAdminQuery(
        selectedChat,
        { 
            skip: !selectedChat,
            pollingInterval: 3000, // Poll every 3 seconds for new messages
            refetchOnMountOrArgChange: true
        }
    );

    const [sendResponse] = useSendAdminResponseMutation();
    const [updateStatus] = useUpdateSupportChatStatusMutation();

    const { data: adminUser } = useGetMeQuery();
    const adminId = adminUser?._id;

    // Get chats from response - handle different response structures
    const chats = React.useMemo(() => {
        if (!chatsData) return [];
        // Handle response structure: { chats: [...], pagination: {...} }
        if (chatsData.chats && Array.isArray(chatsData.chats)) {
            return chatsData.chats;
        }
        // Handle array response
        if (Array.isArray(chatsData)) {
            return chatsData;
        }
        return [];
    }, [chatsData]);
    
    // Find chat by ID - handle both string and ObjectId comparisons
    // Also check if chatId from URL exists in chats, if not, it might still be loading
    const selectedChatData = React.useMemo(() => {
        if (!selectedChat) return null;
        return chats.find(c => {
            const chatId = c._id?.toString();
            const selectedId = selectedChat?.toString();
            return chatId === selectedId;
        });
    }, [chats, selectedChat]);
    
    // If we have a chatId from URL but chat not found, it might still be loading
    const isChatLoading = selectedChat && !selectedChatData && chatsLoading;

    // Initialize Socket.io
    useEffect(() => {
        if (!token) return;

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
            if (data.chatId === selectedChat || data.chat?._id === selectedChat) {
                setMessages(prev => {
                    const exists = prev.find(m => m._id === data.message._id);
                    if (exists) return prev;
                    return [...prev, data.message];
                });
            }
            refetchChats();
            refetchMessages();
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

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [token, selectedChat]);

    // Load messages when chat is selected
    useEffect(() => {
        if (messagesData) {
            // Handle both array and object with data property
            const messagesArray = Array.isArray(messagesData) 
                ? messagesData 
                : (messagesData?.data || []);
            // Load messages
            setMessages(messagesArray);
            // Reset auto-scroll flag when switching chats
            shouldAutoScrollRef.current = true;
        } else {
            setMessages([]);
        }
    }, [messagesData, selectedChat]);

    // Set selectedChat from URL when it changes or when chats load
    useEffect(() => {
        if (!chatIdFromUrl) return;
        
        const chatIdString = getChatIdString(chatIdFromUrl);
        if (!chatIdString || chatIdString === selectedChat) return;
        
        // If chats are loading, wait for them
        if (chatsLoading) return;
        
        // Check if chat exists in current list
        const chatExists = chats.some(c => {
            const chatId = c._id?.toString();
            return chatId === chatIdString;
        });
        
        // If chat not found, refetch chats to make sure we have the latest data
        if (!chatExists && chats.length > 0) {
            refetchChats();
        }
        
        // Set selectedChat
        setSelectedChat(chatIdString);
    }, [chatIdFromUrl, chats, chatsLoading, selectedChat, refetchChats]);

    // Track user scroll to determine if we should auto-scroll
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
            shouldAutoScrollRef.current = isNearBottom;
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [selectedChat]);

    // Auto scroll to bottom only if user is near bottom (not on initial load or manual scroll up)
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || messages.length === 0) return;
        
        // Only auto-scroll if user hasn't manually scrolled up
        if (shouldAutoScrollRef.current) {
            // Use scrollTop on container to avoid window scrolling
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    }, [messages]);

    // Mark messages as seen
    useEffect(() => {
        if (selectedChat && messages.length > 0 && socket && adminId) {
            messages.forEach(msg => {
                if (!msg.seenBy?.includes(adminId)) {
                    socket.emit('message-seen', { messageId: msg._id, chatId: selectedChat });
                }
            });
        }
    }, [messages, selectedChat, socket, adminId]);

    const handleSelectChat = (chatId) => {
        // Ensure chatId is a string
        const chatIdString = getChatIdString(chatId);
        if (!chatIdString) return;
        
        setSelectedChat(chatIdString);
        setMessages([]); // Clear messages when switching chats
        if (socket) {
            socket.emit('join-chat', chatIdString);
        }
        // Refetch messages for the new chat
        setTimeout(() => {
            refetchMessages();
        }, 100);
    };

    const handleTyping = () => {
        if (!socket || !selectedChat) return;

        socket.emit('typing', { chatId: selectedChat, isTyping: true });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing', { chatId: selectedChat, isTyping: false });
        }, 1000);
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedChat) return;

        const messageText = message.trim();
        setMessage("");

        try {
            if (socket && socket.connected) {
                // Send via socket
                socket.emit('send-message', {
                    chatId: selectedChat,
                    message: messageText,
                    messageType: 'text'
                });
                // Optimistically add message to local state
                const tempMessage = {
                    _id: `temp-${Date.now()}`,
                    message: messageText,
                    sender: { _id: adminId, role: 'admin', name: adminUser?.name || 'Admin' },
                    createdAt: new Date(),
                    isBot: false
                };
                setMessages(prev => [...prev, tempMessage]);
                // Refetch to get actual message from server
                setTimeout(() => {
                    refetchMessages();
                    refetchChats();
                }, 500);
            } else {
                // Fallback to REST API if socket not connected
                const result = await sendResponse({
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
            if (process.env.NODE_ENV === 'development') {
                console.error('Send message error:', error);
            }
            toast.error(error?.data?.message || error?.message || "Failed to send message");
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
            await sendResponse({
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

    const handleDeleteMessage = (messageId) => {
        if (!selectedChat) return;
        setMessageToDelete(messageId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!messageToDelete || !selectedChat) return;
        
        try {
            const token = localStorage.getItem("token");
            const result = await fetch(`${API_BASE_URL}/support-chat/messages/${messageToDelete}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await result.json();
            if (data.success) {
                // Notify other listeners via socket (if connected)
                if (socket && socket.connected) {
                    socket.emit('delete-message', { messageId: messageToDelete, chatId: selectedChat });
                }
                refetchMessages();
                toast.success("Message deleted");
            } else {
                toast.error(data.message || "Failed to delete message");
            }
        } catch (error) {
            toast.error("Failed to delete message");
        }
    };

    const handleStatusChange = async (status) => {
        if (!selectedChat) return;
        try {
            await updateStatus({
                chatId: selectedChat,
                status,
            }).unwrap();
            toast.success("Chat status updated");
            refetchChats();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update status");
        }
    };

    const getUserName = (chat) => {
        if (!chat || !chat.participants) return "User";
        const user = chat.participants.find(p => p.role !== 'admin');
        return user?.name || "User";
    };

    const getUserAvatar = (chat) => {
        if (!chat || !chat.participants) return null;
        const user = chat.participants.find(p => p.role !== 'admin');
        return user?.avatar || null;
    };

    const getUserById = (userId) => {
        if (!selectedChatData) return null;
        return selectedChatData.participants?.find(p => p._id === userId);
    };

    const getUnreadCount = (chat) => {
        if (!adminId || !chat.unreadCount) return 0;
        return chat.unreadCount[adminId] || 0;
    };

    const formatTime = (date) => {
        if (!date) return '';
        return formatDistanceToNow(new Date(date), { addSuffix: true });
    };

    const formatMessageTime = (date) => {
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const filteredChats = chats.filter(chat => {
        if (searchQuery) {
            const userName = getUserName(chat).toLowerCase();
            const subject = (chat.subject || '').toLowerCase();
            const lastMessage = (chat.lastMessage || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            return userName.includes(query) || subject.includes(query) || lastMessage.includes(query);
        }
        return true;
    });

    return (
        <AdminLayout>
            <div className="flex h-[calc(100vh-80px)] bg-gray-100 dark:bg-gray-900">
                {/* Left Sidebar - User List */}
                <div className="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search chats..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="mt-2 flex gap-2">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                            >
                                <option value="all">All</option>
                                <option value="open">Open</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto">
                        {chatsLoading ? (
                            <div className="flex justify-center py-8">
                                <Spinner fullScreen={false} />
                            </div>
                        ) : filteredChats.length === 0 ? (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                No chats found
                            </div>
                        ) : (
                            filteredChats.map((chat) => {
                                const unreadCount = getUnreadCount(chat);
                                const chatId = chat._id?.toString();
                                const selectedId = selectedChat?.toString();
                                const isSelected = chatId === selectedId;
                                
                                return (
                                    <div
                                        key={chat._id}
                                        onClick={() => handleSelectChat(chat._id)}
                                        className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                                            isSelected ? 'bg-[#E5E5E5] dark:bg-gray-700' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                {getUserAvatar(chat) ? (
                                                    <img
                                                        src={getUserAvatar(chat)}
                                                        alt={getUserName(chat)}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    getUserName(chat).charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="font-semibold text-gray-800 dark:text-white truncate">
                                                        {getUserName(chat)}
                                                    </p>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                                        {formatTime(chat.lastMessageAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                                                    {chat.subject || 'No subject'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {chat.lastMessage || 'No messages'}
                                                </p>
                                                {unreadCount > 0 && (
                                                    <span className="inline-block mt-1 bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Side - Chat Window */}
                <div className="flex-1 flex flex-col bg-[#ECE5DD] bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern id=%22grid%22 width=%2260%22 height=%2260%22 patternUnits=%22userSpaceOnUse%22%3E%3Cpath d=%22M 60 0 L 0 0 0 60%22 fill=%22none%22 stroke=%22%23d4d4d4%22 stroke-width=%221%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23grid)%22 opacity=%220.1%22/%3E%3C/svg%3E')]">
                    {!selectedChat ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <p className="text-lg font-semibold mb-2 dark:text-white">Select a chat to start</p>
                                <p className="text-sm dark:text-gray-400">Choose a conversation from the sidebar</p>
                            </div>
                        </div>
                    ) : isChatLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Spinner fullScreen={false} />
                        </div>
                    ) : !selectedChatData ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <p className="text-lg font-semibold mb-2 dark:text-white">Chat not found</p>
                                <p className="text-sm dark:text-gray-400">The chat you're looking for doesn't exist or has been deleted.</p>
                                <button
                                    onClick={() => {
                                        setSelectedChat(null);
                                        // Clear URL parameter
                                        window.history.replaceState({}, '', '/admin/support-chat');
                                    }}
                                    className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                                >
                                    Go Back to Chat List
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="bg-primary-500 text-white p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                        {getUserAvatar(selectedChatData) ? (
                                            <img
                                                src={getUserAvatar(selectedChatData)}
                                                alt={getUserName(selectedChatData)}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            getUserName(selectedChatData).charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{getUserName(selectedChatData)}</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                                            <p className="text-xs text-white/80">
                                                {socketConnected ? 'Live' : 'Polling'} • {selectedChatData?.status || 'open'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedChatData?.status || 'open'}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                                    >
                                        <option value="open">Open</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                            </div>

                            {/* Messages */}
                            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                                {messagesLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Spinner fullScreen={false} />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                        No messages yet
                                    </div>
                                ) : (
                                    messages
                                        .filter(msg => !msg.isDeleted)
                                        .map((msg) => {
                                            // Normalize IDs for comparison
                                            const msgSenderId = msg.sender?._id?.toString() || msg.sender?.toString();
                                            const currentAdminId = adminId?.toString();
                                            
                                            // Check if current admin is the sender
                                            const isCurrentAdmin = currentAdminId && msgSenderId && 
                                                                   currentAdminId === msgSenderId;
                                            
                                            // Check if message sender is a user (not admin, not bot)
                                            const isUserMessage = msgSenderId && msg.sender?.role !== 'admin' && !msg.isBot;
                                            const senderUser = isUserMessage ? getUserById(msg.sender._id) : null;
                                            const isBot = msg.isBot;
                                            
                                            // In admin view: only admin can edit/delete their own messages
                                            // Users edit/delete from their own widget (SupportChatWidget)
                                            const canEdit = isCurrentAdmin && !isBot && !msg.isDeleted;
                                            const canDelete = isCurrentAdmin && !isBot && !msg.isDeleted;
                                        
                                        return (
                                            <div
                                                key={msg._id}
                                                className={`flex ${isCurrentAdmin ? 'justify-end' : 'justify-start'} group`}
                                            >
                                                <div className={`flex items-end gap-2 max-w-[70%] ${isCurrentAdmin ? 'flex-row-reverse' : ''}`}>
                                                    {/* Avatar for user messages (left side) */}
                                                    {!isCurrentAdmin && !isBot && (
                                                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden">
                                                            {senderUser?.avatar || msg.sender?.avatar ? (
                                                                <img
                                                                    src={senderUser?.avatar || msg.sender?.avatar}
                                                                    alt={msg.sender?.name || 'User'}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                (msg.sender?.name || senderUser?.name || 'U').charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Avatar for admin messages (right side) - show after message */}
                                                    {isCurrentAdmin && !isBot && (
                                                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden">
                                                            {adminUser?.avatar ? (
                                                                <img
                                                                    src={adminUser.avatar}
                                                                    alt={adminUser.name || 'Admin'}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                (adminUser?.name || 'A').charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                    )}
                                                    <div
                                                    className={`rounded-lg px-3 py-2 ${
                                                        isCurrentAdmin
                                                            ? "bg-primary-100 dark:bg-primary-900/30 rounded-tr-none"
                                                            : isBot
                                                            ? "bg-gray-200 dark:bg-gray-700 rounded-tl-none"
                                                            : "bg-white dark:bg-gray-800 rounded-tl-none"
                                                    } shadow-sm`}
                                                    >
                                                        {!isCurrentAdmin && !isBot && (
                                                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                                {msg.sender?.name || 'User'}
                                                            </p>
                                                        )}
                                                        {isBot && (
                                                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
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
                                                                            try {
                                                                                const result = await fetch(`${API_BASE_URL}/support-chat/messages/${msg._id}`, {
                                                                                    method: "PUT",
                                                                                    headers: {
                                                                                        "Content-Type": "application/json",
                                                                                        "Authorization": `Bearer ${token}`
                                                                                    },
                                                                                    body: JSON.stringify({ message: editMessageText.trim() })
                                                                                });
                                                                                const data = await result.json();
                                                                                if (data.success) {
                                                                                    setEditingMessageId(null);
                                                                                    setEditMessageText("");
                                                                                    refetchMessages();
                                                                                    toast.success("Message updated");
                                                                                } else {
                                                                                    toast.error(data.message || "Failed to update message");
                                                                                }
                                                                            } catch (error) {
                                                                                toast.error("Failed to update message");
                                                                            }
                                                                        }}
                                                                        className="text-xs px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingMessageId(null);
                                                                            setEditMessageText("");
                                                                        }}
                                                                        className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p className="text-sm text-gray-800">
                                                                    {msg.message}
                                                                </p>
                                                                {msg.isEdited && (
                                                                    <p className="text-xs italic mt-1 text-gray-500">
                                                                        (edited)
                                                                    </p>
                                                                )}
                                                            </>
                                                        )}
                                                        <div className="flex items-center justify-end gap-1 mt-1">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {formatMessageTime(msg.createdAt)}
                                                            </span>
                                                        {isCurrentAdmin && (
                                                            <>
                                                                {msg.seenBy && msg.seenBy.some(id => id === adminId) ? (
                                                                    <IoMdDoneAll className="text-blue-500" size={16} />
                                                                ) : msg.isRead ? (
                                                                    <IoMdDoneAll className="text-gray-400" size={16} />
                                                                ) : (
                                                                    <IoMdCheckmark className="text-gray-400" size={16} />
                                                                )}
                                                            </>
                                                        )}
                                                            {/* Show edit/delete buttons for admin's own messages */}
                                                            {canEdit && isCurrentAdmin && (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingMessageId(msg._id);
                                                                        setEditMessageText(msg.message);
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 ml-1 text-primary-500 hover:text-primary-500"
                                                                    title="Edit message"
                                                                >
                                                                    <FiEdit2 size={12} />
                                                                </button>
                                                            )}
                                                            {/* Show delete button for admin's own messages */}
                                                            {canDelete && isCurrentAdmin && (
                                                                <button
                                                                    onClick={() => handleDeleteMessage(msg._id)}
                                                                    className="opacity-0 group-hover:opacity-100 ml-1 text-red-500 hover:text-red-700"
                                                                    title="Delete message"
                                                                >
                                                                    <FiTrash2 size={12} />
                                                                </button>
                                                            )}
                                                            {/* Note: User messages can be edited/deleted by users from their own chat widget */}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                {typingUsers.length > 0 && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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
                                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
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
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!message.trim()}
                                        className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FiSend size={20} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Delete Message Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setMessageToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Message"
                message="Are you sure you want to delete this message? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </AdminLayout>
    );
};

export default SupportChat;

