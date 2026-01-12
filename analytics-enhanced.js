// ========================================
// ENHANCED ANALYTICS FEATURES
// ========================================

// Goals management
const DAILY_GOAL_KEY = "dailyWorkGoal";
const WEEKLY_GOAL_KEY = "weeklyWorkGoal";

let dailyGoal = parseFloat(localStorage.getItem(DAILY_GOAL_KEY)) || 8; // hours
let weeklyGoal = parseFloat(localStorage.getItem(WEEKLY_GOAL_KEY)) || 40; // hours

// Analytics time range
let analyticsTimeRange = "current-week";

// ========================================
// GOALS MODAL
// ========================================

const goalsModal = document.getElementById("goalsModal");
const setGoalsBtn = document.getElementById("setGoalsBtn");
const closeGoalsModalBtn = document.getElementById("closeGoalsModalBtn");
const cancelGoalsBtn = document.getElementById("cancelGoalsBtn");
const saveGoalsBtn = document.getElementById("saveGoalsBtn");
const dailyGoalInput = document.getElementById("dailyGoalInput");
const weeklyGoalInput = document.getElementById("weeklyGoalInput");

if (setGoalsBtn) {
  setGoalsBtn.addEventListener("click", () => {
    dailyGoalInput.value = dailyGoal;
    weeklyGoalInput.value = weeklyGoal;
    goalsModal.classList.remove("hidden");
  });
}

if (closeGoalsModalBtn) {
  closeGoalsModalBtn.addEventListener("click", () => {
    goalsModal.classList.add("hidden");
  });
}

if (cancelGoalsBtn) {
  cancelGoalsBtn.addEventListener("click", () => {
    goalsModal.classList.add("hidden");
  });
}

if (saveGoalsBtn) {
  saveGoalsBtn.addEventListener("click", () => {
    const newDailyGoal = parseFloat(dailyGoalInput.value);
    const newWeeklyGoal = parseFloat(weeklyGoalInput.value);

    if (newDailyGoal > 0 && newDailyGoal <= 24) {
      dailyGoal = newDailyGoal;
      localStorage.setItem(DAILY_GOAL_KEY, dailyGoal);
    }

    if (newWeeklyGoal > 0 && newWeeklyGoal <= 168) {
      weeklyGoal = newWeeklyGoal;
      localStorage.setItem(WEEKLY_GOAL_KEY, weeklyGoal);
    }

    goalsModal.classList.add("hidden");
    updateGoalsDisplay();
    renderWeekView();
  });
}

// ========================================
// TIME RANGE SELECTOR
// ========================================

const analyticsTimeRangeSelect = document.getElementById("analyticsTimeRange");

if (analyticsTimeRangeSelect) {
  analyticsTimeRangeSelect.addEventListener("change", (e) => {
    analyticsTimeRange = e.target.value;
    renderWeekView();
  });
}

// ========================================
// GET DATE RANGE BASED ON SELECTION
// ========================================

function getAnalyticsDateRange() {
  const today = new Date();
  let start, end;

  switch (analyticsTimeRange) {
    case "last-7-days":
      end = new Date(today);
      start = new Date(today);
      start.setDate(start.getDate() - 6);
      break;
    case "last-30-days":
      end = new Date(today);
      start = new Date(today);
      start.setDate(start.getDate() - 29);
      break;
    case "last-90-days":
      end = new Date(today);
      start = new Date(today);
      start.setDate(start.getDate() - 89);
      break;
    case "current-month":
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case "all-time":
      // Find earliest session
      if (workSessions.length > 0) {
        const dates = workSessions.map(s => s.date).sort();
        start = new Date(dates[0]);
      } else {
        start = new Date(today);
        start.setDate(start.getDate() - 30);
      }
      end = new Date(today);
      break;
    case "current-week":
    default:
      const weekRange = getWeekRange(currentWeekOffset);
      start = weekRange.start;
      end = weekRange.end;
  }

  return { start, end };
}

// ========================================
// ENHANCED ANALYTICS GENERATION
// ========================================

