// frontend/src/hooks/useGeoLocation.js
import { useState, useCallback } from 'react';

const useGeoLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return Promise.reject('Geolocation not supported');
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      // Set a timeout for the geolocation request
      const timeoutId = setTimeout(() => {
        setError('Location request timed out. Please check your location settings or try again.');
        setIsLoading(false);
        reject('Location request timed out');
      }, 15000); // 15 seconds timeout

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeoutId); // Clear the timeout
          try {
            const { latitude, longitude } = position.coords;
            
            // Try to get city name using reverse geocoding (with timeout)
            let city = null;
            let country = null;
            
            try {
              const abortController = new AbortController();
              const timeout = setTimeout(() => abortController.abort(), 5000); // 5 second timeout for reverse geocoding
              
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
                { 
                  signal: abortController.signal,
                  headers: {
                    'User-Agent': 'TravelerFriendApp/1.0'
                  }
                }
              );
              
              clearTimeout(timeout);
              
              if (response.ok) {
                const data = await response.json();
                city = data.address?.city || data.address?.town || data.address?.village;
                country = data.address?.country;
              }
            } catch (reverseGeoError) {
              console.warn('Reverse geocoding failed:', reverseGeoError);
              // Continue without city name - this is not critical
            }
            
            const locationData = {
              latitude,
              longitude,
              city,
              country,
              timestamp: new Date().toISOString()
            };
            
            setLocation(locationData);
            setIsLoading(false);
            resolve(locationData);
          } catch (error) {
            console.error('Error processing location:', error);
            setError('Failed to process location data');
            setIsLoading(false);
            reject(error);
          }
        },
        (error) => {
          clearTimeout(timeoutId); // Clear the timeout
          let errorMessage = 'Failed to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please ensure location services are enabled and try again.';
              break;
            default:
              errorMessage = 'An unknown error occurred.';
          }
          
          setError(errorMessage);
          setIsLoading(false);
          reject(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds for geolocation
          maximumAge: 60000 // Accept cached location up to 1 minute old
        }
      );
    });
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    error,
    isLoading,
    getLocation,
    clearLocation,
    hasLocation: !!location
  };
};

export default useGeoLocation;