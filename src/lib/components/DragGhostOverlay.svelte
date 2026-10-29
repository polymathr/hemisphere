<script lang="ts">
  import { dragDropState } from '#lib/dragDropState.svelte';
</script>

{#if dragDropState.isDragging}
  <div 
    class="drag-ghost-card"
    style="transform: translate3d({dragDropState.cursorX - dragDropState.grabOffsetX}px, {dragDropState.cursorY - dragDropState.grabOffsetY}px, 0);"
  >
    <div class="ghost-paper">
      <div class="ghost-indicator">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>{dragDropState.dragType === 'TASK' ? 'Placing Task in Planner' : 'Moving Event in Planner'}</span>
      </div>
      <span class="ghost-title">{dragDropState.draggedTitle}</span>
    </div>
  </div>
{/if}

<style lang="scss">
  .drag-ghost-card {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    pointer-events: none;
    z-index: 1000;
    will-change: transform;
  }

  .ghost-paper {
    background-color: var(--color-surface-elevated);
    border: 1.5px solid var(--color-accent-terracotta);
    border-radius: var(--radius-md);
    padding: 0.75rem 1rem;
    box-shadow: var(--shadow-floating);
    transform: scale(1.03) rotate(1.2deg);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    transition: box-shadow var(--duration-fast) ease;

    .ghost-indicator {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.625rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      color: var(--color-accent-terracotta-dark);
    }

    .ghost-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-ink);
      line-height: 1.35;
    }
  }
</style>
