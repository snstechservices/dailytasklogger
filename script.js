// ========================================
// CLOCK WIDGET
// ========================================

// Update clock every second
function updateClock() {
  const now = new Date();

  // Format time (HH:MM:SS)
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeString = `${hours}:${minutes}:${seconds}`;

  // Format date
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateString = now.toLocaleDateString('en-US', options);

  // Update DOM
  const timeElement = document.getElementById('currentTime');
  const dateElement = document.getElementById('currentDate');

  if (timeElement) timeElement.textContent = timeString;
  if (dateElement) dateElement.textContent = dateString;
}

// Initialize clock
function initializeClock() {
  // Start clock
  updateClock();
  setInterval(updateClock, 1000);
}

// ========================================
// PERSONALIZED HEADER
// ========================================

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

function updatePersonalizedHeader() {
  // Get elements
  const greetingText = document.getElementById('greetingText');
  const greetingSubtext = document.getElementById('greetingSubtext');
  const headerCompanyName = document.getElementById('headerCompanyName');
  const headerCompanyDetails = document.getElementById('headerCompanyDetails');
  const headerWorkstation = document.getElementById('headerWorkstation');
  const headerTimezone = document.getElementById('headerTimezone');
  const headerLogo = document.getElementById('headerLogo');

  // Get user data with fallbacks
  const userName = localStorage.getItem('reportUserName') || 'User';
  const workstation = localStorage.getItem('reportWorkstation') || 'Office';
  const timezone = localStorage.getItem('reportTimezone') || 'Local Time';
  
  // Get branding data
  const brandData = JSON.parse(localStorage.getItem('reportBrand') || '{}');
  const companyName = brandData.name || 'Your Company';
  const companyEmail = brandData.email || '';
  const companyPhone = brandData.phone || '';
  const companyWebsite = brandData.website || '';
  const logoType = localStorage.getItem('reportLogoType') || 'icon';
  const customLogo = localStorage.getItem('reportCustomLogo') || '';

  // Update greeting
  const greeting = getGreeting();
  if (greetingText) {
    greetingText.textContent = `${greeting}, ${userName}! 👋`;
  }
  
  // Update greeting subtext based on time
  if (greetingSubtext) {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) {
      greetingSubtext.textContent = "Ready to start a productive day?";
    } else if (hour >= 9 && hour < 12) {
      greetingSubtext.textContent = "Keep up the great work!";
    } else if (hour >= 12 && hour < 14) {
      greetingSubtext.textContent = "Don't forget to take a lunch break!";
    } else if (hour >= 14 && hour < 17) {
      greetingSubtext.textContent = "Stay focused, you're doing great!";
    } else if (hour >= 17 && hour < 19) {
      greetingSubtext.textContent = "Wrapping up for the day?";
    } else {
      greetingSubtext.textContent = "Working late? Remember to rest!";
    }
  }

  // Update company info
  if (headerCompanyName) {
    headerCompanyName.textContent = companyName;
  }

  // Update company details
  if (headerCompanyDetails) {
    let details = [];
    if (companyEmail) details.push(`<span>📧 ${companyEmail}</span>`);
    if (companyPhone) details.push(`<span>📞 ${companyPhone}</span>`);
    if (companyWebsite) {
      const shortWebsite = companyWebsite.replace(/^https?:\/\//, '').replace(/\/$/, '');
      details.push(`<span>🌐 ${shortWebsite}</span>`);
    }
    headerCompanyDetails.innerHTML = details.join('');
  }

  // Update workstation and timezone
  if (headerWorkstation) {
    headerWorkstation.textContent = workstation;
  }
  if (headerTimezone) {
    // Shorten timezone display
    const shortTimezone = timezone.split(' ')[0] || timezone;
    headerTimezone.textContent = shortTimezone;
  }

  // Update logo
  if (headerLogo) {
    if (logoType === 'custom' && customLogo) {
      headerLogo.innerHTML = `<img src="${customLogo}" alt="Logo">`;
    } else if (logoType === 'icon') {
      headerLogo.innerHTML = '💼';
    } else {
      headerLogo.innerHTML = '🏢';
    }
  }
}

// ========================================
// ORIGINAL CODE STARTS HERE
// ========================================

// Data structure:
// workSessions: [{ date, startTime, endTime, activities: [{ type: 'task'|'break', description, startTime, endTime, duration, project, category }] }]

function safeLoadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function getSessionIdentity(session) {
  if (!session) return "";
  const epoch = session.startEpoch ? String(session.startEpoch) : "";
  const time = session.startTime ? String(session.startTime) : "";
  return `${session.date || ""}__${epoch || time}`;
}

function upsertWorkSession(session) {
  if (!session || !session.date) return;
  const id = getSessionIdentity(session);
  const idx = workSessions.findIndex((s) => getSessionIdentity(s) === id);
  if (idx >= 0) workSessions[idx] = session;
  else workSessions.push(session);
}

const ACTIVE_SESSION_KEY = "activeSession";
const ACTIVE_ACTIVITY_KEY = "activeActivity";
const PAUSED_TASKS_KEY = "pausedTasks";

let workSessions = safeLoadJson("workSessions", []);
let pausedTasks = safeLoadJson(PAUSED_TASKS_KEY, []);
let currentSession = null;
let currentActivity = null;
let sessionTimerInterval = null;
let activityTimerInterval = null;
let currentWeekOffset = 0;
let pendingTaskStatus = null; // Temporarily stores activity while waiting for status

// Default projects and categories
const defaultProjects = ["General", "AML/CTF", "SNS Clockedin", "SNS Accounting", "SNS Tech"];
const defaultCategories = ["Other", "Backend", "Frontend", "Meeting", "Break"];

let customProjects = safeLoadJson("customProjects", [...defaultProjects]);
let customCategories = safeLoadJson("customCategories", [...defaultCategories]);

// DOM Elements
const startWorkBtn = document.getElementById("startWorkBtn");
const endWorkBtn = document.getElementById("endWorkBtn");
const stopActivityBtn = document.getElementById("stopActivityBtn");
const taskControls = document.querySelector(".task-controls");
const taskDescription = document.getElementById("taskDescription");
const sessionStatus = document.getElementById("sessionStatus");
const sessionTimer = document.getElementById("sessionTimer");
const workSessionInfo = document.getElementById("workSessionInfo");
const workStartTime = document.getElementById("workStartTime");
const totalSessionTime = document.getElementById("totalSessionTime");
const totalWorkTime = document.getElementById("totalWorkTime");
const totalBreakTime = document.getElementById("totalBreakTime");
const currentActivityDiv = document.getElementById("currentActivity");
const activityType = document.getElementById("activityType");
const activityTimer = document.getElementById("activityTimer");
const activityDescription = document.getElementById("activityDescription");
const weekDisplay = document.getElementById("weekDisplay");
const dailyAccordion = document.getElementById("dailyAccordion");
const prevWeekBtn = document.getElementById("prevWeek");
const nextWeekBtn = document.getElementById("nextWeek");
const currentWeekBtn = document.getElementById("currentWeek");
const openExportModalBtn = document.getElementById("openExportModalBtn");
const resetDataBtn = document.getElementById("resetDataBtn");
const clearDataBtn = document.getElementById("clearDataBtn");
const projectSelect = document.getElementById("projectSelect");
const categorySelect = document.getElementById("categorySelect");
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const newProjectInput = document.getElementById("newProjectInput");
const addProjectBtn = document.getElementById("addProjectBtn");
const projectList = document.getElementById("projectList");
const newCategoryInput = document.getElementById("newCategoryInput");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const categoryList = document.getElementById("categoryList");

// Export Modal Elements
const exportModal = document.getElementById("exportModal");
let currentExportRange = 'today';
let currentProjectRange = 'all';

// Holidays (Settings)
let holidays = safeLoadJson("holidays", []);
const holidayDateInput = document.getElementById("holidayDateInput");
const holidayNameInput = document.getElementById("holidayNameInput");
const addHolidayBtn = document.getElementById("addHolidayBtn");
const holidayList = document.getElementById("holidayList");

// Report personalization
const REPORT_USER_KEY = "reportUserName";
const reportUserNameInput = document.getElementById("reportUserNameInput");
const REPORT_WORKSTATION_KEY = "reportWorkstation";

// Reminder Elements
const reminderModal = document.getElementById("reminderModal");
const reminderTitle = document.getElementById("reminderTitle");
const reminderMessage = document.getElementById("reminderMessage");
const reminderActions = document.getElementById("reminderActions");
const dismissReminderBtn = document.getElementById("dismissReminderBtn");

// Reminder Settings Elements
const breakReminderEnabled = document.getElementById("breakReminderEnabled");
const breakReminderInterval = document.getElementById("breakReminderInterval");
const idleDetectionEnabled = document.getElementById("idleDetectionEnabled");
const idleThreshold = document.getElementById("idleThreshold");
const endOfDayEnabled = document.getElementById("endOfDayEnabled");
const endOfDayTime = document.getElementById("endOfDayTime");
const pomodoroEnabled = document.getElementById("pomodoroEnabled");
const pomodoroWorkDuration = document.getElementById("pomodoroWorkDuration");
const pomodoroShortBreak = document.getElementById("pomodoroShortBreak");
const pomodoroLongBreak = document.getElementById("pomodoroLongBreak");
const soundEnabled = document.getElementById("soundEnabled");
const alertSoundSelect = document.getElementById("alertSoundSelect");
const soundVolume = document.getElementById("soundVolume");
const volumeDisplay = document.getElementById("volumeDisplay");
const testSoundBtn = document.getElementById("testSoundBtn");
const browserNotificationsEnabled = document.getElementById("browserNotificationsEnabled");
const requestNotificationPermission = document.getElementById("requestNotificationPermission");

// Reminder State
let reminderSettings = safeLoadJson("reminderSettings", {
  breakReminder: { enabled: true, interval: 60 },
  idleDetection: { enabled: true, threshold: 10 },
  endOfDay: { enabled: false, time: "18:00" },
  pomodoro: { enabled: false, workDuration: 25, shortBreak: 5, longBreak: 15, sessionsCompleted: 0 },
  sound: { enabled: true, type: "bell", volume: 70 },
  browserNotifications: { enabled: false }
});

let lastActivityTime = Date.now();
let lastBreakReminderTime = Date.now();
let pomodoroStartTime = null;
let pomodoroState = null; // 'work', 'shortBreak', 'longBreak', null
let reminderTimers = {
  breakCheck: null,
  idleCheck: null,
  endOfDayCheck: null,
  pomodoroCheck: null
};
let audioContext = null;
let currentSnoozedUntil = null;

const REPORT_TIMEZONE_KEY = "reportTimezone";
const reportWorkstationInput = document.getElementById("reportWorkstationInput");
const reportTimezoneInput = document.getElementById("reportTimezoneInput");

// Default branding configuration
const DEFAULT_BRAND = {
  name: "S&S Tech Services",
  website: "https://snstechservices.com.au/",
  email: "info@snstechservices.com.au",
  address: "301 Castlereagh St Haymarket NSW 2000 Australia",
  phone: "0435 543 255, 0452 338 954"
};

// Load branding from localStorage or use default
function getReportBrand() {
  const saved = safeLoadJson("reportBrand", null);
  return saved || { ...DEFAULT_BRAND };
}

// Branding variable (will be loaded dynamically)
let REPORT_BRAND = getReportBrand();

const DEFAULT_WORKSTATION = "Office Kathmandu";
const DEFAULT_TIMEZONE = "GMT+05:45 (Asia/Kathmandu)";

// Task Modal Elements
const taskModal = document.getElementById("taskModal");
const taskModalTitle = document.getElementById("taskModalTitle");
const closeTaskModalBtn = document.getElementById("closeTaskModalBtn");
const modalTaskDescription = document.getElementById("modalTaskDescription");
const modalProjectSelect = document.getElementById("modalProjectSelect");
const modalCategorySelect = document.getElementById("modalCategorySelect");
const cancelTaskBtn = document.getElementById("cancelTaskBtn");
const confirmTaskBtn = document.getElementById("confirmTaskBtn");

// Break Modal Elements
const breakModal = document.getElementById("breakModal");
const closeBreakModalBtn = document.getElementById("closeBreakModalBtn");
const modalBreakDescription = document.getElementById("modalBreakDescription");
const cancelBreakBtn = document.getElementById("cancelBreakBtn");
const confirmBreakBtn = document.getElementById("confirmBreakBtn");

// Confirmation Modal Elements
const confirmModal = document.getElementById("confirmModal");
const confirmModalTitle = document.getElementById("confirmModalTitle");
const confirmModalMessage = document.getElementById("confirmModalMessage");
const confirmModalCancelBtn = document.getElementById("confirmModalCancelBtn");
const confirmModalOkBtn = document.getElementById("confirmModalOkBtn");

// Alert Modal Elements
const alertModal = document.getElementById("alertModal");
const alertModalTitle = document.getElementById("alertModalTitle");
const alertModalMessage = document.getElementById("alertModalMessage");
const alertModalOkBtn = document.getElementById("alertModalOkBtn");

// Next Action Modal Elements
const nextActionModal = document.getElementById("nextActionModal");
const nextActionTaskBtn = document.getElementById("nextActionTaskBtn");
const nextActionBreakBtn = document.getElementById("nextActionBreakBtn");
const nextActionEndBtn = document.getElementById("nextActionEndBtn");

// Modal state
let modalResolve = null;
let modalReject = null;
let isFirstTaskOfDay = false;
let confirmResolve = null;
let alertResolve = null;

// Edit Activity Modal
let editActivityData = null;
const editActivityModal = document.getElementById("editActivityModal");
const closeEditActivityBtn = document.getElementById("closeEditActivityBtn");
const cancelEditActivityBtn = document.getElementById("cancelEditActivityBtn");
const saveEditActivityBtn = document.getElementById("saveEditActivityBtn");

// Custom Alert Modal
function showAlert(message, title = "Notice") {
  return new Promise((resolve) => {
    alertModalTitle.textContent = title;
    alertModalMessage.textContent = message;
    alertModal.classList.remove("hidden");
    alertResolve = resolve;
  });
}

// Custom Confirm Modal
function showConfirm(message, title = "Confirm Action") {
  return new Promise((resolve) => {
    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    confirmModal.classList.remove("hidden");
    confirmResolve = resolve;
  });
}

// Close Alert Modal
function closeAlertModal() {
  alertModal.classList.add("hidden");
  if (alertResolve) {
    alertResolve();
    alertResolve = null;
  }
}

// Close Confirm Modal
function closeConfirmModal(result) {
  confirmModal.classList.add("hidden");
  if (confirmResolve) {
    confirmResolve(result);
    confirmResolve = null;
  }
}

// Show Next Action Modal
function showNextActionModal() {
  // Show/hide Resume button based on paused tasks
  const resumeBtn = document.getElementById("nextActionResumeBtn");
  if (pausedTasks.length > 0) {
    resumeBtn.classList.remove("hidden");
  } else {
    resumeBtn.classList.add("hidden");
  }
  nextActionModal.classList.remove("hidden");
}

// Close Next Action Modal
function closeNextActionModal() {
  nextActionModal.classList.add("hidden");
}

// Show Resume Task Modal - lets user pick from paused tasks
function showResumeTaskModal() {
  const resumeModal = document.getElementById("resumeTaskModal");
  const pausedTasksList = document.getElementById("pausedTasksList");
  
  // Reload paused tasks from localStorage in case they were updated
  pausedTasks = safeLoadJson(PAUSED_TASKS_KEY, []);
  
  console.log("Paused tasks:", pausedTasks); // Debug log
  
  if (pausedTasks.length === 0) {
    showAlert("No paused tasks to resume.");
    return;
  }
  
  // Build the paused tasks list UI
  pausedTasksList.innerHTML = "";
  
  pausedTasks.forEach((task, index) => {
    const totalTime = formatDuration(task.totalTime || 0);
    const taskItem = document.createElement("div");
    taskItem.className = "paused-task-item";
    taskItem.innerHTML = `
      <div class="paused-task-icon">▶️</div>
      <div class="paused-task-info">
        <div class="paused-task-name">${escapeHtml(task.description)}</div>
        <div class="paused-task-meta">
          <span class="paused-task-project">${escapeHtml(task.project)}</span>
          <span class="paused-task-time">${totalTime} logged</span>
        </div>
      </div>
      <button class="paused-task-resume-btn">Resume</button>
    `;
    
    // Click on item or button to resume
    taskItem.addEventListener("click", () => {
      closeResumeTaskModal(true); // Task was selected
      resumePausedTask(task);
    });
    
    pausedTasksList.appendChild(taskItem);
  });
  
  resumeModal.classList.remove("hidden");
}

// Close Resume Task Modal
function closeResumeTaskModal(taskSelected = false) {
  const resumeModal = document.getElementById("resumeTaskModal");
  resumeModal.classList.add("hidden");
  
  // If closed without selecting a task, show next action modal
  if (!taskSelected && currentSession && !currentActivity) {
    setTimeout(() => showNextActionModal(), 200);
  }
}

// Resume a paused task
function resumePausedTask(pausedTask) {
  if (currentActivity) {
    stopCurrentActivity();
    return;
  }
  
  currentActivity = {
    type: "task",
    description: pausedTask.description,
    project: pausedTask.project,
    category: pausedTask.category,
    startTime: getCurrentTime(),
    startEpoch: Date.now(),
    endTime: null,
    endEpoch: null,
    duration: 0,
    isResumed: true,
    previousTime: pausedTask.totalTime || 0
  };
  
  removePausedTask(pausedTask.description);
  
  // Update UI to show active task
  activityType.textContent = "🎯 Working on Task (Resumed)";
  activityDescription.textContent = pausedTask.description;
  currentActivityDiv.classList.remove("hidden");
  showTaskControls();
  
  stopActivityBtn.disabled = false;
  sessionStatus.textContent = "Working on Task";
  
  // Update reminder tracking
  updateActivityTime();
  if (reminderSettings.pomodoro.enabled && !pomodoroStartTime) {
    startPomodoroSession();
  }
  
  startActivityTimer();
  updateSessionStats();
  persistActiveState();
  
  showAlert(`Resumed: ${pausedTask.description}`);
}

// ========================================
// EDIT/DELETE ACTIVITY FUNCTIONS
// ========================================

// Populate edit modal project dropdown
function populateEditProjectSelect(selectedProject) {
  const select = document.getElementById("editActivityProject");
  select.innerHTML = '';

  customProjects.forEach(project => {
    const option = document.createElement("option");
    option.value = project;
    option.textContent = project;
    if (project === selectedProject) option.selected = true;
    select.appendChild(option);
  });
}

// Populate edit modal category dropdown
function populateEditCategorySelect(selectedCategory) {
  const select = document.getElementById("editActivityCategory");
  select.innerHTML = '';

  customCategories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    if (category === selectedCategory) option.selected = true;
    select.appendChild(option);
  });
}

// Edit Activity
function editActivity(sessionDate, activityIndex) {
  // Find the session
  const session = workSessions.find(s => s.date === sessionDate);
  if (!session || !session.activities[activityIndex]) {
    showAlert("Activity not found", "Error");
    return;
  }

  const activity = session.activities[activityIndex];
  editActivityData = { sessionDate, activityIndex, originalActivity: {...activity}, session };

  // Populate modal
  document.getElementById("editActivityType").value = activity.type;
  document.getElementById("editActivityDescription").value = activity.description;
  document.getElementById("editActivityStartTime").value = activity.startTime;
  document.getElementById("editActivityEndTime").value = activity.endTime || "";

  // Populate project/category dropdowns
  populateEditProjectSelect(activity.project);
  populateEditCategorySelect(activity.category);

  // Hide gap warning initially
  document.getElementById("gapWarning").classList.add("hidden");
  
  // Add event listeners for time changes to detect gaps
  const startTimeInput = document.getElementById("editActivityStartTime");
  const endTimeInput = document.getElementById("editActivityEndTime");
  
  startTimeInput.onchange = checkForGapsOnEdit;
  endTimeInput.onchange = checkForGapsOnEdit;

  // Show modal
  editActivityModal.classList.remove("hidden");
}

