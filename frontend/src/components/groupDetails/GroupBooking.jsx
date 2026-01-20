// frontend/src/components/groupDetails/GroupBooking.jsx
import React, { useState, useEffect } from 'react';
import { FaHotel, FaBus, FaTrain, FaPlane, FaCar, FaCreditCard, FaBuilding, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { createGroupBooking, getGroupBookings } from '../../services/tripService';

const GroupBooking = ({ group, isCreator }) => {
  const [bookingType, setBookingType] = useState('hotel');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentStep, setPaymentStep] = useState('select');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [group._id]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getGroupBookings(group._id);
      if (response.success) {
        setBookings(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSelect = (pkg) => {
    setSelectedPackage(pkg);
    setPaymentStep('review');
  };

  const handlePayment = async () => {
    if (!selectedPackage) return;
    
    try {
      setProcessing(true);
      const bookingData = {
        groupId: group._id,
        bookingType: selectedPackage.type || bookingType,
        provider: selectedPackage.provider,
        packageName: selectedPackage.name,
        description: selectedPackage.description,
        totalAmount: selectedPackage.totalPrice,
        details: selectedPackage.features,
        paymentMethod: 'razorpay'
      };
      
      const response = await createGroupBooking(bookingData);
      
      if (response.success) {
        setPaymentStep('success');
        await fetchBookings(); // Refresh bookings
        toast.success('Booking created successfully!');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
      setPaymentStep('select');
    } finally {
      setProcessing(false);
    }
  };

  const renderBookingPackages = () => {
    // These would come from your backend API in production
    // For now, showing empty state if no packages are available
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <FaBuilding className="text-gray-400 text-4xl mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Booking Packages Available</h3>
        <p className="text-gray-600 mb-4">Booking packages will be available soon.</p>
        <p className="text-sm text-gray-500">In production, these would come from your backend API.</p>
      </div>
    );
  };

  const renderExistingBookings = () => {
    if (bookings.length === 0) return null;
    
    return (
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Existing Bookings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((booking, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-gray-800">{booking.packageName}</h4>
                  <p className="text-gray-600 text-sm">by {booking.provider}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status}
                </span>
              </div>
              <p className="text-gray-700 text-sm mb-3">{booking.description}</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">₹{booking.totalAmount?.toLocaleString()}</p>
                  <p className="text-gray-600 text-xs">Total amount</p>
                </div>
                <p className="text-gray-600 text-sm">
                  {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaBuilding className="mr-2 text-green-500" />
          Group Booking & Packages
        </h2>
        <p className="text-gray-600 mt-2">
          Book hotels, transport, or complete packages for your entire group. Special group discounts available.
        </p>
        {!isCreator && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">
              Note: Only group creator can make bookings. Contact your group admin for booking requests.
            </p>
          </div>
        )}
      </div>

      {/* Booking Type Selector */}
      {paymentStep === 'select' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">What would you like to book?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setBookingType('hotel')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center transition-all ${
                bookingType === 'hotel' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <FaHotel className={`text-2xl mb-2 ${bookingType === 'hotel' ? 'text-blue-500' : 'text-gray-500'}`} />
              <span className="font-medium">Hotels</span>
            </button>
            
            <button
              onClick={() => setBookingType('transport')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center transition-all ${
                bookingType === 'transport' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
              }`}
            >
              <FaBus className={`text-2xl mb-2 ${bookingType === 'transport' ? 'text-green-500' : 'text-gray-500'}`} />
              <span className="font-medium">Transport</span>
            </button>
            
            <button
              onClick={() => setBookingType('flight')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center transition-all ${
                bookingType === 'flight' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
              }`}
            >
              <FaPlane className={`text-2xl mb-2 ${bookingType === 'flight' ? 'text-purple-500' : 'text-gray-500'}`} />
              <span className="font-medium">Flights</span>
            </button>
            
            <button
              onClick={() => setBookingType('package')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center transition-all ${
                bookingType === 'package' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              <FaCreditCard className={`text-2xl mb-2 ${bookingType === 'package' ? 'text-orange-500' : 'text-gray-500'}`} />
              <span className="font-medium">Full Package</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading booking information...</p>
        </div>
      )}

      {/* Booking Packages or Existing Bookings */}
      {!loading && paymentStep === 'select' && (
        <>
          {renderBookingPackages()}
          {renderExistingBookings()}
        </>
      )}

      {/* Payment Steps */}
      {paymentStep === 'review' && selectedPackage && (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Review Booking</h3>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-800">{selectedPackage.name}</h4>
                <p className="text-gray-600 text-sm">Provider: {selectedPackage.provider}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-800">₹{selectedPackage.totalPrice.toLocaleString()}</p>
                <p className="text-gray-600 text-sm">Total amount</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Group Size</p>
                <p className="font-semibold text-gray-800">{group.currentMembers?.length || 1} travelers</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Destination</p>
                <p className="font-semibold text-gray-800">{group.destination}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => setPaymentStep('select')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={handlePayment}
              disabled={processing || !isCreator}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {processing ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </button>
          </div>
        </div>
      )}
      
      {paymentStep === 'success' && selectedPackage && (
        <div className="text-center py-12 bg-gradient-to-b from-green-50 to-white rounded-xl border border-green-200">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <FaCheckCircle className="text-3xl text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Booking Confirmed! 🎉</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Your group booking has been successfully processed.
          </p>
          <div className="bg-white p-6 rounded-lg border border-green-200 max-w-md mx-auto">
            <h4 className="font-semibold text-gray-800 mb-3">Booking Summary</h4>
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Package:</span>
                <span className="font-medium">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Provider:</span>
                <span className="font-medium">{selectedPackage.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-green-600">₹{selectedPackage.totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Confirmed</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setPaymentStep('select');
              setSelectedPackage(null);
            }}
            className="mt-8 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Make Another Booking
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupBooking;