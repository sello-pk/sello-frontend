import { useState } from "react";
import { FiInfo, FiAlertCircle } from "react-icons/fi";
import AdminLayout from "../../components/admin/AdminLayout";

const BlogComments = () => {
  const [filter, setFilter] = useState("all");

  // Coming Soon - This feature will be available soon
  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Blog Comments</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage comments on your blog posts
            </p>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <div className="bg-primary-100 rounded-full p-4">
                <FiInfo className="h-12 w-12 text-primary-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Coming Soon
            </h3>
            <p className="text-gray-600 mb-6">
              The blog comments management feature is currently under
              development. You'll be able to moderate, approve, and manage
              comments on your blog posts soon.
            </p>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-left">
              <div className="flex items-start">
                <FiAlertCircle className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-primary-800">
                  <p className="font-semibold mb-1">What to expect:</p>
                  <ul className="list-disc list-inside space-y-1 text-primary-700">
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
    </AdminLayout>
  );
};

export default BlogComments;
