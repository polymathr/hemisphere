import { supabase, isSupabaseConfigured } from '#lib/supabaseClient';
import type { Habit, HabitLog } from '#lib/types';

export const habitsService = {
  async fetchHabits(): Promise<Habit[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }
    return data || [];
  },

  async fetchHabitLogs(startDate?: string, endDate?: string): Promise<HabitLog[]> {
    if (!isSupabaseConfigured()) return [];

    let query = supabase.from('habit_logs').select('*');
    if (startDate) query = query.gte('log_date', startDate);
    if (endDate) query = query.lte('log_date', endDate);

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching habit logs:', error);
      throw error;
    }
    return data || [];
  },

  async toggleHabitLog(habitId: string, logDate: string, completed: boolean): Promise<HabitLog | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('habit_logs')
      .upsert([{
        habit_id: habitId,
        log_date: logDate,
        completed
      }], { onConflict: 'habit_id,log_date' })
      .select()
      .single();

    if (error) {
      console.error('Error toggling habit log:', error);
      throw error;
    }
    return data;
  }
};
