import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

import { getDashboardData, requestToJoinGroup } from '../services/api';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [dashboardData, setDashboardData] = useState({
    groups: [],
  });

  /* ---------------- FETCH DASHBOARD ---------------- */
  useEffect(() => {
    if (!token) navigate('/login');
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardData();

      setDashboardData({
        groups: data.groups || [],
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- JOIN GROUP ---------------- */
  const handleJoin = async (groupId, destination) => {
    if (!groupId) {
      toast.error('Invalid group ID');
      return;
    }

    try {
      await requestToJoinGroup(groupId);
      toast.success(`Join request sent for ${destination}!`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join group');
    }
  };

  /* ---------------- SEARCH FILTER ---------------- */
  const filteredGroups = dashboardData.groups.filter((g) =>
    g.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ---------------- LOADER ---------------- */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden px-4 py-10">
      {/* Background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-300 rounded-full blur-3xl opacity-30" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-300 rounded-full blur-3xl opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-7xl mx-auto space-y-12"
      >
        {/* ---------------- HERO ---------------- */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Welcome, {user?.name}
            </h1>
            <p className="text-gray-500 mt-2 text-lg">
              Discover trips, join groups & travel smarter
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search destinations (Goa, Manali, Paris...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/70 backdrop-blur border border-white/40 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              🔍
            </span>
          </div>
        </div>

        {/* ---------------- QUICK ACTIONS ---------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { title: 'Create Trip', icon: '🧳', path: '/create-trip', color: 'from-indigo-500 to-purple-500' },
            { title: 'My Groups', icon: '👥', path: '/my-groups', color: 'from-green-500 to-emerald-500' },
            { title: 'Requests', icon: '📩', path: '/group-requests', color: 'from-yellow-400 to-orange-500' },
            { title: 'Browse', icon: '🌍', path: '/groups', color: 'from-pink-500 to-rose-500' },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10, scale: 1.04 }}
              onClick={() => navigate(item.path)}
              className="cursor-pointer glass-card"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${item.color} text-white shadow-lg mb-4`}>
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
            </motion.div>
          ))}
        </div>

        {/* ---------------- ACTIVE GROUPS ---------------- */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            🌍 Active Groups
          </h2>

          {filteredGroups.length === 0 ? (
            <div className="glass-card text-center py-12">
              <p className="text-gray-500">No matching trips found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGroups.map((g, index) => {
                const isMember = g.currentMembers?.some(
                  m => m.user && m.user._id === user?._id
                );
                const isCreator = g.createdBy?.id === user?._id;

                return (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8 }}
                    className="glass-card overflow-hidden group cursor-pointer"
                    onClick={() => navigate(`/groups/${g.id}`)}
                  >
                    {/* TOP DESTINATION STRIP */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold tracking-wide">
                          {g.destination}
                        </h3>

                        {isCreator && (
                          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                            Your Group
                          </span>
                        )}
                      </div>

                      <p className="text-xs mt-1 opacity-90 flex items-center gap-1">
                        📅 {new Date(g.startDate).toLocaleDateString()} –{" "}
                        {new Date(g.endDate).toLocaleDateString()}
                      </p>
                    </div>

                    {/* BODY */}
                    <div className="p-4 space-y-4">
                      {/* Description */}
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {g.description || "No description provided."}
                      </p>

                      {/* INFO GRID */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white/60 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="font-semibold text-gray-800">
                            ₹{g.budget?.min || 0} – ₹{g.budget?.max || 0}
                          </p>
                        </div>

                        <div className="bg-white/60 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Created By</p>
                          <p className="font-semibold text-gray-800 truncate">
                            {g.createdBy?.name || "Unknown"}
                          </p>
                        </div>
                      </div>

                      {/* MEMBERS */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Members</span>
                          <span>
                            {g.currentMembersCount || 0}/{g.maxMembers || 10}
                          </span>
                        </div>

                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 transition-all"
                            style={{
                              width: `${((g.currentMembersCount || 0) / (g.maxMembers || 10)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="pt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* View Details Button */}
                        <Button
                          onClick={() => navigate(`/groups/${g.id}`)}
                          className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 hover:text-indigo-800 border border-indigo-200"
                          size="sm"
                        >
                          👁️ View Details
                        </Button>

                        {isCreator ? (
                          <Button
                            onClick={() => navigate(`/groups/${g.id}`)}
                            className="flex-1 bg-purple-500 hover:bg-purple-600"
                            size="sm"
                          >
                            Manage
                          </Button>
                        ) : isMember ? (
                          <Button
                            onClick={() => navigate(`/groups/${g.id}`)}
                            className="flex-1 bg-green-500 hover:bg-green-600"
                            size="sm"
                          >
                            Enter
                          </Button>
                        ) : g.currentMembersCount >= g.maxMembers ? (
                          <Button disabled className="flex-1 bg-gray-400" size="sm">
                            Full
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleJoin(g.id, g.destination)}
                            className="flex-1 bg-indigo-500 hover:bg-indigo-600"
                            size="sm"
                          >
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </motion.div>
    </div>
  );
};

export default DashboardPage;