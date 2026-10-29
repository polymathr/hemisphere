# Hemisphere ◒
### *The Two-Minute Spread Journal & Temporal Planner*

> **Hemisphere** digitizes the physical tactile spread of an open editorial notebook. Rooted in the **KISS** (Keep It Simple, Stupid) principle and biophilic warmth, it replaces sterile, neon-accented SaaS productivity tools with the calming clarity of premium analog paper.

---

## 1. Project Philosophy

* **The Two-Minute Spread:** In an analog notebook, opening to a fresh double-page spread presents an immediate, unhurried landscape. The left page holds temporal anchoring (the hours and milestones); the right page holds mental clarity (intentions, checklists, and reflections). Hemisphere preserves this exact spatial balance.
* **Biophilic Warmth:** No `#000000` or `#FFFFFF`. Hemisphere is rendered exclusively in warm oat, espresso ink, muted botanical sage, and earthy terracotta.
* **Tactile Physics:** Interaction is never instantaneous or linear. Checkboxes yield with an elastic haptic bounce (`elastic.out(1, 0.5)`), dragged items lift with physical inertia, and struck-through tasks draw a fountain-pen ink rule across the page.
* **Invisible Intelligence:** No intrusive chatbot bubbles or synthetic avatars. The AI lives as a silent organizational command engine, revealed only upon scrolling to the bottom of the page or pressing `Cmd + J`. It responds exclusively in structured atomic actions, never conversational chatter.

---

## 2. Design System & Palette

| Token | Name | Hex | Usage |
| :--- | :--- | :--- | :--- |
| `--color-bg` | Warm Oat / Alabaster | `#F7F5F0` | Primary application canvas |
| `--color-surface` | Premium Paper Spread | `#FAF8F5` | Open notebook page surfaces |
| `--color-surface-elevated` | Card Paper | `#FFFDFB` | Lifted cards & floating overlays |
| `--color-ink` | Deep Slate / Espresso | `#2C2A29` | Text, ruled guidelines, borders |
| `--color-ink-muted` | Muted Graphite | `#66625F` | Secondary notes, timestamps |
| `--color-ink-faint` | Pencil Guideline | `#A39E99` | Captions, metadata, empty states |
| `--color-accent-sage` | Muted Botanical Sage | `#8BA888` | Progress, tracking, calming highlights |
| `--color-accent-terracotta` | Terracotta | `#C27D65` | Current time marker, active day, urgency |

### Typography
* **Editorial Serif (Fraunces):** Used for dates, headers, quotes, and milestone indicators with optical sizing.
* **Clean UI Sans (Inter / Satoshi):** Used for tasks, time blocks, and command line inputs.

### Surface Elevation & Binding
* Soft, diffuse paper shadows (`0 4px 16px -2px rgba(44, 42, 41, 0.05)`).
* Physical notebook corner radii (`8px` to `14px`).
* Center journal crease with stitched thread accents separating the Left 40% and Right 60% pages.

---

## 3. Architecture & Tech Stack

```
Hemisphere Full-Stack Architecture
┌────────────────────────────────────────────────────────┐
│                      TopBar.svelte                     │
│    [◒ Hemisphere]   <  October 28, 2026  >   [Day|Week] [⚙]
├───────────────────────────┬────────────────────────────┤
│   Left Planner (40%)      │   Right Notebook (60%)     │
│   • Google Calendar Engine│   • Clean Task Checklist   │
│   • 1min = 1px Coordinate │   • Inline Title Editing   │
│   • Exact 15m Slim Pills  │   • Live Progress Bar      │
│   • Multi-Hour Span (210m)│   • Freeform Notes Section │
│   • 15m Stretch Handle    │   • Drag to Left Planner   │
│   • Overlap Detection     │   • Cmd + J Assistant Cue  │
│   • Event Details Popover │   • 20px Floating Card     │
│   • Event Creation Popover│                            │
│   • 20px Floating Card    │                            │
└─────────────▲─────────────┴─────────────▲──────────────┘
              │                           │
              └─────────────┬─────────────┘
                            │
               src/lib/dataStore.svelte.ts (Svelte 5 Runes)
               • Optimistic UI Updates (0ms latency)
               • Supabase Realtime Sync Channel
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
   Supabase PostgreSQL            Invisible AI Engine
   • tasks (Single Truth)        • /api/ai (+server.ts)
   • events (Milestones)         • Gemini 1.5 Pro / Flash
   • daily_logs (Journals)       • Strict JSON Output
   • habits & habit_logs         • Sweeping Ink Bleed Loader
```

