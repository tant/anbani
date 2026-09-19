import { cubicOut } from 'svelte/easing';

/** Svelte transitions run through the Web Animations API, which the CSS reduced-motion rule does not reach. */
const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const dur = (ms: number) => (reduced ? 0 : ms);
export const ease = cubicOut;
