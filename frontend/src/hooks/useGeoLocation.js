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
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Try to get city name using reverse geocoding
            let city = null;
            let country = null;
            
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
              );
              
              if (response.ok) {
                const data = await response.json();
                city = data.address?.city || data.address?.town || data.address?.village;
                country = data.address?.country;
              }
            } catch (reverseGeoError) {
              console.warn('Reverse geocoding failed:', reverseGeoError);
              // Continue without city name
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
          let errorMessage = 'Failed to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
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
          timeout: 10000,
          maximumAge: 0
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