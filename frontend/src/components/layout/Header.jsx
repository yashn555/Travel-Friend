import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutAsync } from '../../redux/slices/authSlice';
import { getMyChats } from '../../services/chatService';
import { getCurrentUser } from '../../services/authService';
import {
  FaBell,
  FaEnvelope,
  FaUserCircle,
  FaSignOutAlt,
} from 'react-icons/fa';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) fetchUnreadCounts();
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
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-3 items-center">

        {/* LEFT – LOGO */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg">
            ✈️
          </div>
          <span className="hidden sm:block text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Traveler Friend
          </span>
        </Link>

        {/* CENTER – NAV */}
        {isAuthenticated && (
          <nav className="hidden md:flex justify-center gap-8 text-sm font-medium text-gray-600">
            <Link to="/dashboard" className="hover:text-indigo-600 transition">
              Dashboard
            </Link>
            <Link to="/groups" className="hover:text-indigo-600 transition">
              Groups
            </Link>
            <Link to="/chat" className="hover:text-indigo-600 transition">
              Chat
            </Link>
          </nav>
        )}

        {/* RIGHT – ACTIONS */}
        <div className="flex justify-end items-center gap-6">
          {isAuthenticated ? (
            <>
              {/* Chat */}
              <Link to="/chat" className="relative text-gray-600 hover:text-indigo-600">
                <FaEnvelope size={18} />
                {unreadMessageCount > 0 && <span className="badge">{unreadMessageCount > 9 ? '9+' : unreadMessageCount}</span>}
              </Link>

              {/* Notifications */}
              <Link to="/notifications" className="relative text-gray-600 hover:text-indigo-600">
                <FaBell size={18} />
                {unreadNotificationCount > 0 && <span className="badge">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>}
              </Link>

              {/* Profile */}
              <Link to="/profile" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <FaUserCircle className="text-indigo-600 text-xl" />
                  )}
                </div>
                <span className="hidden lg:block text-sm font-semibold text-gray-700 group-hover:text-indigo-600">
                  {user?.name}
                </span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 transition"
                title="Logout"
              >
                <FaSignOutAlt size={16} />
              </button>
            </>
          ) : (
            <div className="flex gap-4">
              <Link to="/login" className="text-gray-600 hover:text-indigo-600">Sign In</Link>
              <Link to="/register" className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
