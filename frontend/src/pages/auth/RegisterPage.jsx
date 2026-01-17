// src/pages/auth/RegisterPage.jsx - FIXED VERSION
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import { registerUser } from '../../services/authService';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  
  const password = watch('password');
  
  const onSubmit = async (data) => {
  setIsLoading(true);
  try {
    console.log('🚀 Registering user with data:', data);
    const result = await registerUser(data);
    
    console.log('📦 Registration result:', result);
    
    if (result.success) {
      // ✅ Store user data for OTP verification
      const pendingData = {
        userId: result.userId || result.data?.userId,
        email: result.email || data.email,
        name: result.name || data.name,
        otp: result.otp // For testing
      };
      
      console.log('💾 Storing pending verification:', pendingData);
      localStorage.setItem('pendingVerification', JSON.stringify(pendingData));
      
      toast.success(result.message || 'Registration successful! Please check your email for OTP.');
      
      // Show OTP for testing
      if (pendingData.otp) {
        console.log('🔐 OTP for testing:', pendingData.otp);
        toast.info(`OTP: ${pendingData.otp} (Check console)`);
      }
      
      // Navigate to verify OTP page
      console.log('📍 Navigating to verify-otp page');
      setTimeout(() => {
        navigate('/verify-otp');
      }, 1500);
      
    } else {
      toast.error(result.message || 'Registration failed');
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    toast.error(error.message || 'Registration failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
  
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join Traveler Friend community
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <InputField
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              icon={<FaUser className="text-gray-400" />}
              error={errors.name}
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                },
                maxLength: {
                  value: 50,
                  message: 'Name cannot exceed 50 characters'
                }
              })}
            />
            
            <InputField
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              icon={<FaEnvelope className="text-gray-400" />}
              error={errors.email}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            
            <InputField
              label="Mobile Number"
              type="tel"
              placeholder="Enter 10-digit mobile number"
              icon={<FaPhone className="text-gray-400" />}
              error={errors.mobile}
              {...register('mobile', {
                required: 'Mobile number is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Please enter a valid 10-digit mobile number'
                }
              })}
            />
            
            <div className="relative">
              <InputField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                icon={<FaLock className="text-gray-400" />}
                error={errors.password}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                  // Removed complex pattern for testing
                })}
              />
              <button
                type="button"
                className="absolute right-4 top-12 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            <div className="relative">
              <InputField
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                icon={<FaLock className="text-gray-400" />}
                error={errors.confirmPassword}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
              />
              <button
                type="button"
                className="absolute right-4 top-12 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign In
            </Link>
          </p>
        </div>
        
        {/* Debug Section */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            For testing: OTP will be shown in browser console after registration
          </p>
          <button
            type="button"
            onClick={() => {
              const pending = localStorage.getItem('pendingVerification');
              console.log('Current pending verification:', pending);
            }}
            className="text-xs text-blue-500 hover:text-blue-600 mt-1"
          >
            Check Stored Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;