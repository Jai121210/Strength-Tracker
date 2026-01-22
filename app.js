// ---------- FIREBASE SETUP ----------

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
const storage = firebase.storage();

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
  },
  customExercises: [],
  routines: []
};

const DATA_DOC_ID = "appData";

function getUserDocRef() {
  if (!currentUser) return null;
  return db
    .collection("users")
    .doc(currentUser.uid)
    .collection("data")
    .doc(DATA_DOC_ID);
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
    console.error(err);
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
      },
      customExercises: data.customExercises || [],
      routines: data.routines || []
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
    await ref.set(appState, { merge: true });
  } catch (e) {
    console.error("Error saving data:", e);
  }
}

// ---------- UTILITIES ----------

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ---------- SIDEBAR NAVIGATION ----------

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const openSidebar = document.getElementById("openSidebar");
const closeSidebar = document.getElementById("closeSidebar");
const sidebarItems = document.querySelectorAll(".sidebar-menu li");
const logoutBtnSidebar = document.getElementById("logoutBtnSidebar");

openSidebar.addEventListener("click", () => {
  sidebar.classList.add("open");
  sidebarOverlay.style.display = "block";
});

closeSidebar.addEventListener("click", () => {
  sidebar.classList.remove("open");
  sidebarOverlay.style.display = "none";
});

sidebarOverlay.addEventListener("click", () => {
  sidebar.classList.remove("open");
  sidebarOverlay.style.display = "none";
});

sidebarItems.forEach(item => {
  item.addEventListener("click", () => {
    const target = item.dataset.target;
    if (target) {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.getElementById(target).classList.add("active");
    }
    sidebar.classList.remove("open");
    sidebarOverlay.style.display = "none";
  });
});

logoutBtnSidebar.addEventListener("click", async () => {
  await auth.signOut();
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

if (checklistForm) {
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
}

function renderCalendar() {
  if (!calendarEl) return;
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

// ---------- PROGRESS + PHOTO UPLOAD ----------

const progressForm = document.getElementById("progress-form");
const progressList = document.getElementById("progress-list");
const streakText = document.getElementById("streak-text");

function renderProgress() {
  if (!progressList) return;
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

    if (entry.photoURL) {
      const img = document.createElement("img");
      img.src = entry.photoURL;
      img.style.width = "100%";
      img.style.borderRadius = "0.6rem";
      img.style.marginTop = "0.5rem";
      img.style.objectFit = "cover";
      li.appendChild(img);
    }

    progressList.appendChild(li);
  });
}

if (progressForm) {
  progressForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dateInput = document.getElementById("progressDate").value;
    const date = dateInput || todayKey();
    const weight = Number(document.getElementById("progressWeight").value) || null;
    const notes = document.getElementById("progressNotes").value.trim();
    const pr = document.getElementById("progressPR").value.trim();
    const photoFile = document.getElementById("progressPhoto").files[0];

    let photoURL = null;

    if (photoFile && currentUser) {
      try {
        const storageRef = storage
          .ref()
          .child(`users/${currentUser.uid}/progressPhotos/${date}-${photoFile.name}`);
        await storageRef.put(photoFile);
        photoURL = await storageRef.getDownloadURL();
      } catch (err) {
        console.error("Photo upload failed:", err);
      }
    }

    const entry = {
      date,
      weight,
      notes,
      pr,
      photoURL
    };

    appState.progress.push(entry);
    progressForm.reset();
    renderProgress();
    renderHomeStats();
    scheduleSaveToCloud();
  });
}

// ---------- STREAK & HOME STATS ----------

const homeStreak = document.getElementById("home-streak");
const homeStreakSub = document.getElementById("home-streak-sub");
const homeWorkouts = document.getElementById("home-workouts");
const homeLastWorkout = document.getElementById("home-last-workout");
const homePRs = document.getElementById("home-prs");

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
  if (!streakText) return;
  const streak = computeStreak();
  if (streak === 0) {
    streakText.textContent = "No current streak. Start today.";
  } else if (streak === 1) {
    streakText.textContent = "1 day streak — nice start.";
  } else {
    streakText.textContent = `${streak} day streak — keep it going.`;
  }
}

