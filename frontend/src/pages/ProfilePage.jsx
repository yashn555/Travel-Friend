import React, { useEffect, useState } from 'react';
import { 
  getProfile, 
  updateProfile, 
  uploadProfileImage,
  searchUsers,
  followUser
} from '../services/api';
import { AiOutlineCamera, AiOutlineSearch, AiOutlineEnvironment, AiOutlineGlobal } from 'react-icons/ai';
import { FaMapMarkerAlt, FaUserFriends, FaUserPlus, FaCompass, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import useGeoLocation from '../hooks/useGeoLocation';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Use geolocation hook
  const { location: userLocation, error: locationError, getLocation } = useGeoLocation();

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    town: '',
    state: '',
    mobile: '',
    upiId: '',
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
    }
  });

  // Enhanced travel preferences list
  const travelPreferenceList = [
    { id: 'adventure', label: 'Adventure' },
    { id: 'luxury', label: 'Luxury' },
    { id: 'budget', label: 'Budget' },
    { id: 'solo', label: 'Solo' },
    { id: 'group', label: 'Group' },
    { id: 'beach', label: 'Beach' },
    { id: 'mountain', label: 'Mountain' },
    { id: 'cultural', label: 'Cultural' },
    { id: 'backpacking', label: 'Backpacking' },
    { id: 'roadtrip', label: 'Roadtrip' },
    { id: 'family', label: 'Family' },
    { id: 'soloFemale', label: 'Solo Female' }
  ];

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getProfile();
        console.log('Profile response:', res);
        
        if (res.success && res.profile) {
          const data = res.profile;
          setProfile(data);
          
          // Ensure all travel preferences are initialized
          const travelPrefs = data.travelPreferences || {};
          
          setFormData({
            name: data.name || '',
            bio: data.bio || '',
            town: data.town || '',
            state: data.state || '',
            mobile: data.mobile || '',
            upiId: data.upiId || '',
            travelPreferences: {
              adventure: travelPrefs.adventure || false,
              luxury: travelPrefs.luxury || false,
              budget: travelPrefs.budget || false,
              solo: travelPrefs.solo || false,
              group: travelPrefs.group || false,
              beach: travelPrefs.beach || false,
              mountain: travelPrefs.mountain || false,
              cultural: travelPrefs.cultural || false,
              backpacking: travelPrefs.backpacking || false,
              roadtrip: travelPrefs.roadtrip || false,
              family: travelPrefs.family || false,
              soloFemale: travelPrefs.soloFemale || false
            }
          });
        } else {
          toast.error('Failed to load profile');
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        toast.error('Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    getLocation(); // Get user's current location on load
  }, []);

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle travel preference change
  const handlePreferenceChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      travelPreferences: {
        ...prev.travelPreferences,
        [name]: checked
      }
    }));
  };

  // Handle profile update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await updateProfile(formData);
      
      if (res.success) {
        setProfile(res.profile);
        toast.success('Profile updated successfully!');
        
        // Update local profile data with all fields
        const updatedProfile = {
          ...profile,
          ...formData
        };
        setProfile(updatedProfile);
      } else {
        toast.error(res.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  // Handle search for profiles/friends - FIXED
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    setSearching(true);
    try {
      // Use the imported searchUsers function
      const res = await searchUsers(searchQuery);
      
      if (res.success) {
        setSearchResults(res.data || []);
        if (res.data && res.data.length === 0) {
          toast.info('No users found matching your search');
        }
      } else {
        toast.error(res.message || 'Failed to search users');
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search profiles');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Handle follow request - FIXED
  const handleFollowRequest = async (userId) => {
    try {
      // Use the imported followUser function
      const res = await followUser(userId);
      
      if (res.success) {
        toast.success('Follow request sent!');
        
        // Update local state
        setSearchResults(prev => 
          prev.map(user => 
            user._id === userId 
              ? { ...user, isFollowing: true } 
              : user
          )
        );
      } else {
        toast.error(res.message || 'Failed to send follow request');
      }
    } catch (err) {
      console.error('Follow error:', err);
      toast.error('Failed to send follow request');
    }
  };

  // Handle profile image upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    setImageUploading(true);

    const formDataImage = new FormData();
    formDataImage.append('image', file);

    try {
      const res = await uploadProfileImage(formDataImage);
      
      if (res.success) {
        setProfile((prev) => ({ ...prev, profileImage: res.profileImage }));
        toast.success('Profile image uploaded successfully!');
      } else {
        toast.error(res.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  // Format location display
  const formatLocation = () => {
    if (userLocation) {
      return `${userLocation.city || 'Your Location'} (${userLocation.latitude?.toFixed(4) || '0.0000'}, ${userLocation.longitude?.toFixed(4) || '0.0000'})`;
    }
    return 'Location not available';
  };

  if (loading) {
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
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header with Live Location */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your personal information and preferences</p>
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

        {/* Search Bar for Profiles/Friends */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchResults.map(user => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <img
                        src={
                          user.profileImage && user.profileImage !== 'default-profile.jpg'
                            ? `http://localhost:5000/uploads/profiles/${user.profileImage}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=40`
                        }
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-800">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center flex-wrap gap-1">
                          <AiOutlineEnvironment size={12} className="mr-1" />
                          {user.city || user.town || 'Location not set'}
                          {user.rating && (
                            <span className="ml-2 flex items-center">
                              <span className="text-yellow-500">★</span>
                              {user.rating.toFixed(1)}
                            </span>
                          )}
                          {user.mutualFriendsCount > 0 && (
                            <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                              {user.mutualFriendsCount} mutual friends
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {user._id !== profile._id && (
                      <button
                        onClick={() => handleFollowRequest(user._id)}
                        disabled={user.isFollowing || user.isFriend}
                        className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center ${
                          user.isFollowing || user.isFriend
                            ? 'bg-gray-100 text-gray-500 cursor-default'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {user.isFollowing ? (
                          <>
                            <FaCheck className="mr-2" />
                            Following
                          </>
                        ) : user.isFriend ? (
                          <>
                            <FaUserFriends className="mr-2" />
                            Friends
                          </>
                        ) : (
                          <>
                            <FaUserPlus className="mr-2" />
                            Follow
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Profile Content */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        {/* Profile Image */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <img
              src={
                profile.profileImage && profile.profileImage !== 'default-profile.jpg'
                  ? `http://localhost:5000/uploads/profiles/${profile.profileImage}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random&size=150`
              }
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-3 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
              <input 
                type="file" 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/*"
              />
              {imageUploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <AiOutlineCamera size={20} />
              )}
            </label>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{profile.name}</h2>
          <p className="text-gray-600">{profile.email}</p>
          
          {/* Location Info */}
          <div className="mt-2 flex items-center text-gray-500">
            <FaMapMarkerAlt className="mr-2" />
            {profile.town && profile.state ? `${profile.town}, ${profile.state}` : 'Location not set'}
            {userLocation && (
              <span className="ml-4 text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full flex items-center">
                <AiOutlineGlobal className="mr-1" />
                Live: {userLocation.city || 'Nearby'}
              </span>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Name *</label>
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
              <label className="block font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-500"
              />
              <p className="text-sm text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">Mobile *</label>
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
              <label className="block font-semibold text-gray-700 mb-2">UPI ID</label>
              <div className="relative">
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId || ''}
                  onChange={handleChange}
                  placeholder="username@upi"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  @upi
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Required for expense splitting. Format: username@upi
              </p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">Town</label>
              <input
                type="text"
                name="town"
                value={formData.town}
                onChange={handleChange}
                placeholder="Enter your town"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select State</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Punjab">Punjab</option>
                <option value="Haryana">Haryana</option>
                <option value="Kerala">Kerala</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Bihar">Bihar</option>
                <option value="Odisha">Odisha</option>
                <option value="Assam">Assam</option>
                <option value="Jharkhand">Jharkhand</option>
                <option value="Chhattisgarh">Chhattisgarh</option>
                <option value="Uttarakhand">Uttarakhand</option>
                <option value="Himachal Pradesh">Himachal Pradesh</option>
                <option value="Goa">Goa</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Tell us about yourself, your travel experiences, and preferences..."
            />
            <p className="text-sm text-gray-400 mt-1">
              Share your travel style, interests, and what you're looking for in travel buddies
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block font-semibold text-gray-700">Travel Preferences</label>
              <span className="text-sm text-gray-500">
                Selected: {Object.values(formData.travelPreferences).filter(Boolean).length}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {travelPreferenceList.map((pref) => (
                <label key={pref.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name={pref.id}
                    checked={formData.travelPreferences[pref.id] || false}
                    onChange={handlePreferenceChange}
                    className="h-5 w-5 text-blue-500 rounded focus:ring-blue-400"
                  />
                  <span className="font-medium text-gray-700">{pref.label}</span>
                </label>
              ))}
            </div>
          </div>

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
                'Update Profile'
              )}
            </button>
            
            {/* Form status message */}
            <div className="mt-4 text-sm text-gray-500">
              <p>Make sure all required fields are filled. Your profile helps others find compatible travel buddies!</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;