import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getDashboardData, requestToJoinGroup } from '../services/api';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    if (!token) navigate('/login'); // redirect if not logged in
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (groupId) => {
    try {
      await requestToJoinGroup(groupId);
      toast.success('Join request sent!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join group');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader size="lg" /></div>;

  if (!dashboardData) return <div>No dashboard data</div>;

  return (
    <div>
      <h1>Welcome {user?.name}</h1>
      <div>
        {dashboardData.groups?.map(g => (
          <div key={g.id}>
            <h2>{g.destination}</h2>
            <Button onClick={() => handleJoin(g.id)}>Join</Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