function renderHomeStats() {
  if (!homeStreak) return;
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

// ---------- CUSTOM EXERCISES ----------

const exerciseForm = document.getElementById("exerciseForm");
const exerciseList = document.getElementById("exerciseList");

function renderExercises() {
  if (!exerciseList) return;
  const exercises = appState.customExercises;
  exerciseList.innerHTML = "";

  if (!exercises.length) {
    const li = document.createElement("li");
    li.textContent = "No exercises yet. Create one.";
    exerciseList.appendChild(li);
    return;
  }

  exercises.forEach((ex) => {
    const li = document.createElement("li");
    const title = document.createElement("div");
    title.className = "list-title";
    title.textContent = ex.name;

    const meta = document.createElement("div");
    meta.className = "list-meta";
    meta.textContent = `${ex.muscles || "n/a"} • ${ex.equipment || "Bodyweight"} • ${
      ex.defaultSets || 0
    }x${ex.defaultReps || 0} • Rest ${ex.restSeconds || 0}s`;

    const desc = document.createElement("div");
    desc.style.fontSize = "0.8rem";
    desc.style.marginTop = "0.15rem";
    desc.textContent = ex.description || "";

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "chip chip-ghost";
    delBtn.style.marginTop = "0.35rem";
    delBtn.addEventListener("click", () => {
      appState.customExercises = exercises.filter((e) => e.id !== ex.id);
      renderExercises();
      renderRoutines();
      scheduleSaveToCloud();
    });

    li.appendChild(title);
    li.appendChild(meta);
    if (ex.description) li.appendChild(desc);
    li.appendChild(delBtn);
    exerciseList.appendChild(li);
  });
}

if (exerciseForm) {
  exerciseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const ex = {
      id: uuid(),
      name: document.getElementById("exerciseName").value.trim(),
      description: document.getElementById("exerciseDescription").value.trim(),
      muscles: document.getElementById("exerciseMuscles").value.trim(),
      equipment: document.getElementById("exerciseEquipment").value.trim(),
      defaultSets: Number(document.getElementById("exerciseSets").value) || 3,
      defaultReps: Number(document.getElementById("exerciseReps").value) || 10,
      restSeconds: Number(document.getElementById("exerciseRest").value) || 60,
      timerType: document.getElementById("exerciseTimerType").value
    };
    if (!ex.name) return;
    appState.customExercises.push(ex);
    exerciseForm.reset();
    renderExercises();
    renderRoutines();
    scheduleSaveToCloud();
  });
}

// ---------- ROUTINES ----------

const routineForm = document.getElementById("routineForm");
const routineNameInput = document.getElementById("routineName");
const routineExerciseSelect = document.getElementById("routineExerciseSelect");
const routineSetsInput = document.getElementById("routineSets");
const routineRepsInput = document.getElementById("routineReps");
const routineRestInput = document.getElementById("routineRest");
const routineExercisesList = document.getElementById("routineExercisesList");
const routinesList = document.getElementById("routinesList");
const routineAddExerciseBtn = document.getElementById("routineAddExercise");
const routineIncreaseAllRepsBtn = document.getElementById("routineIncreaseAllRepsBtn");

let currentRoutineDraft = {
  id: null,
  name: "",
  exercises: []
};

function refreshRoutineExerciseSelect() {
  if (!routineExerciseSelect) return;
  routineExerciseSelect.innerHTML = '<option value="">Select exercise</option>';
  appState.customExercises.forEach((ex) => {
    const opt = document.createElement("option");
    opt.value = ex.id;
    opt.textContent = ex.name;
    routineExerciseSelect.appendChild(opt);
  });
}

function renderRoutineDraft() {
  if (!routineExercisesList) return;
  routineExercisesList.innerHTML = "";
  currentRoutineDraft.exercises.forEach((item, index) => {
    const ex = appState.customExercises.find((e) => e.id === item.exerciseId);
    const li = document.createElement("li");
    li.textContent = `${ex ? ex.name : "Unknown"} — ${item.sets}x${item.reps}, Rest ${
      item.restSeconds
    }s`;
    const del = document.createElement("button");
    del.textContent = "Remove";
    del.className = "chip chip-ghost";
    del.style.marginLeft = "0.5rem";
    del.addEventListener("click", () => {
      currentRoutineDraft.exercises.splice(index, 1);
      renderRoutineDraft();
    });
    li.appendChild(del);
    routineExercisesList.appendChild(li);
  });
}

