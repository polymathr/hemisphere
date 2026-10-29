import { gsap } from 'gsap';

export const animations = {
  // Tactile haptic-like bounce on checkbox click
  bounceCheckbox(el: HTMLElement) {
    gsap.timeline()
      .to(el, {
        scale: 0.82,
        duration: 0.08,
        ease: 'power2.in'
      })
      .to(el, {
        scale: 1,
        duration: 0.55,
        ease: 'elastic.out(1, 0.5)'
      });
  },

  // Fountain pen ink drawing strikethrough effect
  drawInkStrikethrough(strikeEl: HTMLElement, isCompleted: boolean) {
    if (isCompleted) {
      gsap.fromTo(strikeEl, 
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.35, ease: 'power2.out' }
      );
    } else {
      gsap.to(strikeEl, {
        scaleX: 0,
        transformOrigin: 'right center',
        duration: 0.22,
        ease: 'power2.in'
      });
    }
  },

  // The Drop: Spring physics snap when dropped into planner slot
  snapDroppedTask(slotEl: HTMLElement) {
    gsap.fromTo(slotEl,
      {
        scale: 0.94,
        y: -4,
        boxShadow: '0 16px 32px -4px rgba(44, 42, 41, 0.16)'
      },
      {
        scale: 1,
        y: 0,
        boxShadow: '0 1px 3px rgba(44, 42, 41, 0.04)',
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)'
      }
    );
  },

  // Switching between views: smooth push/pull transition
  transitionViewSpread(leftEl: HTMLElement | null, rightEl: HTMLElement | null) {
    if (leftEl) {
      gsap.fromTo(leftEl,
        { opacity: 0.75, x: -8 },
        { opacity: 1, x: 0, duration: 0.38, ease: 'power3.out' }
      );
    }
    if (rightEl) {
      gsap.fromTo(rightEl,
        { opacity: 0.75, x: 8 },
        { opacity: 1, x: 0, duration: 0.42, ease: 'power3.out' }
      );
    }
  }
};
