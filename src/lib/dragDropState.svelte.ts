import type { TaskItem } from '#lib/types';
import { dataStore } from '#lib/dataStore.svelte';
import { animations } from '#lib/gsapAnimations';

export type DragItemType = 'TASK' | 'EVENT';

class DragDropState {
  isDragging = $state<boolean>(false);
  dragType = $state<DragItemType>('TASK');
  draggedTask = $state<TaskItem | null>(null);
  draggedEventId = $state<string | null>(null);
  draggedTitle = $state<string>('');
  hoveredHour = $state<number | null>(null);
  hoveredMinute = $state<number>(0);
  
  // Real-time cursor coordinates
  cursorX = $state<number>(0);
  cursorY = $state<number>(0);

  // Initial grab offset so card doesn't jump
  grabOffsetX = $state<number>(0);
  grabOffsetY = $state<number>(0);

  startDrag(task: TaskItem, event: MouseEvent | TouchEvent, cardElement?: HTMLElement) {
    if (task.is_completed) return; // Prevent dragging completed tasks

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      this.grabOffsetX = clientX - rect.left;
      this.grabOffsetY = clientY - rect.top;
    } else {
      this.grabOffsetX = 40;
      this.grabOffsetY = 20;
    }

    this.isDragging = true;
    this.dragType = 'TASK';
    this.draggedTask = task;
    this.draggedEventId = null;
    this.draggedTitle = task.title;
    this.cursorX = clientX;
    this.cursorY = clientY;
    this.hoveredHour = null;

    // Attach global listeners
    window.addEventListener('mousemove', this.handlePointerMove);
    window.addEventListener('mouseup', this.handlePointerUp);
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd);

    // Initial detection
    this.detectHoveredSlot(clientX, clientY);
  }

  startDragEvent(eventId: string, title: string, event: MouseEvent | TouchEvent, cardElement?: HTMLElement) {
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      this.grabOffsetX = clientX - rect.left;
      this.grabOffsetY = clientY - rect.top;
    } else {
      this.grabOffsetX = 40;
      this.grabOffsetY = 20;
    }

    this.isDragging = true;
    this.dragType = 'EVENT';
    this.draggedTask = null;
    this.draggedEventId = eventId;
    this.draggedTitle = title;
    this.cursorX = clientX;
    this.cursorY = clientY;
    this.hoveredHour = null;

    window.addEventListener('mousemove', this.handlePointerMove);
    window.addEventListener('mouseup', this.handlePointerUp);
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd);

    this.detectHoveredSlot(clientX, clientY);
  }

  private handlePointerMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    this.cursorX = e.clientX;
    this.cursorY = e.clientY;
    this.detectHoveredSlot(e.clientX, e.clientY);
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.cursorX = touch.clientX;
    this.cursorY = touch.clientY;
    this.detectHoveredSlot(touch.clientX, touch.clientY);
  };

  /**
   * High-reliability proximity-based slot detection.
   * Checks all hour slots on the Left Planner to ensure drops never fail
   * even if slightly off-center or over padding/margins.
   */
  private detectHoveredSlot(x: number, y: number) {
    // Check for continuous Google Calendar grid canvas first
    const gridCanvas = document.querySelector<HTMLElement>('.calendar-grid-canvas');
    if (gridCanvas) {
      const canvasRect = gridCanvas.getBoundingClientRect();
      const isInsideCanvas = (x >= canvasRect.left - 20 && x <= canvasRect.right + 20);
      if (isInsideCanvas && y >= canvasRect.top && y <= canvasRect.bottom) {
        const relativeY = Math.max(0, y - canvasRect.top);
        // 1 minute = 1px, 15 minutes = 15px, starting at 7 AM
        const totalMinutes = Math.floor(relativeY / 15) * 15;
        this.hoveredHour = 7 + Math.floor(totalMinutes / 60);
        this.hoveredMinute = totalMinutes % 60;
        return;
      }
    }

    const slots = Array.from(document.querySelectorAll<HTMLElement>('.hour-slot'));
    if (slots.length === 0) {
      this.hoveredHour = null;
      this.hoveredMinute = 0;
      return;
    }

    // Determine the Left Planner's horizontal zone
    const plannerEl = document.querySelector('.planner-half') || document.querySelector('.day-planner-container');
    const plannerRect = plannerEl?.getBoundingClientRect();

    const isInsidePlannerX = plannerRect 
      ? (x >= plannerRect.left - 30 && x <= plannerRect.right + 50)
      : (x <= window.innerWidth * 0.55);

    if (!isInsidePlannerX) {
      this.hoveredHour = null;
      this.hoveredMinute = 0;
      return;
    }

    // Find the slot closest to the cursor's vertical position
    let bestSlot: HTMLElement | null = null;
    let minDistance = Infinity;

    for (const slot of slots) {
      const rect = slot.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        bestSlot = slot;
        break;
      }

      const centerY = rect.top + rect.height / 2;
      const dist = Math.abs(y - centerY);
      if (dist < minDistance) {
        minDistance = dist;
        bestSlot = slot;
      }
    }

    if (bestSlot) {
      const hourAttr = bestSlot.getAttribute('data-hour');
      if (hourAttr) {
        this.hoveredHour = parseInt(hourAttr, 10);
        this.hoveredMinute = 0;
        return;
      }
    }

    this.hoveredHour = null;
    this.hoveredMinute = 0;
  }

  private handlePointerUp = (e: MouseEvent) => {
    if (e && typeof e.clientX === 'number') {
      this.cursorX = e.clientX;
      this.cursorY = e.clientY;
    }
    this.endDrag();
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (e && e.changedTouches && e.changedTouches[0]) {
      this.cursorX = e.changedTouches[0].clientX;
      this.cursorY = e.changedTouches[0].clientY;
    }
    this.endDrag();
  };

  endDrag() {
    // Re-verify slot at release position to guarantee placement
    if (this.isDragging) {
      this.detectHoveredSlot(this.cursorX, this.cursorY);
    }

    if (this.isDragging && this.hoveredHour !== null) {
      const hourStr = String(this.hoveredHour).padStart(2, '0');
      const minStr = String(this.hoveredMinute || 0).padStart(2, '0');
      const scheduledTime = `${hourStr}:${minStr}:00`;

      if (this.dragType === 'TASK' && this.draggedTask) {
        const taskId = this.draggedTask.id;
        dataStore.scheduleTask(taskId, scheduledTime, 45);
      } else if (this.dragType === 'EVENT' && this.draggedEventId) {
        const targetDate = dataStore.events.find(e => e.id === this.draggedEventId)?.start_time?.slice(0, 10) || '2026-10-28';
        const newStartIso = `${targetDate}T${scheduledTime}Z`;
        dataStore.moveEvent(this.draggedEventId, newStartIso);
      }
    }

    this.isDragging = false;
    this.draggedTask = null;
    this.draggedEventId = null;
    this.draggedTitle = '';
    this.hoveredHour = null;

    window.removeEventListener('mousemove', this.handlePointerMove);
    window.removeEventListener('mouseup', this.handlePointerUp);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
  }

  cancelDrag() {
    this.isDragging = false;
    this.draggedTask = null;
    this.draggedEventId = null;
    this.draggedTitle = '';
    this.hoveredHour = null;
    window.removeEventListener('mousemove', this.handlePointerMove);
    window.removeEventListener('mouseup', this.handlePointerUp);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
  }
}

export const dragDropState = new DragDropState();