function renderRoutines() {
  if (!routinesList) return;
  routinesList.innerHTML = "";
  const routines = appState.routines;
  if (!routines.length) {
    const li = document.createElement("li");
    li.textContent = "No routines yet. Create one.";
    routinesList.appendChild(li);
    return;
  }

  routines.forEach((r) => {
    const li = document.createElement("li");
    const title = document.createElement("div");
    title.className = "list-title";
    title.textContent = r.name;

    const meta = document.createElement("div");
    meta.className = "list-meta";
    meta.textContent = `${r.exercises.length} exercises`;

    const startBtn = document.createElement("button");
    startBtn.textContent = "Start";
    startBtn.className = "chip";
    startBtn.style.marginTop = "0.35rem";
    startBtn.addEventListener("click", () => {
      startRoutineSession(r.id);
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.getElementById("session").classList.add("active");
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "chip chip-ghost";
    delBtn.style.marginTop = "0.35rem";
    delBtn.style.marginLeft = "0.5rem";
    delBtn.addEventListener("click", () => {
      appState.routines = routines.filter((x) => x.id !== r.id);
      renderRoutines();
      scheduleSaveToCloud();
    });

    li.appendChild(title);
    li.appendChild(meta);
    li.appendChild(startBtn);
    li.appendChild(delBtn);
    routinesList.appendChild(li);
  });

  refreshRoutineSelectForSession();
}

if (routineAddExerciseBtn) {
  routineAddExerciseBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const exId = routineExerciseSelect.value;
    if (!exId) return;
    const sets = Number(routineSetsInput.value) || 3;
    const reps = Number(routineRepsInput.value) || 10;
    const restSeconds = Number(routineRestInput.value) || 60;
    currentRoutineDraft.exercises.push({ exerciseId: exId, sets, reps, restSeconds });
    renderRoutineDraft();
  });
}

if (routineForm) {
  routineForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = routineNameInput.value.trim();
    if (!name || !currentRoutineDraft.exercises.length) return;
    const routine = {
      id: uuid(),
      name,
      exercises: [...currentRoutineDraft.exercises]
    };
    appState.routines.push(routine);
    currentRoutineDraft = { id: null, name: "", exercises: [] };
    routineForm.reset();
    renderRoutineDraft();
    renderRoutines();
    scheduleSaveToCloud();
  });
}

if (routineIncreaseAllRepsBtn) {
  routineIncreaseAllRepsBtn.addEventListener("click", (e) => {
    e.preventDefault();
    currentRoutineDraft.exercises = currentRoutineDraft.exercises.map((item) => ({
      ...item,
      reps: item.reps + 1
    }));
    renderRoutineDraft();
  });
}

// ---------- ROUTINE SESSION ----------

const sessionRoutineSelect = document.getElementById("sessionRoutineSelect");
const sessionExerciseName = document.getElementById("sessionExerciseName");
const sessionSetInfo = document.getElementById("sessionSetInfo");
const sessionRepInfo = document.getElementById("sessionRepInfo");
const sessionRestTimer = document.getElementById("sessionRestTimer");
const sessionExerciseTimer = document.getElementById("sessionExerciseTimer");
const btnSessionRepPlus = document.getElementById("btnSessionRepPlus");
const btnSessionSetDone = document.getElementById("btnSessionSetDone");
const btnSessionNextExercise = document.getElementById("btnSessionNextExercise");
const btnSessionStartExerciseTimer = document.getElementById("btnSessionStartExerciseTimer");
const btnSessionStopExerciseTimer = document.getElementById("btnSessionStopExerciseTimer");

let routineSession = {
  routineId: null,
  exerciseIndex: 0,
  currentSet: 1,
  currentReps: 0,
  restSecondsLeft: 0,
  restTimerId: null,
  exerciseSeconds: 0,
  exerciseTimerId: null,
  exerciseTimerRunning: false
};

