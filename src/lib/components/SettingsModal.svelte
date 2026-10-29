<script lang="ts">
  import { appState } from '#lib/appState.svelte';
  import type { ThemeMode } from '#lib/types';

  const themes: { id: ThemeMode; name: string; desc: string; previewClass: string }[] = [
    {
      id: 'solid',
      name: 'Biophilic Solid',
      desc: 'Warm oat paper, slate ink, sage & terracotta accents',
      previewClass: 'preview-solid'
    },
    {
      id: 'plasma',
      name: 'Fluid Plasma',
      desc: 'Living organic gradient that gently flows in the background',
      previewClass: 'preview-plasma'
    },
    {
      id: 'dark',
      name: 'Obsidian Dark',
      desc: 'Deep warm charcoal with soft muted ink highlights',
      previewClass: 'preview-dark'
    }
  ];

  function handleSelect(id: ThemeMode) {
    appState.setTheme(id);
  }
</script>

{#if appState.isSettingsOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="settings-backdrop" onclick={() => appState.closeSettings()}>
    <div class="settings-modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Settings" tabindex="-1">
      <div class="modal-header">
        <div class="header-titles">
          <span class="settings-eyebrow">Preferences</span>
          <h3 class="modal-title font-serif">Appearance & Themes</h3>
        </div>
        <button 
          type="button" 
          class="close-btn" 
          onclick={() => appState.closeSettings()}
          aria-label="Close settings"
        >
          ✕
        </button>
      </div>

      <div class="themes-list">
        {#each themes as t}
          <button 
            type="button"
            class="theme-card"
            class:active={appState.currentTheme === t.id}
            onclick={() => handleSelect(t.id)}
          >
            <div class="preview-swatch {t.previewClass}">
              {#if appState.currentTheme === t.id}
                <span class="check-mark">✓</span>
              {/if}
            </div>
            <div class="theme-info">
              <span class="theme-name">{t.name}</span>
              <span class="theme-desc">{t.desc}</span>
            </div>
          </button>
        {/each}
      </div>

      <div class="gesture-hint-card">
        <span class="hint-icon">⚡</span>
        <div class="hint-text">
          <strong class="hint-title">Triple-Click Gesture</strong>
          <p class="hint-body">Click anywhere on the screen 3 times rapidly to toggle Dark Mode instantly without opening settings.</p>
        </div>
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .settings-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(26, 25, 24, 0.45);
    backdrop-filter: blur(4px);
    z-index: 90;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .settings-modal {
    width: 100%;
    max-width: 460px;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    box-shadow: var(--shadow-floating);
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes scaleUp {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    .settings-eyebrow {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-ink-muted);
      font-weight: 600;
    }

    .modal-title {
      font-size: 1.35rem;
      font-weight: 600;
      color: var(--color-ink);
      margin-top: 0.2rem;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      color: var(--color-ink-muted);
      border: 1px solid transparent;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-soft);

      &:hover {
        background-color: var(--color-surface-elevated);
        border-color: var(--color-border);
        color: var(--color-ink);
      }
    }
  }

  .themes-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .theme-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 1rem;
    border-radius: var(--radius-lg);
    background-color: var(--color-surface-elevated);
    border: 1.5px solid var(--color-border);
    cursor: pointer;
    text-align: left;
    transition: all var(--duration-fast) var(--ease-soft);

    &:hover {
      border-color: var(--color-ink-muted);
      transform: translateY(-1px);
    }

    &.active {
      border-color: var(--color-accent-terracotta);
      background-color: var(--color-surface);
      box-shadow: var(--shadow-subtle);
    }

    .preview-swatch {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      flex-shrink: 0;
      border: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 0.9rem;

      &.preview-solid {
        background: linear-gradient(135deg, #F7F5F0 50%, #8BA888 50%);
        border-color: #E6E1D8;
        color: #2C2A29;
      }

      &.preview-plasma {
        background: linear-gradient(135deg, #E1EDE2, #F5E1D3, #DCE8DA);
        background-size: 200% 200%;
        color: #2C2A29;
      }

      &.preview-dark {
        background: linear-gradient(135deg, #151413 50%, #D98971 50%);
        border-color: #33302C;
        color: #EDE9E3;
      }
    }

    .theme-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;

      .theme-name {
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--color-ink);
      }

      .theme-desc {
        font-size: 0.8rem;
        color: var(--color-ink-muted);
        line-height: 1.3;
      }
    }
  }

  .gesture-hint-card {
    display: flex;
    align-items: flex-start;
    gap: 0.875rem;
    padding: 0.875rem 1rem;
    border-radius: var(--radius-md);
    background-color: var(--color-accent-sage-tint);
    border: 1px solid var(--color-accent-sage);

    .hint-icon {
      font-size: 1.1rem;
      line-height: 1;
    }

    .hint-text {
      font-size: 0.8125rem;
      line-height: 1.35;
      color: var(--color-ink);

      .hint-title {
        display: block;
        margin-bottom: 0.15rem;
        color: var(--color-accent-sage-dark);
      }

      .hint-body {
        margin: 0;
        color: var(--color-ink-muted);
      }
    }
  }
</style>
