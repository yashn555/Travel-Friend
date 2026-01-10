// Validation patterns
export const patterns = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  mobile: /^[0-9]{10}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
};

// Validation functions
export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!patterns.email.test(email)) return 'Invalid email address';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (!patterns.password.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }
  return '';
};

export const validateMobile = (mobile) => {
  if (!mobile) return 'Mobile number is required';
  if (!patterns.mobile.test(mobile)) {
    return 'Please enter a valid 10-digit mobile number';
  }
  return '';
};

export const validateName = (name) => {
  if (!name) return 'Name is required';
  if (name.length < 2) return 'Name must be at least 2 characters';
  if (name.length > 50) return 'Name cannot exceed 50 characters';
  return '';
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
};

// Form validation helper
export const validateForm = (fields) => {
  const errors = {};
  
  if (fields.name) {
    const nameError = validateName(fields.name);
    if (nameError) errors.name = nameError;
  }
  
  if (fields.email) {
    const emailError = validateEmail(fields.email);
    if (emailError) errors.email = emailError;
  }
  
  if (fields.mobile) {
    const mobileError = validateMobile(fields.mobile);
    if (mobileError) errors.mobile = mobileError;
  }
  
  if (fields.password) {
    const passwordError = validatePassword(fields.password);
    if (passwordError) errors.password = passwordError;
  }
  
  if (fields.password && fields.confirmPassword) {
    const confirmPasswordError = validateConfirmPassword(
      fields.password,
      fields.confirmPassword
    );
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};