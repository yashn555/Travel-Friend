import React, { useState } from 'react';
import { 
  FaUser, 
  FaMapMarkerAlt, 
  FaStar, 
  FaStarHalfAlt, 
  FaRegStar,
  FaMoneyBillWave,
  FaGlobeAmericas,
  FaLanguage,
  FaBus,
  FaPlane,
  FaTrain,
  FaCar,
  FaBiking,
  FaShip,
  FaHeart,
  FaExternalLinkAlt,
  FaChevronRight,
  FaCalendarAlt
} from 'react-icons/fa';
import { 
  MdTravelExplore,
  MdDirectionsCar,
  MdDirectionsBus,
  MdDirectionsBike,
  MdFlight,
  MdTrain,
  MdHotel,
  MdRestaurant,
  MdLocalActivity
} from 'react-icons/md';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const MatchCard = ({ match, onViewProfile }) => {
  const { user, matchPercentage } = match;
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Get match color based on percentage
  const getMatchColor = (percentage) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-600';
    if (percentage >= 60) return 'from-yellow-500 to-orange-500';
    if (percentage >= 40) return 'from-orange-500 to-amber-500';
    return 'from-red-400 to-pink-500';
  };

  // Get match text color
  const getMatchTextColor = (percentage) => {
    if (percentage >= 80) return 'text-green-800';
    if (percentage >= 60) return 'text-yellow-800';
    if (percentage >= 40) return 'text-orange-800';
    return 'text-red-800';
  };

  // Get match badge text
  const getMatchBadgeText = (percentage) => {
    if (percentage >= 90) return 'Perfect Match! ✨';
    if (percentage >= 80) return 'Great Match ⭐';
    if (percentage >= 70) return 'Good Match 👍';
    if (percentage >= 60) return 'Decent Match 👌';
    if (percentage >= 40) return 'Some Match 🤝';
    return 'Low Match 📊';
  };

  // Render animated star rating
  const renderMatchStars = (percentage) => {
    const stars = [];
    const fullStars = Math.floor(percentage / 20);
    const hasHalfStar = (percentage % 20) >= 10;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.1 }}
            className="text-yellow-500"
          >
            <FaStar className="text-lg drop-shadow-sm" />
          </motion.div>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="text-yellow-500"
          >
            <FaStarHalfAlt className="text-lg drop-shadow-sm" />
          </motion.div>
        );
      } else {
        stars.push(
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="text-gray-300"
          >
            <FaRegStar className="text-lg" />
          </motion.div>
        );
      }
    }
    return stars;
  };

  // Get icon for travel budget
  const getBudgetIcon = (budget) => {
    switch (budget) {
      case 'luxury': return '💎';
      case 'high': return '💰';
      case 'medium': return '💵';
      case 'budget': return '💸';
      default: return '🏷️';
    }
  };

  // Get icon for travel experience
  const getExperienceIcon = (experience) => {
    switch (experience) {
      case 'expert': return '🏆';
      case 'intermediate': return '⭐';
      case 'beginner': return '🌱';
      default: return '🌍';
    }
  };

  // Get icon for travel preference
  const getPreferenceIcon = (preference) => {
    switch (preference) {
      case 'adventure': return '🧗‍♂️';
      case 'cultural': return '🏛️';
      case 'relaxation': return '🏖️';
      case 'food': return '🍽️';
      case 'shopping': return '🛍️';
      case 'nature': return '🌲';
      case 'history': return '🏰';
      case 'nightlife': return '🌃';
      default: return '✨';
    }
  };

  // Get top travel preferences
  const getTopPreferences = () => {
    const preferences = user.travelPreferences || {};
    const truePreferences = Object.keys(preferences).filter(key => preferences[key]);
    return truePreferences.slice(0, 4);
  };

  // Toggle favorite
  const toggleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites!');
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        y: -5,
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300"
    >
      {/* Match Percentage Ribbon */}
      <div className={`absolute -right-10 top-4 transform rotate-45 px-12 py-1 ${getMatchTextColor(matchPercentage)} text-xs font-bold bg-gradient-to-r ${getMatchColor(matchPercentage)} text-white shadow-lg`}>
        {matchPercentage}%
      </div>

      {/* Favorite Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleFavorite}
        className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md"
      >
        <FaHeart className={isFavorite ? "text-red-500" : "text-gray-400"} />
      </motion.button>

      {/* Profile Gradient Background */}
      <div className={`h-32 bg-gradient-to-r ${getMatchColor(matchPercentage)} opacity-10`}></div>

      {/* User Profile Section */}
      <div className="relative px-6 pb-6">
        {/* Profile Image with Animated Border */}
        <motion.div
          animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
          className="absolute -top-12 left-1/2 transform -translate-x-1/2"
        >
          <div className="relative">
            <div className={`absolute -inset-1 rounded-full bg-gradient-to-r ${getMatchColor(matchPercentage)} opacity-20 blur-sm`}></div>
            <img
              src={
                user.profileImage && user.profileImage !== 'default-profile.jpg'
                  ? `http://localhost:5000/uploads/profiles/${user.profileImage}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=150&bold=true`
              }
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl relative"
            />
            {/* Online Status Indicator */}
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
        </motion.div>

        {/* User Info */}
        <div className="pt-16 text-center">
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold text-gray-800 mb-1"
          >
            {user.name}
            {user.gender && (
              <span className="ml-2 text-gray-500 text-sm font-normal">
                {user.gender === 'male' ? '♂️' : user.gender === 'female' ? '♀️' : ''}
              </span>
            )}
          </motion.h3>

          {/* Age and Location */}
          <div className="flex items-center justify-center text-gray-600 mb-3">
            {user.dateOfBirth && (
              <div className="flex items-center mr-4">
                <FaCalendarAlt className="mr-1 text-sm" />
                <span className="text-sm font-medium">{calculateAge(user.dateOfBirth)}</span>
              </div>
            )}
            <div className="flex items-center">
              <FaMapMarkerAlt className="mr-1 text-sm" />
              <span className="text-sm font-medium">
                {user.city || 'City'}
                {user.state && `, ${user.state}`}
              </span>
            </div>
          </div>

          {/* Match Stars and Badge */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="flex space-x-1">
              {renderMatchStars(matchPercentage)}
            </div>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getMatchTextColor(matchPercentage)} bg-opacity-20 bg-current`}>
              {getMatchBadgeText(matchPercentage)}
            </span>
          </div>

          {/* Bio */}
          {user.bio && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 text-sm mb-6 line-clamp-2 px-2"
            >
              "{user.bio}"
            </motion.p>
          )}

          {/* Travel Preferences Grid */}
          {getTopPreferences().length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-center">
                <MdTravelExplore className="mr-2 text-gray-500" />
                Travel Interests
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {getTopPreferences().map((pref, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                    className="flex flex-col items-center p-2 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm"
                  >
                    <span className="text-lg mb-1">{getPreferenceIcon(pref)}</span>
                    <span className="text-xs text-gray-600 font-medium capitalize truncate w-full text-center">
                      {pref}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Travel Details */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {/* Budget */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100"
            >
              <div className="text-2xl mb-2">{getBudgetIcon(user.travelBudget)}</div>
              <span className="text-xs text-gray-500 font-semibold">Budget</span>
              <span className="text-sm font-bold text-gray-800 capitalize mt-1">
                {user.travelBudget || 'Flexible'}
              </span>
            </motion.div>

            {/* Experience */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100"
            >
              <div className="text-2xl mb-2">{getExperienceIcon(user.travelExperience)}</div>
              <span className="text-xs text-gray-500 font-semibold">Level</span>
              <span className="text-sm font-bold text-gray-800 capitalize mt-1">
                {user.travelExperience || 'Explorer'}
              </span>
            </motion.div>

            {/* Languages */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100"
            >
              <FaLanguage className="text-2xl text-blue-500 mb-2" />
              <span className="text-xs text-gray-500 font-semibold">Languages</span>
              <span className="text-sm font-bold text-gray-800 mt-1">
                {user.languages?.length || 0}
              </span>
            </motion.div>
          </div>

          {/* View Profile Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewProfile(user._id)}
            className="group w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
          >
            <span className="flex items-center">
              View Full Profile
              <motion.span
                animate={isHovered ? { x: 5 } : { x: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FaExternalLinkAlt className="ml-2" />
              </motion.span>
            </span>
            <motion.div
              className="ml-3 opacity-0 group-hover:opacity-100"
              animate={{ x: isHovered ? 5 : 0 }}
            >
              <FaChevronRight />
            </motion.div>
          </motion.button>

          {/* Quick Stats */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center space-x-6 mt-4 text-xs text-gray-500"
          >
            {user.followersCount > 0 && (
              <div className="flex items-center">
                <FaUser className="mr-1" />
                <span className="font-semibold">{user.followersCount}</span>
                <span className="ml-1">followers</span>
              </div>
            )}
            {user.pastTrips?.length > 0 && (
              <div className="flex items-center">
                <MdLocalActivity className="mr-1" />
                <span className="font-semibold">{user.pastTrips.length}</span>
                <span className="ml-1">trips</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400"></div>
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -mr-12 -mb-12 opacity-30"></div>
      <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full -ml-8 -mt-8 opacity-30"></div>
    </motion.div>
  );
};

export default MatchCard;