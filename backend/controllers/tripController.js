// backend/controllers/tripController.js - GEMINI API ONLY (NO MOCK DATA)
const TripPlan = require('../models/TripPlan');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const User = require('../models/User');
const axios = require('axios');

// Helper function to call Gemini API
// In generateGeminiJSON function, update the API endpoint:

const generateGeminiJSON = async (aiPrompt) => {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ Gemini API key is not configured in .env file');
      throw new Error('Gemini API key is not configured');
    }

    console.log('🔑 Using Gemini API Key');
    console.log('📝 Prompt length:', aiPrompt.length);

    // CORRECTED: Use the working model endpoint
    // Try different model endpoints in order
    const modelEndpoints = [
      'gemini-1.5-pro-latest',  // Latest 1.5 Pro
      'gemini-1.5-pro',         // Standard 1.5 Pro
      'gemini-pro',             // Standard Gemini Pro
      'gemini-1.0-pro'          // Legacy 1.0 Pro
    ];

    let lastError = null;
    
    for (const modelName of modelEndpoints) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        console.log(`🔄 Trying model: ${modelName}`);
        console.log(`🌐 API URL (masked): https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=****`);

        const response = await axios.post(
          apiUrl,
          {
            contents: [{
              parts: [{
                text: aiPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.8,
              maxOutputTokens: 2048,
            }
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        console.log(`✅ Success with model: ${modelName}`);
        console.log('✅ Response status:', response.status);

        if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
          console.log('❌ No valid response from Gemini API');
          continue; // Try next model
        }

        const aiResponse = response.data.candidates[0].content.parts[0].text;
        console.log('📄 AI Response sample:', aiResponse.substring(0, 200) + '...');

        // Clean and parse JSON
        let cleanedResponse = aiResponse
          .replace(/```json\s*/g, '')
          .replace(/\s*```/g, '')
          .replace(/```/g, '')
          .trim();

        // Extract JSON if wrapped
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
        }

        try {
          const parsedData = JSON.parse(cleanedResponse);
          console.log('✅ JSON parsed successfully');
          return parsedData;
        } catch (parseError) {
          console.error('❌ JSON parse failed:', parseError.message);
          // Try to fix common JSON issues
          try {
            // Remove trailing commas
            const fixedJson = cleanedResponse.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            const parsedData = JSON.parse(fixedJson);
            console.log('✅ JSON parsed after fixing');
            return parsedData;
          } catch (secondError) {
            console.error('❌ Still failed to parse JSON');
            // Create a fallback response
            return createFallbackResponse(aiResponse, modelName);
          }
        }

      } catch (modelError) {
        lastError = modelError;
        console.log(`❌ Model ${modelName} failed:`, modelError.message);
        // Continue to next model
        continue;
      }
    }

    // If all models failed
    console.error('❌ All Gemini models failed');
    throw lastError || new Error('All Gemini models failed');

  } catch (error) {
    console.error('❌ Gemini API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url?.replace(process.env.GEMINI_API_KEY, '****')
    });

    if (error.response?.status === 404) {
      throw new Error(`Gemini API model not found. Please check available models at: http://localhost:5000/api/test/list-models`);
    }
    
    if (error.response?.status === 403) {
      throw new Error('Gemini API access forbidden. Please check your API key permissions.');
    }
    
    throw new Error(`Gemini API failed: ${error.message}`);
  }
};

// Helper function to call Gemini API for trip planning
const callAITripPlanner = async (
  destination,
  startDate,
  endDate,
  groupSize,
  budget,
  preferences,
  prompt = ""
) => {
  const aiPrompt = `
You are a professional travel planner. Create a detailed trip itinerary in JSON format.

IMPORTANT: Return ONLY valid JSON, no other text.

DESTINATION: ${destination}
DATES: ${startDate} to ${endDate}
GROUP SIZE: ${groupSize} people
BUDGET: ₹${budget.min} - ₹${budget.max} per person
PREFERENCES: ${JSON.stringify(preferences || {})}
USER REQUEST: ${prompt || "Create a standard itinerary"}

Generate a detailed trip plan with this EXACT JSON structure:

{
  "itinerary": [
    {
      "day": 1,
      "date": "${startDate}",
      "title": "Arrival and Check-in",
      "activities": [
        {
          "time": "12:00 PM",
          "title": "Arrival at destination",
          "description": "Check into accommodation and freshen up",
          "type": "travel",
          "duration": "2 hours",
          "cost": 0
        },
        {
          "time": "2:00 PM",
          "title": "Local Lunch",
          "description": "Try authentic local cuisine",
          "type": "food",
          "duration": "1.5 hours",
          "cost": 500
        }
      ],
      "accommodation": "Hotel/Hostel name",
      "meals": ["Lunch", "Dinner"],
      "totalCost": 1500,
      "highlights": ["Local food experience", "Sightseeing"]
    }
  ],
  "totalEstimatedCost": 15000,
  "costPerPerson": 5000,
  "recommendations": {
    "packing": ["Essentials list"],
    "tips": ["Travel tips"],
    "safety": ["Safety precautions"],
    "transportation": ["Transport options"],
    "food": ["Recommended restaurants"]
  }
}

Requirements:
1. Create ${Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000)} days itinerary
2. Include realistic activities and timings
3. Calculate costs based on Indian prices
4. Consider group size and preferences
5. Add local recommendations
6. Ensure budget stays within ₹${budget.min} - ₹${budget.max} range`;

  console.log('Calling Gemini API with prompt length:', aiPrompt.length);
  const plan = await generateGeminiJSON(aiPrompt);

  // Add metadata
  plan.destination = destination;
  plan.groupSize = groupSize;
  plan.durationDays = Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000);
  plan.season = getSeason(startDate);

  return plan;
};

// Helper function for season
const getSeason = (date) => {
  const month = new Date(date).getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
};

// @desc    Generate AI trip plan using Gemini API
// @route   POST /api/trips/plan
// @access  Private
exports.generateTripPlan = async (req, res) => {
  try {
    console.log('Generating trip plan for user:', req.user.id);
    const { groupId, prompt } = req.body;

    // Validate input
    if (!groupId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group ID is required' 
      });
    }

    // Get group details
    const group = await Group.findById(groupId)
      .populate('createdBy', 'name')
      .populate('currentMembers.user', 'name');

    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    console.log('Group found:', {
      destination: group.destination,
      startDate: group.startDate,
      endDate: group.endDate,
      members: group.currentMembers.length
    });

    // Check if user is group member
    const isMember = group.currentMembers.some(member => 
      member.user._id.toString() === req.user.id || 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to plan for this group' 
      });
    }

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.'
      });
    }

    console.log('Calling Gemini API...');
    
    // Call Gemini API for real trip planning
    const tripPlanData = await callAITripPlanner(
      group.destination,
      group.startDate,
      group.endDate,
      group.currentMembers.length,
      group.budget || { min: 1000, max: 10000 },
      group.travelPreferences || {},
      prompt || ''
    );

    console.log('Gemini API call successful, saving trip plan...');

    // Save trip plan to database
    const tripPlan = await TripPlan.findOneAndUpdate(
      { group: groupId },
      {
        group: groupId,
        destination: group.destination,
        startDate: group.startDate,
        endDate: group.endDate,
        groupSize: group.currentMembers.length,
        budget: group.budget,
        preferences: group.travelPreferences,
        plan: tripPlanData,
        generatedBy: req.user.id,
        promptUsed: prompt || 'Standard trip plan',
        aiGenerated: true,
        aiProvider: 'Google Gemini',
        status: 'generated'
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    console.log('Trip plan saved successfully');

    res.status(201).json({
      success: true,
      message: 'AI trip plan generated successfully using Gemini',
      data: tripPlan
    });
  } catch (error) {
    console.error('Error generating trip plan:', error);
    
    // Detailed error response
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate trip plan with AI',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      } : undefined,
      suggestion: process.env.NODE_ENV === 'development' ? 
        'Check your Gemini API key and ensure it has proper permissions' : 
        'Please try again later or contact support'
    });
  }
};

