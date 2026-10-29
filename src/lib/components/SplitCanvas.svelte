<script lang="ts">
  import PlannerPanel from './planner/PlannerPanel.svelte';
  import NotebookPanel from './notebook/NotebookPanel.svelte';
  import { appState } from '#lib/appState.svelte';
  import { animations } from '#lib/gsapAnimations';

  // Mobile active tab when stacked on narrow screens
  let mobileActivePane = $state<'PLANNER' | 'NOTEBOOK'>('NOTEBOOK');

  let plannerPaneEl = $state<HTMLElement | null>(null);
  let notebookPaneEl = $state<HTMLElement | null>(null);

  // GSAP View Transition effect when user changes Month/Week/Day
  $effect(() => {
    // Read currentView to subscribe
    const _view = appState.currentView;
    if (plannerPaneEl && notebookPaneEl) {
      animations.transitionViewSpread(plannerPaneEl, notebookPaneEl);
    }
  });
</script>

<main class="split-canvas-wrapper">
  <!-- Mobile Tab Switcher (Visible only on small viewports) -->
  <div class="mobile-pane-switcher">
    <button 
      class="mobile-tab"
      class:active={mobileActivePane === 'PLANNER'}
      onclick={() => mobileActivePane = 'PLANNER'}
    >
      Planner (Time)
    </button>
    <button 
      class="mobile-tab"
      class:active={mobileActivePane === 'NOTEBOOK'}
      onclick={() => mobileActivePane = 'NOTEBOOK'}
    >
      Notebook (Tasks & Journal)
    </button>
  </div>

  <div class="split-spread">
    <!-- Left 40% Spread: The Planner Floating Card -->
    <div 
      bind:this={plannerPaneEl}
      class="spread-pane planner-half"
      class:mobile-hidden={mobileActivePane !== 'PLANNER'}
    >
      <PlannerPanel />
    </div>

    <!-- Right 60% Spread: The Elevated Physical Notebook Floating Card -->
    <div 
      bind:this={notebookPaneEl}
      class="spread-pane notebook-half"
      class:mobile-hidden={mobileActivePane !== 'NOTEBOOK'}
    >
      <div class="paper-sheet">
        <NotebookPanel />
      </div>
    </div>
  </div>
</main>

<style lang="scss">
  .split-canvas-wrapper {
    flex: 1;
    min-height: 0;
    height: calc(100vh - var(--header-height));
    width: 100%;
    display: flex;
    flex-direction: column;
    background-color: transparent;
    overflow: hidden;
  }

  .mobile-pane-switcher {
    display: none;
    padding: 0.5rem 1rem;
    background-color: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    gap: 0.5rem;

    .mobile-tab {
      flex: 1;
      padding: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 500;
      border-radius: var(--radius-sm);
      color: var(--color-ink-muted);
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      text-align: center;

      &.active {
        background-color: var(--color-surface-elevated);
        color: var(--color-ink);
        font-weight: 600;
        border-color: var(--color-accent-sage);
      }
    }
  }

  .split-spread {
    flex: 1;
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 0;
    position: relative;
    padding: 1rem 1.5rem 1.5rem 1.5rem;
    gap: 1rem;
    box-sizing: border-box;
  }

  /* Left Side: 40% Planner Floating Card */
  .planner-half {
    flex: 0 0 calc(40% - 0.5rem);
    max-width: calc(40% - 0.5rem);
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    box-shadow: var(--shadow-paper);
    position: relative;
    overflow: hidden;
    z-index: 1;
  }

  /* Right Side: 60% Elevated Notebook Floating Card */
  .notebook-half {
    flex: 1;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 2;
    overflow: hidden;
    border-radius: 20px;
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-paper);
    background-color: var(--color-surface);

    .paper-sheet {
      height: 100%;
      width: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      border-radius: 20px;
      position: relative;
      overflow: hidden;
    }
  }

  /* Responsive layout for tablets and mobile */
  @media (max-width: 900px) {
    .mobile-pane-switcher {
      display: flex;
    }

    .split-spread {
      padding: 0.75rem;
    }

    .planner-half,
    .notebook-half {
      flex: 1 1 100%;
      max-width: 100%;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);

      &.mobile-hidden {
        display: none;
      }
    }

    .notebook-half .paper-sheet {
      border: none;
      border-radius: var(--radius-md);
    }
  }
</style>
