// backend/routes/autoTripRoutes.js - FIXED VERSION WITH YOUR API KEY
const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const axios = require('axios');

const { protect } = require('../middleware/authMiddleware');

// ========== GET TRAVEL SUGGESTIONS WITH REAL WEATHER ==========
router.post('/suggestions', protect, async (req, res) => {
  try {
    console.log('✅ Suggestions API called with weather data');
    
    const { companions = 1, latitude, longitude } = req.body;
    const userId = req.user._id;

    // Get user
    const user = await User.findById(userId).select('interests name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user location
    let userLocation = null;
    if (latitude && longitude) {
      userLocation = { lat: latitude, lng: longitude };
    } else if (user.location && user.location.coordinates) {
      userLocation = {
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0]
      };
    }

    // Get REAL weather data
    let weatherData = null;
    if (userLocation) {
      try {
        weatherData = await getRealWeatherData(userLocation.lat, userLocation.lng);
        console.log('✅ Weather data fetched:', weatherData.condition, weatherData.temp + '°C');
      } catch (weatherError) {
        console.error('Weather API error:', weatherError.message);
        // Continue without weather data
        weatherData = null;
      }
    }

    // Get destinations based on interests and weather
    const suggestions = getDestinationsBasedOnInterests(
      user.interests || [],
      weatherData
    );

    // Check for existing groups
    const suggestionsWithGroups = await Promise.all(
      suggestions.map(async (suggestion) => {
        try {
          const existingGroups = await Group.find({
            $or: [
              { destination: { $regex: suggestion.name, $options: 'i' } },
              { 'destinationLocation.address': { $regex: suggestion.name, $options: 'i' } }
            ],
            status: { $in: ['planning', 'confirmed', 'active'] },
            isFull: { $ne: true }
          })
          .populate('createdBy', 'name profileImage')
          .limit(3)
          .lean();

          const enhancedGroups = existingGroups.map(group => {
            const approvedMembers = group.currentMembers?.filter(m => 
              m && m.status === 'approved'
            ) || [];
            
            return {
              id: group._id,
              destination: group.destination,
              startDate: group.startDate,
              endDate: group.endDate,
              currentMembersCount: approvedMembers.length,
              maxMembers: group.maxMembers,
              availableSlots: group.maxMembers - approvedMembers.length,
              createdBy: group.createdBy,
              matchScore: Math.floor(Math.random() * 30) + 70 // Random score 70-100
            };
          });

          return {
            ...suggestion,
            existingGroups: enhancedGroups,
            totalGroups: enhancedGroups.length,
            bestGroup: enhancedGroups[0],
            hasGroups: enhancedGroups.length > 0
          };
        } catch (error) {
          console.log('Error checking groups:', error.message);
          return {
            ...suggestion,
            existingGroups: [],
            totalGroups: 0,
            hasGroups: false
          };
        }
      })
    );

    res.json({
      success: true,
      suggestions: suggestionsWithGroups,
      userInterests: user.interests || [],
      currentWeather: weatherData,
      userLocation: userLocation,
      dataSource: weatherData ? 'real-weather' : 'interest-only',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get suggestions',
      error: error.message 
    });
  }
});

