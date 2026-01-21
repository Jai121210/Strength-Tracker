// ---------- FIREBASE SETUP ----------

// TODO: replace with your Firebase config from the console
const firebaseConfig = {
  apiKey: "AIzaSyA8D4HWK7vh_pghrYpv8MKTSe6N4aA50MU",
  authDomain: "strength-tracker-cacd4.firebaseapp.com",
  projectId: "strength-tracker-cacd4",
  storageBucket: "strength-tracker-cacd4.firebasestorage.app",
  messagingSenderId: "716460577723",
  appId: "1:716460577723:web:8f71cf8014e7b5a42caa9e",
  measurementId: "G-4VKHNM4HZH"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ---------- GLOBAL STATE ----------

let currentUser = null;
let appState = {
  profile: null,
  workouts: [],
  checklist: {},
  progress: [],
  settings: {
    theme: "dark",
    fontSize: "normal",
    weightUnit: "kg",
    distanceUnit: "km"
  }
};

const DATA_DOC_ID = "appData"; // single doc per user

function getUserDocRef() {
  if (!currentUser) return null;
  return db.collection("users").doc(currentUser.uid).collection("data").doc(DATA_DOC_ID);
}

// ---------- LOGIN UI ----------

const loginScreen = document.getElementById("login-screen");
const loginEmail = document.getElementById("loginEmail");
const loginPass = document.getElementById("loginPass");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

loginBtn.addEventListener("click", async () => {
  loginError.style.display = "none";
  const email = loginEmail.value.trim();
  const pass = loginPass.value.trim();
  if (!email || !pass) {
    loginError.textContent = "Enter email and password.";
    loginError.style.display = "block";
    return;
  }
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (err) {
    loginError.textContent = "Incorrect email or password.";
    loginError.style.display = "block";
  }
});

logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
});

// ---------- AUTH STATE ----------

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    currentUser = null;
    loginScreen.style.display = "flex";
    return;
  }
  currentUser = user;
  loginScreen.style.display = "none";
  await loadAppStateFromCloud();
  initUI();
});

// ---------- CLOUD SYNC ----------

async function loadAppStateFromCloud() {
  const ref = getUserDocRef();
  if (!ref) return;

  try {
    const snap = await ref.get();
    if (!snap.exists) {
      // first time: keep defaults
      await ref.set(appState);
      return;
    }
    const data = snap.data();
    appState = {
      profile: data.profile || null,
      workouts: data.workouts || [],
      checklist: data.checklist || {},
      progress: data.progress || [],
      settings: {
        theme: data.settings?.theme || "dark",
        fontSize: data.settings?.fontSize || "normal",
        weightUnit: data.settings?.weightUnit || "kg",
        distanceUnit: data.settings?.distanceUnit || "km"
      }
    };
  } catch (e) {
    console.error("Error loading data:", e);
  }
}

let saveTimeout = null;
function scheduleSaveToCloud() {
  if (!currentUser) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToCloud, 500);
}

async function saveToCloud() {
  const ref = getUserDocRef();
  if (!ref) return;
  try {
    await ref.set(appState);
  } catch (e) {
    console.error("Error saving data:", e);
  }
}

// ---------- UTILITIES ----------

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

// ---------- TABS ----------

const tabButtons = document.querySelectorAll(".tab-button");
const tabs = document.querySelectorAll(".tab");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    tabButtons.forEach((b) => b.classList.remove("active"));
    tabs.forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(target).classList.add("active");
  });
});

// ---------- PROFILE ----------

const profileForm = document.getElementById("profile-form");
const profileSummary = document.getElementById("profile-summary");

function renderProfile() {
  const profile = appState.profile;
  const settings = appState.settings;
  const weightUnit = settings.weightUnit || "kg";

  if (!profile) {
    profileSummary.textContent = "No profile saved yet.";
    document.getElementById("age").value = "";
    document.getElementById("weight").value = "";
    document.getElementById("height").value = "";
    document.getElementById("fitnessLevel").value = "beginner";
    document.getElementById("goal").value = "muscle";
    return;
  }

  document.getElementById("age").value = profile.age || "";
  document.getElementById("weight").value = profile.weight || "";
  document.getElementById("height").value = profile.height || "";
  document.getElementById("fitnessLevel").value = profile.fitnessLevel || "beginner";
  document.getElementById("goal").value = profile.goal || "muscle";

  profileSummary.textContent = `Age ${profile.age || "?"}, ${
    profile.weight || "?"
  } ${weightUnit}, ${profile.height || "?"} cm • Level: ${
    profile.fitnessLevel || "?"
  } • Goal: ${profile.goal || "?"}`;
}

