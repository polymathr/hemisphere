<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '#lib/appState.svelte';
  import { dataStore } from '#lib/dataStore.svelte';
  import { dragDropState } from '#lib/dragDropState.svelte';
  import { aiState } from '#lib/aiState.svelte';
  import { animations } from '#lib/gsapAnimations';
  import type { TaskItem } from '#lib/types';

  // Notion-style Document Block interface
  interface DocBlock {
    id: string;
    type: 'task' | 'note' | 'heading' | 'bullet';
    content: string;
    taskId?: string; // if linked to a real task
  }

  // Common quick schedule hours for 1-click convenience
  const scheduleHours = [
    { label: '8:00 AM', time: '08:00:00' },
    { label: '9:00 AM', time: '09:00:00' },
    { label: '10:00 AM', time: '10:00:00' },
    { label: '11:00 AM', time: '11:00:00' },
    { label: '12:00 PM', time: '12:00:00' },
    { label: '1:00 PM', time: '13:00:00' },
    { label: '2:00 PM', time: '14:00:00' },
    { label: '3:00 PM', time: '15:00:00' },
    { label: '4:00 PM', time: '16:00:00' },
    { label: '5:00 PM', time: '17:00:00' },
    { label: '6:00 PM', time: '18:00:00' }
  ];

  let activeHourPickerTaskId = $state<string | null>(null);

  // Live tasks for current date
  let dayTasks = $derived(dataStore.tasks.filter(t => t.scope === 'DAY'));
  let completedCount = $derived(dayTasks.filter(t => t.is_completed).length);

  // Document freeform notes stored in dailyLog.reflection_notes
  let freeformNotes = $state<string>(dataStore.dailyLog.reflection_notes || '');

  // Quick task input at the top of document
  let quickTaskTitle = $state<string>('');

  async function handleAddQuickTask(e?: Event) {
    if (e) e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    await dataStore.addTask(quickTaskTitle.trim(), 'DAY', appState.dateKey);
    quickTaskTitle = '';
  }

  function handleToggleTask(taskId: string, checkboxEl: HTMLElement, rowEl: HTMLElement) {
    animations.bounceCheckbox(checkboxEl);
    dataStore.toggleTask(taskId);

    const strikeEl = rowEl.querySelector('.ink-strikethrough') as HTMLElement;
    const task = dayTasks.find(t => t.id === taskId);
    if (strikeEl && task) {
      animations.drawInkStrikethrough(strikeEl, !task.is_completed);
    }
  }

  function handleStartDragTask(e: MouseEvent, task: TaskItem, rowEl: HTMLElement) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('.hour-picker-popup')) return;

    dragDropState.startDrag(task, e, rowEl);
  }

  function handleToggleSchedulePicker(taskId: string, e: MouseEvent) {
    e.stopPropagation();
    activeHourPickerTaskId = activeHourPickerTaskId === taskId ? null : taskId;
  }

  function handleSelectHour(taskId: string, timeStr: string) {
    dataStore.scheduleTask(taskId, timeStr, 45);
    activeHourPickerTaskId = null;
  }

  function handleUnscheduleTask(taskId: string, e: MouseEvent) {
    e.stopPropagation();
    dataStore.unscheduleTask(taskId);
    activeHourPickerTaskId = null;
  }

  function handleUpdateTitle(taskId: string, newTitle: string) {
    if (newTitle.trim()) {
      dataStore.updateTaskTitle(taskId, newTitle.trim());
    }
  }

  function handleSaveNotes() {
    dataStore.saveDailySummary(appState.dateKey, dataStore.dailyLog.one_line_summary || '', freeformNotes);
  }

  // Close picker on outside click
  onMount(() => {
    function handleDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('.schedule-pill-btn') && !target.closest('.hour-picker-popup')) {
        activeHourPickerTaskId = null;
      }
    }
    window.addEventListener('click', handleDocClick);
    return () => window.removeEventListener('click', handleDocClick);
  });
</script>

