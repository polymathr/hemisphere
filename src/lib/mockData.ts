import type { PlannerEvent, TaskItem, DailyLog, Habit, HabitLog } from './types';

export const mockEvents: PlannerEvent[] = [
  // Daily Events (for Oct 28, 2026)
  {
    id: 'evt-1',
    user_id: 'user-1',
    title: 'Morning Espresso & Spread Review',
    description: 'Set daily intentions and review top 3 priorities',
    scope: 'DAY',
    start_time: '2026-10-28T08:30:00Z',
    end_time: '2026-10-28T08:45:00Z',
    is_milestone: false,
    created_at: '2026-10-28T07:00:00Z',
    updated_at: '2026-10-28T07:00:00Z'
  },
  {
    id: 'evt-2',
    user_id: 'user-1',
    title: 'Architecture Review: Svelte 5 & Supabase',
    description: 'Walk through runes reactivity and real-time temporal sync',
    scope: 'DAY',
    start_time: '2026-10-28T10:00:00Z',
    end_time: '2026-10-28T11:15:00Z',
    is_milestone: false,
    created_at: '2026-10-28T07:00:00Z',
    updated_at: '2026-10-28T07:00:00Z'
  },
  {
    id: 'evt-3',
    user_id: 'user-1',
    title: 'Movie ~ Baththa',
    description: 'Afternoon cinema screening and deep creative pause',
    scope: 'DAY',
    start_time: '2026-10-28T11:30:00Z',
    end_time: '2026-10-28T15:00:00Z',
    is_milestone: false,
    created_at: '2026-10-28T07:00:00Z',
    updated_at: '2026-10-28T07:00:00Z'
  },
  {
    id: 'evt-4',
    user_id: 'user-1',
    title: 'Lunch',
    description: 'Fresh Mediterranean salad & herbal tea',
    scope: 'DAY',
    start_time: '2026-10-28T13:00:00Z',
    end_time: '2026-10-28T13:30:00Z',
    is_milestone: false,
    created_at: '2026-10-28T07:00:00Z',
    updated_at: '2026-10-28T07:00:00Z'
  },
  {
    id: 'evt-5',
    user_id: 'user-1',
    title: 'CCNS Project',
    description: 'Architecture sync and systems review',
    scope: 'DAY',
    start_time: '2026-10-28T17:30:00Z',
    end_time: '2026-10-28T19:30:00Z',
    is_milestone: false,
    created_at: '2026-10-28T07:00:00Z',
    updated_at: '2026-10-28T07:00:00Z'
  },

  // Monthly Milestones (October 2026)
  {
    id: 'evt-m1',
    user_id: 'user-1',
    title: 'Sprint 1: Design Tokens & Biophilic Foundations',
    description: 'Alabaster, Espresso, Sage, and Fraunces typography integration',
    scope: 'WEEK',
    start_time: '2026-10-02T09:00:00Z',
    is_milestone: true,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z'
  },
  {
    id: 'evt-m2',
    user_id: 'user-1',
    title: 'Sprint 2: 40/60 Split-Screen Physical Layout',
    description: 'Dual-panel synchronized layout with tactile notebook binding',
    scope: 'WEEK',
    start_time: '2026-10-12T09:00:00Z',
    is_milestone: true,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z'
  },
  {
    id: 'evt-m3',
    user_id: 'user-1',
    title: 'Sprint 3: Supabase Realtime Architecture',
    description: 'Single-source-of-truth task state and temporal anchoring',
    scope: 'WEEK',
    start_time: '2026-10-21T09:00:00Z',
    is_milestone: true,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z'
  },
  {
    id: 'evt-m4',
    user_id: 'user-1',
    title: 'Sprint 4: Hemisphere Alpha 1.0 Release Candidate',
    description: 'Final QA, drag-and-drop verification, and invisible AI testing',
    scope: 'WEEK',
    start_time: '2026-10-28T09:00:00Z',
    is_milestone: true,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z'
  },
  {
    id: 'evt-m5',
    user_id: 'user-1',
    title: 'Sprint 5: Monthly Archive & Retrospective',
    description: 'End-of-month physical spread export and habit audit',
    scope: 'WEEK',
    start_time: '2026-10-31T17:00:00Z',
    is_milestone: true,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z'
  }
];

