<script lang="ts">
  import { dataStore } from '#lib/dataStore.svelte';

  // Live weekly tasks from dataStore
  let weeklyTasks = $derived(dataStore.tasks.filter(t => t.scope === 'WEEK'));
  let completedCount = $derived(weeklyTasks.filter(t => t.is_completed).length);

  function handleToggle(taskId: string) {
    dataStore.toggleTask(taskId);
  }

  const deepWorkPriorities = [
    { title: 'Ship Split-Screen Engine Layout with GSAP Spring Physics', category: 'Architecture', progress: 85 },
    { title: 'Achieve Seamless Realtime Supabase Temporal Data Sync', category: 'Database', progress: 60 },
    { title: 'Fine-tune Biophilic Design Language & Typography Rhythms', category: 'Design', progress: 95 }
  ];
</script>

<div class="week-notebook-container">
  <header class="notebook-header">
    <div class="header-titles">
      <h3 class="font-serif">Week 44 Focus & Execution</h3>
    </div>
    <div class="progress-pill">
      <span class="progress-text">{completedCount} of {weeklyTasks.length} Completed</span>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {weeklyTasks.length ? (completedCount / weeklyTasks.length) * 100 : 0}%;"></div>
      </div>
    </div>
  </header>

  <!-- Deep Work Focus Anchors -->
  <section class="deep-work-section">
    <span class="section-badge">Deep Work Priorities</span>
    <div class="priorities-grid">
      {#each deepWorkPriorities as priority, idx}
        <div class="priority-card">
          <div class="priority-header">
            <span class="priority-index font-serif">0{idx + 1}</span>
            <span class="category-tag">{priority.category}</span>
          </div>
          <h4 class="priority-title">{priority.title}</h4>
          <div class="priority-bar-wrap">
            <div class="priority-bar">
              <div class="bar-fill" style="width: {priority.progress}%;"></div>
            </div>
            <span class="pct-label">{priority.progress}%</span>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Weekly Checklist -->
  <section class="weekly-checklist-section">
    <div class="section-header">
      <span class="section-badge">Weekly Checklist</span>
      <span class="count-hint">{weeklyTasks.length} items active</span>
    </div>

    <div class="checklist-stack">
      {#each weeklyTasks as task (task.id)}
        <div class="checklist-item" class:completed={task.is_completed}>
          <button 
            type="button"
            class="checkbox-btn"
            class:checked={task.is_completed}
            onclick={() => handleToggle(task.id)}
            aria-label={task.is_completed ? 'Mark task as incomplete' : 'Mark task as complete'}
          >
            {#if task.is_completed}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            {/if}
          </button>
          <span class="item-text">{task.title}</span>
        </div>
      {/each}
    </div>
  </section>
</div>

<style lang="scss">
  .week-notebook-container {
    height: 100%;
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1.75rem 2.25rem 3rem 2.25rem;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    gap: 1.75rem;
  }

  .notebook-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid var(--color-border);

    .header-titles {
      h3 {
        font-size: 1.35rem;
        font-weight: 500;
        color: var(--color-ink);
      }
    }

    .progress-pill {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.35rem;

      .progress-text {
        font-size: 0.75rem;
        color: var(--color-ink-muted);
        font-weight: 500;
      }

      .progress-bar {
        width: 100px;
        height: 5px;
        background-color: var(--color-border);
        border-radius: var(--radius-pill);
        overflow: hidden;

        .progress-fill {
          height: 100%;
          background-color: var(--color-accent-sage);
          border-radius: var(--radius-pill);
          transition: width var(--duration-normal) var(--ease-soft);
        }
      }
    }
  }

  .section-badge {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
    color: var(--color-ink-muted);
    display: block;
    margin-bottom: 0.75rem;
  }

  .priorities-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
    }

    .priority-card {
      background-color: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      box-shadow: var(--shadow-subtle);

      .priority-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .priority-index {
          font-size: 1.1rem;
          color: var(--color-accent-terracotta);
          font-weight: 600;
        }

        .category-tag {
          font-size: 0.625rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0.15rem 0.45rem;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-pill);
          color: var(--color-ink-muted);
        }
      }

      .priority-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-ink);
        line-height: 1.4;
        min-height: 2.6rem;
      }

      .priority-bar-wrap {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: auto;

        .priority-bar {
          flex: 1;
          height: 4px;
          background-color: var(--color-border-subtle);
          border-radius: var(--radius-pill);
          overflow: hidden;

          .bar-fill {
            height: 100%;
            background-color: var(--color-accent-sage);
            border-radius: var(--radius-pill);
          }
        }

        .pct-label {
          font-size: 0.6875rem;
          color: var(--color-ink-muted);
          font-weight: 600;
        }
      }
    }
  }

  .weekly-checklist-section {
    display: flex;
    flex-direction: column;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .count-hint {
        font-size: 0.75rem;
        color: var(--color-ink-faint);
        font-style: italic;
      }
    }

    .checklist-stack {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .checklist-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.75rem 0.85rem;
      background-color: var(--color-surface-elevated);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      transition: all var(--duration-fast) var(--ease-soft);

      &:hover {
        border-color: var(--color-border);
        box-shadow: var(--shadow-subtle);
      }

      &.completed {
        opacity: 0.6;
        .item-text {
          text-decoration: line-through;
          color: var(--color-ink-faint);
        }
      }

      .checkbox-btn {
        width: 20px;
        height: 20px;
        border-radius: var(--radius-sm);
        border: 1.75px solid var(--color-ink-faint);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: #fff;
        transition: all var(--duration-fast) var(--ease-spring);

        &.checked {
          background-color: var(--color-accent-sage);
          border-color: var(--color-accent-sage);
        }

        &:active {
          transform: scale(0.85);
        }
      }

      .item-text {
        font-size: 0.9375rem;
        color: var(--color-ink);
        line-height: 1.4;
      }
    }
  }
</style>
