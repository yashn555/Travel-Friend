import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutAsync } from '../../redux/slices/authSlice';
import { FaUser, FaSignOutAlt, FaHome, FaBell, FaEnvelope, FaUserCircle } from 'react-icons/fa';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutAsync());
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <FaHome className="text-white text-xl" />
            </div>
            <span className="text-2xl font-bold text-gray-800">Traveler Friend</span>
          </Link>

          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center space-x-6">
                  <Link to="/dashboard" className="text-gray-600 hover:text-primary-600 font-medium">Dashboard</Link>
                  <Link to="/groups" className="text-gray-600 hover:text-primary-600 font-medium">Groups</Link>
                  <Link to="/agencies" className="text-gray-600 hover:text-primary-600 font-medium">Agencies</Link>
                  <Link to="/chat" className="text-gray-600 hover:text-primary-600 relative">
                    <FaEnvelope />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
                  </Link>
                  <Link to="/notifications" className="text-gray-600 hover:text-primary-600 relative">
                    <FaBell />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">5</span>
                  </Link>
                </div>

                <div className="flex items-center space-x-4">
                  <Link to="/profile" className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <FaUserCircle className="text-primary-600 text-lg" />
                      )}
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrator' : 'Traveler'}</p>
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50" title="Logout">
                    <FaSignOutAlt />
                    <span className="hidden sm:inline text-sm font-medium">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-primary-600 font-medium">Sign In</Link>
                <Link to="/register" className="btn-primary">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
