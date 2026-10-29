<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '#lib/appState.svelte';
  import TopBar from '#lib/components/TopBar.svelte';
  import SplitCanvas from '#lib/components/SplitCanvas.svelte';
  import DragGhostOverlay from '#lib/components/DragGhostOverlay.svelte';
  import InvisibleAIDrawer from '#lib/components/InvisibleAIDrawer.svelte';
  import SettingsModal from '#lib/components/SettingsModal.svelte';

  onMount(() => {
    appState.initTheme();
  });
</script>

<div class="hemisphere-app">
  <TopBar />
  <SplitCanvas />
  <DragGhostOverlay />
  <InvisibleAIDrawer />
  <SettingsModal />
</div>

<style lang="scss">
  .hemisphere-app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    min-height: 0;
    overflow: hidden;
    background-color: var(--color-bg);
  }
</style>
