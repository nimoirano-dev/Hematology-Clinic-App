// ---------- Preferencias: tema y tamaño de fuente ----------
const FONT_STEPS = [13, 14, 15, 16, 17, 18];

function applyTheme(theme){
  if(theme) document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
  const dark = theme==='dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const icon = document.getElementById('themeIcon');
  if(icon) icon.innerHTML = dark
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
}
window.toggleTheme = ()=>{
  const cur = document.documentElement.dataset.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  const next = cur==='dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
};
function applyFontSize(px){
  document.documentElement.style.setProperty('--font-base', px+'px');
}
window.stepFontSize = delta=>{
  let cur = Number(localStorage.getItem('fontSize')) || 15;
  let idx = Math.max(0, FONT_STEPS.indexOf(cur));
  idx = Math.min(FONT_STEPS.length-1, Math.max(0, idx+delta));
  const px = FONT_STEPS[idx];
  localStorage.setItem('fontSize', px);
  applyFontSize(px);
};
(function initPrefs(){
  const savedTheme = localStorage.getItem('theme');
  applyTheme(savedTheme);
  const savedFont = Number(localStorage.getItem('fontSize'));
  if(savedFont) applyFontSize(savedFont);
})();
