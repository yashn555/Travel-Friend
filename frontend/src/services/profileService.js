import api from './api'; // make sure api.js is inside src/services as well

export const getProfile = async () => {
  try {
    const response = await api.get('/dashboard/profile');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/dashboard/profile', profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadProfileImage = async (formData) => {
  try {
    const response = await api.post('/dashboard/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
