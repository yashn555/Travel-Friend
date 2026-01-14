import React, { useEffect, useState } from 'react';
import { getMyGroups } from '../../services/groupService';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const MyGroupsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await getMyGroups();
      // Filter groups where user is a member (including as creator)
      const userGroups = (data || []).filter(group => 
        group.createdBy?._id === user?._id || 
        group.currentMembers?.some(member => member.user?._id === user?._id)
      );
      setGroups(userGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading your groups...</p>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Groups / Trips</h2>
        <Link 
          to="/create-trip" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create New Trip
        </Link>
      </div>
      
      {groups.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg mb-4">You haven't joined or created any groups yet</p>
          <div className="space-x-4">
            <Link 
              to="/create-trip" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded inline-block"
            >
              Create a Group
            </Link>
            <Link 
              to="/groups" 
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded inline-block"
            >
              Browse Groups
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => {
            const isCreator = group.createdBy?._id === user?._id;
            const memberCount = group.currentMembers?.length || 0;
            
            return (
              <div key={group._id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-5">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{group.destination}</h3>
                  {isCreator && (
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                      Creator
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">{group.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-500 text-sm">
                    <span className="font-medium mr-2">Dates:</span>
                    <span>
                      {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <span className="font-medium mr-2">Members:</span>
                    <span>{memberCount}/{group.maxMembers || 10}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <span className="font-medium mr-2">Status:</span>
                    <span className={`capitalize ${group.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                      {group.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  <Link 
                    to={`/groups/${group._id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    View Details
                  </Link>
                  
                  <Link 
                    to={`/groups/${group._id}/chat`}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Go to Chat
                  </Link>
                  
                  {isCreator && (
                    <Link 
                      to={`/groups/${group._id}/requests`}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Manage Requests
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyGroupsPage;