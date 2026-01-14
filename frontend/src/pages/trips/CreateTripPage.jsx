import React, { useState } from 'react';
import { createGroup } from '../../services/groupService';
import * as groupService from '../../services/groupService';


const CreateTripPage = () => {
  const [formData, setFormData] = useState({
    destination: '',
    description: '',
    startDate: '',
    endDate: '',
    minBudget: '',
    maxBudget: '',
    maxMembers: '',
    groupType: 'anonymous',
    tags: []
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTags = (e) => {
    setFormData({ ...formData, tags: e.target.value.split(',') });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createGroup(formData);
      setMessage(res.message);
      setFormData({
        destination: '',
        description: '',
        startDate: '',
        endDate: '',
        minBudget: '',
        maxBudget: '',
        maxMembers: '',
        groupType: 'anonymous',
        tags: []
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating group');
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Create a New Trip / Group</h2>

      {message && <p className="mb-4 text-green-600">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" name="destination" placeholder="Destination" value={formData.destination} onChange={handleChange} required className="border p-2 w-full rounded" />
        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} required className="border p-2 w-full rounded" />
        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="border p-2 w-full rounded" />
        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="border p-2 w-full rounded" />
        <input type="number" name="minBudget" placeholder="Min Budget" value={formData.minBudget} onChange={handleChange} required className="border p-2 w-full rounded" />
        <input type="number" name="maxBudget" placeholder="Max Budget" value={formData.maxBudget} onChange={handleChange} required className="border p-2 w-full rounded" />
        <input type="number" name="maxMembers" placeholder="Max Members" value={formData.maxMembers} onChange={handleChange} required className="border p-2 w-full rounded" />
        
        <select name="groupType" value={formData.groupType} onChange={handleChange} className="border p-2 w-full rounded">
          <option value="anonymous">Anonymous</option>
          <option value="known">Known</option>
        </select>

        <input type="text" placeholder="Tags (comma separated)" value={formData.tags} onChange={handleTags} className="border p-2 w-full rounded" />

        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Create Group</button>
      </form>
    </div>
  );
};

export default CreateTripPage;
