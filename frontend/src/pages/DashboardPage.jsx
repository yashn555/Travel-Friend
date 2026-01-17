import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getDashboardData, requestToJoinGroup } from '../services/api';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    groups: [],
    myGroups: [],
  });

  useEffect(() => {
    if (!token) navigate('/login');
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardData();
      console.log('Dashboard Data:', data); // Debug log
      
      // Ensure groups and myGroups exist
      setDashboardData({
        groups: data.groups || [],
        myGroups: data.userTrips || [],
      });
    } catch (error) {
      console.error('Dashboard Error:', error);
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (groupId, destination) => {
  // Validate groupId
  if (!groupId || groupId === 'undefined') {
    toast.error('Invalid group ID');
    return;
  }

  try {
    await requestToJoinGroup(groupId);
    toast.success(`Join request sent for ${destination}!`);
    fetchData(); // Refresh dashboard data
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to join group');
  }
};

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name}!</h1>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Button onClick={() => navigate('/create-trip')} className="bg-blue-500 hover:bg-blue-600">
          Create Trip
        </Button>
        <Button onClick={() => navigate('/my-groups')} className="bg-green-500 hover:bg-green-600">
          My Groups
        </Button>
        <Button onClick={() => navigate('/group-requests')} className="bg-yellow-500 hover:bg-yellow-600">
          Group Requests
        </Button>
        <Button onClick={() => navigate('/groups')} className="bg-purple-500 hover:bg-purple-600">
          Browse Groups
        </Button>
      </div>

      {/* Active Groups */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Active Groups</h2>
        {dashboardData.groups.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No active groups available.</p>
            <Button 
              onClick={() => navigate('/create-trip')} 
              className="bg-blue-500 hover:bg-blue-600"
            >
              Create Your First Group
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.groups.map((g) => {
              // Check if current user is a member
              const isMember = g.currentMembers?.some(
                member => member.user && member.user._id === user?._id
              );
              
              // Check if user is creator
              const isCreator = g.createdBy?.id === user?._id;
              
              // Check if has pending request
              const hasPendingRequest = false; // You might need to add this logic
              
              return (
                <div
                  key={g.id}
                  className="bg-white p-5 rounded-lg shadow hover:shadow-lg transition duration-300 border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800">{g.destination}</h3>
                    {isCreator && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                        Your Group
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">{g.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-500 text-sm">
                      <span className="font-medium">Dates:</span> {new Date(g.startDate).toLocaleDateString()} - {new Date(g.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-500 text-sm">
                      <span className="font-medium">Budget:</span> {g.budget?.min || 0} - {g.budget?.max || 0} {g.budget?.currency || 'INR'}
                    </p>
                    <p className="text-gray-500 text-sm">
                      <span className="font-medium">Members:</span> {g.currentMembersCount || 0}/{g.maxMembers || 10}
                      {g.isFull && <span className="text-red-500 ml-1">(Full)</span>}
                    </p>
                    <p className="text-gray-500 text-sm">
                      <span className="font-medium">Created by:</span> {g.createdBy?.name || 'Unknown'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {isCreator ? (
                      <>
                        <Button 
                          onClick={() => navigate(`/groups/${g.id}`)} 
                          className="bg-purple-500 hover:bg-purple-600"
                        >
                          Manage Group
                        </Button>
                        <Button 
                          onClick={() => navigate(`/group-requests`)} 
                          className="bg-yellow-500 hover:bg-yellow-600"
                        >
                          View Requests
                        </Button>
                      </>
                    ) : isMember ? (
                      <Button 
                        onClick={() => navigate(`/groups/${g.id}`)} 
                        className="bg-green-500 hover:bg-green-600"
                      >
                        Go to Group
                      </Button>
                    ) : g.isFull ? (
                      <Button 
                        disabled
                        className="bg-gray-400 cursor-not-allowed"
                      >
                        Group Full
                      </Button>
                    ) : (
                      <Button 
  onClick={() => handleJoin(g.id, g.destination)} 
  className="bg-blue-500 hover:bg-blue-600"
>
  Request to Join
</Button>
                    )}
                    
                    <Button 
                      onClick={() => navigate(`/groups/${g.id}`)} 
                      className="bg-gray-500 hover:bg-gray-600"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Groups Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">My Upcoming Trips</h2>
        {dashboardData.myGroups.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">You have not joined or created any groups yet.</p>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => navigate('/create-trip')} 
                className="bg-blue-500 hover:bg-blue-600"
              >
                Create a Group
              </Button>
              <Button 
                onClick={() => navigate('/groups')} 
                className="bg-green-500 hover:bg-green-600"
              >
                Browse Groups
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.myGroups.map((g) => (
              <div
                key={g.id}
                className="bg-white p-5 rounded-lg shadow hover:shadow-lg transition duration-300 border border-gray-100"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-2">{g.destination}</h3>
                <p className="text-gray-500 mb-3 text-sm">
                  Dates: {new Date(g.startDate).toLocaleDateString()} - {new Date(g.endDate).toLocaleDateString()}
                </p>
                <p className="text-gray-500 mb-3 text-sm">
                  Status: <span className={`font-medium ${g.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {g.status}
                  </span>
                </p>
                <Button
                  onClick={() => navigate(`/groups/${g.id}`)}
                  className="bg-purple-500 hover:bg-purple-600 w-full"
                >
                  Go to Group
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  <div className="flex flex-wrap gap-4 mb-6">
  {/* Existing buttons... */}
  
  {/* Debug Button - Remove in production */}
  <Button 
    onClick={() => {
      console.log('Dashboard Data:', dashboardData);
      console.log('User:', user);
      console.log('Token:', token);
    }}
    className="bg-gray-500 hover:bg-gray-600"
  >
    Debug
  </Button>
</div>
};

export default DashboardPage;