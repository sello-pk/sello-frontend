import React from "react";
import { footerData } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import {
  apple,
  android,
  facebook,
  twitter,
  instagram,
  linkedin,
} from "../assets/assets";
import { FaYoutube } from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";

const Footer = () => {
  const navigate = useNavigate();

  const handleFilterClick = (path) => {
    navigate(path);
  };

  return (
    <footer className="bg-[#050B20] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 lg:gap-12 mb-16">
          {footerData.map((section, index) => (
            <div key={index}>
              {section.title && (
                <h4 className="text-sm font-semibold text-white mb-5 tracking-wide">
                  {section.title}
                </h4>
              )}

              {/* Links */}
              <ul className="space-y-3">
                {section.links &&
                  section.links.map((link, i) => (
                    <li key={i}>
                      {link.path ? (
                        <Link
                          to={link.path}
                          onClick={() =>
                            link.path.startsWith("/filter") &&
                            handleFilterClick(link.path)
                          }
                          className="text-sm text-gray-300 hover:text-white transition-colors duration-200 inline-block"
                        >
                          {link.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-300">
                          {link.name}
                        </span>
                      )}
                    </li>
                  ))}
                {section.types &&
                  section.types.map((type, i) => (
                    <li key={i} className="text-sm text-gray-300">
                      {type}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-12 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Contact Information */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-5 tracking-wide">
                Contact Us
              </h4>
              <div className="space-y-3 text-sm text-gray-300">
                <p>
                  <span className="font-medium text-white">Address:</span>{" "}
                  Sello.ae Head Office, JLT, Dubai, UAE
                </p>
                <p>
                  <span className="font-medium text-white">Phone:</span>{" "}
                  <a
                    href="tel:+97145061300"
                    className="hover:text-white transition-colors duration-200"
                  >
                    +923134211023
                  </a>
                </p>
                <p>
                  <span className="font-medium text-white">Email:</span>{" "}
                  <a
                    href="mailto:info@sello.ae"
                    className="hover:text-white transition-colors duration-200"
                  >
                    support@sello.pk
                  </a>
                </p>
              </div>
            </div>

            {/* Mobile App Downloads */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-5 tracking-wide">
                Download Our App
              </h4>
              <div className="space-y-3">
                {/* App Store Button */}
                <a
                  href="https://apps.apple.com/app/sello"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3.5 transition-all duration-300 w-full md:w-auto min-w-[200px] group border border-white/10"
                >
                  <div className="flex-shrink-0">
                    <img
                      src={apple}
                      alt="App Store"
                      className="w-8 h-8 object-contain brightness-0 invert"
                    />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[10px] text-white/70 font-medium uppercase tracking-wide leading-tight mb-0.5">
                      Download on the
                    </p>
                    <p className="text-sm font-semibold text-white leading-tight">
                      App Store
                    </p>
                  </div>
                </a>

                {/* Google Play Button */}
                <a
                  href="https://play.google.com/store/apps/details?id=ae.sello"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3.5 transition-all duration-300 w-full md:w-auto min-w-[200px] group border border-white/10"
                >
                  <div className="flex-shrink-0">
                    <img
                      src={android}
                      alt="Google Play"
                      className="w-8 h-8 object-contain brightness-0 invert"
                    />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[10px] text-white/70 font-medium uppercase tracking-wide leading-tight mb-0.5">
                      Get it on
                    </p>
                    <p className="text-sm font-semibold text-white leading-tight">
                      Google Play
                    </p>
                  </div>
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-5 tracking-wide">
                Follow Us
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href="https://web.facebook.com/profile.php?id=61584930269294&mibextid=wwXIfr&rdid=6QUy9q5xMtmsDjOi&share_url=https%3A%2F%2Fweb.facebook.com%2Fshare%2F19jao3GFzS%2F%3Fmibextid%3DwwXIfr%26_rdc%3D1%26_rdr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/10 group"
                  title="Facebook"
                >
                  <img
                    src={facebook}
                    alt="Facebook"
                    className="w-5 h-5 brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </a>

                <a
                  href="https://www.instagram.com/sello.p.k"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/10 group"
                  title="Instagram"
                >
                  <img
                    src={instagram}
                    alt="Instagram"
                    className="w-5 h-5 brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </a>
                <a
                  href="https://youtube.com/@sello.p.k?si=OxPdwNCh2HLERIt8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/10 group"
                  title="LinkedIn"
                >
                  <FaYoutube className="w-5 h-5 brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />
                </a>
                <a
                  href="https://www.tiktok.com/@sello..pk?_r=1&_t=ZS-92DrKceCaAi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/10 group"
                  title="LinkedIn"
                >
                  <FaTiktok className="w-5 h-5 brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright & Legal */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()}{" "}
            <a
              href="https://sello.pk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-400 transition-colors duration-200 font-medium"
            >
              Sello.ae
            </a>
            . All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link
              to="/terms-conditon"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Terms & Conditions
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              to="/help-center"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Help Center
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              to="/privacy-policy"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
