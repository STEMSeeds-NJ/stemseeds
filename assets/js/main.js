(() => {
  const header = document.querySelector('.site-header');
  const scrollIndicator = document.querySelector('.scroll-indicator');
  const scrollToTop = document.querySelector('.scroll-to-top');
  const menuButton = document.querySelector('.mobile-menu-button');
  const mobileNav = document.querySelector('.mobile-nav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.hero-copy > *, .hero-art, .section-heading, .about-grid > *, .pathway-card, .program-card, .step-card, .team-card, .partner-card, .faq-item, .social-links a, .form-section').forEach((element, index) => {
    element.dataset.reveal = '';
    element.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 70}ms`);
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));
  }

  const updateScrollState = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    header?.classList.toggle('scrolled', window.scrollY > 40);
    if (scrollIndicator) scrollIndicator.style.width = `${progress}%`;
    scrollToTop?.classList.toggle('visible', window.scrollY > 400);
  };
  window.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();

  const closeMenu = () => {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation menu');
    mobileNav.classList.remove('is-open');
  };
  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
    mobileNav?.classList.toggle('is-open', !isOpen);
    if (!isOpen) mobileNav?.querySelector('a')?.focus();
  });
  mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton?.focus();
    }
  });

  scrollToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  const touchCapable = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !touchCapable;
  if (finePointer) {
    document.body.classList.add('has-custom-cursor');
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);
    document.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
      cursor.classList.add('visible');
    }, { passive: true });
    document.addEventListener('pointerover', (event) => {
      if (event.target.closest('a, button, summary')) cursor.classList.add('interactive');
    });
    document.addEventListener('pointerout', (event) => {
      if (event.target.closest('a, button, summary')) cursor.classList.remove('interactive');
    });
    document.addEventListener('pointerleave', () => cursor.classList.remove('visible'));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') cursor.classList.remove('visible');
    });
    if (reduceMotion) return;
    document.addEventListener('click', (event) => {
      if (event.detail === 0 || event.clientX === 0 && event.clientY === 0) return;
      const pulse = document.createElement('span');
      pulse.className = 'click-pulse';
      pulse.setAttribute('aria-hidden', 'true');
      pulse.style.left = `${event.clientX}px`;
      pulse.style.top = `${event.clientY}px`;
      document.body.appendChild(pulse);
      pulse.addEventListener('animationend', () => pulse.remove(), { once: true });
    });
  }
})();
