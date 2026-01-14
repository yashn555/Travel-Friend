import React, { useEffect, useState } from 'react';
import { getMyGroups } from '../../services/groupService';
import { Link } from 'react-router-dom';

const MyGroupsPage = () => {
  const [groups, setGroups] = useState([]);

  const fetchGroups = async () => {
    const res = await getMyGroups();
    setGroups(res.groups);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">My Groups / Trips</h2>
      {groups.map(group => (
        <div key={group._id} className="border p-3 mb-3 rounded shadow">
          <h3>{group.destination}</h3>
          <p>Dates: {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}</p>
          <p>Members: {group.currentMembers.length}/{group.maxMembers}</p>
          <Link to={`/groups/${group._id}`} className="text-blue-500">View Details</Link>
        </div>
      ))}
    </div>
  );
};

export default MyGroupsPage;
