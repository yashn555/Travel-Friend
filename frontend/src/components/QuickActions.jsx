import React from 'react';
import { 
  PlusCircle, 
  MessageSquare, 
  User, 
  Calendar,
  Map,
  Settings
} from 'lucide-react';

const QuickActions = () => {
  const actions = [
    {
      icon: <PlusCircle className="w-6 h-6" />,
      label: 'Create Group',
      color: 'bg-blue-500',
      href: '/create-group'
    },
    {
      icon: <Map className="w-6 h-6" />,
      label: 'AI Trip Planner',
      color: 'bg-purple-500',
      href: '/ai-planner'
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      label: 'Chat Inbox',
      color: 'bg-green-500',
      href: '/chat'
    },
    {
      icon: <User className="w-6 h-6" />,
      label: 'My Profile',
      color: 'bg-orange-500',
      href: '/profile'
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      label: 'My Trips',
      color: 'bg-red-500',
      href: '/my-trips'
    },
    {
      icon: <Settings className="w-6 h-6" />,
      label: 'Settings',
      color: 'bg-gray-500',
      href: '/settings'
    }
  ];

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6">
      <h2 className="text-white text-xl font-bold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {actions.map((action, index) => (
          <a
            key={index}
            href={action.href}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center justify-center text-white hover:bg-white/20 transition-colors group"
          >
            <div className={`p-3 rounded-full ${action.color} mb-3 group-hover:scale-110 transition-transform`}>
              {action.icon}
            </div>
            <span className="text-sm font-medium text-center">{action.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;