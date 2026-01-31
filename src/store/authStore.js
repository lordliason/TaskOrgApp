import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  organization: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ isLoading: false, error: 'Supabase is not configured' });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (session?.user) {
        await get().fetchUserData(session.user.id);
      } else {
        set({ user: null, profile: null, organization: null });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await get().fetchUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, organization: null });
      }
    });
  },

  fetchUserData: async (userId) => {
    try {
      // Fetch profile with organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      set({
        user: { id: userId },
        profile: {
          id: profile.id,
          email: profile.email,
          displayName: profile.display_name,
          phone: profile.phone,
          role: profile.role,
          color: profile.color,
          organizationId: profile.organization_id,
        },
        organization: profile.organizations ? {
          id: profile.organizations.id,
          name: profile.organizations.name,
          settings: profile.organizations.settings,
        } : null,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      set({ error: error.message });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async ({ email, password, displayName, phone, color, organizationName }) => {
    try {
      set({ isLoading: true, error: null });

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      // 2. Use database function to create organization and profile (bypasses RLS)
      const { data: result, error: rpcError } = await supabase.rpc(
        'create_user_and_organization',
        {
          p_user_id: userId,
          p_email: email,
          p_display_name: displayName,
          p_phone: phone || null,
          p_color: color,
          p_organization_name: organizationName,
        }
      );

      if (rpcError) throw rpcError;
      if (result && !result.success) throw new Error(result.error);

      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      await supabase.auth.signOut();
      set({ user: null, profile: null, organization: null });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
