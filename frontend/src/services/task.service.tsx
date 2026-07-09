import api from './api';

export const taskService = {
  getTasks: async () => {
    try {
      const res = await api.get('/tasks');
      return res.data;
    } catch (err) {
      console.warn('API error fetching tasks, fallback to offline', err);
      return [];
    }
  },
  getTaskById: async (id: string) => {
    try {
      const res = await api.get(`/tasks/${id}`);
      return res.data;
    } catch (err) {
      console.warn('API error fetching task by ID, fallback to offline', err);
      return null;
    }
  },
  createTask: async (taskData: any) => {
    try {
      const res = await api.post('/tasks', taskData);
      return res.data;
    } catch (err) {
      console.warn('API error creating task, fallback to offline', err);
      return null;
    }
  },
  updateTask: async (id: string, updateData: any) => {
    try {
      const res = await api.put(`/tasks/${id}`, updateData);
      return res.data;
    } catch (err) {
      console.warn('API error updating task, fallback to offline', err);
      return null;
    }
  },
  deleteTask: async (id: string) => {
    try {
      const res = await api.delete(`/tasks/${id}`);
      return res.data;
    } catch (err) {
      console.warn('API error deleting task, fallback to offline', err);
      return null;
    }
  },
  addTaskComment: async (id: string, content: string) => {
    try {
      const res = await api.post(`/tasks/${id}/comments`, { content });
      return res.data;
    } catch (err) {
      console.warn('API error adding task comment, fallback to offline', err);
      return null;
    }
  }
};
