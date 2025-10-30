/**
 * Enhanced Homepage Interactions
 * Handles FAQ accordions, stat counters, form validation, and scroll animations
 */

(function() {
  'use strict';

  // Initialize all features on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    initFAQ();
    initStatCounters();
    initFormHandling();
    initLazyLoading();
    initScrollAnimations();
  });

  /**
   * FAQ Accordion functionality
   */
  function initFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(function(question) {
      question.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';

        // Close all other FAQs
        faqQuestions.forEach(function(q) {
          q.setAttribute('aria-expanded', 'false');
        });

        // Toggle current FAQ
        this.setAttribute('aria-expanded', !isExpanded);
      });
    });
  }

  /**
   * Animated stat counters
   */
  function initStatCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    let hasAnimated = false;

    function animateCounter(element) {
      const target = parseInt(element.getAttribute('data-target'));
      const duration = 2000; // 2 seconds
      const frameDuration = 1000 / 60; // 60 FPS
      const totalFrames = Math.round(duration / frameDuration);
      let frame = 0;

      const counter = setInterval(function() {
        frame++;
        const progress = frame / totalFrames;
        const currentCount = Math.round(target * progress);

        element.textContent = currentCount;

        if (frame === totalFrames) {
          clearInterval(counter);
          element.textContent = target;
        }
      }, frameDuration);
    }

    // Trigger animation when stats section is in view
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          statNumbers.forEach(function(stat) {
            animateCounter(stat);
          });
        }
      });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.stats-bar');
    if (statsSection) {
      observer.observe(statsSection);
    }
  }

  /**
   * Form handling and validation
   */
  function initFormHandling() {
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Basic validation
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);

        // Here you would typically send to your backend
        console.log('Form submitted:', data);

        // Show success message (you can customize this)
        alert('Thank you for your inquiry! We\'ll respond within 2 hours during business hours.');
        contactForm.reset();
      });
    }

    // Newsletter form
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = this.querySelector('input[type="email"]').value;

        // Here you would typically send to your email service
        console.log('Newsletter signup:', email);

        // Show success message
        alert('Thanks for subscribing! Check your email for confirmation.');
        newsletterForm.reset();
      });
    }
  }

  /**
   * Lazy loading for images
   */
  function initLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');

    images.forEach(function(img) {
      img.addEventListener('load', function() {
        this.classList.add('loaded');
      });

      // If already loaded (cached), add class immediately
      if (img.complete) {
        img.classList.add('loaded');
      }
    });
  }

  /**
   * Scroll animations for sections
   */
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.service-card, .portfolio-item, .testimonial-card, .process-step');

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(20px)';

          setTimeout(function() {
            entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 100);

          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(function(el) {
      observer.observe(el);
    });
  }

})();
