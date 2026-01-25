import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHeart, FaInstagram, FaTwitter, FaFacebook, FaLinkedin } from 'react-icons/fa';

const SimpleFooter = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Social media links
  const socialLinks = {
    instagram: "https://www.instagram.com/yash.n_35?utm_source=qr",
    linkedin: "https://www.linkedin.com/in/yash-nagapure-46ba66287/",
    twitter: "#", // Add your Twitter link here
    facebook: "#"  // Add your Facebook link here
  };

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white px-4 py-4">
      <div className="max-w-6xl mx-auto">

        {/* Top Row */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">

          {/* Logo */}
          <div className="text-center md:text-left">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              TRAVEL-FRIEND
            </h2>
            <p className="text-xs text-gray-400">
              Connecting Indian Travelers
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-4 text-sm">
            {['About', 'Contact', 'Privacy', 'Terms', 'Help'].map((item) => (
              <motion.button
                key={item}
                whileHover={{ scale: 1.08 }}
                onClick={() => {
                  if (item === 'About') navigate('/about');
                  // Add navigation for other links as needed
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {item}
              </motion.button>
            ))}
          </div>

          {/* Social Icons */}
          <div className="flex gap-3">
            {/* Instagram */}
            <motion.a
              whileHover={{ scale: 1.15 }}
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-500 transition-colors"
              aria-label="Instagram"
            >
              <FaInstagram />
            </motion.a>

            {/* Twitter - Replace "#" with your actual Twitter link */}
            <motion.a
              whileHover={{ scale: 1.15 }}
              href={socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-400 transition-colors"
              aria-label="Twitter"
            >
              <FaTwitter />
            </motion.a>

            {/* Facebook - Replace "#" with your actual Facebook link */}
            <motion.a
              whileHover={{ scale: 1.15 }}
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-600 transition-colors"
              aria-label="Facebook"
            >
              <FaFacebook />
            </motion.a>

            {/* LinkedIn */}
            <motion.a
              whileHover={{ scale: 1.15 }}
              href={socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-500 transition-colors"
              aria-label="LinkedIn"
            >
              <FaLinkedin />
            </motion.a>
          </div>
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-gray-700/50" />

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 gap-2">
          <p>© {currentYear} TRAVEL-FRIEND.PVT.LTD.🇮🇳</p>
          <p>
            Made with <FaHeart className="inline text-red-400 mx-1" /> in India
          </p>
        </div>

      </div>
    </footer>
  );
};

export default SimpleFooter;