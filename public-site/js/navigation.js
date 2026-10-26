// The native disclosure also works without JavaScript. These are convenience behaviours, not a modal focus trap.
const menu = document.querySelector('.mobile-menu');
if (menu) {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target) || event.target.closest('a')) menu.open = false;
  });
  window.matchMedia('(min-width: 1200px)').addEventListener('change', () => { menu.open = false; });
}