// Check for gaps when editing activity times
function checkForGapsOnEdit() {
  if (!editActivityData) return;
  
  const { sessionDate, activityIndex, session } = editActivityData;
  const newStartTime = document.getElementById("editActivityStartTime").value;
  const newEndTime = document.getElementById("editActivityEndTime").value;
  
  if (!newStartTime || !newEndTime) return;
  
  // Create a temporary activities array with the modified activity
  const tempActivities = session.activities.map((act, idx) => {
    if (idx === activityIndex) {
      return { ...act, startTime: newStartTime, endTime: newEndTime };
    }
    return act;
  });
  
  // Detect gaps in the temporary array
  const gaps = detectGaps(tempActivities);
  const gapWarning = document.getElementById("gapWarning");
  const gapWarningMessage = document.getElementById("gapWarningMessage");
  
  if (gaps.length > 0) {
    const totalGapMinutes = gaps.reduce((sum, gap) => sum + gap.durationMinutes, 0);
    gapWarningMessage.textContent = `This change will create ${gaps.length} gap(s) totaling ${formatDuration(totalGapMinutes * 60)} of untracked time.`;
    gapWarning.classList.remove("hidden");
  } else {
    gapWarning.classList.add("hidden");
  }
}

// Save Edited Activity
function saveEditedActivity() {
  if (!editActivityData) return;

  const { sessionDate, activityIndex } = editActivityData;
  const session = workSessions.find(s => s.date === sessionDate);

  if (!session) {
    showAlert("Session not found", "Error");
    return;
  }

  // Get updated values
  const activity = session.activities[activityIndex];
  const newType = document.getElementById("editActivityType").value;
  const newDescription = document.getElementById("editActivityDescription").value.trim();
  const newStartTime = document.getElementById("editActivityStartTime").value;
  const newEndTime = document.getElementById("editActivityEndTime").value;
  const newProject = document.getElementById("editActivityProject").value;
  const newCategory = document.getElementById("editActivityCategory").value;

  // Validate description
  if (!newDescription) {
    showAlert("Please enter a description", "Missing Input");
    return;
  }

  // Validate times
  if (!newStartTime || !newEndTime) {
    showAlert("Please enter both start and end times", "Missing Input");
    return;
  }

  // Validate end time is after start time
  if (newEndTime <= newStartTime) {
    showAlert("End time must be after start time", "Invalid Time");
    return;
  }

  // Check for overlapping times with other activities
  const hasOverlap = session.activities.some((other, idx) => {
    if (idx === activityIndex) return false; // Skip current activity
    
    // Check if times overlap
    const newStart = timeToMinutes(newStartTime);
    const newEnd = timeToMinutes(newEndTime);
    const otherStart = timeToMinutes(other.startTime);
    const otherEnd = timeToMinutes(other.endTime);
    
    // Overlap exists if one starts before the other ends and ends after the other starts
    return (newStart < otherEnd && newEnd > otherStart);
  });

  if (hasOverlap) {
    showAlert("This time range overlaps with another activity. Please adjust the times.", "Time Conflict");
    return;
  }

  // Update activity
  activity.type = newType;
  activity.description = newDescription;
  activity.startTime = newStartTime;
  activity.endTime = newEndTime;
  activity.project = newProject;
  activity.category = newCategory;

  // Recalculate duration
  activity.duration = calculateDuration(activity.startTime, activity.endTime);

  // Re-sort activities by start time to maintain chronological order
  session.activities.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // Save and refresh
  saveData();
  renderWeekView();
  closeEditActivityModal();

  showAlert("Activity updated successfully!", "Success");
}

// Helper: Convert time string (HH:MM:SS or HH:MM) to minutes
function timeToMinutes(timeStr) {
  const parts = timeStr.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// Helper: Convert minutes to time string (HH:MM:SS)
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

// Detect gaps between activities in a session
function detectGaps(activities) {
  const gaps = [];
  if (activities.length < 2) return gaps;
  
  // Sort by start time
  const sorted = [...activities].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = timeToMinutes(sorted[i].endTime);
    const nextStart = timeToMinutes(sorted[i + 1].startTime);
    
    if (nextStart > currentEnd) {
      const gapMinutes = nextStart - currentEnd;
      gaps.push({
        afterIndex: i,
        startTime: sorted[i].endTime,
        endTime: sorted[i + 1].startTime,
        duration: gapMinutes * 60, // in seconds
        durationMinutes: gapMinutes
      });
    }
  }
  
  return gaps;
}

// Fill a specific gap with a break activity
function fillGapWithBreak(sessionDate, sessionStart, gapStartTime, gapEndTime) {
  const session = workSessions.find(s => s.date === sessionDate && s.startTime === sessionStart);
  if (!session) {
    console.error("Session not found for date:", sessionDate, "start:", sessionStart);
    showAlert("Session not found", "Error");
    return;
  }
  
  const breakActivity = {
    type: "break",
    description: "Untracked time (auto-filled)",
    startTime: gapStartTime,
    endTime: gapEndTime,
    project: "General",
    category: "Break",
    status: "completed",
    duration: calculateDuration(gapStartTime, gapEndTime),
    autoFilled: true
  };
  
  session.activities.push(breakActivity);
  session.activities.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  
  // Save to localStorage
  localStorage.setItem("workSessions", JSON.stringify(workSessions));
  
  renderWeekView();
  showAlert("Gap filled with break activity", "Success");
}

// Fill all gaps in a session
function fillAllGaps(sessionDate, sessionStart) {
  const session = workSessions.find(s => s.date === sessionDate && s.startTime === sessionStart);
  if (!session) {
    console.error("Session not found for date:", sessionDate, "start:", sessionStart);
    showAlert("Session not found", "Error");
    return;
  }
  
  const gaps = detectGaps(session.activities);
  if (gaps.length === 0) {
    showAlert("No gaps to fill", "Info");
    return;
  }
  
  gaps.forEach(gap => {
    const breakActivity = {
      type: "break",
      description: "Untracked time (auto-filled)",
      startTime: gap.startTime,
      endTime: gap.endTime,
      project: "General",
      category: "Break",
      status: "completed",
      duration: gap.duration,
      autoFilled: true
    };
    session.activities.push(breakActivity);
  });
  
  session.activities.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  
  // Save to localStorage
  localStorage.setItem("workSessions", JSON.stringify(workSessions));
  
  renderWeekView();
  showAlert(`Filled ${gaps.length} gap(s) with break activities`, "Success");
}

// Close Edit Activity Modal
function closeEditActivityModal() {
  editActivityModal.classList.add("hidden");
  editActivityData = null;
  // Hide gap warning
  document.getElementById("gapWarning").classList.add("hidden");
}

// Delete Activity
async function deleteActivity(sessionDate, activityIndex) {
  const session = workSessions.find(s => s.date === sessionDate);
  if (!session || !session.activities[activityIndex]) {
    showAlert("Activity not found", "Error");
    return;
  }

  const activity = session.activities[activityIndex];
  const confirmed = await showConfirm(
    `Delete this activity?\n\n${activity.type}: ${activity.description}\nTime: ${activity.startTime} - ${activity.endTime}`,
    "Delete Activity"
  );

  if (confirmed) {
    session.activities.splice(activityIndex, 1);

    // If session has no activities, optionally remove session
    if (session.activities.length === 0) {
      const removeSession = await showConfirm(
        "This was the only activity in the session. Remove the entire session?",
        "Remove Session"
      );
      if (removeSession) {
        const sessionIndex = workSessions.findIndex(s => s.date === sessionDate);
        workSessions.splice(sessionIndex, 1);
      }
    }

    saveData();
    renderWeekView();
    showAlert("Activity deleted successfully!", "Success");
  }
}

// ========================================
// END EDIT/DELETE FUNCTIONS
// ========================================

// ========================================
// ANALYTICS DASHBOARD FUNCTIONS
// ========================================

// Chart instances (global)
let projectChart = null;
let categoryChart = null;
let dailyTrendChart = null;
let workBreakChart = null;
let weeklyProductivityChart = null;
let peakHoursChart = null;

// Analytics date range state
let analyticsDateRange = 'current-week';

function getAnalyticsDateRange() {
  const today = new Date();
  let start, end;
  
  switch (analyticsDateRange) {
    case 'current-week':
      const { start: weekStart, end: weekEnd } = getWeekRange(currentWeekOffset);
      start = weekStart;
      end = weekEnd;
      break;
    case 'last-7-days':
      end = today;
      start = new Date(today);
      start.setDate(start.getDate() - 6);
      break;
    case 'last-30-days':
      end = today;
      start = new Date(today);
      start.setDate(start.getDate() - 29);
      break;
    case 'last-90-days':
      end = today;
      start = new Date(today);
      start.setDate(start.getDate() - 89);
      break;
    case 'current-month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'all-time':
      // Find earliest and latest session dates
      if (workSessions.length === 0) {
        start = today;
        end = today;
      } else {
        const dates = workSessions.map(s => s.date).sort();
        start = new Date(dates[0] + 'T00:00:00');
        end = new Date(dates[dates.length - 1] + 'T00:00:00');
      }
      break;
    default:
      const range = getWeekRange(currentWeekOffset);
      start = range.start;
      end = range.end;
  }
  
  return {
    start,
    end,
    startStr: formatDate(start),
    endStr: formatDate(end)
  };
}

function generateAnalytics() {
  const { start, end, startStr, endStr } = getAnalyticsDateRange();

  const rangeSessions = workSessions.filter(session =>
    session.date >= startStr && session.date <= endStr
  );

  // Aggregate data
  const projectTimes = {};
  const categoryTimes = {};
  const dailyHours = {};
  const dailyBreakHours = {};
  let totalWorkSeconds = 0;
  let totalBreakSeconds = 0;
  let totalTasks = 0;
  let completedTasks = 0;
  let pausedTasks = 0;

  rangeSessions.forEach(session => {
    const dayKey = session.date;
    if (!dailyHours[dayKey]) dailyHours[dayKey] = 0;
    if (!dailyBreakHours[dayKey]) dailyBreakHours[dayKey] = 0;

    session.activities.forEach(activity => {
      if (activity.type === "task") {
        projectTimes[activity.project] = (projectTimes[activity.project] || 0) + (activity.duration || 0);
        categoryTimes[activity.category] = (categoryTimes[activity.category] || 0) + (activity.duration || 0);
        totalWorkSeconds += activity.duration || 0;
        totalTasks++;
        dailyHours[dayKey] += activity.duration || 0;
        
        // Track completion status
        if (activity.status === 'completed') completedTasks++;
        else if (activity.status === 'paused') pausedTasks++;
        else completedTasks++; // Default to completed for old data
      } else {
        totalBreakSeconds += activity.duration || 0;
        dailyBreakHours[dayKey] += activity.duration || 0;
      }
    });
  });

  // Update charts
  updateProjectChart(projectTimes);
  updateCategoryChart(categoryTimes);
  updateDailyTrendChart(dailyHours, dailyBreakHours, startStr, endStr);
  updateWorkBreakChart(totalWorkSeconds, totalBreakSeconds);
  updateWeeklyProductivityChart(rangeSessions, startStr, endStr);
  updatePeakHoursChart(rangeSessions);

  // Update quick stats
  updateQuickStats(rangeSessions, dailyHours, projectTimes, totalTasks, completedTasks, pausedTasks, startStr, endStr);
  
  // Update goals
  updateGoalsProgress(rangeSessions);
}