profileForm.addEventListener("submit", (e) => {
  e.preventDefault();
  appState.profile = {
    age: Number(document.getElementById("age").value) || null,
    weight: Number(document.getElementById("weight").value) || null,
    height: Number(document.getElementById("height").value) || null,
    fitnessLevel: document.getElementById("fitnessLevel").value,
    goal: document.getElementById("goal").value
  };
  renderProfile();
  scheduleSaveToCloud();
});

// ---------- WORKOUTS ----------

const workoutForm = document.getElementById("workout-form");
const workoutList = document.getElementById("workout-list");
const workoutCount = document.getElementById("workout-count");
const sessionExerciseSelect = document.getElementById("sessionExercise");

function renderWorkouts() {
  const workouts = appState.workouts;
  workoutList.innerHTML = "";
  workoutCount.textContent = `${workouts.length} total`;

  sessionExerciseSelect.innerHTML = '<option value="">Select exercise</option>';
  workouts.forEach((w) => {
    const opt = document.createElement("option");
    opt.value = w.name;
    opt.textContent = w.name;
    sessionExerciseSelect.appendChild(opt);
  });

  if (!workouts.length) {
    const li = document.createElement("li");
    li.textContent = "No workouts saved yet.";
    workoutList.appendChild(li);
    return;
  }

  workouts.forEach((w, index) => {
    const li = document.createElement("li");
    const title = document.createElement("div");
    title.className = "list-title";
    title.textContent = w.name;

    const meta = document.createElement("div");
    meta.className = "list-meta";
    meta.textContent = `${w.difficulty} • Muscles: ${w.muscles || "n/a"} • Equipment: ${
      w.equipment || "n/a"
    }`;

    const desc = document.createElement("div");
    desc.style.fontSize = "0.8rem";
    desc.style.marginTop = "0.15rem";
    desc.textContent = w.description || "";

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Delete";
    removeBtn.className = "chip chip-ghost";
    removeBtn.style.marginTop = "0.35rem";
    removeBtn.addEventListener("click", () => {
      appState.workouts = workouts.filter((_, i) => i !== index);
      renderWorkouts();
      scheduleSaveToCloud();
    });

    li.appendChild(title);
    li.appendChild(meta);
    if (w.description) li.appendChild(desc);
    li.appendChild(removeBtn);
    workoutList.appendChild(li);
  });
}

workoutForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const workout = {
    name: document.getElementById("workoutName").value.trim(),
    description: document.getElementById("workoutDescription").value.trim(),
    difficulty: document.getElementById("workoutDifficulty").value,
    muscles: document.getElementById("workoutMuscles").value.trim(),
    equipment: document.getElementById("workoutEquipment").value.trim()
  };
  if (!workout.name) return;
  appState.workouts.push(workout);
  workoutForm.reset();
  renderWorkouts();
  scheduleSaveToCloud();
});

// ---------- PLANNER / CHECKLIST ----------

const todayDateEl = document.getElementById("today-date");
const checklistForm = document.getElementById("today-checklist");
const calendarEl = document.getElementById("calendar");

function renderTodayChecklist() {
  const checklist = appState.checklist;
  const key = todayKey();
  const today = checklist[key] || {};
  document.getElementById("taskWorkout").checked = !!today.workout;
  document.getElementById("taskStretch").checked = !!today.stretch;
  document.getElementById("taskHydration").checked = !!today.hydration;
  document.getElementById("taskMeditation").checked = !!today.meditation;
  document.getElementById("taskSleep").checked = !!today.sleep;

  const d = new Date();
  todayDateEl.textContent = d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}

checklistForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const key = todayKey();
  appState.checklist[key] = {
    workout: document.getElementById("taskWorkout").checked,
    stretch: document.getElementById("taskStretch").checked,
    hydration: document.getElementById("taskHydration").checked,
    meditation: document.getElementById("taskMeditation").checked,
    sleep: document.getElementById("taskSleep").checked
  };
  renderCalendar();
  renderStreak();
  renderHomeStats();
  scheduleSaveToCloud();
});