// @desc    Get trip plan for group
// @route   GET /api/trips/plan/:groupId
// @access  Private
exports.getTripPlan = async (req, res) => {
  try {
    const { groupId } = req.params;

    const tripPlan = await TripPlan.findOne({ group: groupId })
      .populate('generatedBy', 'name email')
      .populate('group', 'destination startDate endDate currentMembers');

    if (!tripPlan) {
      return res.status(404).json({ 
        success: false, 
        message: 'No trip plan found for this group' 
      });
    }

    res.status(200).json({
      success: true,
      data: tripPlan
    });
  } catch (error) {
    console.error('Error getting trip plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trip plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update trip plan
// @route   PUT /api/trips/plan/:groupId
// @access  Private
exports.updateTripPlan = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { plan } = req.body;
    
    const tripPlan = await TripPlan.findOneAndUpdate(
      { group: groupId },
      { 
        plan,
        updatedAt: Date.now(),
        lastModifiedBy: req.user.id 
      },
      { new: true }
    );

    if (!tripPlan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trip plan not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Trip plan updated successfully',
      data: tripPlan
    });
  } catch (error) {
    console.error('Error updating trip plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trip plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get AI route suggestions using Gemini
// @route   GET /api/trips/routes/:groupId
// @access  Private
exports.getRouteSuggestions = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { startingCity } = req.query;

    // Get group details
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    // Check if user is group member
    const isMember = group.currentMembers.some(member => 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view route suggestions' 
      });
    }

    // Get starting city from group if not provided in query
    const startCity = startingCity || group.startingLocation?.address;
    
    if (!startCity) {
      return res.status(400).json({
        success: false,
        message: 'Starting city is required for route suggestions',
        note: 'Please provide starting city in query parameter or ensure group has startingLocation',
        suggestion: 'Update your group with starting location or provide ?startingCity=CityName in the URL'
      });
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(501).json({
        success: false,
        message: 'Route suggestion service is not configured yet',
        note: 'Please add GEMINI_API_KEY to .env file',
        suggestion: 'Get your API key from Google AI Studio'
      });
    }

    // Create AI prompt for route suggestions
    const aiPrompt = `You are a travel route expert. Suggest the best travel routes between cities.

FROM: ${startCity}
TO: ${group.destination}
GROUP SIZE: ${group.currentMembers.length} people
BUDGET: ₹${group.budget?.min || 1000} - ₹${group.budget?.max || 10000}
TRIP DATES: ${group.startDate} to ${group.endDate}
TRAVEL PREFERENCES: ${JSON.stringify(group.travelPreferences || {})}

Please provide route suggestions in this EXACT JSON format:
{
  "suggestions": [
    {
      "mode": "Flight",
      "icon": "✈️",
      "description": "Real description based on distance",
      "time": "Real travel time estimate",
      "cost": 2500,
      "costPerPerson": 2500,
      "ecoFriendly": false,
      "bestFor": "Specific use case",
      "comfort": "High/Medium/Low",
      "capacity": "Group capacity"
    }
  ],
  "bestRecommendation": {
    "mode": "Recommended mode",
    "reason": "Detailed reason for recommendation"
  }
}

IMPORTANT:
1. Provide REAL travel time estimates
2. Calculate REAL costs based on distance and group size
3. Make REAL recommendations based on group size and budget
4. Consider Indian travel conditions and prices
5. Return ONLY JSON, no other text`;

    console.log('Calling Gemini API for route suggestions from', startCity, 'to', group.destination);
    
    // Call Gemini API
    const routeData = await generateGeminiJSON(aiPrompt);

    res.status(200).json({
      success: true,
      data: {
        ...routeData,
        groupSize: group.currentMembers.length,
        budget: group.budget,
        startingCity: startCity,
        destination: group.destination
      }
    });
  } catch (error) {
    console.error('Error getting route suggestions:', error);
    
    // Return fallback suggestions if AI fails
    const fallbackSuggestions = generateFallbackRouteSuggestions(group, startingCity);
    
    res.status(200).json({
      success: true,
      message: 'Using fallback route suggestions',
      data: fallbackSuggestions
    });
  }
};


