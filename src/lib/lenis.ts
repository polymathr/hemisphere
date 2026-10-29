import Lenis from 'lenis';

export function createPaneSmoothScroll(wrapperEl: HTMLElement): () => void {
  if (typeof window === 'undefined' || !wrapperEl) return () => {};

  // Mark container so window-level handlers don't conflict
  wrapperEl.setAttribute('data-lenis-prevent', '');

  const contentEl = (wrapperEl.firstElementChild as HTMLElement) || wrapperEl;

  const lenis = new Lenis({
    wrapper: wrapperEl,
    content: contentEl,
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5
  });

  let rafId: number;
  function raf(time: number) {
    lenis.raf(time);
    rafId = requestAnimationFrame(raf);
  }
  rafId = requestAnimationFrame(raf);

  return () => {
    cancelAnimationFrame(rafId);
    lenis.destroy();
  };
}