function updateProjectChart(projectTimes) {
  const ctx = document.getElementById("projectPieChart");
  if (!ctx) return;

  if (projectChart) projectChart.destroy();

  const hasData = Object.keys(projectTimes).length > 0;
  if (!hasData) {
    projectChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["No Data"],
        datasets: [{
          data: [1],
          backgroundColor: ["#e9ecef"]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
    return;
  }

  // Sort by time and take top 8
  const sortedProjects = Object.entries(projectTimes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const colors = [
    "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", 
    "#ef4444", "#ec4899", "#6366f1", "#84cc16"
  ];

  projectChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: sortedProjects.map(p => p[0]),
      datasets: [{
        data: sortedProjects.map(p => Math.round(p[1] / 60)), // minutes
        backgroundColor: colors.slice(0, sortedProjects.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      cutout: '60%',
      plugins: {
        legend: { 
          position: "bottom",
          labels: {
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const minutes = context.parsed;
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((minutes / total) * 100);
              return `${context.label}: ${hours}h ${mins}m (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function updateCategoryChart(categoryTimes) {
  const ctx = document.getElementById("categoryPieChart");
  if (!ctx) return;

  if (categoryChart) categoryChart.destroy();

  const hasData = Object.keys(categoryTimes).length > 0;
  if (!hasData) {
    categoryChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["No Data"],
        datasets: [{
          data: [1],
          backgroundColor: ["#e9ecef"]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
    return;
  }

  // Sort by time
  const sortedCategories = Object.entries(categoryTimes)
    .sort((a, b) => b[1] - a[1]);

  const colors = [
    "#10b981", "#f59e0b", "#ef4444", "#06b6d4", 
    "#8b5cf6", "#ec4899", "#6366f1", "#84cc16"
  ];

  categoryChart = new Chart(ctx, {
    type: "polarArea",
    data: {
      labels: sortedCategories.map(c => c[0]),
      datasets: [{
        data: sortedCategories.map(c => Math.round(c[1] / 60)), // minutes
        backgroundColor: colors.slice(0, sortedCategories.length).map(c => c + '99'),
        borderColor: colors.slice(0, sortedCategories.length),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { 
          position: "bottom",
          labels: {
            padding: 12,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const minutes = context.parsed.r;
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              return `${context.label}: ${hours}h ${mins}m`;
            }
          }
        }
      },
      scales: {
        r: {
          display: false
        }
      }
    }
  });
}

function updateDailyTrendChart(dailyHours, dailyBreakHours, startStr, endStr) {
  const ctx = document.getElementById("dailyTrendChart");
  if (!ctx) return;

  if (dailyTrendChart) dailyTrendChart.destroy();

  // Generate all dates in range
  const dates = [];
  const workValues = [];
  const breakValues = [];
  const currentDate = new Date(startStr + 'T00:00:00');
  const endDate = new Date(endStr + 'T00:00:00');

  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);
    dates.push(new Date(currentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    workValues.push(Math.round((dailyHours[dateStr] || 0) / 60)); // minutes
    breakValues.push(Math.round((dailyBreakHours[dateStr] || 0) / 60)); // minutes
    currentDate.setDate(currentDate.getDate() + 1);
  }

  dailyTrendChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: dates,
      datasets: [
        {
          label: "Work",
          data: workValues,
          backgroundColor: "rgba(139, 92, 246, 0.8)",
          borderColor: "#8b5cf6",
          borderWidth: 2,
          borderRadius: 6
        },
        {
          label: "Break",
          data: breakValues,
          backgroundColor: "rgba(245, 158, 11, 0.8)",
          borderColor: "#f59e0b",
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { 
          position: "top",
          labels: { usePointStyle: true }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const minutes = context.parsed.y;
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              return `${context.dataset.label}: ${hours}h ${mins}m`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: { display: true, text: "Minutes" },
          ticks: {
            callback: (value) => {
              const hours = Math.floor(value / 60);
              const mins = value % 60;
              return hours > 0 ? `${hours}h` : `${mins}m`;
            }
          }
        }
      }
    }
  });
}

function updateWorkBreakChart(workSeconds, breakSeconds) {
  const ctx = document.getElementById("workBreakChart");
  if (!ctx) return;

  if (workBreakChart) workBreakChart.destroy();

  const workMinutes = Math.round(workSeconds / 60);
  const breakMinutes = Math.round(breakSeconds / 60);
  const totalMinutes = workMinutes + breakMinutes;

  workBreakChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Work Time", "Break Time"],
      datasets: [{
        data: [workMinutes, breakMinutes],
        backgroundColor: ["rgba(16, 185, 129, 0.9)", "rgba(245, 158, 11, 0.9)"],
        borderColor: ["#10b981", "#f59e0b"],
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: { 
          position: "bottom",
          labels: { usePointStyle: true, padding: 15 }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const minutes = context.parsed;
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              const percentage = totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0;
              return `${context.label}: ${hours}h ${mins}m (${percentage}%)`;
            }
          }
        }
      }
    }
  });
  
  // Add center text
  const centerText = document.getElementById("workBreakCenter");
  if (centerText) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    centerText.textContent = `${hours}h ${mins}m`;
  }
}

function updateWeeklyProductivityChart(rangeSessions, startStr, endStr) {
  const ctx = document.getElementById("weeklyProductivityChart");
  if (!ctx) return;

  if (weeklyProductivityChart) weeklyProductivityChart.destroy();

  // Build data for each day in range
  const labels = [];
  const taskCounts = [];
  const workHours = [];
  
  const currentDate = new Date(startStr + 'T00:00:00');
  const endDate = new Date(endStr + 'T00:00:00');

  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);
    const daySession = rangeSessions.find(s => s.date === dateStr);
    const tasks = daySession ? daySession.activities.filter(a => a.type === 'task') : [];
    const taskCount = tasks.length;
    const totalSeconds = tasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    
    labels.push(currentDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
    taskCounts.push(taskCount);
    workHours.push(Math.round(totalSeconds / 60)); // minutes
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  weeklyProductivityChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Tasks",
          data: taskCounts,
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#8b5cf6",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          yAxisID: 'y'
        },
        {
          label: "Work (min)",
          data: workHours,
          borderColor: "#06b6d4",
          backgroundColor: "rgba(6, 182, 212, 0.1)",
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { 
          position: "top",
          labels: { usePointStyle: true }
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          title: { display: true, text: "Tasks" },
          grid: { display: true }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          title: { display: true, text: "Minutes" },
          grid: { display: false }
        }
      }
    }
  });
}

function updatePeakHoursChart(rangeSessions) {
  const ctx = document.getElementById("peakHoursChart");
  if (!ctx) return;

  if (peakHoursChart) peakHoursChart.destroy();

  // Analyze activity by hour of day
  const hourlyActivity = new Array(24).fill(0);
  const hourlyTaskCount = new Array(24).fill(0);
  
  rangeSessions.forEach(session => {
    session.activities.forEach(activity => {
      if (activity.type === 'task' && activity.startTime) {
        try {
          const hour = parseInt(activity.startTime.split(':')[0]);
          if (!isNaN(hour) && hour >= 0 && hour < 24) {
            hourlyActivity[hour] += (activity.duration || 0) / 60; // convert to minutes
            hourlyTaskCount[hour]++;
          }
        } catch (e) {}
      }
    });
  });

  // Create labels for hours (12-hour format)
  const labels = Array.from({length: 24}, (_, i) => {
    const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
    const period = i < 12 ? 'AM' : 'PM';
    return `${hour}${period}`;
  });

  // Show hours 6 AM to 11 PM
  const startHour = 6;
  const endHour = 23;
  const relevantLabels = labels.slice(startHour, endHour + 1);
  const relevantData = hourlyActivity.slice(startHour, endHour + 1).map(m => Math.round(m));

  // Calculate gradient colors based on activity
  const maxActivity = Math.max(...relevantData, 1);
  const backgroundColors = relevantData.map(val => {
    const intensity = val / maxActivity;
    return `rgba(139, 92, 246, ${0.3 + intensity * 0.7})`;
  });

  peakHoursChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: relevantLabels,
      datasets: [{
        label: "Active Minutes",
        data: relevantData,
        backgroundColor: backgroundColors,
        borderColor: "#8b5cf6",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const minutes = context.parsed.y;
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              return hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Minutes" },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          title: { display: true, text: "Time of Day" },
          grid: { display: false }
        }
      }
    }
  });
}

function updateQuickStats(rangeSessions, dailyHours, projectTimes, totalTasks, completedTasks, pausedTasks, startStr, endStr) {
  const daysWithWork = Object.keys(dailyHours).filter(d => dailyHours[d] > 0).length;
  const totalSeconds = Object.values(dailyHours).reduce((a, b) => a + b, 0);
  const avgDaily = daysWithWork > 0 ? totalSeconds / daysWithWork : 0;

  // Average daily hours
  const avgElem = document.getElementById("avgDailyHours");
  if (avgElem) avgElem.textContent = formatDuration(Math.round(avgDaily));

  // Most productive day
  const maxDay = Object.keys(dailyHours).reduce((max, day) =>
    dailyHours[day] > (dailyHours[max] || 0) ? day : max, ""
  );
  const prodDayElem = document.getElementById("mostProductiveDay");
  if (prodDayElem) {
    if (maxDay && dailyHours[maxDay] > 0) {
      const dayName = new Date(maxDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
      prodDayElem.textContent = dayName;
    } else {
      prodDayElem.textContent = "-";
    }
  }

  // Top project
  const topProj = Object.keys(projectTimes).reduce((max, proj) =>
    projectTimes[proj] > (projectTimes[max] || 0) ? proj : max, ""
  );
  const topProjElem = document.getElementById("topProject");
  if (topProjElem) topProjElem.textContent = topProj || "-";

  // Tasks per day
  const tasksPerDay = daysWithWork > 0 ? Math.round(totalTasks / daysWithWork * 10) / 10 : 0;
  const tasksPerDayElem = document.getElementById("tasksPerDay");
  if (tasksPerDayElem) tasksPerDayElem.textContent = tasksPerDay;

  // Completion rate
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const completionElem = document.getElementById("completionRate");
  if (completionElem) completionElem.textContent = completionRate + '%';

}

function updateGoalsProgress(rangeSessions) {
  const goals = safeLoadJson("workGoals", { daily: 8, weekly: 40 });
  const today = formatDate(new Date());
  
  // Calculate today's work
  const todaySession = rangeSessions.find(s => s.date === today);
  let todayMinutes = 0;
  if (todaySession) {
    todaySession.activities.forEach(a => {
      if (a.type === 'task') todayMinutes += Math.round((a.duration || 0) / 60);
    });
  }
  
  // Calculate week's work
  let weekMinutes = 0;
  rangeSessions.forEach(session => {
    session.activities.forEach(a => {
      if (a.type === 'task') weekMinutes += Math.round((a.duration || 0) / 60);
    });
  });
  
  // Update daily goal
  const dailyGoalHours = goals.daily || 8;
  const dailyGoalMinutes = dailyGoalHours * 60;
  const dailyProgress = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));
  
  const dailyProgressElem = document.getElementById("dailyGoalProgress");
  const dailyCurrentElem = document.getElementById("dailyGoalCurrent");
  const dailyTargetElem = document.getElementById("dailyGoalTarget");
  
  if (dailyProgressElem) dailyProgressElem.style.width = dailyProgress + '%';
  if (dailyCurrentElem) {
    const hours = Math.floor(todayMinutes / 60);
    const mins = todayMinutes % 60;
    dailyCurrentElem.textContent = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  if (dailyTargetElem) dailyTargetElem.textContent = `${dailyGoalHours}h`;
  
  // Update weekly goal
  const weeklyGoalHours = goals.weekly || 40;
  const weeklyGoalMinutes = weeklyGoalHours * 60;
  const weeklyProgress = Math.min(100, Math.round((weekMinutes / weeklyGoalMinutes) * 100));
  
  const weeklyProgressElem = document.getElementById("weeklyGoalProgress");
  const weeklyCurrentElem = document.getElementById("weeklyGoalCurrent");
  const weeklyTargetElem = document.getElementById("weeklyGoalTarget");
  
  if (weeklyProgressElem) weeklyProgressElem.style.width = weeklyProgress + '%';
  if (weeklyCurrentElem) {
    const hours = Math.floor(weekMinutes / 60);
    const mins = weekMinutes % 60;
    weeklyCurrentElem.textContent = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  if (weeklyTargetElem) weeklyTargetElem.textContent = `${weeklyGoalHours}h`;
}

// Goals Modal Functions
function openGoalsModal() {
  const modal = document.getElementById("goalsModal");
  const dailyInput = document.getElementById("dailyGoalInput");
  const weeklyInput = document.getElementById("weeklyGoalInput");
  
  // Load current goals
  const goals = safeLoadJson("workGoals", { daily: 8, weekly: 40 });
  if (dailyInput) dailyInput.value = goals.daily || 8;
  if (weeklyInput) weeklyInput.value = goals.weekly || 40;
  
  if (modal) modal.classList.remove("hidden");
}

function closeGoalsModal() {
  const modal = document.getElementById("goalsModal");
  if (modal) modal.classList.add("hidden");
}

function saveGoals() {
  const dailyInput = document.getElementById("dailyGoalInput");
  const weeklyInput = document.getElementById("weeklyGoalInput");
  
  const daily = parseFloat(dailyInput?.value) || 8;
  const weekly = parseFloat(weeklyInput?.value) || 40;
  
  // Validate
  if (daily < 0.5 || daily > 24) {
    alert("Daily goal must be between 0.5 and 24 hours");
    return;
  }
  if (weekly < 1 || weekly > 168) {
    alert("Weekly goal must be between 1 and 168 hours");
    return;
  }
  
  // Save to localStorage
  localStorage.setItem("workGoals", JSON.stringify({ daily, weekly }));
  triggerFirebaseSync();
  
  // Close modal and refresh analytics
  closeGoalsModal();
  updateAnalytics();
  
  // Show confirmation
  showNotification("Goals saved successfully!", "success");
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button class="notification-close">&times;</button>
  `;
  
  // Style the notification
  Object.assign(notification.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "12px 20px",
    borderRadius: "8px",
    backgroundColor: type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    zIndex: "10000",
    animation: "slideIn 0.3s ease"
  });
  
  document.body.appendChild(notification);
  
  // Add close button functionality
  notification.querySelector(".notification-close").addEventListener("click", () => {
    notification.remove();
  });
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "fadeOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Toggle analytics visibility
function toggleAnalytics() {
  const content = document.getElementById("analyticsContent");
  const btn = document.getElementById("toggleAnalyticsBtn");

  if (content.style.display === "none") {
    content.style.display = "block";
    btn.textContent = "Hide";
    localStorage.setItem("analyticsVisible", "true");
  } else {
    content.style.display = "none";
    btn.textContent = "Show";
    localStorage.setItem("analyticsVisible", "false");
  }
}

// ========================================
// END ANALYTICS FUNCTIONS
// ========================================

// ========================================
// SEARCH AND FILTER FUNCTIONS
// ========================================

// Search and filter state
let activeFilters = {
  searchText: "",
  startDate: null,
  endDate: null,
  projects: [],
  categories: [],
  type: ""
};

function applyFilters() {
  // Get filter values
  activeFilters.searchText = document.getElementById("searchInput").value.toLowerCase().trim();
  activeFilters.startDate = document.getElementById("filterStartDate").value;
  activeFilters.endDate = document.getElementById("filterEndDate").value;

  const projectSelect = document.getElementById("filterProject");
  const selectedProject = projectSelect.value;
  activeFilters.projects = selectedProject ? [selectedProject] : [];

  const categorySelect = document.getElementById("filterCategory");
  const selectedCategory = categorySelect.value;
  activeFilters.categories = selectedCategory ? [selectedCategory] : [];

  activeFilters.type = document.getElementById("filterType").value;

  // Search all sessions
  const results = [];

  workSessions.forEach(session => {
    // Date range filter
    if (activeFilters.startDate && session.date < activeFilters.startDate) return;
    if (activeFilters.endDate && session.date > activeFilters.endDate) return;

    session.activities.forEach((activity, index) => {
      // Type filter
      if (activeFilters.type && activity.type !== activeFilters.type) return;

      // Project filter
      if (activeFilters.projects.length > 0 && !activeFilters.projects.includes(activity.project)) return;

      // Category filter
      if (activeFilters.categories.length > 0 && !activeFilters.categories.includes(activity.category)) return;

      // Search text filter
      if (activeFilters.searchText && !activity.description.toLowerCase().includes(activeFilters.searchText)) return;

      // Matched all filters - add to results
      results.push({
        sessionDate: session.date,
        activityIndex: index,
        activity: activity
      });
    });
  });

  displaySearchResults(results);
}

function displaySearchResults(results) {
  const resultsSection = document.getElementById("searchResults");
  const resultsList = document.getElementById("resultsList");
  const resultCount = document.getElementById("resultCount");

  resultCount.textContent = results.length;

  if (results.length === 0) {
    resultsList.innerHTML = '<p class="no-results">No tasks found matching your criteria.</p>';
    resultsSection.classList.remove("hidden");
    return;
  }

  // Build results table
  let html = '<table class="results-table"><thead><tr>';
  html += '<th>Date</th><th>Type</th><th>Time</th><th>Duration</th><th>Description</th><th>Project</th><th>Category</th><th>Actions</th>';
  html += '</tr></thead><tbody>';

  results.forEach(result => {
    const { sessionDate, activityIndex, activity } = result;
    const typeIcon = activity.type === "task" ? "🎯" : "☕";
    const typeClass = activity.type === "task" ? "task" : "break";
    const dayName = new Date(sessionDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    html += `<tr class="${typeClass}">`;
    html += `<td>${dayName}</td>`;
    html += `<td>${typeIcon} ${activity.type}</td>`;
    html += `<td>${activity.startTime} - ${activity.endTime}</td>`;
    html += `<td>${formatDuration(activity.duration)}</td>`;
    html += `<td>${activity.description}</td>`;
    html += `<td>${activity.project}</td>`;
    html += `<td>${activity.category}</td>`;
    html += `<td>
      <button class="btn-edit-activity" data-session-date="${sessionDate}" data-activity-index="${activityIndex}">✏️</button>
      <button class="btn-delete-activity" data-session-date="${sessionDate}" data-activity-index="${activityIndex}">🗑️</button>
    </td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';
  resultsList.innerHTML = html;
  resultsSection.classList.remove("hidden");

  // Add event delegation for edit/delete buttons in search results
  resultsList.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-edit-activity")) {
      const sessionDate = e.target.dataset.sessionDate;
      const activityIndex = parseInt(e.target.dataset.activityIndex);
      editActivity(sessionDate, activityIndex);
    }

    if (e.target.classList.contains("btn-delete-activity")) {
      const sessionDate = e.target.dataset.sessionDate;
      const activityIndex = parseInt(e.target.dataset.activityIndex);
      deleteActivity(sessionDate, activityIndex);
    }
  });
}

function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterStartDate").value = "";
  document.getElementById("filterEndDate").value = "";
  document.getElementById("filterProject").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("searchResults").classList.add("hidden");

  activeFilters = {
    searchText: "",
    startDate: null,
    endDate: null,
    projects: [],
    categories: [],
    type: ""
  };
}

// Populate filter dropdowns
function populateFilterSelects() {
  const projectSelect = document.getElementById("filterProject");
  const categorySelect = document.getElementById("filterCategory");

  if (!projectSelect || !categorySelect) return;

  projectSelect.innerHTML = '<option value="">All Projects</option>';
  categorySelect.innerHTML = '<option value="">All Categories</option>';

  customProjects.forEach(project => {
    const option = document.createElement("option");
    option.value = project;
    option.textContent = project;
    projectSelect.appendChild(option);
  });

  customCategories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// ========================================
// END SEARCH/FILTER FUNCTIONS
// ========================================

function persistActiveState() {
  if (currentSession) {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(currentSession));
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }

  if (currentActivity) {
    localStorage.setItem(ACTIVE_ACTIVITY_KEY, JSON.stringify(currentActivity));
  } else {
    localStorage.removeItem(ACTIVE_ACTIVITY_KEY);
  }
}

function clearActiveState() {
  localStorage.removeItem(ACTIVE_SESSION_KEY);
  localStorage.removeItem(ACTIVE_ACTIVITY_KEY);
}

function secondsSince(epochMs) {
  if (!epochMs) return 0;
  return Math.max(0, Math.floor((Date.now() - epochMs) / 1000));
}

function showTaskControls() {
  if (taskControls) taskControls.classList.remove("hidden");
}

function hideTaskControls() {
  if (taskControls) taskControls.classList.add("hidden");
}


// Populate project dropdown
function populateProjectSelect() {
  const currentValue = projectSelect.value;
  projectSelect.innerHTML = '<option value="">Select project...</option>';
  customProjects.forEach(project => {
    const option = document.createElement("option");
    option.value = project;
    option.textContent = project;
    projectSelect.appendChild(option);
  });
  if (currentValue) projectSelect.value = currentValue;
}

// Populate category dropdown
function populateCategorySelect() {
  const currentValue = categorySelect.value;
  categorySelect.innerHTML = '<option value="">Select category...</option>';
  customCategories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
  if (currentValue) categorySelect.value = currentValue;
}

// Populate modal project dropdown
function populateModalProjectSelect() {
  modalProjectSelect.innerHTML = '<option value="">Select project...</option>';
  customProjects.forEach(project => {
    const option = document.createElement("option");
    option.value = project;
    option.textContent = project;
    modalProjectSelect.appendChild(option);
  });
}

// Populate modal category dropdown
function populateModalCategorySelect() {
  modalCategorySelect.innerHTML = '<option value="">Select category...</option>';
  customCategories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    modalCategorySelect.appendChild(option);
  });
}

// Render project list in settings
function renderProjectList() {
  projectList.innerHTML = "";
  customProjects.forEach((project, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${project}</span>
      <button class="btn-delete" data-index="${index}">Delete</button>
    `;
    projectList.appendChild(li);
  });

  // Add delete listeners
  projectList.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      customProjects.splice(index, 1);
      localStorage.setItem("customProjects", JSON.stringify(customProjects));
      triggerFirebaseSync();
      renderProjectList();
      populateProjectSelect();
    });
  });
}

// Render category list in settings
function renderCategoryList() {
  categoryList.innerHTML = "";
  customCategories.forEach((category, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${category}</span>
      <button class="btn-delete" data-index="${index}">Delete</button>
    `;
    categoryList.appendChild(li);
  });

  // Add delete listeners
  categoryList.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      customCategories.splice(index, 1);
      localStorage.setItem("customCategories", JSON.stringify(customCategories));
      triggerFirebaseSync();
      renderCategoryList();
      populateCategorySelect();
    });
  });
}

function normalizeHolidayDate(value) {
  // Expect YYYY-MM-DD from <input type="date">
  if (!value) return "";
  return String(value).slice(0, 10);
}

function renderHolidayList() {
  if (!holidayList) return;
  holidayList.innerHTML = "";

  const sorted = [...holidays].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  sorted.forEach((h) => {
    const li = document.createElement("li");
    const label = h.name ? `${h.date} — ${h.name}` : h.date;
    li.innerHTML = `
      <span>${label}</span>
      <button class="btn-delete" data-date="${h.date}">Delete</button>
    `;
    holidayList.appendChild(li);
  });

  holidayList.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const date = e.target.dataset.date;
      holidays = holidays.filter((h) => h.date !== date);
      localStorage.setItem("holidays", JSON.stringify(holidays));
  triggerFirebaseSync();
      renderHolidayList();
      renderWeekView();
    });
  });
}

function addHoliday() {
  const date = normalizeHolidayDate(holidayDateInput?.value);
  const name = (holidayNameInput?.value || "").trim();

  if (!date) {
    showAlert("Please select a holiday date.", "Missing Date");
    return;
  }

  if (holidays.some((h) => h.date === date)) {
    showAlert("A holiday already exists for this date.", "Duplicate Holiday");
    return;
  }

  holidays.push({ date, name });
  localStorage.setItem("holidays", JSON.stringify(holidays));
  triggerFirebaseSync();

  if (holidayDateInput) holidayDateInput.value = "";
  if (holidayNameInput) holidayNameInput.value = "";

  renderHolidayList();
  renderWeekView();
}

// Add new project
function addProject() {
  const projectName = newProjectInput.value.trim();
  if (!projectName) {
    showAlert("Please enter a project name", "Missing Input");
    return;
  }
  if (customProjects.includes(projectName)) {
    showAlert("This project already exists", "Duplicate Entry");
    return;
  }
  customProjects.push(projectName);
  localStorage.setItem("customProjects", JSON.stringify(customProjects));
  newProjectInput.value = "";
  renderProjectList();
  populateProjectSelect();
}

// Add new category
function addCategory() {
  const categoryName = newCategoryInput.value.trim();
  if (!categoryName) {
    showAlert("Please enter a category name", "Missing Input");
    return;
  }
  if (customCategories.includes(categoryName)) {
    showAlert("This category already exists", "Duplicate Entry");
    return;
  }
  customCategories.push(categoryName);
  localStorage.setItem("customCategories", JSON.stringify(customCategories));
  newCategoryInput.value = "";
  renderCategoryList();
  populateCategorySelect();
}

// Open settings modal
function openSettings() {
  settingsModal.classList.remove("hidden");
  renderProjectList();
  renderCategoryList();
  renderHolidayList();
  loadBrandingUI();

  if (reportUserNameInput) {
    reportUserNameInput.value = localStorage.getItem(REPORT_USER_KEY) || "";
  }

  if (reportWorkstationInput) {
    reportWorkstationInput.value = localStorage.getItem(REPORT_WORKSTATION_KEY) || DEFAULT_WORKSTATION;
  }

  if (reportTimezoneInput) {
    reportTimezoneInput.value = localStorage.getItem(REPORT_TIMEZONE_KEY) || DEFAULT_TIMEZONE;
  }
}

// Close settings modal
function closeSettings() {
  settingsModal.classList.add("hidden");
}

function saveReportUserName() {
  if (!reportUserNameInput) return;
  const name = (reportUserNameInput.value || "").trim();
  if (name) localStorage.setItem(REPORT_USER_KEY, name);
  else localStorage.removeItem(REPORT_USER_KEY);
}

function saveReportContext() {
  if (reportWorkstationInput) {
    const workstation = (reportWorkstationInput.value || "").trim();
    if (workstation) localStorage.setItem(REPORT_WORKSTATION_KEY, workstation);
    else localStorage.removeItem(REPORT_WORKSTATION_KEY);
  }

  if (reportTimezoneInput) {
    const tz = (reportTimezoneInput.value || "").trim();
    if (tz) localStorage.setItem(REPORT_TIMEZONE_KEY, tz);
    else localStorage.removeItem(REPORT_TIMEZONE_KEY);
  }
}

// ========================================
// BRANDING FUNCTIONS
// ========================================

function loadBrandingUI() {
  const brand = getReportBrand();
  
  const brandNameInput = document.getElementById("brandNameInput");
  const brandAddressInput = document.getElementById("brandAddressInput");
  const brandPhoneInput = document.getElementById("brandPhoneInput");
  const brandEmailInput = document.getElementById("brandEmailInput");
  const brandWebsiteInput = document.getElementById("brandWebsiteInput");
  
  if (brandNameInput) brandNameInput.value = brand.name || DEFAULT_BRAND.name;
  if (brandAddressInput) brandAddressInput.value = brand.address || DEFAULT_BRAND.address;
  if (brandPhoneInput) brandPhoneInput.value = brand.phone || DEFAULT_BRAND.phone;
  if (brandEmailInput) brandEmailInput.value = brand.email || DEFAULT_BRAND.email;
  if (brandWebsiteInput) brandWebsiteInput.value = brand.website || DEFAULT_BRAND.website;
}

function saveBranding() {
  const brandNameInput = document.getElementById("brandNameInput");
  const brandAddressInput = document.getElementById("brandAddressInput");
  const brandPhoneInput = document.getElementById("brandPhoneInput");
  const brandEmailInput = document.getElementById("brandEmailInput");
  const brandWebsiteInput = document.getElementById("brandWebsiteInput");
  
  const newBrand = {
    name: brandNameInput?.value.trim() || DEFAULT_BRAND.name,
    address: brandAddressInput?.value.trim() || DEFAULT_BRAND.address,
    phone: brandPhoneInput?.value.trim() || DEFAULT_BRAND.phone,
    email: brandEmailInput?.value.trim() || DEFAULT_BRAND.email,
    website: brandWebsiteInput?.value.trim() || DEFAULT_BRAND.website
  };
  
  // Save to localStorage
  localStorage.setItem("reportBrand", JSON.stringify(newBrand));
  triggerFirebaseSync();
  
  // Update the global variable
  REPORT_BRAND = newBrand;
  
  console.log("Branding saved:", newBrand);
}

function resetBranding() {
  // Reset to default
  localStorage.removeItem("reportBrand");
  REPORT_BRAND = { ...DEFAULT_BRAND };
  
  // Reload UI
  loadBrandingUI();
  
  showNotification("Branding reset to default", "info");
}

// Initialize branding on settings open
function initBrandingListeners() {
  const saveBrandingBtn = document.getElementById("saveBrandingBtn");
  const resetBrandingBtn = document.getElementById("resetBrandingBtn");
  
  if (saveBrandingBtn) saveBrandingBtn.addEventListener("click", saveBranding);
  if (resetBrandingBtn) resetBrandingBtn.addEventListener("click", resetBranding);
}

// ========================================
// END BRANDING FUNCTIONS
// ========================================

// Show task modal
function showTaskModal(isFirstTask = false) {
  return new Promise((resolve, reject) => {
    isFirstTaskOfDay = isFirstTask;
    taskModalTitle.textContent = isFirstTask ? "🌅 Start Your Work Day" : "📋 Start New Task";

    // Clear and populate fields
    modalTaskDescription.value = "";
    populateModalProjectSelect();
    populateModalCategorySelect();

    // Show modal
    taskModal.classList.remove("hidden");

    // Focus on description field
    setTimeout(() => modalTaskDescription.focus(), 100);

    // Store resolve/reject for later
    modalResolve = resolve;
    modalReject = reject;
  });
}

// Show break modal
function showBreakModal() {
  return new Promise((resolve, reject) => {
    // Clear field
    modalBreakDescription.value = "Break";

    // Show modal
    breakModal.classList.remove("hidden");

    // Focus on description field
    setTimeout(() => modalBreakDescription.focus(), 100);

    // Store resolve/reject for later
    modalResolve = resolve;
    modalReject = reject;
  });
}

// Close task modal
function closeTaskModal(cancelled = false) {
  taskModal.classList.add("hidden");
  if (cancelled && modalReject) {
    modalReject("cancelled");
  }
  modalResolve = null;
  modalReject = null;
}

// Close break modal
function closeBreakModal(cancelled = false) {
  breakModal.classList.add("hidden");
  if (cancelled && modalReject) {
    modalReject("cancelled");
  }
  modalResolve = null;
  modalReject = null;
}

// Confirm task from modal
function confirmTask() {
  const description = modalTaskDescription.value.trim();

  if (!description) {
    showAlert("Please enter a task description", "Missing Input");
    modalTaskDescription.focus();
    return;
  }

  const data = {
    description,
    project: modalProjectSelect.value,
    category: modalCategorySelect.value
  };

  if (modalResolve) {
    modalResolve(data);
  }

  closeTaskModal(false);
}

// Confirm break from modal
function confirmBreak() {
  const description = modalBreakDescription.value.trim() || "Break";

  if (modalResolve) {
    modalResolve({ description });
  }

  closeBreakModal(false);
}

// Prompt for task with modal
async function promptForTask(isFirstTask = false) {
  if (!currentSession) return;

  try {
    const taskData = await showTaskModal(isFirstTask);

    // Set the values
    taskDescription.value = taskData.description;
    if (taskData.project) projectSelect.value = taskData.project;
    if (taskData.category) categorySelect.value = taskData.category;

    startTaskDirectly();
  } catch (error) {
    // User cancelled
    if (isFirstTask) {
      // Cancel work day start
      const retry = await showConfirm("You must enter a task to start your work day.\n\nWould you like to try again?", "Task Required");
      if (retry) {
        promptForTask(true);
      } else {
        currentSession = null;
        stopSessionTimer();
        workSessionInfo.classList.add("hidden");
        startWorkBtn.disabled = false;
        sessionStatus.textContent = "Not Started";
      }
    } else {
      // Show next action modal instead of confirm
      showNextActionModal();
    }
  }
}

// Prompt for break with modal
async function promptForBreak() {
  if (!currentSession) return;

  try {
    const breakData = await showBreakModal();

    taskDescription.value = breakData.description;
    startBreakDirectly();
  } catch (error) {
    // User cancelled - show next action modal
    showNextActionModal();
  }
}

// Start task directly (internal function)
function startTaskDirectly() {
  const description = taskDescription.value.trim();
  if (!description) return;

  // Use manual selection if chosen, otherwise auto-detect
  let project, category;
  if (projectSelect.value) {
    project = projectSelect.value;
  } else {
    const autoClassified = classifyTask(description);
    project = autoClassified.project;
  }

  if (categorySelect.value) {
    category = categorySelect.value;
  } else {
    const autoClassified = classifyTask(description);
    category = autoClassified.category;
  }

  currentActivity = {
    type: "task",
    description,
    startTime: getCurrentTime(),
    startEpoch: Date.now(),
    endTime: null,
    endEpoch: null,
    duration: 0,
    project,
    category
  };

  activityType.textContent = "🎯 Working on Task";
  activityDescription.textContent = description;
  currentActivityDiv.classList.remove("hidden");
  showTaskControls();

  stopActivityBtn.disabled = false;
  sessionStatus.textContent = "Working on Task";

  // Enable end work button now that there's at least one activity
  if (currentSession && currentSession.activities.length === 0) {
    endWorkBtn.disabled = false;
  }
  
  // Update reminder tracking
  updateActivityTime();
  if (reminderSettings.pomodoro.enabled && !pomodoroStartTime) {
    startPomodoroSession();
  }

  startActivityTimer();
  updateSessionStats();
  persistActiveState();
}

// Start break directly (internal function)
function startBreakDirectly() {
  const description = taskDescription.value.trim() || "Break";

  currentActivity = {
    type: "break",
    description,
    startTime: getCurrentTime(),
    startEpoch: Date.now(),
    endTime: null,
    endEpoch: null,
    duration: 0,
    project: "Break",
    category: "Break"
  };

  activityType.textContent = "☕ On Break";
  activityDescription.textContent = description;
  currentActivityDiv.classList.remove("hidden");
  showTaskControls();

  stopActivityBtn.disabled = false;
  sessionStatus.textContent = "On Break";

  // Enable end work button now that there's at least one activity
  if (currentSession && currentSession.activities.length === 0) {
    endWorkBtn.disabled = false;
  }
  
  // Update reminder tracking - reset break timer
  updateActivityTime();
  lastBreakReminderTime = Date.now();
  
  // Stop Pomodoro work session if active
  if (pomodoroState === 'work') {
    pomodoroStartTime = null;
    pomodoroState = null;
  }

  startActivityTimer();
  updateSessionStats();
  persistActiveState();
}

// Utility: Format time as HH:MM:SS
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Utility: Format duration as Xh Ym
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Utility: Get current date string
function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

// Utility: Get current time string
function getCurrentTime() {
  return new Date().toTimeString().split(' ')[0];
}

// Utility: Calculate duration in seconds between two time strings
function calculateDuration(startTime, endTime) {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return Math.floor((end - start) / 1000);
}

// Get week start (Monday) for a given date
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// Get week range
function getWeekRange(offset = 0) {
  const today = new Date();
  today.setDate(today.getDate() + offset * 7);
  const start = getWeekStart(today);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

// Format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Start work day
function startWorkDay() {
  const date = getCurrentDate();
  const time = getCurrentTime();

  currentSession = {
    date,
    startTime: time,
    startEpoch: Date.now(),
    endTime: null,
    endEpoch: null,
    activities: []
  };

  workStartTime.textContent = time;
  sessionStatus.textContent = "Working";
  workSessionInfo.classList.remove("hidden");

  startWorkBtn.disabled = true;
  endWorkBtn.disabled = true; // Disable until at least one activity is logged

  startSessionTimer();
  updateSessionStats();
  persistActiveState();

  // Save immediately so progress isn't lost if you refresh/close.
  upsertWorkSession(currentSession);
  saveData();
  renderWeekView();
  
  // Initialize reminder system
  updateActivityTime();
  lastBreakReminderTime = Date.now();
  if (reminderSettings.pomodoro.enabled) {
    startPomodoroSession();
  }

  // Immediately prompt for first task
  setTimeout(() => {
    promptForTask(true);
  }, 500);
}

// End work day
async function endWorkDay() {
  if (!currentSession) return;

  // Check if there are any activities logged
  if (currentSession.activities.length === 0 && !currentActivity) {
    await showAlert("You cannot end the work day without logging at least one task or break!", "Cannot End Work Day");
    return;
  }

  // Stop any current activity
  if (currentActivity) {
    currentActivity.endTime = getCurrentTime();
    currentActivity.endEpoch = Date.now();
    currentActivity.duration = currentActivity.startEpoch
      ? secondsSince(currentActivity.startEpoch)
      : calculateDuration(currentActivity.startTime, currentActivity.endTime);
    currentSession.activities.push(currentActivity);
    stopActivityTimer();
    currentActivity = null;
    currentActivityDiv.classList.add("hidden");
  }

  currentSession.endTime = getCurrentTime();
  currentSession.endEpoch = Date.now();
  // Update existing session (avoid duplicates when saving incrementally).
  upsertWorkSession(currentSession);

  stopSessionTimer();

  currentSession = null;
  sessionStatus.textContent = "Work Day Ended";

  startWorkBtn.disabled = false;
  endWorkBtn.disabled = true;

  clearActiveState();
  saveData();
  renderWeekView();
  hideTaskControls();

  await showAlert("Work day ended successfully! Great job today!", "🎉 Work Day Complete");
}

// Stop current activity - now shows status modal for tasks
function stopCurrentActivity() {
  if (!currentActivity) return;

  currentActivity.endTime = getCurrentTime();
  currentActivity.endEpoch = Date.now();
  currentActivity.duration = currentActivity.startEpoch
    ? secondsSince(currentActivity.startEpoch)
    : calculateDuration(currentActivity.startTime, currentActivity.endTime);

  // For breaks, just complete immediately
  if (currentActivity.type === "break") {
    currentActivity.status = "completed";
    finalizeActivityStop();
    return;
  }

  // For tasks, show the status modal
  pendingTaskStatus = { ...currentActivity };
  showTaskStatusModal(currentActivity.description);
}

// Show task status modal
function showTaskStatusModal(taskDescription) {
  const modal = document.getElementById("taskStatusModal");
  const descriptionEl = document.getElementById("taskStatusDescription");
  
  descriptionEl.textContent = `"${taskDescription}"`;
  modal.classList.remove("hidden");
}

// Handle task completed
function handleTaskCompleted() {
  if (!pendingTaskStatus) return;
  
  currentActivity = pendingTaskStatus;
  currentActivity.status = "completed";
  
  // Remove from paused tasks if it was there
  removePausedTask(currentActivity.description);
  
  pendingTaskStatus = null;
  document.getElementById("taskStatusModal").classList.add("hidden");
  
  finalizeActivityStop();
}

// Handle task paused (continue later)
function handleTaskPaused() {
  if (!pendingTaskStatus) return;
  
  currentActivity = pendingTaskStatus;
  currentActivity.status = "paused";
  
  // Calculate total time for this task including current session and any previous time
  const currentDuration = currentActivity.duration || 0;
  const previousTime = currentActivity.previousTime || 0; // Time from before this resume
  
  // Add to paused tasks for easy resumption
  addPausedTask({
    description: currentActivity.description,
    project: currentActivity.project,
    category: currentActivity.category,
    pausedAt: new Date().toISOString(),
    totalTime: previousTime + currentDuration
  });
  
  pendingTaskStatus = null;
  document.getElementById("taskStatusModal").classList.add("hidden");
  
  finalizeActivityStop();
}

// Get total time spent on a task (across all sessions)
function getTotalTimeForTask(description) {
  let total = 0;
  workSessions.forEach(session => {
    session.activities.forEach(activity => {
      if (activity.type === "task" && activity.description === description) {
        total += activity.duration || 0;
      }
    });
  });
  return total;
}

// Add task to paused tasks list
function addPausedTask(task) {
  // Update existing or add new
  const existingIndex = pausedTasks.findIndex(t => t.description === task.description);
  if (existingIndex >= 0) {
    pausedTasks[existingIndex] = task;
  } else {
    pausedTasks.push(task);
  }
  localStorage.setItem(PAUSED_TASKS_KEY, JSON.stringify(pausedTasks));
}

// Remove task from paused list
function removePausedTask(description) {
  pausedTasks = pausedTasks.filter(t => t.description !== description);
  localStorage.setItem(PAUSED_TASKS_KEY, JSON.stringify(pausedTasks));
}

// Finalize activity stop (common code)
function finalizeActivityStop() {
  currentSession.activities.push(currentActivity);

  stopActivityTimer();

  currentActivity = null;
  currentActivityDiv.classList.add("hidden");
  hideTaskControls();

  stopActivityBtn.disabled = true;
  sessionStatus.textContent = "Working";

  updateSessionStats();
  persistActiveState();
  upsertWorkSession(currentSession);
  saveData();
  renderWeekView();

  // Show next action modal
  setTimeout(() => {
    if (currentSession && !currentActivity) {
      showNextActionModal();
    }
  }, 300);
}

// Start session timer
function startSessionTimer() {
  if (sessionTimerInterval) clearInterval(sessionTimerInterval);
  sessionTimerInterval = setInterval(() => {
    if (!currentSession?.startEpoch) return;
    sessionTimer.textContent = formatTime(secondsSince(currentSession.startEpoch));
    updateSessionStats();
  }, 1000);
}

// Stop session timer
function stopSessionTimer() {
  if (sessionTimerInterval) {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
  }
}

// Start activity timer
function startActivityTimer() {
  if (activityTimerInterval) clearInterval(activityTimerInterval);
  activityTimerInterval = setInterval(() => {
    if (!currentActivity?.startEpoch) return;
    activityTimer.textContent = formatTime(secondsSince(currentActivity.startEpoch));
    updateSessionStats();
  }, 1000);
}

// Stop activity timer
function stopActivityTimer() {
  if (activityTimerInterval) {
    clearInterval(activityTimerInterval);
    activityTimerInterval = null;
  }
}

// Update session statistics
function updateSessionStats() {
  if (!currentSession) return;

  let totalWork = 0;
  let totalBreak = 0;

  currentSession.activities.forEach(activity => {
    if (activity.type === "task") {
      totalWork += activity.duration;
    } else {
      totalBreak += activity.duration;
    }
  });

  if (currentActivity) {
    const ongoing = currentActivity.startEpoch ? secondsSince(currentActivity.startEpoch) : 0;
    if (currentActivity.type === "task") totalWork += ongoing;
    if (currentActivity.type === "break") totalBreak += ongoing;
  }

  const totalSession = totalWork + totalBreak;
  if (totalSessionTime) totalSessionTime.textContent = formatDuration(totalSession);
  totalWorkTime.textContent = formatDuration(totalWork);
  totalBreakTime.textContent = formatDuration(totalBreak);
}

// Helper function to trigger Firebase sync
function triggerFirebaseSync() {
  if (window.firebaseStateManager && window.firebaseStateManager.isSignedIn()) {
    window.firebaseStateManager.triggerAutoSave();
  }
}

// Save data to localStorage and Firebase
function saveData() {
  try {
    localStorage.setItem("workSessions", JSON.stringify(workSessions));
    triggerFirebaseSync();
  } catch (e) {
    console.error("Failed to save workSessions to localStorage", e);
  }
}

// Render week view
function renderWeekView() {
  const { start, end } = getWeekRange(currentWeekOffset);
  const startStr = formatDate(start);
  const endStr = formatDate(end);

  weekDisplay.textContent = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;

  // Filter sessions for current week
  const weekSessions = workSessions.filter(session => {
    return session.date >= startStr && session.date <= endStr;
  });

  // Calculate weekly summary
  let weekWorkSeconds = 0;
  let weekBreakSeconds = 0;
  let weekTaskCount = 0;
  const daysWorked = new Set();

  weekSessions.forEach(session => {
    daysWorked.add(session.date);
    session.activities.forEach(activity => {
      if (activity.type === "task") {
        weekWorkSeconds += activity.duration;
        weekTaskCount++;
      } else {
        weekBreakSeconds += activity.duration;
      }
    });
  });

  const weekTotalSeconds = weekWorkSeconds + weekBreakSeconds;
  document.getElementById("weekTotalHours").textContent = formatDuration(weekTotalSeconds);
  document.getElementById("weekWorkHours").textContent = formatDuration(weekWorkSeconds);
  document.getElementById("weekBreakHours").textContent = formatDuration(weekBreakSeconds);
  document.getElementById("weekTaskCount").textContent = weekTaskCount;
  document.getElementById("weekDaysWorked").textContent = daysWorked.size;

  // Render daily breakdown
  renderDailyBreakdown(weekSessions, startStr, endStr);

  // Update storage info
  updateStorageInfo();

  // Update analytics dashboard
  generateAnalytics();
}

// Update storage usage display
function updateStorageInfo() {
  try {
    // Calculate size of workSessions
    const sessionsData = localStorage.getItem("workSessions") || "[]";
    const sessionsBytes = new Blob([sessionsData]).size;
    const sessionsKB = (sessionsBytes / 1024).toFixed(2);
    
    // Calculate total localStorage usage
    let totalBytes = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalBytes += new Blob([localStorage.getItem(key)]).size;
        totalBytes += new Blob([key]).size;
      }
    }
    const totalKB = (totalBytes / 1024).toFixed(2);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(3);
    
    // Count sessions
    const sessions = JSON.parse(sessionsData);
    const sessionCount = sessions.length;
    
    // Calculate activities count
    let activitiesCount = 0;
    sessions.forEach(s => {
      activitiesCount += (s.activities || []).length;
    });
    
    // Update UI
    const sessionsSize = document.getElementById("sessionsSize");
    const totalRecords = document.getElementById("totalRecords");
    const totalStorage = document.getElementById("totalStorage");
    const storageBarFill = document.getElementById("storageBarFill");
    
    if (sessionsSize) sessionsSize.textContent = `${sessionsKB} KB`;
    if (totalRecords) totalRecords.textContent = `${sessionCount} sessions, ${activitiesCount} activities`;
    if (totalStorage) totalStorage.textContent = totalBytes > 1024 * 1024 ? `${totalMB} MB` : `${totalKB} KB`;
    
    // Update progress bar (5MB limit)
    const usagePercent = Math.min(100, (totalBytes / (5 * 1024 * 1024)) * 100);
    if (storageBarFill) {
      storageBarFill.style.width = `${usagePercent}%`;
      // Change color based on usage
      if (usagePercent > 80) {
        storageBarFill.style.background = "linear-gradient(90deg, #ef4444, #f87171)";
      } else if (usagePercent > 50) {
        storageBarFill.style.background = "linear-gradient(90deg, #f59e0b, #fbbf24)";
      } else {
        storageBarFill.style.background = "var(--primary-gradient)";
      }
    }
  } catch (error) {
    console.log("Error calculating storage:", error);
  }
}

// Render daily breakdown
function renderDailyBreakdown(weekSessions, startStr, endStr) {
  dailyAccordion.innerHTML = "";

  // Group by date
  const sessionsByDate = {};
  weekSessions.forEach(session => {
    if (!sessionsByDate[session.date]) {
      sessionsByDate[session.date] = [];
    }
    sessionsByDate[session.date].push(session);
  });

  const holidayMap = new Map(
    holidays
      .filter((h) => (!startStr || h.date >= startStr) && (!endStr || h.date <= endStr))
      .map((h) => [h.date, h.name || ""])
  );

  // Union session dates + holiday dates (so holidays show even with no sessions)
  const allDates = new Set([...Object.keys(sessionsByDate), ...holidayMap.keys()]);

  // Sort dates (desc)
  const dates = [...allDates].sort().reverse();

  dates.forEach(date => {
    const sessions = sessionsByDate[date] || [];
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    const isHoliday = holidayMap.has(date);
    const holidayName = holidayMap.get(date) || "";

    let dayWorkSeconds = 0;
    let dayBreakSeconds = 0;
    let dayTasks = 0;

    sessions.forEach(session => {
      session.activities.forEach(activity => {
        if (activity.type === "task") {
          dayWorkSeconds += activity.duration;
          dayTasks++;
        } else {
          dayBreakSeconds += activity.duration;
        }
      });
    });

    const dayDiv = document.createElement("div");
    dayDiv.className = "day-section";

    const dayHeader = document.createElement("div");
    dayHeader.className = "day-header";
    const holidayBadge = isHoliday
      ? `<span class="holiday-badge">Holiday${holidayName ? `: ${holidayName}` : ""}</span>`
      : "";

    dayHeader.innerHTML = `
      <div>
        <strong>${dayName}, ${dateObj.toLocaleDateString()}</strong>
        ${holidayBadge}
        <span class="day-stats">
          Work: ${formatDuration(dayWorkSeconds)} | Break: ${formatDuration(dayBreakSeconds)} | Tasks: ${dayTasks}
        </span>
      </div>
      <button class="toggle-btn">▼</button>
    `;

    const dayContent = document.createElement("div");
    dayContent.className = "day-content";

    if (sessions.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "session-item";
      emptyDiv.innerHTML = `
        <div class="session-header">
          <strong>${isHoliday ? "Holiday" : "No sessions"}</strong>
        </div>
        <div class="holiday-note">
          ${isHoliday ? "No work logged on this holiday." : "No work logged for this day."}
        </div>
      `;
      dayContent.appendChild(emptyDiv);
    }

    sessions.forEach(session => {
      const sessionDiv = document.createElement("div");
      sessionDiv.className = "session-item";

      // Detect gaps in this session
      const gaps = detectGaps(session.activities);
      const sortedActivities = [...session.activities].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      
      // Calculate total gap time
      const totalGapMinutes = gaps.reduce((sum, gap) => sum + gap.durationMinutes, 0);

      let activitiesHTML = '<div class="activities-table-wrapper"><div class="activities-table"><table><thead><tr><th>Type</th><th>Status</th><th>Time</th><th>Duration</th><th>Description</th><th>Project</th><th>Category</th><th>Actions</th></tr></thead><tbody>';

      sortedActivities.forEach((activity, activityIndex) => {
        // Find actual index in original array for editing
        const originalIndex = session.activities.findIndex(a => 
          a.startTime === activity.startTime && a.description === activity.description
        );
        
        const typeIcon = activity.type === "task" ? "🎯" : "☕";
        const typeClass = activity.type === "task" ? "task" : "break";
        const autoFilledClass = activity.autoFilled ? " auto-filled" : "";
        
        // Determine status badge
        let statusBadge = "";
        if (activity.type === "task") {
          const status = activity.status || "completed";
          const statusIcon = status === "completed" ? "✓" : "⏸";
          const statusText = status === "completed" ? "Done" : "Paused";
          statusBadge = `<span class="status-badge ${status}">${statusIcon} ${statusText}</span>`;
        } else {
          statusBadge = `<span class="status-badge completed">✓ Done</span>`;
        }
        
        activitiesHTML += `
          <tr class="${typeClass}${autoFilledClass}">
            <td>${typeIcon} ${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</td>
            <td>${statusBadge}</td>
            <td>${activity.startTime} - ${activity.endTime}</td>
            <td>${formatDuration(activity.duration)}</td>
            <td>${activity.description}</td>
            <td>${activity.project}</td>
            <td>${activity.category}</td>
            <td>
              <button class="btn-edit-activity" data-session-date="${date}" data-activity-index="${originalIndex}">✏️ Edit</button>
              <button class="btn-delete-activity" data-session-date="${date}" data-activity-index="${originalIndex}">🗑️ Delete</button>
            </td>
          </tr>
        `;
        
        // Check if there's a gap after this activity
        const gap = gaps.find(g => g.startTime === activity.endTime);
        if (gap) {
          activitiesHTML += `
            <tr class="gap-row">
              <td colspan="2">
                <span class="gap-indicator">
                  <span class="gap-indicator-icon">⚠️</span>
                  Gap Detected
                </span>
              </td>
              <td>${gap.startTime} - ${gap.endTime}</td>
              <td>${formatDuration(gap.duration)}</td>
              <td colspan="2">Untracked time</td>
              <td>
                <button class="btn-fill-gap" data-session-date="${date}" data-session-start="${session.startTime}" data-gap-start="${gap.startTime}" data-gap-end="${gap.endTime}">Fill with Break</button>
              </td>
            </tr>
          `;
        }
      });

      activitiesHTML += '</tbody></table></div></div>';

      // Add gap summary if there are gaps
      const gapSummary = gaps.length > 0 
        ? `<span class="gap-summary">⚠️ ${gaps.length} gap(s), ${formatDuration(totalGapMinutes * 60)} untracked</span>` 
        : '';

      sessionDiv.innerHTML = `
        <div class="session-header">
          <strong>Session:</strong> ${session.startTime} - ${session.endTime || 'In Progress'}
          ${gapSummary}
          ${gaps.length > 0 ? `<button class="btn-fill-all-gaps" data-session-date="${date}" data-session-start="${session.startTime}">Fill All Gaps</button>` : ''}
        </div>
        ${activitiesHTML}
      `;

      dayContent.appendChild(sessionDiv);
    });

    dayDiv.appendChild(dayHeader);
    dayDiv.appendChild(dayContent);
    dailyAccordion.appendChild(dayDiv);

    // Toggle functionality
    dayHeader.addEventListener("click", () => {
      dayContent.classList.toggle("open");
      const toggleBtn = dayHeader.querySelector(".toggle-btn");
      toggleBtn.textContent = dayContent.classList.contains("open") ? "▲" : "▼";
    });
  });
}

function arrayBufferToBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ========================================
// EXPORT MODAL FUNCTIONS
// ========================================

// Open export modal
function openExportModal() {
  populateProjectCheckboxes();
  setDefaultDates();
  updateExportPreview();
  exportModal.classList.remove("hidden");
}

// Close export modal
function closeExportModal() {
  exportModal.classList.add("hidden");
}

// Set default dates based on range selection
function setDefaultDates() {
  const today = new Date();
  document.getElementById("exportStartDate").value = formatDate(today);
  document.getElementById("exportEndDate").value = formatDate(today);
  document.getElementById("projectExportStartDate").value = "";
  document.getElementById("projectExportEndDate").value = "";
}

// Populate project checkboxes
function populateProjectCheckboxes() {
  const container = document.getElementById("projectCheckboxList");
  container.innerHTML = "";
  
  // Get all unique projects from sessions
  const projectsWithData = new Set();
  workSessions.forEach(session => {
    session.activities.forEach(activity => {
      if (activity.project) {
        projectsWithData.add(activity.project);
      }
    });
  });
  
  // Add custom projects and projects with data
  const allProjects = new Set([...customProjects, ...projectsWithData]);
  
  [...allProjects].sort().forEach(project => {
    const hasData = projectsWithData.has(project);
    const label = document.createElement("label");
    label.className = "project-checkbox-item";
    label.innerHTML = `
      <input type="checkbox" value="${escapeHtml(project)}" ${hasData ? 'checked' : ''}>
      <span>${escapeHtml(project)} ${hasData ? '' : '(no data)'}</span>
    `;
    label.querySelector("input").addEventListener("change", updateExportPreview);
    container.appendChild(label);
  });
}

// Get date range based on selection
function getExportDateRange(rangeType, customStart, customEnd) {
  const today = new Date();
  let start, end;
  
  switch (rangeType) {
    case 'today':
      start = end = today;
      break;
    case 'yesterday':
      start = end = new Date(today);
      start.setDate(start.getDate() - 1);
      break;
    case 'thisWeek':
      const weekRange = getWeekRange(0);
      start = weekRange.start;
      end = weekRange.end;
      break;
    case 'lastWeek':
      const lastWeekRange = getWeekRange(-1);
      start = lastWeekRange.start;
      end = lastWeekRange.end;
      break;
    case 'thisMonth':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'lastMonth':
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case 'all':
      // Find earliest and latest session dates
      if (workSessions.length === 0) {
        start = end = today;
      } else {
        const dates = workSessions.map(s => s.date).sort();
        start = new Date(dates[0] + 'T00:00:00');
        end = new Date(dates[dates.length - 1] + 'T00:00:00');
      }
      break;
    case 'custom':
      start = customStart ? new Date(customStart + 'T00:00:00') : today;
      end = customEnd ? new Date(customEnd + 'T00:00:00') : today;
      break;
    default:
      start = end = today;
  }
  
  return { start, end, startStr: formatDate(start), endStr: formatDate(end) };
}

// Get selected projects
function getSelectedProjects() {
  const checkboxes = document.querySelectorAll("#projectCheckboxList input:checked");
  return Array.from(checkboxes).map(cb => cb.value);
}

// Update export preview
function updateExportPreview() {
  const exportType = document.querySelector('input[name="exportType"]:checked').value;
  let sessions = [];
  
  if (exportType === 'range') {
    const customStart = document.getElementById("exportStartDate").value;
    const customEnd = document.getElementById("exportEndDate").value;
    const { startStr, endStr } = getExportDateRange(currentExportRange, customStart, customEnd);
    
    sessions = workSessions.filter(s => s.date >= startStr && s.date <= endStr);
  } else {
    // Project-based export
    const selectedProjects = getSelectedProjects();
    const customStart = document.getElementById("projectExportStartDate").value;
    const customEnd = document.getElementById("projectExportEndDate").value;
    const { startStr, endStr } = getExportDateRange(currentProjectRange, customStart, customEnd);
    
    sessions = workSessions.filter(s => {
      if (currentProjectRange !== 'all' && (s.date < startStr || s.date > endStr)) return false;
      return s.activities.some(a => selectedProjects.includes(a.project));
    });
  }
  
  // Calculate stats
  const includeBreaks = document.getElementById("includeBreaks").checked;
  let taskCount = 0;
  let totalMinutes = 0;
  const daysSet = new Set();
  
  sessions.forEach(session => {
    daysSet.add(session.date);
    session.activities.forEach(activity => {
      if (activity.type === 'task' || (activity.type === 'break' && includeBreaks)) {
        if (activity.type === 'task') taskCount++;
        const duration = activity.duration || 0;
        totalMinutes += Math.round(duration / 60);
      }
    });
  });
  
  document.getElementById("previewSessions").textContent = sessions.length;
  document.getElementById("previewTasks").textContent = taskCount;
  document.getElementById("previewHours").textContent = `${Math.floor(totalMinutes / 60)}h`;
  document.getElementById("previewDays").textContent = daysSet.size;
}

// Handle export type change
function handleExportTypeChange() {
  const exportType = document.querySelector('input[name="exportType"]:checked').value;
  const dateRangeOptions = document.getElementById("dateRangeOptions");
  const projectOptions = document.getElementById("projectOptions");
  
  if (exportType === 'range') {
    dateRangeOptions.classList.remove("hidden");
    projectOptions.classList.add("hidden");
  } else {
    dateRangeOptions.classList.add("hidden");
    projectOptions.classList.remove("hidden");
  }
  
  updateExportPreview();
}

// Export week data as real Excel .xlsx (ExcelJS)
async function exportWeekDataExcel() {
  if (typeof ExcelJS === "undefined") {
    await showAlert(
      "Excel export library failed to load. Please check your internet connection and try again.",
      "Export Unavailable"
    );
    return;
  }

  const { start, end } = getWeekRange(currentWeekOffset);
  const startStr = formatDate(start);
  const endStr = formatDate(end);

  const weekSessions = workSessions.filter(session => {
    return session.date >= startStr && session.date <= endStr;
  });

  // Include the current in-progress session (if it belongs to this week).
  if (currentSession && currentSession.date >= startStr && currentSession.date <= endStr) {
    const id = getSessionIdentity(currentSession);
    if (!weekSessions.some((s) => getSessionIdentity(s) === id)) {
      weekSessions.push(currentSession);
    }
  }

  // Calculate summary statistics
  let totalWorkMinutes = 0;
  let totalBreakMinutes = 0;
  let taskCount = 0;
  const daysWorked = new Set();

  weekSessions.forEach(session => {
    daysWorked.add(session.date);
    session.activities.forEach(activity => {
      const durationSeconds =
        typeof activity.duration === "number" && activity.duration > 0
          ? activity.duration
          : activity.startEpoch
            ? secondsSince(activity.startEpoch)
            : 0;
      const minutes = Math.round(durationSeconds / 60);
      if (activity.type === 'task') {
        totalWorkMinutes += minutes;
        taskCount++;
      } else {
        totalBreakMinutes += minutes;
      }
    });
  });

  const holidaysInWeek = (holidays || []).filter(h => h.date >= startStr && h.date <= endStr);

  function weekdayFromDateString(dateStr) {
    // dateStr is YYYY-MM-DD
    // Use local midnight to avoid timezone shifting the day name.
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // Group sessions by date and sort deterministically
  const sessionsByDate = {};
  weekSessions.forEach(s => {
    if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
    sessionsByDate[s.date].push(s);
  });
  Object.keys(sessionsByDate).forEach(date => {
    sessionsByDate[date].sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  });

  const holidayByDate = new Map(holidaysInWeek.map(h => [h.date, h.name || ""]));
  const allDates = new Set([...Object.keys(sessionsByDate), ...holidayByDate.keys()]);
  const sortedDates = [...allDates].sort(); // ASC (Mon..Sun order is implied by date)

  const reportUserName = (localStorage.getItem(REPORT_USER_KEY) || "").trim();
  const workstation = (localStorage.getItem(REPORT_WORKSTATION_KEY) || DEFAULT_WORKSTATION).trim();
  const timezone = (localStorage.getItem(REPORT_TIMEZONE_KEY) || DEFAULT_TIMEZONE).trim();
  const totalMinutes = totalWorkMinutes + totalBreakMinutes;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Daily Task Logger";
  workbook.created = new Date();

  // Summary sheet
  const summary = workbook.addWorksheet("Summary", { views: [{ showGridLines: false }] });
  summary.columns = [
    { width: 4 },
    { width: 36 },
    { width: 50 },
    { width: 22 }
  ];

  // Brand header
  summary.getCell("B2").value = REPORT_BRAND.name;
  summary.getCell("B2").font = { size: 16, bold: true };
  summary.getCell("B3").value = REPORT_BRAND.address;
  summary.getCell("B4").value = `Phone: ${REPORT_BRAND.phone}`;
  summary.getCell("B5").value = `Email: ${REPORT_BRAND.email}`;
  summary.getCell("B6").value = `Website: ${REPORT_BRAND.website}`;
  summary.getCell("B8").value = "Weekly Work Log";
  summary.getCell("B8").font = { size: 14, bold: true };

  summary.getCell("B10").value = "Week";
  summary.getCell("C10").value = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  summary.getCell("B11").value = "Generated";
  summary.getCell("C11").value = new Date().toLocaleString();
  summary.getCell("B12").value = "User";
  summary.getCell("C12").value = reportUserName || "(not set)";
  summary.getCell("B13").value = "Workstation";
  summary.getCell("C13").value = workstation || DEFAULT_WORKSTATION;
  summary.getCell("B14").value = "Timezone";
  summary.getCell("C14").value = timezone || DEFAULT_TIMEZONE;

  // Summary metrics table
  const headerRowIdx = 16;
  summary.getCell(`B${headerRowIdx}`).value = "Metric";
  summary.getCell(`C${headerRowIdx}`).value = "Value";
  ["B", "C"].forEach(col => {
    const cell = summary.getCell(`${col}${headerRowIdx}`);
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2FF" } };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  });

  const metrics = [
    ["Total Work Time", `${Math.floor(totalWorkMinutes / 60)}h ${totalWorkMinutes % 60}m`],
    ["Total Break Time", `${Math.floor(totalBreakMinutes / 60)}h ${totalBreakMinutes % 60}m`],
    ["Total Hours", `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`],
    ["Tasks Completed", taskCount],
    ["Days Worked", daysWorked.size],
    ["Holidays (This Week)", holidaysInWeek.length]
  ];
  metrics.forEach((m, i) => {
    const r = headerRowIdx + 1 + i;
    summary.getCell(`B${r}`).value = m[0];
    summary.getCell(`C${r}`).value = m[1];
    ["B", "C"].forEach(col => {
      const cell = summary.getCell(`${col}${r}`);
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });
  });

  // Holidays sheet
  const holidaysSheet = workbook.addWorksheet("Holidays");
  holidaysSheet.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Day", key: "day", width: 14 },
    { header: "Name", key: "name", width: 40 }
  ];
  if (holidaysInWeek.length === 0) {
    holidaysSheet.addRow({ date: "None", day: "", name: "" });
  } else {
    [...holidaysInWeek]
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
      .forEach(h => {
        holidaysSheet.addRow({
          date: h.date,
          day: weekdayFromDateString(h.date),
          name: h.name || "Holiday"
        });
      });
  }
  holidaysSheet.getRow(1).font = { bold: true };

  // Activity Log sheet
  const logSheet = workbook.addWorksheet("Activity Log");
  logSheet.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Day", key: "day", width: 12 },
    { header: "Session Start", key: "sessionStart", width: 12 },
    { header: "Session End", key: "sessionEnd", width: 12 },
    { header: "Activity Type", key: "type", width: 14 },
    { header: "Activity Start", key: "activityStart", width: 12 },
    { header: "Activity End", key: "activityEnd", width: 12 },
    { header: "Duration (min)", key: "duration", width: 14 },
    { header: "Description", key: "description", width: 40 },
    { header: "Project", key: "project", width: 18 },
    { header: "Category", key: "category", width: 18 }
  ];
  logSheet.getRow(1).font = { bold: true };

  const DAY_LABEL_FILL_A = "FFDBEAFE"; // light blue
  const DAY_LABEL_FILL_B = "FFE5E7EB"; // light gray
  const HOLIDAY_LABEL_FILL = "FFFFEDD5"; // light orange
  const GRID_COLOR = "FFE0E0E0";

  function applyThinGrid(row) {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: GRID_COLOR } },
        left: { style: "thin", color: { argb: GRID_COLOR } },
        bottom: { style: "thin", color: { argb: GRID_COLOR } },
        right: { style: "thin", color: { argb: GRID_COLOR } }
      };
    });
  }

  function applyDayStartBorder(row) {
    // Thick top border across the whole row to separate days
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        ...(cell.border || {}),
        top: { style: "thick", color: { argb: "FF9CA3AF" } }
      };
    });
  }

  function styleDayLabelCell(cell, fillArgb) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillArgb } };
    cell.font = { ...(cell.font || {}), bold: true };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  }

  let dayGroupIndex = -1;

  sortedDates.forEach(date => {
    const isHoliday = holidayByDate.has(date);
    const weekday = weekdayFromDateString(date);

    dayGroupIndex += 1;
    const dayLabelFill = dayGroupIndex % 2 === 0 ? DAY_LABEL_FILL_A : DAY_LABEL_FILL_B;
    const dayStartRow = logSheet.rowCount + 1;

    if (isHoliday && (!sessionsByDate[date] || sessionsByDate[date].length === 0)) {
      const row = logSheet.addRow({
        date,
        day: weekday,
        sessionStart: "",
        sessionEnd: "",
        type: "Holiday",
        activityStart: "",
        activityEnd: "",
        duration: "",
        description: holidayByDate.get(date) || "Holiday",
        project: "",
        category: ""
      });
      applyThinGrid(row);
    }

    const sessions = sessionsByDate[date] || [];
    let firstActivityRow = true;
    sessions.forEach(session => {
      const activities = [...(session.activities || [])].sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
      activities.forEach(activity => {
        const durationSeconds =
          typeof activity.duration === "number" && activity.duration > 0
            ? activity.duration
            : activity.startEpoch
              ? secondsSince(activity.startEpoch)
              : 0;
        const durationMin = Math.round(durationSeconds / 60);
        const row = logSheet.addRow({
          date: firstActivityRow ? session.date : "",
          day: firstActivityRow ? weekday : "",
          sessionStart: session.startTime,
          sessionEnd: session.endTime || "In Progress",
          type: activity.type === "task" ? "Task" : "Break",
          activityStart: activity.startTime,
          activityEnd: activity.endTime,
          duration: durationMin,
          description: activity.description,
          project: activity.project,
          category: activity.category
        });
        applyThinGrid(row);
        firstActivityRow = false;
      });
    });

    const dayEndRow = logSheet.rowCount;
    if (dayEndRow >= dayStartRow) {
      // Strong separator at start of each day block
      applyDayStartBorder(logSheet.getRow(dayStartRow));

      // Merge Date + Day cells for the day block (if multiple rows)
      if (dayEndRow > dayStartRow) {
        logSheet.mergeCells(dayStartRow, 1, dayEndRow, 1);
        logSheet.mergeCells(dayStartRow, 2, dayEndRow, 2);
      }

      // Fill/align the day label cells
      const dateCell = logSheet.getCell(dayStartRow, 1);
      const dayCell = logSheet.getCell(dayStartRow, 2);
      const isHolidayOnly = isHoliday && (!sessionsByDate[date] || sessionsByDate[date].length === 0);
      const labelFill = isHolidayOnly ? HOLIDAY_LABEL_FILL : dayLabelFill;
      styleDayLabelCell(dateCell, labelFill);
      styleDayLabelCell(dayCell, labelFill);
    }
  });

  // Freeze header row for log sheet
  logSheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  downloadBlob(blob, `work-log-${startStr}-to-${endStr}.xlsx`);

  await showAlert(
    `Excel file exported successfully!\n\nWeek: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}\nTotal Tasks: ${taskCount}\nWork Time: ${Math.floor(totalWorkMinutes / 60)}h ${totalWorkMinutes % 60}m`,
    "📗 Export Complete"
  );
}

// New flexible export function
async function exportWithOptions() {
  if (typeof ExcelJS === "undefined") {
    await showAlert(
      "Excel export library failed to load. Please check your internet connection and try again.",
      "Export Unavailable"
    );
    return;
  }
  
  const exportType = document.querySelector('input[name="exportType"]:checked').value;
  const includeBreaks = document.getElementById("includeBreaks").checked;
  const includeSummary = document.getElementById("includeSummarySheet").checked;
  const separateSheets = document.getElementById("separateSheetPerProject").checked;
  
  let sessions = [];
  let start, end, startStr, endStr;
  let selectedProjects = [];
  let exportTitle = "";
  
  if (exportType === 'range') {
    const customStart = document.getElementById("exportStartDate").value;
    const customEnd = document.getElementById("exportEndDate").value;
    const range = getExportDateRange(currentExportRange, customStart, customEnd);
    start = range.start;
    end = range.end;
    startStr = range.startStr;
    endStr = range.endStr;
    
    sessions = workSessions.filter(s => s.date >= startStr && s.date <= endStr);
    exportTitle = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  } else {
    selectedProjects = getSelectedProjects();
    if (selectedProjects.length === 0) {
      await showAlert("Please select at least one project to export.", "No Projects Selected");
      return;
    }
    
    const customStart = document.getElementById("projectExportStartDate").value;
    const customEnd = document.getElementById("projectExportEndDate").value;
    const range = getExportDateRange(currentProjectRange, customStart, customEnd);
    start = range.start;
    end = range.end;
    startStr = range.startStr;
    endStr = range.endStr;
    
    sessions = workSessions.filter(s => {
      if (currentProjectRange !== 'all' && (s.date < startStr || s.date > endStr)) return false;
      return s.activities.some(a => selectedProjects.includes(a.project));
    });
    
    exportTitle = selectedProjects.length === 1 
      ? `Project: ${selectedProjects[0]}` 
      : `${selectedProjects.length} Projects`;
  }
  
  if (sessions.length === 0) {
    await showAlert("No data found for the selected criteria.", "No Data");
    return;
  }
  
  // Calculate statistics
  let totalWorkMinutes = 0;
  let totalBreakMinutes = 0;
  let taskCount = 0;
  const daysWorked = new Set();
  const projectStats = {};
  
  sessions.forEach(session => {
    daysWorked.add(session.date);
    session.activities.forEach(activity => {
      if (!includeBreaks && activity.type === 'break') return;
      if (exportType === 'project' && !selectedProjects.includes(activity.project)) return;
      
      const durationSeconds = activity.duration || 0;
      const minutes = Math.round(durationSeconds / 60);
      
      if (activity.type === 'task') {
        totalWorkMinutes += minutes;
        taskCount++;
      } else {
        totalBreakMinutes += minutes;
      }
      
      // Track per-project stats
      const proj = activity.project || 'Unassigned';
      if (!projectStats[proj]) {
        projectStats[proj] = { tasks: 0, workMinutes: 0, breakMinutes: 0 };
      }
      if (activity.type === 'task') {
        projectStats[proj].tasks++;
        projectStats[proj].workMinutes += minutes;
      } else {
        projectStats[proj].breakMinutes += minutes;
      }
    });
  });
  
  const reportUserName = (localStorage.getItem(REPORT_USER_KEY) || "").trim();
  const workstation = (localStorage.getItem(REPORT_WORKSTATION_KEY) || DEFAULT_WORKSTATION).trim();
  const timezone = (localStorage.getItem(REPORT_TIMEZONE_KEY) || DEFAULT_TIMEZONE).trim();
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Daily Task Logger";
  workbook.created = new Date();
  
  // Professional color scheme
  const colors = {
    primary: "FF6366F1",
    primaryDark: "FF1E1B4B",
    secondary: "FF8B5CF6",
    success: "FF10B981",
    successLight: "FFD1FAE5",
    warning: "FFF59E0B",
    warningLight: "FFFEF3C7",
    accent: "FF06B6D4",
    text: "FF1F2937",
    textLight: "FF6B7280",
    headerBg: "FF1E1B4B",
    headerText: "FFFFFFFF",
    cardBg: "FFF8FAFC",
    border: "FFE2E8F0",
    white: "FFFFFFFF"
  };
  
  // Summary sheet
  if (includeSummary) {
    const summary = workbook.addWorksheet("📊 Summary", { views: [{ showGridLines: false }] });
    summary.columns = [
      { width: 3 },   // A - margin
      { width: 24 },  // B - labels
      { width: 22 },  // C - values
      { width: 22 },  // D - extra
      { width: 22 },  // E - extra
      { width: 3 }    // F - margin
    ];
    
    // Company Header Section
    summary.mergeCells("B2:E2");
    summary.getCell("B2").value = REPORT_BRAND.name;
    summary.getCell("B2").font = { size: 20, bold: true, color: { argb: colors.primaryDark } };
    summary.getCell("B2").alignment = { horizontal: "left" };
    
    summary.getCell("B3").value = REPORT_BRAND.address;
    summary.getCell("B3").font = { size: 10, color: { argb: colors.textLight } };
    
    summary.getCell("B4").value = `📞 ${REPORT_BRAND.phone}`;
    summary.getCell("B4").font = { size: 10, color: { argb: colors.textLight } };
    
    summary.getCell("C4").value = `✉️ ${REPORT_BRAND.email}`;
    summary.getCell("C4").font = { size: 10, color: { argb: colors.textLight } };
    
    summary.getCell("D4").value = `🌐 ${REPORT_BRAND.website}`;
    summary.getCell("D4").font = { size: 10, color: { argb: colors.textLight } };
    
    // Divider line
    summary.getRow(5).height = 4;
    ["B", "C", "D", "E"].forEach(col => {
      summary.getCell(`${col}5`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.primary } };
    });
    
    // Report Title Section
    summary.mergeCells("B7:E7");
    summary.getCell("B7").value = exportType === 'range' ? "📋 WORK LOG REPORT" : "📁 PROJECT REPORT";
    summary.getCell("B7").font = { size: 16, bold: true, color: { argb: colors.primaryDark } };
    summary.getCell("B7").alignment = { horizontal: "center" };
    summary.getRow(7).height = 28;
    
    // Report Info Cards
    const infoStartRow = 9;
    const infoData = [
      { label: "📅 Report Period", value: exportTitle },
      { label: "🕐 Generated On", value: new Date().toLocaleString() },
      { label: "👤 Prepared By", value: reportUserName || "—" },
      { label: "🖥️ Workstation", value: workstation },
      { label: "🌍 Timezone", value: timezone }
    ];
    
    infoData.forEach((info, i) => {
      const row = infoStartRow + i;
      summary.getCell(`B${row}`).value = info.label;
      summary.getCell(`B${row}`).font = { bold: true, size: 10, color: { argb: colors.text } };
      summary.getCell(`C${row}`).value = info.value;
      summary.getCell(`C${row}`).font = { size: 10, color: { argb: colors.textLight } };
      summary.mergeCells(`C${row}:E${row}`);
    });
    
    // KPI Cards Section
    const kpiStartRow = infoStartRow + infoData.length + 2;
    summary.mergeCells(`B${kpiStartRow}:E${kpiStartRow}`);
    summary.getCell(`B${kpiStartRow}`).value = "📈 KEY PERFORMANCE INDICATORS";
    summary.getCell(`B${kpiStartRow}`).font = { size: 12, bold: true, color: { argb: colors.primaryDark } };
    summary.getRow(kpiStartRow).height = 24;
    
    // Calculate additional metrics
    const avgWorkPerDay = daysWorked.size > 0 ? Math.round(totalWorkMinutes / daysWorked.size) : 0;
    const avgTasksPerDay = daysWorked.size > 0 ? Math.round((taskCount / daysWorked.size) * 10) / 10 : 0;
    const workBreakRatio = totalBreakMinutes > 0 ? Math.round((totalWorkMinutes / totalBreakMinutes) * 10) / 10 : 0;
    
    const kpis = [
      { 
        icon: "⏱️", 
        label: "Total Work Time", 
        value: `${Math.floor(totalWorkMinutes / 60)}h ${totalWorkMinutes % 60}m`,
        subtext: `(${totalWorkMinutes} minutes)`
      },
      { 
        icon: "☕", 
        label: "Total Break Time", 
        value: `${Math.floor(totalBreakMinutes / 60)}h ${totalBreakMinutes % 60}m`,
        subtext: `(${totalBreakMinutes} minutes)`
      },
      { 
        icon: "✅", 
        label: "Tasks Completed", 
        value: taskCount.toString(),
        subtext: `Avg ${avgTasksPerDay}/day`
      },
      { 
        icon: "📆", 
        label: "Days Worked", 
        value: daysWorked.size.toString(),
        subtext: `Avg ${Math.floor(avgWorkPerDay / 60)}h ${avgWorkPerDay % 60}m/day`
      }
    ];
    
    const kpiRow = kpiStartRow + 2;
    kpis.forEach((kpi, i) => {
      const col = String.fromCharCode(66 + i); // B, C, D, E
      
      // KPI Card background
      summary.getCell(`${col}${kpiRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.cardBg } };
      summary.getCell(`${col}${kpiRow + 1}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.cardBg } };
      summary.getCell(`${col}${kpiRow + 2}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.cardBg } };
      
      // KPI content
      summary.getCell(`${col}${kpiRow}`).value = `${kpi.icon} ${kpi.label}`;
      summary.getCell(`${col}${kpiRow}`).font = { size: 9, color: { argb: colors.textLight } };
      summary.getCell(`${col}${kpiRow}`).alignment = { horizontal: "center" };
      
      summary.getCell(`${col}${kpiRow + 1}`).value = kpi.value;
      summary.getCell(`${col}${kpiRow + 1}`).font = { size: 18, bold: true, color: { argb: colors.primaryDark } };
      summary.getCell(`${col}${kpiRow + 1}`).alignment = { horizontal: "center" };
      
      summary.getCell(`${col}${kpiRow + 2}`).value = kpi.subtext;
      summary.getCell(`${col}${kpiRow + 2}`).font = { size: 8, italic: true, color: { argb: colors.textLight } };
      summary.getCell(`${col}${kpiRow + 2}`).alignment = { horizontal: "center" };
      
      // Add border to KPI card
      [kpiRow, kpiRow + 1, kpiRow + 2].forEach(r => {
        summary.getCell(`${col}${r}`).border = {
          top: r === kpiRow ? { style: "thin", color: { argb: colors.border } } : undefined,
          bottom: r === kpiRow + 2 ? { style: "thin", color: { argb: colors.border } } : undefined,
          left: { style: "thin", color: { argb: colors.border } },
          right: { style: "thin", color: { argb: colors.border } }
        };
      });
    });
    
    summary.getRow(kpiRow).height = 22;
    summary.getRow(kpiRow + 1).height = 32;
    summary.getRow(kpiRow + 2).height = 18;
    
    // Project Breakdown Section
    const projStartRow = kpiRow + 5;
    if (Object.keys(projectStats).length > 0) {
      summary.mergeCells(`B${projStartRow}:E${projStartRow}`);
      summary.getCell(`B${projStartRow}`).value = "📁 PROJECT BREAKDOWN";
      summary.getCell(`B${projStartRow}`).font = { size: 12, bold: true, color: { argb: colors.primaryDark } };
      summary.getRow(projStartRow).height = 24;
      
      // Project table header
      const projHeaderRow = projStartRow + 1;
      ["Project", "Work Time", "Tasks", "% of Total"].forEach((header, i) => {
        const col = String.fromCharCode(66 + i);
        summary.getCell(`${col}${projHeaderRow}`).value = header;
        summary.getCell(`${col}${projHeaderRow}`).font = { bold: true, size: 10, color: { argb: colors.headerText } };
        summary.getCell(`${col}${projHeaderRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.headerBg } };
        summary.getCell(`${col}${projHeaderRow}`).alignment = { horizontal: "center", vertical: "middle" };
        summary.getCell(`${col}${projHeaderRow}`).border = {
          bottom: { style: "medium", color: { argb: colors.primary } }
        };
      });
      summary.getRow(projHeaderRow).height = 24;
      
      // Project data rows
      const sortedProjects = Object.entries(projectStats).sort((a, b) => b[1].workMinutes - a[1].workMinutes);
      sortedProjects.forEach(([proj, stats], i) => {
        const row = projHeaderRow + 1 + i;
        const percentage = totalWorkMinutes > 0 ? Math.round((stats.workMinutes / totalWorkMinutes) * 100) : 0;
        const workTime = `${Math.floor(stats.workMinutes / 60)}h ${stats.workMinutes % 60}m`;
        
        summary.getCell(`B${row}`).value = proj;
        summary.getCell(`B${row}`).font = { size: 10 };
        
        summary.getCell(`C${row}`).value = workTime;
        summary.getCell(`C${row}`).alignment = { horizontal: "center" };
        
        summary.getCell(`D${row}`).value = stats.tasks;
        summary.getCell(`D${row}`).alignment = { horizontal: "center" };
        
        summary.getCell(`E${row}`).value = `${percentage}%`;
        summary.getCell(`E${row}`).alignment = { horizontal: "center" };
        summary.getCell(`E${row}`).font = { bold: true, color: { argb: percentage >= 30 ? colors.success : colors.text } };
        
        // Alternate row colors
        if (i % 2 === 1) {
          ["B", "C", "D", "E"].forEach(col => {
            summary.getCell(`${col}${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.cardBg } };
          });
        }
        
        // Border
        ["B", "C", "D", "E"].forEach(col => {
          summary.getCell(`${col}${row}`).border = {
            bottom: { style: "thin", color: { argb: colors.border } }
          };
        });
      });
    }
    
    // Footer
    const footerRow = projStartRow + Object.keys(projectStats).length + 4;
    summary.mergeCells(`B${footerRow}:E${footerRow}`);
    summary.getCell(`B${footerRow}`).value = `Generated by Daily Task Logger • ${new Date().toLocaleDateString()}`;
    summary.getCell(`B${footerRow}`).font = { size: 8, italic: true, color: { argb: colors.textLight } };
    summary.getCell(`B${footerRow}`).alignment = { horizontal: "center" };
  }
  
  // Daily Summary Sheet
  if (includeSummary && sessions.length > 0) {
    const dailySheet = workbook.addWorksheet("📅 Daily Summary");
    dailySheet.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Day", key: "day", width: 12 },
      { header: "Start Time", key: "startTime", width: 12 },
      { header: "End Time", key: "endTime", width: 12 },
      { header: "Work Time", key: "workTime", width: 14 },
      { header: "Break Time", key: "breakTime", width: 14 },
      { header: "Tasks", key: "tasks", width: 8 },
      { header: "Top Project", key: "topProject", width: 20 },
      { header: "Notes", key: "notes", width: 40 }
    ];
    
    // Style header
    const dailyHeaderRow = dailySheet.getRow(1);
    dailyHeaderRow.height = 28;
    dailyHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: colors.headerText }, size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.headerBg } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = { bottom: { style: "medium", color: { argb: colors.primary } } };
    });
    
    // Group sessions by date and calculate daily stats
    const dailyStats = {};
    sessions.forEach(session => {
      if (!dailyStats[session.date]) {
        dailyStats[session.date] = {
          startTime: session.startTime,
          endTime: session.endTime,
          workMinutes: 0,
          breakMinutes: 0,
          tasks: 0,
          projectMinutes: {}
        };
      }
      const day = dailyStats[session.date];
      if (!day.startTime || (session.startTime && session.startTime < day.startTime)) {
        day.startTime = session.startTime;
      }
      if (!day.endTime || (session.endTime && session.endTime > day.endTime)) {
        day.endTime = session.endTime;
      }
      
      session.activities.forEach(activity => {
        if (!includeBreaks && activity.type === 'break') return;
        if (exportType === 'project' && !selectedProjects.includes(activity.project)) return;
        
        const mins = Math.round((activity.duration || 0) / 60);
        if (activity.type === 'task') {
          day.workMinutes += mins;
          day.tasks++;
          const proj = activity.project || 'Unassigned';
          day.projectMinutes[proj] = (day.projectMinutes[proj] || 0) + mins;
        } else {
          day.breakMinutes += mins;
        }
      });
    });
    
    // Add daily rows
    const sortedDates = Object.keys(dailyStats).sort();
    let totalWorkMins = 0, totalBreakMins = 0, totalTasksCount = 0;
    
    sortedDates.forEach((date, i) => {
      const stats = dailyStats[date];
      const weekday = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
      const topProject = Object.entries(stats.projectMinutes).sort((a, b) => b[1] - a[1])[0];
      
      totalWorkMins += stats.workMinutes;
      totalBreakMins += stats.breakMinutes;
      totalTasksCount += stats.tasks;
      
      const row = dailySheet.addRow({
        date: date,
        day: weekday,
        startTime: stats.startTime || "—",
        endTime: stats.endTime || "—",
        workTime: `${Math.floor(stats.workMinutes / 60)}h ${stats.workMinutes % 60}m`,
        breakTime: `${Math.floor(stats.breakMinutes / 60)}h ${stats.breakMinutes % 60}m`,
        tasks: stats.tasks,
        topProject: topProject ? topProject[0] : "—",
        notes: ""
      });
      
      row.height = 22;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.alignment = { vertical: "middle" };
        cell.border = { bottom: { style: "thin", color: { argb: colors.border } } };
        if (i % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.cardBg } };
        }
      });
      
      // Highlight work time column
      row.getCell(5).font = { bold: true, color: { argb: colors.success } };
    });
    
    // Totals row
    const totalRow = dailySheet.addRow({
      date: "TOTAL",
      day: `${sortedDates.length} days`,
      startTime: "",
      endTime: "",
      workTime: `${Math.floor(totalWorkMins / 60)}h ${totalWorkMins % 60}m`,
      breakTime: `${Math.floor(totalBreakMins / 60)}h ${totalBreakMins % 60}m`,
      tasks: totalTasksCount,
      topProject: "",
      notes: ""
    });
    
    totalRow.height = 28;
    totalRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true, color: { argb: colors.headerText } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.headerBg } };
      cell.border = { top: { style: "medium", color: { argb: colors.primary } } };
    });
    
    dailySheet.views = [{ state: "frozen", ySplit: 1 }];
    dailySheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: sortedDates.length + 1, column: 9 } };
  }
  
  // Activity Log sheet(s)
  if (separateSheets && exportType === 'project') {
    // Create separate sheet per project
    selectedProjects.forEach(project => {
      createActivityLogSheet(workbook, sessions, project, includeBreaks, [project]);
    });
  } else {
    // Single activity log sheet
    createActivityLogSheet(workbook, sessions, "📋 Activity Log", includeBreaks, exportType === 'project' ? selectedProjects : null);
  }
  
  const fileName = exportType === 'range' 
    ? `work-log-${startStr}-to-${endStr}.xlsx`
    : `project-report-${selectedProjects.slice(0, 2).join('-').replace(/[^a-zA-Z0-9-]/g, '')}.xlsx`;
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  downloadBlob(blob, fileName);
  
  closeExportModal();
  
  await showAlert(
    `Excel file exported successfully!\n\n${exportTitle}\nTotal Tasks: ${taskCount}\nWork Time: ${Math.floor(totalWorkMinutes / 60)}h ${totalWorkMinutes % 60}m`,
    "📗 Export Complete"
  );
}