function generateAnalyticsEnhanced() {
  const { start, end } = getAnalyticsDateRange();
  const startStr = formatDate(start);
  const endStr = formatDate(end);

  const sessions = workSessions.filter(session =>
    session.date >= startStr && session.date <= endStr
  );

  // Aggregate data
  const projectTimes = {};
  const categoryTimes = {};
  const dailyHours = {};
  const hourlyDistribution = Array(24).fill(0); // 0-23 hours
  let totalWorkSeconds = 0;
  let totalBreakSeconds = 0;
  let totalTasks = 0;
  let completedTasks = 0;

  sessions.forEach(session => {
    const dayKey = session.date;
    if (!dailyHours[dayKey]) dailyHours[dayKey] = 0;

    session.activities.forEach(activity => {
      if (activity.type === "task") {
        projectTimes[activity.project] = (projectTimes[activity.project] || 0) + activity.duration;
        categoryTimes[activity.category] = (categoryTimes[activity.category] || 0) + activity.duration;
        totalWorkSeconds += activity.duration;
        totalTasks++;
        if (activity.status === "completed" || !activity.status) {
          completedTasks++;
        }
        dailyHours[dayKey] += activity.duration;

        // Track hourly distribution
        const startHour = parseInt(activity.startTime.split(':')[0]);
        const duration = activity.duration / 3600; // convert to hours
        hourlyDistribution[startHour] += duration;
      } else {
        totalBreakSeconds += activity.duration;
      }
    });
  });

  // Update charts
  updateProjectChart(projectTimes);
  updateDailyTrendChart(dailyHours, startStr, endStr);
  updateWorkBreakChart(totalWorkSeconds, totalBreakSeconds);
  updateWeeklyProductivityChart(sessions);
  updatePeakHoursChartEnhanced(hourlyDistribution);

  // Update quick stats with trends
  updateQuickStatsEnhanced(sessions, dailyHours, projectTimes, totalTasks, completedTasks);

  // Update goals
  updateGoalsDisplay();
}

// ========================================
// ENHANCED PEAK HOURS CHART
// ========================================

let peakHoursChart = null;

