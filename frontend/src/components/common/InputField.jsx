import React from 'react';
import { FaUser, FaEnvelope, FaPhone, FaLock } from 'react-icons/fa';

const InputField = React.forwardRef(({
  label,
  type = 'text',
  error,
  className = '',
  icon,
  ...props
}, ref) => {
  return (
    <div className="mb-6">
      {label && (
        <label className="label">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`input-field ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className} ${icon ? 'pl-10' : ''}`}
          {...props}
        />
      </div>
      {error && (
        <p className="error-text">{error.message}</p>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;