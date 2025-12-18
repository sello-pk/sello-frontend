import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
    useGetAllChatsQuery,
    useGetChatStatisticsQuery,
    useGetAllSupportChatsQuery,
} from "../../redux/services/adminApi";
import Spinner from "../../components/Spinner";
import { FiSearch, FiMessageSquare, FiTrendingUp, FiEye } from "react-icons/fi";
import { HiChatBubbleLeftRight } from "react-icons/hi2";
import { MdFlag } from "react-icons/md";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes";

const ChatMonitoring = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    const { data: chatsData, isLoading: chatsLoading } = useGetAllChatsQuery({});
    const { data: stats } = useGetChatStatisticsQuery();
    const { data: supportChatsData, isLoading: supportChatsLoading } = useGetAllSupportChatsQuery({}, {
        pollingInterval: 5000, // Update every 5 seconds
    });

    const chatList = chatsData?.chats || [];
    const supportChats = supportChatsData?.chats || [];
    const allChats = [...supportChats, ...chatList];

    // Filter chats based on search
    const filteredChats = allChats.filter(chat => {
        if (!searchQuery) return true;
        const userName = chat.user?.name || chat.participants?.[0]?.name || '';
        const lastMessage = chat.lastMessage || '';
        return userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Calculate statistics
    const totalMessages = stats?.totalMessages || allChats.reduce((sum, chat) => sum + (chat.messageCount || 0), 0);
    const flaggedMessages = supportChats.filter(c => c.priority === 'urgent' || c.priority === 'high').length;
    const todayMessages = allChats.filter(chat => {
        const today = new Date().setHours(0, 0, 0, 0);
        const chatDate = new Date(chat.lastMessageAt || chat.createdAt).setHours(0, 0, 0, 0);
        return chatDate === today;
    }).length;

    const handleOpenChat = (chatId, chatType) => {
        // Navigate to Support Chatbot with selected chat
        if (chatType === 'support') {
            navigate(ROUTES.admin.supportChatbotWithId(chatId));
        } else {
            // For car chats, you might want to implement a different view
            // For now, we'll also redirect to support chatbot
            navigate(ROUTES.admin.supportChatbotWithId(chatId));
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Chat & Inquiry History</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Monitor buyer-seller communications
                    </p>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Messages */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-2">Total Messages</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {totalMessages > 1000000 
                                        ? `${(totalMessages / 1000000).toFixed(1)}M` 
                                        : totalMessages > 1000 
                                        ? `${(totalMessages / 1000).toFixed(1)}K` 
                                        : totalMessages}
                                </p>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-yellow-500 flex items-center justify-center shadow-lg">
                                <HiChatBubbleLeftRight className="text-white" size={28} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <FiTrendingUp size={14} className="text-green-500" />
                            <span className="text-xs font-medium text-green-600">+16%</span>
                            <span className="text-xs text-gray-500">vs last month</span>
                        </div>
                    </div>

                    {/* Flagged Messages */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-2">Flagged Messages</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {flaggedMessages}
                                </p>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg">
                                <MdFlag className="text-white" size={28} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <FiTrendingUp size={14} className="text-green-500" />
                            <span className="text-xs font-medium text-green-600">+16%</span>
                            <span className="text-xs text-gray-500">vs last month</span>
                        </div>
                    </div>

                    {/* Today's Messages */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-2">Today's Messages</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {todayMessages}
                                </p>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg">
                                <FiMessageSquare className="text-white" size={28} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <FiTrendingUp size={14} className="text-green-500" />
                            <span className="text-xs font-medium text-green-600">+16%</span>
                            <span className="text-xs text-gray-500">vs last month</span>
                        </div>
                    </div>
                </div>

                {/* Chat List Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header and Search */}
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">All Conversations</h3>
                        <div className="relative w-full">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-sm"
                            />
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="overflow-x-auto">
                        {chatsLoading || supportChatsLoading ? (
                            <div className="flex justify-center py-20">
                                <Spinner fullScreen={false} />
                            </div>
                        ) : filteredChats.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-500 text-base">No conversations found</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Last Message</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredChats.map((chat) => {
                                        const user = chat.user || chat.participants?.[0] || {};
                                        const chatStatus = chat.status || (chat.isActive ? "active" : "closed");
                                        const chatType = chat.chatType || 'car';
                                        
                                        return (
                                            <tr key={chat._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-sm font-medium text-yellow-700">
                                                                {(user.name || 'U').charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {user.name || 'Unknown User'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {user.email || 'No email'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs truncate text-sm text-gray-600">
                                                        {chat.lastMessage || 'No messages yet'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        chatType === 'support' 
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {chatType === 'support' ? 'Support' : 'Car Inquiry'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {chat.lastMessageAt || chat.createdAt
                                                        ? formatDistanceToNow(new Date(chat.lastMessageAt || chat.createdAt), { addSuffix: true })
                                                        : "N/A"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        chatStatus === "active" || chatStatus === "open"
                                                            ? "bg-green-100 text-green-800"
                                                            : chatStatus === "pending"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}>
                                                        {chatStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleOpenChat(chat._id, chatType)}
                                                        className="flex items-center gap-2 px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                                                    >
                                                        <FiEye size={16} />
                                                        Open Chat
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ChatMonitoring;
