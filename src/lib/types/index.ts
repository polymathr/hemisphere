export type TimeScope = 'DAY' | 'WEEK';
export type ItemPriority = 'LOW' | 'NORMAL' | 'URGENT';
export type ThemeMode = 'solid' | 'plasma' | 'dark';

export interface PlannerEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  scope: TimeScope;
  start_time: string; // ISO string
  end_time?: string;   // ISO string
  is_milestone: boolean;
  linked_task_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskItem {
  id: string;
  user_id: string;
  title: string;
  scope: TimeScope;
  target_date: string; // YYYY-MM-DD
  is_completed: boolean;
  completed_at?: string;
  sort_order: number;
  scheduled_time?: string; // HH:mm:ss if placed on planner
  duration_minutes?: number; // default 30
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string; // YYYY-MM-DD
  one_line_summary?: string;
  reflection_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  archived: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface ActiveViewState {
  scope: TimeScope;
  selectedDate: string; // YYYY-MM-DD
}

// ==========================================
// AI ASSISTANT SCHEMA & ACTIONS
// ==========================================

export type AIAction =
  | { type: 'scheduleTask'; taskId: string; scheduledTime: string; durationMinutes?: number }
  | { type: 'unscheduleTask'; taskId: string }
  | { type: 'createTask'; title: string; scope?: TimeScope; targetDate?: string; scheduledTime?: string; durationMinutes?: number }
  | { type: 'completeTask'; taskId: string }
  | { type: 'uncompleteTask'; taskId: string }
  | { type: 'updateDailySummary'; oneLineSummary?: string; reflectionNotes?: string }
  | { type: 'toggleHabit'; habitId: string; date: string };

export interface AIActionResponse {
  statusMessage: string;
  thought?: string;
  actions: AIAction[];
}

export interface ScreenSnapshot {
  activeView: TimeScope;
  currentDate: string;
  visibleTasks: Array<{
    id: string;
    title: string;
    is_completed: boolean;
    scheduled_time?: string;
    scope: TimeScope;
  }>;
  visibleEvents: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time?: string;
    is_milestone: boolean;
  }>;
  dailyLog?: {
    one_line_summary?: string;
    reflection_notes?: string;
  };
  habits?: Array<{
    id: string;
    name: string;
  }>;
}