function updatePeakHoursChartEnhanced(hourlyDistribution) {
  const ctx = document.getElementById("peakHoursChart");
  if (!ctx) return;

  if (peakHoursChart) peakHoursChart.destroy();

  const hours = Array.from({length: 24}, (_, i) => i);
  const labels = hours.map(h => `${String(h).padStart(2, '0')}:00`);

  peakHoursChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Work Hours",
        data: hourlyDistribution.map(h => Math.round(h * 10) / 10),
        backgroundColor: "rgba(99, 102, 241, 0.6)",
        borderColor: "#6366f1",
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          callbacks: {
            label: (context) => {
              const hours = context.parsed.y;
              return `  ${hours.toFixed(1)}h of work`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => value + 'h'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// ========================================
// ENHANCED QUICK STATS WITH TRENDS
// ========================================

function updateQuickStatsEnhanced(sessions, dailyHours, projectTimes, totalTasks, completedTasks) {
  const daysWithWork = Object.keys(dailyHours).length;
  const avgDailySeconds = daysWithWork > 0
    ? Object.values(dailyHours).reduce((a, b) => a + b, 0) / daysWithWork
    : 0;

  // Avg Daily Hours
  document.getElementById("avgDailyHours").textContent = formatDuration(avgDailySeconds);

  // Calculate trend (compare to previous period)
  const prevPeriodAvg = calculatePreviousPeriodAverage(sessions.length);
  updateTrendIndicator("avgDailyTrend", avgDailySeconds, prevPeriodAvg);

  // Most Productive Day
  let maxHours = 0;
  let maxDay = "-";
  Object.entries(dailyHours).forEach(([date, seconds]) => {
    if (seconds > maxHours) {
      maxHours = seconds;
      const d = new Date(date);
      maxDay = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  });
  document.getElementById("mostProductiveDay").textContent = maxDay;

  // Top Project
  let topProject = "-";
  let topProjectTime = 0;
  Object.entries(projectTimes).forEach(([project, seconds]) => {
    if (seconds > topProjectTime) {
      topProjectTime = seconds;
      topProject = project;
    }
  });
  document.getElementById("topProject").textContent = topProject;
  if (topProjectTime > 0) {
    document.getElementById("topProjectTrend").textContent = formatDuration(topProjectTime);
    document.getElementById("topProjectTrend").className = "stat-trend neutral";
  }

  // Avg Tasks/Day
  const avgTasks = daysWithWork > 0 ? Math.round(totalTasks / daysWithWork) : 0;
  document.getElementById("tasksPerDay").textContent = avgTasks;

  // Completion Rate
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  document.getElementById("completionRate").textContent = completionRate + "%";
  const completionTrend = document.getElementById("completionTrend");
  if (completionRate >= 80) {
    completionTrend.textContent = "↑ Excellent";
    completionTrend.className = "stat-trend positive";
  } else if (completionRate >= 60) {
    completionTrend.textContent = "→ Good";
    completionTrend.className = "stat-trend neutral";
  } else {
    completionTrend.textContent = "↓ Needs work";
    completionTrend.className = "stat-trend negative";
  }
}

// ========================================
// TREND CALCULATION HELPER
// ========================================

function updateTrendIndicator(elementId, currentValue, previousValue) {
  const trendEl = document.getElementById(elementId);
  if (!trendEl) return;

  if (previousValue === 0) {
    trendEl.textContent = "";
    return;
  }

  const percentChange = ((currentValue - previousValue) / previousValue) * 100;

  if (Math.abs(percentChange) < 5) {
    trendEl.textContent = "→ Steady";
    trendEl.className = "stat-trend neutral";
  } else if (percentChange > 0) {
    trendEl.textContent = `↑ ${Math.round(percentChange)}%`;
    trendEl.className = "stat-trend positive";
  } else {
    trendEl.textContent = `↓ ${Math.round(Math.abs(percentChange))}%`;
    trendEl.className = "stat-trend negative";
  }
}

function calculatePreviousPeriodAverage() {
  // Simplified - just return 0 for now
  // In a full implementation, you'd calculate the average from the previous period
  return 0;
}

// ========================================
// GOALS DISPLAY UPDATE
// ========================================

function updateGoalsDisplay() {
  const today = getCurrentDate();
  const { start, end } = getWeekRange(currentWeekOffset);
  const startStr = formatDate(start);
  const endStr = formatDate(end);

  // Calculate today's work
  const todaySessions = workSessions.filter(s => s.date === today);
  let todayWorkSeconds = 0;
  todaySessions.forEach(session => {
    session.activities.forEach(activity => {
      if (activity.type === "task") {
        todayWorkSeconds += activity.duration;
      }
    });
  });

  // Calculate week's work
  const weekSessions = workSessions.filter(s => s.date >= startStr && s.date <= endStr);
  let weekWorkSeconds = 0;
  weekSessions.forEach(session => {
    session.activities.forEach(activity => {
      if (activity.type === "task") {
        weekWorkSeconds += activity.duration;
      }
    });
  });

  // Update daily goal
  const dailyHours = todayWorkSeconds / 3600;
  const dailyPercent = Math.min((dailyHours / dailyGoal) * 100, 100);
  const dailyProgressEl = document.getElementById("dailyGoalProgress");
  const dailyCurrentEl = document.getElementById("dailyGoalCurrent");
  const dailyTargetEl = document.getElementById("dailyGoalTarget");

  if (dailyProgressEl) {
    dailyProgressEl.style.width = dailyPercent + "%";
    if (dailyHours > dailyGoal) {
      dailyProgressEl.classList.add("over-goal");
    } else {
      dailyProgressEl.classList.remove("over-goal");
    }
  }
  if (dailyCurrentEl) dailyCurrentEl.textContent = formatDuration(todayWorkSeconds);
  if (dailyTargetEl) dailyTargetEl.textContent = dailyGoal + "h";

  // Update weekly goal
  const weeklyHours = weekWorkSeconds / 3600;
  const weeklyPercent = Math.min((weeklyHours / weeklyGoal) * 100, 100);
  const weeklyProgressEl = document.getElementById("weeklyGoalProgress");
  const weeklyCurrentEl = document.getElementById("weeklyGoalCurrent");
  const weeklyTargetEl = document.getElementById("weeklyGoalTarget");

  if (weeklyProgressEl) {
    weeklyProgressEl.style.width = weeklyPercent + "%";
    if (weeklyHours > weeklyGoal) {
      weeklyProgressEl.classList.add("over-goal");
    } else {
      weeklyProgressEl.classList.remove("over-goal");
    }
  }
  if (weeklyCurrentEl) weeklyCurrentEl.textContent = formatDuration(weekWorkSeconds);
  if (weeklyTargetEl) weeklyTargetEl.textContent = weeklyGoal + "h";
}

// ========================================
// REPLACE ORIGINAL generateAnalytics
// ========================================

// Override the original function
if (typeof generateAnalytics !== 'undefined') {
  window.originalGenerateAnalytics = generateAnalytics;
}

window.generateAnalytics = generateAnalyticsEnhanced;

// Initialize goals on load
updateGoalsDisplay();
