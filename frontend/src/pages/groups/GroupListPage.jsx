import React, { useEffect, useState } from 'react';
import { getUserGroups, leaveUserGroup, cancelJoinRequest } from '../../services/userGroupService';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const MyGroupsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('startDate');
  const [leavingGroupId, setLeavingGroupId] = useState(null);
  const [cancelingRequestId, setCancelingRequestId] = useState(null);

  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      const res = await getUserGroups();
      // Handle response format
      const groupsData = res.data || res || [];
      console.log('Fetched groups:', groupsData);
      console.log('User ID:', user?._id);
      
      setGroups(groupsData);
      applyFiltersAndSorting(groupsData, activeFilter, sortBy);
    } catch (err) {
      console.error('Error loading user groups:', err);
      const errorMsg = err.message || err.response?.data?.message || 'Failed to load your groups';
      toast.error(errorMsg);
      setGroups([]);
      setFilteredGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  // Apply filters and sorting whenever groups, filter, or sort changes
  useEffect(() => {
    if (groups.length > 0) {
      applyFiltersAndSorting(groups, activeFilter, sortBy);
    }
  }, [groups, activeFilter, sortBy]);

  const applyFiltersAndSorting = (groupsList, filter, sortType) => {
    let result = [...groupsList];

    // Apply filter
    if (filter !== 'all') {
      result = result.filter(group => {
        const membership = getMembershipStatus(group);
        return membership.status === filter;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortType) {
        case 'startDate':
          // Sort by start date (earliest first)
          if (a.startDate && b.startDate) {
            return new Date(a.startDate) - new Date(b.startDate);
          }
          // If no start date, put at the end
          if (!a.startDate && b.startDate) return 1;
          if (a.startDate && !b.startDate) return -1;
          break;

        case 'endDate':
          // Sort by end date (earliest first)
          if (a.endDate && b.endDate) {
            return new Date(a.endDate) - new Date(b.endDate);
          }
          if (!a.endDate && b.endDate) return 1;
          if (a.endDate && !b.endDate) return -1;
          break;

        case 'createdAt':
          // Sort by creation date (newest first)
          return new Date(b.createdAt) - new Date(a.createdAt);

        case 'membership':
          // Sort by membership type: creator > member > pending
          const membershipOrder = { creator: 1, member: 2, pending: 3, none: 4 };
          const membershipA = getMembershipStatus(a);
          const membershipB = getMembershipStatus(b);
          return membershipOrder[membershipA.status] - membershipOrder[membershipB.status];

        case 'name':
          // Sort by destination name
          return (a.destination || '').localeCompare(b.destination || '');

        default:
          return 0;
      }
      return 0;
    });

    setFilteredGroups(result);
  };

  const getMembershipStatus = (group) => {
    if (!user || !group) return { status: 'none', label: 'None', color: 'gray', icon: '❓' };
    
    // Use backend-calculated membershipStatus if available
    if (group.membershipStatus) {
      const statusMap = {
        creator: { status: 'creator', label: 'Creator', color: 'purple', icon: '👑' },
        member: { status: 'member', label: 'Member', color: 'green', icon: '✅' },
        pending: { status: 'pending', label: 'Pending', color: 'yellow', icon: '⏳' },
        none: { status: 'none', label: 'None', color: 'gray', icon: '❓' }
      };
      return statusMap[group.membershipStatus] || statusMap.none;
    }

    // Fallback to frontend calculation
    const userId = user._id;
    
    if (group.createdBy?._id === userId || group.createdBy === userId) {
      return { 
        status: 'creator', 
        label: 'Creator', 
        color: 'purple',
        icon: '👑'
      };
    }
    
    // Check if user is in currentMembers
    const isMember = group.currentMembers?.some(member => {
      const memberId = member.user?._id || member.user;
      return memberId === userId;
    });
    
    if (isMember) {
      return { 
        status: 'member', 
        label: 'Member', 
        color: 'green',
        icon: '✅'
      };
    }
    
    // Check for pending join request
    const pendingRequest = group.joinRequests?.find(request => {
      const requestUserId = request.user?._id || request.user;
      return requestUserId === userId && request.status === 'pending';
    });
    
    if (pendingRequest) {
      return { 
        status: 'pending', 
        label: 'Pending', 
        color: 'yellow',
        icon: '⏳'
      };
    }
    
    return { 
      status: 'none', 
      label: 'None', 
      color: 'gray',
      icon: '❓'
    };
  };

  const getTripStatus = (group) => {
    if (group.tripStatus) {
      const statusMap = {
        ongoing: { text: 'Ongoing Trip', color: 'green', badge: '🟢' },
        upcoming: { 
          text: group.daysUntilTrip === 1 ? 'Tomorrow' : `${group.daysUntilTrip || '?'} days to go`, 
          color: 'blue', 
          badge: '🔵' 
        },
        completed: { text: 'Trip Completed', color: 'gray', badge: '⚫' }
      };
      return statusMap[group.tripStatus] || { text: 'Date not set', color: 'gray', badge: '❓' };
    }

    // Fallback calculation
    if (!group.startDate) return { text: 'Date not set', color: 'gray', badge: '❓' };
    
    const today = new Date();
    const startDate = new Date(group.startDate);
    const endDate = new Date(group.endDate);
    
    if (endDate < today) {
      return { text: 'Trip Completed', color: 'gray', badge: '⚫' };
    }
    
    if (startDate <= today && endDate >= today) {
      return { text: 'Ongoing Trip', color: 'green', badge: '🟢' };
    }
    
    const diffDays = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { text: 'Trip starts today!', color: 'green', badge: '🟢' };
    if (diffDays === 1) return { text: 'Tomorrow', color: 'blue', badge: '🔵' };
    return { text: `${diffDays} days to go`, color: 'blue', badge: '🔵' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to leave this group? This action cannot be undone.')) {
      return;
    }

    try {
      setLeavingGroupId(groupId);
      const res = await leaveUserGroup(groupId);
      toast.success(res.message || 'Successfully left the group');
      fetchUserGroups(); // Refresh the list
    } catch (err) {
      const errorMsg = err.message || err.response?.data?.message || 'Error leaving group';
      toast.error(errorMsg);
    } finally {
      setLeavingGroupId(null);
    }
  };

  const handleCancelRequest = async (groupId) => {
    if (!window.confirm('Are you sure you want to cancel your join request?')) {
      return;
    }

    try {
      setCancelingRequestId(groupId);
      const res = await cancelJoinRequest(groupId);
      toast.success(res.message || 'Join request cancelled');
      fetchUserGroups(); // Refresh the list
    } catch (err) {
      const errorMsg = err.message || err.response?.data?.message || 'Error cancelling request';
      toast.error(errorMsg);
    } finally {
      setCancelingRequestId(null);
    }
  };

  // Calculate stats
  const calculateStats = () => {
    const stats = {
      all: 0,
      creator: 0,
      member: 0,
      pending: 0
    };

    groups.forEach(group => {
      const membership = getMembershipStatus(group);
      stats.all++;
      if (membership.status in stats) {
        stats[membership.status]++;
      }
    });

    return stats;
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
        <span className="text-gray-600 text-lg">Loading your travel groups...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">My Travel Groups</h1>
              <p className="text-gray-600">Manage all the groups you've created or joined</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={fetchUserGroups}
                className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-4 py-2 rounded-lg font-medium flex items-center shadow-sm transition duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button 
                onClick={() => navigate('/groups')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition duration-200"
              >
                Discover More
              </button>
              <button 
                onClick={() => navigate('/create-trip')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition duration-200"
              >
                Create New Group
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { key: 'all', label: 'Total Groups', icon: '📊', color: 'blue', count: stats.all },
              { key: 'creator', label: 'Created', icon: '👑', color: 'purple', count: stats.creator },
              { key: 'member', label: 'Joined', icon: '✅', color: 'green', count: stats.member },
              { key: 'pending', label: 'Pending', icon: '⏳', color: 'yellow', count: stats.pending }
            ].map((stat) => (
              <div key={stat.key} className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition duration-200 cursor-pointer ${activeFilter === stat.key ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setActiveFilter(stat.key)}>
                <div className="flex items-center">
                  <div className={`bg-${stat.color}-100 p-2 rounded-lg mr-3`}>
                    <span className={`text-${stat.color}-600 text-xl`}>{stat.icon}</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{stat.count}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Filter and Sort Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'creator', label: 'Created' },
              { key: 'member', label: 'Joined' },
              { key: 'pending', label: 'Pending' }
            ].map((filter) => (
              <button 
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                  activeFilter === filter.key 
                    ? `bg-${filter.key === 'creator' ? 'purple' : filter.key === 'member' ? 'green' : filter.key === 'pending' ? 'yellow' : 'blue'}-500 text-white` 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {filter.label} ({stats[filter.key] || 0})
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="startDate">Sort by: Trip Date (Earliest First)</option>
              <option value="endDate">Sort by: End Date</option>
              <option value="createdAt">Sort by: Created Date</option>
              <option value="membership">Sort by: Membership Type</option>
              <option value="name">Sort by: Destination Name</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Groups Section */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="text-6xl mb-6">🚀</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              {activeFilter === 'all' ? 'No Groups Yet' : `No ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Groups`}
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {activeFilter === 'all' 
                ? "You haven't joined or created any travel groups yet. Start your journey by exploring groups or creating your own!"
                : `You don't have any ${activeFilter} groups. Try changing the filter or join/create some groups!`
              }
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => navigate('/groups')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Browse All Groups
              </button>
              <button 
                onClick={() => navigate('/create-trip')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Create New Group
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map(group => {
              const membership = getMembershipStatus(group);
              const tripStatus = getTripStatus(group);
              
              return (
                <div key={group._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="p-5">
                    {/* Group Header with Trip Status */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            membership.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                            membership.color === 'green' ? 'bg-green-100 text-green-800' :
                            membership.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            <span className="mr-1">{membership.icon}</span>
                            {membership.label}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tripStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                            tripStatus.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            <span className="mr-1">{tripStatus.badge}</span>
                            {tripStatus.text}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{group.destination || 'Unnamed Group'}</h3>
                      </div>
                    </div>
                    
                    {/* Trip Dates - Highlighted */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center text-sm font-medium text-blue-800 mb-1">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Trip Dates
                      </div>
                      <div className="text-blue-900 font-medium">
                        {formatDate(group.startDate)} → {formatDate(group.endDate)}
                      </div>
                    </div>
                    
                    {/* Group Description */}
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                      {group.description || 'No description provided'}
                    </p>
                    
                    {/* Group Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium">₹{group.budget?.min || 0} - ₹{group.budget?.max || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Members:</span>
                        <span className={`font-medium ${group.isFull ? 'text-red-500' : 'text-green-500'}`}>
                          {group.currentMembersCount || 0}/{group.maxMembers || 10}
                          {group.isFull && ' (Full)'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => navigate(`/groups/${group._id}`)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition duration-200"
                      >
                        View Details
                      </button>
                      
                      {membership.status === 'member' && (
                        <button 
                          onClick={() => navigate(`/groups/${group._id}/chat`)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition duration-200"
                        >
                          Open Chat
                        </button>
                      )}
                      
                      {membership.status === 'member' && (
                        <button 
                          onClick={() => handleLeaveGroup(group._id)}
                          disabled={leavingGroupId === group._id}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition duration-200 disabled:opacity-50"
                        >
                          {leavingGroupId === group._id ? 'Leaving...' : 'Leave'}
                        </button>
                      )}
                      
                      {membership.status === 'pending' && (
                        <button 
                          onClick={() => handleCancelRequest(group._id)}
                          disabled={cancelingRequestId === group._id}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition duration-200 disabled:opacity-50"
                        >
                          {cancelingRequestId === group._id ? 'Cancelling...' : 'Cancel Request'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                          <span className="text-sm font-medium text-purple-800">
                            {group.createdBy?.name?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <div className="text-sm">
                          <div className="text-gray-600">Created by</div>
                          <div className="font-medium text-gray-800">{group.createdBy?.name || 'Unknown'}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Created {formatDate(group.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGroupsPage;