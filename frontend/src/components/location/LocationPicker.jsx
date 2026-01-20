// frontend/src/components/location/LocationPicker.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaSearch, FaTimes } from 'react-icons/fa';

const LocationPicker = ({ 
  id, 
  placeholder = "Search for a location...", 
  value, 
  onLocationSelect,
  className = "",
  initialLocation = null,
  disabled = false
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Check if Google Maps API is available
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      setUseGoogleMaps(true);
    }
  }, []);

  // Set initial location if provided
  useEffect(() => {
    if (initialLocation && !value) {
      setQuery(initialLocation.address || '');
      if (onLocationSelect) {
        onLocationSelect({
          address: initialLocation.address,
          lat: initialLocation.lat,
          lng: initialLocation.lng
        });
      }
    }
  }, [initialLocation]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current && 
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 2) {
      searchLocations(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const searchLocations = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setShowSuggestions(true);

    try {
      // Try Google Places API first if available
      if (useGoogleMaps && window.google && window.google.maps && window.google.maps.places) {
        await searchWithGooglePlaces(searchQuery);
      } else {
        // Fallback to Nominatim (OpenStreetMap)
        await searchWithNominatim(searchQuery);
      }
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchWithGooglePlaces = (searchQuery) => {
    return new Promise((resolve) => {
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: searchQuery,
          types: ['(cities)', 'geocode'],
          componentRestrictions: { country: 'in' }
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const formattedSuggestions = predictions.map(prediction => ({
              id: prediction.place_id,
              address: prediction.description,
              name: prediction.structured_formatting.main_text,
              secondary: prediction.structured_formatting.secondary_text
            }));
            setSuggestions(formattedSuggestions);
          } else {
            // Fallback to Nominatim if Google fails
            searchWithNominatim(searchQuery);
          }
          resolve();
        }
      );
    });
  };

  const searchWithNominatim = async (searchQuery) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5`
      );
      
      if (!response.ok) throw new Error('Nominatim API error');
      
      const data = await response.json();
      
      const formattedSuggestions = data.map(item => ({
        id: item.place_id,
        address: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        name: item.name || item.display_name.split(',')[0],
        secondary: item.display_name.split(',').slice(1, 3).join(', ')
      }));
      
      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error('Nominatim search error:', error);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    setQuery(suggestion.address);
    setShowSuggestions(false);
    setSuggestions([]);

    // If we have coordinates from Nominatim
    if (suggestion.lat && suggestion.lng) {
      if (onLocationSelect) {
        onLocationSelect({
          address: suggestion.address,
          lat: suggestion.lat,
          lng: suggestion.lng
        });
      }
    } else if (useGoogleMaps && suggestion.id) {
      // Get coordinates from Google Places
      getGooglePlaceDetails(suggestion.id);
    }
  };

  const getGooglePlaceDetails = (placeId) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps not available');
      return;
    }

    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    
    service.getDetails(
      {
        placeId: placeId,
        fields: ['formatted_address', 'geometry', 'name']
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          if (onLocationSelect) {
            onLocationSelect({
              address: place.formatted_address,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            });
          }
        }
      }
    );
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (onLocationSelect) {
      onLocationSelect({
        address: '',
        lat: null,
        lng: null
      });
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFocus = () => {
    if (query.length > 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <FaMapMarkerAlt />
        </div>
        
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
          autoComplete="off"
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        )}
        
        {isLoading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
            >
              <div className="flex items-start">
                <div className="mr-3 mt-1 text-gray-400">
                  <FaMapMarkerAlt size={14} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{suggestion.name}</div>
                  {suggestion.secondary && (
                    <div className="text-sm text-gray-500 truncate">{suggestion.secondary}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1 truncate">{suggestion.address}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && query.length > 2 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-center text-gray-500">
            No locations found. Try a different search term.
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500">
        {useGoogleMaps ? 
          "Powered by Google Places API • Search for cities, landmarks, or addresses" :
          "Powered by OpenStreetMap • Search for cities, towns, or locations"
        }
      </div>
    </div>
  );
};

export default LocationPicker;