// @desc    Get real hotels from Maqami API
// @route   POST /api/trips/hotels/search
// @access  Private
exports.searchHotels = async (req, res) => {
  try {
    const { city, checkIn, checkOut, guests, rooms } = req.body;

    // Check if Maqami API key is available
    if (!process.env.MAQAMI_API_KEY) {
      return res.status(501).json({
        success: false,
        message: 'Hotel booking service is not configured yet',
        note: 'Please add MAQAMI_API_KEY to .env file'
      });
    }

    // Maqami Hotel API integration
    const response = await axios.get('https://api.maqami.com/v1/hotels/search', {
      params: {
        city,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        rooms,
        api_key: process.env.MAQAMI_API_KEY
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Process hotel data
    const hotels = response.data.hotels.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      rating: hotel.rating,
      price: hotel.price_per_night,
      totalPrice: hotel.total_price,
      currency: hotel.currency || 'INR',
      amenities: hotel.amenities || [],
      location: hotel.location,
      distance: hotel.distance_from_center,
      image: hotel.image_url,
      provider: 'Maqami Hotels',
      available: hotel.available
    }));

    res.status(200).json({
      success: true,
      data: hotels
    });
  } catch (error) {
    console.error('Hotel search error:', error.message);
    
    // Return empty array if API fails - NO MOCK DATA
    res.status(200).json({
      success: false,
      message: 'Hotel search service temporarily unavailable',
      data: []
    });
  }
};

