import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  COMBO_WINDOW_MINUTES,
  COMBO_MULTIPLIERS,
  getStreakBonus,
  CHALLENGE_TEMPLATES,
  POINTS_BY_EFFORT,
} from '../lib/constants';

export const useGamificationStore = create((set, get) => ({
  // State
  userStreak: null,
  userStats: null,
  userBadges: [],
  allBadges: [],
  activeChallenge: null,
  recentCombos: [],
  comboNotification: null,
  newBadgeNotification: null,
  isLoading: false,
  error: null,

  // ===========================================
  // INITIALIZATION
  // ===========================================

  initializeGamification: async (userId, organizationId) => {
    try {
      set({ isLoading: true, error: null });

      // Fetch all gamification data in parallel
      await Promise.all([
        get().fetchUserStreak(userId, organizationId),
        get().fetchUserStats(userId, organizationId),
        get().fetchUserBadges(userId, organizationId),
        get().fetchAllBadges(),
        get().fetchActiveChallenge(organizationId),
      ]);
    } catch (error) {
      console.error('Error initializing gamification:', error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // ===========================================
  // STREAKS
  // ===========================================

  fetchUserStreak: async (userId, organizationId) => {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      set({ userStreak: data || null });
      return data;
    } catch (error) {
      console.error('Error fetching user streak:', error);
      return null;
    }
  },

  updateStreak: async (userId, organizationId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Get current streak data
      let { data: streak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();

      if (!streak) {
        // Create new streak record
        const { data: newStreak, error } = await supabase
          .from('user_streaks')
          .insert({
            user_id: userId,
            organization_id: organizationId,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today,
            streak_freeze_tokens: 1, // Start with 1 freeze token
          })
          .select()
          .single();

        if (error) throw error;
        set({ userStreak: newStreak });
        return newStreak;
      }

      // Already updated today
      if (streak.last_activity_date === today) {
        return streak;
      }

      let newStreak = streak.current_streak;
      let newLongest = streak.longest_streak;

      if (streak.last_activity_date === yesterday) {
        // Continuing streak
        newStreak += 1;
        if (newStreak > newLongest) {
          newLongest = newStreak;
        }
      } else if (streak.last_activity_date < yesterday) {
        // Streak broken - check for freeze token
        if (streak.streak_freeze_tokens > 0) {
          // Use freeze token to maintain streak
          const { data: frozenStreak, error } = await supabase
            .from('user_streaks')
            .update({
              streak_freeze_tokens: streak.streak_freeze_tokens - 1,
              last_activity_date: today,
            })
            .eq('id', streak.id)
            .select()
            .single();

          if (error) throw error;
          set({ userStreak: frozenStreak });
          return frozenStreak;
        }
        // Reset streak
        newStreak = 1;
      }

      // Update streak
      const { data: updatedStreak, error } = await supabase
        .from('user_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streak.id)
        .select()
        .single();

      if (error) throw error;
      set({ userStreak: updatedStreak });

      // Check for streak badges
      await get().checkStreakBadges(userId, organizationId, newStreak);

      return updatedStreak;
    } catch (error) {
      console.error('Error updating streak:', error);
      return null;
    }
  },

  // ===========================================
  // COMBOS
  // ===========================================

  checkAndTriggerCombo: async (userId, organizationId, taskId, basePoints) => {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - COMBO_WINDOW_MINUTES * 60 * 1000);

      // Get recent completions in the combo window (excluding this user)
      const { data: recentCompletions, error } = await supabase
        .from('combo_events')
        .select('user_id')
        .eq('organization_id', organizationId)
        .neq('user_id', userId)
        .gte('completed_at', windowStart.toISOString())
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Count unique users who completed tasks in the window
      const uniqueUsers = new Set(recentCompletions?.map((c) => c.user_id) || []);
      const comboParticipants = uniqueUsers.size + 1; // +1 for current user

      // Determine combo multiplier
      let comboMultiplier = 1.0;
      let bonusPoints = 0;
      let comboData = null;

      if (comboParticipants >= 3 && COMBO_MULTIPLIERS[3]) {
        comboMultiplier = COMBO_MULTIPLIERS[3].multiplier;
        comboData = COMBO_MULTIPLIERS[3];
      } else if (comboParticipants >= 2 && COMBO_MULTIPLIERS[2]) {
        comboMultiplier = COMBO_MULTIPLIERS[2].multiplier;
        comboData = COMBO_MULTIPLIERS[2];
      }

      if (comboMultiplier > 1.0) {
        bonusPoints = Math.round(basePoints * (comboMultiplier - 1));
      }

      // Record the combo event
      await supabase.from('combo_events').insert({
        organization_id: organizationId,
        user_id: userId,
        task_id: taskId,
        base_points: basePoints,
        combo_multiplier: comboMultiplier,
        bonus_points: bonusPoints,
        completed_at: now.toISOString(),
      });

      // Show combo notification if triggered
      if (comboData) {
        set({
          comboNotification: {
            ...comboData,
            participants: comboParticipants,
            bonusPoints,
            timestamp: now.getTime(),
          },
        });

        // Update user stats for combo tracking
        await get().incrementStat(userId, organizationId, 'combos_triggered');

        // Clear notification after delay
        setTimeout(() => {
          set((state) => {
            if (state.comboNotification?.timestamp === now.getTime()) {
              return { comboNotification: null };
            }
            return state;
          });
        }, 3000);
      }

      return { comboMultiplier, bonusPoints };
    } catch (error) {
      console.error('Error checking combo:', error);
      return { comboMultiplier: 1.0, bonusPoints: 0 };
    }
  },

  clearComboNotification: () => set({ comboNotification: null }),

  // ===========================================
  // USER STATS
  // ===========================================

  fetchUserStats: async (userId, organizationId) => {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      set({ userStats: data || null });
      return data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  },

  ensureUserStats: async (userId, organizationId) => {
    let stats = get().userStats;
    if (!stats) {
      const { data, error } = await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error && error.code !== '23505') {
        // Ignore unique violation - might already exist
        console.error('Error creating user stats:', error);
        return null;
      }

      // If insert failed due to unique constraint, fetch existing
      if (!data) {
        return get().fetchUserStats(userId, organizationId);
      }

      stats = data;
      set({ userStats: stats });
    }
    return stats;
  },

  incrementStat: async (userId, organizationId, statField, amount = 1) => {
    try {
      await get().ensureUserStats(userId, organizationId);

      const { data, error } = await supabase.rpc('increment_user_stat', {
        p_user_id: userId,
        p_organization_id: organizationId,
        p_stat_field: statField,
        p_amount: amount,
      });

      // If RPC doesn't exist, fall back to regular update
      if (error) {
        const stats = get().userStats;
        if (stats) {
          const { data: updated } = await supabase
            .from('user_stats')
            .update({
              [statField]: (stats[statField] || 0) + amount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', stats.id)
            .select()
            .single();

          if (updated) {
            set({ userStats: updated });
          }
        }
      }
    } catch (error) {
      console.error('Error incrementing stat:', error);
    }
  },

  updateStatsOnTaskComplete: async (userId, organizationId, task) => {
    try {
      await get().ensureUserStats(userId, organizationId);

      const updates = {
        total_tasks_completed: 1,
      };

      // Determine quadrant
      const isUrgent = task.urgent >= 3;
      const isImportant = task.important >= 3;

      if (isUrgent && isImportant) {
        updates.do_first_completed = 1;
      } else if (!isUrgent && isImportant) {
        updates.schedule_completed = 1;
      } else if (isUrgent && !isImportant) {
        updates.delegate_completed = 1;
      } else {
        updates.eliminate_completed = 1;
      }

      // Effort tracking
      const effortField = `${task.effort}_completed`;
      updates[effortField] = 1;

      // Update stats
      const stats = get().userStats || {};
      const newStats = { ...stats };

      for (const [field, increment] of Object.entries(updates)) {
        newStats[field] = (newStats[field] || 0) + increment;
      }

      const { data, error } = await supabase
        .from('user_stats')
        .update({
          ...Object.fromEntries(
            Object.entries(updates).map(([k, v]) => [k, (stats[k] || 0) + v])
          ),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      set({ userStats: data });

      // Check for new badges
      await get().checkAllBadges(userId, organizationId, data);

      return data;
    } catch (error) {
      console.error('Error updating stats on task complete:', error);
      return null;
    }
  },

  // ===========================================
  // BADGES
  // ===========================================

  fetchAllBadges: async () => {
    try {
      const { data, error } = await supabase.from('badges').select('*').order('requirement_value');

      if (error) throw error;
      set({ allBadges: data || [] });
      return data;
    } catch (error) {
      console.error('Error fetching badges:', error);
      return [];
    }
  },

  fetchUserBadges: async (userId, organizationId) => {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      set({ userBadges: data || [] });
      return data;
    } catch (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }
  },

  checkStreakBadges: async (userId, organizationId, currentStreak) => {
    const streakBadges = ['streak_3', 'streak_7', 'streak_14', 'streak_30'];
    const thresholds = { streak_3: 3, streak_7: 7, streak_14: 14, streak_30: 30 };

    for (const badgeId of streakBadges) {
      if (currentStreak >= thresholds[badgeId]) {
        await get().awardBadge(userId, organizationId, badgeId);
      }
    }
  },

  checkAllBadges: async (userId, organizationId, stats) => {
    if (!stats) return;

    const allBadges = get().allBadges;
    const earnedBadgeIds = new Set(get().userBadges.map((ub) => ub.badge_id));

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const statValue = stats[badge.requirement_type] || 0;
      if (statValue >= badge.requirement_value) {
        await get().awardBadge(userId, organizationId, badge.id);
      }
    }
  },

  awardBadge: async (userId, organizationId, badgeId) => {
    try {
      // Check if already earned
      const { data: existing } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('badge_id', badgeId)
        .single();

      if (existing) return null;

      const { data, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          badge_id: badgeId,
        })
        .select('*, badge:badges(*)')
        .single();

      if (error) {
        if (error.code === '23505') return null; // Already exists
        throw error;
      }

      // Update local state
      set((state) => ({
        userBadges: [data, ...state.userBadges],
        newBadgeNotification: data.badge,
      }));

      // Clear notification after delay
      setTimeout(() => {
        set((state) => {
          if (state.newBadgeNotification?.id === data.badge.id) {
            return { newBadgeNotification: null };
          }
          return state;
        });
      }, 4000);

      return data;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return null;
    }
  },

  clearBadgeNotification: () => set({ newBadgeNotification: null }),

  // ===========================================
  // WEEKLY CHALLENGES
  // ===========================================

  fetchActiveChallenge: async (organizationId) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('team_challenges')
        .select('*')
        .eq('organization_id', organizationId)
        .lte('start_date', today)
        .gte('end_date', today)
        .eq('is_completed', false)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      set({ activeChallenge: data || null });

      // If no active challenge, generate a new one
      if (!data) {
        await get().generateWeeklyChallenge(organizationId);
      }

      return data;
    } catch (error) {
      console.error('Error fetching active challenge:', error);
      return null;
    }
  },

  generateWeeklyChallenge: async (organizationId) => {
    try {
      // Get the start of this week (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      // End of week (Sunday)
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const startDate = monday.toISOString().split('T')[0];
      const endDate = sunday.toISOString().split('T')[0];

      // Check if a challenge already exists for this week
      const { data: existing } = await supabase
        .from('team_challenges')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('start_date', startDate)
        .single();

      if (existing) {
        return get().fetchActiveChallenge(organizationId);
      }

      // Pick a random challenge template
      const template = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)];

      const { data, error } = await supabase
        .from('team_challenges')
        .insert({
          organization_id: organizationId,
          challenge_type: template.type,
          title: template.title,
          description: template.description.replace('{target}', template.baseTarget),
          target_value: template.baseTarget,
          reward_points: template.rewardPoints,
          start_date: startDate,
          end_date: endDate,
        })
        .select()
        .single();

      if (error) throw error;

      set({ activeChallenge: data });
      return data;
    } catch (error) {
      console.error('Error generating weekly challenge:', error);
      return null;
    }
  },

  updateChallengeProgress: async (organizationId, incrementType, amount = 1) => {
    try {
      const challenge = get().activeChallenge;
      if (!challenge || challenge.is_completed) return;

      // Map increment type to challenge type
      const typeMapping = {
        task_complete: 'total_tasks',
        xl_complete: 'xl_tasks',
        do_first_complete: 'do_first_tasks',
        combo_triggered: 'combo_count',
      };

      const mappedType = typeMapping[incrementType];
      if (challenge.challenge_type !== mappedType) return;

      const newValue = challenge.current_value + amount;
      const isCompleted = newValue >= challenge.target_value;

      const { data, error } = await supabase
        .from('team_challenges')
        .update({
          current_value: newValue,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', challenge.id)
        .select()
        .single();

      if (error) throw error;

      set({ activeChallenge: data });

      return data;
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      return null;
    }
  },

  // ===========================================
  // CALCULATE FINAL POINTS
  // ===========================================

  calculateFinalPoints: (basePoints, streakDays = 0, comboMultiplier = 1.0) => {
    // Apply streak bonus
    const streakBonus = getStreakBonus(streakDays);
    const streakBonusPoints = Math.round(basePoints * streakBonus.bonus);

    // Apply combo multiplier
    const afterStreak = basePoints + streakBonusPoints;
    const comboBonusPoints = Math.round(afterStreak * (comboMultiplier - 1));

    const finalPoints = afterStreak + comboBonusPoints;

    return {
      basePoints,
      streakBonus: streakBonusPoints,
      comboBonus: comboBonusPoints,
      finalPoints,
      breakdown: {
        base: basePoints,
        streak: streakBonus.label ? `${streakBonus.label} (${streakBonusPoints})` : null,
        combo: comboMultiplier > 1 ? `${comboMultiplier}x (${comboBonusPoints})` : null,
      },
    };
  },

  clearError: () => set({ error: null }),
}));
