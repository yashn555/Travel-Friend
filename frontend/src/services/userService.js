// Get followers
export const getFollowers = async (userId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_URL}/users/followers/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response;
};

// Get following
export const getFollowing = async (userId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_URL}/users/following/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response;
};

// Get friends (mutual followers)
export const getFriends = async (userId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_URL}/users/friends/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response;
};

// Get my friends (for dashboard)
export const getMyFriends = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_URL}/users/dashboard/friends`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response;
};