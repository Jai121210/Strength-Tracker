// Storage keys
const STORAGE_KEYS = {
  PROFILE: "owt_profile",
  WORKOUTS: "owt_workouts",
  CHECKLIST: "owt_checklist",
  PROGRESS: "owt_progress",
  SETTINGS: "owt_settings",
};

// Helpers
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

// Tabs
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

// PROFILE
const profileForm = document.getElementById("profile-form");
const profileSummary = document.getElementById("profile-summary");

function renderProfile() {
  const profile = load(STORAGE_KEYS.PROFILE, null);
  const settings = load(STORAGE_KEYS.SETTINGS, {});
  const weightUnit = settings.weightUnit || "kg";

  if (!profile) {
    profileSummary.textContent = "No profile saved yet.";
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
  const profile = {
    age: Number(document.getElementById("age").value) || null,
    weight: Number(document.getElementById("weight").value) || null,
    height: Number(document.getElementById("height").value) || null,
    fitnessLevel: document.getElementById("fitnessLevel").value,
    goal: document.getElementById("goal").value,
  };
  save(STORAGE_KEYS.PROFILE, profile);
  renderProfile();
});

// WORKOUTS
const workoutForm = document.getElementById("workout-form");
const workoutList = document.getElementById("workout-list");
const workoutCount = document.getElementById("workout-count");
const sessionExerciseSelect = document.getElementById("sessionExercise");

function renderWorkouts() {
  const workouts = load(STORAGE_KEYS.WORKOUTS, []);
  workoutList.innerHTML = "";
  workoutCount.textContent = `${workouts.length} total`;

  // Populate dropdown for session
  sessionExerciseSelect.innerHTML = '<option value="">Select exercise</option>';
  workouts.forEach((w, index) => {
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
      const updated = workouts.filter((_, i) => i !== index);
      save(STORAGE_KEYS.WORKOUTS, updated);
      renderWorkouts();
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
  const workouts = load(STORAGE_KEYS.WORKOUTS, []);
  const workout = {
    name: document.getElementById("workoutName").value.trim(),
    description: document.getElementById("workoutDescription").value.trim(),
    difficulty: document.getElementById("workoutDifficulty").value,
    muscles: document.getElementById("workoutMuscles").value.trim(),
    equipment: document.getElementById("workoutEquipment").value.trim(),
  };
  if (!workout.name) return;
  workouts.push(workout);
  save(STORAGE_KEYS.WORKOUTS, workouts);
  workoutForm.reset();
  renderWorkouts();
});

// PLANNER / CHECKLIST
const todayDateEl = document.getElementById("today-date");
const checklistForm = document.getElementById("today-checklist");
const calendarEl = document.getElementById("calendar");

function renderTodayChecklist() {
  const checklist = load(STORAGE_KEYS.CHECKLIST, {});
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
    day: "numeric",
  });
}

checklistForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const checklist = load(STORAGE_KEYS.CHECKLIST, {});
  const key = todayKey();
  checklist[key] = {
    workout: document.getElementById("taskWorkout").checked,
    stretch: document.getElementById("taskStretch").checked,
    hydration: document.getElementById("taskHydration").checked,
    meditation: document.getElementById("taskMeditation").checked,
    sleep: document.getElementById("taskSleep").checked,
  };
  save(STORAGE_KEYS.CHECKLIST, checklist);
  renderCalendar();
  renderStreak();
  renderHomeStats();
});

function renderCalendar() {
  const checklist = load(STORAGE_KEYS.CHECKLIST, {});
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

// PROGRESS
const progressForm = document.getElementById("progress-form");
const progressList = document.getElementById("progress-list");
const streakText = document.getElementById("streak-text");

function renderProgress() {
  const entries = load(STORAGE_KEYS.PROGRESS, []);
  const settings = load(STORAGE_KEYS.SETTINGS, {});
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
  const entries = load(STORAGE_KEYS.PROGRESS, []);
  const dateInput = document.getElementById("progressDate").value;
  const date = dateInput || todayKey();
  const entry = {
    date,
    weight: Number(document.getElementById("progressWeight").value) || null,
    notes: document.getElementById("progressNotes").value.trim(),
    pr: document.getElementById("progressPR").value.trim(),
  };
  entries.push(entry);
  save(STORAGE_KEYS.PROGRESS, entries);
  progressForm.reset();
  renderProgress();
  renderHomeStats();
});

// STREAK
function computeStreak() {
  const checklist = load(STORAGE_KEYS.CHECKLIST, {});
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

// HOME STATS
const homeStreak = document.getElementById("home-streak");
const homeStreakSub = document.getElementById("home-streak-sub");
const homeWorkouts = document.getElementById("home-workouts");
const homeLastWorkout = document.getElementById("home-last-workout");
const homePRs = document.getElementById("home-prs");

function renderHomeStats() {
  const streak = computeStreak();
  homeStreak.textContent = streak;
  homeStreakSub.textContent = "days in a row";

  const entries = load(STORAGE_KEYS.PROGRESS, []);
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

// ACTIVE SESSION: auto rep adder + timer
let sessionState = {
  exercise: "",
  sets: 0,
  reps: 0,
  timerSeconds: 0,
  timerRunning: false,
  timerId: null,
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

  if (sessionState.timerRunning) {
    btnTimerToggle.textContent = "Pause timer";
    btnTimerToggle.classList.add("chip-accent");
  } else {
    btnTimerToggle.textContent = "Start timer";
    btnTimerToggle.classList.add("chip-accent");
  }
}

function startTimer() {
  if (sessionState.timerRunning) return;
  sessionState.timerRunning = true;
  sessionState.timerId = setInterval(() => {
    sessionState.timerSeconds += 1;
    sessionTimerEl.textContent = formatTime(sessionState.timerSeconds);
  }, 1000);
}

function pauseTimer() {
  sessionState.timerRunning = false;
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
    // auto-advance set when reps hit target
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
  // Reset session when exercise changes
  resetTimer();
  sessionState.sets = 0;
  sessionState.reps = 0;
  sessionState.exercise = sessionExerciseSelect.value;
  renderSession();
});

// SETTINGS
const themeSelect = document.getElementById("themeSelect");
const fontSizeSelect = document.getElementById("fontSizeSelect");
const weightUnitSelect = document.getElementById("weightUnitSelect");
const distanceUnitSelect = document.getElementById("distanceUnitSelect");
const enableNotificationsBtn = document.getElementById("enableNotifications");

function applySettings() {
  const settings = load(STORAGE_KEYS.SETTINGS, {
    theme: "dark",
    fontSize: "normal",
    weightUnit: "kg",
    distanceUnit: "km",
  });

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
  const settings = {
    theme: themeSelect.value,
    fontSize: fontSizeSelect.value,
    weightUnit: weightUnitSelect.value,
    distanceUnit: distanceUnitSelect.value,
  };
  save(STORAGE_KEYS.SETTINGS, settings);
  applySettings();
  renderProfile();
  renderProgress();
  renderHomeStats();
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
      body: "You’ll receive local reminders when this app is open.",
    });
  }
});

// PWA: service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}

// Initial render
renderProfile();
renderWorkouts();
renderTodayChecklist();
renderCalendar();
renderProgress();
renderStreak();
renderHomeStats();
applySettings();
renderSession();
