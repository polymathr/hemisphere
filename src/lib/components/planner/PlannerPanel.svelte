<script lang="ts">
  import { appState } from '#lib/appState.svelte';
  import DayPlanner from './DayPlanner.svelte';
  import WeekPlanner from './WeekPlanner.svelte';
</script>

<aside class="planner-panel" aria-label="Planner Time and Dates">
  {#if appState.currentView === 'DAY'}
    <DayPlanner />
  {:else if appState.currentView === 'WEEK'}
    <WeekPlanner />
  {/if}
</aside>

<style lang="scss">
  .planner-panel {
    height: 100%;
    width: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg);
    overflow: hidden;
    position: relative;
  }
</style>
