import React from 'react';

const AgencyCard = ({ agency }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            {agency.logo ? (
              <img 
                src={agency.logo} 
                alt={agency.name}
                className="w-10 h-10 object-contain"
              />
            ) : (
              <span className="text-blue-600 font-bold text-lg">
                {agency.name.charAt(0)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-gray-900">{agency.name}</h4>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {agency.description}
              </p>
            </div>
            {agency.verified && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Verified ✓
              </span>
            )}
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {agency.rating > 0 && (
                <div className="flex items-center">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1 text-sm text-gray-700">
                    {agency.rating.toFixed(1)}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {agency.services?.slice(0, 2).map((service, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
            
            <a
              href={agency.contactInfo?.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Visit →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyCard;