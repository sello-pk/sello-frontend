import { useState } from "react";
import { FiInfo, FiAlertCircle } from "react-icons/fi";

const BlogComments = () => {
    const [filter, setFilter] = useState("all");

    // Coming Soon - This feature will be available soon
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Blog Comments</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage comments on your blog posts</p>
                </div>
            </div>

            {/* Coming Soon Notice */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center max-w-md mx-auto">
                    <div className="flex justify-center mb-4">
                        <div className="bg-orange-100 rounded-full p-4">
                            <FiInfo className="h-12 w-12 text-orange-500" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h3>
                    <p className="text-gray-600 mb-6">
                        The blog comments management feature is currently under development. 
                        You'll be able to moderate, approve, and manage comments on your blog posts soon.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                        <div className="flex items-start">
                            <FiAlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <p className="font-semibold mb-1">What to expect:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700">
                                    <li>View and filter comments by status</li>
                                    <li>Approve or reject pending comments</li>
                                    <li>Mark comments as spam</li>
                                    <li>Delete inappropriate comments</li>
                                    <li>Reply to comments directly</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogComments;
    const [isLoading, setIsLoading] = useState(false);

    // Mock data for comments
    const comments = [
        {
            id: 1,
            author: "John Doe",
            email: "john@example.com",
            content: "This is a great blog post! I learned a lot from reading it.",
            postTitle: "How to Build a Modern React App",
            date: "2023-05-15",
            status: "approved"
        },
        {
            id: 2,
            author: "Jane Smith",
            email: "jane@example.com",
            content: "I have a question about the implementation. Can you provide more details?",
            postTitle: "Understanding JavaScript Closures",
            date: "2023-05-14",
            status: "pending"
        },
        {
            id: 3,
            author: "Mike Johnson",
            email: "mike@example.com",
            content: "This information is outdated. Please update the content.",
            postTitle: "Top 10 CSS Frameworks in 2022",
            date: "2023-05-12",
            status: "spam"
        }
    ];

    const handleApprove = (commentId) => {
        // TODO: Implement approve comment API call
        toast.success("Comment approved");
    };

    const handleDelete = (commentId) => {
        // TODO: Implement delete comment API call
        toast.success("Comment deleted");
    };

    const filteredComments = comments.filter(comment => {
        if (filter === "all") return true;
        return comment.status === filter;
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Blog Comments</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage comments on your blog posts</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-sm font-medium text-gray-700">Filter:</span>
                    
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                            filter === "all"
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        All
                    </button>
                    
                    <button
                        onClick={() => setFilter("approved")}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                            filter === "approved"
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        Approved
                    </button>
                    
                    <button
                        onClick={() => setFilter("pending")}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                            filter === "pending"
                                ? "bg-yellow-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        Pending
                    </button>
                    
                    <button
                        onClick={() => setFilter("spam")}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                            filter === "spam"
                                ? "bg-red-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        Spam
                    </button>
                </div>
            </div>

            {/* Comments Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Author</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Comment</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Post</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center">
                                        <Spinner fullScreen={false} />
                                    </td>
                                </tr>
                            ) : filteredComments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No comments found
                                    </td>
                                </tr>
                            ) : (
                                filteredComments.map((comment) => (
                                    <tr key={comment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{comment.author}</div>
                                            <div className="text-sm text-gray-500">{comment.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900 max-w-md truncate" title={comment.content}>
                                                {comment.content}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {comment.postTitle}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {comment.date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                comment.status === "approved"
                                                    ? "bg-green-100 text-green-800"
                                                    : comment.status === "pending"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}>
                                                {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {comment.status === "pending" && (
                                                    <button
                                                        onClick={() => handleApprove(comment.id)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Approve"
                                                    >
                                                        <FiCheck size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(comment.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BlogComments;