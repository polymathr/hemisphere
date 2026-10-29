<script lang="ts">
  import { appState } from '#lib/appState.svelte';
  import DayNotebook from './DayNotebook.svelte';
  import WeekNotebook from './WeekNotebook.svelte';
</script>

<article class="notebook-panel" aria-label="Notebook Tasks and Journal">
  {#if appState.currentView === 'DAY'}
    <DayNotebook />
  {:else if appState.currentView === 'WEEK'}
    <WeekNotebook />
  {/if}
</article>

<style lang="scss">
  .notebook-panel {
    height: 100%;
    width: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface);
    overflow: hidden;
    position: relative;
  }
</style>
