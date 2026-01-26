// frontend/src/services/nearbyUsersService.js
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get user's current location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to get city and country
        try {
          // Try OpenStreetMap first
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          resolve({
            latitude,
            longitude,
            city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
            country: data.address?.country || 'Unknown'
          });
        } catch (error) {
          // Fallback to simpler approach
          resolve({
            latitude,
            longitude,
            city: 'Unknown',
            country: 'Unknown'
          });
        }
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location services in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'Unknown error occurred.';
            break;
        }
        reject(new Error(errorMessage));
      },
      options
    );
  });
};

// Update user location
export const updateUserLocation = async (locationData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/nearby-users/location`,
      locationData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Update location error:', error);
    throw error.response?.data?.message || error.message || 'Failed to update location';
  }
};

// Get nearby users
export const getNearbyUsers = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    // Add filters to params
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await axios.get(
      `${API_URL}/nearby-users?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Get nearby users error:', error);
    if (error.response?.data?.code === 'LOCATION_REQUIRED') {
      throw new Error('Please update your location first to find nearby users');
    }
    throw new Error(error.response?.data?.message || 'Failed to load nearby users');
  }
};

// Get nearby users statistics
export const getNearbyUsersStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/nearby-users/stats`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Get stats error:', error);
    // Return default stats on error
    return {
      success: true,
      stats: {
        totalUsers: 0,
        nearbyUsers: 0,
        onlineUsers: 0,
        usersWithSameInterests: 0
      }
    };
  }
};

// Get common interests from server
export const getCommonInterests = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/nearby-users/interests`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Get interests error:', error);
    return {
      success: true,
      interests: commonInterests // Fallback to local list
    };
  }
};

// Get user's current location from server
export const getMyLocation = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/nearby-users/my-location`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Get my location error:', error);
    return null;
  }
};

// ==================== NEW FUNCTION: Send Connection Request ====================
export const sendConnectionRequest = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/connections/request/${userId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Send connection request error:', error);
    throw new Error(error.response?.data?.message || 'Failed to send connection request');
  }
};

// Alternative: Use existing friend request API if available
export const sendFriendRequest = async (userId, message = '') => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/friends/request/${userId}`,
      { message },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Send friend request error:', error);
    // Try alternative endpoint
    try {
      const token = localStorage.getItem('token');
      const altResponse = await axios.post(
        `${API_URL}/users/${userId}/friend-request`,
        { message },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return altResponse.data;
    } catch (altError) {
      throw new Error(altError.response?.data?.message || 'Failed to send friend request');
    }
  }
};

// Common interests for fallback
export const commonInterests = [
  'Hiking',
  'Camping',
  'Beach',
  'Mountains',
  'City Tours',
  'Food & Dining',
  'Photography',
  'Adventure Sports',
  'Cultural Heritage',
  'Wildlife',
  'Road Trips',
  'Sightseeing',
  'Shopping',
  'Nightlife',
  'Yoga & Wellness',
  'Historical Sites',
  'Art & Museums',
  'Music Festivals',
  'Local Cuisine',
  'Water Sports'
];

// ==================== TEMPORARY MOCK FUNCTION ====================
// If you don't have a connections API yet, use this mock function
export const mockSendConnectionRequest = async (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Connection request sent successfully!',
        data: {
          requestId: `req_${Date.now()}`,
          status: 'pending'
        }
      });
    }, 1000);
  });
};