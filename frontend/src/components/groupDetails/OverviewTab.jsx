// frontend/src/components/groupDetails/OverviewTab.jsx
import React from 'react';
import { FaCalendarAlt, FaMoneyBillWave, FaUsers, FaUser, FaLock, FaMapMarkerAlt } from 'react-icons/fa';

const OverviewTab = ({ group }) => {
  return (
    <div className="space-y-8">
      {/* Group Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <FaCalendarAlt className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-800">Trip Dates</h3>
          </div>
          <p className="text-gray-800 text-lg font-medium">
            {new Date(group.startDate).toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })} - {new Date(group.endDate).toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            Duration: {Math.ceil((new Date(group.endDate) - new Date(group.startDate)) / (1000 * 60 * 60 * 24))} days
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <FaMoneyBillWave className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-800">Budget Range</h3>
          </div>
          <p className="text-gray-800 text-lg font-medium">
            {group.budget?.min?.toLocaleString() || '0'} - {group.budget?.max?.toLocaleString() || '0'} {group.budget?.currency || 'INR'}
          </p>
          <p className="text-gray-600 text-sm mt-1">Per person estimate</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
              <FaUsers className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-800">Members</h3>
          </div>
          <p className="text-gray-800 text-lg font-medium">
            {group.currentMembersCount || 0}/{group.maxMembers || 10}
          </p>
          <p className={`text-sm mt-1 ${group.isFull ? 'text-red-600' : 'text-gray-600'}`}>
            {group.isFull ? 'Group is full' : 'Spots available'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl border border-yellow-200">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
              <FaUser className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-800">Created By</h3>
          </div>
          <p className="text-gray-800 text-lg font-medium">{group.createdBy?.name || 'Unknown'}</p>
          <p className="text-gray-600 text-sm mt-1">Group Admin</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border border-red-200">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-3">
              <FaLock className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-800">Group Type</h3>
          </div>
          <p className="text-gray-800 text-lg font-medium capitalize">
            {group.groupType || 'anonymous'}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            {group.groupType === 'open' ? 'Anyone can join' : 
             group.groupType === 'verified' ? 'Verified users only' : 'Invite only'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-200">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
              <FaMapMarkerAlt className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-800">Destination</h3>
          </div>
          <p className="text-gray-800 text-lg font-medium">{group.destination}</p>
          <p className="text-gray-600 text-sm mt-1">Primary location</p>
        </div>
      </div>

      {/* Tags */}
      {group.tags && group.tags.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold text-gray-700 mb-3 text-lg">🏷️ Trip Tags</h3>
          <div className="flex flex-wrap gap-2">
            {group.tags.map((tag, index) => (
              <span 
                key={index} 
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Current Members */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-4 text-lg">👥 Current Members ({group.currentMembersCount || 0})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {group.currentMembers?.map((member, index) => {
            const userId = member.user?._id || member.user?.id;
            return (
              <div 
                key={index} 
                className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
                onClick={() => {
                  if (userId) {
                    window.location.href = `http://localhost:3000/user/${userId}`;
                  }
                }}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-lg">
                      {member.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{member.user?.name || 'Member'}</p>
                    <p className={`text-sm ${member.role === 'creator' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                      {member.role === 'creator' ? 'Group Admin' : 'Member'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trip Preferences */}
      {group.travelPreferences && (
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-4 text-lg">🎯 Trip Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {group.travelPreferences.travelStyle && group.travelPreferences.travelStyle.length > 0 && (
              <div>
                <h4 className="text-gray-600 mb-2">Travel Style</h4>
                <div className="flex flex-wrap gap-2">
                  {group.travelPreferences.travelStyle.map((style, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {group.travelPreferences.interests && group.travelPreferences.interests.length > 0 && (
              <div>
                <h4 className="text-gray-600 mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {group.travelPreferences.interests.slice(0, 5).map((interest, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                  {group.travelPreferences.interests.length > 5 && (
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      +{group.travelPreferences.interests.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;