<div class="notion-notebook-container">
  <!-- Minimalist Document Header -->
  <header class="doc-header">
    <div class="doc-title-group">
      <h2 class="doc-title font-serif">Today's Focus</h2>
      <div class="doc-meta-row">
        <span class="status-summary">
          {completedCount} of {dayTasks.length} completed
        </span>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {dayTasks.length ? (completedCount / dayTasks.length) * 100 : 0}%;"></div>
        </div>
      </div>
    </div>
  </header>

  <!-- Plain Paper Canvas -->
  <div class="canvas-sheet">
    <!-- Quick Add Block Input -->
    <div class="quick-add-bar">
      <form class="quick-form" onsubmit={handleAddQuickTask}>
        <span class="add-plus">+</span>
        <input 
          type="text" 
          class="quick-input font-sans" 
          placeholder="Type a task and press Enter, or drag to Left Planner..." 
          bind:value={quickTaskTitle}
        />
        {#if quickTaskTitle.trim()}
          <button type="submit" class="quick-submit-btn">Add Task</button>
        {/if}
      </form>
    </div>

    <!-- Notion-Style Tasks & Checklists Section -->
    <div class="blocks-container" role="list">
      {#each dayTasks as task (task.id)}
        {@const isBeingDragged = dragDropState.isDragging && dragDropState.draggedTask?.id === task.id}
        {@const isPickerOpen = activeHourPickerTaskId === task.id}

        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div 
          class="notion-block task-block"
          class:completed={task.is_completed}
          class:being-dragged={isBeingDragged}
          data-task-id={task.id}
          role="listitem"
          onmousedown={(e) => {
            const row = e.currentTarget as HTMLElement;
            handleStartDragTask(e, task, row);
          }}
        >
          <!-- Drag Handle Grip -->
          <div 
            class="drag-handle" 
            title="Drag onto Left Planner hourly slots"
            role="button"
            tabindex="0"
            aria-label="Drag to schedule"
            onmousedown={(e) => {
              const row = (e.currentTarget as HTMLElement).closest('.task-block') as HTMLElement;
              dragDropState.startDrag(task, e, row);
            }}
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
              <circle cx="3" cy="3" r="1.2" fill="currentColor"/>
              <circle cx="7" cy="3" r="1.2" fill="currentColor"/>
              <circle cx="3" cy="7" r="1.2" fill="currentColor"/>
              <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
              <circle cx="3" cy="11" r="1.2" fill="currentColor"/>
              <circle cx="7" cy="11" r="1.2" fill="currentColor"/>
            </svg>
          </div>

          <!-- Tactile physical checkbox -->
          <button 
            type="button"
            class="checkbox-btn"
            class:checked={task.is_completed}
            onclick={(e) => {
              const btn = e.currentTarget as HTMLElement;
              const row = btn.closest('.task-block') as HTMLElement;
              handleToggleTask(task.id, btn, row);
            }}
            aria-label={task.is_completed ? 'Mark task as incomplete' : 'Mark task as complete'}
          >
            {#if task.is_completed}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            {/if}
          </button>

          <!-- Inline Editable Title -->
          <div class="task-content">
            <div class="title-wrap">
              <span 
                class="task-title-text font-sans" 
                contenteditable="true"
                role="textbox"
                tabindex="0"
                aria-label="Edit task title"
                onblur={(e) => handleUpdateTitle(task.id, (e.target as HTMLElement).innerText)}
                onkeydown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    (e.target as HTMLElement).blur();
                  }
                }}
              >{task.title}</span>
              <span class="ink-strikethrough" class:active={task.is_completed}></span>
            </div>

            <!-- Schedule Badge & 1-Click Time Picker -->
            <div class="task-meta-actions">
              <div class="schedule-pill-wrap">
                {#if task.scheduled_time}
                  <button 
                    type="button"
                    class="schedule-pill-btn is-scheduled"
                    onclick={(e) => handleToggleSchedulePicker(task.id, e)}
                    title="Click to reschedule time, or drag directly to Left Planner"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.2"/>
                      <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                    <span>{task.scheduled_time.slice(0, 5)} Planner</span>
                  </button>
                {/if}

                <!-- 1-Click Hour Picker Popup -->
                {#if isPickerOpen}
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <div 
                    class="hour-picker-popup" 
                    role="dialog"
                    aria-label="Hour selector"
                    tabindex="-1"
                    onclick={(e) => e.stopPropagation()}
                  >
                    <div class="picker-header">
                      <span class="picker-label">Schedule into Left Planner</span>
                      {#if task.scheduled_time}
                        <button 
                          type="button" 
                          class="unschedule-action" 
                          onclick={(e) => handleUnscheduleTask(task.id, e)}
                        >
                          Clear
                        </button>
                      {/if}
                    </div>
                    <div class="hours-grid">
                      {#each scheduleHours as sh}
                        <button 
                          type="button"
                          class="hour-choice-btn"
                          class:active={task.scheduled_time === sh.time}
                          onclick={() => handleSelectHour(task.id, sh.time)}
                        >
                          {sh.label}
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>

              <!-- Delete Button -->
              <button
                type="button"
                class="block-delete-btn"
                title="Delete task"
                onclick={(e) => {
                  e.stopPropagation();
                  dataStore.deleteTask(task.id);
                }}
                aria-label="Delete task"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Freeform Notes & Notion-like Scratchpad -->
    <div class="notion-notes-section">
      <div class="notes-header">
        <span class="notes-tag font-serif">Notes</span>
      </div>
      <textarea 
        class="freeform-doc-textarea font-sans"
        placeholder="Type any meeting notes, daily reflections, brain dumps, or scratch ideas here..."
        bind:value={freeformNotes}
        onblur={handleSaveNotes}
        rows="8"
      ></textarea>
    </div>

    <!-- Bottom Assistant Invitation Trigger -->
    <div class="bottom-command-hint">
      <button 
        type="button" 
        class="ai-trigger-cue"
        onclick={() => aiState.open()}
      >
        <span class="cue-glyph font-serif">◒</span>
        <span class="cue-text">Press <kbd>Cmd</kbd> + <kbd>J</kbd> or click to open Assistant</span>
      </button>
    </div>
  </div>
</div>

<style lang="scss">
  .notion-notebook-container {
    height: 100%;
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1.75rem 2.5rem 3rem 2.5rem;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    background-color: var(--color-surface);
  }

  .doc-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding-bottom: 1.25rem;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid var(--color-border);

    .doc-title-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      .doc-title {
        font-size: 1.6rem;
        font-weight: 500;
        color: var(--color-ink);
        letter-spacing: -0.02em;
      }

      .doc-meta-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .status-summary {
          font-size: 0.8125rem;
          color: var(--color-ink-muted);
          font-weight: 500;
        }

        .progress-bar {
          width: 90px;
          height: 4.5px;
          background-color: var(--color-border-subtle);
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
  }

  .canvas-sheet {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .quick-add-bar {
    .quick-form {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      background-color: var(--color-surface-elevated);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      transition: all var(--duration-fast) var(--ease-soft);

      &:focus-within {
        border-color: var(--color-accent-sage);
        box-shadow: 0 0 0 2px rgba(139, 168, 136, 0.2);
        background-color: var(--color-surface);
      }

      .add-plus {
        font-size: 1.25rem;
        color: var(--color-accent-sage-dark);
        line-height: 1;
        font-weight: 400;
      }

      .quick-input {
        flex: 1;
        font-size: 0.9375rem;
        color: var(--color-ink);
        background: transparent;
        border: none;
        outline: none;

        &::placeholder {
          color: var(--color-ink-faint);
          font-style: italic;
        }
      }

      .quick-submit-btn {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.65rem;
        border-radius: var(--radius-sm);
        background-color: var(--color-accent-sage);
        color: #fff;
        transition: all var(--duration-fast) ease;

        &:hover {
          background-color: var(--color-accent-sage-dark);
        }
      }
    }
  }

  .blocks-container {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .notion-block {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 0.75rem;
    border-radius: var(--radius-md);
    background-color: transparent;
    border: 1px solid transparent;
    transition: all var(--duration-fast) var(--ease-soft);
    position: relative;

    &:hover {
      background-color: var(--color-surface-elevated);
      border-color: var(--color-border-subtle);

      .drag-handle {
        opacity: 0.7;
      }

      .block-delete-btn {
        opacity: 0.6;
      }
    }

    &.being-dragged {
      opacity: 0.3;
      border-style: dashed;
      border-color: var(--color-accent-terracotta);
      background-color: transparent;
      transform: scale(0.98);
    }

    &.completed {
      opacity: 0.65;

      .task-title-text {
        color: var(--color-ink-faint);
      }
    }

    .drag-handle {
      color: var(--color-ink-faint);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      opacity: 0.2;
      transition: opacity var(--duration-fast) ease;

      &:active {
        cursor: grabbing;
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
      transform-origin: center center;

      &:hover {
        border-color: var(--color-accent-sage-dark);
      }

      &.checked {
        background-color: var(--color-accent-sage);
        border-color: var(--color-accent-sage);
      }
    }

    .task-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;

      .title-wrap {
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;

        .task-title-text {
          width: 100%;
          font-size: 0.9375rem;
          color: var(--color-ink);
          background: transparent;
          outline: none;
          line-height: 1.4;
          padding: 0.15rem 0;
          cursor: text;

          &:focus {
            border-bottom: 1px dashed var(--color-accent-sage);
          }
        }

        .ink-strikethrough {
          position: absolute;
          left: 0;
          top: 50%;
          right: 0;
          height: 1.75px;
          background-color: var(--color-ink-faint);
          transform: scaleX(0);
          transform-origin: left center;
          border-radius: 1px;
          pointer-events: none;

          &.active {
            transform: scaleX(1);
          }
        }
      }

      .task-meta-actions {
        display: flex;
        align-items: center;
        gap: 0.45rem;

        .schedule-pill-wrap {
          position: relative;
        }

        .schedule-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.6875rem;
          font-weight: 500;
          padding: 0.2rem 0.55rem;
          border-radius: var(--radius-pill);
          background-color: var(--color-surface);
          color: var(--color-ink-muted);
          border: 1px solid var(--color-border);
          transition: all var(--duration-fast) var(--ease-soft);
          white-space: nowrap;

          &:hover {
            color: var(--color-accent-terracotta-dark);
            border-color: var(--color-accent-terracotta);
            background-color: var(--color-accent-terracotta-tint);
          }

          &.is-scheduled {
            background-color: var(--color-accent-terracotta-tint);
            color: var(--color-accent-terracotta-dark);
            border-color: rgba(194, 125, 101, 0.3);
          }
        }

        .hour-picker-popup {
          position: absolute;
          right: 0;
          top: calc(100% + 4px);
          width: 220px;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-floating);
          padding: 0.65rem;
          z-index: 50;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;

          .picker-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .picker-label {
              font-size: 0.6875rem;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              font-weight: 600;
              color: var(--color-ink-muted);
            }

            .unschedule-action {
              font-size: 0.6875rem;
              color: var(--color-accent-terracotta);
              &:hover { text-decoration: underline; }
            }
          }

          .hours-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 4px;
            max-height: 180px;
            overflow-y: auto;

            .hour-choice-btn {
              font-size: 0.75rem;
              padding: 0.3rem 0.45rem;
              text-align: center;
              border-radius: var(--radius-sm);
              border: 1px solid var(--color-border-subtle);
              color: var(--color-ink);
              transition: all var(--duration-fast) ease;

              &:hover {
                background-color: var(--color-accent-sage-tint);
                border-color: var(--color-accent-sage);
                color: var(--color-accent-sage-dark);
              }

              &.active {
                background-color: var(--color-accent-terracotta);
                border-color: var(--color-accent-terracotta);
                color: #fff;
                font-weight: 600;
              }
            }
          }
        }

        .block-delete-btn {
          width: 18px;
          height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.625rem;
          color: var(--color-ink-faint);
          border-radius: var(--radius-sm);
          opacity: 0;
          transition: all var(--duration-fast) var(--ease-soft);

          &:hover {
            color: var(--color-accent-terracotta);
            background-color: var(--color-accent-terracotta-tint);
          }
        }
      }
    }
  }

  .notion-notes-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px dashed var(--color-border-subtle);

    .notes-header {
      .notes-tag {
        font-size: 0.9375rem;
        font-weight: 500;
        color: var(--color-ink-muted);
        font-style: italic;
      }
    }

    .freeform-doc-textarea {
      width: 100%;
      font-size: 0.9375rem;
      line-height: 1.6;
      color: var(--color-ink);
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      padding: 0.5rem 0;

      &::placeholder {
        color: var(--color-ink-faint);
        font-style: italic;
      }
    }
  }

  .bottom-command-hint {
    display: flex;
    justify-content: center;
    padding-top: 1.5rem;

    .ai-trigger-cue {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-pill);
      background-color: var(--color-surface-elevated);
      border: 1px dashed var(--color-border);
      color: var(--color-ink-muted);
      font-size: 0.75rem;
      transition: all var(--duration-fast) var(--ease-soft);

      .cue-glyph {
        color: var(--color-accent-terracotta);
      }

      kbd {
        font-family: monospace;
        font-size: 0.6875rem;
        background-color: var(--color-surface);
        border: 1px solid var(--color-border);
        padding: 0.1rem 0.35rem;
        border-radius: 3px;
        color: var(--color-ink);
      }

      &:hover {
        border-color: var(--color-accent-sage);
        color: var(--color-ink);
        background-color: var(--color-surface);
        transform: translateY(-1px);
      }
    }
  }

  @media (max-width: 900px) {
    .notion-notebook-container {
      padding: 1.25rem 1rem 2.5rem 1rem;
    }
  }
</style>