export const mockTasks: TaskItem[] = [
  // Daily Tasks (Oct 28, 2026)
  {
    id: 'task-1',
    user_id: 'user-1',
    title: 'Calibrate Fraunces font optical sizing for editorial headers',
    scope: 'DAY',
    target_date: '2026-10-28',
    is_completed: true,
    completed_at: '2026-10-28T09:30:00Z',
    sort_order: 1,
    created_at: '2026-10-28T07:30:00Z',
    updated_at: '2026-10-28T09:30:00Z'
  },
  {
    id: 'task-2',
    user_id: 'user-1',
    title: 'Review tactile diffuse paper shadow tokens',
    scope: 'DAY',
    target_date: '2026-10-28',
    is_completed: false,
    sort_order: 2,
    scheduled_time: '11:30:00',
    duration_minutes: 45,
    created_at: '2026-10-28T07:30:00Z',
    updated_at: '2026-10-28T07:30:00Z'
  },
  {
    id: 'task-3',
    user_id: 'user-1',
    title: 'Verify mobile responsive collapse for the 40/60 split view',
    scope: 'DAY',
    target_date: '2026-10-28',
    is_completed: false,
    sort_order: 3,
    created_at: '2026-10-28T07:30:00Z',
    updated_at: '2026-10-28T07:30:00Z'
  },
  {
    id: 'task-4',
    user_id: 'user-1',
    title: 'Draft product release notes for Alpha spread testers',
    scope: 'DAY',
    target_date: '2026-10-28',
    is_completed: false,
    sort_order: 4,
    scheduled_time: '17:00:00',
    duration_minutes: 30,
    created_at: '2026-10-28T07:30:00Z',
    updated_at: '2026-10-28T07:30:00Z'
  },
  {
    id: 'task-5',
    user_id: 'user-1',
    title: 'Establish global SCSS variables for Alabaster and Espresso',
    scope: 'DAY',
    target_date: '2026-10-28',
    is_completed: true,
    completed_at: '2026-10-28T08:15:00Z',
    sort_order: 5,
    created_at: '2026-10-28T07:30:00Z',
    updated_at: '2026-10-28T08:15:00Z'
  },
  {
    id: 'task-6',
    user_id: 'user-1',
    title: 'Benchmark Svelte 5 Runes reactivity across dual synchronized panes',
    scope: 'DAY',
    target_date: '2026-10-28',
    is_completed: false,
    sort_order: 6,
    created_at: '2026-10-28T07:30:00Z',
    updated_at: '2026-10-28T07:30:00Z'
  },

  // Weekly Tasks (Week 44 - starts Oct 26, 2026)
  {
    id: 'task-w1',
    user_id: 'user-1',
    title: 'Complete Split-Screen Layout engine with spring transitions',
    scope: 'WEEK',
    target_date: '2026-10-26',
    is_completed: true,
    completed_at: '2026-10-27T14:00:00Z',
    sort_order: 1,
    created_at: '2026-10-26T08:00:00Z',
    updated_at: '2026-10-27T14:00:00Z'
  },
  {
    id: 'task-w2',
    user_id: 'user-1',
    title: 'Test cross-device real-time sync with Supabase presence',
    scope: 'WEEK',
    target_date: '2026-10-26',
    is_completed: false,
    sort_order: 2,
    created_at: '2026-10-26T08:00:00Z',
    updated_at: '2026-10-26T08:00:00Z'
  },
  {
    id: 'task-w3',
    user_id: 'user-1',
    title: 'Implement the tactile drag-and-drop feedback physics',
    scope: 'WEEK',
    target_date: '2026-10-26',
    is_completed: false,
    sort_order: 3,
    created_at: '2026-10-26T08:00:00Z',
    updated_at: '2026-10-26T08:00:00Z'
  },
  {
    id: 'task-w4',
    user_id: 'user-1',
    title: 'Design invisible bottom AI bar drawer with Cmd+J trigger',
    scope: 'WEEK',
    target_date: '2026-10-26',
    is_completed: false,
    sort_order: 4,
    created_at: '2026-10-26T08:00:00Z',
    updated_at: '2026-10-26T08:00:00Z'
  },

  // Monthly Goals (October 2026)
  {
    id: 'task-m1',
    user_id: 'user-1',
    title: 'Ship Alpha release of the Hemisphere journal experience',
    scope: 'WEEK',
    target_date: '2026-10-01',
    is_completed: true,
    completed_at: '2026-10-25T18:00:00Z',
    sort_order: 1,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-25T18:00:00Z'
  },
  {
    id: 'task-m2',
    user_id: 'user-1',
    title: 'Achieve 98+ Lighthouse performance score with zero heavy CSS libraries',
    scope: 'WEEK',
    target_date: '2026-10-01',
    is_completed: false,
    sort_order: 2,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z'
  },
  {
    id: 'task-m3',
    user_id: 'user-1',
    title: 'Publish editorial essay on tactile analog workflows in the digital age',
    scope: 'WEEK',
    target_date: '2026-10-01',
    is_completed: false,
    sort_order: 3,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z'
  }
];

export const mockDailyLog: DailyLog = {
  id: 'log-1',
  user_id: 'user-1',
  log_date: '2026-10-28',
  one_line_summary: 'Crafted the biophilic layout foundation; paper textures evoke the calm focus of an analog notebook.',
  reflection_notes: 'The split between left temporal anchoring and right free-form task management brings immediate mental clarity. Keeping everything tactile and simple is working wonderfully.',
  created_at: '2026-10-28T08:00:00Z',
  updated_at: '2026-10-28T18:30:00Z'
};

export const mockHabits: Habit[] = [
  { id: 'hab-1', user_id: 'user-1', name: 'Deep Focus (4+ hrs)', archived: false, created_at: '2026-10-01T00:00:00Z' },
  { id: 'hab-2', user_id: 'user-1', name: 'Morning Journaling Spread', archived: false, created_at: '2026-10-01T00:00:00Z' },
  { id: 'hab-3', user_id: 'user-1', name: '30-Min Nature Walk', archived: false, created_at: '2026-10-01T00:00:00Z' },
  { id: 'hab-4', user_id: 'user-1', name: 'Hydration (2.5L)', archived: false, created_at: '2026-10-01T00:00:00Z' }
];

// Generate realistic 31-day heatmap for October 2026
export const mockHabitLogs: HabitLog[] = [];
// Completed patterns per habit for October 1 through 28
const patterns: Record<string, number[]> = {
  'hab-1': [1, 2, 3, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 26, 27, 28],
  'hab-2': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
  'hab-3': [1, 2, 4, 6, 7, 9, 11, 13, 14, 16, 18, 20, 21, 23, 25, 27, 28],
  'hab-4': [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28]
};

Object.entries(patterns).forEach(([habitId, days]) => {
  days.forEach((dayNum) => {
    const dayStr = String(dayNum).padStart(2, '0');
    mockHabitLogs.push({
      id: `hlog-${habitId}-${dayStr}`,
      habit_id: habitId,
      user_id: 'user-1',
      log_date: `2026-10-${dayStr}`,
      completed: true
    });
  });
});
