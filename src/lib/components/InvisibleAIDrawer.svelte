<script lang="ts">
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { aiState } from '#lib/aiState.svelte';
  import { captureScreenSnapshot, executeAIActions } from '#lib/aiActionExecutor';
  import type { AIActionResponse } from '#lib/types';

  let promptText = $state<string>('');
  let isLoading = $state<boolean>(false);
  let statusMessage = $state<string | null>(null);

  let drawerEl = $state<HTMLElement | null>(null);
  let inputEl = $state<HTMLInputElement | null>(null);
  let inkBarEl = $state<HTMLElement | null>(null);

  const suggestions = [
    'Schedule my uncompleted tasks for this afternoon',
    'Add task: Review tactile spring physics easing',
    'Summarize today\'s progress in one line'
  ];

  // React to aiState.isOpen changes
  $effect(() => {
    if (aiState.isOpen) {
      requestAnimationFrame(() => {
        if (drawerEl) {
          gsap.fromTo(drawerEl, 
            { y: '120%', opacity: 0 },
            { y: '0%', opacity: 1, duration: 0.42, ease: 'power3.out' }
          );
        }
        inputEl?.focus();
      });
    }
  });

  export function closeDrawer() {
    if (!drawerEl) {
      aiState.close();
      return;
    }

    gsap.to(drawerEl, {
      y: '120%',
      opacity: 0,
      duration: 0.32,
      ease: 'power3.in',
      onComplete: () => {
        aiState.close();
        promptText = '';
      }
    });
  }

  // Keyboard shortcut listener (Cmd+J or Ctrl+J, Escape)
  onMount(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        aiState.toggle();
      } else if (e.key === 'Escape' && aiState.isOpen) {
        e.preventDefault();
        closeDrawer();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  // Tactile Ink Bleed Loading Animation with GSAP
  $effect(() => {
    if (isLoading && inkBarEl) {
      const tween = gsap.to(inkBarEl, {
        backgroundPosition: '200% center',
        duration: 1.4,
        repeat: -1,
        ease: 'none'
      });
      return () => {
        tween.kill();
      };
    }
  });

  async function handleSubmit(e?: Event) {
    if (e) e.preventDefault();
    const query = promptText.trim();
    if (!query || isLoading) return;

    isLoading = true;
    statusMessage = null;

    try {
      const screenContext = captureScreenSnapshot();

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, screenContext })
      });

      if (!res.ok) {
        throw new Error(`AI request returned ${res.status}`);
      }

      const data: AIActionResponse = await res.json();

      // Execute actions in dataStore
      await executeAIActions(data);

      statusMessage = data.statusMessage || 'Journal updated.';
      promptText = '';

      // Auto close after 3s of showing confirmation
      setTimeout(() => {
        if (aiState.isOpen && !isLoading) {
          closeDrawer();
        }
      }, 3000);
    } catch (err) {
      console.error('Failed to execute AI instruction:', err);
      statusMessage = 'Could not process command. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  function handleSelectSuggestion(s: string) {
    promptText = s;
    handleSubmit();
  }
</script>