function refreshRoutineSelectForSession() {
  if (!sessionRoutineSelect) return;
  sessionRoutineSelect.innerHTML = '<option value="">Select routine</option>';
  appState.routines.forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = r.name;
    sessionRoutineSelect.appendChild(opt);
  });
}

function stopRestTimer() {
  if (routineSession.restTimerId) {
    clearInterval(routineSession.restTimerId);
    routineSession.restTimerId = null;
  }
  routineSession.restSecondsLeft = 0;
  if (sessionRestTimer) sessionRestTimer.textContent = "";
}

function stopExerciseTimer() {
  if (routineSession.exerciseTimerId) {
    clearInterval(routineSession.exerciseTimerId);
    routineSession.exerciseTimerId = null;
  }
  routineSession.exerciseTimerRunning = false;
}

function renderRoutineSession() {
  if (!sessionExerciseName) return;
  const routine = appState.routines.find((r) => r.id === routineSession.routineId);
  if (!routine) {
    sessionExerciseName.textContent = "No routine selected.";
    sessionSetInfo.textContent = "";
    sessionRepInfo.textContent = "";
    if (sessionRestTimer) sessionRestTimer.textContent = "";
    if (sessionExerciseTimer) sessionExerciseTimer.textContent = "00:00";
    return;
  }

  const item = routine.exercises[routineSession.exerciseIndex];
  const ex = appState.customExercises.find((e) => e.id === item.exerciseId);

  if (!ex) {
    sessionExerciseName.textContent = "Unknown exercise.";
    return;
  }

  sessionExerciseName.textContent = ex.name;
  sessionSetInfo.textContent = `Set ${routineSession.currentSet} of ${item.sets}`;
  sessionRepInfo.textContent = `${routineSession.currentReps} / ${item.reps} reps`;

  if (sessionRestTimer && routineSession.restSecondsLeft > 0) {
    sessionRestTimer.textContent = `Rest: ${formatTime(routineSession.restSecondsLeft)}`;
  }

  if (sessionExerciseTimer) {
    sessionExerciseTimer.textContent = formatTime(routineSession.exerciseSeconds);
  }
}

function startRoutineSession(routineId) {
  routineSession = {
    routineId,
    exerciseIndex: 0,
    currentSet: 1,
    currentReps: 0,
    restSecondsLeft: 0,
    restTimerId: null,
    exerciseSeconds: 0,
    exerciseTimerId: null,
    exerciseTimerRunning: false
  };
  stopRestTimer();
  stopExerciseTimer();
  renderRoutineSession();
}

if (sessionRoutineSelect) {
  sessionRoutineSelect.addEventListener("change", () => {
    const id = sessionRoutineSelect.value;
    if (!id) return;
    startRoutineSession(id);
  });
}

if (btnSessionRepPlus) {
  btnSessionRepPlus.addEventListener("click", (e) => {
    e.preventDefault();
    const routine = appState.routines.find((r) => r.id === routineSession.routineId);
    if (!routine) return;
    const item = routine.exercises[routineSession.exerciseIndex];
    routineSession.currentReps += 1;
    if (routineSession.currentReps >= item.reps) {
      routineSession.currentReps = item.reps;
    }
    renderRoutineSession();
  });
}

