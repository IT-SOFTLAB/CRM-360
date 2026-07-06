"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import { taskService } from '../services/task.service';
import { ToastContext } from './ToastContext';

export interface TaskContextType {
  tasks: any[];
  setTasks: React.Dispatch<React.SetStateAction<any[]>>;
  selectedTask: any | null;
  setSelectedTask: React.Dispatch<React.SetStateAction<any | null>>;
  loading: boolean;
  loadTasks: () => Promise<void>;
  loadTaskDetails: (id: string) => Promise<void>;
  handleCreateTask: (taskData: any) => Promise<boolean>;
  handleUpdateTask: (id: string, taskData: any) => Promise<boolean>;
  handleDeleteTask: (id: string) => Promise<boolean>;
  handleAddTaskComment: (id: string, content: string) => Promise<boolean>;
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const toastCtx = useContext(ToastContext);

  const loadTasks = async () => {
    setLoading(true);
    const data = await taskService.getTasks();
    setTasks(data);
    setLoading(false);
  };

  const loadTaskDetails = async (id: string) => {
    const data = await taskService.getTaskById(id);
    setSelectedTask(data);
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      const newTask = await taskService.createTask(taskData);
      setTasks(prev => [newTask, ...prev]);
      toastCtx?.addToast('success', 'Task created successfully');
      return true;
    } catch (err: any) {
      toastCtx?.addToast('error', err?.response?.data?.message || 'Failed to create task');
      return false;
    }
  };

  const handleUpdateTask = async (id: string, taskData: any) => {
    try {
      const updated = await taskService.updateTask(id, taskData);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask({ ...selectedTask, ...updated });
      }
      toastCtx?.addToast('success', 'Task updated successfully');
      return true;
    } catch (err: any) {
      toastCtx?.addToast('error', err?.response?.data?.message || 'Failed to update task');
      return false;
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask(null);
      }
      toastCtx?.addToast('success', 'Task deleted successfully');
      return true;
    } catch (err: any) {
      toastCtx?.addToast('error', err?.response?.data?.message || 'Failed to delete task');
      return false;
    }
  };

  const handleAddTaskComment = async (id: string, content: string) => {
    try {
      const comment = await taskService.addTaskComment(id, content);
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask({
          ...selectedTask,
          comments: [comment, ...(selectedTask.comments || [])]
        });
      }
      toastCtx?.addToast('success', 'Comment added');
      return true;
    } catch (err: any) {
      toastCtx?.addToast('error', 'Failed to add comment');
      return false;
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      setTasks,
      selectedTask,
      setSelectedTask,
      loading,
      loadTasks,
      loadTaskDetails,
      handleCreateTask,
      handleUpdateTask,
      handleDeleteTask,
      handleAddTaskComment
    }}>
      {children}
    </TaskContext.Provider>
  );
};
