import React from "react";
import { useNavigate } from "react-router-dom";
import HelpArticlePage from "./HelpArticlePage";

const Policies = () => {
  const navigate = useNavigate();

  const content = (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Terms of Service</h2>
        <p className="text-gray-700 mb-4">
          By using Sello, you agree to our Terms of Service. These terms govern your use of our platform and services.
        </p>
        <button
          onClick={() => navigate("/terms-conditon")}
          className="text-primary-500 hover:text-primary-500 font-medium underline"
        >
          Read Full Terms & Conditions →
        </button>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Privacy Policy</h2>
        <p className="text-gray-700 mb-4">
          We are committed to protecting your privacy. Our Privacy Policy explains how we collect, use, and protect your personal information.
        </p>
        <button
          onClick={() => navigate("/privacy-policy")}
          className="text-primary-500 hover:text-primary-500 font-medium underline"
        >
          Read Full Privacy Policy →
        </button>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Guidelines</h2>
        <p className="text-gray-700 mb-4">
          To ensure a safe and positive experience for all users:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Provide accurate information in your listings</li>
          <li>Respect other users and communicate professionally</li>
          <li>Do not post fraudulent or misleading content</li>
          <li>Follow all applicable laws and regulations</li>
          <li>Report suspicious or inappropriate behavior</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Content Policy</h2>
        <p className="text-gray-700 mb-4">
          Guidelines for listing content:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>All listings must be for legitimate vehicles</li>
          <li>Photos must accurately represent the vehicle</li>
          <li>No prohibited or illegal items</li>
          <li>No spam, duplicate, or misleading listings</li>
        </ul>
      </section>
    </div>
  );

  return (
    <HelpArticlePage
      title="Policies & Terms"
      content={content}
      category="Legal"
    />
  );
};

export default Policies;
