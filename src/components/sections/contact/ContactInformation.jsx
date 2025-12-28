import React from "react";
import { MdEmail, MdLocationOn } from "react-icons/md";
import { FaPhoneAlt, FaClock } from "react-icons/fa";
import { FiMail, FiPhone, FiMapPin, FiClock } from "react-icons/fi";

const ContactInformation = () => {
  const contactInfo = [
    {
      icon: FiMail,
      title: "Email Address",
      items: [
        { label: "General Inquiries", value: import.meta.env.VITE_SUPPORT_EMAIL || "info@example.com", link: `mailto:${import.meta.env.VITE_SUPPORT_EMAIL || "info@example.com"}` },
        { label: "Support", value: import.meta.env.VITE_SUPPORT_EMAIL || "support@example.com", link: `mailto:${import.meta.env.VITE_SUPPORT_EMAIL || "support@example.com"}` },
      ],
      color: "bg-primary-50 text-primary-600",
    },
    {
      icon: FiPhone,
      title: "Phone Number",
      items: [
        { label: "Main Office", value: "+92 42 1234567", link: "tel:+92421234567" },
        { label: "Support Line", value: "+92 300 1234567", link: "tel:+923001234567" },
      ],
      color: "bg-green-50 text-green-600",
    },
    {
      icon: FiMapPin,
      title: "Office Address",
      items: [
        { label: "Head Office", value: "Sello Head Office, Gulberg, Lahore, Pakistan", link: null },
      ],
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: FiClock,
      title: "Business Hours",
      items: [
        { label: "Sunday - Thursday", value: "9:00 AM - 6:00 PM", link: null },
        { label: "Friday", value: "9:00 AM - 1:00 PM", link: null },
        { label: "Saturday", value: "Closed", link: null },
      ],
      color: "bg-primary-50 text-primary-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Contact Information
        </h2>
        <p className="text-gray-600 mb-8">
          Reach out to us through any of these channels. We're here to help you with any questions or concerns.
        </p>

        <div className="space-y-6">
          {contactInfo.map((info, index) => {
            const IconComponent = info.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className={`${info.color} p-3 rounded-lg flex-shrink-0`}>
                    <IconComponent size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {info.title}
                    </h3>
                    <div className="space-y-2">
                      {info.items.map((item, itemIndex) => (
                        <div key={itemIndex}>
                          {item.link ? (
                            <a
                              href={item.link}
                              className="block text-gray-700 hover:text-primary-500 transition-colors"
                            >
                              <span className="text-sm font-medium text-gray-500 block mb-1">
                                {item.label}:
                              </span>
                              <span className="text-base">{item.value}</span>
                            </a>
                          ) : (
                            <div>
                              <span className="text-sm font-medium text-gray-500 block mb-1">
                                {item.label}:
                              </span>
                              <span className="text-base text-gray-700">{item.value}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Help Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-xl p-8 text-white">
        <h3 className="text-xl font-bold mb-3">Need Immediate Assistance?</h3>
        <p className="text-primary-100 mb-4">
          Our support team is available 24/7 to help you with any urgent matters.
        </p>
        <a
          href="tel:+97145061300"
          className="inline-flex items-center gap-2 bg-white text-primary-500 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          <FiPhone size={20} />
          Call Now: +971 45 061 300
        </a>
      </div>
    </div>
  );
};

export default ContactInformation;
