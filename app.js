// Strength Tracker V3 app.js
const pages=['dashboard','workouts','progress','settings'];
let currentPage='dashboard';
const main=document.getElementById('mainContent');


const defaultState={theme:'dark',checklist:{'Workout':false,'Breakfast':false,'Snack':false,'Milk':false,'Sleep':false},weight:40,workouts:[]};
let appState=JSON.parse(localStorage.getItem('strengthApp'))||defaultState;


// Sidebar navigation
document.querySelectorAll('#sidebar nav button').forEach(b=>{b.onclick=()=>{currentPage=b.dataset.page;renderPages();}});
document.getElementById('themeToggle').onclick=()=>{appState.theme=appState.theme==='dark'?'light':'dark';applyTheme();saveState();};
function applyTheme(){document.body.style.background=appState.theme==='dark'?'#000':'#fff';document.body.style.color='#ff6700';}
applyTheme();
function saveState(){localStorage.setItem('strengthApp',JSON.stringify(appState));}


function renderPages(){main.innerHTML='';pages.forEach(p=>{const div=document.createElement('div');div.className='page'+(p===currentPage?' active':'');if(p==='dashboard')renderDashboard(div);if(p==='workouts')renderWorkouts(div);if(p==='progress')renderProgress(div);if(p==='settings')renderSettings(div);main.appendChild(div);});}


function renderDashboard(div){div.innerHTML='<h2>Dashboard</h2>';const checklistDiv=document.createElement('div');checklistDiv.className='checklist';Object.keys(appState.checklist).forEach(item=>{const label=document.createElement('label');label.innerHTML=`<input type='checkbox' ${appState.checklist[item]?'checked':''}> ${item}`;label.querySelector('input').onchange=(e)=>{appState.checklist[item]=e.target.checked;saveState();};checklistDiv.appendChild(label);});div.appendChild(checklistDiv);
const weightDiv=document.createElement('div');weightDiv.style.marginTop='10px';weightDiv.innerHTML=`<input type='number' id='weightInput' placeholder='Weight (kg)' value='${appState.weight}'/> <p>Calories: <span id='caloriesDisplay'>-</span> kcal</p>`;
const weightInput=weightDiv.querySelector('#weightInput');const calDisplay=weightDiv.querySelector('#caloriesDisplay');function updateCalories(){calDisplay.textContent=Math.round(weightInput.value*40+400);appState.weight=+weightInput.value;saveState();}weightInput.oninput=updateCalories;updateCalories();div.appendChild(weightDiv);}


function renderWorkouts(div){div.innerHTML='<h2>Workouts</h2><button id="addWorkoutBtn">+ Add Workout</button>';const container=document.createElement('div');div.appendChild(container);function renderAllWorkouts(){container.innerHTML='';appState.workouts.forEach((w,i)=>{const card=document.createElement('div');card.className='exercise-card';card.innerHTML=`<h3>${w.name}</h3>`;w.exercises.forEach((ex,j)=>{const exDiv=document.createElement('div');exDiv.innerHTML=`${ex.name} - ${ex.sets} sets x ${ex.reps} reps <span class='timer'>${ex.timer?ex.timer+'s':''}</span>`;const btns=document.createElement('div');btns.className='rep-buttons';const addBtn=document.createElement('button');addBtn.textContent='+1';addBtn.onclick=()=>{ex.repsDone=(ex.repsDone||0)+1;saveState();renderAllWorkouts();};btns.appendChild(addBtn);exDiv.appendChild(btns);card.appendChild(exDiv);});container.appendChild(card);});}
renderAllWorkouts();document.getElementById('addWorkoutBtn').onclick=()=>{const name=prompt('Workout name:');if(!name)return;appState.workouts.push({name,exercises:[]});saveState();renderAllWorkouts();};}


function renderProgress(div){div.innerHTML='<h2>Progress</h2><p>Graphs & stats coming soon!</p>';}function renderSettings(div){div.innerHTML='<h2>Settings</h2><p>Future customization options go here.</p>';}renderPages();if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js');}