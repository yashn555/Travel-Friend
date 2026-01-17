import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import { verifyOTP, resendOTP } from '../../services/authService';
import { loginAsync } from '../../redux/slices/authSlice';
import { FaEnvelope, FaClock, FaRedo, FaCheckCircle } from 'react-icons/fa';

const VerifyOTPPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const inputRefs = useRef([]);
  
  useEffect(() => {
    // Get user data from localStorage
    console.log('🔍 Checking localStorage for pending verification...');
    const pendingVerification = localStorage.getItem('pendingVerification');
    
    if (pendingVerification) {
      try {
        const data = JSON.parse(pendingVerification);
        console.log('📋 Parsed pending verification:', data);
        
        if (data.userId && data.email) {
          setUserEmail(data.email);
          setUserId(data.userId);
          
          // Show OTP in console for testing
          if (data.otp) {
            console.log('🔐 TEST OTP:', data.otp);
            toast.info(`OTP for testing: ${data.otp} (Check console)`);
          }
          
          console.log('✅ Loaded user data:', { email: data.email, userId: data.userId });
        } else {
          console.error('❌ Invalid pending verification data:', data);
          toast.error('Invalid verification data. Please register again.');
          navigate('/register');
        }
      } catch (error) {
        console.error('❌ Error parsing pending verification:', error);
        toast.error('Invalid verification data. Please register again.');
        navigate('/register');
      }
    } else {
      console.log('❌ No pending verification found in localStorage');
      toast.error('Please register first');
      navigate('/register');
    }
    
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate]);
  
  // ✅ ADD THIS FUNCTION BACK - formatTime function
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
  
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = [...otp];
    
    pastedData.split('').forEach((char, index) => {
      if (index < 6 && /^\d$/.test(char)) {
        newOtp[index] = char;
      }
    });
    
    setOtp(newOtp);
    
    const lastIndex = Math.min(pastedData.length, 5);
    if (inputRefs.current[lastIndex]) {
      inputRefs.current[lastIndex].focus();
    }
  };
  
  const handleSubmit = async () => {
    const otpString = otp.join('');
    
    console.log('🔐 Submitting OTP:', otpString, 'for user:', userId);
    
    if (otpString.length !== 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }
    
    if (!userId) {
      toast.error('User ID not found. Please register again.');
      navigate('/register');
      return;
    }
    
    setIsLoading(true);
    setVerificationStatus('verifying');
    
    try {
      console.log('🚀 Calling verifyOTP API...');
      const result = await verifyOTP(userId, otpString);
      console.log('✅ OTP verification result:', result);
      
      if (result.success) {
        console.log('🎉 OTP verified successfully!');
        setVerificationStatus('success');
        toast.success('Account verified successfully!');
        
        // Store token and user in Redux
        if (result.token && result.user) {
          console.log('🔄 Dispatching loginAsync...');
          dispatch(loginAsync({
            token: result.token,
            user: result.user
          }));
        }
        
        // Clear pending verification
        localStorage.removeItem('pendingVerification');
        
        console.log('📍 Redirecting to dashboard...');
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        console.error('❌ OTP verification failed:', result.message);
        toast.error(result.message || 'Verification failed');
      }
    } catch (error) {
      setVerificationStatus('error');
      console.error('❌ OTP verification error:', error);
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      toast.error(error.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    if (!userId) {
      toast.error('User ID not found. Please register again.');
      navigate('/register');
      return;
    }
    
    setIsResending(true);
    try {
      const result = await resendOTP(userId);
      setTimeLeft(600);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      toast.success(result.message || 'New OTP sent to your email');
      
      // Store new OTP in localStorage for testing
      if (result.otp) {
        console.log('🔐 NEW OTP:', result.otp);
        const currentData = JSON.parse(localStorage.getItem('pendingVerification') || '{}');
        currentData.otp = result.otp;
        localStorage.setItem('pendingVerification', JSON.stringify(currentData));
        toast.info(`New OTP: ${result.otp} (Check console for testing)`);
      }
    } catch (error) {
      console.error('❌ Resend OTP error:', error);
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };
  
  const renderVerificationStatus = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <div className="flex items-center justify-center space-x-2 text-blue-600 mb-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Verifying OTP...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
            <FaCheckCircle className="text-xl" />
            <span className="font-medium">Account Verified Successfully!</span>
          </div>
        );
      case 'error':
        return (
          <div className="text-red-600 text-center mb-4">
            Verification failed. Please try again.
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaEnvelope className="text-blue-600 text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600 mb-2">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-blue-600 font-medium break-all">{userEmail}</p>
          
          {renderVerificationStatus()}
        </div>
        
        <div className="mb-8">
          <label className="label text-center block mb-4">
            Enter 6-digit verification code
          </label>
          <div className="flex justify-center space-x-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={isLoading || verificationStatus === 'success'}
                className="w-14 h-14 text-2xl font-bold text-center border-2 border-gray-300 rounded-lg 
                         focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
                         disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              />
            ))}
          </div>
          
          <div className="flex items-center justify-center space-x-4 mb-8">
            <FaClock className="text-gray-400" />
            <span className={`text-lg font-medium ${timeLeft < 60 ? 'text-red-600' : 'text-gray-700'}`}>
              {formatTime(timeLeft)}
            </span>
            <span className="text-gray-500">remaining</span>
          </div>
          
          <Button
            onClick={handleSubmit}
            className="w-full"
            isLoading={isLoading}
            disabled={verificationStatus === 'success' || otp.join('').length !== 6}
          >
            {verificationStatus === 'success' ? 'Redirecting...' : 'Verify Account'}
          </Button>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <p className="text-center text-gray-600 mb-4">
            Didn't receive the code?
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="secondary"
              onClick={handleResendOTP}
              isLoading={isResending}
              disabled={timeLeft > 540 || verificationStatus === 'success'}
              className="flex-1"
            >
              <FaRedo className="mr-2" />
              Resend OTP {timeLeft > 540 ? `(${Math.ceil((timeLeft - 540) / 60)}min)` : ''}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                localStorage.removeItem('pendingVerification');
                navigate('/register');
              }}
              className="flex-1"
            >
              Change Email
            </Button>
          </div>
        </div>
        
        {/* Debug Section */}
        <div className="mt-8 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-center text-sm text-gray-500 mb-2">
            Check your spam folder if you don't see the email.
          </p>
          <button
            onClick={() => {
              const pending = localStorage.getItem('pendingVerification');
              console.log('📋 Current pending verification:', pending);
              console.log('👤 Current state:', { userId, userEmail, otp: otp.join('') });
            }}
            className="text-xs text-blue-500 hover:text-blue-600 w-full text-center"
          >
            Debug Info
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;