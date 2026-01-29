// frontend/src/components/settings/UPISettings.jsx
import React, { useState } from 'react';
import { FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { updateProfile } from '../../services/authService';

const UPISettings = ({ user, onUpdate }) => {
  const [upiId, setUpiId] = useState(user.upiId || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Validate UPI ID
    if (upiId && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(upiId)) {
      toast.error('Please enter a valid UPI ID (e.g., username@upi)');
      return;
    }

    try {
      setSaving(true);
      const response = await updateProfile({ upiId });
      if (response.success) {
        toast.success('UPI ID updated successfully!');
        onUpdate(response.data);
      }
    } catch (error) {
      toast.error('Failed to update UPI ID');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">UPI Payment Settings</h3>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <FaInfoCircle className="text-blue-500 mt-1 mr-2" />
          <div>
            <p className="text-sm text-blue-700">
              <strong>Why add UPI ID?</strong> Group members can send you payment requests directly. 
              When you're added to an expense split, others can pay you instantly using your UPI ID.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">
            Your UPI ID
            <span className="text-gray-500 text-sm ml-2">(e.g., username@oksbi, 9876543210@upi)</span>
          </label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="Enter your UPI ID"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Example UPI IDs:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• username@oksbi (PhonePe)</li>
            <li>• username@ybl (Google Pay)</li>
            <li>• username@axl (Paytm)</li>
            <li>• mobilenumber@upi (Any UPI app)</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setUpiId(user.upiId || '')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <FaTimes className="inline mr-2" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <FaSave className="inline mr-2" />
                Save UPI ID
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UPISettings;