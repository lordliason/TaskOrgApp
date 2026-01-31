import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useOrganizationStore = create((set, get) => ({
  members: [],
  scores: [],
  isLoading: false,
  error: null,

  // Fetch organization members
  fetchMembers: async (organizationId) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({ members: data || [] });
    } catch (error) {
      console.error('Error fetching members:', error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Add a new member (max 2 users per organization)
  addMember: async ({ email, password, displayName, phone, color, organizationId }) => {
    try {
      set({ isLoading: true, error: null });

      // Check if organization already has 2 members
      const { members } = get();
      if (members.length >= 2) {
        throw new Error('Organization already has the maximum of 2 members');
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Create member profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          organization_id: organizationId,
          email,
          display_name: displayName,
          phone,
          role: 'member',
          color,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      set((state) => ({
        members: [...state.members, profileData],
      }));

      return { success: true, data: profileData };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Update member profile
  updateMember: async (memberId, updates) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.displayName,
          phone: updates.phone,
          color: updates.color,
        })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        members: state.members.map((m) => (m.id === memberId ? data : m)),
      }));

      return { success: true, data };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch scores/leaderboard
  fetchScores: async (organizationId, days = 7) => {
    try {
      set({ isLoading: true, error: null });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('scores')
        .select('*, profile:profiles(id, display_name, color)')
        .eq('organization_id', organizationId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      set({ scores: data || [] });
    } catch (error) {
      console.error('Error fetching scores:', error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Get aggregated scores per user
  getLeaderboard: () => {
    const { scores, members } = get();

    const aggregated = members.map((member) => {
      const userScores = scores.filter((s) => s.user_id === member.id);
      const totalPoints = userScores.reduce((sum, s) => sum + s.points, 0);
      const totalTasks = userScores.reduce((sum, s) => sum + s.tasks_completed, 0);

      return {
        userId: member.id,
        displayName: member.display_name,
        color: member.color,
        totalPoints,
        totalTasks,
      };
    });

    return aggregated.sort((a, b) => b.totalPoints - a.totalPoints);
  },

  // Update organization settings
  updateOrganization: async (organizationId, updates) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organizationId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
