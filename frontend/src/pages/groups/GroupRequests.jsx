import React, { useEffect, useState } from 'react';
import { getMyGroups, handleJoinRequest } from '../../services/groupService';

const GroupRequests = () => {
  const [groups, setGroups] = useState([]);

  const fetchGroups = async () => {
    const res = await getMyGroups();
    setGroups(res.groups);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleRequest = async (groupId, requestId, action) => {
    await handleJoinRequest(groupId, requestId, action);
    fetchGroups();
  };

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Pending Join Requests</h2>
      {groups.map(group =>
        group.joinRequests && group.joinRequests.length > 0 && (
          <div key={group._id} className="border p-3 mb-3 rounded shadow">
            <h3>{group.destination}</h3>
            {group.joinRequests.map(req => (
              req.status === 'pending' && (
                <div key={req._id} className="p-2 border rounded my-1">
                  <p>User: {req.user.name}</p>
                  <p>Message: {req.message || 'No message'}</p>
                  <button onClick={() => handleRequest(group._id, req._id, 'approved')} className="bg-green-500 text-white px-2 py-1 rounded mr-2">Approve</button>
                  <button onClick={() => handleRequest(group._id, req._id, 'rejected')} className="bg-red-500 text-white px-2 py-1 rounded">Reject</button>
                </div>
              )
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default GroupRequests;