* **Frontend:** SvelteKit + **Svelte 5 Runes** (`$state`, `$derived`, `$props`, `$effect`).
* **Styling:** Modular SCSS design system (`_variables.scss`, `_typography.scss`, `_reset.scss`). Zero Tailwind.
* **Theme Engine:**
  * **Biophilic Solid:** Warm oat paper (`#F7F5F0`), espresso ink, sage, and terracotta.
  * **Fluid Plasma Gradient:** Organic living CSS mesh animation flowing continuously in the background.
  * **Obsidian Dark Mode:** Deep warm charcoal slate (`#151413`) with warm muted ink highlights.
* **Gestures & Physics:**
  * **Triple-Click Gesture:** 3 rapid clicks anywhere on the screen instantly toggles Dark Mode.
  * **GSAP Elastic Bounce:** Micro-interactions yield with `elastic.out(1, 0.5)`.
  * **Google Calendar 15-Minute Dynamic Stretch Handle:** Resizes event duration in magnetic 15-minute / 15px steps with live time feedback.
* **Database & Realtime:** **Supabase** (PostgreSQL with RLS, triggers, and Realtime publications).
* **AI Engine:** Google Gemini API (`@google/genai`) or Anthropic Claude with strict structured action schemas.

---

## 4. Getting Started

### Prerequisites
* Node.js v18+ (tested on Node v24.11)
* npm v9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/hemisphere.git
cd hemisphere

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI Assistant Configuration (Gemini 1.5 Pro / Flash)
GEMINI_API_KEY=your-gemini-api-key
```

> **Note:** If `.env` is omitted or left as placeholder, Hemisphere automatically boots into **High-Fidelity Offline Mode**, with an interactive in-memory/local data store and smart heuristic fallback for AI commands.

### Database Setup (Supabase)

Execute the migration script in your Supabase SQL Editor:
```bash
# Migration script located at:
supabase/migrations/20261028000000_hemisphere_schema.sql
```

This creates:
1. `events`: Standalone schedule blocks and monthly milestones.
2. `tasks`: Single source of truth for to-dos, storing `scheduled_time` and `duration_minutes` when scheduled onto the planner.
3. `daily_logs`: Stores the One-Line Daily Summary and freeform evening reflections.
4. `habits` & `habit_logs`: 31-day habit heatmap tracking.
5. `supabase_realtime`: Enables real-time cross-device sync.

### Development Server

Start the Vite development server:

```bash
npm run dev
```

Open your browser to:
```
http://localhost:5173
```

---

## 5. Key Interactions & Shortcuts

* **Drag-to-Plan:** Drag any task card from the Right Notebook and drop it over an hourly slot in the Left Planner. It immediately snaps into place via spring physics and sets `scheduled_time`.
* **Haptic Checkbox:** Click any checkbox for a tactile scale-down and elastic bounce back with an ink-drawn strikethrough.
* **Interactive Habit Heatmap:** In the Monthly view, click any of the 31 day cells to toggle habit completion state.
* **Invisible Assistant:**
  * Press `Cmd + J` (Mac) or `Ctrl + J` (Windows/Linux) to reveal the editorial command line.
  * Or scroll to the absolute bottom of your notebook page.
  * Type an instruction like:
    * `"Schedule my uncompleted tasks for this afternoon"`
    * `"Add task: Review design system tokens"`
    * `"Summarize today's progress in one line"`

---

## 6. Production Deployment (Vercel)

1. **Install Vercel Adapter (if required):**
   ```bash
   npm install -D @sveltejs/adapter-vercel
   ```
   Or deploy seamlessly using the zero-config auto-adapter (`@sveltejs/adapter-auto`).

2. **Push to GitHub / GitLab:**
   ```bash
   git init
   git add .
   git commit -m "feat: complete hemisphere physical spread app"
   git push origin main
   ```

3. **Deploy on Vercel Dashboard:**
   * Import the repository.
   * Framework Preset: **SvelteKit**.
   * Add the Environment Variables:
     * `PUBLIC_SUPABASE_URL`
     * `PUBLIC_SUPABASE_ANON_KEY`
     * `GEMINI_API_KEY`
   * Click **Deploy**.