if (btnSessionSetDone) {
  btnSessionSetDone.addEventListener("click", (e) => {
    e.preventDefault();
    const routine = appState.routines.find((r) => r.id === routineSession.routineId);
    if (!routine) return;
    const item = routine.exercises[routineSession.exerciseIndex];

    if (routineSession.currentSet < item.sets) {
      routineSession.currentSet += 1;
      routineSession.currentReps = 0;
      stopRestTimer();
      routineSession.restSecondsLeft = item.restSeconds || 60;
      if (sessionRestTimer) {
        sessionRestTimer.textContent = `Rest: ${formatTime(routineSession.restSecondsLeft)}`;
      }
      routineSession.restTimerId = setInterval(() => {
        routineSession.restSecondsLeft -= 1;
        if (routineSession.restSecondsLeft <= 0) {
          stopRestTimer();
        } else if (sessionRestTimer) {
          sessionRestTimer.textContent = `Rest: ${formatTime(routineSession.restSecondsLeft)}`;
        }
      }, 1000);
    } else {
      if (routineSession.exerciseIndex < routine.exercises.length - 1) {
        routineSession.exerciseIndex += 1;
        routineSession.currentSet = 1;
        routineSession.currentReps = 0;
        stopRestTimer();
        stopExerciseTimer();
        routineSession.exerciseSeconds = 0;
      } else {
        routineSession.exerciseIndex = 0;
        routineSession.currentSet = 1;
        routineSession.currentReps = 0;
        stopRestTimer();
        stopExerciseTimer();
        routineSession.exerciseSeconds = 0;
        alert("Workout complete. Nice work.");
      }
    }
    renderRoutineSession();
  });
}

if (btnSessionNextExercise) {
  btnSessionNextExercise.addEventListener("click", (e) => {
    e.preventDefault();
    const routine = appState.routines.find((r) => r.id === routineSession.routineId);
    if (!routine) return;
    if (routineSession.exerciseIndex < routine.exercises.length - 1) {
      routineSession.exerciseIndex += 1;
      routineSession.currentSet = 1;
      routineSession.currentReps = 0;
      stopRestTimer();
      stopExerciseTimer();
      routineSession.exerciseSeconds = 0;
      renderRoutineSession();
    }
  });
}

if (btnSessionStartExerciseTimer) {
  btnSessionStartExerciseTimer.addEventListener("click", (e) => {
    e.preventDefault();
    if (routineSession.exerciseTimerRunning) return;
    routineSession.exerciseTimerRunning = true;
    routineSession.exerciseTimerId = setInterval(() => {
      routineSession.exerciseSeconds += 1;
      if (sessionExerciseTimer) {
        sessionExerciseTimer.textContent = formatTime(routineSession.exerciseSeconds);
      }
    }, 1000);
  });
}

if (btnSessionStopExerciseTimer) {
  btnSessionStopExerciseTimer.addEventListener("click", (e) => {
    e.preventDefault();
    stopExerciseTimer();
  });
}

// ---------- SETTINGS ----------

const themeSelect = document.getElementById("themeSelect");
const fontSizeSelect = document.getElementById("fontSizeSelect");
const weightUnitSelect = document.getElementById("weightUnitSelect");
const distanceUnitSelect = document.getElementById("distanceUnitSelect");
const enableNotificationsBtn = document.getElementById("enableNotifications");

function applySettings() {
  const settings = appState.settings;

  if (themeSelect) themeSelect.value = settings.theme;
  if (fontSizeSelect) fontSizeSelect.value = settings.fontSize;
  if (weightUnitSelect) weightUnitSelect.value = settings.weightUnit;
  if (distanceUnitSelect) distanceUnitSelect.value = settings.distanceUnit;

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
    theme: themeSelect ? themeSelect.value : "dark",
    fontSize: fontSizeSelect ? fontSizeSelect.value : "normal",
    weightUnit: weightUnitSelect ? weightUnitSelect.value : "kg",
    distanceUnit: distanceUnitSelect ? distanceUnitSelect.value : "km"
  };
  applySettings();
  renderProfile();
  renderProgress();
  renderHomeStats();
  scheduleSaveToCloud();
}

if (themeSelect) themeSelect.addEventListener("change", saveSettings);
if (fontSizeSelect) fontSizeSelect.addEventListener("change", saveSettings);
if (weightUnitSelect) weightUnitSelect.addEventListener("change", saveSettings);
if (distanceUnitSelect) distanceUnitSelect.addEventListener("change", saveSettings);

if (enableNotificationsBtn) {
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
}

// ---------- PWA SERVICE WORKER ----------

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}

// ---------- INITIAL UI ----------

function initUI() {
  applySettings();
  renderProfile();
  renderTodayChecklist();
  renderCalendar();
  renderProgress();
  renderStreak();
  renderHomeStats();
  renderExercises();
  refreshRoutineExerciseSelect();
  renderRoutines();
  renderRoutineSession();
}
