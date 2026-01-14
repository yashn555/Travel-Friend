// src/pages/DashboardPage.jsx
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
  }); // Initialize default empty arrays

  useEffect(() => {
    if (!token) navigate('/login'); // redirect if not logged in
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardData();
      // Ensure groups and myGroups exist
      setDashboardData({
        groups: data.groups || [],
        myGroups: data.myGroups || [],
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (groupId) => {
    try {
      await requestToJoinGroup(groupId);
      toast.success('Join request sent!');
      fetchData();
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
        {(dashboardData.groups || []).length === 0 ? (
          <p className="text-gray-500">No active groups available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(dashboardData.groups || []).map((g) => (
              <div
                key={g.id}
                className="bg-white p-5 rounded-lg shadow hover:shadow-lg transition duration-300"
              >
                <h3 className="text-xl font-bold text-gray-800">{g.destination}</h3>
                <p className="text-gray-600 mt-1">{g.description?.slice(0, 80)}...</p>
                <p className="text-gray-500 mt-2 text-sm">
                  Dates: {new Date(g.startDate).toLocaleDateString()} - {new Date(g.endDate).toLocaleDateString()}
                </p>
                <p className="text-gray-500 mt-1 text-sm">
                  Budget: {g.budget?.min} - {g.budget?.max} {g.budget?.currency}
                </p>
                <p className="text-gray-500 mt-1 text-sm">Created by: {g.createdBy?.name || 'Unknown'}</p>
                <p className="text-gray-500 mt-1 text-sm">
                  Members: {g.currentMembers?.length}/{g.maxMembers} {g.isFull ? '(Full)' : ''}
                </p>

                {/* Action Buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {g.currentMembers?.some((m) => m.user?.id === user?.id) ? (
                    <Button onClick={() => navigate(`/groups/${g.id}`)} className="bg-gray-400 hover:bg-gray-500">
                      View Group
                    </Button>
                  ) : (
                    <Button onClick={() => handleJoin(g.id)} className="bg-blue-500 hover:bg-blue-600">
                      Join Group
                    </Button>
                  )}
                  <Button onClick={() => navigate(`/groups/${g.id}`)} className="bg-green-500 hover:bg-green-600">
                    Chat / Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Groups Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">My Groups</h2>
        {(dashboardData.myGroups || []).length === 0 ? (
          <p className="text-gray-500">You have not joined or created any groups yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(dashboardData.myGroups || []).map((g) => (
              <div
                key={g.id}
                className="bg-white p-5 rounded-lg shadow hover:shadow-lg transition duration-300"
              >
                <h3 className="text-xl font-bold text-gray-800">{g.destination}</h3>
                <p className="text-gray-500 mt-1 text-sm">
                  Dates: {new Date(g.startDate).toLocaleDateString()} - {new Date(g.endDate).toLocaleDateString()}
                </p>
                <Button
                  onClick={() => navigate(`/groups/${g.id}`)}
                  className="bg-purple-500 hover:bg-purple-600 mt-2"
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
};

export default DashboardPage;