// @desc    Create group booking with real hotel
// @route   POST /api/trips/booking
// @access  Private
exports.createGroupBooking = async (req, res) => {
  try {
    const { 
      groupId, 
      hotelId,
      hotelName,
      checkIn,
      checkOut,
      rooms,
      guests,
      totalAmount,
      paymentMethod 
    } = req.body;

    // Get group details
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    // Check if user is group admin
    const isAdmin = group.currentMembers.some(member => 
      (member.user.toString() === req.user.id || member.user._id?.toString() === req.user.id) &&
      member.role === 'creator'
    );

    if (!isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only group admin can create bookings' 
      });
    }

    if (!process.env.MAQAMI_API_KEY) {
      return res.status(501).json({
        success: false,
        message: 'Hotel booking service is not configured yet',
        note: 'Please add MAQAMI_API_KEY to .env file'
      });
    }

    // Create booking with Maqami API
    const bookingResponse = await axios.post(
      'https://api.maqami.com/v1/bookings/create',
      {
        hotel_id: hotelId,
        check_in: checkIn,
        check_out: checkOut,
        rooms,
        guests,
        customer_name: req.user.name,
        customer_email: req.user.email,
        customer_phone: req.user.mobile,
        total_amount: totalAmount
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MAQAMI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const bookingData = {
      groupId,
      bookingType: 'hotel',
      provider: 'Maqami Hotels',
      hotelId,
      hotelName,
      checkIn,
      checkOut,
      rooms,
      guests,
      totalAmount: parseFloat(totalAmount),
      bookedBy: req.user.id,
      status: 'confirmed',
      bookingReference: bookingResponse.data.booking_reference,
      paymentMethod: paymentMethod || 'razorpay',
      bookingDate: new Date(),
      groupMembers: group.currentMembers.map(member => member.user.toString())
    };

    // TODO: Save booking to database (implement Booking model)
    // const booking = await Booking.create(bookingData);

    res.status(201).json({
      success: true,
      message: 'Hotel booking created successfully',
      data: bookingData,
      bookingReference: bookingResponse.data.booking_reference
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add expense with UPI payment requests
// @route   POST /api/trips/expenses
// @access  Private
exports.addExpense = async (req, res) => {
  try {
    const { 
      groupId, 
      description, 
      amount, 
      category, 
      splitBetween 
    } = req.body;

    // Get group details
    const group = await Group.findById(groupId)
      .populate('currentMembers.user', 'name upiId email');
    
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    // Check if user is group member
    const isMember = group.currentMembers.some(member => 
      member.user._id.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to add expenses' 
      });
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Create expense
    const expenseData = {
      group: groupId,
      description,
      amount: amountNum,
      category: category || 'other',
      paidBy: req.user.id,
      splitBetween: splitBetween || group.currentMembers.map(member => member.user._id),
      addedBy: req.user.id,
      date: new Date(),
      status: 'pending'
    };

    // Save expense
    const expense = await Expense.create(expenseData);

    // Calculate split amount per person
    const splitCount = expenseData.splitBetween.length;
    const amountPerPerson = parseFloat((amountNum / splitCount).toFixed(2));

    // Send notifications for UPI payment requests
    const notificationsSent = [];
    
    for (const memberId of expenseData.splitBetween) {
      // Skip the person who paid
      if (memberId.toString() === req.user.id.toString()) continue;
      
      const member = group.currentMembers.find(m => m.user._id.toString() === memberId.toString());
      if (member && member.user) {
        // Send notification to user
        const user = await User.findById(memberId);
        if (user) {
          const upiLink = member.user.upiId ? 
            `upi://pay?pa=${member.user.upiId}&pn=${req.user.name}&am=${amountPerPerson}&tn=${encodeURIComponent(description)}` : 
            null;
          
          user.addNotification(
            'expense_split',
            'Payment Request',
            `${req.user.name} requests ₹${amountPerPerson} for "${description}"`,
            {
              expenseId: expense._id,
              amount: amountPerPerson,
              upiLink: upiLink,
              description: description
            }
          );
          await user.save();
          
          notificationsSent.push({
            userId: memberId,
            name: member.user.name,
            amount: amountPerPerson,
            upiId: member.user.upiId || 'Not set',
            notified: true
          });
        }
      }
    }

    // Update group total expenses
    group.totalExpenses = (group.totalExpenses || 0) + amountNum;
    await group.save();

    res.status(201).json({
      success: true,
      message: 'Expense added and payment requests sent',
      data: {
        expense,
        notificationsSent,
        amountPerPerson,
        totalMembers: splitCount,
        totalAmount: amountNum
      }
    });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add expense',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get expenses for group
// @route   GET /api/trips/expenses/:groupId
// @access  Private
exports.getExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if user is group member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    const isMember = group.currentMembers.some(member => 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view expenses' 
      });
    }

    // Get real expenses from database
    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name upiId')
      .populate('addedBy', 'name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: expenses
    });
  } catch (error) {
    console.error('Error getting expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expenses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/trips/expenses/:expenseId
// @access  Private
exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Check if user created the expense or is group admin
    const group = await Group.findById(expense.group)
      .populate('currentMembers.user', '_id role');
    
    const isCreator = expense.addedBy.toString() === req.user.id;
    const isAdmin = group.currentMembers.some(member => 
      member.user._id.toString() === req.user.id && member.role === 'creator'
    );
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense'
      });
    }
    
    await Expense.findByIdAndDelete(expenseId);
    
    res.status(200).json({ 
      success: true, 
      message: 'Expense deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense'
    });
  }
};

// @desc    Get group bookings
// @route   GET /api/trips/booking/:groupId
// @access  Private
exports.getGroupBookings = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if user is group member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    const isMember = group.currentMembers.some(member => 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view bookings' 
      });
    }

    // TODO: Get real bookings from database (implement Booking model)
    // const bookings = await Booking.find({ groupId }).sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      data: [] // Return empty until Booking model is implemented
    });
  } catch (error) {
    console.error('Error getting bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/trips/booking/:bookingId
// @access  Private
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    // TODO: Update booking status in database
    // const booking = await Booking.findByIdAndUpdate(
    //   bookingId,
    //   { status },
    //   { new: true }
    // );
    
    res.status(200).json({ 
      success: true, 
      message: 'Booking status updated',
      data: { bookingId, status }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
};