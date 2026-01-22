import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getUserProfile, 
  followUser, 
  unfollowUser, 
  sendFriendRequest,
  getUserStats
} from '../services/api';
import { 
  AiOutlineMessage, 
  AiOutlineStar, 
  AiOutlineHistory,
  AiOutlineEnvironment,
  AiOutlineCheck,
  AiOutlineUserAdd
} from 'react-icons/ai';
import { 
  FaMapMarkerAlt, 
  FaUserFriends, 
  FaGlobeAmericas,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaBirthdayCake,
  FaVenusMars,
  FaLanguage,
  FaStar,
  FaRegStar
} from 'react-icons/fa';
import { MdTravelExplore, MdFlight, MdTrain, MdDirectionsCar } from 'react-icons/md';
import { toast } from 'react-toastify';


const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);


const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const [profileRes, statsRes] = await Promise.all([
          getUserProfile(userId),
          getUserStats(userId)
        ]);
        
        setUser(profileRes.profile);
        setUserStats(statsRes.data);
        setIsFollowing(profileRes.profile?.isFollowing || false);
        setIsFriend(profileRes.profile?.isFriend || false);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        toast.error('Failed to load user profile');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, navigate]);

  const handleFollowAction = async () => {
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        toast.success('Unfollowed successfully');
      } else {
        await followUser(userId);
        setIsFollowing(true);
        toast.success('Followed successfully');
      }
    } catch (err) {
      console.error('Follow action error:', err);
      toast.error('Failed to perform action');
    }
  };

  const handleFriendRequest = async () => {
    try {
      setSendingRequest(true);
      await sendFriendRequest(userId);
      toast.success('Friend request sent successfully');
    } catch (err) {
      console.error('Friend request error:', err);
      toast.error(err.response?.data?.message || 'Failed to send friend request');
    } finally {
      setSendingRequest(false);
    }
  };

  const renderRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-500" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaRegStar key={i} className="text-yellow-500" style={{ clipPath: 'inset(0 50% 0 0)' }} />);
      } else {
        stars.push(<FaRegStar key={i} className="text-gray-300" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">User Not Found</h2>
        <p className="text-gray-600">The user profile you're looking for doesn't exist</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="absolute bottom-0 left-6 transform translate-y-1/2">
            <img
              src={
                user.profileImage && user.profileImage !== 'default-profile.jpg'
                  ? `http://localhost:5000/uploads/profiles/${user.profileImage}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=150`
              }
              alt={user.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
          </div>
        </div>

        <div className="pt-20 pb-6 px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{user.name}</h1>
              <div className="flex items-center flex-wrap gap-4 mt-2">
                {user.email && (
                  <div className="flex items-center text-gray-600">
                    <FaEnvelope className="mr-2" />
                    {user.email}
                  </div>
                )}
                {user.city && (
                  <div className="flex items-center text-gray-600">
                    <FaMapMarkerAlt className="mr-2" />
                    {user.city}, {user.state}
                  </div>
                )}
                <div className="flex items-center">
                  {renderRating(user.rating || 4.5)}
                  <span className="ml-2 font-medium">{user.rating?.toFixed(1) || '4.5'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleFollowAction}
                className={`px-6 py-2 rounded-lg font-medium flex items-center ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isFollowing ? (
                  <>
                    <AiOutlineCheck className="mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <AiOutlineUserAdd className="mr-2" />
                    Follow
                  </>
                )}
              </button>

              {!isFriend && (
                <button
                  onClick={handleFriendRequest}
                  disabled={sendingRequest}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center disabled:opacity-50"
                >
                  {sendingRequest ? 'Sending...' : (
                    <>
                      <FaUserFriends className="mr-2" />
                      Add Friend
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => navigate(`/chat/user/${userId}`)}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium flex items-center"
              >
                <AiOutlineMessage className="mr-2" />
                Message
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - About */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">About</h3>
            <p className="text-gray-600 whitespace-pre-line">
              {user.bio || 'No bio provided.'}
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              {user.dateOfBirth && (
                <div className="flex items-center">
                  <FaBirthdayCake className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Date of Birth</div>
                    <div className="font-medium">{formatDate(user.dateOfBirth)}</div>
                  </div>
                </div>
              )}

              {user.gender && user.gender !== 'prefer-not-to-say' && (
                <div className="flex items-center">
                  <FaVenusMars className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Gender</div>
                    <div className="font-medium capitalize">{user.gender}</div>
                  </div>
                </div>
              )}

              {user.languages && user.languages.length > 0 && (
                <div className="flex items-center">
                  <FaLanguage className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Languages</div>
                    <div className="font-medium">{user.languages.join(', ')}</div>
                  </div>
                </div>
              )}

              {user.travelExperience && (
                <div className="flex items-center">
                  <MdTravelExplore className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Travel Experience</div>
                    <div className="font-medium capitalize">{user.travelExperience}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Travel Preferences */}
          {user.travelPreferences && (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Travel Preferences</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(user.travelPreferences).map(([key, value]) => 
                  value && (
                    <span
                      key={key}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* Recent Trips */}
          {user.pastTrips && user.pastTrips.length > 0 && (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Trips</h3>
              <div className="space-y-4">
                {user.pastTrips.slice(0, 3).map((trip, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-gray-800">{trip.destination}</h4>
                      {trip.rating && (
                        <div className="flex items-center">
                          {renderRating(trip.rating)}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {trip.startDate && trip.endDate && (
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2" />
                          {format(new Date(trip.startDate), 'dd MMM yyyy')} - {format(new Date(trip.endDate), 'dd MMM yyyy')}
                        </div>
                      )}
                      {trip.notes && <p className="mt-2">{trip.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Stats & Info */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Travel Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Trips Completed</span>
                <span className="font-bold text-blue-600">{userStats?.tripsCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Countries Visited</span>
                <span className="font-bold text-green-600">{userStats?.countriesVisited || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Friends</span>
                <span className="font-bold text-purple-600">{user.friendsCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Followers</span>
                <span className="font-bold text-pink-600">{user.followersCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Following</span>
                <span className="font-bold text-indigo-600">{user.followingCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Social Links */}
          {user.socialLinks && Object.values(user.socialLinks).some(link => link) && (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Social Links</h3>
              <div className="space-y-3">
                {user.socialLinks.instagram && (
                  <a href={`https://instagram.com/${user.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-pink-600 hover:text-pink-700">
                    <span className="mr-2">📷</span> Instagram
                  </a>
                )}
                {user.socialLinks.twitter && (
                  <a href={`https://twitter.com/${user.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-400 hover:text-blue-500">
                    <span className="mr-2">🐦</span> Twitter
                  </a>
                )}
                {user.socialLinks.facebook && (
                  <a href={`https://facebook.com/${user.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-700">
                    <span className="mr-2">📘</span> Facebook
                  </a>
                )}
                {user.socialLinks.linkedin && (
                  <a href={`https://linkedin.com/in/${user.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-700 hover:text-blue-800">
                    <span className="mr-2">💼</span> LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Mutual Friends */}
          {user.mutualFriendsCount > 0 && (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Mutual Friends ({user.mutualFriendsCount})
              </h3>
              <div className="text-sm text-gray-600">
                You have {user.mutualFriendsCount} mutual friend{user.mutualFriendsCount !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;