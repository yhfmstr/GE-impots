import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Hook to detect prefers-reduced-motion media query
 * @returns {boolean} - True if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check on mount
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Legacy Safari
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Animated counter hook - counts up to target value
 * Respects prefers-reduced-motion - instantly shows target if reduced motion preferred
 * @param {number} target - Target number to count to
 * @param {number} duration - Animation duration in ms
 * @param {boolean} startOnView - Start animation when element is in view
 * @returns {object} - { ref, count, isComplete }
 */
export function useAnimatedCounter(target, duration = 2000, startOnView = true) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [count, setCount] = useState(prefersReducedMotion ? target : 0);
  const [isComplete, setIsComplete] = useState(prefersReducedMotion);
  const [hasStarted, setHasStarted] = useState(!startOnView);
  const ref = useRef(null);

  // If reduced motion is preferred, immediately set target
  useEffect(() => {
    if (prefersReducedMotion) {
      setCount(target);
      setIsComplete(true);
    }
  }, [prefersReducedMotion, target]);

  // Intersection observer for startOnView
  useEffect(() => {
    if (!startOnView || hasStarted || prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [startOnView, hasStarted, prefersReducedMotion]);

  // Animation logic (skipped if reduced motion)
  useEffect(() => {
    if (!hasStarted || prefersReducedMotion) return;

    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(startValue + (target - startValue) * easeOut);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
        setIsComplete(true);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration, hasStarted, prefersReducedMotion]);

  return { ref, count, isComplete };
}

/**
 * Custom hook for parallax scroll effects
 * Respects prefers-reduced-motion - returns no transform if reduced motion preferred
 * @param {number} speed - Parallax speed multiplier (0.1 = slow, 1 = normal scroll)
 * @param {string} direction - 'up' or 'down'
 * @returns {object} - { ref, style, scrollY }
 */
export function useParallax(speed = 0.5, direction = 'up') {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [offset, setOffset] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    // Skip parallax if reduced motion preferred
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const windowHeight = window.innerHeight;

      // Only apply parallax when element is in viewport
      if (rect.top < windowHeight && rect.bottom > 0) {
        const elementTop = rect.top + scrolled;
        const relativeScroll = scrolled - elementTop + windowHeight;
        const parallaxOffset = relativeScroll * speed;

        setOffset(direction === 'up' ? -parallaxOffset : parallaxOffset);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, direction, prefersReducedMotion]);

  // Return no transform if reduced motion preferred
  const style = prefersReducedMotion ? {} : {
    transform: `translateY(${offset}px)`,
  };

  return { ref, style, offset: prefersReducedMotion ? 0 : offset };
}

/**
 * Hook for scroll-triggered fade-in animations
 * Respects prefers-reduced-motion - immediately visible if reduced motion preferred
 * @param {object} options - threshold, rootMargin
 * @returns {object} - { ref, isVisible }
 */
export function useScrollReveal(options = {}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isVisible, setIsVisible] = useState(prefersReducedMotion);
  const ref = useRef(null);

  useEffect(() => {
    // If reduced motion, immediately set visible
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -50px 0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin, prefersReducedMotion]);

  return { ref, isVisible };
}

/**
 * Hook for mouse-based parallax (floating elements)
 * Respects prefers-reduced-motion - returns no transform if reduced motion preferred
 * @param {number} intensity - Movement intensity (1-20)
 * @returns {object} - { ref, style }
 */
export function useMouseParallax(intensity = 10) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  useEffect(() => {
    // Skip mouse parallax if reduced motion preferred
    if (prefersReducedMotion) return;

    const handleMouseMove = (e) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) / intensity;
      const deltaY = (e.clientY - centerY) / intensity;

      setPosition({ x: deltaX, y: deltaY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [intensity, prefersReducedMotion]);

  // Return no transform if reduced motion preferred
  const style = prefersReducedMotion ? {} : {
    transform: `translate(${position.x}px, ${position.y}px)`,
    transition: 'transform 0.3s ease-out',
  };

  return { ref, style, position: prefersReducedMotion ? { x: 0, y: 0 } : position };
}

/**
 * Hook for scroll progress (0-1)
 * @returns {number} - Scroll progress between 0 and 1
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = docHeight > 0 ? scrollTop / docHeight : 0;
      setProgress(Math.min(1, Math.max(0, scrollProgress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
}
