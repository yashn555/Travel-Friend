import api from './api';

export const createGroup = (data) => api.post('/groups/create', data).then(res => res.data);
export const getAllGroups = () => api.get('/groups/my-groups').then(res => res.data); // for now
export const getGroupById = (id) => api.get(`/groups/my-groups`).then(res => {
  return { group: res.data.groups.find(g => g._id === id) };
});
export const requestJoinGroup = (groupId, message='') => api.post('/groups/request-join', { groupId, message }).then(res => res.data);
export const getMyGroups = () => api.get('/groups/my-groups').then(res => res.data);
export const handleJoinRequest = (groupId, requestId, action) => api.post('/groups/handle-request', { groupId, requestId, action }).then(res => res.data);
