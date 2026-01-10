// Generate 6-digit OTP
exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Calculate OTP expiry time (10 minutes from now)
exports.getOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

// Check if OTP is expired
exports.isOTPExpired = (expiryTime) => {
  return new Date() > new Date(expiryTime);
};