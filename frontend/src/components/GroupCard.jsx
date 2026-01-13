import React from 'react';

const GroupCard = ({ group, onJoinRequest }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {group.destination}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{group.description}</p>
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center text-sm text-gray-700">
              <span className="font-medium mr-2">Travel Dates:</span>
              {formatDate(group.startDate)} - {formatDate(group.endDate)}
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="font-medium mr-2">Budget:</span>
              ${group.budget.min} - ${group.budget.max} {group.budget.currency}
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="font-medium mr-2">Group Size:</span>
              {group.currentMembers?.length || 0} / {group.maxMembers} members
            </div>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`px-2 py-1 text-xs rounded-full ${
              group.groupType === 'anonymous' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {group.groupType === 'anonymous' ? 'Anonymous' : 'Known'} Group
            </span>
            {group.tags?.map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <button
            onClick={() => onJoinRequest(group._id)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Request to Join
          </button>
          {group.createdBy && (
            <p className="text-xs text-gray-500">
              Created by: {group.createdBy.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;