// Create activity log sheet (helper for export)
function createActivityLogSheet(workbook, sessions, sheetName, includeBreaks, filterProjects) {
  const logSheet = workbook.addWorksheet(sheetName);
  
  // Define professional color scheme
  const colors = {
    primary: "FF6366F1",      // Indigo
    primaryDark: "FF4F46E5",  // Darker indigo
    secondary: "FF8B5CF6",    // Purple
    success: "FF10B981",      // Green
    warning: "FFF59E0B",      // Amber
    accent: "FF06B6D4",       // Cyan
    headerBg: "FF1E1B4B",     // Dark indigo
    headerText: "FFFFFFFF",   // White
    altRow: "FFF8FAFC",       // Light gray
    border: "FFE2E8F0",       // Border gray
    taskBg: "FFECFDF5",       // Light green
    breakBg: "FFFEF3C7"       // Light amber
  };
  
  // Set up columns with optimal widths
  logSheet.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Day", key: "day", width: 11 },
    { header: "Session", key: "session", width: 14 },
    { header: "Type", key: "type", width: 10 },
    { header: "Start Time", key: "activityStart", width: 11 },
    { header: "End Time", key: "activityEnd", width: 11 },
    { header: "Duration", key: "durationFormatted", width: 12 },
    { header: "Minutes", key: "duration", width: 10 },
    { header: "Description", key: "description", width: 50 },
    { header: "Project", key: "project", width: 18 },
    { header: "Category", key: "category", width: 14 },
    { header: "Status", key: "status", width: 10 }
  ];
  
  // Style header row
  const headerRow = logSheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: colors.headerText }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.headerBg } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      bottom: { style: "medium", color: { argb: colors.primary } }
    };
  });
  
  const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  let rowIndex = 1;
  let currentDateGroup = "";
  
  sortedSessions.forEach(session => {
    const weekday = new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    const isNewDate = session.date !== currentDateGroup;
    currentDateGroup = session.date;
    
    const sortedActivities = [...(session.activities || [])].sort((a, b) => 
      (a.startTime || "").localeCompare(b.startTime || "")
    );
    
    let isFirstActivityInSession = true;
    
    sortedActivities.forEach(activity => {
      if (!includeBreaks && activity.type === 'break') return;
      if (filterProjects && !filterProjects.includes(activity.project)) return;
      
      rowIndex++;
      const durationMin = Math.round((activity.duration || 0) / 60);
      const hours = Math.floor(durationMin / 60);
      const mins = durationMin % 60;
      const durationFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      const status = activity.status || (activity.type === 'task' ? 'completed' : '');
      const sessionTime = session.startTime && session.endTime 
        ? `${session.startTime} - ${session.endTime}`
        : session.startTime || "—";
      
      const row = logSheet.addRow({
        date: isFirstActivityInSession ? session.date : "",
        day: isFirstActivityInSession ? weekday : "",
        session: isFirstActivityInSession ? sessionTime : "",
        type: activity.type === "task" ? "📋 Task" : "☕ Break",
        activityStart: activity.startTime || "—",
        activityEnd: activity.endTime || "—",
        durationFormatted: durationFormatted,
        duration: durationMin,
        description: activity.description || "—",
        project: activity.project || "—",
        category: activity.category || "—",
        status: status === 'completed' ? '✓ Done' : status === 'paused' ? '⏸ Paused' : ''
      });
      
      row.height = 22;
      
      // Apply styling based on activity type and row position
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.alignment = { vertical: "middle", wrapText: colNumber === 9 };
        cell.border = {
          bottom: { style: "thin", color: { argb: colors.border } }
        };
        
        // Background based on type
        if (activity.type === 'task') {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowIndex % 2 === 0 ? colors.taskBg : "FFFFFFFF" } };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.breakBg } };
        }
      });
      
      // Style type cell with color
      const typeCell = row.getCell(4);
      typeCell.font = { 
        bold: true, 
        color: { argb: activity.type === 'task' ? colors.success : colors.warning } 
      };
      
      // Style duration cell
      const durationCell = row.getCell(7);
      durationCell.font = { bold: true };
      durationCell.alignment = { horizontal: "center" };
      
      // Style status cell
      const statusCell = row.getCell(12);
      if (status === 'completed') {
        statusCell.font = { color: { argb: colors.success } };
      }
      
      // Add date group separator styling
      if (isNewDate && isFirstActivityInSession) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: "medium", color: { argb: colors.primary } },
            bottom: { style: "thin", color: { argb: colors.border } }
          };
        });
      }
      
      isFirstActivityInSession = false;
    });
  });
  
  // Add totals row
  if (rowIndex > 1) {
    const totalRow = logSheet.addRow({
      date: "",
      day: "",
      session: "",
      type: "",
      activityStart: "",
      activityEnd: "TOTAL:",
      durationFormatted: "",
      duration: { formula: `SUM(H2:H${rowIndex})` },
      description: "",
      project: "",
      category: "",
      status: ""
    });
    
    totalRow.height = 28;
    totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.headerBg } };
      cell.font = { bold: true, color: { argb: colors.headerText } };
      cell.border = {
        top: { style: "medium", color: { argb: colors.primary } }
      };
    });
    
    const totalLabelCell = totalRow.getCell(6);
    totalLabelCell.alignment = { horizontal: "right" };
  }
  
  // Freeze header row and add autofilter
  logSheet.views = [{ state: "frozen", ySplit: 1 }];
  logSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: rowIndex + 1, column: 12 }
  };
}

