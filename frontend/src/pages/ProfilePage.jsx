import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile, uploadProfileImage } from '../services/api'; // CHANGED
import { AiOutlineCamera } from 'react-icons/ai';
import { toast } from 'react-toastify';


const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

 const [formData, setFormData] = useState({
  name: '',
  bio: '',
  town: '',
  state: '',
  mobile: '',
  upiId: '', // Add this
  travelPreferences: {
    adventure: false,
    luxury: false,
    budget: false,
    solo: false,
    group: false,
    beach: false,
    mountain: false,
    cultural: false
  }
});

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
  setFormData({
    name: data.name || '',
    bio: data.bio || '',
    town: data.town || '',
    state: data.state || '',
    mobile: data.mobile || '',
    upiId: data.upiId || '', // Add this
    travelPreferences: data.travelPreferences || {
      adventure: false,
      luxury: false,
      budget: false,
      solo: false,
      group: false,
      beach: false,
      mountain: false,
      cultural: false
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
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your personal information and preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        {/* Profile Image */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <img
              src={
                profile.profileImage && profile.profileImage !== 'default-profile.jpg'
                  ? `http://localhost:5000/uploads/profiles/${profile.profileImage}`
                  : 'https://via.placeholder.com/150?text=Profile'
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
  <input
    type="text"
    name="upiId"
    value={formData.upiId || ''}
    onChange={handleChange}
    placeholder="username@upi"
    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
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
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-3">Travel Preferences</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(formData.travelPreferences).map((pref) => (
                <label key={pref} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name={pref}
                    checked={formData.travelPreferences[pref]}
                    onChange={handlePreferenceChange}
                    className="h-5 w-5 text-blue-500 rounded focus:ring-blue-400"
                  />
                  <span className="capitalize font-medium text-gray-700">{pref}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={updating}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full md:w-auto"
            >
              {updating ? (
                <>
                  <span className="animate-spin inline-block h-4 w-4 border-b-2 border-white rounded-full mr-2"></span>
                  Updating...
                </>
              ) : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;