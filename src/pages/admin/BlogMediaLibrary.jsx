import { FiInfo, FiAlertCircle, FiImage } from "react-icons/fi";

const BlogMediaLibrary = () => {
    // Coming Soon - This feature will be available soon
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Media Library</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your blog media files</p>
                </div>
            </div>

            {/* Coming Soon Notice */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center max-w-md mx-auto">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary-100 rounded-full p-4">
                            <FiImage className="h-12 w-12 text-primary-500" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h3>
                    <p className="text-gray-600 mb-6">
                        The media library feature is currently under development. 
                        You'll be able to upload, organize, and manage media files for your blog posts soon.
                    </p>
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-left">
                        <div className="flex items-start">
                            <FiAlertCircle className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="text-sm text-primary-800">
                                <p className="font-semibold mb-1">What to expect:</p>
                                <ul className="list-disc list-inside space-y-1 text-primary-700">
                                    <li>Upload images, videos, and documents</li>
                                    <li>Organize media by categories or tags</li>
                                    <li>Search and filter media files</li>
                                    <li>Bulk upload and delete operations</li>
                                    <li>Integration with Cloudinary storage</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> For now, you can upload images directly when creating or editing blog posts.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogMediaLibrary;