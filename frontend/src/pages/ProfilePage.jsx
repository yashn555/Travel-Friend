import React, { useEffect, useState } from 'react';
import {
  getProfile,
  updateProfile,
  uploadProfileImage,
  searchUsers,
  followUser,
  unfollowUser,
  changePassword,
  getUserStats,
  getFriendsList,
  getFollowersList,
  getFollowingList,
} from '../services/api';
import { 
  AiOutlineCamera, 
  AiOutlineSearch, 
  AiOutlineEnvironment, 
  AiOutlineGlobal,
  AiOutlineSetting,
  AiOutlineLock,
  AiOutlineHistory,
  AiOutlineStar,
  AiOutlineMessage,
  AiOutlineUserAdd,
  AiOutlineCheck,
  AiOutlineEdit,
  AiOutlineSync
} from 'react-icons/ai';
import { 
  FaMapMarkerAlt, 
  FaUserFriends, 
  FaUserPlus, 
  FaCompass, 
  FaCheck, 
  FaRegStar,
  FaStar,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaKey,
  FaTrash,
  FaBirthdayCake,
  FaVenusMars,
  FaLanguage
} from 'react-icons/fa';
import { 
  MdTravelExplore,
  MdDirectionsCar,
  MdFlight,
  MdTrain,
  MdDirectionsBus,
  MdDirectionsBike
} from 'react-icons/md';
import { toast } from 'react-toastify';
import useGeoLocation from '../hooks/useGeoLocation';
import { format } from 'date-fns';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [userStats, setUserStats] = useState({});
  const [friends, setFriends] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use geolocation hook
  const { location: userLocation, error: locationError, getLocation } = useGeoLocation();

  // Enhanced formData with all details
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    upiId: '',
    bio: '',
    town: '',
    city: '',
    state: '',
    country: 'India',
    dateOfBirth: '',
    gender: 'prefer-not-to-say',
    languages: [],
    travelPreferences: {
      adventure: false,
      luxury: false,
      budget: false,
      solo: false,
      group: false,
      beach: false,
      mountain: false,
      cultural: false,
      backpacking: false,
      roadtrip: false,
      family: false,
      soloFemale: false
    },
    travelExperience: 'beginner',
    travelBudget: 'medium',
    preferredTransport: [],
    socialLinks: {
      instagram: '',
      twitter: '',
      facebook: '',
      linkedin: ''
    }
  });

  // Enhanced travel preferences list
  const travelPreferenceList = [
    { id: 'adventure', label: 'Adventure', icon: '🧗‍♂️' },
    { id: 'luxury', label: 'Luxury', icon: '⭐' },
    { id: 'budget', label: 'Budget', icon: '💰' },
    { id: 'solo', label: 'Solo', icon: '🚶‍♂️' },
    { id: 'group', label: 'Group', icon: '👥' },
    { id: 'beach', label: 'Beach', icon: '🏖️' },
    { id: 'mountain', label: 'Mountain', icon: '⛰️' },
    { id: 'cultural', label: 'Cultural', icon: '🏛️' },
    { id: 'backpacking', label: 'Backpacking', icon: '🎒' },
    { id: 'roadtrip', label: 'Roadtrip', icon: '🚗' },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { id: 'soloFemale', label: 'Solo Female', icon: '🚺' }
  ];

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner (1-2 trips)' },
    { value: 'intermediate', label: 'Intermediate (3-5 trips)' },
    { value: 'expert', label: 'Expert (6+ trips)' }
  ];

  const budgetLevels = [
    { value: 'budget', label: 'Budget (< ₹5k/day)' },
    { value: 'medium', label: 'Medium (₹5k-₹10k/day)' },
    { value: 'high', label: 'High (₹10k-₹20k/day)' },
    { value: 'luxury', label: 'Luxury (> ₹20k/day)' }
  ];

  const transportOptions = [
    { value: 'flight', label: 'Flight', icon: <MdFlight /> },
    { value: 'train', label: 'Train', icon: <MdTrain /> },
    { value: 'bus', label: 'Bus', icon: <MdDirectionsBus /> },
    { value: 'car', label: 'Car', icon: <MdDirectionsCar /> },
    { value: 'bike', label: 'Bike', icon: <MdDirectionsBike /> }
  ];

  const languageOptions = [
    'English', 'Hindi', 'Spanish', 'French', 'German', 
    'Japanese', 'Chinese', 'Arabic', 'Portuguese', 'Russian'
  ];

  // Fetch profile and related data
  const fetchProfileData = async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Fetching profile data...');
      
      // Fetch all data in parallel
      const [profileRes, statsRes, friendsRes, followersRes, followingRes] = await Promise.all([
        getProfile(),
        getUserStats(),
        getFriendsList(),
        getFollowersList(),
        getFollowingList()
      ]);

      console.log('📊 Profile API Response:', profileRes);
      console.log('📈 Stats API Response:', statsRes);
      console.log('👥 Friends API Response:', friendsRes);
      console.log('👤 Followers API Response:', followersRes);
      console.log('👣 Following API Response:', followingRes);

      // Extract profile data
      let profileData = null;
      if (profileRes && profileRes.success) {
        if (profileRes.profile) {
          profileData = profileRes.profile;
        } else if (profileRes.data) {
          profileData = profileRes.data;
        } else {
          profileData = profileRes;
        }
      }
      
      console.log('🎯 Extracted Profile Data:', profileData);
      
      if (profileData) {
        setProfile(profileData);
        
        // Format dateOfBirth for input field (YYYY-MM-DD)
        let formattedDateOfBirth = '';
        if (profileData.dateOfBirth) {
          try {
            formattedDateOfBirth = format(new Date(profileData.dateOfBirth), 'yyyy-MM-dd');
          } catch (e) {
            console.error('Error formatting date:', e);
          }
        }
        
        // Initialize formData with actual profile data
        const initialFormData = {
          name: profileData.name || '',
          email: profileData.email || '',
          mobile: profileData.mobile || '',
          upiId: profileData.upiId || '',
          bio: profileData.bio || '',
          town: profileData.town || '',
          city: profileData.city || '',
          state: profileData.state || '',
          country: profileData.country || 'India',
          dateOfBirth: formattedDateOfBirth,
          gender: profileData.gender || 'prefer-not-to-say',
          languages: Array.isArray(profileData.languages) ? profileData.languages : [],
          travelPreferences: profileData.travelPreferences || {
            adventure: false,
            luxury: false,
            budget: false,
            solo: false,
            group: false,
            beach: false,
            mountain: false,
            cultural: false,
            backpacking: false,
            roadtrip: false,
            family: false,
            soloFemale: false
          },
          travelExperience: profileData.travelExperience || 'beginner',
          travelBudget: profileData.travelBudget || 'medium',
          preferredTransport: Array.isArray(profileData.preferredTransport) ? profileData.preferredTransport : [],
          socialLinks: profileData.socialLinks || {
            instagram: '',
            twitter: '',
            facebook: '',
            linkedin: ''
          }
        };
        
        console.log('📝 Initial Form Data:', initialFormData);
        setFormData(initialFormData);
      } else {
        console.error('❌ No profile data found');
        toast.error('Failed to load profile data');
      }

      // Extract stats data
      if (statsRes && statsRes.success) {
        setUserStats(statsRes.data || statsRes);
      } else if (statsRes) {
        setUserStats(statsRes);
      }

      // Extract friends data
      if (friendsRes && friendsRes.success) {
        setFriends(friendsRes.data || friendsRes);
      } else if (Array.isArray(friendsRes)) {
        setFriends(friendsRes);
      }

      // Extract followers data
      if (followersRes && followersRes.success) {
        setFollowers(followersRes.data || followersRes);
      } else if (Array.isArray(followersRes)) {
        setFollowers(followersRes);
      }

      // Extract following data
      if (followingRes && followingRes.success) {
        setFollowing(followingRes.data || followingRes);
      } else if (Array.isArray(followingRes)) {
        setFollowing(followingRes);
      }
      
    } catch (err) {
      console.error('❌ Profile fetch error:', err);
      toast.error('Error loading profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    getLocation();
  }, []);

  // Handle form input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name.startsWith('transport_')) {
        const transportValue = name.replace('transport_', '');
        setFormData(prev => ({
          ...prev,
          preferredTransport: checked 
            ? [...prev.preferredTransport, transportValue]
            : prev.preferredTransport.filter(t => t !== transportValue)
        }));
      } else if (name.startsWith('language_')) {
        const languageValue = name.replace('language_', '');
        setFormData(prev => ({
          ...prev,
          languages: checked 
            ? [...prev.languages, languageValue]
            : prev.languages.filter(l => l !== languageValue)
        }));
      } else {
        // Handle travel preferences checkboxes
        setFormData(prev => ({
          ...prev,
          travelPreferences: {
            ...prev.travelPreferences,
            [name]: checked
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle social links change
  const handleSocialLinkChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  // Handle profile update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      console.log('📤 Updating profile with:', formData);
      
      const updateData = {
        ...formData,
        email: profile?.email, // Keep original email
      };
      
      // Ensure arrays are properly formatted
      if (!Array.isArray(updateData.languages)) {
        updateData.languages = [];
      }
      
      if (!Array.isArray(updateData.preferredTransport)) {
        updateData.preferredTransport = [];
      }
      
      const res = await updateProfile(updateData);
      console.log('✅ Update response:', res);
      
      if (res.success) {
        // Update local profile state
        const updatedProfile = res.profile || { ...profile, ...updateData };
        setProfile(updatedProfile);
        toast.success('Profile updated successfully!');
        
        // Refresh all data
        await fetchProfileData();
      } else {
        toast.error(res.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('❌ Profile update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    setChangingPassword(true);
    try {
      const res = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (res.success) {
        toast.success('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(res.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Password change error:', err);
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle search for users
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    setSearching(true);
    try {
      const res = await searchUsers(searchQuery);
      console.log('Search response:', res);
      
      if (res.success) {
        const results = res.data || res.users || res;
        setSearchResults(Array.isArray(results) ? results : [results]);
        if (results.length === 0) {
          toast.info('No users found matching your search');
        }
      } else {
        toast.error(res.message || 'Failed to search users');
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Handle follow/unfollow
  const handleFollowAction = async (userId, isCurrentlyFollowing) => {
    try {
      console.log(`Following action for ${userId}, currently following: ${isCurrentlyFollowing}`);
      
      let res;
      if (isCurrentlyFollowing) {
        res = await unfollowUser(userId);
      } else {
        res = await followUser(userId);
      }
      
      console.log('Follow action response:', res);
      
      if (res.success) {
        const action = isCurrentlyFollowing ? 'Unfollowed' : 'Followed';
        toast.success(`${action} successfully!`);
        
        // Update search results
        setSearchResults(prev => 
          prev.map(user => {
            if (user._id === userId) {
              return {
                ...user,
                isFollowing: !isCurrentlyFollowing,
                followersCount: isCurrentlyFollowing 
                  ? Math.max(0, (user.followersCount || 0) - 1)
                  : (user.followersCount || 0) + 1
              };
            }
            return user;
          })
        );
        
        // Refresh profile data
        await fetchProfileData();
        
      } else {
        toast.error(res.message || 'Failed to perform action');
      }
    } catch (err) {
      console.error('Follow action error:', err);
      toast.error('Failed to perform action');
    }
  };

  // Handle follow back action
  const handleFollowBack = async (followerId) => {
    try {
      const res = await followUser(followerId);
      if (res.success) {
        toast.success('Followed back successfully!');
        await fetchProfileData();
      } else {
        toast.error(res.message || 'Failed to follow back');
      }
    } catch (err) {
      console.error('Follow back error:', err);
      toast.error('Failed to follow back');
    }
  };

  // Handle unfollow from following list
  const handleUnfollow = async (followingId) => {
    try {
      const res = await unfollowUser(followingId);
      if (res.success) {
        toast.success('Unfollowed successfully!');
        await fetchProfileData();
      } else {
        toast.error(res.message || 'Failed to unfollow');
      }
    } catch (err) {
      console.error('Unfollow error:', err);
      toast.error('Failed to unfollow');
    }
  };

  // Handle profile image upload - FIXED
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    setImageUploading(true);

    try {
      // Create FormData properly
      const formDataImage = new FormData();
      formDataImage.append('image', file); // Use 'image' as per your controller
      
      console.log('📤 Uploading image:', file.name, file.type, file.size);
      
      const res = await uploadProfileImage(formDataImage);
      console.log('✅ Image upload response:', res);
      
      if (res.success) {
        // Update local state
        const updatedProfile = { 
          ...profile, 
          profileImage: res.profileImage || res.imageUrl 
        };
        setProfile(updatedProfile);
        toast.success('Profile image uploaded successfully!');
        
        // Refresh profile data
        await fetchProfileData();
      } else {
        toast.error(res.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error('❌ Image upload error:', err);
      console.error('Error details:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to upload image. Please try a different image.');
    } finally {
      setImageUploading(false);
    }
  };

  // Render star rating
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

  // Format location display
  const formatLocation = () => {
    if (userLocation) {
      return `${userLocation.city || 'Your Location'} (${userLocation.latitude?.toFixed(4) || '0.0000'}, ${userLocation.longitude?.toFixed(4) || '0.0000'})`;
    }
    return 'Location not available';
  };

  // Get location text from profile
  const getProfileLocation = () => {
    if (!profile) return 'Location not set';
    
    const parts = [];
    if (profile.town) parts.push(profile.town);
    if (profile.city) parts.push(profile.city);
    if (profile.state) parts.push(profile.state);
    
    return parts.length > 0 ? parts.join(', ') : 'Location not set';
  };

  // Get date of birth display
  const getDateOfBirthDisplay = () => {
    if (!profile?.dateOfBirth) return 'Not set';
    try {
      return format(new Date(profile.dateOfBirth), 'dd MMM yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get gender display
  const getGenderDisplay = () => {
    if (!profile?.gender) return 'Not set';
    return profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1);
  };

  // Get languages display
  const getLanguagesDisplay = () => {
    if (!profile?.languages || !Array.isArray(profile.languages) || profile.languages.length === 0) {
      return 'Not set';
    }
    return profile.languages.join(', ');
  };

  // Get travel experience display
  const getTravelExperienceDisplay = () => {
    if (!profile?.travelExperience) return 'Not set';
    return profile.travelExperience.charAt(0).toUpperCase() + profile.travelExperience.slice(1);
  };

  // Force refresh profile data
  const handleRefreshProfile = async () => {
    try {
      setRefreshing(true);
      await fetchProfileData();
      toast.success('Profile refreshed!');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh profile');
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile Not Found</h2>
        <p className="text-gray-600">Unable to load profile information</p>
        <button
          onClick={fetchProfileData}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded">
          <p className="text-sm">
            <strong>Debug Info:</strong> Profile ID: {profile._id} | 
            Has dateOfBirth: {profile.dateOfBirth ? 'Yes' : 'No'} | 
            Has gender: {profile.gender ? 'Yes' : 'No'} | 
            Has languages: {profile.languages ? 'Yes' : 'No'}
          </p>
        </div>
      )}

      {/* Header with Live Location */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
            <button
              onClick={handleRefreshProfile}
              disabled={refreshing}
              className="ml-4 text-blue-500 hover:text-blue-600 disabled:text-gray-400"
              title="Refresh Profile"
            >
              {refreshing ? (
                <AiOutlineSync className="text-xl animate-spin" />
              ) : (
                <AiOutlineGlobal className="text-xl" />
              )}
            </button>
          </div>
          
          {/* Live Location Display */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaCompass className="text-blue-500 mr-3 text-xl" />
                <div>
                  <div className="font-semibold text-blue-700">Current Location</div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <AiOutlineEnvironment className="mr-1" />
                    {formatLocation()}
                  </div>
                </div>
              </div>
              <button
                onClick={getLocation}
                className="ml-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center"
              >
                <FaMapMarkerAlt className="mr-2" />
                Refresh
              </button>
            </div>
            {locationError && (
              <div className="mt-2 text-sm text-red-600">
                {locationError}
              </div>
            )}
          </div>
        </div>

        {/* Search Bar for Finding Friends */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <AiOutlineUserAdd className="mr-2" />
              Find Travel Buddies
            </h2>
            <button
              onClick={() => setSearchResults([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear results
            </button>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <AiOutlineSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for travelers by name, city, or interests..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 flex items-center"
            >
              {searching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Searching...
                </>
              ) : (
                <>
                  <AiOutlineSearch className="mr-2" />
                  Search
                </>
              )}
            </button>
          </form>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700">Search Results ({searchResults.length})</h3>
                <button
                  onClick={() => setSearchResults([])}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear results
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2">
                {searchResults.map((user, index) => (
                  <div key={user._id || user.id || index} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col items-center text-center">
                      <img
                        src={
                          user.profileImage && user.profileImage !== 'default-profile.jpg'
                            ? `http://localhost:5000/uploads/profiles/${user.profileImage}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&size=80`
                        }
                        alt={user.name || 'User'}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg mb-3"
                      />
                      <h4 className="font-bold text-gray-800">{user.name || 'Unknown User'}</h4>
                      
                      <div className="flex items-center justify-center mt-1 mb-2">
                        {renderRating(user.rating || 4.5)}
                        <span className="ml-2 text-sm text-gray-600">{user.rating?.toFixed(1) || '4.5'}</span>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-3">
                        <div className="flex items-center justify-center">
                          <FaMapMarkerAlt className="mr-1 text-xs" />
                          {user.city || user.town || user.location || 'Location not set'}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => handleFollowAction(user._id || user.id, user.isFollowing)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center ${
                            user.isFollowing
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {user.isFollowing ? (
                            <>
                              <AiOutlineCheck className="mr-1" />
                              Following
                            </>
                          ) : (
                            <>
                              <FaUserPlus className="mr-1" />
                              Follow
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => window.location.href = `/user/${user._id || user.id}`}
                          className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center"
                        >
                          <AiOutlineMessage className="mr-1" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Profile Content */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Profile Header */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="absolute bottom-0 left-6 transform translate-y-1/2">
            <div className="relative">
              <img
                src={
                  profile.profileImage && profile.profileImage !== 'default-profile.jpg'
                    ? `http://localhost:5000/uploads/profiles/${profile.profileImage}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&size=150`
                }
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <label className="absolute bottom-2 right-2 bg-blue-500 text-white p-3 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
                <input 
                  type="file" 
                  onChange={handleImageChange} 
                  className="hidden" 
                  accept="image/*"
                  disabled={imageUploading}
                />
                {imageUploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <AiOutlineCamera size={20} />
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 pb-8 px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{profile.name}</h2>
              <div className="flex items-center flex-wrap gap-4 mt-2">
                <div className="flex items-center text-gray-600">
                  <FaEnvelope className="mr-2" />
                  {profile.email}
                </div>
                <div className="flex items-center text-gray-600">
                  <FaPhone className="mr-2" />
                  {profile.mobile || 'Not set'}
                </div>
                <div className="flex items-center text-gray-600">
                  <FaMapMarkerAlt className="mr-2" />
                  {getProfileLocation()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{profile.followersCount || 0}</div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{profile.followingCount || 0}</div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{profile.rating?.toFixed(1) || '4.5'}</div>
                <div className="text-sm text-gray-500">Rating</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="flex flex-wrap -mb-px">
              {[
                { id: 'overview', label: 'Overview', icon: <AiOutlineUserAdd /> },
                { id: 'edit', label: 'Edit Profile', icon: <AiOutlineEdit /> },
                { id: 'trips', label: 'Trip History', icon: <AiOutlineHistory /> },
                { id: 'friends', label: 'Friends', icon: <FaUserFriends /> },
                { id: 'security', label: 'Security', icon: <AiOutlineLock /> },
                { id: 'settings', label: 'Settings', icon: <AiOutlineSetting /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`mr-8 py-4 px-1 font-medium text-sm border-b-2 transition-colors flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Personal Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* About Me */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <AiOutlineUserAdd className="mr-2" />
                      About Me
                    </h3>
                    <p className="text-gray-600 whitespace-pre-line">
                      {profile.bio || 'No bio provided.'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="flex items-center">
                        <FaBirthdayCake className="text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm text-gray-500">Date of Birth</div>
                          <div className="font-medium">{getDateOfBirthDisplay()}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <FaVenusMars className="text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm text-gray-500">Gender</div>
                          <div className="font-medium">{getGenderDisplay()}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <FaLanguage className="text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm text-gray-500">Languages</div>
                          <div className="font-medium">{getLanguagesDisplay()}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <MdTravelExplore className="text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm text-gray-500">Travel Experience</div>
                          <div className="font-medium">{getTravelExperienceDisplay()}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Travel Preferences */}
                  {profile.travelPreferences && Object.values(profile.travelPreferences).some(value => value === true) && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <MdTravelExplore className="mr-2" />
                        Travel Preferences
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {travelPreferenceList.map((pref) => (
                          profile.travelPreferences?.[pref.id] && (
                            <span
                              key={pref.id}
                              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center"
                            >
                              <span className="mr-2">{pref.icon}</span>
                              {pref.label}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Stats & Social */}
                <div className="space-y-6">
                  {/* Stats Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Travel Stats</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Trips Completed</span>
                        <span className="font-bold text-blue-600">{userStats?.tripsCount || userStats?.totalTrips || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Countries Visited</span>
                        <span className="font-bold text-green-600">{userStats?.countriesVisited || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Distance</span>
                        <span className="font-bold text-purple-600">{userStats?.totalDistance || 0} km</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Friends</span>
                        <span className="font-bold text-pink-600">{userStats?.friendsCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <AiOutlineStar className="mr-2" />
                      Traveler Rating
                    </h3>
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex items-center">
                        {renderRating(profile.rating || 4.5)}
                      </div>
                      <span className="ml-2 text-2xl font-bold">{profile.rating?.toFixed(1) || '4.5'}</span>
                    </div>
                    <div className="text-center text-sm text-gray-600">
                      Based on {profile.reviews?.length || 0} reviews from travel buddies
                    </div>
                  </div>

                  {/* Social Links */}
                  {profile.socialLinks && Object.values(profile.socialLinks).some(value => value) && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">Social Links</h3>
                      <div className="space-y-3">
                        {profile.socialLinks.instagram && (
                          <a href={`https://instagram.com/${profile.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-pink-600 hover:text-pink-700">
                            <span className="mr-2">📷</span> Instagram
                          </a>
                        )}
                        {profile.socialLinks.twitter && (
                          <a href={`https://twitter.com/${profile.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-400 hover:text-blue-500">
                            <span className="mr-2">🐦</span> Twitter
                          </a>
                        )}
                        {profile.socialLinks.facebook && (
                          <a href={`https://facebook.com/${profile.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-700">
                            <span className="mr-2">📘</span> Facebook
                          </a>
                        )}
                        {profile.socialLinks.linkedin && (
                          <a href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-700 hover:text-blue-800">
                            <span className="mr-2">💼</span> LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'edit' && (
              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-2">Mobile Number *</label>
                      <input
                        type="text"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="prefer-not-to-say">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Location Information</h3>
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">Town</label>
                      <input
                        type="text"
                        name="town"
                        value={formData.town}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-2">UPI ID</label>
                      <input
                        type="text"
                        name="upiId"
                        value={formData.upiId}
                        onChange={handleChange}
                        placeholder="username@upi"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us about yourself, your travel experiences, and what you're looking for in travel buddies..."
                  />
                </div>

                {/* Travel Preferences */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Travel Preferences</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {travelPreferenceList.map((pref) => (
                      <label key={pref.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          name={pref.id}
                          checked={formData.travelPreferences[pref.id] || false}
                          onChange={handleChange}
                          className="h-5 w-5 text-blue-500 rounded focus:ring-blue-400"
                        />
                        <span className="flex items-center">
                          <span className="mr-2">{pref.icon}</span>
                          <span className="font-medium text-gray-700">{pref.label}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Travel Experience & Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">Travel Experience Level</label>
                    <select
                      name="travelExperience"
                      value={formData.travelExperience}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {experienceLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-2">Travel Budget</label>
                    <select
                      name="travelBudget"
                      value={formData.travelBudget}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {budgetLevels.map(budget => (
                        <option key={budget.value} value={budget.value}>
                          {budget.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Languages & Transport */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">Languages Spoken</label>
                    <div className="grid grid-cols-2 gap-2">
                      {languageOptions.map(lang => (
                        <label key={lang} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name={`language_${lang}`}
                            checked={formData.languages.includes(lang)}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-500 rounded"
                          />
                          <span>{lang}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-2">Preferred Transport</label>
                    <div className="grid grid-cols-2 gap-2">
                      {transportOptions.map(transport => (
                        <label key={transport.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name={`transport_${transport.value}`}
                            checked={formData.preferredTransport.includes(transport.value)}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-500 rounded"
                          />
                          <span className="flex items-center">
                            {transport.icon}
                            <span className="ml-2">{transport.label}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Social Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">Instagram</label>
                      <input
                        type="text"
                        value={formData.socialLinks.instagram}
                        onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                        placeholder="Username"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">Twitter</label>
                      <input
                        type="text"
                        value={formData.socialLinks.twitter}
                        onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                        placeholder="Username"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">Facebook</label>
                      <input
                        type="text"
                        value={formData.socialLinks.facebook}
                        onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                        placeholder="Username"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">LinkedIn</label>
                      <input
                        type="text"
                        value={formData.socialLinks.linkedin}
                        onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                        placeholder="Username"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={updating}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                  >
                    {updating ? (
                      <>
                        <span className="animate-spin inline-block h-5 w-5 border-b-2 border-white rounded-full mr-2"></span>
                        Updating Profile...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="max-w-2xl space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <FaKey className="mr-2" />
                    Change Password
                  </h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                    >
                      {changingPassword ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </form>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <FaTrash className="mr-2" />
                    Danger Zone
                  </h3>
                  <p className="text-gray-600 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                  <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium">
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'friends' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Friends List */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Friends ({friends.length})</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {friends.map((friend, index) => (
                        <div key={friend._id || index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center">
                            <img
                              src={
                                friend.profileImage && friend.profileImage !== 'default-profile.jpg'
                                  ? `http://localhost:5000/uploads/profiles/${friend.profileImage}`
                                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || 'Friend')}&background=random&size=32`
                              }
                              alt={friend.name || 'Friend'}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                            <div>
                              <div className="font-medium">{friend.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{friend.city || 'Location not set'}</div>
                            </div>
                          </div>
                          <button className="text-blue-500 hover:text-blue-600">
                            <AiOutlineMessage size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Followers */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Followers ({followers.length})</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {followers.map((follower, index) => (
                        <div key={follower._id || index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center">
                            <img
                              src={
                                follower.profileImage && follower.profileImage !== 'default-profile.jpg'
                                  ? `http://localhost:5000/uploads/profiles/${follower.profileImage}`
                                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.name || 'Follower')}&background=random&size=32`
                              }
                              alt={follower.name || 'Follower'}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                            <div>
                              <div className="font-medium">{follower.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{follower.city || 'Location not set'}</div>
                            </div>
                          </div>
                          {follower.isFollowingBack ? (
                            <span className="text-sm text-gray-500">Follows you back</span>
                          ) : (
                            <button 
                              onClick={() => handleFollowBack(follower._id)}
                              className="text-sm text-blue-500 hover:text-blue-600"
                            >
                              Follow back
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Following */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Following ({following.length})</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {following.map((follow, index) => (
                        <div key={follow._id || index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center">
                            <img
                              src={
                                follow.profileImage && follow.profileImage !== 'default-profile.jpg'
                                  ? `http://localhost:5000/uploads/profiles/${follow.profileImage}`
                                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(follow.name || 'Following')}&background=random&size=32`
                              }
                              alt={follow.name || 'Following'}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                            <div>
                              <div className="font-medium">{follow.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{follow.city || 'Location not set'}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleUnfollow(follow._id)}
                            className="text-sm text-red-500 hover:text-red-600"
                          >
                            Unfollow
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trips' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">Trip History</h3>
                {profile.pastTrips && profile.pastTrips.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profile.pastTrips.map((trip, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-lg text-gray-800">{trip.destination}</h4>
                          {trip.rating && (
                            <div className="flex items-center">
                              {renderRating(trip.rating)}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <FaCalendarAlt className="mr-2" />
                            {trip.startDate && trip.endDate ? (
                              <span>
                                {format(new Date(trip.startDate), 'dd MMM yyyy')} - {format(new Date(trip.endDate), 'dd MMM yyyy')}
                              </span>
                            ) : (
                              'Dates not specified'
                            )}
                          </div>
                          <div className="flex items-center">
                            <FaUserFriends className="mr-2" />
                            <span>Group size: {trip.groupSize || 'Not specified'}</span>
                          </div>
                          {trip.notes && (
                            <p className="mt-3 text-gray-700">{trip.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <AiOutlineHistory className="text-4xl text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-600 mb-2">No Trip History Yet</h4>
                    <p className="text-gray-500">Your completed trips will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;