// ==================== REMINDER SYSTEM ====================

// Initialize reminder system
function initReminderSystem() {
  loadReminderSettings();
  startReminderTimers();
  
  // Request notification permission if enabled
  if (reminderSettings.browserNotifications.enabled && 'Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

// Load reminder settings from localStorage
function loadReminderSettings() {
  const saved = safeLoadJson("reminderSettings", null);
  if (saved) {
    reminderSettings = saved;
  }
  
  // Update UI with saved settings (with null checks)
  if (breakReminderEnabled) breakReminderEnabled.checked = reminderSettings.breakReminder?.enabled ?? true;
  if (breakReminderInterval) breakReminderInterval.value = reminderSettings.breakReminder?.interval ?? 60;
  if (idleDetectionEnabled) idleDetectionEnabled.checked = reminderSettings.idleDetection?.enabled ?? true;
  if (idleThreshold) idleThreshold.value = reminderSettings.idleDetection?.threshold ?? 10;
  if (endOfDayEnabled) endOfDayEnabled.checked = reminderSettings.endOfDay?.enabled ?? false;
  if (endOfDayTime) endOfDayTime.value = reminderSettings.endOfDay?.time ?? "18:00";
  if (pomodoroEnabled) pomodoroEnabled.checked = reminderSettings.pomodoro?.enabled ?? false;
  if (pomodoroWorkDuration) pomodoroWorkDuration.value = reminderSettings.pomodoro?.workDuration ?? 25;
  if (pomodoroShortBreak) pomodoroShortBreak.value = reminderSettings.pomodoro?.shortBreak ?? 5;
  if (pomodoroLongBreak) pomodoroLongBreak.value = reminderSettings.pomodoro?.longBreak ?? 15;
  if (soundEnabled) soundEnabled.checked = reminderSettings.sound?.enabled ?? true;
  if (alertSoundSelect) alertSoundSelect.value = reminderSettings.sound?.type ?? "bell";
  if (soundVolume) soundVolume.value = reminderSettings.sound?.volume ?? 70;
  if (volumeDisplay) volumeDisplay.textContent = (reminderSettings.sound?.volume ?? 70) + '%';
  if (browserNotificationsEnabled) browserNotificationsEnabled.checked = reminderSettings.browserNotifications?.enabled ?? false;
}

// Save reminder settings to localStorage
function saveReminderSettings() {
  if (!reminderSettings.breakReminder) reminderSettings.breakReminder = {};
  if (!reminderSettings.idleDetection) reminderSettings.idleDetection = {};
  if (!reminderSettings.endOfDay) reminderSettings.endOfDay = {};
  if (!reminderSettings.pomodoro) reminderSettings.pomodoro = {};
  if (!reminderSettings.sound) reminderSettings.sound = {};
  if (!reminderSettings.browserNotifications) reminderSettings.browserNotifications = {};
  
  if (breakReminderEnabled) reminderSettings.breakReminder.enabled = breakReminderEnabled.checked;
  if (breakReminderInterval) reminderSettings.breakReminder.interval = parseInt(breakReminderInterval.value);
  if (idleDetectionEnabled) reminderSettings.idleDetection.enabled = idleDetectionEnabled.checked;
  if (idleThreshold) reminderSettings.idleDetection.threshold = parseInt(idleThreshold.value);
  if (endOfDayEnabled) reminderSettings.endOfDay.enabled = endOfDayEnabled.checked;
  if (endOfDayTime) reminderSettings.endOfDay.time = endOfDayTime.value;
  if (pomodoroEnabled) reminderSettings.pomodoro.enabled = pomodoroEnabled.checked;
  if (pomodoroWorkDuration) reminderSettings.pomodoro.workDuration = parseInt(pomodoroWorkDuration.value);
  if (pomodoroShortBreak) reminderSettings.pomodoro.shortBreak = parseInt(pomodoroShortBreak.value);
  if (pomodoroLongBreak) reminderSettings.pomodoro.longBreak = parseInt(pomodoroLongBreak.value);
  if (soundEnabled) reminderSettings.sound.enabled = soundEnabled.checked;
  if (alertSoundSelect) reminderSettings.sound.type = alertSoundSelect.value;
  if (soundVolume) reminderSettings.sound.volume = parseInt(soundVolume.value);
  if (browserNotificationsEnabled) reminderSettings.browserNotifications.enabled = browserNotificationsEnabled.checked;
  
  localStorage.setItem("reminderSettings", JSON.stringify(reminderSettings));
  triggerFirebaseSync();
  
  // Restart timers with new settings
  stopReminderTimers();
  startReminderTimers();
}

// Start all reminder timers
function startReminderTimers() {
  stopReminderTimers();
  
  // Check every 30 seconds for all reminders
  reminderTimers.breakCheck = setInterval(checkBreakReminder, 30000);
  reminderTimers.idleCheck = setInterval(checkIdleDetection, 30000);
  reminderTimers.endOfDayCheck = setInterval(checkEndOfDayReminder, 60000);
  reminderTimers.pomodoroCheck = setInterval(checkPomodoroTimer, 1000);
}

// Stop all reminder timers
function stopReminderTimers() {
  Object.values(reminderTimers).forEach(timer => {
    if (timer) clearInterval(timer);
  });
}

// Update last activity time (call this whenever user interacts)
function updateActivityTime() {
  lastActivityTime = Date.now();
}

// Check if it's time for a break reminder
function checkBreakReminder() {
  if (!reminderSettings.breakReminder.enabled) return;
  if (!currentActivity) return;
  if (currentActivity.type === 'break') return;
  if (currentSnoozedUntil && Date.now() < currentSnoozedUntil) return;
  
  const intervalMs = reminderSettings.breakReminder.interval * 60 * 1000;
  const timeSinceLastBreak = Date.now() - lastBreakReminderTime;
  
  if (timeSinceLastBreak >= intervalMs) {
    showBreakReminder();
    lastBreakReminderTime = Date.now();
  }
}

// Check for idle detection
function checkIdleDetection() {
  if (!reminderSettings.idleDetection.enabled) return;
  if (!activeWorkSession) return;
  if (currentActivity) return; // Only check when no activity is running
  if (currentSnoozedUntil && Date.now() < currentSnoozedUntil) return;
  
  const thresholdMs = reminderSettings.idleDetection.threshold * 60 * 1000;
  const idleTime = Date.now() - lastActivityTime;
  
  if (idleTime >= thresholdMs) {
    showIdleReminder();
    lastActivityTime = Date.now(); // Reset to avoid spam
  }
}

// Check end of day reminder
function checkEndOfDayReminder() {
  if (!reminderSettings.endOfDay.enabled) return;
  if (!activeWorkSession) return;
  if (currentSnoozedUntil && Date.now() < currentSnoozedUntil) return;
  
  const now = new Date();
  const [hours, minutes] = reminderSettings.endOfDay.time.split(':').map(Number);
  const targetTime = new Date();
  targetTime.setHours(hours, minutes, 0, 0);
  
  // Check if within 1 minute of target time
  const diff = Math.abs(now - targetTime);
  if (diff < 60000) {
    showEndOfDayReminder();
    currentSnoozedUntil = Date.now() + (60 * 60 * 1000); // Snooze for 1 hour to avoid spam
  }
}

// Check Pomodoro timer
function checkPomodoroTimer() {
  if (!reminderSettings.pomodoro.enabled) return;
  if (!pomodoroStartTime) return;
  if (!pomodoroState) return;
  
  const elapsed = Math.floor((Date.now() - pomodoroStartTime) / 1000);
  let targetDuration;
  
  if (pomodoroState === 'work') {
    targetDuration = reminderSettings.pomodoro.workDuration * 60;
  } else if (pomodoroState === 'shortBreak') {
    targetDuration = reminderSettings.pomodoro.shortBreak * 60;
  } else if (pomodoroState === 'longBreak') {
    targetDuration = reminderSettings.pomodoro.longBreak * 60;
  }
  
  if (elapsed >= targetDuration) {
    handlePomodoroComplete();
  }
}

// Start Pomodoro session
function startPomodoroSession() {
  if (!reminderSettings.pomodoro.enabled) return;
  
  pomodoroStartTime = Date.now();
  pomodoroState = 'work';
}

// Handle Pomodoro completion
function handlePomodoroComplete() {
  playReminderSound();
  
  if (pomodoroState === 'work') {
    reminderSettings.pomodoro.sessionsCompleted++;
    
    // Long break after 4 sessions
    if (reminderSettings.pomodoro.sessionsCompleted % 4 === 0) {
      showPomodoroBreakReminder('long');
    } else {
      showPomodoroBreakReminder('short');
    }
  } else {
    // Break completed, time to work
    showPomodoroWorkReminder();
  }
  
  pomodoroStartTime = null;
  pomodoroState = null;
  saveReminderSettings();
}

// Show break reminder
function showBreakReminder() {
  const workDuration = currentActivity ? Math.floor((Date.now() - currentActivity.startEpoch) / 60000) : 0;
  
  showReminderModal(
    "⏰ Time for a Break!",
    `You've been working for ${workDuration} minutes. Taking regular breaks helps maintain focus and productivity.`,
    [
      { label: "Take a Break", action: () => { dismissReminder(); startBreakActivity(); } },
      { label: "Keep Working", action: dismissReminder, secondary: true }
    ]
  );
  
  sendBrowserNotification("Time for a Break!", "You've been working continuously. Consider taking a short break.");
}

// Show idle reminder
function showIdleReminder() {
  showReminderModal(
    "📝 Still Working?",
    "No activity has been logged for a while. Are you still working, or did you forget to log your task?",
    [
      { label: "Log Current Task", action: () => { dismissReminder(); openTaskModal(); } },
      { label: "I'm on Break", action: () => { dismissReminder(); startBreakActivity(); } },
      { label: "Dismiss", action: dismissReminder, secondary: true }
    ]
  );
  
  sendBrowserNotification("Activity Check", "No activity logged recently. Don't forget to track your work!");
}

// Show end of day reminder
function showEndOfDayReminder() {
  const totalMinutes = calculateTodayWorkMinutes();
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  showReminderModal(
    "🌙 End of Work Day",
    `It's ${reminderSettings.endOfDay.time}. You've worked ${hours}h ${minutes}m today. Time to wrap up?`,
    [
      { label: "End Work Day", action: () => { dismissReminder(); endWorkDay(); } },
      { label: "Continue Working", action: dismissReminder, secondary: true }
    ]
  );
  
  sendBrowserNotification("End of Day", `You've worked ${hours}h ${minutes}m today.`);
}

// Show Pomodoro break reminder
function showPomodoroBreakReminder(type) {
  const duration = type === 'long' ? reminderSettings.pomodoro.longBreak : reminderSettings.pomodoro.shortBreak;
  const sessions = reminderSettings.pomodoro.sessionsCompleted;
  
  showReminderModal(
    "🍅 Pomodoro Break Time!",
    `Great work! You've completed ${sessions} Pomodoro session${sessions > 1 ? 's' : ''}. Time for a ${duration}-minute ${type} break.`,
    [
      { label: `Start ${duration}min Break`, action: () => { dismissReminder(); startPomodoroBreak(type); } },
      { label: "Skip Break", action: () => { dismissReminder(); startPomodoroSession(); } }
    ]
  );
  
  sendBrowserNotification("Pomodoro Complete!", `Time for a ${duration}-minute break.`);
}

// Show Pomodoro work reminder
function showPomodoroWorkReminder() {
  showReminderModal(
    "🍅 Break Over!",
    `Your break is complete. Ready to start another ${reminderSettings.pomodoro.workDuration}-minute work session?`,
    [
      { label: "Start Work Session", action: () => { dismissReminder(); startPomodoroSession(); openTaskModal(); } },
      { label: "Take More Time", action: dismissReminder, secondary: true }
    ]
  );
  
  sendBrowserNotification("Pomodoro Break Complete", "Time to get back to work!");
}

// Start Pomodoro break
function startPomodoroBreak(type) {
  pomodoroStartTime = Date.now();
  pomodoroState = type === 'long' ? 'longBreak' : 'shortBreak';
  
  // If currently working, stop and start break activity
  if (currentActivity && currentActivity.type === 'task') {
    stopCurrentActivity();
  }
  startBreakActivity();
}

// Start break activity (helper)
function startBreakActivity() {
  breakBtn.click();
}

// Calculate today's work minutes
function calculateTodayWorkMinutes() {
  const today = formatDate(new Date());
  const todaySessions = workSessions.filter(s => s.date === today);
  
  let totalMinutes = 0;
  todaySessions.forEach(session => {
    session.activities.forEach(activity => {
      if (activity.type === 'task' && activity.duration) {
        totalMinutes += Math.round(activity.duration / 60);
      }
    });
  });
  
  return totalMinutes;
}

// Show reminder modal
function showReminderModal(title, message, actions) {
  playReminderSound();
  
  reminderTitle.textContent = title;
  reminderMessage.textContent = message;
  
  // Clear previous actions
  reminderActions.innerHTML = '';
  
  // Add action buttons
  actions.forEach(action => {
    const btn = document.createElement('button');
    btn.className = action.secondary ? 'reminder-action-btn secondary' : 'reminder-action-btn';
    btn.textContent = action.label;
    btn.onclick = action.action;
    reminderActions.appendChild(btn);
  });
  
  reminderModal.classList.remove('hidden');
}

// Dismiss reminder
function dismissReminder() {
  reminderModal.classList.add('hidden');
  currentSnoozedUntil = null;
}

// Snooze reminder
function snoozeReminder(minutes) {
  currentSnoozedUntil = Date.now() + (minutes * 60 * 1000);
  dismissReminder();
}

// Play reminder sound
function playReminderSound() {
  if (!reminderSettings.sound.enabled) return;
  
  try {
    // Create audio context if not exists
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const volume = reminderSettings.sound.volume / 100;
    const soundType = reminderSettings.sound.type;
    
    // Different sound implementations
    switch (soundType) {
      case 'bell':
        playBellSound(volume);
        break;
      case 'chime':
        playChimeSound(volume);
        break;
      case 'gentle':
        playGentleSound(volume);
        break;
      case 'digital':
        playDigitalSound(volume);
        break;
      case 'piano':
        playPianoSound(volume);
        break;
      case 'harp':
        playHarpSound(volume);
        break;
      case 'marimba':
        playMarimbaSound(volume);
        break;
      case 'whistle':
        playWhistleSound(volume);
        break;
      case 'ding':
        playDingSound(volume);
        break;
      case 'zen':
        playZenSound(volume);
        break;
      default:
        playBellSound(volume);
    }
  } catch (error) {
    console.log('Audio playback failed:', error);
  }
}

// Individual sound generators
function playBellSound(volume) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gainNode.gain.value = volume * 0.3;
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

function playChimeSound(volume) {
  [1000, 1200, 1500].forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = volume * 0.2;
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3 + i * 0.1);
    osc.start(audioContext.currentTime + i * 0.1);
    osc.stop(audioContext.currentTime + 0.4 + i * 0.1);
  });
}

