import React, { useEffect, useState } from 'react';
import { getGroupById, requestJoinGroup } from '../../services/groupService';
import { useParams } from 'react-router-dom';

const GroupDetailsPage = () => {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchGroup = async () => {
      const res = await getGroupById(id);
      setGroup(res.group);
    };
    fetchGroup();
  }, [id]);

  const handleJoin = async () => {
    try {
      const res = await requestJoinGroup(id);
      setMessage(res.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error requesting join');
    }
  };

  if (!group) return <p>Loading...</p>;

  return (
    <div className="p-5 max-w-3xl mx-auto">
      {message && <p className="mb-2 text-green-600">{message}</p>}
      <h2 className="text-xl font-bold">{group.destination}</h2>
      <p>{group.description}</p>
      <p>Dates: {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}</p>
      <p>Budget: {group.budget.min} - {group.budget.max}</p>
      <p>Members: {group.currentMembers.length}/{group.maxMembers}</p>
      <p>Type: {group.groupType}</p>
      <button onClick={handleJoin} className="bg-green-500 text-white px-4 py-2 rounded mt-3">Request to Join</button>
    </div>
  );
};

export default GroupDetailsPage;
