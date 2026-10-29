<script lang="ts">
  import { appState } from '#lib/appState.svelte';
  import { dataStore } from '#lib/dataStore.svelte';
  import type { TimeScope } from '#lib/types';

  const viewModes: { id: TimeScope; label: string }[] = [
    { id: 'DAY', label: 'Day' },
    { id: 'WEEK', label: 'Week' }
  ];
</script>

<header class="topbar">
  <!-- Brand Identity -->
  <div class="brand-section">
    <div class="brand-emboss">
      <span class="brand-glyph">◒</span>
      <span class="brand-name">Hemisphere</span>
    </div>
  </div>

  <!-- Center Date Navigation -->
  <nav class="navigation-cluster" aria-label="Date Navigation">
    <button 
      class="nav-btn prev-btn" 
      onclick={() => appState.goToPrevious()}
      title="Previous period"
      aria-label="Previous period"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="date-header-group">
      <h2 class="date-display font-serif">{appState.formattedHeader}</h2>
      <button 
        class="today-btn" 
        onclick={() => appState.goToToday()}
        title="Jump to today"
      >
        Today
      </button>
    </div>

    <button 
      class="nav-btn next-btn" 
      onclick={() => appState.goToNext()}
      title="Next period"
      aria-label="Next period"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </nav>

  <!-- View Mode Switcher & Settings -->
  <div class="view-controls">
    <div class="segmented-pill" role="tablist" aria-label="View Modes">
      {#each viewModes as mode}
        <button
          role="tab"
          class="pill-tab"
          class:active={appState.currentView === mode.id}
          aria-selected={appState.currentView === mode.id}
          onclick={() => appState.setView(mode.id)}
        >
          {mode.label}
        </button>
      {/each}
    </div>

    <button 
      type="button" 
      class="settings-btn" 
      class:active={appState.isSettingsOpen}
      onclick={() => appState.toggleSettings()}
      title="Settings & Themes"
      aria-label="Settings & Themes"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </button>
  </div>
</header>

<style lang="scss">
  .topbar {
    height: var(--header-height);
    background-color: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.75rem;
    position: sticky;
    top: 0;
    z-index: 40;
    user-select: none;
  }

  .brand-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .brand-emboss {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .brand-glyph {
        color: var(--color-accent-terracotta);
        font-size: 1.15rem;
        line-height: 1;
      }

      .brand-name {
        font-family: var(--font-serif);
        font-size: 1.25rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        color: var(--color-ink);
      }
    }

  }

  .navigation-cluster {
    display: flex;
    align-items: center;
    gap: 0.875rem;

    .nav-btn {
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      color: var(--color-ink-muted);
      border: 1px solid transparent;
      transition: all var(--duration-fast) var(--ease-soft);

      &:hover {
        background-color: var(--color-surface);
        border-color: var(--color-border);
        color: var(--color-ink);
        transform: translateY(-1px);
      }

      &:active {
        transform: scale(0.92);
      }
    }

    .date-header-group {
      display: flex;
      align-items: center;
      gap: 0.625rem;

      .date-display {
        font-size: 1.2rem;
        font-weight: 500;
        color: var(--color-ink);
        min-width: 180px;
        text-align: center;
      }

      .today-btn {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--color-ink-muted);
        padding: 0.2rem 0.55rem;
        border-radius: var(--radius-pill);
        border: 1px solid var(--color-border);
        background-color: var(--color-surface);
        transition: all var(--duration-fast) var(--ease-soft);

        &:hover {
          color: var(--color-accent-terracotta);
          border-color: var(--color-accent-terracotta);
          background-color: var(--color-accent-terracotta-tint);
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }
  }

  .view-controls {
    display: flex;
    align-items: center;
    gap: 0.625rem;

    .segmented-pill {
      display: flex;
      background-color: rgba(44, 42, 41, 0.05);
      padding: 3px;
      border-radius: var(--radius-pill);
      border: 1px solid var(--color-border);

      .pill-tab {
        padding: 0.35rem 0.85rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--color-ink-muted);
        border-radius: var(--radius-pill);
        transition: all var(--duration-fast) var(--ease-soft);

        &:hover {
          color: var(--color-ink);
        }

        &.active {
          background-color: var(--color-surface-elevated);
          color: var(--color-ink);
          font-weight: 600;
          box-shadow: var(--shadow-subtle);
        }

        &:active {
          transform: scale(0.96);
        }
      }
    }

    .settings-btn {
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-pill);
      border: 1px solid var(--color-border);
      background-color: var(--color-surface);
      color: var(--color-ink-muted);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-soft);

      &:hover {
        color: var(--color-ink);
        border-color: var(--color-ink-muted);
        background-color: var(--color-surface-elevated);
        transform: translateY(-1px);
      }

      &.active {
        color: var(--color-accent-terracotta);
        border-color: var(--color-accent-terracotta);
        background-color: var(--color-accent-terracotta-tint);
      }

      &:active {
        transform: scale(0.92);
      }
    }
  }

  @media (max-width: 768px) {
    .topbar {
      padding: 0 1rem;
    }
    .brand-section {
      display: none;
    }
    .navigation-cluster .date-header-group .date-display {
      font-size: 1rem;
      min-width: 140px;
    }
  }
</style>
