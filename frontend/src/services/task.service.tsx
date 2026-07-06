import api from './api';

export const taskService = {
  getTasks: async () => {
    try {
      const res = await api.get('/tasks');
      return res.data;
    } catch (err) {
      console.warn('API error fetching tasks', err);
      return [];
    }
  },

  getTaskById: async (id: string) => {
    try {
      const res = await api.get(`/tasks/${id}`);
      return res.data;
    } catch (err) {
      console.error(`API error fetching task ${id}`, err);
      return null;
    }
  },

  createTask: async (taskData: any) => {
    try {
      const res = await api.post('/tasks', taskData);
      return res.data;
    } catch (err) {
      console.error('API error creating task', err);
      throw err;
    }
  },

  updateTask: async (id: string, taskData: any) => {
    try {
      const res = await api.put(`/tasks/${id}`, taskData);
      return res.data;
    } catch (err) {
      console.error(`API error updating task ${id}`, err);
      throw err;
    }
  },

  deleteTask: async (id: string) => {
    try {
      const res = await api.delete(`/tasks/${id}`);
      return res.data;
    } catch (err) {
      console.error(`API error deleting task ${id}`, err);
      throw err;
    }
  },

  addTaskComment: async (id: string, content: string) => {
    try {
      const res = await api.post(`/tasks/${id}/comments`, { content });
      return res.data;
    } catch (err) {
      console.error(`API error commenting on task ${id}`, err);
      throw err;
    }
  }
};
