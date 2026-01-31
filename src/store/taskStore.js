import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { POINTS_BY_EFFORT } from '../lib/constants';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  subscription: null,

  // Fetch all tasks for the organization
  fetchTasks: async (organizationId) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('tasks')
        .select('*, assignee:profiles(id, display_name, color)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ tasks: data || [] });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Subscribe to real-time updates
  subscribeToTasks: (organizationId) => {
    const subscription = supabase
      .channel('tasks-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          set((state) => {
            let tasks = [...state.tasks];

            if (eventType === 'INSERT') {
              tasks = [newRecord, ...tasks];
            } else if (eventType === 'UPDATE') {
              tasks = tasks.map((t) => (t.id === newRecord.id ? newRecord : t));
            } else if (eventType === 'DELETE') {
              tasks = tasks.filter((t) => t.id !== oldRecord.id);
            }

            return { tasks };
          });
        }
      )
      .subscribe();

    set({ subscription });
  },

  // Unsubscribe from real-time updates
  unsubscribe: () => {
    const { subscription } = get();
    if (subscription) {
      supabase.removeChannel(subscription);
      set({ subscription: null });
    }
  },

  // Create a new task
  createTask: async (task) => {
    try {
      set({ error: null });

      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select('*, assignee:profiles(id, display_name, color)')
        .single();

      if (error) throw error;

      // Optimistic update handled by subscription
      return { success: true, data };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Update a task
  updateTask: async (taskId, updates) => {
    try {
      set({ error: null });

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select('*, assignee:profiles(id, display_name, color)')
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Complete a task
  completeTask: async (taskId, userId, organizationId) => {
    try {
      set({ error: null });

      // Get task details for points calculation
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Task not found');

      // Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          status: 'done',
          completed_at: new Date().toISOString(),
          completed_by: userId,
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      // Calculate points
      const points = POINTS_BY_EFFORT[task.effort] || 10;

      // Update or create score record
      const today = new Date().toISOString().split('T')[0];

      const { data: existingScore } = await supabase
        .from('scores')
        .select()
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('date', today)
        .single();

      if (existingScore) {
        await supabase
          .from('scores')
          .update({
            points: existingScore.points + points,
            tasks_completed: existingScore.tasks_completed + 1,
          })
          .eq('id', existingScore.id);
      } else {
        await supabase.from('scores').insert({
          user_id: userId,
          organization_id: organizationId,
          date: today,
          points,
          tasks_completed: 1,
        });
      }

      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Uncomplete a task (revert to todo)
  uncompleteTask: async (taskId) => {
    try {
      set({ error: null });

      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'todo',
          completed_at: null,
          completed_by: null,
        })
        .eq('id', taskId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Delete a task
  deleteTask: async (taskId) => {
    try {
      set({ error: null });

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Get tasks filtered by quadrant
  getTasksByQuadrant: (quadrant) => {
    const tasks = get().tasks.filter((t) => t.status !== 'done');

    switch (quadrant) {
      case 1: // Do First: High Urgent, High Important
        return tasks.filter((t) => t.urgent >= 3 && t.important >= 3);
      case 2: // Schedule: Low Urgent, High Important
        return tasks.filter((t) => t.urgent < 3 && t.important >= 3);
      case 3: // Delegate: High Urgent, Low Important
        return tasks.filter((t) => t.urgent >= 3 && t.important < 3);
      case 4: // Eliminate: Low Urgent, Low Important
        return tasks.filter((t) => t.urgent < 3 && t.important < 3);
      default:
        return tasks;
    }
  },

  // Get today's tasks
  getTodaysTasks: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().tasks.filter((t) => {
      if (t.status === 'done') return false;
      if (t.urgent >= 3) return true; // Today or more urgent
      if (t.due_date) {
        return t.due_date.split('T')[0] === today;
      }
      return false;
    });
  },

  clearError: () => set({ error: null }),
}));
