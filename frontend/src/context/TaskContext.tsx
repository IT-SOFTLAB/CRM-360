"use client";

import React, { createContext, useState, useContext } from 'react';
import { taskService } from '../services/task.service';
import { ToastContext } from './ToastContext';

export interface TaskContextType {
  tasks: any[];
  loading: boolean;
  selectedTask: any | null;
  loadTasks: () => Promise<void>;
  loadTaskDetails: (id: string) => Promise<void>;
  handleCreateTask: (taskForm: any) => Promise<boolean>;
  handleUpdateTask: (id: string, updates: any) => Promise<boolean>;
  handleAddTaskComment: (taskId: string, comment: string) => Promise<boolean>;
  handleDeleteTask: (id: string) => Promise<boolean>;
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const toastCtx = useContext(ToastContext);

  const loadTasks = async () => {
    setLoading(true);
    const apiTasks = await taskService.getTasks();
    if (apiTasks) {
      setTasks(apiTasks);
    }
    setLoading(false);
  };

  const loadTaskDetails = async (id: string) => {
    setLoading(true);
    const apiTask = await taskService.getTaskById(id);
    if (apiTask) {
      setSelectedTask(apiTask);
    }
    setLoading(false);
  };

  const handleCreateTask = async (taskForm: any): Promise<boolean> => {
    const res = await taskService.createTask(taskForm);
    if (res) {
      setTasks(prev => [res, ...prev]);
      if (toastCtx) toastCtx.addToast('success', 'Task created successfully!');
      return true;
    } else {
      if (toastCtx) toastCtx.addToast('error', 'Failed to create task');
      return false;
    }
  };

  const handleUpdateTask = async (id: string, updates: any): Promise<boolean> => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask((prev: any) => prev ? { ...prev, ...updates } : null);
    }

    const res = await taskService.updateTask(id, updates);
    if (res) {
      setTasks(prev => prev.map(t => t.id === id ? res : t));
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask(res);
      }
      if (toastCtx) toastCtx.addToast('success', 'Task updated');
      return true;
    } else {
      if (toastCtx) toastCtx.addToast('error', 'Failed to update task');
      await loadTasks();
      return false;
    }
  };

  const handleAddTaskComment = async (taskId: string, comment: string): Promise<boolean> => {
    const res = await taskService.addTaskComment(taskId, comment);
    if (res) {
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask((prev: any) => ({
          ...prev,
          comments: [res, ...(prev.comments || [])]
        }));
      }
      if (toastCtx) toastCtx.addToast('success', 'Comment added');
      return true;
    } else {
      if (toastCtx) toastCtx.addToast('error', 'Failed to add comment');
      return false;
    }
  };

  const handleDeleteTask = async (id: string): Promise<boolean> => {
    const originalTasks = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask(null);
    }

    const res = await taskService.deleteTask(id);
    if (res) {
      if (toastCtx) toastCtx.addToast('success', 'Task deleted successfully');
      return true;
    } else {
      setTasks(originalTasks);
      if (toastCtx) toastCtx.addToast('error', 'Failed to delete task');
      return false;
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      loading,
      selectedTask,
      loadTasks,
      loadTaskDetails,
      handleCreateTask,
      handleUpdateTask,
      handleAddTaskComment,
      handleDeleteTask
    }}>
      {children}
    </TaskContext.Provider>
  );
};