function playGentleSound(volume) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = 400;
  oscillator.type = 'sine';
  gainNode.gain.value = volume * 0.15;
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 1.2);
}

function playDigitalSound(volume) {
  [1200, 900, 1200].forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.value = volume * 0.1;
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15 + i * 0.08);
    osc.start(audioContext.currentTime + i * 0.08);
    osc.stop(audioContext.currentTime + 0.15 + i * 0.08);
  });
}

function playPianoSound(volume) {
  [523, 659, 784].forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = freq;
    osc.type = 'triangle';
    gain.gain.value = volume * 0.25;
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6 + i * 0.15);
    osc.start(audioContext.currentTime + i * 0.15);
    osc.stop(audioContext.currentTime + 0.7 + i * 0.15);
  });
}

function playHarpSound(volume) {
  [392, 494, 587, 784].forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = volume * 0.2;
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8 + i * 0.12);
    osc.start(audioContext.currentTime + i * 0.12);
    osc.stop(audioContext.currentTime + 0.9 + i * 0.12);
  });
}

function playMarimbaSound(volume) {
  [700, 880, 700].forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = volume * 0.35;
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15 + i * 0.12);
    osc.start(audioContext.currentTime + i * 0.12);
    osc.stop(audioContext.currentTime + 0.2 + i * 0.12);
  });
}

