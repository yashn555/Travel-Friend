import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutAsync } from '../../redux/slices/authSlice';
import { getMyChats } from '../../services/chatService';
import { getCurrentUser } from '../../services/authService';
import logo from '../../assets/travel-friend-logo.png';
import {
  FaBell,
  FaEnvelope,
  FaUserCircle,
  FaSignOutAlt,
  FaCommentDots,
  FaHome,
  FaUsers,
  FaComments,
  FaUserFriends,
  FaGlobeAmericas
} from 'react-icons/fa';
import { HiOutlineSparkles } from 'react-icons/hi';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) fetchUnreadCounts();
    
    // Add scroll effect for header
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated, user]);

  const fetchUnreadCounts = async () => {
    try {
      const chats = await getMyChats();
      let count = 0;

      chats?.forEach(chat =>
        chat.messages?.forEach(msg => {
          if (!msg.readBy?.some(r => r.user === user._id)) count++;
        })
      );
      setUnreadMessageCount(count);

      const userData = await getCurrentUser();
      const unread = userData?.user?.notifications?.filter(n => !n.read) || [];
      setUnreadNotificationCount(unread.length);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutAsync());
    navigate('/login');
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg' 
        : 'bg-white/90 backdrop-blur-lg border-b border-white/30'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          
{/* LEFT – LOGO */}
<Link to="/" className="flex items-center gap-3 group">
  <div className="relative">
    <img
      src={logo}
      alt="Travel Friend Logo"
      className="w-12 h-12 lg:w-14 lg:h-14 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300"
    />
  </div>

  <div>
    <span className="hidden sm:block text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
      Travel-Friend
    </span>
    <span className="hidden sm:block text-xs text-gray-500 font-medium">
      Connect • Explore • Share
    </span>
  </div>
</Link>

          {/* CENTER – NAVIGATION */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center justify-center gap-1">
              {[
                { to: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
                { to: '/groups', icon: <FaUsers />, label: 'Groups' },
                { to: '/chat', icon: <FaComments />, label: 'Public Chat' },
                { to: '/private-chat', icon: <FaCommentDots />, label: 'Private Chat' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 group"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>
          )}

          {/* RIGHT – USER ACTIONS */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Private Chat with Badge */}
                <Link 
                  to="/private-chat" 
                  className="relative p-2.5 rounded-xl text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 lg:hidden group"
                  title="Private Chat"
                >
                  <FaCommentDots size={20} className="group-hover:scale-110 transition-transform" />
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </Link>

                {/* Public Chat with Badge (Mobile only) */}
                <Link 
                  to="/chat" 
                  className="relative p-2.5 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 lg:hidden group"
                  title="Public Chat"
                >
                  <FaComments size={20} className="group-hover:scale-110 transition-transform" />
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-indigo-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <Link 
                  to="/notifications" 
                  className="relative p-2.5 rounded-xl text-gray-600 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 group"
                >
                  <FaBell size={20} className="group-hover:scale-110 transition-transform" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </Link>

                {/* Profile Dropdown */}
                <div className="relative group">
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-2xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center ring-2 ring-white shadow-md">
                        {user?.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt={user.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <FaUserCircle className="text-indigo-600 text-2xl" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white"></div>
                    </div>
                    <div className="hidden lg:block">
                      <div className="text-sm font-semibold text-gray-800">{user?.name?.split(' ')[0]}</div>
                      <div className="text-xs text-gray-500">Traveler</div>
                    </div>
                  </Link>
                  
                  {/* Logout dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-2 mt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                      >
                        <FaSignOutAlt className="text-red-500" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* LOGIN/SIGNUP BUTTONS */
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className="px-5 py-2.5 text-gray-700 hover:text-indigo-600 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* MOBILE NAVIGATION */}
        {isAuthenticated && (
          <div className="lg:hidden border-t border-gray-100 pt-3 pb-2">
            <nav className="flex items-center justify-around">
              {[
                { to: '/dashboard', icon: <FaHome />, label: 'Home' },
                { to: '/groups', icon: <FaUsers />, label: 'Groups' },
                { to: '/profile', icon: <FaUserCircle />, label: 'Profile' },
                { to: '/notifications', icon: <FaBell />, label: 'Alerts' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;