function renderCalendar() {
  const checklist = appState.checklist;
  calendarEl.innerHTML = "";
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = todayKey(d);
    const entry = checklist[key];
    const dayEl = document.createElement("div");
    dayEl.className = "calendar-day";
    if (entry && entry.workout) {
      dayEl.classList.add("active");
    }
    const dayNum = document.createElement("span");
    dayNum.textContent = d.getDate();
    const label = document.createElement("span");
    label.textContent = d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
    label.style.fontSize = "0.65rem";
    dayEl.appendChild(dayNum);
    dayEl.appendChild(label);
    calendarEl.appendChild(dayEl);
  }
}

// ---------- PROGRESS ----------

const progressForm = document.getElementById("progress-form");
const progressList = document.getElementById("progress-list");
const streakText = document.getElementById("streak-text");

function renderProgress() {
  const entries = appState.progress;
  const settings = appState.settings;
  const weightUnit = settings.weightUnit || "kg";

  progressList.innerHTML = "";
  if (!entries.length) {
    const li = document.createElement("li");
    li.textContent = "No progress entries yet.";
    progressList.appendChild(li);
    return;
  }

  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
  sorted.slice(0, 20).forEach((entry) => {
    const li = document.createElement("li");
    const title = document.createElement("div");
    title.className = "list-title";
    title.textContent = new Date(entry.date).toLocaleDateString();

    const meta = document.createElement("div");
    meta.className = "list-meta";
    meta.textContent = `Weight: ${entry.weight ? entry.weight : "n/a"} ${weightUnit}`;

    const notes = document.createElement("div");
    notes.style.fontSize = "0.8rem";
    notes.style.marginTop = "0.15rem";
    notes.textContent = entry.notes || "";

    li.appendChild(title);
    li.appendChild(meta);
    if (entry.notes) li.appendChild(notes);
    if (entry.pr) {
      const pr = document.createElement("div");
      pr.style.fontSize = "0.8rem";
      pr.style.marginTop = "0.15rem";
      pr.style.color = "#fed7aa";
      pr.textContent = `PR: ${entry.pr}`;
      li.appendChild(pr);
    }
    progressList.appendChild(li);
  });
}

progressForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const dateInput = document.getElementById("progressDate").value;
  const date = dateInput || todayKey();
  const entry = {
    date,
    weight: Number(document.getElementById("progressWeight").value) || null,
    notes: document.getElementById("progressNotes").value.trim(),
    pr: document.getElementById("progressPR").value.trim()
  };
  appState.progress.push(entry);
  progressForm.reset();
  renderProgress();
  renderHomeStats();
  scheduleSaveToCloud();
});

// ---------- STREAK & HOME STATS ----------

