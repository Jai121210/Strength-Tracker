// Simple localStorage helpers
const STORAGE_KEYS = {
  PROFILE: "owt_profile",
  WORKOUTS: "owt_workouts",
  CHECKLIST: "owt_checklist",
  PROGRESS: "owt_progress",
  SETTINGS: "owt_settings",
};

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

// Profile
const profileForm = document.getElementById("profile-form");
const profileSummary = document.getElementById("profile-summary");

function renderProfile() {
  const profile = load(STORAGE_KEYS.PROFILE, null);
  if (!profile) {
    profileSummary.textContent = "No profile saved yet.";
    return;
  }
  document.getElementById("age").value = profile.age || "";
  document.getElementById("weight").value = profile.weight || "";
  document.getElementById("height").value = profile.height || "";
  document.getElementById("fitnessLevel").value = profile.fitnessLevel || "beginner";
  document.getElementById("goal").value = profile.goal || "muscle";

  profileSummary.textContent = `Age ${profile.age || "?"}, ${profile.weight || "?"} ${
    load(STORAGE_KEYS.SETTINGS, {}).weightUnit || "kg"
  }, ${profile.height || "?"} cm • Level: ${profile.fitnessLevel || "?"} • Goal: ${
    profile.goal || "?"
  }`;
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

// Workouts
const workoutForm = document.getElementById("workout-form");
const workoutList = document.getElementById("workout-list");

function renderWorkouts() {
  const workouts = load(STORAGE_KEYS.WORKOUTS, []);
  workoutList.innerHTML = "";
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
    removeBtn.style.marginTop = "0.25rem";
    removeBtn.style.fontSize = "0.7rem";
    removeBtn.style.borderRadius = "999px";
    removeBtn.style.border = "none";
    removeBtn.style.padding = "0.25rem 0.6rem";
    removeBtn.style.cursor = "pointer";
    removeBtn.style.background = "rgba(239, 68, 68, 0.12)";
    removeBtn.style.color = "#fecaca";
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

// Planner / Checklist
const todayDateEl = document.getElementById("today-date");
const checklistForm = document.getElementById("today-checklist");
const calendarEl = document.getElementById("calendar");

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function renderTodayChecklist() {
  const checklist = load(STORAGE_KEYS.CHECKLIST, {});
  const todayKey = getTodayKey();
  const today = checklist[todayKey] || {};
  document.getElementById("taskWorkout").checked = !!today.workout;
  document.getElementById("taskStretch").checked = !!today.stretch;
  document.getElementById("taskHydration").checked = !!today.hydration;
  document.getElementById("taskMeditation").checked = !!today.meditation;
  document.getElementById("taskSleep").checked = !!today.sleep;

  const todayDate = new Date();
  todayDateEl.textContent = todayDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

checklistForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const checklist = load(STORAGE_KEYS.CHECKLIST, {});
  const todayKey = getTodayKey();
  checklist[todayKey] = {
    workout: document.getElementById("taskWorkout").checked,
    stretch: document.getElementById("taskStretch").checked,
    hydration: document.getElementById("taskHydration").checked,
    meditation: document.getElementById("taskMeditation").checked,
    sleep: document.getElementById("taskSleep").checked,
  };
  save(STORAGE_KEYS.CHECKLIST, checklist);
  renderCalendar();
  renderStreak();
});

function renderCalendar() {
  const checklist = load(STORAGE_KEYS.CHECKLIST, {});
  calendarEl.innerHTML = "";
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = getTodayKey(d);
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

// Progress
const progressForm = document.getElementById("progress-form");
const progressList = document.getElementById("progress-list");
const streakText = document.getElementById("streak-text");

function renderProgress() {
  const entries = load(STORAGE_KEYS.PROGRESS, []);
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
    meta.textContent = `Weight: ${
      entry.weight ? entry.weight : "n/a"
    } ${load(STORAGE_KEYS.SETTINGS, {}).weightUnit || "kg"}`;

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
      pr.style.color = "#facc15";
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
  const date = dateInput || getTodayKey();
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
  renderStreak();
});

function renderStreak() {
  const checklist = load(STORAGE_KEYS.CHECKLIST, {});
  let streak = 0;
  const today = new Date();
  while (true) {
    const key = getTodayKey(today);
    const entry = checklist[key];
    if (entry && entry.workout) {
      streak += 1;
      today.setDate(today.getDate() - 1);
    } else {
      break;
    }
  }
  if (streak === 0) {
    streakText.textContent = "No current streak. Start today!";
  } else if (streak === 1) {
    streakText.textContent = "1 day streak—nice start!";
  } else {
    streakText.textContent = `${streak} day streak—keep it going.`;
  }
}

// Settings
const themeSelect = document.getElementById("themeSelect");
const fontSizeSelect = document.getElementById("fontSizeSelect");
const weightUnitSelect = document.getElementById("weightUnitSelect");
const distanceUnitSelect = document.getElementById("distanceUnitSelect");
const enableNotificationsBtn = document.getElementById("enableNotifications");

function applySettings() {
  const settings = load(STORAGE_KEYS.SETTINGS, {
    theme: "system",
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

// PWA: register service worker
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
applySettings();
