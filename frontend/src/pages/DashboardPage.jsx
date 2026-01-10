import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { login } from '../redux/slices/authSlice';
import { FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaStar } from 'react-icons/fa';

const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const result = await getCurrentUser();
        if (result.success) {
          dispatch(login({
            user: result.user,
            token: localStorage.getItem('token')
          }));
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    
    fetchUserData();
  }, [dispatch]);
  
  const travelStats = [
    {
      icon: <FaMapMarkerAlt className="text-2xl" />,
      label: 'Destinations',
      value: '12',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: <FaCalendarAlt className="text-2xl" />,
      label: 'Upcoming Trips',
      value: '3',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: <FaUsers className="text-2xl" />,
      label: 'Travel Buddies',
      value: '8',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: <FaStar className="text-2xl" />,
      label: 'Reviews',
      value: '24',
      color: 'bg-yellow-100 text-yellow-600',
    },
  ];
  
  const upcomingTrips = [
    {
      id: 1,
      destination: 'Bali, Indonesia',
      date: 'Dec 15-25, 2023',
      status: 'Confirmed',
      color: 'bg-green-100 text-green-800',
    },
    {
      id: 2,
      destination: 'Kyoto, Japan',
      date: 'Jan 10-20, 2024',
      status: 'Planned',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      id: 3,
      destination: 'Swiss Alps',
      date: 'Feb 5-15, 2024',
      status: 'Planning',
      color: 'bg-yellow-100 text-yellow-800',
    },
  ];
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-primary-100">
              Ready for your next adventure? Let's explore the world together.
            </p>
          </div>
          <button
            onClick={() => navigate('/trips/new')}
            className="mt-4 md:mt-0 bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Plan New Trip
          </button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {travelStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {stat.value}
            </h3>
            <p className="text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Trips */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Upcoming Trips
              </h2>
              <button
                onClick={() => navigate('/trips')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              {upcomingTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FaMapMarkerAlt className="text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {trip.destination}
                      </h3>
                      <p className="text-sm text-gray-600">{trip.date}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${trip.color}`}>
                    {trip.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Profile Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-500">Full Name</label>
                <p className="font-medium text-gray-800">{user?.name}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium text-gray-800">{user?.email}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Mobile</label>
                <p className="font-medium text-gray-800">{user?.mobile}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Account Status</label>
                <div className="flex items-center">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Verified
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/profile')}
                className="w-full btn-secondary mt-4"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;