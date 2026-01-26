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

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) fetchUnreadCounts();

    const handleScroll = () => setIsScrolled(window.scrollY > 10);
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
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg'
          : 'bg-white/90 backdrop-blur-lg border-b border-white/30'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* LEFT – LOGO */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="Travel Friend"
              className="w-12 h-12 lg:w-14 lg:h-14 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform"
            />
            <div className="hidden sm:block">
              <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Travel-Friend
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Connect • Explore • Share
              </div>
            </div>
          </Link>

          {/* CENTER – ICON NAV (Desktop) */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-2">
              {[
                { to: '/dashboard', icon: <FaHome />, title: 'Dashboard' },
                { to: '/groups', icon: <FaUserFriends />, title: 'Groups' },
                { to: '/chat', icon: <FaGlobeAmericas />, title: 'Public Chat' },
                { to: '/private-chat', icon: <FaCommentDots />, title: 'Private Chat' },
                { to: '/invites', icon: <FaEnvelope />, title: 'Invites' },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.title}
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                </Link>
              ))}
            </nav>
          )}

          {/* RIGHT – ACTIONS */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Private Chat (Mobile) */}
                <Link to="/private-chat" className="relative p-2.5 lg:hidden rounded-xl text-gray-600 hover:text-purple-600 hover:bg-purple-50">
                  <FaCommentDots size={20} />
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <Link to="/notifications" className="relative p-2.5 rounded-xl text-gray-600 hover:text-amber-600 hover:bg-amber-50">
                  <FaBell size={20} />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </Link>

                {/* Profile */}
                <div className="relative group">
                  <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <FaUserCircle className="text-indigo-600 text-2xl" />
                      )}
                    </div>
                    <div className="hidden lg:block">
                      <div className="text-sm font-semibold">{user?.name?.split(' ')[0]}</div>
                      <div className="text-xs text-gray-500">Traveler</div>
                    </div>
                  </Link>

                  {/* Logout */}
                  <div className="absolute right-0 mt-2 w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white border rounded-xl shadow text-red-600 hover:bg-red-50"
                    >
                      <FaSignOutAlt />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="px-5 py-2.5 rounded-xl hover:bg-gray-50">
                  Sign In
                </Link>
                <Link to="/register" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* MOBILE NAV */}
        {isAuthenticated && (
          <div className="lg:hidden border-t pt-3 pb-2">
            <nav className="flex justify-around">
              {[
                { to: '/dashboard', icon: <FaHome />, label: 'Home' },
                { to: '/groups', icon: <FaUserFriends />, label: 'Groups' },
                { to: '/chat', icon: <FaGlobeAmericas />, label: 'Chat' },
                { to: '/invites', icon: <FaEnvelope />, label: 'Invites' },
                { to: '/profile', icon: <FaUserCircle />, label: 'Profile' },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center text-gray-600 hover:text-indigo-600"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
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
