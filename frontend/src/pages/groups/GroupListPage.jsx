import React, { useEffect, useState } from 'react';
import { getAllGroups, requestJoinGroup } from '../../services/groupService';

const GroupListPage = () => {
  const [groups, setGroups] = useState([]);
  const [message, setMessage] = useState('');

  const fetchGroups = async () => {
    try {
      const res = await getAllGroups();
      setGroups(res.groups);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleJoin = async (groupId) => {
    try {
      const res = await requestJoinGroup(groupId);
      setMessage(res.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error requesting join');
    }
  };

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Browse Trips</h2>
      {message && <p className="mb-4 text-green-600">{message}</p>}
      {groups.map(group => (
        <div key={group._id} className="border p-4 mb-3 rounded shadow">
          <h3 className="font-bold">{group.destination}</h3>
          <p>{group.description}</p>
          <p>Dates: {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}</p>
          <p>Budget: {group.budget.min} - {group.budget.max} {group.budget.currency}</p>
          <p>Type: {group.groupType}</p>
          <button onClick={() => handleJoin(group._id)} className="mt-2 bg-green-500 text-white px-3 py-1 rounded">Request to Join</button>
        </div>
      ))}
    </div>
  );
};

export default GroupListPage;
