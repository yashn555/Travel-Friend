import React, { useState } from 'react';
import { createGroup } from '../../services/groupService';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const CreateTripPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    destination: '',
    description: '',
    startDate: '',
    endDate: '',
    minBudget: '',
    maxBudget: '',
    maxMembers: '10',
    groupType: 'anonymous',
    tags: ''
  });
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setMessage('End date must be after start date');
      return;
    }
    
    if (parseInt(formData.minBudget) > parseInt(formData.maxBudget)) {
      setMessage('Max budget must be greater than min budget');
      return;
    }
    
    try {
      setLoading(true);
      setMessage('Creating group...');
      
      // Prepare tags array
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      // Prepare group data
      const groupData = {
        ...formData,
        tags: tagsArray,
        minBudget: parseInt(formData.minBudget),
        maxBudget: parseInt(formData.maxBudget),
        maxMembers: parseInt(formData.maxMembers)
      };
      
      const res = await createGroup(groupData);
      setMessage(res.message || 'Group created successfully!');
      
      // Reset form
      setFormData({
        destination: '',
        description: '',
        startDate: '',
        endDate: '',
        minBudget: '',
        maxBudget: '',
        maxMembers: '10',
        groupType: 'anonymous',
        tags: ''
      });
      
      // Navigate to the new group after 2 seconds
      setTimeout(() => {
        if (res.data && res.data._id) {
          navigate(`/groups/${res.data._id}`);
        } else {
          navigate('/my-groups');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error creating group:', error);
      setMessage(error.response?.data?.message || 'Error creating group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create a New Trip / Group</h2>
        
        {message && (
          <div className={`mb-6 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Destination */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Destination *</label>
            <input 
              type="text" 
              name="destination" 
              placeholder="e.g., Goa, Paris, Mountains" 
              value={formData.destination}
              onChange={handleChange}
              required 
              className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Description *</label>
            <textarea 
              name="description" 
              placeholder="Describe your trip, itinerary, expectations..." 
              value={formData.description}
              onChange={handleChange}
              required 
              rows="4"
              className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Start Date *</label>
              <input 
                type="date" 
                name="startDate" 
                value={formData.startDate}
                onChange={handleChange}
                min={today}
                required 
                className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2 font-medium">End Date *</label>
              <input 
                type="date" 
                name="endDate" 
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate || today}
                required 
                className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Min Budget (INR) *</label>
              <input 
                type="number" 
                name="minBudget" 
                placeholder="e.g., 5000" 
                value={formData.minBudget}
                onChange={handleChange}
                min="0"
                required 
                className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Max Budget (INR) *</label>
              <input 
                type="number" 
                name="maxBudget" 
                placeholder="e.g., 20000" 
                value={formData.maxBudget}
                onChange={handleChange}
                min={formData.minBudget || "0"}
                required 
                className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Group Size & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Max Members *</label>
              <input 
                type="number" 
                name="maxMembers" 
                placeholder="e.g., 10" 
                value={formData.maxMembers}
                onChange={handleChange}
                min="2"
                max="50"
                required 
                className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Group Type *</label>
              <select 
                name="groupType" 
                value={formData.groupType}
                onChange={handleChange}
                className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="anonymous">Anonymous (Usernames only)</option>
                <option value="known">Known (Share contact details)</option>
                <option value="friends">Friends Only</option>
              </select>
            </div>
          </div>
          
          {/* Tags */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">
              Tags (comma separated)
              <span className="text-gray-500 text-sm ml-2">e.g., beach, adventure, budget</span>
            </label>
            <input 
              type="text" 
              placeholder="beach, adventure, budget" 
              value={formData.tags}
              onChange={handleChange}
              className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Submit Button */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 rounded font-medium ${loading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            >
              {loading ? 'Creating Group...' : 'Create Group'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 pt-6 border-t text-gray-500 text-sm">
          <p className="font-medium mb-2">How it works:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your group will be visible to other users in "Browse Groups"</li>
            <li>Users can request to join your group</li>
            <li>You'll receive join requests in "Group Requests" section</li>
            <li>Once approved, members will be added to group chat automatically</li>
            <li>You can manage all requests from your group page</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateTripPage;