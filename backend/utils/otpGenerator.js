// Generate 6-digit OTP
exports.generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`🔑 OTP Generated: ${otp}`);
  return otp;
};

// Calculate OTP expiry time (10 minutes from now)
exports.getOTPExpiry = () => {
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  console.log(`⏰ OTP Expires at: ${expiry.toLocaleTimeString()}`);
  return expiry;
};

// Check if OTP is expired
exports.isOTPExpired = (expiryTime) => {
  const now = new Date();
  const expiry = new Date(expiryTime);
  const expired = now > expiry;
  
  if (expired) {
    console.log('⏰ OTP has EXPIRED');
  } else {
    const minutesLeft = Math.ceil((expiry - now) / 60000);
    console.log(`⏰ OTP valid for ${minutesLeft} more minutes`);
  }
  
  return expired;
};