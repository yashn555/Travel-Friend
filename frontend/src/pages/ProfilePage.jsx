// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile, uploadProfileImage } from '../services/profileService';
import { AiOutlineCamera } from 'react-icons/ai';
import './ProfilePage.css'; // optional: for extra styling

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
        const res = await getProfile();
        const data = res.profile || res.data?.profile; // handle backend response
        setProfile(data);
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          town: data.town || '',
          state: data.state || '',
          mobile: data.mobile || '',
          travelPreferences: data.travelPreferences || {}
        });
      } catch (err) {
        console.error('Profile fetch error:', err);
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
      setProfile(res.profile || res.data?.profile);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err);
      alert('Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  // Handle profile image upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);

    const formDataImage = new FormData();
    formDataImage.append('image', file);

    try {
      const res = await uploadProfileImage(formDataImage);
      setProfile((prev) => ({ ...prev, profileImage: res.profileImage }));
      alert('Profile image uploaded successfully!');
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Failed to upload image.');
    } finally {
      setImageUploading(false);
    }
  };

  if (loading) return <div className="text-center mt-10">Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-xl p-6 mt-6">
      <h1 className="text-2xl font-bold mb-4 text-center">My Profile</h1>

      {/* Profile Image */}
      <div className="flex justify-center mb-6 relative">
        <img
          src={
            profile.profileImage
              ? `http://localhost:5000/uploads/profiles/${profile.profileImage}`
              : '/default-profile.jpg'
          }
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
        />
        <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer">
          <input type="file" onChange={handleImageChange} className="hidden" />
          {imageUploading ? '...' : <AiOutlineCamera size={20} />}
        </label>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block font-semibold">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block font-semibold">Email (cannot change)</label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full border rounded p-2 bg-gray-100"
          />
        </div>

        <div>
          <label className="block font-semibold">Mobile</label>
          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block font-semibold">Town</label>
          <input
            type="text"
            name="town"
            value={formData.town}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block font-semibold">State</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block font-semibold">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            className="w-full border rounded p-2"
            rows={4}
            placeholder="Tell us about yourself"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Travel Preferences</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.keys(formData.travelPreferences).map((pref) => (
              <label key={pref} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name={pref}
                  checked={formData.travelPreferences[pref]}
                  onChange={handlePreferenceChange}
                />
                <span className="capitalize">{pref}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={updating}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {updating ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
