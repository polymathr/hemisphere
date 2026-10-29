import { supabase, isSupabaseConfigured } from '#lib/supabaseClient';
import type { PlannerEvent, TimeScope } from '#lib/types';

export const eventsService = {
  async fetchEvents(scope?: TimeScope): Promise<PlannerEvent[]> {
    if (!isSupabaseConfigured()) return [];

    let query = supabase.from('events').select('*').order('start_time', { ascending: true });
    if (scope) query = query.eq('scope', scope);

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching events from Supabase:', error);
      throw error;
    }
    return data || [];
  },

  async createEvent(event: Omit<PlannerEvent, 'id' | 'created_at' | 'updated_at'>): Promise<PlannerEvent | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select()
      .single();

    if (error) {
      console.error('Error creating event in Supabase:', error);
      throw error;
    }
    return data;
  },

  async updateEvent(id: string, updates: Partial<PlannerEvent>): Promise<PlannerEvent | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event in Supabase:', error);
      throw error;
    }
    return data;
  },

  async deleteEvent(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event in Supabase:', error);
      throw error;
    }
    return true;
  }
};
