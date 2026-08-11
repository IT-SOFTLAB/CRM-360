import api from './client';

export const sendAIMessage = async (message) => {
  const response = await api.post('/ai/chat', { message });
  return response.data;
};