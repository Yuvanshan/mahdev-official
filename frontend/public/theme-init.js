// Sets data-theme before first paint so there is no light flash. External file: the CSP blocks inline scripts.
(function () {
  var theme = 'light';
  try {
    var saved = localStorage.getItem('mahdev_theme');
    if (saved === 'dark' || saved === 'light') theme = saved;
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
  } catch (e) {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
  }
  document.documentElement.dataset.theme = theme;
})();
