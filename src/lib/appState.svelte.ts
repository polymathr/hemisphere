import type { TimeScope, ThemeMode } from './types';

export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Monday is start of week (day === 0 is Sunday, so offset 6; else day - 1)
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDays(anchorDate: Date): Date[] {
  const start = getStartOfWeek(anchorDate);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(start);
    nextDay.setDate(start.getDate() + i);
    days.push(nextDay);
  }
  return days;
}

class HemisphereAppState {
  currentView = $state<TimeScope>('DAY');
  currentDate = $state<Date>(new Date(2026, 9, 28)); // Anchored to current date (Oct 28, 2026)
  currentTheme = $state<ThemeMode>('solid');
  isSettingsOpen = $state<boolean>(false);
  private lastThemeBeforeDark: ThemeMode = 'solid';

  // Reactive formatted string for TopBar header
  formattedHeader = $derived.by(() => {
    const d = this.currentDate;
    if (this.currentView === 'DAY') {
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }

    if (this.currentView === 'WEEK') {
      const days = getWeekDays(d);
      const start = days[0];
      const end = days[6];
      const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
      const year = end.getFullYear();

      if (startMonth === endMonth) {
        return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${year}`;
      }
      return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${year}`;
    }

    return '';
  });

  // Current ISO date string (YYYY-MM-DD)
  dateKey = $derived(formatDateKey(this.currentDate));

  // Current Week days (7 days starting Monday)
  weekDays = $derived(getWeekDays(this.currentDate));

  // Actions
  setView(view: TimeScope) {
    this.currentView = view;
  }

  setDate(date: Date) {
    this.currentDate = new Date(date);
  }

  goToToday() {
    this.currentDate = new Date();
  }

  goToNext() {
    const d = new Date(this.currentDate);
    if (this.currentView === 'DAY') {
      d.setDate(d.getDate() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    this.currentDate = d;
  }

  goToPrevious() {
    const d = new Date(this.currentDate);
    if (this.currentView === 'DAY') {
      d.setDate(d.getDate() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    this.currentDate = d;
  }

  // Theme Management
  setTheme(theme: ThemeMode) {
    this.currentTheme = theme;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem('hemisphere-theme', theme);
      } catch {
        // ignore localStorage errors
      }
    }
  }

  toggleDarkMode() {
    if (this.currentTheme === 'dark') {
      this.setTheme(this.lastThemeBeforeDark || 'solid');
    } else {
      this.lastThemeBeforeDark = this.currentTheme;
      this.setTheme('dark');
    }
  }

  toggleSettings() {
    this.isSettingsOpen = !this.isSettingsOpen;
  }

  closeSettings() {
    this.isSettingsOpen = false;
  }

  initTheme() {
    if (typeof window === 'undefined') return;

    // Restore saved theme
    try {
      const saved = localStorage.getItem('hemisphere-theme') as ThemeMode;
      if (saved && (saved === 'solid' || saved === 'plasma' || saved === 'dark')) {
        this.currentTheme = saved;
        document.documentElement.setAttribute('data-theme', saved);
      }
    } catch {
      // ignore
    }

    // Triple-Click Gesture on screen to toggle Dark Mode
    let clickCount = 0;
    let clickTimer: any = null;

    window.addEventListener('click', (e: MouseEvent) => {
      // Don't trigger if user is interacting with form inputs
      const target = e.target as HTMLElement;
      if (target.closest('input') || target.closest('textarea') || target.isContentEditable) {
        return;
      }

      // Check native e.detail === 3 or fallback timer
      if (e.detail === 3) {
        this.toggleDarkMode();
        return;
      }

      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 450);
      } else if (clickCount >= 3) {
        clearTimeout(clickTimer);
        clickCount = 0;
        this.toggleDarkMode();
      }
    });
  }
}

export const appState = new HemisphereAppState();