function playWhistleSound(volume) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.frequency.value = 1800;
  osc.frequency.exponentialRampToValueAtTime(2400, audioContext.currentTime + 0.15);
  osc.frequency.exponentialRampToValueAtTime(1800, audioContext.currentTime + 0.3);
  osc.type = 'sine';
  gain.gain.value = volume * 0.15;
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.35);
}

function playDingSound(volume) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.frequency.value = 1500;
  osc.type = 'sine';
  gain.gain.value = volume * 0.3;
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.4);
}

function playZenSound(volume) {
  [220, 330, 440].forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = volume * 0.12;
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
    osc.start(audioContext.currentTime + i * 0.3);
    osc.stop(audioContext.currentTime + 1.5 + i * 0.3);
  });
}

// Send browser notification
function sendBrowserNotification(title, body) {
  if (!reminderSettings.browserNotifications.enabled) return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  
  try {
    new Notification(title, {
      body: body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">⏰</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">📝</text></svg>'
    });
  } catch (error) {
    console.log('Notification failed:', error);
  }
}

// Test sound
function testSound() {
  playReminderSound();
}

// Request notification permission
async function requestNotifications() {
  if (!('Notification' in window)) {
    await showAlert("Your browser doesn't support notifications.", "Not Supported");
    return;
  }
  
  // Check if already granted
  if (Notification.permission === 'granted') {
    browserNotificationsEnabled.checked = true;
    reminderSettings.browserNotifications.enabled = true;
    saveReminderSettings();
    await showAlert("Notifications are already enabled!", "✅ Already Enabled");
    return;
  }
  
  // Check if denied
  if (Notification.permission === 'denied') {
    await showAlert("Notification permission was previously denied. Please enable it in your browser settings.", "⚠️ Permission Denied");
    return;
  }
  
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    browserNotificationsEnabled.checked = true;
    reminderSettings.browserNotifications.enabled = true;
    saveReminderSettings();
    await showAlert("Notifications enabled! You'll now receive reminders even when the app is in the background.", "✅ Enabled");
  } else {
    await showAlert("Notification permission denied. You can enable it later in your browser settings.", "Permission Denied");
  }
}

