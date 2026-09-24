(() => {
  const journey = document.querySelector('.journey');
  const panels = [...document.querySelectorAll('.panel')];
  const dots = [...document.querySelectorAll('.journey-bar nav a')];
  const previous = document.querySelector('#previous');
  const next = document.querySelector('#next');
  const number = document.querySelector('#page-number');
  const desktop = matchMedia('(min-width: 901px) and (min-height: 561px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let frame = null;
  let wheelTarget = 0;
  let wheelFrame = null;
  const stopWheel = () => { if (wheelFrame) cancelAnimationFrame(wheelFrame); wheelFrame = null; };
  function go(index, updateHash = true) {
    stopWheel();
    const panel = panels[Math.max(0, Math.min(panels.length - 1, index))];
    const behavior = reduced.matches ? 'instant' : 'smooth';
    if (desktop.matches) journey.scrollTo({ left: panel.offsetLeft, behavior });
    else panel.scrollIntoView({ behavior, block: 'start' });
    if (updateHash && location.hash !== '#' + panel.id) history.pushState(null, '', '#' + panel.id);
  }
  function update() {
    const center = desktop.matches ? journey.scrollLeft + journey.clientWidth / 2 : innerHeight / 2;
    let nearest = Infinity;
    panels.forEach((panel, i) => {
      const rect = panel.getBoundingClientRect();
      const distance = desktop.matches ? Math.abs(panel.offsetLeft + panel.offsetWidth / 2 - center) : Math.abs(rect.top + rect.height / 2 - center);
      if (distance < nearest) { nearest = distance; current = i; }
    });
    dots.forEach((dot, i) => { if (i === current) dot.setAttribute('aria-current', 'step'); else dot.removeAttribute('aria-current'); });
    previous.disabled = current === 0;
    next.disabled = current === panels.length - 1;
    number.innerHTML = `${String(current + 1).padStart(2, "0")} <span>/ ${String(panels.length).padStart(2, "0")}</span>`;
    const maximum = desktop.matches ? journey.scrollWidth - journey.clientWidth : document.documentElement.scrollHeight - innerHeight;
    const position = desktop.matches ? journey.scrollLeft : scrollY;
    document.documentElement.style.setProperty('--progress', String(Math.max(0, Math.min(1, position / (maximum || 1)))));
    frame = null;
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  journey.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  journey.addEventListener('wheel', event => {
    if (!desktop.matches || event.ctrlKey || document.querySelector('dialog[open]')) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) { stopWheel(); return; }
    event.preventDefault();
    let delta = event.deltaY;
    if (event.deltaMode === 1) delta *= 20;
    if (event.deltaMode === 2) delta *= journey.clientWidth;
    if (!wheelFrame) wheelTarget = journey.scrollLeft;
    wheelTarget = Math.max(0, Math.min(journey.scrollWidth - journey.clientWidth, wheelTarget + delta));
    if (reduced.matches) { journey.scrollLeft = wheelTarget; return; }
    const step = () => {
      const difference = wheelTarget - journey.scrollLeft;
      if (Math.abs(difference) < 1) { journey.scrollLeft = wheelTarget; wheelFrame = null; return; }
      journey.scrollLeft += difference * .18;
      wheelFrame = requestAnimationFrame(step);
    };
    if (!wheelFrame) wheelFrame = requestAnimationFrame(step);
  }, { passive: false });
  journey.addEventListener('pointerdown', stopWheel, { passive: true });
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const index = panels.findIndex(panel => '#' + panel.id === link.getAttribute('href'));
    if (index < 0) return;
    event.preventDefault();
    go(index);
  }));
  previous.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  document.addEventListener('keydown', event => {
    if (!desktop.matches || document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); go(current + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
  const restore = () => { const index = panels.findIndex(panel => '#' + panel.id === location.hash); if (index >= 0) go(index, false); };
  window.addEventListener('popstate', restore);
  desktop.addEventListener('change', () => { stopWheel(); if (desktop.matches) window.scrollTo(0, 0); go(current, false); });
  document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.dialog).showModal()));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  });
  document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', () => { if (detail.open) document.querySelectorAll('details').forEach(other => { if (other !== detail) other.open = false; }); }));
  restore(); update();
})();