// ========== CREATE TRIP WITH REAL DATA ==========
router.post('/create', protect, async (req, res) => {
  try {
    const {
      destinationName,
      destinationAddress,
      description,
      companions = 1,
      budgetMin = 1000,
      budgetMax = 10000,
      joinExistingGroupId = null,
      latitude,
      longitude
    } = req.body;

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get weather at creation time (if location provided)
    let weatherAtCreation = null;
    if (latitude && longitude) {
      try {
        weatherAtCreation = await getRealWeatherData(latitude, longitude);
      } catch (error) {
        console.log('Weather data not available for trip creation');
      }
    }

    // If joining existing group
    if (joinExistingGroupId) {
      try {
        const group = await Group.findById(joinExistingGroupId);
        if (!group) {
          return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Check if user already member
        const isMember = group.currentMembers.some(m => 
          m.user.toString() === userId.toString()
        );

        if (!isMember) {
          group.currentMembers.push({
            user: userId,
            status: 'approved',
            role: 'member',
            joinedAt: new Date()
          });
          await group.save();
        }

        return res.json({
          success: true,
          message: `Joined trip to ${group.destination}!`,
          action: 'joined',
          groupId: group._id
        });

      } catch (joinError) {
        console.error('Join group error:', joinError);
        // Continue to create new trip
      }
    }

    // Create new trip
    const startDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);

    const group = new Group({
      destination: destinationName,
      description: description || `Auto-created trip to ${destinationName}`,
      startingLocation: {
        address: user.city || user.town || 'Your Location',
        coordinates: { 
          lat: latitude || 19.0760, 
          lng: longitude || 72.8777 
        }
      },
      destinationLocation: {
        address: destinationAddress || destinationName,
        coordinates: getDestinationCoordinates(destinationName)
      },
      startDate: startDate,
      endDate: endDate,
      budget: {
        min: budgetMin,
        max: budgetMax,
        currency: 'INR'
      },
      maxMembers: parseInt(companions) + 1,
      currentMembers: [{
        user: userId,
        status: 'approved',
        role: 'creator',
        joinedAt: new Date()
      }],
      createdBy: userId,
      status: 'planning',
      groupType: 'open',
      privacy: 'public',
      tags: ['auto-created'],
      interests: user.interests || [],
      autoCreated: true,
      weatherData: weatherAtCreation
    });

    await group.save();

    res.status(201).json({
      success: true,
      message: `Trip to ${destinationName} created!`,
      action: 'created',
      group: {
        _id: group._id,
        destination: group.destination,
        description: group.description,
        startDate: group.startDate,
        endDate: group.endDate,
        createdBy: {
          _id: user._id,
          name: user.name
        }
      },
      weatherConsidered: !!weatherAtCreation
    });

  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create trip',
      error: error.message 
    });
  }
});

