const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn.querySelector('.theme-icon');
const themeText = themeToggleBtn.querySelector('.theme-text');
const body = document.body;

const savedTheme = localStorage.getItem('study-room-theme');
const defaultTheme = savedTheme === themeConfig.light.className ? 'light' : 'dark';
let currentTheme = defaultTheme;

function applyTheme(theme) {
    currentTheme = theme;
    body.classList.toggle(themeConfig.light.className, theme === 'light');
    body.classList.toggle(themeConfig.dark.className, theme === 'dark');
    themeIcon.textContent = themeConfig[theme].icon;
    themeText.textContent = themeConfig[theme].label;
    themeToggleBtn.classList.toggle('theme-light', theme === 'light');
    themeToggleBtn.classList.toggle('theme-dark', theme === 'dark');
    localStorage.setItem('study-room-theme', themeConfig[theme].className);
}

function toggleTheme() {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
    applyTheme(defaultTheme);
}
