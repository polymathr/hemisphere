<script lang="ts">
  import { appState, formatDateKey } from '#lib/appState.svelte';
  import { dataStore } from '#lib/dataStore.svelte';

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function getCommitmentsForDate(date: Date) {
    const key = formatDateKey(date);
    const dayEvts = dataStore.events.filter(e => {
      return e.start_time.startsWith(key);
    }).map(e => ({
      time: e.start_time.slice(11, 16) || '09:00',
      title: e.title,
      tag: e.is_milestone ? 'Focus' : 'Event'
    }));

    const dayTasks = dataStore.tasks.filter(t => {
      return t.target_date === key && Boolean(t.scheduled_time);
    }).map(t => ({
      time: t.scheduled_time?.slice(0, 5) || '11:00',
      title: t.title,
      tag: 'Task'
    }));

    return [...dayEvts, ...dayTasks];
  }
</script>

<div class="week-planner-container">
  <div class="planner-header">
    <div class="header-meta">
      <h3 class="font-serif">7-Day Horizon</h3>
    </div>
    <span class="badge-week-tag">Week 44</span>
  </div>

  <div class="days-column-stack">
    {#each appState.weekDays as dayDate, idx}
      {@const isToday = formatDateKey(dayDate) === '2026-10-28'}
      {@const isSelected = formatDateKey(dayDate) === appState.dateKey}
      {@const commitments = getCommitmentsForDate(dayDate)}
      <button 
        class="day-card"
        class:is-today={isToday}
        class:is-selected={isSelected}
        onclick={() => appState.setDate(dayDate)}
      >
        <div class="day-sidebar">
          <span class="day-name">{dayNames[idx]}</span>
          <span class="day-number font-serif">{dayDate.getDate()}</span>
          {#if isToday}
            <span class="today-dot"></span>
          {/if}
        </div>

        <div class="day-commitments">
          {#if commitments.length > 0}
            <div class="events-pill-row">
              {#each commitments as evt}
                <div class="mini-event-chip" class:urgent={evt.tag === 'Focus'}>
                  <span class="chip-time">{evt.time}</span>
                  <span class="chip-title">{evt.title}</span>
                </div>
              {/each}
            </div>
          {:else}
            <span class="empty-day-note">Open temporal space</span>
          {/if}

          <span 
            class="zoom-day-tag"
            role="button"
            tabindex="0"
            title="Open Day Spread for {dayNames[idx]}"
            onclick={(e) => {
              e.stopPropagation();
              appState.setDate(dayDate);
              appState.setView('DAY');
            }}
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
                appState.setDate(dayDate);
                appState.setView('DAY');
              }
            }}
          >
            Open Day ›
          </span>
        </div>
      </button>
    {/each}
  </div>
</div>

<style lang="scss">
  .week-planner-container {
    height: 100%;
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1.5rem 1.25rem 2rem 1.5rem;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  .planner-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border);

    .header-meta {
      h3 {
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--color-ink);
      }
    }

    .badge-week-tag {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-pill);
      background-color: var(--color-accent-sage-tint);
      color: var(--color-accent-sage-dark);
      border: 1px solid rgba(139, 168, 136, 0.25);
    }
  }

  .days-column-stack {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .day-card {
    display: flex;
    align-items: stretch;
    background-color: var(--color-surface-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 0.65rem 0.85rem;
    text-align: left;
    transition: all var(--duration-fast) var(--ease-soft);
    cursor: pointer;

    &:hover {
      border-color: var(--color-ink-faint);
      box-shadow: var(--shadow-subtle);
      transform: translateY(-1px);
    }

    &.is-today {
      border-color: var(--color-accent-terracotta);
      background: linear-gradient(90deg, var(--color-accent-terracotta-tint) 0%, var(--color-surface-elevated) 25%);

      .day-sidebar .day-number {
        color: var(--color-accent-terracotta-dark);
        font-weight: 600;
      }
    }

    &.is-selected {
      box-shadow: 0 0 0 2px var(--color-accent-sage);
    }

    .day-sidebar {
      width: 52px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-right: 1px solid var(--color-border-subtle);
      padding-right: 0.65rem;
      margin-right: 0.75rem;
      position: relative;

      .day-name {
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 600;
        color: var(--color-ink-faint);
      }

      .day-number {
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--color-ink);
        line-height: 1.1;
      }

      .today-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background-color: var(--color-accent-terracotta);
        margin-top: 3px;
      }
    }

    .day-commitments {
      flex: 1;
      display: flex;
      align-items: center;

      .events-pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;

        .mini-event-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.55rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;

          .chip-time {
            font-size: 0.6875rem;
            color: var(--color-ink-muted);
            font-weight: 500;
          }

          .chip-title {
            color: var(--color-ink);
            font-weight: 500;
          }

          &.urgent {
            border-color: rgba(194, 125, 101, 0.4);
            background-color: var(--color-accent-terracotta-tint);
          }
        }
      }

      .empty-day-note {
        font-size: 0.75rem;
        color: var(--color-ink-faint);
        font-style: italic;
      }

      .zoom-day-tag {
        font-size: 0.6875rem;
        font-weight: 500;
        color: var(--color-ink-faint);
        padding: 0.2rem 0.5rem;
        border-radius: var(--radius-pill);
        margin-left: auto;
        opacity: 0;
        transition: all var(--duration-fast) var(--ease-soft);
        white-space: nowrap;

        &:hover {
          color: var(--color-accent-terracotta-dark);
          background-color: var(--color-accent-terracotta-tint);
        }
      }

      &:hover .zoom-day-tag {
        opacity: 0.9;
      }
    }
  }
</style>
