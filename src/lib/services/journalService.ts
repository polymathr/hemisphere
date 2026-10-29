import { supabase, isSupabaseConfigured } from '#lib/supabaseClient';
import type { DailyLog } from '#lib/types';

export const journalService = {
  async fetchDailyLog(logDate: string): Promise<DailyLog | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('log_date', logDate)
      .maybeSingle();

    if (error) {
      console.error('Error fetching daily log:', error);
      throw error;
    }
    return data;
  },

  async saveDailyLog(log: Omit<DailyLog, 'id' | 'created_at' | 'updated_at'>): Promise<DailyLog | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('daily_logs')
      .upsert([log], { onConflict: 'user_id,log_date' })
      .select()
      .single();

    if (error) {
      console.error('Error saving daily log:', error);
      throw error;
    }
    return data;
  }
};
