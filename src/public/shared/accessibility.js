document.addEventListener('DOMContentLoaded', () => {
  const prepare = () => {
    const main = document.querySelector('main, .main-content, .card');
    if (main) { main.id ||= 'main-content'; main.setAttribute('tabindex', '-1'); }
    if (main && !document.querySelector('.skip-link')) {
      const skip = document.createElement('a'); skip.className = 'skip-link'; skip.href = '#' + main.id;
      skip.textContent = 'Chuyển đến nội dung chính'; document.body.prepend(skip);
    }
    const skip = document.querySelector('.skip-link');
    if (skip && main) { skip.href = '#' + main.id; document.body.prepend(skip); }
  };
  prepare(); window.addEventListener('app:ready', prepare);
  // Legacy login dialogs use an .open class. Keep focus inside and restore the trigger.
  ['forgotModal', 'registerModal'].forEach(id => {
    const modal = document.getElementById(id); if (!modal) return;
    let trigger = null, opened = false;
    const fields = () => [...modal.querySelectorAll('button,input,a[href]')].filter(x => !x.disabled && x.getClientRects().length);
    const sync = () => {
      const isOpen = modal.classList.contains('open');
      modal.setAttribute('aria-hidden', String(!isOpen));
      if (isOpen && !opened) { trigger = document.activeElement; fields()[0]?.focus(); }
      if (!isOpen && opened && trigger?.isConnected) trigger.focus();
      opened = isOpen;
    };
    new MutationObserver(sync).observe(modal, { attributes: true, attributeFilter: ['class'] }); sync();
    modal.addEventListener('keydown', event => {
      if (event.key === 'Escape') { modal.classList.remove('open'); return; }
      if (event.key !== 'Tab') return;
      const nodes = fields();
      if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0]?.focus(); }
    });
  });
});
