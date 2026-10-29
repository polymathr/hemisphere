import { supabase, isSupabaseConfigured } from '#lib/supabaseClient';
import { tasksService } from '#lib/services/tasksService';
import { eventsService } from '#lib/services/eventsService';
import { journalService } from '#lib/services/journalService';
import { habitsService } from '#lib/services/habitsService';
import { mockEvents, mockTasks, mockDailyLog, mockHabits, mockHabitLogs } from '#lib/mockData';
import type { TaskItem, PlannerEvent, DailyLog, Habit, HabitLog, TimeScope } from '#lib/types';

class DataStore {
  tasks = $state<TaskItem[]>([...mockTasks]);
  events = $state<PlannerEvent[]>([...mockEvents]);
  dailyLog = $state<DailyLog>({ ...mockDailyLog });
  habits = $state<Habit[]>([...mockHabits]);
  habitLogs = $state<HabitLog[]>([...mockHabitLogs]);

  isLive = $state<boolean>(false);
  isSyncing = $state<boolean>(false);
  lastSyncTime = $state<Date | null>(null);

  private realtimeChannel: any = null;

  constructor() {
    this.init();
  }

  async init() {
    if (!isSupabaseConfigured()) {
      console.info('Supabase keys not configured yet; running in high-fidelity local state mode.');
      this.isLive = false;
      return;
    }

    try {
      this.isSyncing = true;
      await this.refreshAll();
      this.setupRealtime();
      this.isLive = true;
      this.lastSyncTime = new Date();
    } catch (err) {
      console.warn('Initial Supabase fetch failed, falling back to local state:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  async refreshAll() {
    if (!isSupabaseConfigured()) return;

    const [remoteTasks, remoteEvents, remoteHabits, remoteHabitLogs] = await Promise.all([
      tasksService.fetchTasks().catch(() => []),
      eventsService.fetchEvents().catch(() => []),
      habitsService.fetchHabits().catch(() => []),
      habitsService.fetchHabitLogs().catch(() => [])
    ]);

    if (remoteTasks.length > 0) this.tasks = remoteTasks;
    if (remoteEvents.length > 0) this.events = remoteEvents;
    if (remoteHabits.length > 0) this.habits = remoteHabits;
    if (remoteHabitLogs.length > 0) this.habitLogs = remoteHabitLogs;
  }

  // Set up Supabase Realtime subscription
  private setupRealtime() {
    if (!isSupabaseConfigured() || this.realtimeChannel) return;

    this.realtimeChannel = supabase
      .channel('hemisphere_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        this.handleTaskRealtime(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
        this.handleEventRealtime(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          this.dailyLog = payload.new as DailyLog;
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_logs' }, (payload) => {
        this.handleHabitLogRealtime(payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isLive = true;
        }
      });
  }

  private handleTaskRealtime(payload: any) {
    const { eventType, new: newRec, old: oldRec } = payload;
    if (eventType === 'INSERT') {
      if (!this.tasks.some(t => t.id === newRec.id)) {
        this.tasks = [...this.tasks, newRec as TaskItem];
      }
    } else if (eventType === 'UPDATE') {
      this.tasks = this.tasks.map(t => (t.id === newRec.id ? (newRec as TaskItem) : t));
    } else if (eventType === 'DELETE') {
      this.tasks = this.tasks.filter(t => t.id !== oldRec.id);
    }
  }

  private handleEventRealtime(payload: any) {
    const { eventType, new: newRec, old: oldRec } = payload;
    if (eventType === 'INSERT') {
      if (!this.events.some(e => e.id === newRec.id)) {
        this.events = [...this.events, newRec as PlannerEvent];
      }
    } else if (eventType === 'UPDATE') {
      this.events = this.events.map(e => (e.id === newRec.id ? (newRec as PlannerEvent) : e));
    } else if (eventType === 'DELETE') {
      this.events = this.events.filter(e => e.id !== oldRec.id);
    }
  }

  private handleHabitLogRealtime(payload: any) {
    const { eventType, new: newRec, old: oldRec } = payload;
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      const idx = this.habitLogs.findIndex(h => h.id === newRec.id || (h.habit_id === newRec.habit_id && h.log_date === newRec.log_date));
      if (idx >= 0) {
        this.habitLogs[idx] = newRec as HabitLog;
        this.habitLogs = [...this.habitLogs];
      } else {
        this.habitLogs = [...this.habitLogs, newRec as HabitLog];
      }
    } else if (eventType === 'DELETE') {
      this.habitLogs = this.habitLogs.filter(h => h.id !== oldRec.id);
    }
  }

  // ==========================================
  // OPTIMISTIC TASK ACTIONS (Option A)
  // ==========================================

  async addTask(title: string, scope: TimeScope, targetDate: string): Promise<TaskItem> {
    const tempId = `task-${Date.now()}`;
    const newTask: TaskItem = {
      id: tempId,
      user_id: 'user-1',
      title: title.trim(),
      scope,
      target_date: targetDate,
      is_completed: false,
      sort_order: this.tasks.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Optimistic local update
    this.tasks = [...this.tasks, newTask];

    // 2. Persist to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const persisted = await tasksService.createTask({
          user_id: newTask.user_id,
          title: newTask.title,
          scope: newTask.scope,
          target_date: newTask.target_date,
          is_completed: false,
          sort_order: newTask.sort_order
        });
        if (persisted) {
          // Reconcile with real DB id
          this.tasks = this.tasks.map(t => (t.id === tempId ? persisted : t));
          return persisted;
        }
      } catch (err) {
        console.error('Failed to persist task, reverting optimistic creation:', err);
        this.tasks = this.tasks.filter(t => t.id !== tempId);
        throw err;
      }
    }

    return newTask;
  }

  async toggleTask(taskId: string): Promise<void> {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const previousCompleted = task.is_completed;
    const nextCompleted = !previousCompleted;
    const completedAt = nextCompleted ? new Date().toISOString() : undefined;

    // 1. Optimistic update
    this.tasks = this.tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, is_completed: nextCompleted, completed_at: completedAt };
      }
      return t;
    });

    // 2. Persist
    if (isSupabaseConfigured()) {
      try {
        await tasksService.updateTask(taskId, {
          is_completed: nextCompleted,
          completed_at: completedAt
        });
      } catch (err) {
        // Rollback
        this.tasks = this.tasks.map(t => (t.id === taskId ? { ...t, is_completed: previousCompleted } : t));
        console.error('Failed to update task completion, rolled back:', err);
      }
    }
  }

  async scheduleTask(taskId: string, scheduledTime: string, durationMinutes = 30): Promise<void> {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const prevScheduled = task.scheduled_time;
    const prevDuration = task.duration_minutes;

    // 1. Optimistic update (instantly synchronizes both Left Planner and Right Notebook)
    this.tasks = this.tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, scheduled_time: scheduledTime, duration_minutes: durationMinutes };
      }
      return t;
    });

    // 2. Persist
    if (isSupabaseConfigured()) {
      try {
        await tasksService.scheduleTask(taskId, scheduledTime, durationMinutes);
      } catch (err) {
        // Rollback
        this.tasks = this.tasks.map(t => {
          if (t.id === taskId) {
            return { ...t, scheduled_time: prevScheduled, duration_minutes: prevDuration };
          }
          return t;
        });
        console.error('Failed to schedule task into planner, rolled back:', err);
      }
    }
  }

  async unscheduleTask(taskId: string): Promise<void> {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const prevScheduled = task.scheduled_time;
    const prevDuration = task.duration_minutes;

    // 1. Optimistic update
    this.tasks = this.tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, scheduled_time: undefined, duration_minutes: undefined };
      }
      return t;
    });

    // 2. Persist
    if (isSupabaseConfigured()) {
      try {
        await tasksService.unscheduleTask(taskId);
      } catch (err) {
        this.tasks = this.tasks.map(t => {
          if (t.id === taskId) {
            return { ...t, scheduled_time: prevScheduled, duration_minutes: prevDuration };
          }
          return t;
        });
      }
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    const previous = [...this.tasks];
    this.tasks = this.tasks.filter(t => t.id !== taskId);

    if (isSupabaseConfigured()) {
      try {
        await tasksService.deleteTask(taskId);
      } catch (err) {
        this.tasks = previous;
        console.error('Failed to delete task, rolled back:', err);
      }
    }
  }

  async updateTaskTitle(taskId: string, newTitle: string): Promise<void> {
    const prev = this.tasks.find(t => t.id === taskId);
    if (!prev) return;
    const oldTitle = prev.title;

    this.tasks = this.tasks.map(t => (t.id === taskId ? { ...t, title: newTitle.trim() } : t));

    if (isSupabaseConfigured()) {
      try {
        await tasksService.updateTask(taskId, { title: newTitle.trim() });
      } catch (err) {
        this.tasks = this.tasks.map(t => (t.id === taskId ? { ...t, title: oldTitle } : t));
        console.error('Failed to update task title, rolled back:', err);
      }
    }
  }

  // ==========================================
  // EVENT ACTIONS (Calendar Events)
  // ==========================================

  async addEvent(eventData: { title: string; start_time: string; end_time?: string; description?: string; scope?: TimeScope }): Promise<PlannerEvent> {
    const tempId = `evt-${Date.now()}`;
    const newEvent: PlannerEvent = {
      id: tempId,
      user_id: 'user-1',
      title: eventData.title.trim(),
      description: eventData.description || '',
      scope: eventData.scope || 'DAY',
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      is_milestone: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Optimistic update
    this.events = [...this.events, newEvent];

    // 2. Persist
    if (isSupabaseConfigured()) {
      try {
        const persisted = await eventsService.createEvent({
          user_id: newEvent.user_id,
          title: newEvent.title,
          description: newEvent.description,
          scope: newEvent.scope,
          start_time: newEvent.start_time,
          end_time: newEvent.end_time,
          is_milestone: newEvent.is_milestone
        });
        if (persisted) {
          this.events = this.events.map(e => (e.id === tempId ? persisted : e));
          return persisted;
        }
      } catch (err) {
        this.events = this.events.filter(e => e.id !== tempId);
        console.error('Failed to persist event to Supabase, rolled back:', err);
      }
    }

    return newEvent;
  }

  async updateEvent(eventId: string, updates: Partial<PlannerEvent>): Promise<void> {
    const prev = this.events.find(e => e.id === eventId);
    if (!prev) return;
    const oldCopy = { ...prev };

    this.events = this.events.map(e => (e.id === eventId ? { ...e, ...updates, updated_at: new Date().toISOString() } : e));

    if (isSupabaseConfigured()) {
      try {
        await eventsService.updateEvent(eventId, updates);
      } catch (err) {
        this.events = this.events.map(e => (e.id === eventId ? oldCopy : e));
        console.error('Failed to update event, rolled back:', err);
      }
    }
  }

  async moveEvent(eventId: string, newStartTime: string): Promise<void> {
    const prev = this.events.find(e => e.id === eventId);
    if (!prev) return;

    // Calculate duration offset if end_time exists
    let newEndTime = prev.end_time;
    if (prev.end_time && prev.start_time) {
      const origStart = new Date(prev.start_time).getTime();
      const origEnd = new Date(prev.end_time).getTime();
      const durationMs = origEnd - origStart;
      if (durationMs > 0) {
        const newStartMs = new Date(newStartTime).getTime();
        newEndTime = new Date(newStartMs + durationMs).toISOString();
      }
    }

    await this.updateEvent(eventId, {
      start_time: newStartTime,
      end_time: newEndTime
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    const previous = [...this.events];
    this.events = this.events.filter(e => e.id !== eventId);

    if (isSupabaseConfigured()) {
      try {
        await eventsService.deleteEvent(eventId);
      } catch (err) {
        this.events = previous;
        console.error('Failed to delete event, rolled back:', err);
      }
    }
  }

  // ==========================================
  // JOURNAL & HABIT ACTIONS
  // ==========================================

  async saveDailySummary(logDate: string, oneLineSummary: string, reflectionNotes: string): Promise<void> {
    this.dailyLog = {
      ...this.dailyLog,
      log_date: logDate,
      one_line_summary: oneLineSummary,
      reflection_notes: reflectionNotes,
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        await journalService.saveDailyLog({
          user_id: 'user-1',
          log_date: logDate,
          one_line_summary: oneLineSummary,
          reflection_notes: reflectionNotes
        });
      } catch (err) {
        console.error('Failed to save daily summary:', err);
      }
    }
  }

  async toggleHabit(habitId: string, logDate: string): Promise<void> {
    const existing = this.habitLogs.find(h => h.habit_id === habitId && h.log_date === logDate);
    const nextCompleted = existing ? !existing.completed : true;

    // 1. Optimistic update
    if (existing) {
      this.habitLogs = this.habitLogs.map(h => (h.id === existing.id ? { ...h, completed: nextCompleted } : h));
    } else {
      const newLog: HabitLog = {
        id: `hlog-${Date.now()}`,
        habit_id: habitId,
        user_id: 'user-1',
        log_date: logDate,
        completed: true
      };
      this.habitLogs = [...this.habitLogs, newLog];
    }

    // 2. Persist
    if (isSupabaseConfigured()) {
      try {
        await habitsService.toggleHabitLog(habitId, logDate, nextCompleted);
      } catch (err) {
        console.error('Failed to toggle habit log:', err);
      }
    }
  }
}

export const dataStore = new DataStore();
