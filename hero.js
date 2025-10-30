/**
 * Hero video background handler
 * Manages autoplay with reduced-motion support and graceful error handling
 */

(function() {
  'use strict';

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('hero-video');

    // Exit if video element not found
    if (!video) return;

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // User prefers reduced motion - don't play video
      video.pause();
      video.style.display = 'none';
      return;
    }

    // Attempt to play video with error handling
    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise
        .then(function() {
          // Autoplay started successfully
          console.log('Hero video autoplay started');
        })
        .catch(function(error) {
          // Autoplay was prevented (browser policy, network error, etc.)
          // Silently fall back to poster image - no action needed
          console.warn('Hero video autoplay prevented:', error.message);
          video.style.display = 'none';
        });
    }

    // Listen for reduced-motion preference changes during session
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Modern browsers
    if (motionMediaQuery.addEventListener) {
      motionMediaQuery.addEventListener('change', function(e) {
        if (e.matches) {
          video.pause();
          video.style.display = 'none';
        } else {
          video.style.display = '';
          video.play().catch(function() {
            // Silently handle play error
          });
        }
      });
    }
    // Legacy browser support
    else if (motionMediaQuery.addListener) {
      motionMediaQuery.addListener(function(e) {
        if (e.matches) {
          video.pause();
          video.style.display = 'none';
        } else {
          video.style.display = '';
          video.play().catch(function() {
            // Silently handle play error
          });
        }
      });
    }
  });
})();