// ========== REAL WEATHER FUNCTION ==========
async function getRealWeatherData(lat, lng) {
  const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
  
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OPENWEATHER_API_KEY not found in environment');
  }

  try {
    console.log('🌤️ Fetching weather for:', lat, lng);
    console.log('🔑 Using API key:', OPENWEATHER_API_KEY.substring(0, 8) + '...');
    
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric`,
      { timeout: 10000 }
    );

    if (!response.data || response.data.cod !== 200) {
      throw new Error('Invalid weather response');
    }

    return {
      temp: response.data.main.temp,
      feels_like: response.data.main.feels_like,
      temp_min: response.data.main.temp_min,
      temp_max: response.data.main.temp_max,
      humidity: response.data.main.humidity,
      pressure: response.data.main.pressure,
      condition: response.data.weather[0].main,
      description: response.data.weather[0].description,
      icon: response.data.weather[0].icon,
      windSpeed: response.data.wind.speed,
      clouds: response.data.clouds?.all || 0,
      sunrise: new Date(response.data.sys.sunrise * 1000),
      sunset: new Date(response.data.sys.sunset * 1000),
      city: response.data.name,
      country: response.data.sys.country,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Weather API Error Details:');
    console.error('- URL:', `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY.substring(0, 8)}...`);
    console.error('- Error:', error.response?.data || error.message);
    console.error('- Status:', error.response?.status);
    
    throw new Error(`Weather API failed: ${error.response?.data?.message || error.message}`);
  }
}

// ========== DESTINATION FUNCTIONS ==========
function getDestinationsBasedOnInterests(interests, weatherData) {
  const allDestinations = [
    {
      id: '1',
      name: 'Goa',
      address: 'Goa, India',
      icon: '🏖️',
      budget: { min: 2000, max: 10000 },
      duration: '3-5 days',
      matchInterests: ['beach', 'relaxation', 'adventure', 'food', 'party'],
      description: 'Famous beaches, Portuguese heritage, and seafood',
      idealWeather: ['Clear', 'Clouds'],
      avoidWeather: ['Rain', 'Thunderstorm']
    },
    {
      id: '2',
      name: 'Shimla',
      address: 'Himachal Pradesh, India',
      icon: '🏔️',
      budget: { min: 3000, max: 15000 },
      duration: '4-6 days',
      matchInterests: ['mountain', 'nature', 'adventure', 'trekking'],
      description: 'Hill station with scenic views and cool climate',
      idealWeather: ['Clear', 'Clouds'],
      avoidWeather: ['Rain', 'Snow']
    },
    {
      id: '3',
      name: 'Jaipur',
      address: 'Rajasthan, India',
      icon: '🏰',
      budget: { min: 2500, max: 12000 },
      duration: '2-4 days',
      matchInterests: ['cultural', 'historical', 'shopping'],
      description: 'The Pink City with palaces and forts',
      idealWeather: ['Clear', 'Clouds'],
      avoidWeather: ['Rain']
    },
    {
      id: '4',
      name: 'Rishikesh',
      address: 'Uttarakhand, India',
      icon: '🕉️',
      budget: { min: 1500, max: 8000 },
      duration: '2-3 days',
      matchInterests: ['religious', 'adventure', 'yoga'],
      description: 'Spiritual capital with yoga and river rafting',
      idealWeather: ['Clear', 'Clouds'],
      avoidWeather: ['Rain', 'Thunderstorm']
    },
    {
      id: '5',
      name: 'Kerala',
      address: 'Kerala, India',
      icon: '🛶',
      budget: { min: 4000, max: 20000 },
      duration: '5-7 days',
      matchInterests: ['nature', 'relaxation', 'cultural'],
      description: 'Backwaters, tea plantations, and Ayurveda',
      idealWeather: ['Clear', 'Clouds'],
      avoidWeather: ['Rain']
    },
    {
      id: '6',
      name: 'Ladakh',
      address: 'Ladakh, India',
      icon: '🗻',
      budget: { min: 5000, max: 25000 },
      duration: '7-10 days',
      matchInterests: ['adventure', 'mountain', 'nature'],
      description: 'High-altitude desert with monasteries',
      idealWeather: ['Clear'],
      avoidWeather: ['Snow', 'Rain']
    }
  ];

  // Calculate scores
  return allDestinations
    .map(dest => {
      // Interest match
      const matchingInterests = interests.filter(interest => 
        dest.matchInterests.includes(interest)
      );
      const interestScore = matchingInterests.length * 20;
      
      // Weather match
      let weatherScore = 50;
      if (weatherData) {
        if (dest.idealWeather.includes(weatherData.condition)) {
          weatherScore += 30;
        }
        if (dest.avoidWeather.includes(weatherData.condition)) {
          weatherScore -= 30;
        }
        
        // Temperature consideration
        const temp = weatherData.temp;
        if (dest.name.includes('Shimla') || dest.name.includes('Ladakh')) {
          if (temp > 30) weatherScore -= 20;
          if (temp < 15) weatherScore += 10;
        }
        if (dest.name.includes('Goa') || dest.name.includes('Kerala')) {
          if (temp > 35) weatherScore -= 10;
          if (temp < 20) weatherScore -= 10;
        }
      }
      
      const totalScore = Math.min(100, Math.max(40, interestScore + weatherScore));
      
      return {
        ...dest,
        matchScore: Math.round(totalScore),
        interestMatch: interestScore,
        weatherMatch: weatherScore,
        weatherAdvice: getWeatherAdvice(dest, weatherData)
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);
}

function getWeatherAdvice(destination, weatherData) {
  if (!weatherData) return 'No current weather data';
  
  if (destination.avoidWeather.includes(weatherData.condition)) {
    return `Avoid - ${weatherData.condition} weather not ideal`;
  }
  
  if (destination.idealWeather.includes(weatherData.condition)) {
    return `Perfect - ${weatherData.condition} weather is ideal`;
  }
  
  return `Good - ${weatherData.condition} weather is acceptable`;
}

function getDestinationCoordinates(destinationName) {
  const coordinates = {
    'goa': { lat: 15.2993, lng: 74.1240 },
    'shimla': { lat: 31.1048, lng: 77.1734 },
    'jaipur': { lat: 26.9124, lng: 75.7873 },
    'rishikesh': { lat: 30.0869, lng: 78.2676 },
    'kerala': { lat: 10.8505, lng: 76.2711 },
    'ladakh': { lat: 34.1526, lng: 77.5771 }
  };
  
  const normalizedName = destinationName.toLowerCase();
  for (const [key, coords] of Object.entries(coordinates)) {
    if (normalizedName.includes(key)) {
      return coords;
    }
  }
  
  return { lat: 20.5937, lng: 78.9629 }; // Center of India
}

// ========== TEST ENDPOINT ==========
router.get('/test-weather', async (req, res) => {
  try {
    // Test with Mumbai coordinates
    const weather = await getRealWeatherData(19.0760, 72.8777);
    res.json({
      success: true,
      message: 'Weather API is working!',
      weather: weather,
      apiKey: process.env.OPENWEATHER_API_KEY ? 'Configured' : 'Not found'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Weather API test failed',
      error: error.message,
      apiKey: process.env.OPENWEATHER_API_KEY ? 'Configured' : 'Not found'
    });
  }
});

module.exports = router;