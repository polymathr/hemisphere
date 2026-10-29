import { dataStore } from '#lib/dataStore.svelte';
import type { AIAction, AIActionResponse, ScreenSnapshot } from '#lib/types';
import { appState } from '#lib/appState.svelte';

export function captureScreenSnapshot(): ScreenSnapshot {
  const currentView = appState.currentView;
  const currentDate = appState.dateKey;

  // Grab tasks visible in current scope
  const visibleTasks = dataStore.tasks
    .filter(t => t.scope === currentView)
    .map(t => ({
      id: t.id,
      title: t.title,
      is_completed: t.is_completed,
      scheduled_time: t.scheduled_time,
      scope: t.scope
    }));

  const visibleEvents = dataStore.events
    .filter(e => e.scope === currentView)
    .map(e => ({
      id: e.id,
      title: e.title,
      start_time: e.start_time,
      end_time: e.end_time,
      is_milestone: e.is_milestone
    }));

  return {
    activeView: currentView,
    currentDate,
    visibleTasks,
    visibleEvents,
    dailyLog: {
      one_line_summary: dataStore.dailyLog.one_line_summary,
      reflection_notes: dataStore.dailyLog.reflection_notes
    },
    habits: dataStore.habits.map(h => ({ id: h.id, name: h.name }))
  };
}

export async function executeAIActions(response: AIActionResponse): Promise<void> {
  const { actions } = response;
  if (!actions || actions.length === 0) return;

  for (const action of actions) {
    switch (action.type) {
      case 'scheduleTask': {
        await dataStore.scheduleTask(action.taskId, action.scheduledTime, action.durationMinutes || 30);
        break;
      }
      case 'unscheduleTask': {
        await dataStore.unscheduleTask(action.taskId);
        break;
      }
      case 'createTask': {
        const targetDate = action.targetDate || appState.dateKey;
        const scope = action.scope || appState.currentView;
        const created = await dataStore.addTask(action.title, scope, targetDate);
        if (action.scheduledTime && created) {
          await dataStore.scheduleTask(created.id, action.scheduledTime, action.durationMinutes || 30);
        }
        break;
      }
      case 'completeTask': {
        const task = dataStore.tasks.find(t => t.id === action.taskId);
        if (task && !task.is_completed) {
          await dataStore.toggleTask(action.taskId);
        }
        break;
      }
      case 'uncompleteTask': {
        const task = dataStore.tasks.find(t => t.id === action.taskId);
        if (task && task.is_completed) {
          await dataStore.toggleTask(action.taskId);
        }
        break;
      }
      case 'updateDailySummary': {
        const summary = action.oneLineSummary || dataStore.dailyLog.one_line_summary || '';
        const notes = action.reflectionNotes || dataStore.dailyLog.reflection_notes || '';
        await dataStore.saveDailySummary(appState.dateKey, summary, notes);
        break;
      }
      case 'toggleHabit': {
        await dataStore.toggleHabit(action.habitId, action.date);
        break;
      }
    }
  }
}
