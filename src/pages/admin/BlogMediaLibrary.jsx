import { useState } from "react";
import Spinner from "../../components/Spinner";
import toast from "react-hot-toast";
import { FiUpload, FiTrash2, FiX, FiImage } from "react-icons/fi";

const BlogMediaLibrary = () => {
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Mock data for media files
    const mediaFiles = [
        {
            id: 1,
            name: "car-interior.jpg",
            url: "https://images.unsplash.com/photo-1571977050100-d0d7059e45f4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80",
            type: "image/jpeg",
            size: "2.4 MB",
            date: "2023-05-15"
        },
        {
            id: 2,
            name: "engine-detail.jpg",
            url: "https://images.unsplash.com/photo-1542362567-b07e54358753?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80",
            type: "image/jpeg",
            size: "1.8 MB",
            date: "2023-05-14"
        },
        {
            id: 3,
            name: "dashboard-view.jpg",
            url: "https://images.unsplash.com/photo-1549399542-7e7f8c7b6c4b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80",
            type: "image/jpeg",
            size: "3.1 MB",
            date: "2023-05-12"
        }
    ];

    const handleFileChange = (e) => {
        setSelectedFiles(Array.from(e.target.files));
    };

    const handleUpload = () => {
        if (selectedFiles.length === 0) return;
        
        setIsLoading(true);
        // Simulate upload process
        setTimeout(() => {
            setIsLoading(false);
            setShowUploadModal(false);
            setSelectedFiles([]);
            // In a real app, you would update the media list here
        }, 1500);
    };

    const handleDelete = (fileId) => {
        // TODO: Implement delete file API call
        toast.success("File deleted");
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Media Library</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your blog media files</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
                >
                    <FiUpload size={18} />
                    Upload Media
                </button>
            </div>

            {/* Media Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {mediaFiles.length === 0 ? (
                    <div className="text-center py-12">
                        <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No media files</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by uploading a new media file.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600"
                            >
                                <FiUpload className="-ml-1 mr-2 h-5 w-5" />
                                Upload Media
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {mediaFiles.map((file) => (
                            <div key={file.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                                    <img 
                                        src={file.url} 
                                        alt={file.name} 
                                        className="object-cover w-full h-48"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                                        {file.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">{file.size}</p>
                                    <p className="text-xs text-gray-500">{file.date}</p>
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={() => handleDelete(file.id)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Delete"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                        <button
                            onClick={() => setShowUploadModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <FiX size={24} />
                        </button>

                        <h3 className="text-xl font-bold mb-4">Upload Media</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Files
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-orange-500 hover:text-orange-600">
                                            <span>Upload a file</span>
                                            <input 
                                                type="file" 
                                                multiple 
                                                onChange={handleFileChange}
                                                className="sr-only" 
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                        </div>
                                    <p className="text-xs text-gray-500">
                                        PNG, JPG, GIF up to 10MB
                                    </p>
                                </div>
                                {selectedFiles.length > 0 && (
                                    <div className="mt-2 text-sm text-gray-500">
                                        Selected {selectedFiles.length} file(s)
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={selectedFiles.length === 0 || isLoading}
                                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isLoading ? <Spinner fullScreen={false} /> : "Upload"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogMediaLibrary;