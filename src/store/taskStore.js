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
        .select('*, assignee:profiles!assignee_id(id, display_name, color)')
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
              // Check if task already exists (from optimistic update)
              const existingIndex = tasks.findIndex((t) => t.id === newRecord.id);
              if (existingIndex >= 0) {
                // Merge with existing to preserve relation data
                tasks[existingIndex] = { ...tasks[existingIndex], ...newRecord };
              } else {
                tasks = [newRecord, ...tasks];
              }
            } else if (eventType === 'UPDATE') {
              // Merge instead of replace to preserve relation data (assignee, etc.)
              tasks = tasks.map((t) => (t.id === newRecord.id ? { ...t, ...newRecord } : t));
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
        .select('*, assignee:profiles!assignee_id(id, display_name, color)')
        .single();

      if (error) throw error;

      // Optimistic update - add task to state immediately
      set((state) => {
        // Check if task already exists (from subscription)
        const exists = state.tasks.some((t) => t.id === data.id);
        if (exists) {
          return { tasks: state.tasks.map((t) => (t.id === data.id ? data : t)) };
        }
        return { tasks: [data, ...state.tasks] };
      });

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

      // Optimistic update - update task in state immediately
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      }));

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select('*, assignee:profiles!assignee_id(id, display_name, color)')
        .single();

      if (error) {
        // Revert optimistic update on error - refetch tasks
        const orgId = get().tasks[0]?.organization_id;
        if (orgId) {
          get().fetchTasks(orgId);
        }
        throw error;
      }

      // Update with full server data (includes relations)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? data : t)),
      }));

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

      const completedAt = new Date().toISOString();

      // Optimistic update - update task in state immediately
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? { ...t, status: 'done', completed_at: completedAt, completed_by: userId }
            : t
        ),
      }));

      // Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          status: 'done',
          completed_at: completedAt,
          completed_by: userId,
        })
        .eq('id', taskId);

      if (taskError) {
        // Revert optimistic update on error
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: 'todo', completed_at: null, completed_by: null }
              : t
          ),
        }));
        throw taskError;
      }

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

      // Store original values for potential revert
      const task = get().tasks.find((t) => t.id === taskId);
      const originalStatus = task?.status;
      const originalCompletedAt = task?.completed_at;
      const originalCompletedBy = task?.completed_by;

      // Optimistic update - update task in state immediately
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? { ...t, status: 'todo', completed_at: null, completed_by: null }
            : t
        ),
      }));

      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'todo',
          completed_at: null,
          completed_by: null,
        })
        .eq('id', taskId);

      if (error) {
        // Revert optimistic update on error
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: originalStatus, completed_at: originalCompletedAt, completed_by: originalCompletedBy }
              : t
          ),
        }));
        throw error;
      }

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

  // Delete all tasks for an organization
  deleteAllTasks: async (organizationId) => {
    try {
      set({ error: null });

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('organization_id', organizationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Delete only completed tasks for an organization
  deleteCompletedTasks: async (organizationId) => {
    try {
      set({ error: null });

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('organization_id', organizationId)
        .eq('status', 'done');

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
