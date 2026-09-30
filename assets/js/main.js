(() => {
  const header = document.querySelector('.site-header');
  const scrollIndicator = document.querySelector('.scroll-indicator');
  const scrollToTop = document.querySelector('.scroll-to-top');
  const menuButton = document.querySelector('.mobile-menu-button');
  const mobileNav = document.querySelector('.mobile-nav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
