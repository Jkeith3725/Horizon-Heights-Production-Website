const prefersReducedMotion = typeof window !== 'undefined' && 'matchMedia' in window
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: false };

document.addEventListener('DOMContentLoaded', () => {
  const filterPills = Array.from(document.querySelectorAll('.filter-pill'));
  const sections = Array.from(document.querySelectorAll('.gallery-section'));
  const filterTargets = Array.from(document.querySelectorAll('[data-gallery-type]'));
  const sideNavLinks = Array.from(document.querySelectorAll('.side-nav-link'));
  const revealTargets = Array.from(document.querySelectorAll('.reveal'));
  const reelTabs = Array.from(document.querySelectorAll('.reel-tab'));
  const reelPanels = Array.from(document.querySelectorAll('[data-reel-panel]'));

  const lightboxEl = document.querySelector('[data-lightbox]');
  const lightboxMedia = lightboxEl?.querySelector('[data-lightbox-media]');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDescription = lightboxEl?.querySelector('[data-lightbox-description]');
  const prevBtn = lightboxEl?.querySelector('[data-lightbox-prev]');
  const nextBtn = lightboxEl?.querySelector('[data-lightbox-next]');
  const closeBtn = lightboxEl?.querySelector('.lightbox__close');

  let currentFilter = 'all';
  let currentLightboxIndex = 0;
  let restoreFocusEl = null;
  let pointerStartX = null;

  const reduceMotion = prefersReducedMotion.matches;

  const setActiveFilterPill = (filter) => {
    filterPills.forEach((pill) => {
      const isActive = pill.dataset.filter === filter;
      pill.classList.toggle('is-active', isActive);
      pill.setAttribute('aria-selected', String(isActive));
    });
  };

  const scrollToSection = (filter) => {
    if (filter === 'all') return;
    const target = document.querySelector(`#${filter}`) || document.querySelector(`[data-section="${filter}"]`);
    if (!target) return;
    const scrollBehavior = reduceMotion ? 'auto' : 'smooth';
    target.scrollIntoView({ behavior: scrollBehavior, block: 'start', inline: 'nearest' });
  };

  const updateSectionStates = (filter) => {
    sections.forEach((section) => {
      const sectionKey = section.dataset.section;
      const matches = filter === 'all' || sectionKey === filter;
      const isReelsFilter = filter === 'reels' && sectionKey === 'reels';
      const shouldMute = !(matches || isReelsFilter);
      section.classList.toggle('is-muted', shouldMute);
      if (shouldMute) {
        section.setAttribute('aria-hidden', 'true');
      } else {
        section.removeAttribute('aria-hidden');
      }
    });
  };

  const applyFilter = (filter) => {
    currentFilter = filter;
    setActiveFilterPill(filter);
    updateSectionStates(filter);

    filterTargets.forEach((target) => {
      const matches = filter === 'all' || target.dataset.galleryType === filter;
      target.hidden = !matches;
    });
  };

  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const { filter } = pill.dataset;
      applyFilter(filter);
      scrollToSection(filter);
    });
  });

  sideNavLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      const target = targetId ? document.querySelector(targetId) : null;
      if (target) {
        event.preventDefault();
        const behavior = reduceMotion ? 'auto' : 'smooth';
        target.scrollIntoView({ behavior, block: 'start', inline: 'nearest' });
      }
    });
  });

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target.classList.contains('is-muted')) return;
      const id = entry.target.getAttribute('id');
      if (!id) return;
      sideNavLinks.forEach((link) => {
        const matches = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('is-active', matches);
      });
    });
  }, {
    root: null,
    rootMargin: '-45% 0px -45% 0px',
    threshold: 0.1,
  });

  sections.forEach((section) => navObserver.observe(section));

  if (!reduceMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -10% 0px',
    });

    revealTargets.forEach((element) => revealObserver.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add('is-visible'));
  }

  // Reel Tabs
  const activateReelTab = (id) => {
    reelTabs.forEach((tab) => {
      const isActive = tab.dataset.reel === id;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    reelPanels.forEach((panel) => {
      const matches = panel.dataset.reelPanel === id;
      panel.classList.toggle('is-active', matches);
      panel.hidden = !matches;
    });
  };

  reelTabs.forEach((tab) => {
    tab.addEventListener('click', () => activateReelTab(tab.dataset.reel));
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateReelTab(tab.dataset.reel);
      }
    });
  });

  activateReelTab('walkthrough');
  applyFilter('all');

  // Lightbox logic
  if (lightboxEl && lightboxMedia && lightboxDescription && closeBtn && prevBtn && nextBtn) {
    lightboxEl.setAttribute('aria-hidden', 'true');
    lightboxEl.setAttribute('tabindex', '-1');

    const lightboxItems = Array.from(document.querySelectorAll('[data-lightbox-src], [data-lightbox-video]')).map((element, index) => {
      element.dataset.lightboxIndex = String(index);
      return {
        element,
        type: element.dataset.lightboxVideo ? 'video' : 'image',
        src: element.dataset.lightboxVideo || element.dataset.lightboxSrc,
        title: element.dataset.lightboxTitle || element.querySelector('h3')?.textContent || '',
        description: element.dataset.lightboxDescription || element.querySelector('p')?.textContent || '',
        galleryType: element.dataset.galleryType || 'all',
      };
    });

    const lightboxGroups = lightboxItems.reduce((map, item, index) => {
      const key = item.galleryType;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(index);
      return map;
    }, new Map());

    let activeGroupKey = null;
    let activeGroupIndices = [];
    let currentGroupPosition = 0;

    const preloadNeighbor = (offset) => {
      if (activeGroupIndices.length <= 1) return;
      const nextPosition = (currentGroupPosition + offset + activeGroupIndices.length) % activeGroupIndices.length;
      const item = lightboxItems[activeGroupIndices[nextPosition]];
      if (!item || item.type !== 'image') return;
      const preloadImage = new Image();
      preloadImage.src = item.src;
    };

    const renderLightbox = (index) => {
      const item = lightboxItems[index];
      if (!item) return;
      currentLightboxIndex = index;
      lightboxMedia.innerHTML = '';

      if (item.type === 'video') {
        const video = document.createElement('video');
        video.src = item.src;
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('aria-label', item.title || 'Gallery video');
        lightboxMedia.appendChild(video);
      } else {
        const image = new Image();
        image.src = item.src;
        image.alt = item.title || 'Gallery still';
        lightboxMedia.appendChild(image);
      }

      lightboxTitle.textContent = item.title || '';
      lightboxDescription.textContent = item.description || '';

      preloadNeighbor(1);
      preloadNeighbor(-1);
    };

    const setActiveGroup = (index) => {
      const item = lightboxItems[index];
      if (!item) return;
      activeGroupKey = item.galleryType;
      activeGroupIndices = lightboxGroups.get(activeGroupKey) || [index];
      currentGroupPosition = activeGroupIndices.indexOf(index);
      if (currentGroupPosition === -1) {
        activeGroupIndices.push(index);
        currentGroupPosition = activeGroupIndices.length - 1;
        lightboxGroups.set(activeGroupKey, activeGroupIndices);
      }
    };

    const openLightbox = (index) => {
      const item = lightboxItems[index];
      if (!item) return;
      setActiveGroup(index);
      lightboxEl.hidden = false;
      lightboxEl.setAttribute('aria-hidden', 'false');
      restoreFocusEl = item.element;

      document.body.dataset.lockScroll = 'true';
      document.body.style.setProperty('overflow', 'hidden');

      renderLightbox(activeGroupIndices[currentGroupPosition]);

      requestAnimationFrame(() => closeBtn.focus());
    };

    const closeLightbox = () => {
      lightboxEl.hidden = true;
      lightboxEl.setAttribute('aria-hidden', 'true');
      lightboxMedia.innerHTML = '';
      document.body.style.removeProperty('overflow');
      document.body.removeAttribute('data-lock-scroll');
      if (restoreFocusEl) {
        restoreFocusEl.focus({ preventScroll: true });
      }
    };

    const showNext = () => {
      if (activeGroupIndices.length <= 1) return;
      currentGroupPosition = (currentGroupPosition + 1) % activeGroupIndices.length;
      renderLightbox(activeGroupIndices[currentGroupPosition]);
    };

    const showPrev = () => {
      if (activeGroupIndices.length <= 1) return;
      currentGroupPosition = (currentGroupPosition - 1 + activeGroupIndices.length) % activeGroupIndices.length;
      renderLightbox(activeGroupIndices[currentGroupPosition]);
    };

    lightboxItems.forEach((item, index) => {
      const activate = (event) => {
        if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openLightbox(index);
      };
      item.element.addEventListener('click', activate);
      item.element.addEventListener('keydown', activate);
    });

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', showPrev);
    nextBtn.addEventListener('click', showNext);

    document.addEventListener('keydown', (event) => {
      if (lightboxEl.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNext();
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPrev();
      }
    });

    lightboxEl.addEventListener('pointerdown', (event) => {
      pointerStartX = event.clientX;
    });

    lightboxEl.addEventListener('pointerup', (event) => {
      if (pointerStartX == null) return;
      const deltaX = event.clientX - pointerStartX;
      if (Math.abs(deltaX) > 60) {
        if (deltaX > 0) {
          showPrev();
        } else {
          showNext();
        }
      }
      pointerStartX = null;
    });

    lightboxEl.addEventListener('pointercancel', () => {
      pointerStartX = null;
    });

    lightboxEl.addEventListener('click', (event) => {
      if (event.target === lightboxEl) {
        closeLightbox();
      }
    });
  }
});