// Reset data (clear current week only)
async function resetData() {
  const { start, end } = getWeekRange(currentWeekOffset);
  const startStr = formatDate(start);
  const endStr = formatDate(end);

  const confirmMsg = `Reset data for the week: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}?\n\nThis will delete all work sessions for this week only.`;

  const confirmed = await showConfirm(confirmMsg, "🔄 Reset Current Week");
  if (confirmed) {
    // Filter out sessions from current week
    const remainingSessions = workSessions.filter(session => {
      return session.date < startStr || session.date > endStr;
    });

    const deletedCount = workSessions.length - remainingSessions.length;
    workSessions = remainingSessions;

    localStorage.setItem("workSessions", JSON.stringify(workSessions));

    // If currently viewing deleted week, end any active session
    if (currentSession) {
      currentSession = null;
      currentActivity = null;
      stopSessionTimer();
      stopActivityTimer();
      startWorkBtn.disabled = false;
      endWorkBtn.disabled = true;
      stopActivityBtn.disabled = true;
      sessionStatus.textContent = "Not Started";
      workSessionInfo.classList.add("hidden");
      currentActivityDiv.classList.add("hidden");
    }

    renderWeekView();
    await showAlert(`Week data reset successfully!\n\n${deletedCount} work session(s) deleted.`, "Reset Complete");
  }
}

// Clear all data
async function clearAllData() {
  const confirmed = await showConfirm("Are you sure you want to clear ALL data?\n\nThis will permanently delete all work sessions from all weeks and cannot be undone.", "⚠️ Clear All History");
  if (confirmed) {
    workSessions = [];
    currentSession = null;
    currentActivity = null;
    localStorage.removeItem("workSessions");
    location.reload();
  }
}

// Stop Activity Confirmation Modal Elements
const stopActivityModal = document.getElementById("stopActivityModal");
const closeStopActivityModalBtn = document.getElementById("closeStopActivityModalBtn");
const cancelStopActivityBtn = document.getElementById("cancelStopActivityBtn");
const confirmStopActivityBtn = document.getElementById("confirmStopActivityBtn");
const stopActivityDetails = document.getElementById("stopActivityDetails");

// Function to show stop activity confirmation
function showStopActivityConfirmation() {
  // Build details message
  let details = "";
  if (currentActivity) {
    const activityType = currentActivity.type === "task" ? "Task" : "Break";
    const elapsed = formatDuration(Math.floor((Date.now() - currentActivity.startTime) / 1000));
    details = `<strong>${activityType}</strong> in progress for <strong>${elapsed}</strong>`;
    if (currentActivity.description) {
      details += `<br><em>"${currentActivity.description}"</em>`;
    }
  }
  stopActivityDetails.innerHTML = details;
  stopActivityModal.classList.remove("hidden");
}

// Function to hide stop activity confirmation
function hideStopActivityConfirmation() {
  stopActivityModal.classList.add("hidden");
}

// Stop Activity Modal Event Listeners
closeStopActivityModalBtn.addEventListener("click", hideStopActivityConfirmation);
cancelStopActivityBtn.addEventListener("click", hideStopActivityConfirmation);
confirmStopActivityBtn.addEventListener("click", () => {
  hideStopActivityConfirmation();
  stopCurrentActivity();
});
stopActivityModal.addEventListener("click", (e) => {
  if (e.target === stopActivityModal) {
    hideStopActivityConfirmation();
  }
});

// Event listeners
startWorkBtn.addEventListener("click", startWorkDay);
endWorkBtn.addEventListener("click", endWorkDay);
stopActivityBtn.addEventListener("click", showStopActivityConfirmation);

prevWeekBtn.addEventListener("click", () => {
  currentWeekOffset--;
  renderWeekView();
});

nextWeekBtn.addEventListener("click", () => {
  currentWeekOffset++;
  renderWeekView();
});

currentWeekBtn.addEventListener("click", () => {
  currentWeekOffset = 0;
  renderWeekView();
});

// Export modal button
openExportModalBtn.addEventListener("click", openExportModal);
resetDataBtn.addEventListener("click", resetData);
clearDataBtn.addEventListener("click", clearAllData);

// Goals Modal event listeners
const setGoalsBtn = document.getElementById("setGoalsBtn");
const closeGoalsModalBtn = document.getElementById("closeGoalsModalBtn");
const cancelGoalsBtn = document.getElementById("cancelGoalsBtn");
const saveGoalsBtn = document.getElementById("saveGoalsBtn");

if (setGoalsBtn) setGoalsBtn.addEventListener("click", openGoalsModal);
if (closeGoalsModalBtn) closeGoalsModalBtn.addEventListener("click", closeGoalsModal);
if (cancelGoalsBtn) cancelGoalsBtn.addEventListener("click", closeGoalsModal);
if (saveGoalsBtn) saveGoalsBtn.addEventListener("click", saveGoals);

// Export Modal event listeners
document.getElementById("closeExportModalBtn").addEventListener("click", closeExportModal);
document.getElementById("cancelExportBtn").addEventListener("click", closeExportModal);
document.getElementById("confirmExportBtn").addEventListener("click", exportWithOptions);

// Export type radio buttons
document.querySelectorAll('input[name="exportType"]').forEach(radio => {
  radio.addEventListener("change", handleExportTypeChange);
});

// Quick range buttons
document.querySelectorAll(".quick-range-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".quick-range-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentExportRange = btn.dataset.range;
    
    const customDateRange = document.getElementById("customDateRange");
    if (currentExportRange === 'custom') {
      customDateRange.classList.remove("hidden");
    } else {
      customDateRange.classList.add("hidden");
    }
    updateExportPreview();
  });
});

// Project range buttons
document.querySelectorAll(".project-range-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".project-range-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentProjectRange = btn.dataset.range;
    
    const projectCustomDateRange = document.getElementById("projectCustomDateRange");
    if (currentProjectRange === 'custom') {
      projectCustomDateRange.classList.remove("hidden");
    } else {
      projectCustomDateRange.classList.add("hidden");
    }
    updateExportPreview();
  });
});

// Select/deselect all projects
document.getElementById("selectAllProjects").addEventListener("click", () => {
  document.querySelectorAll("#projectCheckboxList input[type='checkbox']").forEach(cb => cb.checked = true);
  updateExportPreview();
});
document.getElementById("deselectAllProjects").addEventListener("click", () => {
  document.querySelectorAll("#projectCheckboxList input[type='checkbox']").forEach(cb => cb.checked = false);
  updateExportPreview();
});

// Export date inputs change
document.getElementById("exportStartDate").addEventListener("change", updateExportPreview);
document.getElementById("exportEndDate").addEventListener("change", updateExportPreview);
document.getElementById("projectExportStartDate").addEventListener("change", updateExportPreview);
document.getElementById("projectExportEndDate").addEventListener("change", updateExportPreview);

// Close export modal when clicking outside
exportModal.addEventListener("click", (e) => {
  if (e.target === exportModal) closeExportModal();
});

// Settings event listeners
settingsBtn.addEventListener("click", openSettings);
closeSettingsBtn.addEventListener("click", closeSettings);
saveSettingsBtn.addEventListener("click", () => {
  saveReportUserName();
  saveReportContext();
  saveReminderSettings(); // Save reminder settings
  saveBranding(); // Save branding settings
  updatePersonalizedHeader(); // Update header with new settings
  closeSettings();
});
addProjectBtn.addEventListener("click", addProject);
addCategoryBtn.addEventListener("click", addCategory);
if (addHolidayBtn) addHolidayBtn.addEventListener("click", addHoliday);

// Reminder settings event listeners (with null checks)
if (soundVolume) {
  soundVolume.addEventListener("input", (e) => {
    if (volumeDisplay) volumeDisplay.textContent = e.target.value + '%';
  });
}

if (testSoundBtn) testSoundBtn.addEventListener("click", testSound);
if (requestNotificationPermission) requestNotificationPermission.addEventListener("click", requestNotifications);

// Auto-save reminder settings on change (with null checks)
[breakReminderEnabled, breakReminderInterval, idleDetectionEnabled, idleThreshold,
 endOfDayEnabled, endOfDayTime, pomodoroEnabled, pomodoroWorkDuration, pomodoroShortBreak,
 pomodoroLongBreak, soundEnabled, alertSoundSelect, soundVolume, browserNotificationsEnabled]
 .filter(elem => elem !== null)
 .forEach(elem => {
  elem.addEventListener("change", saveReminderSettings);
});

// Reminder modal event listeners (with null checks)
if (dismissReminderBtn) dismissReminderBtn.addEventListener("click", dismissReminder);
document.querySelectorAll(".btn-snooze").forEach(btn => {
  btn.addEventListener("click", () => {
    snoozeReminder(parseInt(btn.dataset.minutes));
  });
});
if (reminderModal) {
  reminderModal.addEventListener("click", (e) => {
    if (e.target === reminderModal) dismissReminder();
  });
}

// Allow Enter key to add project/category
newProjectInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addProject();
});

newCategoryInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addCategory();
});

if (holidayNameInput) {
  holidayNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addHoliday();
  });
}

// Close modal when clicking outside
settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) closeSettings();
});

// Edit Activity Modal event listeners
closeEditActivityBtn.addEventListener("click", closeEditActivityModal);
cancelEditActivityBtn.addEventListener("click", closeEditActivityModal);
saveEditActivityBtn.addEventListener("click", saveEditedActivity);

// Auto-fill gaps button in edit modal
document.getElementById("autoFillGapBtn").addEventListener("click", () => {
  if (!editActivityData) return;
  
  // First save the current edit
  saveEditedActivity();
  
  // Then fill all gaps in the session
  setTimeout(() => {
    if (editActivityData) {
      fillAllGaps(editActivityData.sessionDate);
    }
  }, 100);
});

editActivityModal.addEventListener("click", (e) => {
  if (e.target === editActivityModal) closeEditActivityModal();
});

// Event delegation for edit/delete buttons in activity tables
dailyAccordion.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-edit-activity")) {
    const sessionDate = e.target.dataset.sessionDate;
    const activityIndex = parseInt(e.target.dataset.activityIndex);
    editActivity(sessionDate, activityIndex);
  }

  if (e.target.classList.contains("btn-delete-activity")) {
    const sessionDate = e.target.dataset.sessionDate;
    const activityIndex = parseInt(e.target.dataset.activityIndex);
    deleteActivity(sessionDate, activityIndex);
  }
  
  // Fill single gap with break
  if (e.target.classList.contains("btn-fill-gap")) {
    const sessionDate = e.target.dataset.sessionDate;
    const sessionStart = e.target.dataset.sessionStart;
    const gapStart = e.target.dataset.gapStart;
    const gapEnd = e.target.dataset.gapEnd;
    fillGapWithBreak(sessionDate, sessionStart, gapStart, gapEnd);
  }
  
  // Fill all gaps in session
  if (e.target.classList.contains("btn-fill-all-gaps")) {
    const sessionDate = e.target.dataset.sessionDate;
    const sessionStart = e.target.dataset.sessionStart;
    fillAllGaps(sessionDate, sessionStart);
  }
});

// Analytics toggle button
const toggleAnalyticsBtn = document.getElementById("toggleAnalyticsBtn");
if (toggleAnalyticsBtn) {
  toggleAnalyticsBtn.addEventListener("click", toggleAnalytics);
}

// Analytics time range selector is handled in analytics-enhanced.js

// Restore analytics visibility state
const analyticsContent = document.getElementById("analyticsContent");
if (analyticsContent) {
  const analyticsVisible = localStorage.getItem("analyticsVisible");
  if (analyticsVisible === "false") {
    analyticsContent.style.display = "none";
    if (toggleAnalyticsBtn) toggleAnalyticsBtn.textContent = "Show";
  }
}

// Search and Filter event listeners
const searchBtn = document.getElementById("searchBtn");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const searchInput = document.getElementById("searchInput");

if (searchBtn) searchBtn.addEventListener("click", applyFilters);
if (applyFiltersBtn) applyFiltersBtn.addEventListener("click", applyFilters);
if (clearFiltersBtn) clearFiltersBtn.addEventListener("click", clearFilters);

// Allow Enter key in search input
if (searchInput) {
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") applyFilters();
  });
}

// Task Modal event listeners
closeTaskModalBtn.addEventListener("click", () => closeTaskModal(true));
cancelTaskBtn.addEventListener("click", () => closeTaskModal(true));
confirmTaskBtn.addEventListener("click", confirmTask);

// Allow Enter key to submit task (Ctrl+Enter in textarea)
modalTaskDescription.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    e.preventDefault();
    confirmTask();
  }
});

// Break Modal event listeners
closeBreakModalBtn.addEventListener("click", () => closeBreakModal(true));
cancelBreakBtn.addEventListener("click", () => closeBreakModal(true));
confirmBreakBtn.addEventListener("click", confirmBreak);

// Allow Enter key to submit break (Ctrl+Enter in textarea)
modalBreakDescription.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    e.preventDefault();
    confirmBreak();
  }
});

// Close modals when clicking outside (but not settings modal handled above)
taskModal.addEventListener("click", (e) => {
  if (e.target === taskModal) closeTaskModal(true);
});

breakModal.addEventListener("click", (e) => {
  if (e.target === breakModal) closeBreakModal(true);
});

// Confirm Modal event listeners
confirmModalCancelBtn.addEventListener("click", () => closeConfirmModal(false));
confirmModalOkBtn.addEventListener("click", () => closeConfirmModal(true));

// Alert Modal event listeners
alertModalOkBtn.addEventListener("click", closeAlertModal);

// Task Status Modal event listeners
document.getElementById("taskCompletedBtn").addEventListener("click", handleTaskCompleted);
document.getElementById("taskPausedBtn").addEventListener("click", handleTaskPaused);

// Resume Task Modal event listeners
const resumeTaskModal = document.getElementById("resumeTaskModal");
document.getElementById("closeResumeTaskModalBtn").addEventListener("click", () => closeResumeTaskModal(false));
resumeTaskModal.addEventListener("click", (e) => {
  if (e.target === resumeTaskModal) closeResumeTaskModal(false);
});

// Next Action Modal event listeners - cannot close without choosing, clicking outside ends work day
const nextActionResumeBtn = document.getElementById("nextActionResumeBtn");
nextActionTaskBtn.addEventListener("click", () => {
  closeNextActionModal();
  promptForTask(false);
});
nextActionResumeBtn.addEventListener("click", () => {
  closeNextActionModal();
  showResumeTaskModal();
});
nextActionBreakBtn.addEventListener("click", () => {
  closeNextActionModal();
  promptForBreak();
});
nextActionEndBtn.addEventListener("click", () => {
  closeNextActionModal();
  endWorkDay();
});
nextActionModal.addEventListener("click", (e) => {
  if (e.target === nextActionModal) {
    closeNextActionModal();
    endWorkDay();
  }
});

// Initialize
initializeClock();
updatePersonalizedHeader();
populateProjectSelect();
populateCategorySelect();
populateFilterSelects();
renderWeekView();

// Update personalized header every minute (for greeting changes)
setInterval(updatePersonalizedHeader, 60000);

// Recover active session/activity after refresh (robustness)
(function restoreActiveState() {
  const activeSession = safeLoadJson(ACTIVE_SESSION_KEY, null);
  const activeActivity = safeLoadJson(ACTIVE_ACTIVITY_KEY, null);

  if (!activeSession || activeSession.date !== getCurrentDate() || activeSession.endTime) {
    clearActiveState();
    hideTaskControls();
    return;
  }

  currentSession = activeSession;
  upsertWorkSession(currentSession);
  saveData();
  renderWeekView();
  workStartTime.textContent = currentSession.startTime;
  workSessionInfo.classList.remove("hidden");

  startWorkBtn.disabled = true;
  endWorkBtn.disabled = currentSession.activities.length === 0 && !activeActivity;
  stopActivityBtn.disabled = !activeActivity;

  startSessionTimer();

  if (activeActivity && !activeActivity.endTime) {
    currentActivity = activeActivity;
    activityType.textContent = currentActivity.type === "task" ? "🎯 Working on Task" : "☕ On Break";
    activityDescription.textContent = currentActivity.description;
    currentActivityDiv.classList.remove("hidden");
    showTaskControls();
    startActivityTimer();
    sessionStatus.textContent = currentActivity.type === "task" ? "Working on Task" : "On Break";
  } else {
    currentActivity = null;
    currentActivityDiv.classList.add("hidden");
    hideTaskControls();
    sessionStatus.textContent = "Working";
    // User is between activities; force next choice
    showNextActionModal();
  }

  updateSessionStats();
  
  // Initialize reminder system
  initReminderSystem();
  
  // Initialize branding listeners
  initBrandingListeners();
})();