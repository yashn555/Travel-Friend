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
  getTripHistory, // Added for trip history
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
  
  // Trip History State - ADDED
  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  
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

  // ========== ADDED: Fetch Trip History Function ==========
  const fetchTripHistory = async () => {
    try {
      setTripsLoading(true);
      console.log('🔄 Fetching trip history...');
      
      const res = await getTripHistory();
      console.log('📊 Trip history response:', res);
      
      if (res.success) {
        setTrips(res.data || []);
      } else {
        toast.error(res.message || 'Failed to load trip history');
      }
    } catch (err) {
      console.error('❌ Error fetching trip history:', err);
      toast.error('Failed to load trip history');
    } finally {
      setTripsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    getLocation();
    fetchTripHistory(); // Added: Fetch trip history on component mount
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
                                   {/* Bio */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <AiOutlineMessage className="mr-2" />
                      About Me
                    </h3>
                    <p className="text-gray-600 whitespace-pre-line">
                      {profile.bio || 'No bio added yet.'}
                    </p>
                  </div>

                  {/* Travel Preferences */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <MdTravelExplore className="mr-2" />
                      Travel Preferences
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {travelPreferenceList.map(pref => (
                        profile.travelPreferences?.[pref.id] && (
                          <span 
                            key={pref.id}
                            className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-blue-200 text-blue-700 text-sm"
                          >
                            <span className="mr-1">{pref.icon}</span>
                            {pref.label}
                          </span>
                        )
                      ))}
                      {!Object.values(profile.travelPreferences || {}).some(v => v) && (
                        <p className="text-gray-500">No travel preferences set</p>
                      )}
                    </div>
                  </div>

                  {/* Languages & Experience */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <FaLanguage className="mr-2" />
                        Languages
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(profile.languages) && profile.languages.length > 0 ? (
                          profile.languages.map(lang => (
                            <span 
                              key={lang} 
                              className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                            >
                              {lang}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-500">No languages added</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <AiOutlineStar className="mr-2" />
                        Experience Level
                      </h3>
                      <div className="flex items-center">
                        <div className={`px-4 py-2 rounded-lg ${
                          profile.travelExperience === 'beginner' ? 'bg-blue-100 text-blue-800' :
                          profile.travelExperience === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {getTravelExperienceDisplay()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  {profile.socialLinks && Object.values(profile.socialLinks).some(val => val) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Social Links</h3>
                      <div className="flex flex-wrap gap-4">
                        {profile.socialLinks.instagram && (
                          <a 
                            href={`https://instagram.com/${profile.socialLinks.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90"
                          >
                            Instagram
                          </a>
                        )}
                        {profile.socialLinks.twitter && (
                          <a 
                            href={`https://twitter.com/${profile.socialLinks.twitter}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-2 bg-blue-400 text-white rounded-lg hover:opacity-90"
                          >
                            Twitter
                          </a>
                        )}
                        {profile.socialLinks.facebook && (
                          <a 
                            href={`https://facebook.com/${profile.socialLinks.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90"
                          >
                            Facebook
                          </a>
                        )}
                        {profile.socialLinks.linkedin && (
                          <a 
                            href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:opacity-90"
                          >
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Stats & Info */}
                <div className="space-y-6">
                  {/* User Stats */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Profile Stats</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Trips Completed</span>
                        <span className="font-bold text-blue-600">{userStats.tripsCompleted || 0}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Total Distance</span>
                        <span className="font-bold text-green-600">{userStats.totalDistance || 0} km</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Countries Visited</span>
                        <span className="font-bold text-purple-600">{userStats.countriesVisited || 0}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Member Since</span>
                        <span className="font-bold text-gray-800">
                          {profile.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <FaBirthdayCake className="mr-3 text-gray-400" />
                        <span>Date of Birth:</span>
                        <span className="ml-auto font-medium">{getDateOfBirthDisplay()}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FaVenusMars className="mr-3 text-gray-400" />
                        <span>Gender:</span>
                        <span className="ml-auto font-medium">{getGenderDisplay()}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FaLanguage className="mr-3 text-gray-400" />
                        <span>Languages:</span>
                        <span className="ml-auto font-medium text-right">
                          {getLanguagesDisplay()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setActiveTab('edit')}
                        className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 py-3 rounded-lg flex items-center justify-center"
                      >
                        <AiOutlineEdit className="mr-2" />
                        Edit Profile
                      </button>
                      <button
                        onClick={() => setActiveTab('trips')}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center"
                      >
                        <AiOutlineHistory className="mr-2" />
                        View Trip History
                      </button>
                      <button
                        onClick={() => setActiveTab('security')}
                        className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 py-3 rounded-lg flex items-center justify-center"
                      >
                        <FaKey className="mr-2" />
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'edit' && (
              <div className="max-w-3xl">
                <form onSubmit={handleUpdate}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+91 9876543210"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          UPI ID
                        </label>
                        <input
                          type="text"
                          name="upiId"
                          value={formData.upiId}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="username@upi"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          rows="3"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                    </div>

                    {/* Location Information */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Location</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Town/Village
                        </label>
                        <input
                          type="text"
                          name="town"
                          value={formData.town}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your town or village"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your city"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your state"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Personal Details */}
                    <div className="space-y-4 md:col-span-2">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Personal Details</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gender
                          </label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="prefer-not-to-say">Prefer not to say</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Travel Experience
                          </label>
                          <select
                            name="travelExperience"
                            value={formData.travelExperience}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {experienceLevels.map(level => (
                              <option key={level.value} value={level.value}>
                                {level.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Languages */}
                    <div className="space-y-4 md:col-span-2">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Languages</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {languageOptions.map(lang => (
                          <label key={lang} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name={`language_${lang}`}
                              checked={formData.languages.includes(lang)}
                              onChange={handleChange}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">{lang}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Travel Preferences */}
                    <div className="space-y-4 md:col-span-2">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Travel Preferences</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {travelPreferenceList.map(pref => (
                          <label key={pref.id} className="flex items-center space-x-2 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <input
                              type="checkbox"
                              name={pref.id}
                              checked={formData.travelPreferences[pref.id] || false}
                              onChange={handleChange}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="mr-1">{pref.icon}</span>
                            <span className="text-gray-700">{pref.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Transportation */}
                    <div className="space-y-4 md:col-span-2">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Preferred Transportation</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {transportOptions.map(transport => (
                          <label key={transport.value} className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              name={`transport_${transport.value}`}
                              checked={formData.preferredTransport.includes(transport.value)}
                              onChange={handleChange}
                              className="mb-2"
                            />
                            <span className="text-2xl mb-2">{transport.icon}</span>
                            <span className="text-sm text-gray-700">{transport.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="space-y-4 md:col-span-2">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Travel Budget</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {budgetLevels.map(budget => (
                          <label key={budget.value} className="flex items-center space-x-2 cursor-pointer p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <input
                              type="radio"
                              name="travelBudget"
                              value={budget.value}
                              checked={formData.travelBudget === budget.value}
                              onChange={handleChange}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">{budget.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4 md:col-span-2">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Social Links</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Instagram
                          </label>
                          <input
                            type="text"
                            value={formData.socialLinks.instagram}
                            onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="username"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Twitter
                          </label>
                          <input
                            type="text"
                            value={formData.socialLinks.twitter}
                            onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="username"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Facebook
                          </label>
                          <input
                            type="text"
                            value={formData.socialLinks.facebook}
                            onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="username"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            LinkedIn
                          </label>
                          <input
                            type="text"
                            value={formData.socialLinks.linkedin}
                            onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="username"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center"
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'trips' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-800">Trip History</h3>
                  <button
                    onClick={fetchTripHistory}
                    disabled={tripsLoading}
                    className="flex items-center text-blue-500 hover:text-blue-600"
                  >
                    <AiOutlineSync className={`mr-2 ${tripsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {tripsLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Loading trips...</span>
                  </div>
                ) : trips.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="text-6xl mb-4">🧳</div>
                    <h4 className="text-xl font-semibold text-gray-700 mb-2">No Trips Yet</h4>
                    <p className="text-gray-500 mb-4">You haven't completed any trips yet.</p>
                    <button
                      onClick={() => window.location.href = '/plan-trip'}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
                    >
                      Plan Your First Trip
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trips.map((trip, index) => (
                      <div key={trip._id || index} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-lg text-gray-800">{trip.destination || 'Unnamed Trip'}</h4>
                              <p className="text-sm text-gray-500 flex items-center mt-1">
                                <FaCalendarAlt className="mr-2" />
                                {trip.startDate ? format(new Date(trip.startDate), 'dd MMM yyyy') : 'Date not set'}
                                {trip.endDate && ` - ${format(new Date(trip.endDate), 'dd MMM yyyy')}`}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                              trip.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {trip.status || 'planned'}
                            </span>
                          </div>
                          
                          <div className="mb-4">
                            <div className="flex items-center text-gray-600 mb-2">
                              <FaMapMarkerAlt className="mr-2" />
                              <span className="text-sm">From: {trip.origin || 'Not specified'}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <FaMapMarkerAlt className="mr-2" />
                              <span className="text-sm">To: {trip.destination || 'Not specified'}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{trip.distance || 0}</div>
                              <div className="text-xs text-gray-500">KM</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">₹{trip.cost || 0}</div>
                              <div className="text-xs text-gray-500">Cost</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">{trip.duration || 0}</div>
                              <div className="text-xs text-gray-500">Days</div>
                            </div>
                          </div>

                          {trip.travelPartners && trip.travelPartners.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 mb-2">Travel Partners:</p>
                              <div className="flex -space-x-2">
                                {trip.travelPartners.slice(0, 3).map((partner, idx) => (
                                  <div key={idx} className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs">
                                    {partner.name ? partner.name.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                ))}
                                {trip.travelPartners.length > 3 && (
                                  <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                                    +{trip.travelPartners.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <button
                            onClick={() => window.location.href = `/trip/${trip._id}`}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-800">Trip Statistics</h4>
                      <p className="text-sm text-gray-500">
                        Total: {trips.length} trips • {trips.filter(t => t.status === 'completed').length} completed
                      </p>
                    </div>
                    <button
                      onClick={() => window.location.href = '/plan-trip'}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center"
                    >
                      <MdTravelExplore className="mr-2" />
                      Plan New Trip
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'friends' && (
              <div className="space-y-8">
                {/* Friends, Followers, Following Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8">
                    {[
                      { id: 'friends', label: `Friends (${friends.length})`, icon: <FaUserFriends /> },
                      { id: 'followers', label: `Followers (${followers.length})`, icon: <FaUserPlus /> },
                      { id: 'following', label: `Following (${following.length})`, icon: <AiOutlineUserAdd /> }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-3 px-1 font-medium border-b-2 transition-colors flex items-center ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Friends List */}
                {activeTab === 'friends' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-800">My Friends</h3>
                      <button
                        onClick={() => setActiveTab('overview')}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        <AiOutlineSearch className="inline mr-1" />
                        Find More Friends
                      </button>
                    </div>
                    
                    {friends.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <div className="text-6xl mb-4">👥</div>
                        <h4 className="text-xl font-semibold text-gray-700 mb-2">No Friends Yet</h4>
                        <p className="text-gray-500 mb-4">Start following people to build your travel network.</p>
                        <button
                          onClick={() => setActiveTab('overview')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
                        >
                          Find Travel Buddies
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {friends.map((friend, index) => (
                          <div key={friend._id || friend.id || index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                            <div className="flex flex-col items-center text-center">
                              <img
                                src={
                                  friend.profileImage && friend.profileImage !== 'default-profile.jpg'
                                    ? `http://localhost:5000/uploads/profiles/${friend.profileImage}`
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || 'User')}&background=random&size=80`
                                }
                                alt={friend.name || 'Friend'}
                                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg mb-4"
                              />
                              <h4 className="font-bold text-lg text-gray-800">{friend.name || 'Unknown User'}</h4>
                              
                              <div className="flex items-center justify-center mt-2 mb-3">
                                {renderRating(friend.rating || 4.5)}
                                <span className="ml-2 text-sm text-gray-600">{friend.rating?.toFixed(1) || '4.5'}</span>
                              </div>
                              
                              <div className="text-sm text-gray-500 mb-4">
                                <div className="flex items-center justify-center">
                                  <FaMapMarkerAlt className="mr-1 text-xs" />
                                  {friend.city || friend.town || 'Location not set'}
                                </div>
                              </div>
                              
                              <div className="w-full space-y-2">
                                <button
                                  onClick={() => window.location.href = `/user/${friend._id || friend.id}`}
                                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
                                >
                                  View Profile
                                </button>
                                <button
                                  onClick={() => window.open(`mailto:${friend.email}`, '_blank')}
                                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-medium"
                                >
                                  <FaEnvelope className="inline mr-1" />
                                  Message
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Followers List */}
                {activeTab === 'followers' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-800">My Followers</h3>
                      <div className="text-sm text-gray-500">
                        {followers.filter(f => f.isFollowingBack).length} mutual follows
                      </div>
                    </div>
                    
                    {followers.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <div className="text-6xl mb-4">👤</div>
                        <h4 className="text-xl font-semibold text-gray-700 mb-2">No Followers Yet</h4>
                        <p className="text-gray-500">Share your profile to get more followers.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {followers.map((follower, index) => (
                          <div key={follower._id || follower.id || index} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <img
                                  src={
                                    follower.profileImage && follower.profileImage !== 'default-profile.jpg'
                                      ? `http://localhost:5000/uploads/profiles/${follower.profileImage}`
                                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.name || 'User')}&background=random&size=50`
                                  }
                                  alt={follower.name || 'Follower'}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                                <div className="ml-4">
                                  <h4 className="font-bold text-gray-800">{follower.name || 'Unknown User'}</h4>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <FaMapMarkerAlt className="mr-1 text-xs" />
                                    {follower.city || follower.town || 'Location not set'}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                {follower.isFollowingBack ? (
                                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                    <FaCheck className="inline mr-1" />
                                    Following
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleFollowBack(follower._id || follower.id)}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
                                  >
                                    Follow Back
                                  </button>
                                )}
                                <button
                                  onClick={() => window.location.href = `/user/${follower._id || follower.id}`}
                                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium"
                                >
                                  View
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Following List */}
                {activeTab === 'following' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-800">Following</h3>
                      <div className="text-sm text-gray-500">
                        {following.length} people
                      </div>
                    </div>
                    
                    {following.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <div className="text-6xl mb-4">👣</div>
                        <h4 className="text-xl font-semibold text-gray-700 mb-2">Not Following Anyone</h4>
                        <p className="text-gray-500">Start following travelers to see their updates.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {following.map((user, index) => (
                          <div key={user._id || user.id || index} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <img
                                  src={
                                    user.profileImage && user.profileImage !== 'default-profile.jpg'
                                      ? `http://localhost:5000/uploads/profiles/${user.profileImage}`
                                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&size=50`
                                  }
                                  alt={user.name || 'User'}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                                <div className="ml-4">
                                  <h4 className="font-bold text-gray-800">{user.name || 'Unknown User'}</h4>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <FaMapMarkerAlt className="mr-1 text-xs" />
                                    {user.city || user.town || 'Location not set'}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handleUnfollow(user._id || user.id)}
                                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium"
                                >
                                  Unfollow
                                </button>
                                <button
                                  onClick={() => window.location.href = `/user/${user._id || user.id}`}
                                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium"
                                >
                                  View
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="max-w-2xl">
                <div className="bg-white border border-gray-200 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Change Password</h3>
                  <p className="text-gray-600 mb-8">Update your password to keep your account secure.</p>
                  
                  <form onSubmit={handlePasswordChange}>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password *
                        </label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter current password"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password *
                        </label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="At least 6 characters"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password *
                        </label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Re-enter new password"
                        />
                      </div>
                      
                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={changingPassword}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center"
                        >
                          {changingPassword ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Changing Password...
                            </>
                          ) : (
                            'Change Password'
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                  
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Security Tips</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <FaCheck className="text-green-500 mr-2 mt-1" />
                        Use a strong password with a mix of letters, numbers, and symbols
                      </li>
                      <li className="flex items-start">
                        <FaCheck className="text-green-500 mr-2 mt-1" />
                        Never share your password with anyone
                      </li>
                      <li className="flex items-start">
                        <FaCheck className="text-green-500 mr-2 mt-1" />
                        Change your password regularly for better security
                      </li>
                      <li className="flex items-start">
                        <FaCheck className="text-green-500 mr-2 mt-1" />
                        Use different passwords for different accounts
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl">
                <div className="bg-white border border-gray-200 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h3>
                  
                  <div className="space-y-6">
                    {/* Notification Settings */}
                    <div className="border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <AiOutlineMessage className="mr-2" />
                        Notification Preferences
                      </h4>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <div className="font-medium text-gray-700">Trip Updates</div>
                            <div className="text-sm text-gray-500">Get notifications about your trips</div>
                          </div>
                          <input type="checkbox" className="toggle" defaultChecked />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <div className="font-medium text-gray-700">Friend Requests</div>
                            <div className="text-sm text-gray-500">Get notifications when someone follows you</div>
                          </div>
                          <input type="checkbox" className="toggle" defaultChecked />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <div className="font-medium text-gray-700">Messages</div>
                            <div className="text-sm text-gray-500">Get notifications for new messages</div>
                          </div>
                          <input type="checkbox" className="toggle" defaultChecked />
                        </label>
                      </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <AiOutlineLock className="mr-2" />
                        Privacy Settings
                      </h4>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <div className="font-medium text-gray-700">Profile Visibility</div>
                            <div className="text-sm text-gray-500">Allow others to view your profile</div>
                          </div>
                          <select className="border border-gray-300 rounded-lg px-4 py-2">
                            <option>Public</option>
                            <option>Friends Only</option>
                            <option>Private</option>
                          </select>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <div className="font-medium text-gray-700">Show Last Seen</div>
                            <div className="text-sm text-gray-500">Show when you were last active</div>
                          </div>
                          <input type="checkbox" className="toggle" defaultChecked />
                        </label>
                      </div>
                    </div>

                    {/* Account Actions */}
                    <div className="border border-red-200 bg-red-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">Account Actions</h4>
                      <div className="space-y-4">
                        <button className="w-full bg-red-100 hover:bg-red-200 text-red-600 py-3 rounded-lg font-medium flex items-center justify-center">
                          <FaTrash className="mr-2" />
                          Delete Account
                        </button>
                        <p className="text-sm text-gray-500">
                          Warning: Deleting your account will permanently remove all your data including trips, friends, and settings. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;