function computeStreak() {
  const checklist = appState.checklist;
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = todayKey(d);
    const entry = checklist[key];
    if (entry && entry.workout) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function renderStreak() {
  const streak = computeStreak();
  if (streak === 0) {
    streakText.textContent = "No current streak. Start today.";
  } else if (streak === 1) {
    streakText.textContent = "1 day streak — nice start.";
  } else {
    streakText.textContent = `${streak} day streak — keep it going.`;
  }
}

const homeStreak = document.getElementById("home-streak");
const homeStreakSub = document.getElementById("home-streak-sub");
const homeWorkouts = document.getElementById("home-workouts");
const homeLastWorkout = document.getElementById("home-last-workout");
const homePRs = document.getElementById("home-prs");

function renderHomeStats() {
  const streak = computeStreak();
  homeStreak.textContent = streak;
  homeStreakSub.textContent = "days in a row";

  const entries = appState.progress;
  homeWorkouts.textContent = entries.length;

  if (!entries.length) {
    homeLastWorkout.textContent = "–";
  } else {
    const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
    homeLastWorkout.textContent = new Date(sorted[0].date).toLocaleDateString();
  }

  const prs = entries.filter((e) => e.pr && e.pr.trim().length > 0).length;
  homePRs.textContent = prs;
}

// ---------- ACTIVE SESSION (REPS + TIMER) ----------

let sessionState = {
  exercise: "",
  sets: 0,
  reps: 0,
  timerSeconds: 0,
  timerRunning: false,
  timerId: null
};

const sessionSetsEl = document.getElementById("sessionSets");
const sessionRepsEl = document.getElementById("sessionReps");
const sessionTimerEl = document.getElementById("sessionTimer");
const btnRepPlus = document.getElementById("btnRepPlus");
const btnSetPlus = document.getElementById("btnSetPlus");
const btnTimerToggle = document.getElementById("btnTimerToggle");
const btnTimerReset = document.getElementById("btnTimerReset");
const sessionTargetSets = document.getElementById("sessionTargetSets");
const sessionTargetReps = document.getElementById("sessionTargetReps");

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function renderSession() {
  sessionSetsEl.textContent = sessionState.sets;
  sessionRepsEl.textContent = sessionState.reps;
  sessionTimerEl.textContent = formatTime(sessionState.timerSeconds);
}

function startTimer() {
  if (sessionState.timerRunning) return;
  sessionState.timerRunning = true;
  btnTimerToggle.textContent = "Pause timer";
  sessionState.timerId = setInterval(() => {
    sessionState.timerSeconds += 1;
    sessionTimerEl.textContent = formatTime(sessionState.timerSeconds);
  }, 1000);
}

function pauseTimer() {
  sessionState.timerRunning = false;
  btnTimerToggle.textContent = "Start timer";
  if (sessionState.timerId) {
    clearInterval(sessionState.timerId);
    sessionState.timerId = null;
  }
}

function resetTimer() {
  pauseTimer();
  sessionState.timerSeconds = 0;
  renderSession();
}

btnRepPlus.addEventListener("click", (e) => {
  e.preventDefault();
  sessionState.reps += 1;
  const target = Number(sessionTargetReps.value) || 0;
  if (target && sessionState.reps >= target) {
    sessionState.sets += 1;
    sessionState.reps = 0;
  }
  renderSession();
});

btnSetPlus.addEventListener("click", (e) => {
  e.preventDefault();
  sessionState.sets += 1;
  renderSession();
});

btnTimerToggle.addEventListener("click", (e) => {
  e.preventDefault();
  if (sessionState.timerRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

btnTimerReset.addEventListener("click", (e) => {
  e.preventDefault();
  resetTimer();
  sessionState.sets = 0;
  sessionState.reps = 0;
  renderSession();
});

sessionExerciseSelect.addEventListener("change", () => {
  resetTimer();
  sessionState.sets = 0;
  sessionState.reps = 0;
  sessionState.exercise = sessionExerciseSelect.value;
  renderSession();
});

// ---------- SETTINGS ----------

const themeSelect = document.getElementById("themeSelect");
const fontSizeSelect = document.getElementById("fontSizeSelect");
const weightUnitSelect = document.getElementById("weightUnitSelect");
const distanceUnitSelect = document.getElementById("distanceUnitSelect");
const enableNotificationsBtn = document.getElementById("enableNotifications");

function applySettings() {
  const settings = appState.settings;

  themeSelect.value = settings.theme;
  fontSizeSelect.value = settings.fontSize;
  weightUnitSelect.value = settings.weightUnit;
  distanceUnitSelect.value = settings.distanceUnit;

  const root = document.documentElement;
  if (settings.theme === "light") {
    root.setAttribute("data-theme", "light");
  } else if (settings.theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", prefersDark ? "dark" : "light");
  }

  if (settings.fontSize === "large") {
    root.setAttribute("data-font", "large");
  } else {
    root.removeAttribute("data-font");
  }
}

function saveSettings() {
  appState.settings = {
    theme: themeSelect.value,
    fontSize: fontSizeSelect.value,
    weightUnit: weightUnitSelect.value,
    distanceUnit: distanceUnitSelect.value
  };
  applySettings();
  renderProfile();
  renderProgress();
  renderHomeStats();
  scheduleSaveToCloud();
}

themeSelect.addEventListener("change", saveSettings);
fontSizeSelect.addEventListener("change", saveSettings);
weightUnitSelect.addEventListener("change", saveSettings);
distanceUnitSelect.addEventListener("change", saveSettings);

enableNotificationsBtn.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    alert("Notifications are not supported in this browser.");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    new Notification("Notifications enabled", {
      body: "You’ll receive local reminders when this app is open."
    });
  }
});

// ---------- PWA SERVICE WORKER ----------

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}

// ---------- INITIAL UI (after auth) ----------

function initUI() {
  applySettings();
  renderProfile();
  renderWorkouts();
  renderTodayChecklist();
  renderCalendar();
  renderProgress();
  renderStreak();
  renderHomeStats();
  renderSession();
}
