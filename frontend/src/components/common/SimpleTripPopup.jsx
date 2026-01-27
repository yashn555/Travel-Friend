// src/components/common/SimpleTripPopup.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaRocket, FaTimes } from 'react-icons/fa';

const SimpleTripPopup = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  const messages = [
    "🚀 Discover amazing destinations!",
    "✨ Let's plan your next adventure!",
    "🌍 Ready to explore new places?",
    "🏔️ Find your perfect getaway!",
    "✈️ Get personalized trip suggestions!"
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Show after 3 seconds
    const timer = setTimeout(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setMessage(randomMsg);
      setIsVisible(true);
    }, 3000);

    // Auto-hide after 15 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 15000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleClick = () => {
    navigate('/suggest-trip');
    setIsVisible(false);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, x: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, x: 50, scale: 0.8 }}
        transition={{ type: "spring", damping: 25 }}
        className="fixed bottom-6 right-6 z-50 w-full max-w-xs sm:max-w-sm"
      >
        <div className="relative">
          {/* Main Popup Card */}
          <motion.div 
            whileHover={{ scale: 1.03, x: -5 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleClick}
            className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl cursor-pointer overflow-hidden group border-2 border-white/30"
          >
            {/* Animated Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50"></div>
            
            <div className="relative p-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ 
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                  className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <FaRocket className="text-white text-xl" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm sm:text-base">{message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-white/90 text-xs sm:text-sm">Click for suggestions →</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 15, ease: "linear" }}
              className="h-1 bg-gradient-to-r from-white/40 to-white/20"
            />
          </motion.div>

          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <FaTimes size={12} />
          </motion.button>

          {/* Floating Decorative Elements */}
          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -top-3 -left-3 w-4 h-4 bg-yellow-400 rounded-full shadow-lg"
          />
          <motion.div 
            animate={{ 
              y: [0, 10, 0],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            className="absolute -bottom-2 -right-2 w-3 h-3 bg-cyan-400 rounded-full shadow-lg"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SimpleTripPopup;