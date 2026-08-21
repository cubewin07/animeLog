import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Register GSAP plugins
gsap.registerPlugin(useGSAP);

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const EASING = {
  spring: 'back.out(1.4)',
  smooth: 'power2.out',
  cinematic: 'power3.out',
  gentle: 'power1.out',
  bounce: 'elastic.out(1, 0.75)',
};

export const DURATION = {
  fast: 0.2,
  normal: 0.35,
  medium: 0.5,
  slow: 0.8,
};

export const STAGGER = {
  tight: 0.04,
  normal: 0.07,
  relaxed: 0.1,
};