{#if aiState.isOpen}
  <!-- Non-blocking bottom docked container (Never blocks page pointer/scroll events!) -->
  <aside class="ai-docked-container" aria-label="Invisible AI Assistant">
    <div 
      bind:this={drawerEl}
      class="ai-command-drawer"
    >
      <div class="drawer-inner">
        <!-- Editorial Header -->
        <div class="drawer-top-row">
          <div class="assistant-tag">
            <span class="glyph">◒</span>
            <span class="title">Invisible Journal Assistant</span>
            <span class="shortcut-badge">Cmd + J</span>
          </div>
          <button 
            type="button"
            class="dismiss-btn"
            onclick={closeDrawer}
            title="Close command line (Esc)"
            aria-label="Close command line"
          >
            ✕
          </button>
        </div>

        <!-- The Editorial Command Line Input -->
        <form class="command-form" onsubmit={handleSubmit}>
          <div class="input-line-wrapper">
            <span class="prompt-arrow font-serif">›</span>
            <input
              bind:this={inputEl}
              type="text"
              class="command-input font-sans"
              placeholder={isLoading ? "Analyzing journal state..." : "Type instruction (e.g. 'Plan my afternoon', 'Add task: Review PR')"}
              bind:value={promptText}
              disabled={isLoading}
            />
            {#if promptText && !isLoading}
              <button type="submit" class="execute-btn">
                Run ↵
              </button>
            {/if}
          </div>

          <!-- Tactile Ink Bleed Loading Bar -->
          <div 
            bind:this={inkBarEl}
            class="tactile-ink-bar"
            class:loading={isLoading}
          ></div>
        </form>

        <!-- Status confirmation or Quick Suggestions -->
        {#if statusMessage}
          <div class="status-banner">
            <span class="status-dot"></span>
            <span class="status-text">{statusMessage}</span>
          </div>
        {:else if !isLoading}
          <div class="suggestions-row">
            <span class="suggestions-label font-serif">Quick:</span>
            {#each suggestions as sug}
              <button 
                type="button" 
                class="suggestion-chip"
                onclick={() => handleSelectSuggestion(sug)}
              >
                {sug}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </aside>
{/if}

<style lang="scss">
  /* Docked at bottom without ANY full-screen blocking overlay */
  .ai-docked-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 90;
    pointer-events: none; /* Let all mouse/wheel events pass through to notebook and planner! */
    display: flex;
    justify-content: center;
    padding: 0 1.5rem 1.25rem 1.5rem;
  }

  .ai-command-drawer {
    width: 100%;
    max-width: 820px;
    background-color: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: 
      0 20px 48px -8px rgba(44, 42, 41, 0.22),
      0 4px 16px -2px rgba(44, 42, 41, 0.08);
    overflow: hidden;
    pointer-events: auto; /* Enable interaction inside the drawer */
    will-change: transform, opacity;
  }

  .drawer-inner {
    padding: 1.15rem 1.4rem 1rem 1.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .drawer-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .assistant-tag {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .glyph {
        color: var(--color-accent-terracotta);
        font-size: 0.875rem;
      }

      .title {
        font-family: var(--font-serif);
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-ink);
        letter-spacing: -0.01em;
      }

      .shortcut-badge {
        font-size: 0.625rem;
        color: var(--color-ink-muted);
        background-color: var(--color-surface-elevated);
        border: 1px solid var(--color-border);
        padding: 0.1rem 0.4rem;
        border-radius: var(--radius-sm);
        font-family: monospace;
      }
    }

    .dismiss-btn {
      font-size: 0.75rem;
      color: var(--color-ink-muted);
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      transition: all var(--duration-fast) ease;

      &:hover {
        background-color: var(--color-border-subtle);
        color: var(--color-ink);
      }
    }
  }

  .command-form {
    display: flex;
    flex-direction: column;
    position: relative;

    .input-line-wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.25rem 0;

      .prompt-arrow {
        font-size: 1.5rem;
        color: var(--color-accent-terracotta);
        line-height: 1;
        font-weight: 500;
      }

      .command-input {
        flex: 1;
        font-size: 1.05rem;
        color: var(--color-ink);
        background: transparent;
        border: none;
        outline: none;

        &::placeholder {
          color: var(--color-ink-faint);
          font-style: italic;
          font-size: 0.95rem;
        }

        &:disabled {
          opacity: 0.6;
        }
      }

      .execute-btn {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--color-ink);
        background-color: var(--color-surface-elevated);
        border: 1px solid var(--color-border);
        padding: 0.35rem 0.65rem;
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-subtle);
        transition: all var(--duration-fast) var(--ease-soft);

        &:hover {
          border-color: var(--color-accent-sage);
          color: var(--color-accent-sage-dark);
          transform: translateY(-1px);
        }

        &:active {
          transform: scale(0.96);
        }
      }
    }

    /* Tactile Ink Bleed Loading Bar */
    .tactile-ink-bar {
      height: 2px;
      width: 100%;
      background-color: var(--color-ink);
      margin-top: 0.4rem;
      position: relative;
      transition: height var(--duration-fast) ease;

      &.loading {
        height: 2.5px;
        background: linear-gradient(
          90deg,
          var(--color-ink) 0%,
          var(--color-accent-sage) 35%,
          var(--color-accent-sage-tint) 50%,
          var(--color-accent-sage) 65%,
          var(--color-ink) 100%
        );
        background-size: 200% 100%;
        box-shadow: 0 0 8px rgba(139, 168, 136, 0.4);
      }
    }
  }

  .status-banner {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.7rem;
    background-color: var(--color-accent-sage-tint);
    border: 1px solid rgba(139, 168, 136, 0.3);
    border-radius: var(--radius-sm);
    color: var(--color-accent-sage-dark);
    font-size: 0.8125rem;
    font-weight: 500;

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--color-accent-sage);
    }
  }

  .suggestions-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.45rem;
    padding-top: 0.15rem;

    .suggestions-label {
      font-size: 0.75rem;
      color: var(--color-ink-muted);
      font-style: italic;
      margin-right: 0.15rem;
    }

    .suggestion-chip {
      font-size: 0.75rem;
      color: var(--color-ink-muted);
      background-color: var(--color-surface-elevated);
      border: 1px solid var(--color-border-subtle);
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius-pill);
      transition: all var(--duration-fast) var(--ease-soft);

      &:hover {
        border-color: var(--color-ink-faint);
        color: var(--color-ink);
        background-color: var(--color-surface);
        transform: translateY(-1px);
      }

      &:active {
        transform: scale(0.96);
      }
    }
  }

  @media (max-width: 860px) {
    .ai-docked-container {
      padding: 0 0.75rem 0.75rem 0.75rem;
    }
  }
</style>
