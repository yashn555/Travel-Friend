import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getGroupById, updateGroup } from '../../services/groupService';

const EditGroupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    destination: '',
    description: '',
    startDate: '',
    endDate: '',
    maxMembers: 10,
    budget: {
      min: '',
      max: '',
      currency: 'INR'
    },
    tags: []
  });

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const data = await getGroupById(id);
      
      // Verify user is the creator
      const creatorId = data.createdBy?._id || data.createdBy;
      const userId = user?.id;
      
      if (String(creatorId) !== String(userId)) {
        toast.error('You are not authorized to edit this group');
        navigate('/my-groups');
        return;
      }
      
      // Format dates for input field (YYYY-MM-DD)
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };
      
      setFormData({
        destination: data.destination || '',
        description: data.description || '',
        startDate: formatDate(data.startDate),
        endDate: formatDate(data.endDate),
        maxMembers: data.maxMembers || 10,
        budget: {
          min: data.budget?.min || '',
          max: data.budget?.max || '',
          currency: data.budget?.currency || 'INR'
        },
        tags: data.tags || []
      });
      
      toast.success('Group details loaded');
      
    } catch (error) {
      console.error('Error fetching group:', error);
      toast.error('Failed to load group details');
      navigate('/my-groups');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('budget.')) {
      const budgetField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        budget: {
          ...prev.budget,
          [budgetField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTagsChange = (e) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags: tagsArray
    }));
  };

  const validateForm = () => {
    const today = new Date().toISOString().split('T')[0];
    
    if (!formData.destination.trim()) {
      toast.error('Destination is required');
      return false;
    }
    
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return false;
    }
    
    if (!formData.startDate) {
      toast.error('Start date is required');
      return false;
    }
    
    if (!formData.endDate) {
      toast.error('End date is required');
      return false;
    }
    
    if (formData.startDate < today) {
      toast.error('Start date cannot be in the past');
      return false;
    }
    
    if (formData.endDate < formData.startDate) {
      toast.error('End date must be after start date');
      return false;
    }
    
    if (formData.maxMembers < 2) {
      toast.error('Group must have at least 2 members');
      return false;
    }
    
    if (formData.maxMembers > 50) {
      toast.error('Maximum members cannot exceed 50');
      return false;
    }
    
    if (formData.budget.min && formData.budget.max) {
      const min = parseFloat(formData.budget.min);
      const max = parseFloat(formData.budget.max);
      
      if (min < 0 || max < 0) {
        toast.error('Budget values cannot be negative');
        return false;
      }
      
      if (min > max) {
        toast.error('Minimum budget cannot be greater than maximum budget');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      // Prepare data for API
      const updateData = {
        destination: formData.destination.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        maxMembers: parseInt(formData.maxMembers),
        budget: formData.budget
      };
      
      // Only include budget if values are provided
      if (!formData.budget.min || !formData.budget.max) {
        delete updateData.budget;
      }
      
      // Include tags if they exist
      if (formData.tags.length > 0) {
        updateData.tags = formData.tags;
      }
      
      await updateGroup(id, updateData);
      
      toast.success('Group updated successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/groups/${id}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error(error.response?.data?.message || 'Failed to update group');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading group details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-500 hover:text-blue-600 font-medium flex items-center gap-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Edit Group</h1>
        <p className="text-gray-600 mt-2">Update your group details</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Destination */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Destination *
            </label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
              placeholder="Where are you going?"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
              placeholder="Tell others about your trip..."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Date when the trip begins</p>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Date when the trip ends</p>
            </div>
          </div>

          {/* Group Size */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Maximum Members *
            </label>
            <input
              type="number"
              name="maxMembers"
              value={formData.maxMembers}
              onChange={handleChange}
              min="2"
              max="50"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 2, Maximum 50 members</p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Tags (Optional)
            </label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="beach, adventure, hiking (comma separated)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Current tags: {formData.tags.length > 0 ? formData.tags.join(', ') : 'None'}
            </p>
          </div>

          {/* Budget Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Budget (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Min Budget
                </label>
                <input
                  type="number"
                  name="budget.min"
                  value={formData.budget.min}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Minimum"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Max Budget
                </label>
                <input
                  type="number"
                  name="budget.max"
                  value={formData.budget.max}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Maximum"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Currency
                </label>
                <select
                  name="budget.currency"
                  value={formData.budget.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Leave budget fields empty if you don't want to specify
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving Changes...
                </span>
              ) : 'Save Changes'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate(`/groups/${id}`)}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroupPage;