import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getUserProfile, 
  followUser, 
  unfollowUser, 
  createOrGetPrivateChat,
  getUserStats,
  getCurrentUser,
  checkFollowStatus
} from '../services/api';
import { 
  AiOutlineMessage, 
  AiOutlineStar, 
  AiOutlineCheck,
  AiOutlineUserAdd,
  AiOutlineReload,
  AiOutlineUserDelete
} from 'react-icons/ai';
import { 
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaEnvelope,
  FaBirthdayCake,
  FaVenusMars,
  FaLanguage,
  FaStar,
  FaRegStar
} from 'react-icons/fa';
import { MdTravelExplore } from 'react-icons/md';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// Import from privateChatService - removed duplicate import of checkMutualFollow
import { startPrivateChat } from '../services/privateChatService.js';
import { checkMutualFollow } from '../services/privateChatService.js';

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [checkingFollow, setCheckingFollow] = useState(false);

  // Function to check follow status from API
  const checkFollowStatusFromAPI = useCallback(async () => {
    try {
      setCheckingFollow(true);
      const response = await checkFollowStatus(userId);
      console.log('✅ Follow status from API:', response.isFollowing);
      setIsFollowing(response.isFollowing);
      return response.isFollowing;
    } catch (error) {
      console.error('Error checking follow status:', error);
      // Fallback to checking from current user data
      try {
        const currentUserResponse = await getCurrentUser();
        const currentUser = currentUserResponse.data;
        
        if (currentUser.following && Array.isArray(currentUser.following)) {
          const isFollowingThisUser = currentUser.following.some(follow => {
            const followId = follow.user?._id || follow.user || follow;
            return followId && followId.toString() === userId;
          });
          setIsFollowing(isFollowingThisUser);
          return isFollowingThisUser;
        }
        return false;
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        return false;
      }
    } finally {
      setCheckingFollow(false);
    }
  }, [userId]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes] = await Promise.all([
        getUserProfile(userId),
        getUserStats(userId)
      ]);
      
      setUser(profileRes.profile);
      setUserStats(statsRes.data);
      
      // Check follow status from API
      await checkFollowStatusFromAPI();
      
    } catch (err) {
      console.error('Error fetching user profile:', err);
      toast.error('Failed to load user profile');
      navigate('/dashboard');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userId, navigate]);

  const handleRefreshProfile = async () => {
    setIsRefreshing(true);
    await fetchUserProfile();
    toast.success('Profile refreshed');
  };

  const handleFollowAction = async () => {
    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        // Unfollow logic
        console.log(`👥 Unfollowing user: ${userId}`);
        await unfollowUser(userId);
        setIsFollowing(false);
        
        // Update local state
        setUser(prev => ({
          ...prev,
          followersCount: Math.max(0, (prev.followersCount || 0) - 1)
        }));
        
        toast.success('Unfollowed successfully');
      } else {
        // Follow logic
        console.log(`👥 Following user: ${userId}`);
        try {
          const response = await followUser(userId);
          
          if (response.success) {
            setIsFollowing(true);
            
            // Update local state
            setUser(prev => ({
              ...prev,
              followersCount: (prev.followersCount || 0) + 1
            }));
            
            toast.success('Followed successfully');
          }
        } catch (error) {
          // Handle "Already following" error gracefully
          if (error.response?.data?.message?.includes('Already following')) {
            // Sync state
            setIsFollowing(true);
            await checkFollowStatusFromAPI(); // Double-check with API
            toast.info('You are already following this user');
          } else {
            throw error;
          }
        }
      }
    } catch (err) {
      console.error('Follow action error:', err);
      
      // Handle errors
      if (err.response?.status === 400) {
        if (err.response?.data?.message?.includes('Already following')) {
          setIsFollowing(true);
          toast.info('You are already following this user');
        } else if (err.response?.data?.message?.includes('Cannot follow yourself')) {
          toast.error('You cannot follow yourself');
        } else {
          toast.error(err.response?.data?.message || 'Failed to follow user');
        }
      } else if (err.response?.status === 500) {
        toast.error('Server error. Please try again.');
      } else {
        toast.error('Failed to perform action');
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      setIsLoadingChat(true);
      
      // First check mutual follow status
      try {
        const mutualCheck = await checkMutualFollow(userId);
        
        if (!mutualCheck.isMutualFollow) {
          let message = 'You can only chat with users who follow you back. ';
          
          if (!mutualCheck.currentUserFollows && !mutualCheck.otherUserFollows) {
            message += 'You need to follow each other.';
          } else if (!mutualCheck.currentUserFollows) {
            message += 'You need to follow this user first.';
          } else if (!mutualCheck.otherUserFollows) {
            message += 'This user needs to follow you back.';
          }
          
          toast.warning(message);
          
          // Offer to follow if not following
          if (!mutualCheck.currentUserFollows) {
            const confirmFollow = window.confirm(
              'You need to follow this user to chat. Would you like to follow them now?'
            );
            
            if (confirmFollow) {
              await handleFollowAction();
              toast.info('Now wait for them to follow you back to start chatting');
            }
          }
          return;
        }
        
        // If mutual follow exists, start private chat
        const response = await startPrivateChat(userId);
        
        if (response.success) {
          // Navigate to private chat page
          navigate(`/private-chat/${response.chatId}`, {
            state: {
              otherUser: user,
              isNewChat: response.isNew
            }
          });
          
          if (response.isNew) {
            toast.success('Private chat started!');
          } else {
            toast.info('Opening existing chat...');
          }
        }
      } catch (error) {
        console.error('Chat creation error:', error);
        toast.error(error.response?.data?.message || 'Failed to start chat');
      }
      
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setIsLoadingChat(false);
    }
  };

  const renderRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 4.5);
    const hasHalfStar = (rating || 4.5) % 1 >= 0.5;
    
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

  const renderFollowStatus = () => {
    if (!user) return null;
    
    return (
      <div className="mt-2 text-sm text-gray-600">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center">
            <span className="font-medium">Followers:</span>
            <span className="ml-2 bg-gray-100 px-2 py-1 rounded">{user.followersCount || 0}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">Following:</span>
            <span className="ml-2 bg-gray-100 px-2 py-1 rounded">{user.followingCount || 0}</span>
          </div>
        </div>
        
        {isFollowing && (
          <div className="mt-2 flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-lg">
            <AiOutlineCheck className="mr-2" />
            <span>You are following this user</span>
          </div>
        )}
      </div>
    );
  };

  // Function to render follow button with proper state
  const renderFollowButton = () => {
    if (checkingFollow || followLoading) {
      return (
        <button
          disabled
          className="px-6 py-2 bg-gray-100 text-gray-400 rounded-lg font-medium flex items-center min-w-[120px] justify-center"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
          Checking...
        </button>
      );
    }

    return (
      <button
        onClick={handleFollowAction}
        disabled={followLoading || isRefreshing}
        className={`px-6 py-2 rounded-lg font-medium flex items-center transition-all min-w-[120px] justify-center ${
          isFollowing
            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {followLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
        ) : isFollowing ? (
          <>
            <AiOutlineUserDelete className="mr-2" />
            Unfollow
          </>
        ) : (
          <>
            <AiOutlineUserAdd className="mr-2" />
            Follow
          </>
        )}
      </button>
    );
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
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          Back to Dashboard
        </button>
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
          
          {/* Refresh button */}
          <div className="absolute top-4 right-4">
            <button
              onClick={handleRefreshProfile}
              disabled={isRefreshing}
              className="px-3 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg flex items-center text-sm disabled:opacity-50 transition-all"
            >
              <AiOutlineReload className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="pt-20 pb-6 px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-start">
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
                      {renderRating(user.rating)}
                      <span className="ml-2 font-medium">{(user.rating || 4.5).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {renderFollowStatus()}
            </div>

            <div className="flex gap-3 flex-wrap mt-4 md:mt-0">
              {/* Follow Button */}
              {renderFollowButton()}

              {/* Message Button */}
              <button
                onClick={handleStartChat}
                disabled={isLoadingChat || checkingFollow}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
              >
                <AiOutlineMessage className="mr-2" />
                {isLoadingChat ? 'Checking...' : 'Message'}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
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
                {Object.entries(user.travelPreferences || {}).map(([key, value]) => 
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
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                  <a href={`https://instagram.com/${user.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-pink-600 hover:text-pink-700 hover:underline">
                    <span className="mr-2">📷</span> Instagram
                  </a>
                )}
                {user.socialLinks.twitter && (
                  <a href={`https://twitter.com/${user.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-400 hover:text-blue-500 hover:underline">
                    <span className="mr-2">🐦</span> Twitter
                  </a>
                )}
                {user.socialLinks.facebook && (
                  <a href={`https://facebook.com/${user.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-700 hover:underline">
                    <span className="mr-2">📘</span> Facebook
                  </a>
                )}
                {user.socialLinks.linkedin && (
                  <a href={`https://linkedin.com/in/${user.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-700 hover:text-blue-800 hover:underline">
                    <span className="mr-2">💼</span> LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;