const pages = ['dashboard', 'workouts', 'progress', 'settings'];
let currentPage = 'dashboard';
const main = document.getElementById('mainContent');


const defaultState = { theme: 'dark', checklist: { 'Workout': false, 'Breakfast': false, 'Snack': false, 'Milk': false, 'Sleep': false }, weight: 40, workouts: [] };
let appState = JSON.parse(localStorage.getItem('strengthApp')) || defaultState;


// Sidebar navigation
document.querySelectorAll('#sidebar nav button').forEach(b => { b.onclick = () => { currentPage = b.dataset.page; renderPages(); } });
document.getElementById('themeToggle').onclick = () => {
    appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
    applyTheme(); saveState();
};


function applyTheme() {
    if (appState.theme === 'dark') {
        document.body.classList.remove('light');
    } else {
        document.body.classList.add('light');
    }
}
applyTheme();
saveState();


function saveState() { localStorage.setItem('strengthApp', JSON.stringify(appState)); }


function renderPages() {
    main.innerHTML = '';
    pages.forEach(p => {
        const div = document.createElement('div');
        div.className = 'page' + (p === currentPage ? ' active' : '');
        if (p === 'dashboard') renderDashboard(div);
        if (p === 'workouts') renderWorkouts(div);
        if (p === 'progress') renderProgress(div);
        if (p === 'settings') renderSettings(div);
        main.appendChild(div);
        if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js'); }