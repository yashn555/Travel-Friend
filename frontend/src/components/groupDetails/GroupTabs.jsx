// frontend/src/components/groupDetails/GroupTabs.jsx
import React from 'react';
import { FaInfoCircle, FaRobot, FaHotel, FaMoneyBillWave, FaRoute } from 'react-icons/fa';
import OverviewTab from './OverviewTab';
import AITripPlanner from './AITripPlanner';
import GroupBooking from './GroupBooking';
import ExpenseManagement from './ExpenseManagement';
import RouteSuggestion from './RouteSuggestion';

const GroupTabs = ({ group, activeTab, setActiveTab, isCreator, isMember, user }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FaInfoCircle /> },
    { id: 'ai-planner', label: 'AI Trip Planner', icon: <FaRobot /> },
    { id: 'booking', label: 'Group Booking', icon: <FaHotel /> },
    { id: 'expenses', label: 'Expenses', icon: <FaMoneyBillWave /> },
    { id: 'routes', label: 'Best Route', icon: <FaRoute /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai-planner':
        return <AITripPlanner group={group} isCreator={isCreator} />;
      case 'booking':
        return <GroupBooking group={group} isCreator={isCreator} />;
      case 'expenses':
        return <ExpenseManagement group={group} isMember={isMember} user={user} />;
      case 'routes':
        return <RouteSuggestion group={group} />;
      default:
        return <OverviewTab group={group} />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-4 font-medium text-sm md:text-base transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default GroupTabs;