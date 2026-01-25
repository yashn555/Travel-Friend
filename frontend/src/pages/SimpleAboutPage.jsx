import React from 'react';
import { motion } from 'framer-motion';
import SimpleFooter from '../components/layout/SimpleFooter';
import TravelLogo from '../assets/travel-friend-logo.png';
import { useNavigate } from 'react-router-dom';

const SimpleAboutPage = () => {
    const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative pt-12 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              About <span className="text-blue-600">Travel-Friend</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Connecting Indian travelers since 2026
            </p>
          </motion.div>

          {/* Logo Image with Style */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2 
            }}
            className="mb-12 flex justify-center"
          >
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500"></div>
              
              {/* Main Logo Container */}
              <div className="relative">
                {/* Outer Border */}
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl animate-pulse"></div>
                
                {/* Logo Image Container */}
                <div className="relative bg-white p-6 rounded-2xl border-4 border-white shadow-2xl">
                  {/* Logo Image */}
                  <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <img 
                      src={TravelLogo} 
                      alt="TravelBuddy Logo"
                      className="w-48 h-48 object-contain rounded-xl"
                    />
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm">⭐</span>
                  </div>
                  <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm">❤️</span>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
                className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-r from-blue-300 to-cyan-300 rounded-full flex items-center justify-center border-4 border-white shadow-lg"
              >
                <span className="text-white">🌍</span>
              </motion.div>

              <motion.div
                animate={{ 
                  y: [0, 10, 0],
                  rotate: [0, -10, 10, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className="absolute -bottom-6 -right-6 w-12 h-12 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full flex items-center justify-center border-4 border-white shadow-lg"
              >
                <span className="text-white">👥</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full border border-blue-200"
          >
            <p className="text-gray-700 font-medium">
              "Where journeys become friendships"
            </p>
          </motion.div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              We believe every Indian traveler should have access to safe, affordable, 
              and memorable group travel experiences. Our platform connects solo travelers, 
              friends, and families to explore India's beautiful destinations together.
            </p>
          </motion.div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: '🤝',
                title: 'Make Friends',
                description: 'Connect with like-minded travelers across India'
              },
              {
                icon: '💰',
                title: 'Save Money',
                description: 'Split costs and get group discounts'
              },
              {
                icon: '🛡️',
                title: 'Travel Safe',
                description: 'Verified profiles and secure platform'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-lg text-center"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-8 text-white mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '10,000+', label: 'Travelers' },
                { value: '50+', label: 'Cities' },
                { value: '1,000+', label: 'Trips' },
                { value: '95%', label: 'Happy Users' }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-blue-100">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Founder Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mb-16"
          >
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-8 rounded-2xl border border-cyan-100 text-center">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                {/* Founder Avatar */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative"
                >
                  <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-xl">
                    YN
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white">👑</span>
                  </div>
                </motion.div>
                
                {/* Founder Info */}
                <div className="text-left">
                  <div className="inline-block px-4 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-3">
                    <span className="text-white text-sm font-medium">Creator</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Yash Nagapure</h3>
                  <p className="text-gray-700 mb-4">
                    Passionate about connecting people through travel. 
                    Founded Travel-friend with a simple goal: making group travel accessible, 
                    safe, and fun for every Indian traveler.
                  </p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📍</span>
                    <span>Based in India</span>
                    <span className="mx-2">•</span>
                    <span>🎓</span>
                    <span>Travel Enthusiast</span>
                  </div>
                </div>
              </div>
              
              {/* Quote */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 pt-8 border-t border-cyan-200"
              >
                <p className="text-gray-800 italic text-lg">
                  "Travel is not just about places, it's about people. 
                  I created Travel-Friend to help solo travelers find their tribe 
                  and create memories that last a lifetime."
                </p>
                <p className="text-gray-600 mt-2">— Yash Nagapure</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Story */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-2xl border border-amber-100"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
            <p className="text-gray-700 mb-4">
              It all started with a simple idea: traveling is more fun with friends. 
              As solo travelers ourselves, we faced the challenges of finding reliable 
              travel companions in India.
            </p>
            <p className="text-gray-700">
              Today, Travel-Friend has grown into a community of thousands of Indian travelers 
              exploring together, creating memories, and forming lifelong friendships.
            </p>
          </motion.div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-12 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Travel?</h2>
          <p className="text-gray-600 mb-6">
            Join our community of Indian travelers today
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => navigate('/dashboard')}
          >
            Start Your Journey
          </motion.button>
        </motion.div>
      </div>

      <SimpleFooter />
    </div>
  );
};

export default SimpleAboutPage;