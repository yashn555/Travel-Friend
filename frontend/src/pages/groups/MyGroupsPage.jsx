import React, { useEffect, useState, useMemo } from 'react';
import { 
  getMyGroups, 
  deleteGroup, 
  updateGroup,
  getGroupById,
  getPendingRequests,
  handleJoinRequest
} from '../../services/groupService';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const MyGroupsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [membersData, setMembersData] = useState({});
  const [requestsData, setRequestsData] = useState({});
  const [loadingMembers, setLoadingMembers] = useState({});
  const [loadingRequests, setLoadingRequests] = useState({});
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [dateFilter, setDateFilter] = useState('all'); // all, upcoming, past
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name, members
  const [memberFilter, setMemberFilter] = useState('all'); // all, full, available

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await getMyGroups();
      
      let allGroups = [];
      if (Array.isArray(data)) {
        allGroups = data;
      } else if (data && Array.isArray(data.groups)) {
        allGroups = data.groups;
      } else if (data && Array.isArray(data.data)) {
        allGroups = data.data;
      }
      
      const userId = user?.id || user?._id;
      const createdGroups = allGroups.filter(group => {
        const creatorId = group.createdBy?._id || group.createdBy;
        return String(creatorId) === String(userId);
      });
      
      setGroups(createdGroups);
      
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load your groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Enhanced join requests fetching with proper API endpoint
  const fetchJoinRequests = async (groupId) => {
    try {
      setLoadingRequests(prev => ({ ...prev, [groupId]: true }));
      
      // Try multiple approaches to fetch requests
      let requests = [];
      
      // Approach 1: Try dedicated requests endpoint
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/groups/${groupId}/requests`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            requests = data.data.filter(req => req.status === 'pending');
            console.log(`✅ Fetched ${requests.length} pending requests from API for group ${groupId}`);
          }
        }
      } catch (apiError) {
        console.log('API endpoint failed, trying service...');
      }
      
      // Approach 2: Use service function
      if (requests.length === 0) {
        try {
          const response = await getPendingRequests(groupId);
          
          if (Array.isArray(response)) {
            requests = response.filter(req => req.status === 'pending');
          } else if (response && Array.isArray(response.requests)) {
            requests = response.requests.filter(req => req.status === 'pending');
          } else if (response && Array.isArray(response.data)) {
            requests = response.data.filter(req => req.status === 'pending');
          }
        } catch (serviceError) {
          console.error('Service error:', serviceError);
        }
      }
      
      // Approach 3: Check if requests are in group data
      if (requests.length === 0 && groups.length > 0) {
        const group = groups.find(g => g._id === groupId);
        if (group && Array.isArray(group.joinRequests)) {
          requests = group.joinRequests.filter(req => req.status === 'pending');
        }
      }
      
      console.log(`📊 Final requests for group ${groupId}:`, requests);
      setRequestsData(prev => ({ ...prev, [groupId]: requests }));
      
    } catch (error) {
      console.error('Error fetching join requests:', error);
      toast.error('Failed to load join requests');
      setRequestsData(prev => ({ ...prev, [groupId]: [] }));
    } finally {
      setLoadingRequests(prev => ({ ...prev, [groupId]: false }));
    }
  };

  const fetchGroupMembers = async (groupId) => {
    try {
      setLoadingMembers(prev => ({ ...prev, [groupId]: true }));
      const response = await getGroupById(groupId);
      
      // Extract members from group response
      let members = [];
      if (response.currentMembers) {
        members = response.currentMembers;
      } else if (response.group?.currentMembers) {
        members = response.group.currentMembers;
      } else if (response.data?.currentMembers) {
        members = response.data.currentMembers;
      }
      
      setMembersData(prev => ({ ...prev, [groupId]: members }));
    } catch (error) {
      console.error('Error fetching group details:', error);
      toast.error('Failed to load group members');
      setMembersData(prev => ({ ...prev, [groupId]: [] }));
    } finally {
      setLoadingMembers(prev => ({ ...prev, [groupId]: false }));
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  // Filter and sort groups
  const filteredAndSortedGroups = useMemo(() => {
    let filtered = [...groups];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(group => 
        group.destination?.toLowerCase().includes(term) ||
        group.description?.toLowerCase().includes(term) ||
        group.interests?.some(interest => interest.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(group => group.isActive === true);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(group => group.isActive === false);
    }

    // Date filter
    const now = new Date();
    if (dateFilter === 'upcoming') {
      filtered = filtered.filter(group => new Date(group.startDate) > now);
    } else if (dateFilter === 'past') {
      filtered = filtered.filter(group => new Date(group.endDate) < now);
    }

    // Member capacity filter
    if (memberFilter === 'full') {
      filtered = filtered.filter(group => 
        (group.currentMembers?.length || 0) >= (group.maxMembers || 10)
      );
    } else if (memberFilter === 'available') {
      filtered = filtered.filter(group => 
        (group.currentMembers?.length || 0) < (group.maxMembers || 10)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name':
          return (a.destination || '').localeCompare(b.destination || '');
        case 'members':
          return (b.currentMembers?.length || 0) - (a.currentMembers?.length || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [groups, searchTerm, statusFilter, dateFilter, sortBy, memberFilter]);

  // Check if a trip is completed
  const isTripCompleted = (group) => {
    const endDate = new Date(group.endDate);
    const now = new Date();
    return endDate < now;
  };

  // Recreate a completed group
  const handleRecreateGroup = async (originalGroup) => {
    if (!window.confirm(`Recreate trip to "${originalGroup.destination}"? This will create a new trip with similar details.`)) {
      return;
    }

    try {
      // Navigate to create trip page with pre-filled data
      navigate('/create-trip', {
        state: {
          prefillData: {
            destination: originalGroup.destination,
            description: `Recreated: ${originalGroup.description}`,
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            budgetMin: originalGroup.budget?.min || 1000,
            budgetMax: originalGroup.budget?.max || 5000,
            maxMembers: originalGroup.maxMembers || 10,
            interests: originalGroup.interests || []
          }
        }
      });
    } catch (error) {
      console.error('Error recreating group:', error);
      toast.error('Failed to recreate group');
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Are you sure you want to delete "${groupName}"?\n\nThis action will:\n• Remove the group permanently\n• Delete all group chats\n• Remove all members\n• Delete all join requests\n\nThis cannot be undone!`)) {
      return;
    }

    try {
      await deleteGroup(groupId);
      toast.success(`Group "${groupName}" deleted successfully!`);
      setGroups(prev => prev.filter(g => g._id !== groupId));
      if (expandedGroup === groupId) {
        setExpandedGroup(null);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(error.response?.data?.message || 'Failed to delete group');
    }
  };

  const handleToggleGroupStatus = async (groupId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await updateGroup(groupId, { isActive: newStatus });
      toast.success(`Group ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      
      setGroups(prev => prev.map(group => 
        group._id === groupId ? { ...group, isActive: newStatus } : group
      ));
    } catch (error) {
      console.error('Error updating group status:', error);
      toast.error(error.response?.data?.message || 'Failed to update group status');
    }
  };

  const handleRemoveMember = async (groupId, memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove "${memberName}" from the group?`)) {
      return;
    }

    try {
      const group = groups.find(g => g._id === groupId);
      if (!group) return;
      
      const updatedMembers = (group.currentMembers || []).filter(member => 
        String(member._id || member.id || member.user?._id || member.user?.id) !== String(memberId)
      );
      
      await updateGroup(groupId, { currentMembers: updatedMembers });
      toast.success(`Member "${memberName}" removed successfully!`);
      
      setMembersData(prev => ({
        ...prev,
        [groupId]: prev[groupId]?.filter(member => 
          String(member._id || member.id || member.user?._id || member.user?.id) !== String(memberId)
        ) || []
      }));
      
      setGroups(prev => prev.map(g => 
        g._id === groupId 
          ? { ...g, currentMembers: updatedMembers }
          : g
      ));
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleApproveRequest = async (groupId, requestId, userName) => {
    try {
      // Use handleJoinRequest to approve
      await handleJoinRequest(groupId, requestId, 'approved');
      toast.success(`Join request from "${userName}" approved!`);
      
      // Update requests data
      setRequestsData(prev => ({
        ...prev,
        [groupId]: prev[groupId]?.filter(req => req._id !== requestId) || []
      }));
      
      // Refresh members data
      await fetchGroupMembers(groupId);
      
      // Update groups list
      setGroups(prev => prev.map(group => 
        group._id === groupId 
          ? { 
              ...group, 
              joinRequests: group.joinRequests?.filter(req => req._id !== requestId) || [],
              currentMembers: [...(group.currentMembers || [])]
            } 
          : group
      ));
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (groupId, requestId, userName) => {
    if (!window.confirm(`Reject join request from "${userName}"?`)) {
      return;
    }

    try {
      await handleJoinRequest(groupId, requestId, 'rejected');
      toast.success(`Join request from "${userName}" rejected!`);
      
      setRequestsData(prev => ({
        ...prev,
        [groupId]: prev[groupId]?.filter(req => req._id !== requestId) || []
      }));
      
      setGroups(prev => prev.map(group => 
        group._id === groupId 
          ? { 
              ...group, 
              joinRequests: group.joinRequests?.filter(req => req._id !== requestId) || []
            } 
          : group
      ));
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const toggleGroupExpansion = async (groupId) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(groupId);
      // Fetch detailed data when expanding
      await Promise.all([
        fetchGroupMembers(groupId),
        fetchJoinRequests(groupId)  // Fixed: This now uses the enhanced function
      ]);
    }
  };

  // Handle invite friends
  const handleInviteFriends = (groupId) => {
    console.log('🔄 Redirecting to:', `/groups/${groupId}/invite-friends`);
    navigate(`/groups/${groupId}/invite-friends`);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setSortBy('newest');
    setMemberFilter('all');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-3 text-gray-600">Loading your groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Created Groups</h1>
          <p className="text-gray-600 mt-2">Manage all groups you've created</p>
        </div>
        <div className="flex gap-4">
          <Link 
            to="/groups" 
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg font-medium transition duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Browse All Groups
          </Link>
          <Link 
            to="/create-trip" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Trip
          </Link>
        </div>
      </div>
      
      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Filters & Sorting</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trip Date</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Completed</option>
            </select>
          </div>
          
          {/* Member Capacity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Groups</option>
              <option value="available">Has Available Slots</option>
              <option value="full">Full</option>
            </select>
          </div>
          
          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="members">Most Members</option>
            </select>
          </div>
        </div>
        
        {/* Results Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredAndSortedGroups.length}</span> of <span className="font-semibold">{groups.length}</span> groups
            {searchTerm && <span> matching "<span className="font-semibold">{searchTerm}</span>"</span>}
          </p>
        </div>
      </div>
      
      {filteredAndSortedGroups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 mb-6">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              {groups.length === 0 ? 'No Groups Created' : 'No Groups Match Filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {groups.length === 0 
                ? "You haven't created any groups yet. Start by creating your first trip!"
                : "Try adjusting your filters to find what you're looking for."
              }
            </p>
            <div className="flex gap-4 justify-center">
              {groups.length === 0 ? (
                <>
                  <Link 
                    to="/create-trip" 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition duration-200"
                  >
                    Create Your First Group
                  </Link>
                  <Link 
                    to="/groups" 
                    className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium transition duration-200"
                  >
                    Browse Groups
                  </Link>
                </>
              ) : (
                <button
                  onClick={clearFilters}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition duration-200"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-700">
                You have created <span className="font-bold">{filteredAndSortedGroups.length}</span> group{filteredAndSortedGroups.length !== 1 ? 's' : ''}. 
                Click on any group to manage members, requests, and settings.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {filteredAndSortedGroups.map(group => {
              const memberCount = group.currentMembers?.length || 0;
              const maxMembers = group.maxMembers || 10;
              const pendingRequests = group.joinRequests?.length || 0;
              const isExpanded = expandedGroup === group._id;
              const members = membersData[group._id] || [];
              const requests = requestsData[group._id] || [];
              const isCompleted = isTripCompleted(group);
              const isFull = memberCount >= maxMembers;
              
              return (
                <div key={group._id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => toggleGroupExpansion(group._id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">{group.destination}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {group.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                            Creator
                          </span>
                          {isCompleted && (
                            <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                              Completed
                            </span>
                          )}
                          {isFull && (
                            <span className="bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
                              Full
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Created on {new Date(group.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroupExpansion(group._id);
                        }}
                        className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition duration-200"
                      >
                        <svg 
                          className={`w-6 h-6 text-gray-600 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.281.023-.563.045-.844.064A23.91 23.91 0 0112 14.25a23.91 23.91 0 01-7.656-1.186A48.275 48.275 0 012.25 12c0-.725.131-1.418.344-2.061.281-.019.563-.041.844-.064m13.5 0a48.67 48.67 0 00-7.5 0" />
                          </svg>
                          <span className="font-medium text-blue-800">Members</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 mt-2">
                          {memberCount}/{maxMembers}
                        </p>
                      </div>
                      
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium text-yellow-800">Pending Requests</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-600 mt-2">
                          {requests.length || pendingRequests}
                        </p>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium text-green-800">Trip Dates</span>
                        </div>
                        <p className="text-sm font-medium text-green-700 mt-2">
                          {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}
                          {isCompleted && <span className="block text-xs text-gray-500">(Completed)</span>}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{group.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {group.budget?.min && (
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-3 py-1 rounded-full">
                          Budget: {group.budget.min} - {group.budget.max} {group.budget.currency}
                        </span>
                      )}
                      {group.interests?.map((interest, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Expanded Management Panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Members Management */}
                        <div className="bg-white rounded-lg border border-gray-200 p-5">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-gray-800">Group Members</h4>
                            <span className="text-sm text-gray-500">
                              {loadingMembers[group._id] ? 'Loading...' : `${members.length} members`}
                            </span>
                          </div>
                          
                          {loadingMembers[group._id] ? (
                            <div className="text-center py-4">
                              <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                              <p className="mt-2 text-sm text-gray-500">Loading members...</p>
                            </div>
                          ) : members.length > 0 ? (
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                              {members.map((member, index) => {
                                const memberUser = member.user || member;
                                const memberId = memberUser._id || memberUser.id || member._id || member.id;
                                const isCreator = String(memberId) === String(user?.id || user?._id);
                                
                                return (
                                  <div key={memberId || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="font-semibold text-blue-600">
                                          {memberUser.name?.[0]?.toUpperCase() || memberUser.email?.[0]?.toUpperCase() || 'U'}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-800">
                                          {memberUser.name || memberUser.email || 'Unknown User'}
                                          {isCreator && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Creator</span>}
                                        </p>
                                        <p className="text-sm text-gray-500">{memberUser.email || ''}</p>
                                      </div>
                                    </div>
                                    {!isCreator && (
                                      <button
                                        onClick={() => handleRemoveMember(
                                          group._id, 
                                          memberId,
                                          memberUser.name || memberUser.email || 'this member'
                                        )}
                                        className="text-red-600 hover:text-red-800 p-2 transition duration-200"
                                        title="Remove member"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.281.023-.563.045-.844.064A23.91 23.91 0 0112 14.25a23.91 23.91 0 01-7.656-1.186A48.275 48.275 0 012.25 12c0-.725.131-1.418.344-2.061.281-.019.563-.041.844-.064m13.5 0a48.67 48.67 0 00-7.5 0" />
                              </svg>
                              <p>No members yet</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Join Requests Management */}
                        <div className="bg-white rounded-lg border border-gray-200 p-5">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-gray-800">Join Requests</h4>
                            <span className="text-sm text-gray-500">
                              {loadingRequests[group._id] ? 'Loading...' : `${requests.length} pending`}
                            </span>
                          </div>
                          
                          {loadingRequests[group._id] ? (
                            <div className="text-center py-4">
                              <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                              <p className="mt-2 text-sm text-gray-500">Loading requests...</p>
                            </div>
                          ) : requests.length > 0 ? (
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                              {requests.map((request, index) => {
                                const requester = request.user || request;
                                const requestId = request._id || index;
                                
                                return (
                                  <div key={requestId} className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                          <span className="font-semibold text-yellow-600 text-sm">
                                            {requester.name?.[0]?.toUpperCase() || requester.email?.[0]?.toUpperCase() || 'U'}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-800">{requester.name || requester.email || 'Unknown User'}</p>
                                          <p className="text-xs text-gray-500">
                                            {request.createdAt || request.requestedAt 
                                              ? `Requested on ${new Date(request.createdAt || request.requestedAt).toLocaleDateString()}`
                                              : 'Pending request'}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleApproveRequest(
                                            group._id, 
                                            requestId,
                                            requester.name || requester.email || 'User'
                                          )}
                                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition duration-200"
                                          title="Approve"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => handleRejectRequest(
                                            group._id, 
                                            requestId,
                                            requester.name || requester.email || 'User'
                                          )}
                                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition duration-200"
                                          title="Reject"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    </div>
                                    {request.message && (
                                      <p className="text-sm text-gray-600 bg-white p-2 rounded mt-2">
                                        "{request.message}"
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p>No pending requests</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex flex-wrap gap-3">
                          <Link
                            to={`/groups/${group._id}`}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium transition duration-200 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            View Details
                          </Link>
                          
                          <Link
                            to={`/groups/${group._id}/chat`}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium transition duration-200 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Group Chat
                          </Link>
                          
                          <button
                            onClick={() => handleInviteFriends(group._id)}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium transition duration-200 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Invite Friends
                          </button>
                          
                          <button
                            onClick={() => navigate(`/edit-group/${group._id}`)}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg font-medium transition duration-200 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Group
                          </button>
                          
                          <button
                            onClick={() => handleToggleGroupStatus(group._id, group.isActive)}
                            className={`px-4 py-2.5 rounded-lg font-medium transition duration-200 flex items-center gap-2 ${
                              group.isActive 
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {group.isActive ? 'Deactivate Group' : 'Activate Group'}
                          </button>
                          
                          {isCompleted && (
                            <button
                              onClick={() => handleRecreateGroup(group)}
                              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-lg font-medium transition duration-200 flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Recreate Trip
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group._id, group.destination);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium transition duration-200 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Group
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Actions (when not expanded) */}
                  {!isExpanded && (
                    <div className="border-t border-gray-200 p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleGroupExpansion(group._id)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition duration-200 text-sm flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                          Manage
                        </button>
                        <Link
                          to={`/groups/${group._id}`}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-medium transition duration-200 text-sm"
                        >
                          View
                        </Link>
                        <Link
                          to={`/groups/${group._id}/chat`}
                          className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-lg font-medium transition duration-200 text-sm"
                        >
                          Chat
                        </Link>
                        <button
                          onClick={() => handleInviteFriends(group._id)}
                          className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-4 py-2 rounded-lg font-medium transition duration-200 text-sm"
                        >
                          Invite
                        </button>
                        <button
                          onClick={() => navigate(`/edit-group/${group._id}`)}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-4 py-2 rounded-lg font-medium transition duration-200 text-sm"
                        >
                          Edit
                        </button>
                        {isCompleted && (
                          <button
                            onClick={() => handleRecreateGroup(group)}
                            className="bg-teal-100 hover:bg-teal-200 text-teal-800 px-4 py-2 rounded-lg font-medium transition duration-200 text-sm"
                          >
                            Recreate
                          </button>
                        )}
                        {(requests.length > 0 || pendingRequests > 0) && (
                          <button
                            onClick={() => toggleGroupExpansion(group._id)}
                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-lg font-medium transition duration-200 text-sm flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {requests.length || pendingRequests} Requests
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MyGroupsPage;