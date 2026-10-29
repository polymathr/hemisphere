import { supabase, isSupabaseConfigured } from '#lib/supabaseClient';
import type { TaskItem, TimeScope } from '#lib/types';

export const tasksService = {
  async fetchTasks(targetDate?: string, scope?: TimeScope): Promise<TaskItem[]> {
    if (!isSupabaseConfigured()) return [];

    let query = supabase.from('tasks').select('*').order('sort_order', { ascending: true });
    if (scope) query = query.eq('scope', scope);
    if (targetDate) query = query.eq('target_date', targetDate);

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching tasks from Supabase:', error);
      throw error;
    }
    return data || [];
  },

  async createTask(task: Omit<TaskItem, 'id' | 'created_at' | 'updated_at'>): Promise<TaskItem | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();

    if (error) {
      console.error('Error creating task in Supabase:', error);
      throw error;
    }
    return data;
  },

  async updateTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task in Supabase:', error);
      throw error;
    }
    return data;
  },

  async scheduleTask(id: string, scheduledTime: string, durationMinutes = 30): Promise<TaskItem | null> {
    return this.updateTask(id, {
      scheduled_time: scheduledTime,
      duration_minutes: durationMinutes
    });
  },

  async unscheduleTask(id: string): Promise<TaskItem | null> {
    return this.updateTask(id, {
      scheduled_time: undefined,
      duration_minutes: undefined
    });
  },

  async deleteTask(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task in Supabase:', error);
      throw error;
    }
    return true;
  }
};
