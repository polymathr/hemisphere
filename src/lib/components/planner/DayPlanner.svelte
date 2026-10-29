<script lang="ts">
  import { appState } from '#lib/appState.svelte';
  import { dataStore } from '#lib/dataStore.svelte';
  import { dragDropState } from '#lib/dragDropState.svelte';
  import type { TaskItem, PlannerEvent } from '#lib/types';

  // Google Calendar 1-Minute-to-1-Pixel Coordinate Architecture
  // 07:00 to 23:00 (16 hours = 960px canvas)
  const START_HOUR = 7;
  const END_HOUR = 23;
  const TOTAL_HOURS = END_HOUR - START_HOUR; // 16 hours
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => i + START_HOUR);

  function formatGCalHour(h: number): string {
    const period = h >= 12 ? 'PM' : 'AM';
    const disp = h % 12 === 0 ? 12 : h % 12;
    return `${disp} ${period}`;
  }

  function formatClockTime(h: number, m: number): string {
    const period = h >= 12 ? 'pm' : 'am';
    const dispH = h % 12 === 0 ? 12 : h % 12;
    const dispM = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
    return `${dispH}${dispM}${period}`;
  }

  function formatTimeRange(startH: number, startM: number, durationMinutes: number): string {
    const totalStartM = startH * 60 + startM;
    const totalEndM = totalStartM + durationMinutes;

    const endH = Math.floor(totalEndM / 60) % 24;
    const endM = totalEndM % 60;

    return `${formatClockTime(startH, startM)} – ${formatClockTime(endH, endM)}`;
  }

  // Simulated live current-time indicator at 14:15 (2:15 PM)
  const nowMinutesOffset = (14.25 - START_HOUR) * 60;

  // Google Calendar Vibrant Palette Tokens
  const GCAL_PALETTE = [
    { bg: '#D97757', border: '#C05F40', text: '#FFFFFF', dot: '#D97757', name: 'Terracotta' },
    { bg: '#5B8266', border: '#466D51', text: '#FFFFFF', dot: '#5B8266', name: 'Sage' },
    { bg: '#4A7C9A', border: '#376885', text: '#FFFFFF', dot: '#4A7C9A', name: 'Slate Blue' },
    { bg: '#8B579E', border: '#744286', text: '#FFFFFF', dot: '#8B579E', name: 'Grape' },
    { bg: '#A89B38', border: '#8F8226', text: '#FFFFFF', dot: '#A89B38', name: 'Ochre' },
    { bg: '#C27088', border: '#AA566E', text: '#FFFFFF', dot: '#C27088', name: 'Rose' }
  ];

  function getColorForItem(id: string, idx: number) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const colorIndex = Math.abs(hash + idx) % GCAL_PALETTE.length;
    return GCAL_PALETTE[colorIndex];
  }

  // Live events matching DAY scope
  let dayEvents = $derived(
    dataStore.events.filter(e => e.scope === 'DAY' || e.start_time?.startsWith(appState.dateKey))
  );

  // Live scheduled tasks (scheduled_time is set)
  let scheduledTasks = $derived(
    dataStore.tasks.filter(t => t.scope === 'DAY' && t.scheduled_time)
  );

  // Dynamic Google Calendar Stretch Handle State
  interface StretchState {
    itemId: string;
    itemType: 'event' | 'task';
    initialDuration: number;
    duration: number;
    startHour: number;
    startMinute: number;
    startY: number;
  }
  let stretchingState = $state<StretchState | null>(null);

  // Moving existing block on planner
  interface MovingState {
    itemId: string;
    itemType: 'event' | 'task';
    initialStartMinutes: number;
    currentStartMinutes: number;
    duration: number;
    startY: number;
  }
  let movingState = $state<MovingState | null>(null);

  // Google Calendar Event Details Card (Image 2)
  interface DetailsPopover {
    isOpen: boolean;
    item: PlannerEvent | TaskItem | null;
    itemType: 'event' | 'task';
    color: string;
    popoverY: number;
    isEditingTitle: boolean;
    editedTitle: string;
  }
  let detailsPopover = $state<DetailsPopover>({
    isOpen: false,
    item: null,
    itemType: 'event',
    color: '#D97757',
    popoverY: 100,
    isEditingTitle: false,
    editedTitle: ''
  });

  // Google Calendar Event Creation Card (Image 3)
  interface CreationPopover {
    isOpen: boolean;
    startHour: number;
    startMinute: number;
    durationMinutes: number;
    title: string;
    type: 'event' | 'task';
    clickY: number;
  }
  let creationPopover = $state<CreationPopover>({
    isOpen: false,
    startHour: 9,
    startMinute: 0,
    durationMinutes: 60,
    title: '',
    type: 'event',
    clickY: 120
  });

  // Unified Positioned Item Interface
  interface PositionedCalendarItem {
    id: string;
    type: 'event' | 'task';
    raw: PlannerEvent | TaskItem;
    title: string;
    description?: string;
    startHour: number;
    startMinute: number;
    durationMinutes: number;
    top: number;
    height: number;
    color: typeof GCAL_PALETTE[0];
    column: number;
    totalColumns: number;
    isCompleted?: boolean;
  }

  // Derive all active items and compute absolute coordinates and collision columns
  let positionedItems = $derived.by(() => {
    const rawList: Array<{
      id: string;
      type: 'event' | 'task';
      raw: PlannerEvent | TaskItem;
      title: string;
      description?: string;
      startHour: number;
      startMinute: number;
      durationMinutes: number;
      isCompleted?: boolean;
    }> = [];

    // 1. Process Calendar Events
    for (const evt of dayEvents) {
      const d = new Date(evt.start_time);
      const sHour = d.getUTCHours() || d.getHours() || 8;
      const sMin = d.getUTCMinutes() || d.getMinutes() || 0;

      let dur = 60;
      if (stretchingState && stretchingState.itemId === evt.id) {
        dur = stretchingState.duration;
      } else if (evt.end_time) {
        const end = new Date(evt.end_time);
        const diffMs = end.getTime() - d.getTime();
        dur = Math.max(15, Math.round(diffMs / (1000 * 60)));
      }

      rawList.push({
        id: evt.id,
        type: 'event',
        raw: evt,
        title: evt.title,
        description: evt.description,
        startHour: sHour,
        startMinute: sMin,
        durationMinutes: dur
      });
    }

    // 2. Process Scheduled Tasks
    for (const task of scheduledTasks) {
      if (!task.scheduled_time) continue;
      const parts = task.scheduled_time.split(':');
      const sHour = parseInt(parts[0], 10) || 8;
      const sMin = parseInt(parts[1], 10) || 0;

      let dur = task.duration_minutes || 30;
      if (stretchingState && stretchingState.itemId === task.id) {
        dur = stretchingState.duration;
      }

      rawList.push({
        id: task.id,
        type: 'task',
        raw: task,
        title: task.title,
        startHour: sHour,
        startMinute: sMin,
        durationMinutes: dur,
        isCompleted: task.is_completed
      });
    }

    // 3. Compute Top & Height in continuous 1min=1px coordinate system
    const mapped = rawList.map((item, idx) => {
      let startMins = (item.startHour - START_HOUR) * 60 + item.startMinute;

      // If user is currently dragging/moving this block up/down
      if (movingState && movingState.itemId === item.id) {
        startMins = movingState.currentStartMinutes;
      }

      const top = Math.max(0, startMins);
      // Strictly proportional height: 15m = 15px, 30m = 30px, 60m = 60px
      const height = Math.max(16, item.durationMinutes);

      return {
        ...item,
        top,
        height,
        color: getColorForItem(item.id, idx),
        startTotalMinutes: startMins,
        endTotalMinutes: startMins + item.durationMinutes,
        column: 0,
        totalColumns: 1
      };
    });

    // 4. Overlap & Collision detection algorithm (matching Google Calendar Image 1)
    mapped.sort((a, b) => a.startTotalMinutes - b.startTotalMinutes);

    for (let i = 0; i < mapped.length; i++) {
      const current = mapped[i];
      const overlaps: typeof mapped = [current];

      for (let j = 0; j < mapped.length; j++) {
        if (i === j) continue;
        const other = mapped[j];
        if (current.startTotalMinutes < other.endTotalMinutes && current.endTotalMinutes > other.startTotalMinutes) {
          overlaps.push(other);
        }
      }

      if (overlaps.length > 1) {
        overlaps.sort((a, b) => a.startTotalMinutes - b.startTotalMinutes || b.durationMinutes - a.durationMinutes);
        current.totalColumns = overlaps.length;
        current.column = overlaps.findIndex(o => o.id === current.id);
      }
    }

    return mapped;
  });

  // Handle click on empty canvas to open Google Calendar Creation Card (Image 3)
  function handleCanvasClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('.gcal-block') || target.closest('.gcal-details-popover') || target.closest('.gcal-create-popover')) {
      return;
    }

    detailsPopover.isOpen = false;

    const gridCanvas = e.currentTarget as HTMLElement;
    const rect = gridCanvas.getBoundingClientRect();
    const relativeY = Math.max(0, e.clientY - rect.top);

    // Snap to nearest 15-minute slot
    const snappedMinutes = Math.floor(relativeY / 15) * 15;
    const totalMinutesFromStart = snappedMinutes;
    const clickedHour = START_HOUR + Math.floor(totalMinutesFromStart / 60);
    const clickedMinute = totalMinutesFromStart % 60;

    creationPopover = {
      isOpen: true,
      startHour: Math.min(22, clickedHour),
      startMinute: clickedMinute,
      durationMinutes: 60,
      title: '',
      type: 'event',
      clickY: Math.min(relativeY, rect.height - 240)
    };
  }

  // Handle click on existing block to open Details Card (Image 2)
  function handleItemClick(e: MouseEvent, item: PositionedCalendarItem) {
    e.stopPropagation();
    creationPopover.isOpen = false;

    detailsPopover = {
      isOpen: true,
      item: item.raw,
      itemType: item.type,
      color: item.color.bg,
      popoverY: Math.max(20, Math.min(item.top, TOTAL_HOURS * 60 - 240)),
      isEditingTitle: false,
      editedTitle: item.title
    };
  }

  // Save new item from Google Calendar Creation Card
  async function handleSaveNewItem() {
    if (!creationPopover.title.trim()) {
      creationPopover.isOpen = false;
      return;
    }

    const hourStr = String(creationPopover.startHour).padStart(2, '0');
    const minStr = String(creationPopover.startMinute).padStart(2, '0');
    const timeStr = `${hourStr}:${minStr}:00`;

    if (creationPopover.type === 'event') {
      const startIso = `${appState.dateKey}T${timeStr}Z`;
      const endTotalMins = creationPopover.startHour * 60 + creationPopover.startMinute + creationPopover.durationMinutes;
      const endH = Math.floor(endTotalMins / 60);
      const endM = endTotalMins % 60;
      const endIso = `${appState.dateKey}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00Z`;

      await dataStore.addEvent({
        title: creationPopover.title.trim(),
        start_time: startIso,
        end_time: endIso,
        scope: 'DAY'
      });
    } else {
      const task = await dataStore.addTask(creationPopover.title.trim(), 'DAY', appState.dateKey);
      await dataStore.scheduleTask(task.id, timeStr, creationPopover.durationMinutes);
    }

    creationPopover.isOpen = false;
  }

  // Delete item from Details Popover
  async function handleDeleteFromDetails() {
    if (!detailsPopover.item) return;

    if (detailsPopover.itemType === 'event') {
      await dataStore.deleteEvent(detailsPopover.item.id);
    } else {
      await dataStore.unscheduleTask(detailsPopover.item.id);
    }

    detailsPopover.isOpen = false;
  }

  // Save in-place edited title from Details Popover
  async function handleSaveDetailsTitle() {
    if (!detailsPopover.item || !detailsPopover.editedTitle.trim()) return;

    if (detailsPopover.itemType === 'event') {
      await dataStore.updateEvent(detailsPopover.item.id, { title: detailsPopover.editedTitle.trim() });
    } else {
      await dataStore.updateTaskTitle(detailsPopover.item.id, detailsPopover.editedTitle.trim());
    }

    detailsPopover.isEditingTitle = false;
  }

  // Google Calendar 15-Minute Dynamic Stretch Handle (Bottom Edge Drag)
  function handleStartStretch(e: MouseEvent, item: PositionedCalendarItem) {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    stretchingState = {
      itemId: item.id,
      itemType: item.type,
      initialDuration: item.durationMinutes,
      duration: item.durationMinutes,
      startHour: item.startHour,
      startMinute: item.startMinute,
      startY: e.clientY
    };

    function onMouseMove(moveEvt: MouseEvent) {
      if (!stretchingState) return;
      const dy = moveEvt.clientY - stretchingState.startY;
      // 15px = 15 minutes increment
      const stepUnits = Math.round(dy / 15);
      const deltaMins = stepUnits * 15;
      const nextDur = Math.min(360, Math.max(15, stretchingState.initialDuration + deltaMins));
      stretchingState.duration = nextDur;
    }

    async function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (!stretchingState) return;
      const finalDur = stretchingState.duration;
      const sType = stretchingState.itemType;
      const sId = stretchingState.itemId;
      stretchingState = null;

      if (sType === 'event') {
        const evt = dataStore.events.find(e => e.id === sId);
        if (evt) {
          const start = new Date(evt.start_time);
          const end = new Date(start.getTime() + finalDur * 60 * 1000);
          await dataStore.updateEvent(sId, { end_time: end.toISOString() });
        }
      } else {
        const task = dataStore.tasks.find(t => t.id === sId);
        if (task && task.scheduled_time) {
          await dataStore.scheduleTask(sId, task.scheduled_time, finalDur);
        }
      }
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // Google Calendar Drag-to-Move across hours
  function handleItemPointerDown(e: MouseEvent, item: PositionedCalendarItem, blockEl: HTMLElement) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.gcal-stretch-handle') || target.closest('button') || target.closest('input')) return;

    e.preventDefault();
    const startY = e.clientY;
    const initialStart = (item.startHour - START_HOUR) * 60 + item.startMinute;

    movingState = {
      itemId: item.id,
      itemType: item.type,
      initialStartMinutes: initialStart,
      currentStartMinutes: initialStart,
      duration: item.durationMinutes,
      startY
    };

    function onMouseMove(moveEvt: MouseEvent) {
      if (!movingState) return;
      const dy = moveEvt.clientY - movingState.startY;
      // Snap in 15px (15 min) increments
      const stepUnits = Math.round(dy / 15);
      const deltaMinutes = stepUnits * 15;
      movingState.currentStartMinutes = Math.max(0, Math.min(TOTAL_HOURS * 60 - movingState.duration, movingState.initialStartMinutes + deltaMinutes));
    }

    async function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (!movingState) return;
      const finalStartMinutes = movingState.currentStartMinutes;
      const sType = movingState.itemType;
      const sId = movingState.itemId;
      const dur = movingState.duration;
      movingState = null;

      const newHour = START_HOUR + Math.floor(finalStartMinutes / 60);
      const newMinute = finalStartMinutes % 60;
      const timeStr = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}:00`;

      if (sType === 'event') {
        const startIso = `${appState.dateKey}T${timeStr}Z`;
        const endTotalMins = newHour * 60 + newMinute + dur;
        const endH = Math.floor(endTotalMins / 60);
        const endM = endTotalMins % 60;
        const endIso = `${appState.dateKey}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00Z`;
        await dataStore.updateEvent(sId, { start_time: startIso, end_time: endIso });
      } else {
        await dataStore.scheduleTask(sId, timeStr, dur);
      }
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function formatShortSingleTime(startH: number, startM: number): string {
    const period = startH >= 12 ? 'pm' : 'am';
    const dispH = startH % 12 === 0 ? 12 : startH % 12;
    const dispM = startM === 0 ? '' : `:${String(startM).padStart(2, '0')}`;
    return `${dispH}${dispM}${period}`;
  }

  function formatDetailsTime(item: PlannerEvent | TaskItem): string {
    if ('start_time' in item) {
      const d = new Date(item.start_time);
      const sH = d.getUTCHours() || d.getHours() || 8;
      const sM = d.getUTCMinutes() || d.getMinutes() || 0;
      let dur = 60;
      if (item.end_time) {
        dur = Math.max(15, Math.round((new Date(item.end_time).getTime() - d.getTime()) / (1000 * 60)));
      }
      return `${appState.formattedHeader} · ${formatTimeRange(sH, sM, dur)}`;
    } else {
      const parts = (item.scheduled_time || '08:00:00').split(':');
      const sH = parseInt(parts[0], 10) || 8;
      const sM = parseInt(parts[1], 10) || 0;
      const dur = item.duration_minutes || 30;
      return `${appState.formattedHeader} · ${formatTimeRange(sH, sM, dur)}`;
    }
  }

  function formatCreationTime(h: number, m: number, dur: number): string {
    return `${appState.formattedHeader} · ${formatTimeRange(h, m, dur)}`;
  }

  function formatDropTime(h: number, m: number): string {
    return formatClockTime(h, m);
  }
</script>

<div class="google-calendar-container">
  <!-- Original Editorial Header -->
  <div class="planner-header">
    <div class="header-meta">
      <span class="eyebrow">Daily Schedule</span>
      <h3 class="font-serif">Hourly Distribution</h3>
    </div>
  </div>

  <!-- Scrollable Continuous Timeline (1 minute = 1 pixel) -->
  <div class="calendar-timeline-scroll">
    <div class="timeline-inner-wrapper">
      <!-- Left Time Gutter with exact hour ticks -->
      <div class="time-gutter" aria-hidden="true">
        {#each hours as hour}
          <div class="time-label font-sans" style="top: {(hour - START_HOUR) * 60}px;">
            <span class="label-text">{formatGCalHour(hour)}</span>
          </div>
        {/each}
      </div>

      <!-- Continuous Grid Canvas (960px tall) -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div 
        class="calendar-grid-canvas" 
        style="height: {TOTAL_HOURS * 60}px;"
        onclick={handleCanvasClick}
      >
        <!-- Horizontal Hour Lines -->
        {#each hours as hour, idx}
          <div class="hour-grid-line" style="top: {idx * 60}px;"></div>
        {/each}

        <!-- Red / Terracotta Current Time Indicator (Image 1) -->
        <div class="current-time-marker" style="top: {nowMinutesOffset}px;">
          <span class="current-time-dot"></span>
          <div class="current-time-line"></div>
        </div>

        <!-- Magnetic Drop Target Preview when Dragging Task from Right Notebook -->
        {#if dragDropState.isDragging && dragDropState.hoveredHour !== null}
          {@const dropTop = (dragDropState.hoveredHour - START_HOUR) * 60 + (dragDropState.hoveredMinute || 0)}
          <div 
            class="calendar-drop-preview font-sans" 
            style="top: {dropTop}px; height: 36px;"
          >
            <span class="drop-plus">+</span>
            <span class="drop-title">Place at {formatDropTime(dragDropState.hoveredHour, dragDropState.hoveredMinute || 0)}</span>
          </div>
        {/if}

        <!-- Google Calendar Event & Task Blocks (Image 1) -->
        {#each positionedItems as item (item.id)}
          {@const isShort = item.height <= 26}
          {@const isMedium = item.height > 26 && item.height <= 44}
          {@const isTall = item.height > 44}
          {@const isStretching = stretchingState?.itemId === item.id}
          {@const isMoving = movingState?.itemId === item.id}

          {@const leftPercent = item.totalColumns > 1 ? (item.column * (100 / item.totalColumns)) : 0}
          {@const widthPercent = item.totalColumns > 1 ? (100 / item.totalColumns) : 100}

          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <div 
            class="gcal-block"
            class:is-short={isShort}
            class:is-medium={isMedium}
            class:is-tall={isTall}
            class:is-task={item.type === 'task'}
            class:is-completed={item.isCompleted}
            class:is-stretching={isStretching}
            class:is-moving={isMoving}
            style="
              top: {item.top}px;
              height: {item.height}px;
              left: calc({leftPercent}% + 3px);
              width: calc({widthPercent}% - 6px);
              background-color: {item.color.bg};
              border-color: {item.color.border};
            "
            role="button"
            tabindex="0"
            onclick={(e) => handleItemClick(e, item)}
            onmousedown={(e) => handleItemPointerDown(e, item, e.currentTarget as HTMLElement)}
          >
            {#if isShort}
              <!-- Single-line compact pill format for 15-minute events (e.g. Lunch, 1pm) -->
              <div class="single-line-content font-sans">
                <span class="item-title-single">{item.title}</span>
                <span class="item-time-single">, {formatShortSingleTime(item.startHour, item.startMinute)}</span>
              </div>
            {:else}
              <!-- Standard stacked format for events >= 30m -->
              <div class="stacked-content font-sans">
                <div class="title-row">
                  <strong class="item-title">{item.title}</strong>
                </div>
                <div class="time-row">
                  <span class="item-time">{formatTimeRange(item.startHour, item.startMinute, item.durationMinutes)}</span>
                </div>
                {#if isTall && item.description}
                  <p class="item-desc">{item.description}</p>
                {/if}
              </div>
            {/if}

            <!-- Live Floating Range Badge while stretching -->
            {#if isStretching && stretchingState}
              <div class="stretch-live-badge font-sans">
                {formatTimeRange(item.startHour, item.startMinute, stretchingState.duration)}
              </div>
            {/if}

            <!-- Google Calendar Bottom Stretch Handle -->
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <div 
              class="gcal-stretch-handle"
              title="Drag up or down to adjust duration (15m increments)"
              role="slider"
              tabindex="0"
              aria-label="Resize duration"
              aria-valuenow={item.durationMinutes}
              onmousedown={(e) => handleStartStretch(e, item)}
            ></div>
          </div>
        {/each}

        <!-- Google Calendar Details Popover (Image 2) -->
        {#if detailsPopover.isOpen && detailsPopover.item}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div 
            class="gcal-details-popover" 
            style="top: {detailsPopover.popoverY}px;"
            onclick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Event details"
            tabindex="-1"
          >
            <div class="details-top-bar">
              <div class="actions-left">
                <button 
                  type="button" 
                  class="action-icon-btn edit-btn" 
                  title="Edit title"
                  onclick={() => {
                    detailsPopover.isEditingTitle = !detailsPopover.isEditingTitle;
                    if (detailsPopover.item) detailsPopover.editedTitle = detailsPopover.item.title;
                  }}
                >
                  ✎
                </button>
                <button 
                  type="button" 
                  class="action-icon-btn delete-btn" 
                  title="Delete"
                  onclick={handleDeleteFromDetails}
                >
                  🗑
                </button>
              </div>
              <button 
                type="button" 
                class="action-icon-btn close-btn" 
                title="Close"
                onclick={() => detailsPopover.isOpen = false}
              >
                ✕
              </button>
            </div>

            <div class="details-body">
              {#if detailsPopover.isEditingTitle}
                <!-- svelte-ignore a11y_autofocus -->
                <input 
                  type="text" 
                  class="details-edit-input font-sans" 
                  bind:value={detailsPopover.editedTitle}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') handleSaveDetailsTitle();
                    if (e.key === 'Escape') detailsPopover.isEditingTitle = false;
                  }}
                  onblur={handleSaveDetailsTitle}
                  autofocus
                />
              {:else}
                <div class="details-title-row">
                  <span class="color-swatch-circle" style="background-color: {detailsPopover.color};"></span>
                  <h3 class="details-title font-sans">{detailsPopover.item.title}</h3>
                </div>
              {/if}

              <div class="details-time-row font-sans">
                <span class="clock-icon">🕒</span>
                <span class="time-label">{formatDetailsTime(detailsPopover.item)}</span>
              </div>

              {#if 'description' in detailsPopover.item && detailsPopover.item.description}
                <div class="details-desc-row font-sans">
                  <span class="desc-icon">≡</span>
                  <p class="desc-text">{detailsPopover.item.description}</p>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Google Calendar Creation Popover (Image 3) -->
        {#if creationPopover.isOpen}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div 
            class="gcal-create-popover" 
            style="top: {creationPopover.clickY}px;"
            onclick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Add event or task"
            tabindex="-1"
          >
            <div class="create-top-bar">
              <button 
                type="button" 
                class="create-close-btn" 
                onclick={() => creationPopover.isOpen = false}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div class="create-content">
              <!-- svelte-ignore a11y_autofocus -->
              <input 
                type="text" 
                class="create-title-input font-sans" 
                placeholder="Add title" 
                bind:value={creationPopover.title}
                onkeydown={(e) => {
                  if (e.key === 'Enter') handleSaveNewItem();
                  if (e.key === 'Escape') creationPopover.isOpen = false;
                }}
                autofocus
              />

              <div class="create-type-tabs">
                <button 
                  type="button" 
                  class="type-tab-btn" 
                  class:active={creationPopover.type === 'event'}
                  onclick={() => creationPopover.type = 'event'}
                >
                  Event
                </button>
                <button 
                  type="button" 
                  class="type-tab-btn" 
                  class:active={creationPopover.type === 'task'}
                  onclick={() => creationPopover.type = 'task'}
                >
                  Task
                </button>
              </div>

              <div class="create-time-meta font-sans">
                <span class="meta-clock">🕒</span>
                <span class="meta-date">{formatCreationTime(creationPopover.startHour, creationPopover.startMinute, creationPopover.durationMinutes)}</span>
              </div>

              <div class="create-footer-row">
                <button 
                  type="button" 
                  class="create-save-btn font-sans" 
                  onclick={handleSaveNewItem}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .google-calendar-container {
    height: 100%;
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface);
    position: relative;
    overflow: hidden;
    user-select: none;
  }

  /* Original Editorial Planner Header */
  .planner-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 1.5rem 1.75rem 1.25rem 1.75rem;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;

    .header-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .eyebrow {
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
        color: var(--color-ink-muted);
      }

      h3 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--color-ink);
        letter-spacing: -0.02em;
        line-height: 1.1;
      }
    }
  }

  /* Continuous Scrollable Timeline (Image 1) */
  .calendar-timeline-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding-bottom: 2rem;

    &::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
  }

  .timeline-inner-wrapper {
    display: flex;
    position: relative;
    width: 100%;
  }

  /* Time Labels Gutter on the left */
  .time-gutter {
    width: 64px;
    flex-shrink: 0;
    position: relative;
    border-right: 1px solid var(--color-border);
    user-select: none;

    .time-label {
      position: absolute;
      right: 8px;
      transform: translateY(-50%);
      pointer-events: none;

      .label-text {
        font-size: 0.6875rem;
        font-weight: 500;
        color: var(--color-ink-muted);
        letter-spacing: -0.01em;
      }
    }
  }

  /* Continuous Grid Canvas */
  .calendar-grid-canvas {
    flex: 1;
    position: relative;
    cursor: cell;
    background-color: transparent;
  }

  /* Horizontal Hour Grid Lines */
  .hour-grid-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background-color: var(--color-border-subtle);
    pointer-events: none;
  }

  /* Red / Terracotta Current Time Marker (Image 1) */
  .current-time-marker {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 25;
    display: flex;
    align-items: center;
    pointer-events: none;
    transform: translateY(-50%);

    .current-time-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: var(--color-accent-terracotta);
      box-shadow: 0 0 0 3px rgba(217, 119, 87, 0.25);
      margin-left: -5px;
    }

    .current-time-line {
      flex: 1;
      height: 2px;
      background-color: var(--color-accent-terracotta);
    }
  }

  /* Magnetic Drop Preview Indicator */
  .calendar-drop-preview {
    position: absolute;
    left: 4px;
    right: 8px;
    z-index: 30;
    border-radius: 6px;
    background-color: rgba(217, 119, 87, 0.2);
    border: 1.5px dashed var(--color-accent-terracotta);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.75rem;
    color: var(--color-accent-terracotta-dark);
    font-size: 0.75rem;
    font-weight: 600;
    pointer-events: none;
  }

  /* Google Calendar Blocks (Image 1 replica) */
  .gcal-block {
    position: absolute;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.15s ease, transform 0.15s ease;
    z-index: 5;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transform: translateY(-1px);
      z-index: 15;

      .gcal-stretch-handle {
        background-color: rgba(255, 255, 255, 0.4);
      }
    }

    &.is-stretching {
      z-index: 35 !important;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
      outline: 2px solid #FFFFFF;
    }

    &.is-moving {
      z-index: 35 !important;
      opacity: 0.9;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      cursor: grabbing;
    }

    &.is-task {
      border-style: dashed;
    }

    &.is-completed {
      opacity: 0.65;
      text-decoration: line-through;
    }

    /* Short 15m Event Pill Layout (Image 1: Lunch, 1pm) */
    &.is-short {
      display: flex;
      align-items: center;
      padding: 0 6px;

      .single-line-content {
        display: flex;
        align-items: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 0.6875rem;
        line-height: 1;
        color: #FFFFFF;

        .item-title-single {
          font-weight: 700;
        }

        .item-time-single {
          font-weight: 400;
          opacity: 0.9;
        }
      }
    }

    /* Stacked Event Layout for events >= 30m */
    &.is-medium,
    &.is-tall {
      display: flex;
      flex-direction: column;
      padding: 4px 8px;

      .stacked-content {
        display: flex;
        flex-direction: column;
        color: #FFFFFF;
        overflow: hidden;

        .title-row {
          .item-title {
            font-size: 0.75rem;
            font-weight: 700;
            line-height: 1.25;
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .time-row {
          .item-time {
            font-size: 0.6875rem;
            font-weight: 500;
            opacity: 0.9;
            line-height: 1.2;
          }
        }

        .item-desc {
          font-size: 0.6875rem;
          opacity: 0.85;
          margin-top: 3px;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }
    }

    /* Google Calendar Bottom Stretch Handle */
    .gcal-stretch-handle {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 6px;
      cursor: ns-resize;
      background-color: transparent;
      z-index: 20;

      &:hover {
        background-color: rgba(255, 255, 255, 0.5);
      }
    }

    .stretch-live-badge {
      position: absolute;
      bottom: 8px;
      right: 6px;
      background-color: rgba(0, 0, 0, 0.75);
      color: #FFFFFF;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      pointer-events: none;
      z-index: 25;
    }
  }

  /* Google Calendar Details Popover (Image 2) */
  .gcal-details-popover {
    position: absolute;
    left: 20px;
    right: 20px;
    background-color: var(--color-surface-elevated);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
    z-index: 50;
    padding: 1rem 1.25rem;
    animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);

    .details-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;

      .actions-left {
        display: flex;
        gap: 0.5rem;
      }

      .action-icon-btn {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--color-ink-muted);
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.15s ease;

        &:hover {
          background-color: rgba(44, 42, 41, 0.08);
          color: var(--color-ink);
        }

        &.delete-btn:hover {
          color: #E65100;
        }
      }
    }

    .details-body {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;

      .details-title-row {
        display: flex;
        align-items: center;
        gap: 0.625rem;

        .color-swatch-circle {
          width: 14px;
          height: 14px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .details-title {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--color-ink);
          margin: 0;
        }
      }

      .details-edit-input {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--color-ink);
        background: transparent;
        border: none;
        border-bottom: 2px solid var(--color-accent-terracotta);
        outline: none;
        padding: 0.2rem 0;
      }

      .details-time-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: var(--color-ink-muted);

        .clock-icon {
          font-size: 0.9rem;
        }
      }

      .details-desc-row {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: var(--color-ink-muted);
        margin-top: 0.25rem;

        .desc-icon {
          font-size: 0.9rem;
          line-height: 1.2;
        }

        .desc-text {
          margin: 0;
          line-height: 1.35;
        }
      }
    }
  }

  /* Google Calendar Creation Popover (Image 3) */
  .gcal-create-popover {
    position: absolute;
    left: 16px;
    right: 16px;
    background-color: var(--color-surface-elevated);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
    z-index: 55;
    padding: 1.25rem;
    animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);

    .create-top-bar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 0.5rem;

      .create-close-btn {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--color-ink-muted);
        border: none;
        background: transparent;
        cursor: pointer;

        &:hover {
          background-color: rgba(44, 42, 41, 0.08);
          color: var(--color-ink);
        }
      }
    }

    .create-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .create-title-input {
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--color-ink);
        background: transparent;
        border: none;
        border-bottom: 2px solid var(--color-accent-terracotta);
        outline: none;
        padding: 0.25rem 0;

        &::placeholder {
          color: var(--color-ink-faint);
        }
      }

      .create-type-tabs {
        display: flex;
        gap: 0.5rem;

        .type-tab-btn {
          padding: 0.35rem 0.85rem;
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: 9999px;
          border: 1px solid var(--color-border);
          background-color: var(--color-surface);
          color: var(--color-ink-muted);
          cursor: pointer;
          transition: all 0.15s ease;

          &.active {
            background-color: var(--color-accent-terracotta);
            color: #FFFFFF;
            border-color: var(--color-accent-terracotta);
          }
        }
      }

      .create-time-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: var(--color-ink-muted);

        .meta-clock {
          font-size: 0.9rem;
        }
      }

      .create-footer-row {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.5rem;

        .create-save-btn {
          padding: 0.45rem 1.25rem;
          border-radius: 9999px;
          background-color: var(--color-accent-terracotta);
          color: #FFFFFF;
          font-size: 0.875rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(217, 119, 87, 0.3);
          transition: transform 0.15s ease, background-color 0.15s ease;

          &:hover {
            transform: translateY(-1px);
            filter: brightness(1.05);
          }

          &:active {
            transform: scale(0.96);
          }
        }
      }
    }
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: translateY(6px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>
