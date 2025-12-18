import { useState, useEffect, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
    useGetChatbotStatsQuery,
    useGetAllSupportChatsQuery,
    useGetSupportChatMessagesAdminQuery,
    useSendAdminResponseMutation,
    useUpdateSupportChatStatusMutation,
    useGetQuickRepliesQuery,
    useCreateQuickReplyMutation,
    useDeleteQuickReplyMutation,
    useUseQuickReplyMutation,
} from "../../redux/services/adminApi";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import { FiMessageSquare, FiSend, FiClock, FiCheckCircle, FiXCircle, FiSearch, FiPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import ConfirmModal from "../../components/admin/ConfirmModal";

const Chatbot = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showQuickReplyModal, setShowQuickReplyModal] = useState(false);
    const [newQuickReplyTitle, setNewQuickReplyTitle] = useState("");
    const [newQuickReplyMessage, setNewQuickReplyMessage] = useState("");
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [quickReplyToDelete, setQuickReplyToDelete] = useState(null);

    const { data: stats } = useGetChatbotStatsQuery();
    const { data: chatsData, isLoading: chatsLoading, refetch: refetchChats } = useGetAllSupportChatsQuery(
        {
            status: activeTab === "active" ? "open" : activeTab === "urgent" ? undefined : undefined,
            priority: activeTab === "urgent" ? "urgent" : undefined,
        },
        {
            pollingInterval: 5000,
            refetchOnMountOrArgChange: true
        }
    );
    
    const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useGetSupportChatMessagesAdminQuery(
        selectedChat,
        { skip: !selectedChat, pollingInterval: 2000 }
    );
    
    const { data: quickRepliesData, refetch: refetchQuickReplies } = useGetQuickRepliesQuery({ isActive: true });
    const [sendResponse] = useSendAdminResponseMutation();
    const [updateStatus] = useUpdateSupportChatStatusMutation();
    const [createQuickReply] = useCreateQuickReplyMutation();
    const [deleteQuickReply] = useDeleteQuickReplyMutation();
    const [useQuickReply] = useUseQuickReplyMutation();

    const chats = chatsData?.chats || [];
    const messages = messagesData || [];
    const quickReplies = quickRepliesData || [];

    // Filter chats by search
    const filteredChats = chats.filter(chat => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const userName = getUserName(chat).toLowerCase();
        const subject = (chat.subject || "").toLowerCase();
        return userName.includes(query) || subject.includes(query);
    });

    // Filter by active tab
    const tabFilteredChats = filteredChats.filter(chat => {
        if (activeTab === "all") return true;
        if (activeTab === "active") return chat.status === "open";
        if (activeTab === "urgent") return chat.priority === "urgent" || chat.priority === "high";
        return true;
    });

    const selectedChatData = chats.find(c => c._id === selectedChat);

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

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedChat) return;

        try {
            await sendResponse({
                chatId: selectedChat,
                message: message.trim(),
            }).unwrap();
            setMessage("");
            refetchMessages();
            refetchChats();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to send message");
        }
    };

    const handleUseQuickReply = async (reply) => {
        if (!selectedChat) {
            toast.error("Please select a chat first");
            return;
        }

        try {
            await useQuickReply(reply._id).unwrap();
            setMessage(reply.message);
            refetchQuickReplies();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to use quick reply");
        }
    };

    const handleCreateQuickReply = async () => {
        if (!newQuickReplyTitle.trim() || !newQuickReplyMessage.trim()) {
            toast.error("Title and message are required");
            return;
        }

        try {
            await createQuickReply({
                title: newQuickReplyTitle.trim(),
                message: newQuickReplyMessage.trim(),
                category: "general"
            }).unwrap();
            toast.success("Quick reply created successfully");
            setShowQuickReplyModal(false);
            setNewQuickReplyTitle("");
            setNewQuickReplyMessage("");
            refetchQuickReplies();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to create quick reply");
        }
    };

    const handleDeleteQuickReply = (replyId) => {
        setQuickReplyToDelete(replyId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!quickReplyToDelete) return;
        try {
            await deleteQuickReply(quickReplyToDelete).unwrap();
            toast.success("Quick reply deleted successfully");
            refetchQuickReplies();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to delete quick reply");
        } finally {
            setShowDeleteModal(false);
            setQuickReplyToDelete(null);
        }
    };

    const getUserName = (chat) => {
        const user = chat.participants?.find(p => p.role !== 'admin');
        return user?.name || "User";
    };

    const getUserAvatar = (chat) => {
        const user = chat.participants?.find(p => p.role !== 'admin');
        return user?.avatar || null;
    };

    return (
        <AdminLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Support Chatbot Panel</h1>
                    <p className="text-gray-600">Manage customer support chats and quick replies</p>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Active Chats</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {stats?.activeChats || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <FiMessageSquare className="text-green-600 text-xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Pending</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {stats?.pending || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                <FiClock className="text-yellow-600 text-xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Resolved</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {stats?.resolved || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <FiXCircle className="text-red-600 text-xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Unresolved</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {stats?.unresolved || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <FiCheckCircle className="text-green-600 text-xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Chat List */}
                    <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
                        {/* Tabs */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setActiveTab("all")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                        activeTab === "all"
                                            ? "bg-yellow-500 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setActiveTab("active")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                        activeTab === "active"
                                            ? "bg-yellow-500 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setActiveTab("urgent")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                        activeTab === "urgent"
                                            ? "bg-yellow-500 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    Urgent
                                </button>
                            </div>
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search Chats"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>
                        </div>

                        {/* Chat List */}
                        <div className="flex-1 overflow-y-auto p-2">
                            {chatsLoading ? (
                                <div className="flex justify-center items-center h-32">
                                    <Spinner fullScreen={false} />
                                </div>
                            ) : tabFilteredChats.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    {activeTab === "active" ? "No active chats" : activeTab === "urgent" ? "No urgent chats" : "No chats found"}
                                </div>
                            ) : (
                                tabFilteredChats.map((chat) => {
                                    const userName = getUserName(chat);
                                    const userAvatar = getUserAvatar(chat);
                                    
                                    return (
                                        <div
                                            key={chat._id}
                                            onClick={() => setSelectedChat(chat._id)}
                                            className={`p-3 rounded-lg cursor-pointer border mb-2 transition ${
                                                selectedChat === chat._id
                                                    ? "bg-yellow-50 border-yellow-500"
                                                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                                                    {userAvatar ? (
                                                        <img
                                                            src={userAvatar}
                                                            alt={userName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        userName.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-800 text-sm truncate">
                                                        {userName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {chat.subject || "No subject"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Column - Chat View and Quick Replies */}
                    <div className="lg:col-span-2 grid grid-rows-2 gap-6">
                        {/* Top Right - Chat View */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
                            {selectedChat ? (
                                <>
                                    <div className="p-4 border-b border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                                                {getUserAvatar(selectedChatData) ? (
                                                    <img
                                                        src={getUserAvatar(selectedChatData)}
                                                        alt={getUserName(selectedChatData)}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    getUserName(selectedChatData).charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{getUserName(selectedChatData)}</p>
                                                <p className="text-sm text-gray-600">{selectedChatData?.subject}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                                        {messagesLoading ? (
                                            <div className="flex justify-center items-center h-32">
                                                <Spinner fullScreen={false} />
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="text-center text-gray-500 py-8">No messages yet</div>
                                        ) : (
                                            messages.map((msg) => {
                                                const isAdmin = msg.sender?.role === 'admin';
                                                const isBot = msg.isBot;
                                                return (
                                                    <div
                                                        key={msg._id}
                                                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div
                                                            className={`max-w-[70%] rounded-lg p-3 ${
                                                                isAdmin
                                                                    ? "bg-yellow-500 text-white"
                                                                    : isBot
                                                                    ? "bg-gray-200 text-gray-800"
                                                                    : "bg-white text-gray-800 border border-gray-200"
                                                            }`}
                                                        >
                                                            {isBot && (
                                                                <p className="text-xs font-semibold mb-1 opacity-75">🤖 AI Assistant</p>
                                                            )}
                                                            <p className="text-sm">{msg.message}</p>
                                                            <p className={`text-xs mt-1 ${
                                                                isAdmin ? 'text-yellow-100' : 'text-gray-500'
                                                            }`}>
                                                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <div className="p-4 border-t border-gray-200">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                placeholder="Type your message..."
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                            />
                                            <button
                                                onClick={handleSendMessage}
                                                disabled={!message.trim()}
                                                className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <FiSend />
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center text-gray-500">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-semibold mb-2">Select a chat to start</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Right - Quick Replies */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800">Quick Replies</h3>
                                <button
                                    onClick={() => setShowQuickReplyModal(true)}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 text-sm font-medium"
                                >
                                    <FiPlus />
                                    New
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {quickReplies.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <p>No templates yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {quickReplies.map((reply) => (
                                            <div
                                                key={reply._id}
                                                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-medium text-gray-800 text-sm">{reply.title}</h4>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleUseQuickReply(reply)}
                                                            className="text-yellow-600 hover:text-yellow-800 text-xs"
                                                            title="Use this reply"
                                                        >
                                                            Use
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteQuickReply(reply._id)}
                                                            className="text-red-600 hover:text-red-800"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-600 line-clamp-2">{reply.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Reply Modal */}
            {showQuickReplyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Create Quick Reply</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newQuickReplyTitle}
                                    onChange={(e) => setNewQuickReplyTitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    placeholder="Enter title..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    value={newQuickReplyMessage}
                                    onChange={(e) => setNewQuickReplyMessage(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    rows={4}
                                    placeholder="Enter message..."
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setShowQuickReplyModal(false);
                                        setNewQuickReplyTitle("");
                                        setNewQuickReplyMessage("");
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateQuickReply}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Quick Reply Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setQuickReplyToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Quick Reply"
                message="Are you sure you want to delete this quick reply? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </AdminLayout>
    );
};

export default Chatbot;
