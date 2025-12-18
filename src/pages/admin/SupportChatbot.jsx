import { useState, useEffect, useRef } from "react";
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
import { FiSend, FiUser, FiClock, FiAlertTriangle, FiCheckCircle, FiSearch, FiArrowLeft, FiMessageSquare, FiPaperclip, FiX, FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { IoMdCheckmark, IoMdDoneAll } from "react-icons/io";
import { formatDistanceToNow } from "date-fns";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SOCKET_BASE_URL } from "../../redux/config";

const SupportChatbot = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const chatIdFromUrl = searchParams.get('chatId');
    
    const [socket, setSocket] = useState(null);
    const [selectedChatId, setSelectedChatId] = useState(chatIdFromUrl || null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [socketConnected, setSocketConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [isAdminTyping, setIsAdminTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);
    const [chatUserNames, setChatUserNames] = useState({}); // Store user names by chatId

    const token = localStorage.getItem("token");
    
    // Get current admin user
    const { data: currentUser } = useGetMeQuery(undefined, { skip: !token });

    const { data: chatsData, isLoading: chatsLoading, refetch: refetchChats } = useGetAllSupportChatsQuery({
        status: activeTab === "all" ? undefined : activeTab,
    }, {
        refetchOnMountOrArgChange: true
    });

    const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useGetSupportChatMessagesAdminQuery(
        selectedChatId,
        {
            skip: !selectedChatId,
            refetchOnMountOrArgChange: true
        }
    );

    const [sendAdminResponse, { isLoading: isSendingMessage }] = useSendAdminResponseMutation();
    const [updateChatStatus] = useUpdateSupportChatStatusMutation();

    const chats = chatsData?.chats || [];
    const chatMessages = messages;
    
    // Extract user names from all chats when chats data loads
    useEffect(() => {
        if (chats.length > 0) {
            const newUserNames = {};
            
            chats.forEach(chat => {
                if (!chat._id) return;
                
                // Skip if we already have the name cached
                if (chatUserNames[chat._id]) return;
                
                // Try to get name from participants
                if (Array.isArray(chat.participants) && chat.participants.length > 0) {
                    // Find non-admin participant
                    const userParticipant = chat.participants.find(p => {
                        if (typeof p === 'object' && p !== null) {
                            // Check by role
                            if (p.role && p.role !== 'admin') {
                                return true;
                            }
                            // Check by ID (not current admin)
                            if (currentUser?._id && p._id) {
                                return p._id.toString() !== currentUser._id.toString();
                            }
                        }
                        return false;
                    });
                    
                    if (userParticipant?.name) {
                        newUserNames[chat._id] = userParticipant.name;
                    } else {
                        // Try first participant that's not admin
                        for (let i = 0; i < chat.participants.length; i++) {
                            const p = chat.participants[i];
                            if (typeof p === 'object' && p !== null && p.name) {
                                if (currentUser?._id && p._id?.toString() === currentUser._id.toString()) {
                                    continue; // Skip admin
                                }
                                newUserNames[chat._id] = p.name;
                                break;
                            }
                        }
                    }
                }
            });
            
            // Update state with all found names
            if (Object.keys(newUserNames).length > 0) {
                setChatUserNames(prev => ({ ...prev, ...newUserNames }));
            }
        }
    }, [chats, currentUser, chatUserNames]);

    // Helper function to get user name from chat - with comprehensive fallbacks
    const getUserNameFromChat = (chat) => {
        if (!chat) return "Unknown User";
        
        // Method 1: Check stored user name from messages (most reliable - cached)
        if (chat._id && chatUserNames[chat._id]) {
            return chatUserNames[chat._id];
        }
        
        // Method 2: Check participants array (if populated with objects)
        if (Array.isArray(chat.participants) && chat.participants.length > 0) {
            // Check if participants are objects (populated) or just IDs (strings)
            const firstParticipant = chat.participants[0];
            
            // If participants are objects with name property
            if (typeof firstParticipant === 'object' && firstParticipant !== null) {
                // Try to find non-admin participant by role
                const userParticipant = chat.participants.find(p => {
                    if (typeof p === 'object' && p !== null && p.role) {
                        return p.role !== 'admin';
                    }
                    return false;
                });
                if (userParticipant?.name) {
                    // Store it for future use
                    if (chat._id) {
                        setChatUserNames(prev => ({ ...prev, [chat._id]: userParticipant.name }));
                    }
                    return userParticipant.name;
                }
                
                // Try to find non-admin by comparing with current admin ID
                if (currentUser?._id) {
                    const nonAdminParticipant = chat.participants.find(p => {
                        if (typeof p === 'object' && p !== null) {
                            const participantId = p._id?.toString() || (p._id ? String(p._id) : null);
                            if (participantId) {
                                return participantId !== currentUser._id.toString();
                            }
                        }
                        return false;
                    });
                    if (nonAdminParticipant?.name) {
                        // Store it for future use
                        if (chat._id) {
                            setChatUserNames(prev => ({ ...prev, [chat._id]: nonAdminParticipant.name }));
                        }
                        return nonAdminParticipant.name;
                    }
                }
                
                // If participants exist but no role info, get first non-null name (skip admin)
                for (let i = 0; i < chat.participants.length; i++) {
                    const p = chat.participants[i];
                    if (typeof p === 'object' && p !== null && p.name) {
                        // Double check it's not the admin
                        if (currentUser?._id && p._id?.toString() === currentUser._id.toString()) {
                            continue; // Skip admin
                        }
                        // Store it for future use
                        if (chat._id) {
                            setChatUserNames(prev => ({ ...prev, [chat._id]: p.name }));
                        }
                        return p.name;
                    }
                }
            }
        }
        
        // Method 3: Get user name from messages (reliable fallback - messages always have sender populated)
        if (chat._id === selectedChatId && chatMessages && Array.isArray(chatMessages) && chatMessages.length > 0) {
            // Find first message from a non-admin, non-bot sender
            for (let i = 0; i < chatMessages.length; i++) {
                const msg = chatMessages[i];
                if (msg.isBot) continue;
                
                const isAdmin = msg.sender === 'admin' || 
                               msg.isAdminResponse === true || 
                               msg.senderId === currentUser?._id ||
                               (typeof msg.sender === 'object' && msg.sender?.role === 'admin');
                
                if (!isAdmin && msg.sender) {
                    // Check if sender is an object with name (populated)
                    if (typeof msg.sender === 'object' && msg.sender?.name) {
                        // Store it for future use
                        if (chat._id) {
                            setChatUserNames(prev => ({ ...prev, [chat._id]: msg.sender.name }));
                        }
                        return msg.sender.name;
                    }
                    // Check if sender is populated in a different way
                    if (msg.senderName) {
                        if (chat._id) {
                            setChatUserNames(prev => ({ ...prev, [chat._id]: msg.senderName }));
                        }
                        return msg.senderName;
                    }
                }
            }
        }
        
        // Method 4: Check direct user fields (legacy support)
        if (chat.user) {
            if (typeof chat.user === 'object' && chat.user?.name) {
                if (chat._id) {
                    setChatUserNames(prev => ({ ...prev, [chat._id]: chat.user.name }));
                }
                return chat.user.name;
            }
        }
        
        if (chat.userId) {
            if (typeof chat.userId === 'object' && chat.userId?.name) {
                if (chat._id) {
                    setChatUserNames(prev => ({ ...prev, [chat._id]: chat.userId.name }));
                }
                return chat.userId.name;
            }
        }
        
        if (chat.userName && typeof chat.userName === 'string') {
            if (chat._id) {
                setChatUserNames(prev => ({ ...prev, [chat._id]: chat.userName }));
            }
            return chat.userName;
        }
        
        // If still unknown, return unknown (will be updated when messages load)
        return "Unknown User";
    };

    // Initialize Socket.IO
    useEffect(() => {
        if (!token) return;

        const newSocket = io(SOCKET_BASE_URL, {
            auth: { token },
            query: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
            timeout: 20000,
            randomizationFactor: 0.5
        });

        newSocket.on('connect', () => {
            setSocketConnected(true);
            newSocket.emit('join-chats');
            if (selectedChatId) {
                newSocket.emit('join-chat', selectedChatId);
            }
        });

        newSocket.on('disconnect', (reason) => {
            setSocketConnected(false);
            // Attempt to reconnect
            if (reason === 'io server disconnect') {
                // Server disconnected, attempt to reconnect
                newSocket.connect();
            }
        });

        newSocket.on('connect_error', (error) => {
            toast.error('Connection failed. Retrying...');
        });

        newSocket.on('connect_timeout', (timeout) => {
            toast.error('Connection timeout. Retrying...');
        });

        newSocket.on('error', (error) => {
            toast.error('Connection error occurred');
        });

        newSocket.on('joined-chat', (chatId) => {
        });

        newSocket.on('new-message', (data) => {
            if (data.chatId === selectedChatId || data.chat?._id === selectedChatId) {
                setMessages(prev => {
                    // Filter out temporary messages and duplicates
                    const filteredMessages = prev.filter(msg => 
                        !msg._id?.startsWith('temp-') && msg._id !== data.message._id
                    );
                    return [...filteredMessages, data.message];
                });
                
                // Extract user name from message if it's from a user (not admin/bot)
                if (data.message && !data.message.isBot) {
                    const isAdmin = data.message.sender === 'admin' || 
                                   data.message.isAdminResponse === true || 
                                   data.message.senderId === currentUser?._id ||
                                   (typeof data.message.sender === 'object' && data.message.sender?.role === 'admin');
                    
                    if (!isAdmin && data.message.sender) {
                        const chatId = data.chatId || data.chat?._id;
                        if (chatId) {
                            if (typeof data.message.sender === 'object' && data.message.sender?.name) {
                                setChatUserNames(prev => ({
                                    ...prev,
                                    [chatId]: data.message.sender.name
                                }));
                            }
                        }
                    }
                }
                
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
            // Refetch chats to update unread counts
            refetchChats();
        });

        newSocket.on('typing', (data) => {
            if (data.chatId === selectedChatId) {
                setTypingUsers(data.userNames || []);
            }
        });

        newSocket.on('message-deleted', (data) => {
            if (data.chatId === selectedChatId) {
                setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
            }
        });

        newSocket.on('message-seen', (data) => {
            // Update message seen status
            setMessages(prev => prev.map(msg => 
                msg._id === data.messageId 
                    ? { ...msg, seenBy: data.seenBy, isRead: true }
                    : msg
            ));
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [token, selectedChatId]);

    // Load messages when chat is selected or messagesData changes
    useEffect(() => {
        if (messagesData) {
            const messagesArray = Array.isArray(messagesData) 
                ? messagesData 
                : (messagesData?.data || []);
            // Load messages
            // Filter out temporary messages when loading new data
            setMessages(prev => {
                const filteredPrev = prev.filter(msg => !msg._id?.startsWith('temp-'));
                return [...filteredPrev, ...messagesArray];
            });
            
            // Extract user name from messages and store it
            if (selectedChatId && messagesArray.length > 0) {
                // Find first non-admin, non-bot message to get user name
                const userMessage = messagesArray.find(msg => {
                    if (msg.isBot) return false;
                    const isAdmin = msg.sender === 'admin' || 
                                   msg.isAdminResponse === true || 
                                   msg.senderId === currentUser?._id ||
                                   (typeof msg.sender === 'object' && msg.sender?.role === 'admin');
                    return !isAdmin && msg.sender;
                });
                
                if (userMessage && typeof userMessage.sender === 'object' && userMessage.sender?.name) {
                    setChatUserNames(prev => ({
                        ...prev,
                        [selectedChatId]: userMessage.sender.name
                    }));
                }
            }
        } else {
            setMessages([]);
        }
        // Reset auto-scroll when switching chats or loading new messages
        shouldAutoScrollRef.current = true;
    }, [messagesData, selectedChatId, currentUser]);

    // Select chat from URL on mount
    useEffect(() => {
        if (chatIdFromUrl && chatIdFromUrl !== selectedChatId) {
            handleSelectChat(chatIdFromUrl);
        }
    }, [chatIdFromUrl]);

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
    }, [selectedChatId]);

    // Auto-scroll to bottom only if user is near bottom
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || chatMessages.length === 0) return;
        
        if (shouldAutoScrollRef.current) {
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    }, [chatMessages, typingUsers]);

    const handleSelectChat = (chatId) => {
        setSelectedChatId(chatId);
        // Clear messages but keep temporary messages
        setMessages(prev => prev.filter(msg => msg._id?.startsWith('temp-')));
        // Reset auto-scroll when switching chats
        shouldAutoScrollRef.current = true;
        if (socket) {
            socket.emit('join-chat', chatId);
        }
        setTimeout(() => {
            refetchMessages();
        }, 100);
    };

    const handleTyping = () => {
        if (!socket || !selectedChatId) return;

        socket.emit('typing', { chatId: selectedChatId, isTyping: true });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing', { chatId: selectedChatId, isTyping: false });
        }, 1000);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !selectedChatId) return;

        const messageText = message.trim();
        setMessage("");

        try {
            if (socket && socket.connected) {
                // Send via socket for real-time delivery
                socket.emit('send-message', {
                    chatId: selectedChatId,
                    message: messageText,
                    messageType: 'text',
                    isAdminResponse: true
                });
                // Optimistically add the message to UI with unique temporary ID
                const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const tempMessage = {
                    _id: tempId,
                    message: messageText,
                    sender: 'admin',
                    isAdminResponse: true,
                    createdAt: new Date()
                };
                setMessages(prev => [...prev, tempMessage]);
                // Only auto-scroll if user is near bottom
                if (shouldAutoScrollRef.current && messagesContainerRef.current) {
                    setTimeout(() => {
                        const container = messagesContainerRef.current;
                        if (container) {
                            container.scrollTop = container.scrollHeight;
                        }
                    }, 100);
                }
            } else {
                // Fallback to HTTP if socket not connected
                const result = await sendAdminResponse({
                    chatId: selectedChatId,
                    message: messageText,
                }).unwrap();
                
                // Add message to state
                if (result?.data) {
                    setMessages(prev => [...prev, result.data]);
                }
                
                refetchMessages();
                toast.success("Message sent");
            }
        } catch (error) {
            // Error handled by toast
            toast.error(error?.data?.message || "Failed to send message");
        }
    };

    const handleStatusChange = async (chatId, status, priority) => {
        try {
            await updateChatStatus({ chatId, status, priority }).unwrap();
            toast.success("Chat status updated");
            refetchChats();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update status");
        }
    };

    // Statistics
    const stats = {
        open: chats.filter(c => c.status === "open").length,
        pending: chats.filter(c => c.status === "pending").length,
        resolved: chats.filter(c => c.status === "resolved").length,
        urgent: chats.filter(c => c.priority === "urgent").length,
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/admin/chat-monitoring')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Back to Chat History"
                            >
                                <FiArrowLeft size={24} className="text-gray-600" />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Live Support Chat</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Chat with customers in real-time • WhatsApp-style messaging
                                </p>
                            </div>
                        </div>
                        {/* Connection Status */}
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                            <div className={`w-2 h-2 rounded-full ${
                                socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                            }`}></div>
                            <span className="text-sm font-medium text-gray-700">
                                {socketConnected ? '🟢 Live Connected' : '🔴 Disconnected'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Open Chats</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <FiClock className="text-primary-500" size={20} />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                            <FiTrendingUp size={12} className="text-green-500" />
                            <span className="text-xs font-medium text-green-600">+12%</span>
                            <span className="text-xs text-gray-500">vs last hour</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <FiClock className="text-orange-600" size={20} />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                            <FiTrendingUp size={12} className="text-green-500" />
                            <span className="text-xs font-medium text-green-600">+5%</span>
                            <span className="text-xs text-gray-500">vs last hour</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Resolved</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <FiCheckCircle className="text-green-600" size={20} />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                            <FiTrendingUp size={12} className="text-green-500" />
                            <span className="text-xs font-medium text-green-600">+8%</span>
                            <span className="text-xs text-gray-500">vs last hour</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Urgent</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <FiAlertTriangle className="text-red-600" size={20} />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                            <FiTrendingDown size={12} className="text-red-500" />
                            <span className="text-xs font-medium text-red-600">-3%</span>
                            <span className="text-xs text-gray-500">vs last hour</span>
                        </div>
                    </div>
                </div>

                {/* WhatsApp-Style Chat Interface */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Chat List - Left Side */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-[700px] flex flex-col">
                            {/* Search and Tabs */}
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <div className="relative mb-3">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                    />
                                    {searchQuery && (
                                        <button 
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <FiX size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {["all", "active", "urgent"].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                                activeTab === tab
                                                    ? "bg-primary-500 text-white"
                                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Chat List */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="divide-y divide-gray-100">
                                    {chatsLoading ? (
                                        <div className="flex justify-center py-12">
                                            <Spinner fullScreen={false} />
                                        </div>
                                    ) : chats.length === 0 ? (
                                        <div className="text-center py-12">
                                            <FiMessageSquare className="mx-auto text-gray-300 mb-3" size={48} />
                                            <p className="text-gray-500 text-sm">No support chats yet</p>
                                            <p className="text-gray-400 text-xs mt-1">Chats will appear here when customers request support</p>
                                        </div>
                                    ) : (
                                        chats
                                            .filter((chat) =>
                                                searchQuery
                                                    ? getUserNameFromChat(chat).toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                      chat.subject?.toLowerCase().includes(searchQuery.toLowerCase())
                                                    : true
                                            )
                                            .map((chat) => (
                                                <div
                                                    key={chat._id}
                                                    onClick={() => handleSelectChat(chat._id)}
                                                    className={`p-4 cursor-pointer transition-all ${
                                                        selectedChatId === chat._id
                                                            ? "bg-primary-50 border-l-4 border-l-primary-500"
                                                            : "hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 relative">
                                                            <span className="text-base font-semibold text-primary-500">
                                                                {getUserNameFromChat(chat).charAt(0).toUpperCase()}
                                                            </span>
                                                            {chat.unreadCount > 0 && (
                                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                                    {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                                    {getUserNameFromChat(chat)}
                                                                </p>
                                                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                                                    {chat.lastMessageAt
                                                                        ? formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false })
                                                                        : ""}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 font-medium truncate mb-1">
                                                                {chat.subject || "Support Request"}
                                                            </p>
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-xs text-gray-500 truncate flex-1">
                                                                    {chat.lastMessage || "No messages yet"}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${{
                                                                    open: 'bg-green-100 text-green-800',
                                                                    pending: 'bg-primary-100 text-primary-500',
                                                                    resolved: 'bg-gray-100 text-gray-800'
                                                                }[chat.status] || 'bg-gray-100 text-gray-800'}
                                                                `}>
                                                                    {{open: 'Open', pending: 'Pending', resolved: 'Resolved'}[chat.status] || chat.status}
                                                                </span>
                                                                {chat.priority === 'urgent' && (
                                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                                                                        Urgent
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Window - Right Side (WhatsApp Style) */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[700px] flex flex-col">
                            {!selectedChatId ? (
                                <div className="flex-1 flex items-center justify-center bg-gray-50">
                                    <div className="text-center">
                                        <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                                            <FiMessageSquare className="text-primary-500" size={64} />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">WhatsApp-Style Live Chat</h3>
                                        <p className="text-gray-500 text-sm">Select a conversation from the list to start chatting with customers</p>
                                        <p className="text-gray-400 text-xs mt-2">Messages are delivered in real-time via Socket.IO</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Chat Header - WhatsApp Style */}
                                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center relative">
                                                    <span className="text-lg font-bold text-primary-500">
                                                        {getUserNameFromChat(chats.find((c) => c._id === selectedChatId)).charAt(0).toUpperCase()}
                                                    </span>
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                                                </div>
                                                <div>
                                                    <p className="text-base font-semibold text-gray-900">
                                                        {getUserNameFromChat(chats.find((c) => c._id === selectedChatId))}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                        <p className="text-xs text-gray-600">
                                                            {typingUsers.length > 0 ? `${typingUsers.join(', ')} typing...` : 'Online'}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {chats.find((c) => c._id === selectedChatId)?.subject || "Support Request"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={chats.find((c) => c._id === selectedChatId)?.status || 'open'}
                                                    onChange={(e) =>
                                                        handleStatusChange(selectedChatId, e.target.value, undefined)
                                                    }
                                                    className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                                >
                                                    <option value="open">🟢 Open</option>
                                                    <option value="pending">🟡 Pending</option>
                                                    <option value="resolved">✅ Resolved</option>
                                                </select>
                                                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                                                    <FiSearch size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages - WhatsApp Style Background */}
                                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#ECE5DD] bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern id=%22grid%22 width=%2260%22 height=%2260%22 patternUnits=%22userSpaceOnUse%22%3E%3Cpath d=%22M 60 0 L 0 0 0 60%22 fill=%22none%22 stroke=%22%23d4d4d4%22 stroke-width=%221%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23grid)%22 opacity=%220.1%22/%3E%3C/svg%3E')]">
                                        {messagesLoading ? (
                                            <div className="flex justify-center py-12">
                                                <Spinner fullScreen={false} />
                                            </div>
                                        ) : chatMessages.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="bg-white rounded-lg shadow-sm p-6 max-w-sm mx-auto">
                                                    <FiMessageSquare className="mx-auto text-primary-500 mb-3" size={40} />
                                                    <p className="text-gray-700 font-medium">No messages yet</p>
                                                    <p className="text-gray-500 text-sm mt-1">Start the conversation with this customer</p>
                                                </div>
                                            </div>
                                        ) : (
                                            chatMessages.map((msg) => {
                                                // Check if message is from admin - check multiple conditions
                                                const isAdmin = msg.sender === 'admin' || 
                                                               msg.isAdminResponse === true || 
                                                               msg.senderId === currentUser?._id ||
                                                               (typeof msg.sender === 'object' && msg.sender?.role === 'admin');
                                                const isBot = msg.isBot;
                                                const timeStr = msg.createdAt
                                                    ? new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                                    : '';
                                                
                                                return (
                                                    <div
                                                        key={msg._id}
                                                        className={`flex ${
                                                            isAdmin ? "justify-end" : "justify-start"
                                                        }`}
                                                    >
                                                        {!isAdmin && !isBot && (
                                                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2 flex-shrink-0 self-end">
                                                                <span className="text-xs font-semibold text-primary-500">
                                                                    {(msg.sender?.name || 'U').charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div
                                                            className={`max-w-md px-3 py-2 rounded-lg shadow-md ${
                                                                isAdmin
                                                                    ? "bg-primary-500 text-white rounded-tr-none"
                                                                    : isBot
                                                                    ? "bg-gray-200 text-gray-800 rounded-tl-none"
                                                                    : "bg-white text-gray-900 rounded-tl-none"
                                                            }`}
                                                        >
                                                            {isBot && (
                                                                <p className="text-xs font-semibold mb-1 text-gray-700">🤖 AI Assistant</p>
                                                            )}
                                                            {!isAdmin && !isBot && (
                                                                <p className="text-xs font-semibold mb-1 text-gray-700">
                                                                    {msg.sender?.name || 'Customer'}
                                                                </p>
                                                            )}
                                                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                                                            {msg.attachments && msg.attachments.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {msg.attachments.map((attachment, idx) => (
                                                                        <div key={idx} className="relative group">
                                                                            <img 
                                                                                src={attachment} 
                                                                                alt="Attachment" 
                                                                                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <FiSearch className="text-white" size={20} />
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                                <span
                                                                    className={`text-xs ${
                                                                        isAdmin
                                                                            ? "text-primary-100"
                                                                            : "text-gray-500"
                                                                    }`}
                                                                >
                                                                    {timeStr}
                                                                </span>
                                                                {isAdmin && (
                                                                    msg.isRead || msg.seenBy?.length > 0 ? (
                                                                        <IoMdDoneAll className={msg.seenBy?.length > 0 ? "text-blue-300" : "text-white opacity-70"} size={16} />
                                                                    ) : (
                                                                        <IoMdCheckmark className="text-white opacity-70" size={16} />
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        {/* Typing indicator - WhatsApp Style */}
                                        {typingUsers.length > 0 && (
                                            <div className="flex justify-start items-end">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                                                    <span className="text-xs font-semibold text-primary-500">...</span>
                                                </div>
                                                <div className="bg-white px-4 py-2 rounded-lg rounded-tl-none shadow-md">
                                                    <div className="flex gap-1">
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</p>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input - WhatsApp Style */}
                                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-gray-50">
                                        <div className="flex gap-3 items-center mb-2">
                                            <button 
                                                type="button"
                                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
                                                title="Attach file"
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
                                                placeholder="Type a message..."
                                                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage(e);
                                                    }
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={!message.trim() || isSendingMessage}
                                                className="p-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center"
                                                title="Send message"
                                            >
                                                {isSendingMessage ? (
                                                    <Spinner fullScreen={false} />
                                                ) : (
                                                    <FiSend size={20} />
                                                )}
                                            </button>
                                        </div>
                                        {isAdminTyping && (
                                            <p className="text-xs text-gray-500 mt-2 ml-4">Admin is typing...</p>
                                        )}
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Replies Section */}
                <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Quick Replies</h3>
                        <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2 text-sm">
                            <span className="text-lg">+</span>
                            New
                        </button>
                    </div>
                    <div className="text-center py-12">
                        <p className="text-gray-500">No templates yet</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default SupportChatbot;
