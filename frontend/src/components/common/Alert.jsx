import React from 'react';
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

const Alert = ({ type = 'info', title, message, onClose }) => {
  const alertConfig = {
    info: {
      icon: <FaInfoCircle className="h-5 w-5" />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      title: 'text-blue-800',
    },
    success: {
      icon: <FaCheckCircle className="h-5 w-5" />,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      title: 'text-green-800',
    },
    warning: {
      icon: <FaExclamationTriangle className="h-5 w-5" />,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      title: 'text-yellow-800',
    },
    error: {
      icon: <FaTimesCircle className="h-5 w-5" />,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      title: 'text-red-800',
    },
  };
  
  const config = alertConfig[type];
  
  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4 mb-4`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${config.text} mt-0.5`}>
          {config.icon}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${config.title} mb-1`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${config.text}`}>
            {message}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-auto -mx-1.5 -my-1.5 ${config.text} hover:${config.bg} rounded-lg p-1.5 inline-flex h-8 w-8 focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            <span className="sr-only">Close</span>
            <FaTimesCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;