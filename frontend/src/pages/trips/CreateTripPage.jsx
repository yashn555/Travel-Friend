// frontend/src/pages/trips/CreateTripPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createGroup } from '../../services/groupService';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaUsers, 
  FaCar, 
  FaSmoking, 
  FaWineGlass,
  FaPaw,
  FaVenusMars,
  FaExclamationCircle,
  FaCheckCircle,
  FaLocationArrow,
  FaUserFriends,
  FaRupeeSign
} from 'react-icons/fa';
import LocationPicker from '../../components/location/LocationPicker';
import useGeoLocation from '../../hooks/useGeoLocation';

const CreateTripPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    // Basic Info
    destination: '',
    startingLocation: '',
    startingLocationCoords: null,
    destinationCoords: null,
    description: '',
    startDate: '',
    endDate: '',
    
    // Budget (Updated with slider values)
    minBudget: '5000',
    maxBudget: '20000',
    currency: 'INR',
    
    // Group Settings
    maxMembers: '6',
    groupType: 'open',
    privacy: 'public',
    
    // Trip Preferences
    travelStyle: [],
    accommodationType: 'hotel',
    transportMode: [],
    
    // Lifestyle Preferences
    smokingAllowed: 'no',
    drinkingAllowed: 'social',
    petsAllowed: 'no',
    genderPreference: 'any',
    
    // Interests & Activities
    interests: [],
    tags: '',
    
    // New field for friend invitations
    inviteFriendsAfterCreate: false
  });
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [createdGroupId, setCreatedGroupId] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const formRef = useRef(null);
  
  // Get user's current location
  const { location: userLocation, error: locationError, getLocation } = useGeoLocation();
  
  // Options
  const travelStyles = [
    { id: 'adventure', label: 'Adventure', icon: '🧗' },
    { id: 'luxury', label: 'Luxury', icon: '⭐' },
    { id: 'budget', label: 'Budget', icon: '💰' },
    { id: 'backpacking', label: 'Backpacking', icon: '🎒' },
    { id: 'solo', label: 'Solo Friendly', icon: '👤' },
    { id: 'family', label: 'Family Style', icon: '👨‍👩‍👧‍👦' },
    { id: 'digital_nomad', label: 'Digital Nomad', icon: '💻' },
    { id: 'slow_travel', label: 'Slow Travel', icon: '🐌' }
  ];
  
  const transportModes = [
    { id: 'flight', label: 'Flight', icon: '✈️' },
    { id: 'train', label: 'Train', icon: '🚆' },
    { id: 'bus', label: 'Bus', icon: '🚌' },
    { id: 'car', label: 'Car Roadtrip', icon: '🚗' },
    { id: 'bike', label: 'Bike/Motorcycle', icon: '🏍️' },
    { id: 'hitchhiking', label: 'Hitchhiking', icon: '👍' }
  ];
  
  const interestsList = [
    { id: 'photography', label: 'Photography', icon: '📸' },
    { id: 'foodie', label: 'Food & Dining', icon: '🍜' },
    { id: 'party', label: 'Nightlife', icon: '🎉' },
    { id: 'nature', label: 'Nature & Hiking', icon: '🌲' },
    { id: 'culture', label: 'Culture & History', icon: '🏛️' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'sports', label: 'Sports & Adventure', icon: '⚽' },
    { id: 'yoga', label: 'Wellness & Yoga', icon: '🧘' },
    { id: 'music', label: 'Music & Concerts', icon: '🎵' },
    { id: 'art', label: 'Art & Museums', icon: '🎨' },
    { id: 'beach', label: 'Beach & Sun', icon: '🏖️' },
    { id: 'mountains', label: 'Mountains', icon: '🏔️' }
  ];

  const budgetPresets = [
    { label: 'Budget', min: 1000, max: 5000, icon: '💰' },
    { label: 'Moderate', min: 5000, max: 20000, icon: '⭐' },
    { label: 'Luxury', min: 20000, max: 50000, icon: '🎩' },
    { label: 'Premium', min: 50000, max: 100000, icon: '👑' }
  ];

  // Auto-detect user's location on component mount
  useEffect(() => {
    console.log('📍 CreateTripPage mounted');
    getLocation();
  }, []);

  // Set starting location if user grants permission
  useEffect(() => {
    if (userLocation && !formData.startingLocation) {
      setFormData(prev => ({
        ...prev,
        startingLocation: `Your Current Location (${userLocation.city || 'Nearby'})`,
        startingLocationCoords: {
          lat: userLocation.latitude,
          lng: userLocation.longitude
        }
      }));
    }
  }, [userLocation]);

  // Add useEffect to track step changes
  useEffect(() => {
    console.log(`🔄 STEP CHANGED: Step ${step} activated`);
    
    if (step === 4) {
      console.log('🎯 STEP 4 ACTIVATED - Interests section should be visible');
      console.log('📊 Current form data at step 4:', {
        interestsCount: formData.interests.length,
        tags: formData.tags,
        inviteFriends: formData.inviteFriendsAfterCreate,
        confirmationChecked
      });
      
      // Give time for animation
      setTimeout(() => {
        console.log('📜 Scrolling to top of step 4');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    }
  }, [step]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: formData.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle budget preset selection
  const handleBudgetPreset = (preset) => {
    console.log('💰 Budget preset selected:', preset.label);
    setFormData(prev => ({
      ...prev,
      minBudget: preset.min.toString(),
      maxBudget: preset.max.toString()
    }));
  };

  // Handle min budget slider change
  const handleMinBudgetChange = (e) => {
    const value = parseInt(e.target.value);
    console.log('📉 Min budget changed to:', value);
    if (value <= parseInt(formData.maxBudget)) {
      setFormData(prev => ({
        ...prev,
        minBudget: value.toString()
      }));
    }
  };

  // Handle max budget slider change
  const handleMaxBudgetChange = (e) => {
    const value = parseInt(e.target.value);
    console.log('📈 Max budget changed to:', value);
    if (value >= parseInt(formData.minBudget)) {
      setFormData(prev => ({
        ...prev,
        maxBudget: value.toString()
      }));
    }
  };

  // Validation function
  const validateStep = (stepNumber) => {
    console.log(`🔍 Validating step ${stepNumber}`);
    const newErrors = {};
    
    if (stepNumber === 1) {
      if (!formData.startingLocation.trim()) {
        newErrors.startingLocation = 'Where are you starting from? This is required for route planning! 🗺️';
      }
      if (!formData.destination.trim()) {
        newErrors.destination = 'Where are you going? This helps others find your trip! 🌍';
      }
      if (!formData.description.trim()) {
        newErrors.description = 'Tell us about your trip vibes! Share your plans and expectations ✨';
      }
      if (!formData.startDate) {
        newErrors.startDate = 'When does the adventure begin? 📅';
      }
      if (!formData.endDate) {
        newErrors.endDate = 'When does the trip end? 📅';
      } else if (formData.startDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = 'Trip should end after it starts! Choose a later date 📆';
      }
    }
    
    if (stepNumber === 2) {
      if (!formData.minBudget || formData.minBudget === '') {
        newErrors.minBudget = 'What\'s your minimum budget? This helps match with similar travelers 💰';
      } else if (parseInt(formData.minBudget) < 0) {
        newErrors.minBudget = 'Budget can\'t be negative! Enter a positive amount 💸';
      }
      
      if (!formData.maxBudget || formData.maxBudget === '') {
        newErrors.maxBudget = 'What\'s your maximum budget? 💳';
      } else if (parseInt(formData.maxBudget) < 0) {
        newErrors.maxBudget = 'Budget can\'t be negative! Enter a positive amount 💸';
      }
      
      if (formData.minBudget && formData.maxBudget && parseInt(formData.minBudget) > parseInt(formData.maxBudget)) {
        newErrors.maxBudget = 'Maximum budget should be more than minimum budget! 📈';
      }
      
      if (!formData.maxMembers || formData.maxMembers === '') {
        newErrors.maxMembers = 'How many travel buddies are you looking for? 👥';
      } else if (parseInt(formData.maxMembers) < 2) {
        newErrors.maxMembers = 'You need at least 2 people for a group! 🤝';
      } else if (parseInt(formData.maxMembers) > 20) {
        newErrors.maxMembers = 'Maximum 20 people for a cozy travel squad! 🏖️';
      }
    }
    
    // Steps 3 and 4 are optional, no validation needed
    if (stepNumber === 3 || stepNumber === 4) {
      console.log(`✅ Step ${stepNumber} is optional, skipping validation`);
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log(`📋 Step ${stepNumber} validation result:`, isValid ? '✅ Valid' : '❌ Invalid', newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    console.log(`✏️ Field changed: ${name} = ${type === 'checkbox' ? checked : value}`);
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleMultiSelect = (name, value) => {
    console.log(`🎯 Multi-select: ${name}, value: ${value}`);
    const currentArray = formData[name] || [];
    if (currentArray.includes(value)) {
      setFormData({ ...formData, [name]: currentArray.filter(item => item !== value) });
    } else {
      setFormData({ ...formData, [name]: [...currentArray, value] });
    }
  };

  const handleLocationSelect = (type, locationData) => {
    console.log(`📍 Location selected (${type}):`, locationData.address);
    if (type === 'starting') {
      setFormData(prev => ({
        ...prev,
        startingLocation: locationData.address,
        startingLocationCoords: {
          lat: locationData.lat,
          lng: locationData.lng
        }
      }));
      if (errors.startingLocation) {
        setErrors(prev => ({ ...prev, startingLocation: '' }));
      }
    } else if (type === 'destination') {
      setFormData(prev => ({
        ...prev,
        destination: locationData.address,
        destinationCoords: {
          lat: locationData.lat,
          lng: locationData.lng
        }
      }));
      if (errors.destination) {
        setErrors(prev => ({ ...prev, destination: '' }));
      }
    }
  };

  const nextStep = () => {
    console.log(`➡️ Next step button clicked, current step: ${step}`);
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    } else {
      console.log('❌ Cannot proceed to next step, validation failed');
      // Scroll to first error
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        const errorElement = document.querySelector(`[name="${firstError}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        }
      }
    }
  };

  const prevStep = () => {
    console.log(`⬅️ Previous step button clicked, current step: ${step}`);
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  // CRITICAL FIX: Updated handleSubmit with proper delays and validation
  const handleSubmit = async (e) => {
    console.log('🚀 ========== FORM SUBMISSION STARTED ==========');
    console.log('📅 Submission timestamp:', new Date().toISOString());
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📊 Current state:', {
      step,
      formSubmitted,
      loading,
      hasStartingCoords: !!formData.startingLocationCoords,
      hasDestinationCoords: !!formData.destinationCoords
    });
    
    // Prevent multiple submissions
    if (loading || formSubmitted) {
      console.log('❌ Preventing duplicate submission - loading:', loading, 'formSubmitted:', formSubmitted);
      return;
    }
    
    // Ensure we're on step 4 before submitting
    if (step !== 4) {
      console.log('⚠️ Not on step 4, cannot submit. Current step:', step);
      setStep(4);
      setMessage('Please complete all steps before creating your trip!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Validate all required steps (1 and 2)
    console.log('🔍 Validating required steps...');
    for (let i = 1; i <= 2; i++) {
      if (!validateStep(i)) {
        console.log(`❌ Validation failed for step ${i}`);
        setStep(i);
        setMessage('Please complete all required fields before creating your trip! 📝');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    
    console.log('✅ All required steps validated successfully');
    
    // Validate locations
    if (!formData.startingLocation || !formData.destination) {
      console.log('❌ Missing locations');
      setMessage('Please provide both starting location and destination! 🗺️');
      setStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (!formData.startingLocationCoords || !formData.destinationCoords) {
      console.log('❌ Missing location coordinates');
      setMessage('Please select valid locations using the location picker! 📍');
      setStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    console.log('✅ Locations validated');
    
    // Validate budget
    if (parseInt(formData.minBudget) > parseInt(formData.maxBudget)) {
      console.log('❌ Invalid budget range');
      setMessage('Minimum budget cannot be greater than maximum budget!');
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    console.log('✅ Budget validated');
    
    // Show warning if interests are too few (but don't block)
    console.log(`📊 Interests selected: ${formData.interests.length}`);
    if (formData.interests.length < 3) {
      console.log('⚠️ Low interests count - showing confirmation dialog');
      const proceed = window.confirm(
        'You selected less than 3 interests. This might affect finding perfect travel buddies.\n\nDo you want to proceed anyway?'
      );
      if (!proceed) {
        console.log('❌ User chose to add more interests');
        setStep(4);
        setMessage('Add more interests for better matches! 🎯');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      console.log('✅ User chose to proceed with low interests');
    }
    
    try {
      console.log('🔒 Setting loading and form submitted states');
      setLoading(true);
      setFormSubmitted(true);
      setMessage('Creating your travel squad... ✈️');
      
      console.log('⏳ Showing creating message for 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Prepare group data
      console.log('📝 Preparing group data...');
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      const groupData = {
        destination: formData.destination,
        startingLocation: {
          address: formData.startingLocation,
          coordinates: formData.startingLocationCoords
        },
        destinationLocation: {
          address: formData.destination,
          coordinates: formData.destinationCoords
        },
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: {
          min: parseInt(formData.minBudget),
          max: parseInt(formData.maxBudget),
          currency: formData.currency
        },
        maxMembers: parseInt(formData.maxMembers),
        groupType: formData.groupType,
        privacy: formData.privacy,
        travelPreferences: {
          travelStyle: formData.travelStyle,
          accommodationType: formData.accommodationType,
          transportMode: formData.transportMode,
          smokingAllowed: formData.smokingAllowed,
          drinkingAllowed: formData.drinkingAllowed,
          petsAllowed: formData.petsAllowed,
          genderPreference: formData.genderPreference
        },
        interests: formData.interests,
        tags: tagsArray
      };
      
      console.log('📤 Sending group data to API:', JSON.stringify(groupData, null, 2));
      
      const res = await createGroup(groupData);
console.log('📥 API Response received:', res);

// SIMPLE FIX: Extract group ID correctly
let groupId = res.data?._id; // Direct access since your API returns _id at root

if (!groupId && res.data?.data?._id) {
  groupId = res.data.data._id; // Fallback to nested
}

console.log('✅ Group created with ID:', groupId);

if (groupId) {
  setCreatedGroupId(groupId);
  setMessage('✅ Trip created successfully! Your travel squad is ready!');
  
  setTimeout(() => {
    console.log('🔄 Redirecting to:', `/groups/${groupId}/invite-friends`);
    
    // SIMPLE REDIRECTION - pass groupId in state
    navigate(`/groups/${groupId}/invite-friends`, { 
      state: { 
        groupId: groupId, // This is the KEY FIX
        groupName: formData.destination,
        fromCreate: true 
      }
    });
    
  }, 2000);
} else {
  console.error('❌ No group ID in response:', res.data);
  setMessage('Trip created! Check your groups list.');
  setTimeout(() => navigate('/groups'), 2000);
}
      
    } catch (error) {
      console.error('❌ Error creating group:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      setFormSubmitted(false);
      setLoading(false);
      setMessage(error.response?.data?.message || 'Oops! Something went wrong. Try again!');
      
      // Scroll to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  // Render Step 1: Basic Info
  const renderStep1 = () => (
    <div className="space-y-6" data-step="1">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Let's Plan Your Adventure! 🌍</h3>
        <p className="text-gray-600">Tell us about your trip. Be specific to find perfect travel buddies!</p>
      </div>
      
      {/* Starting Location */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-gray-700 font-medium flex items-center">
            <FaLocationArrow className="mr-2 text-green-500" />
            Starting From *
          </label>
          <button
            type="button"
            onClick={() => {
              console.log('📍 Use my location button clicked');
              getLocation();
            }}
            className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 flex items-center transition-colors"
          >
            <FaLocationArrow className="mr-1" />
            Use My Location
          </button>
        </div>
        
        <LocationPicker
          id="starting-location"
          placeholder="e.g., Mumbai, Delhi, Bangalore or your current city"
          value={formData.startingLocation}
          onLocationSelect={(data) => handleLocationSelect('starting', data)}
          initialLocation={userLocation ? {
            lat: userLocation.latitude,
            lng: userLocation.longitude,
            address: `Your Current Location (${userLocation.city || 'Nearby'})`
          } : null}
          className={`${errors.startingLocation ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
        />
        
        {errors.startingLocation && (
          <div className="mt-2 flex items-center text-red-600 text-sm">
            <FaExclamationCircle className="mr-2" />
            {errors.startingLocation}
          </div>
        )}
        <div className="text-sm text-gray-500">
          {formData.startingLocationCoords ? 
            `📍 Coordinates: ${formData.startingLocationCoords.lat.toFixed(4)}, ${formData.startingLocationCoords.lng.toFixed(4)}` : 
            'Select where your journey begins for route planning'}
        </div>
      </div>
      
      {/* Destination with Map Pin */}
      <div className="space-y-4">
        <label className="block text-gray-700 font-medium flex items-center">
          <FaMapMarkerAlt className="mr-2 text-red-500" />
          Destination *
        </label>
        
        <LocationPicker
          id="destination"
          placeholder="e.g., Goa beaches, Paris cafes, Bali waterfalls"
          value={formData.destination}
          onLocationSelect={(data) => handleLocationSelect('destination', data)}
          className={`${errors.destination ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
        />
        
        {errors.destination && (
          <div className="mt-2 flex items-center text-red-600 text-sm">
            <FaExclamationCircle className="mr-2" />
            {errors.destination}
          </div>
        )}
        <div className="text-sm text-gray-500">
          {formData.destinationCoords ? 
            `📍 Coordinates: ${formData.destinationCoords.lat.toFixed(4)}, ${formData.destinationCoords.lng.toFixed(4)}` : 
            'Pro tip: Be specific for better matches!'}
        </div>
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-gray-700 mb-2 font-medium">Trip Vibes & Plan 🗺️ *</label>
        <textarea 
          name="description" 
          placeholder="Describe your trip vibe... Are you planning specific activities? Any must-visit spots? What's the energy like? ✨" 
          value={formData.description}
          onChange={handleChange}
          required 
          rows="5"
          className={`border-2 p-4 w-full rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
        />
        {errors.description && (
          <div className="mt-2 flex items-center text-red-600 text-sm">
            <FaExclamationCircle className="mr-2" />
            {errors.description}
          </div>
        )}
      </div>
      
      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl border-2 border-gray-100">
          <label className="block text-gray-700 mb-2 font-medium flex items-center">
            <FaCalendarAlt className="mr-2 text-green-500" />
            Start Date *
          </label>
          <input 
            type="date" 
            name="startDate" 
            value={formData.startDate}
            onChange={handleChange}
            min={today}
            required 
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
          />
          {errors.startDate && (
            <div className="mt-2 flex items-center text-red-600 text-sm">
              <FaExclamationCircle className="mr-2" />
              {errors.startDate}
            </div>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-xl border-2 border-gray-100">
          <label className="block text-gray-700 mb-2 font-medium flex items-center">
            <FaCalendarAlt className="mr-2 text-purple-500" />
            End Date *
          </label>
          <input 
            type="date" 
            name="endDate" 
            value={formData.endDate}
            onChange={handleChange}
            min={formData.startDate || today}
            required 
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
          />
          {errors.endDate && (
            <div className="mt-2 flex items-center text-red-600 text-sm">
              <FaExclamationCircle className="mr-2" />
              {errors.endDate}
            </div>
          )}
        </div>
      </div>
      
      {/* Route Preview (if both locations selected) */}
      {formData.startingLocationCoords && formData.destinationCoords && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
          <h4 className="font-bold text-blue-800 mb-2 flex items-center">
            <FaMapMarkerAlt className="mr-2" />
            Route Preview
          </h4>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium text-green-600">📍 {formData.startingLocation}</div>
              <div className="text-xs text-gray-500 mt-1">→</div>
              <div className="font-medium text-red-600">🎯 {formData.destination}</div>
            </div>
            <div className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              Route saved for planning
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render Step 2: Budget & Group Settings (UPDATED WITH SLIDERS)
  const renderStep2 = () => (
    <div className="space-y-6" data-step="2">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Money & Squad Vibes 💸👥</h3>
        <p className="text-gray-600">Set your budget and squad preferences</p>
      </div>
      
      {/* Budget Section - Updated with Sliders */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-100">
        <label className="block text-gray-700 mb-4 font-medium flex items-center">
          <FaMoneyBillWave className="mr-2 text-green-500" />
          Budget Range (Per Person) *
        </label>
        
        {/* Budget Presets */}
        <div className="mb-6">
          <p className="text-gray-600 mb-3">Quick presets:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {budgetPresets.map(preset => (
              <button
                type="button"
                key={preset.label}
                onClick={() => handleBudgetPreset(preset)}
                className={`p-3 rounded-lg border-2 flex flex-col items-center transition-all ${
                  parseInt(formData.minBudget) === preset.min && parseInt(formData.maxBudget) === preset.max
                    ? 'border-green-500 bg-green-50 transform scale-105'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <span className="text-2xl mb-1">{preset.icon}</span>
                <span className="text-sm font-medium">{preset.label}</span>
                <span className="text-xs text-gray-500 mt-1">
                  ₹{preset.min.toLocaleString()} - ₹{preset.max.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Budget Sliders */}
        <div className="space-y-8">
          {/* Minimum Budget Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-gray-600 font-medium flex items-center">
                <FaRupeeSign className="mr-1" />
                Minimum Budget
              </label>
              <span className="font-bold text-green-600">
                {formatCurrency(parseInt(formData.minBudget))}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={formData.minBudget}
                onChange={handleMinBudgetChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${((parseInt(formData.minBudget) - 1000) / (100000 - 1000)) * 100}%, #e5e7eb ${((parseInt(formData.minBudget) - 1000) / (100000 - 1000)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>₹1,000</span>
                <span>₹50,000</span>
                <span>₹1,00,000</span>
              </div>
            </div>
          </div>
          
          {/* Maximum Budget Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-gray-600 font-medium flex items-center">
                <FaRupeeSign className="mr-1" />
                Maximum Budget
              </label>
              <span className="font-bold text-green-600">
                {formatCurrency(parseInt(formData.maxBudget))}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={formData.maxBudget}
                onChange={handleMaxBudgetChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((parseInt(formData.maxBudget) - 1000) / (100000 - 1000)) * 100}%, #e5e7eb ${((parseInt(formData.maxBudget) - 1000) / (100000 - 1000)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>₹1,000</span>
                <span>₹50,000</span>
                <span>₹1,00,000</span>
              </div>
            </div>
          </div>
          
          {/* Budget Display */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">Your Budget Range</div>
                <div className="text-2xl font-bold text-gray-800">
                  {formatCurrency(parseInt(formData.minBudget))} - {formatCurrency(parseInt(formData.maxBudget))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Average</div>
                <div className="text-xl font-bold text-purple-600">
                  {formatCurrency((parseInt(formData.minBudget) + parseInt(formData.maxBudget)) / 2)}
                </div>
              </div>
            </div>
            
            {/* Budget Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Budget Range</span>
                <span>{formatCurrency(parseInt(formData.maxBudget) - parseInt(formData.minBudget))} range</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full relative"
                  style={{ 
                    width: `${((parseInt(formData.maxBudget) - 1000) / (100000 - 1000)) * 100}%`,
                    left: `${((parseInt(formData.minBudget) - 1000) / (100000 - 1000)) * 100}%`
                  }}
                >
                  <div className="absolute -left-1 -top-1 w-5 h-5 bg-green-600 rounded-full border-2 border-white"></div>
                  <div className="absolute -right-1 -top-1 w-5 h-5 bg-blue-600 rounded-full border-2 border-white"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Min: {formatCurrency(parseInt(formData.minBudget))}</span>
                <span>Max: {formatCurrency(parseInt(formData.maxBudget))}</span>
              </div>
            </div>
          </div>
        </div>
        
        {errors.minBudget && (
          <div className="mt-2 flex items-center text-red-600 text-sm">
            <FaExclamationCircle className="mr-2" />
            {errors.minBudget}
          </div>
        )}
        
        {errors.maxBudget && (
          <div className="mt-2 flex items-center text-red-600 text-sm">
            <FaExclamationCircle className="mr-2" />
            {errors.maxBudget}
          </div>
        )}
      </div>
      
      {/* Group Size */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-100">
        <label className="block text-gray-700 mb-4 font-medium flex items-center">
          <FaUsers className="mr-2 text-blue-500" />
          Squad Size *
        </label>
        
        <div className="flex flex-wrap gap-3">
          {[2, 4, 6, 8, 10, 15, 20].map(size => (
            <button
              type="button"
              key={size}
              onClick={() => {
                console.log('👥 Group size selected:', size);
                setFormData({...formData, maxMembers: size.toString()});
              }}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                parseInt(formData.maxMembers) === size 
                  ? 'border-blue-500 bg-blue-50 text-blue-600 transform scale-105' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="font-bold text-lg">{size}</div>
              <div className="text-sm text-gray-500">people</div>
            </button>
          ))}
        </div>
        
        {errors.maxMembers && (
          <div className="mt-2 flex items-center text-red-600 text-sm">
            <FaExclamationCircle className="mr-2" />
            {errors.maxMembers}
          </div>
        )}
        
        <div className="mt-4">
          <label className="block text-gray-600 mb-2">Group Type</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                console.log('🏷️ Group type selected: open');
                setFormData({...formData, groupType: 'open'});
              }}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                formData.groupType === 'open' 
                  ? 'border-green-500 bg-green-50 transform scale-105' 
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
              }`}
            >
              <div className="font-bold">Open</div>
              <div className="text-sm text-gray-500">Anyone can join</div>
            </button>
            
            <button
              type="button"
              onClick={() => {
                console.log('🏷️ Group type selected: verified');
                setFormData({...formData, groupType: 'verified'});
              }}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                formData.groupType === 'verified' 
                  ? 'border-yellow-500 bg-yellow-50 transform scale-105' 
                  : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
              }`}
            >
              <div className="font-bold">Verified</div>
              <div className="text-sm text-gray-500">Profile verified</div>
            </button>
            
            <button
              type="button"
              onClick={() => {
                console.log('🏷️ Group type selected: invite');
                setFormData({...formData, groupType: 'invite'});
              }}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                formData.groupType === 'invite' 
                  ? 'border-purple-500 bg-purple-50 transform scale-105' 
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
              }`}
            >
              <div className="font-bold">Invite Only</div>
              <div className="text-sm text-gray-500">By approval</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 3: Travel Preferences (Optional)
  const renderStep3 = () => (
    <div className="space-y-6" data-step="3">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Travel Style & Preferences 🎯</h3>
        <p className="text-gray-600">Match with like-minded travelers (Optional but recommended!)</p>
      </div>
      
      {/* Travel Style */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-100">
        <label className="block text-gray-700 mb-4 font-medium">Travel Style (Select all that match)</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {travelStyles.map(style => (
            <button
              type="button"
              key={style.id}
              onClick={() => handleMultiSelect('travelStyle', style.id)}
              className={`p-3 rounded-lg border-2 flex flex-col items-center transition-all ${
                formData.travelStyle.includes(style.id) 
                  ? 'border-blue-500 bg-blue-50 transform scale-105' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <span className="text-2xl mb-1">{style.icon}</span>
              <span className="text-sm font-medium">{style.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Transport Mode */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-100">
        <label className="block text-gray-700 mb-4 font-medium flex items-center">
          <FaCar className="mr-2 text-orange-500" />
          How are you traveling? (Optional)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {transportModes.map(mode => (
            <button
              type="button"
              key={mode.id}
              onClick={() => handleMultiSelect('transportMode', mode.id)}
              className={`p-3 rounded-lg border-2 flex items-center justify-center transition-all ${
                formData.transportMode.includes(mode.id) 
                  ? 'border-orange-500 bg-orange-50 transform scale-105' 
                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              <span className="text-xl mr-2">{mode.icon}</span>
              <span className="text-sm font-medium">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Lifestyle Preferences */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-100">
        <label className="block text-gray-700 mb-4 font-medium">Lifestyle Preferences (Optional)</label>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaSmoking className="mr-3 text-gray-500" />
              <span>Smoking Allowed?</span>
            </div>
            <div className="flex space-x-2">
              {['no', 'outside', 'yes'].map(option => (
                <button
                  type="button"
                  key={option}
                  onClick={() => {
                    console.log('🚬 Smoking option selected:', option);
                    setFormData({...formData, smokingAllowed: option});
                  }}
                  className={`px-4 py-2 rounded-lg capitalize transition-all ${
                    formData.smokingAllowed === option 
                      ? 'bg-gray-800 text-white transform scale-105' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaWineGlass className="mr-3 text-purple-500" />
              <span>Drinking?</span>
            </div>
            <div className="flex space-x-2">
              {['no', 'social', 'yes'].map(option => (
                <button
                  type="button"
                  key={option}
                  onClick={() => {
                    console.log('🍷 Drinking option selected:', option);
                    setFormData({...formData, drinkingAllowed: option});
                  }}
                  className={`px-4 py-2 rounded-lg capitalize transition-all ${
                    formData.drinkingAllowed === option 
                      ? 'bg-purple-500 text-white transform scale-105' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaPaw className="mr-3 text-yellow-500" />
              <span>Pets Friendly?</span>
            </div>
            <div className="flex space-x-2">
              {['no', 'small', 'yes'].map(option => (
                <button
                  type="button"
                  key={option}
                  onClick={() => {
                    console.log('🐾 Pets option selected:', option);
                    setFormData({...formData, petsAllowed: option});
                  }}
                  className={`px-4 py-2 rounded-lg capitalize transition-all ${
                    formData.petsAllowed === option 
                      ? 'bg-yellow-500 text-white transform scale-105' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaVenusMars className="mr-3 text-pink-500" />
              <span>Gender Preference</span>
            </div>
            <select 
              name="genderPreference" 
              value={formData.genderPreference}
              onChange={(e) => {
                console.log('⚧️ Gender preference selected:', e.target.value);
                handleChange(e);
              }}
              className="border p-2 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
            >
              <option value="any">Any Gender</option>
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
              <option value="mixed">Mixed Group</option>
              <option value="lgbtq">LGBTQ+ Friendly</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 4: Interests & Tags (Optional) - UPDATED to prevent auto-submit
  const renderStep4 = () => (
    <div className="space-y-6" data-step="4">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Interests & Activities 🎉</h3>
        <p className="text-gray-600">What makes your trip special? (Optional but recommended for better matches!)</p>
      </div>
      
      {/* Interests */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-100">
        <label className="block text-gray-700 mb-4 font-medium">What are you into? (Select 3-5 recommended)</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {interestsList.map(interest => (
            <button
              type="button"
              key={interest.id}
              onClick={() => handleMultiSelect('interests', interest.id)}
              className={`p-3 rounded-lg border-2 flex flex-col items-center transition-all duration-200 ${
                formData.interests.includes(interest.id) 
                  ? 'border-yellow-500 bg-yellow-50 transform scale-105' 
                  : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
              }`}
            >
              <span className="text-2xl mb-1">{interest.icon}</span>
              <span className="text-sm font-medium">{interest.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 text-sm text-gray-500 flex items-center">
          <div className="mr-3">Selected: <span className="font-bold">{formData.interests.length}</span> interests</div>
          {formData.interests.length < 3 && (
            <div className="text-amber-600 flex items-center">
              <FaExclamationCircle className="mr-1" />
              Select at least 3 interests for better matches!
            </div>
          )}
        </div>
      </div>
      
      {/* Tags */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-100">
        <label className="block text-gray-700 mb-2 font-medium">
          Tags (Optional)
          <span className="text-gray-500 text-sm ml-2">Add specific keywords like #foodietour #himalayatrek</span>
        </label>
        <input 
          type="text" 
          name="tags" 
          placeholder="#beachvibes #foodietour #adventure #solotravel #digitalnomad" 
          value={formData.tags}
          onChange={handleChange}
          className="border-2 border-gray-200 p-4 w-full rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        
        {/* Popular Tags */}
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">Popular tags:</p>
          <div className="flex flex-wrap gap-2">
            {['#roadtrip', '#hiking', '#foodie', '#photography', '#culture', '#party', '#wellness', '#budget'].map(tag => (
              <button
                type="button"
                key={tag}
                onClick={() => {
                  console.log('🏷️ Tag clicked:', tag);
                  const currentTags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
                  if (!currentTags.includes(tag)) {
                    setFormData({
                      ...formData,
                      tags: [...currentTags, tag].join(', ')
                    });
                  }
                }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Friend Invitation Option */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-100">
        <label className="block text-gray-700 mb-4 font-medium flex items-center">
          <FaUserFriends className="mr-2 text-purple-500" />
          Invite Friends to Your Trip
        </label>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="inviteFriendsAfterCreate"
              name="inviteFriendsAfterCreate"
              checked={formData.inviteFriendsAfterCreate}
              onChange={(e) => {
                console.log('👥 Invite friends checkbox:', e.target.checked);
                handleChange(e);
              }}
              className="mt-1 mr-3 h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <div>
              <label htmlFor="inviteFriendsAfterCreate" className="font-medium text-gray-700 cursor-pointer">
                Send invitation requests to my friends
              </label>
              <p className="text-sm text-gray-600 mt-1">
                After creating the trip, you'll be redirected to a page where you can select friends to invite.
                They'll receive a request: "Hey, I'm going on a trip! Want to join me?"
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span>Select friends from your followers/friends list</span>
          </div>
          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span>They can accept or decline your invitation</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span>Accepted friends automatically join your travel squad</span>
          </div>
        </div>
      </div>
      
      {/* Confirmation Section */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Ready to find your travel squad? 🚀</h3>
        <div className="space-y-2 mb-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span>Your trip will be visible to matching travelers</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span>Get join requests from verified travelers</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span>Chat with squad before finalizing plans</span>
          </div>
          {formData.inviteFriendsAfterCreate && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span className="font-medium text-purple-700">You'll be able to invite friends after creation</span>
            </div>
          )}
        </div>
        
        {/* Confirmation Check */}
        <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="confirmReady"
              checked={confirmationChecked}
              onChange={(e) => {
                console.log('✅ Confirmation checkbox:', e.target.checked);
                setConfirmationChecked(e.target.checked);
              }}
              className="mt-1 mr-3 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <label htmlFor="confirmReady" className="font-medium text-gray-700 cursor-pointer">
                I confirm that I've reviewed all trip details
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Check this box to enable the "Create Trip" button. This ensures you've had time to review all your selections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {step} of 4</span>
            <span className="text-sm font-medium text-gray-600">{step * 25}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${step * 25}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-2">
            <span className={`text-sm ${step >= 1 ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>Trip Details</span>
            <span className={`text-sm ${step >= 2 ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>Budget</span>
            <span className={`text-sm ${step >= 3 ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>Preferences</span>
            <span className={`text-sm ${step >= 4 ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>Interests</span>
          </div>
        </div>
        
        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Your Travel Squad ✈️</h2>
            <p className="text-gray-600 mb-8">Find your perfect travel buddies with matching vibes!</p>
            
            {/* Main Message */}
            {message && (
              <div className={`mb-6 p-4 rounded-xl ${
                message.includes('Error') || message.includes('Please') || message.includes('Oops')
                  ? 'bg-red-50 border border-red-200 text-red-700' 
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
                <div className="flex items-center">
                  <span className="text-xl mr-2">
                    {message.includes('Error') || message.includes('Please') || message.includes('Oops') ? '❌' : '✨'}
                  </span>
                  {message}
                </div>
                {createdGroupId && formData.inviteFriendsAfterCreate && (
                  <div className="mt-2 text-sm">
                    Redirecting to friend invitation page in 5 seconds...
                  </div>
                )}
              </div>
            )}
            
            {/* Required Fields Notice */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center">
                <FaExclamationCircle className="text-blue-500 mr-2" />
                <span className="text-sm text-blue-700">
                  <span className="font-semibold">Note:</span> Steps 1 & 2 are required. Steps 3 & 4 are optional but recommended for better matches!
                </span>
              </div>
            </div>
            
            <form ref={formRef} onSubmit={handleSubmit}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between mt-12 pt-8 border-t">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                    ← Back
                  </button>
                ) : (
                  <div></div>
                )}
                
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 font-medium shadow-lg flex items-center transition-all"
                  >
                    Continue →
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={loading || !formData.startingLocationCoords || !formData.destinationCoords || !confirmationChecked}
                    className="px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 font-medium shadow-lg text-lg disabled:opacity-50 transition-all"
                    onClick={() => console.log('🚀 Create button clicked, confirmation checked:', confirmationChecked)}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        {createdGroupId ? 'Redirecting...' : 'Creating Your Squad...'}
                      </span>
                    ) : (
                      <>
                        <FaCheckCircle className="inline mr-2" />
                        {formData.inviteFriendsAfterCreate ? 'Create & Invite Friends →' : 'Create My Travel Squad! 🚀'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Quick Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="text-3xl mb-3">🗺️</div>
            <h4 className="font-bold text-gray-800 mb-2">Route Planning</h4>
            <p className="text-gray-600 text-sm">Starting location enables accurate route planning and distance calculation</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="text-3xl mb-3">👥</div>
            <h4 className="font-bold text-gray-800 mb-2">Better Matches</h4>
            <p className="text-gray-600 text-sm">Detailed preferences help find travel buddies with similar vibes</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="text-3xl mb-3">💬</div>
            <h4 className="font-bold text-gray-800 mb-2">Group Chat</h4>
            <p className="text-gray-600 text-sm">Plan together in real-time with built-in group chat</p>
          </div>
        </div>
      </div>

      {/* Add CSS for custom slider styling */}
      <style jsx>{`
        .slider-green::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .slider-blue::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .slider-green::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .slider-blue::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default CreateTripPage;