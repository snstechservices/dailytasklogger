# Daily Task Logger 📋

A modern, feature-rich web application for tracking daily work activities, tasks, and breaks with comprehensive analytics and Excel export capabilities.

![Daily Task Logger](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red.svg)

## ✨ Features

### Core Functionality
- ⏱️ **Time Tracking** - Start/stop work sessions with automatic time logging
- 📝 **Task Management** - Log tasks with descriptions, projects, and categories
- ☕ **Break Tracking** - Track breaks separately from work time
- ⏸️ **Pause/Resume** - Pause tasks and resume them later
- 🔄 **Gap Detection** - Automatically detects and lets you fill untracked time

### 📊 Analytics Dashboard
- 📈 Interactive charts (doughnut, bar, line charts)
- 📊 Key performance indicators with trend indicators
- 📅 Date range filtering (current week, 7/30/90 days, all time)
- 🎯 Daily and weekly goal tracking with progress bars
- 📁 Project-wise and category-wise time distribution
- ⏰ Peak productivity hours analysis
- 📅 Weekly productivity comparison

### 📗 Export & Reporting
- 📗 Professional Excel exports with multiple sheets
- 📊 Summary sheet with KPIs and project breakdown
- 📅 Daily summary with day-by-day statistics
- 📋 Detailed activity log with icons and formatting
- 🏢 Customizable company branding in exports
- 🎨 Color-coded rows and professional styling

### 🔔 Reminder System
- ⏰ Break reminders at custom intervals
- 💤 Idle detection alerts
- 🍅 Pomodoro mode support with work/break cycles
- 🔊 10 different audio alert sounds:
  - 🔔 Bell, 🎵 Chime, 🌊 Gentle Wave, 💻 Digital
  - 🎹 Piano, 🎶 Harp, 🥁 Marimba, 📯 Whistle
  - ✨ Ding, 🧘 Zen
- 🔊 Adjustable volume control
- 📱 Browser push notifications
- ⏰ End-of-day reminders

### 🔍 Search & Filter
- 🔍 Full-text search across all activities
- 📅 Date range filtering
- 📁 Filter by project
- 🏷️ Filter by category
- 📋 Filter by activity type (task/break)

### ⚙️ Settings & Customization
- 🏢 Company branding for Excel exports
- 📁 Custom project management
- 🏷️ Custom category management
- 📅 Holiday management
- 👤 User profile settings
- 🌍 Timezone configuration

### 💾 Data Management
- 💾 Local storage persistence (no server required)
- 📊 Storage usage monitoring with visual indicator
- 🔄 Reset current week data
- 🗑️ Clear all history option
- 📤 Export before clearing

### 🎨 User Interface
- 🌙 Modern glassmorphism design
- 📱 Fully responsive (mobile, tablet, desktop)
- 🎯 Tab-based navigation (Overview, Analytics, History, Search)
- ⌚ Real-time clock display
- 🌤️ Weather and air quality widget integration
- ❤️ Beautiful footer with animated heart

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js 4.4.0
- **Excel Export**: ExcelJS 4.4.0
- **Storage**: Browser LocalStorage
- **Audio**: Web Audio API
- **Notifications**: Browser Notifications API
- **Weather**: Tomorrow.io Widget

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/daily-task-logger.git
   ```

2. Open `index.html` in a web browser

3. Start logging your work!

No build process, npm install, or server required - it's a pure client-side application.

## 📖 How to Use

### First Time Setup

1. **Open the Application**
   - Simply open `index.html` in any modern web browser
   - Chrome, Firefox, Safari, or Edge recommended

2. **Configure Settings** (Optional but Recommended)
   - Click the **⚙️ Settings** button in the top right
   - Set up your preferences:

#### Company Branding
   - Navigate to **Company Branding** tab
   - Fill in your company details for professional Excel exports:
     - Company Name
     - Address
     - Phone Number
     - Email
     - Website
   - Choose or upload a company logo
   - Click **Save Branding**

#### Projects & Categories
   - Go to **Projects** tab
   - Add your common projects (e.g., "Project Alpha", "Client Work")
   - Switch to **Categories** tab
   - Add task categories (e.g., "Development", "Meetings", "Documentation")

#### Holidays
   - Click **Holidays** tab
   - Add holidays and non-working days
   - Format: YYYY-MM-DD
   - Add optional description

#### Reminders
   - Configure **Break Reminders** (e.g., every 60 minutes)
   - Set **Idle Detection** threshold (e.g., 5 minutes)
   - Enable **Pomodoro Mode** for 25min work / 5min break cycles
   - Choose your preferred **Alert Sound** from 10 options
   - Adjust alert volume
   - Enable browser notifications if desired

### Daily Usage

#### Starting Your Work Day

1. **Start a Work Session**
   - Click the **▶ Start Work** button on the Overview tab
   - Timer begins tracking your work session

2. **Log a Task**
   - Once work session is started, the task controls appear
   - Fill in the task details:
     - **Task Description**: What are you working on?
     - **Project**: Select from dropdown or choose "General"
     - **Category**: Select task type (Development, Meeting, etc.)
   - Click **✓ Finish Task** when done
   - The task is logged with automatic time calculation

3. **Take a Break**
   - Click **☕ Start Break** button
   - Break timer starts (shown in pink gradient panel)
   - Break type options:
     - Coffee Break
     - Lunch Break
     - Short Break
     - Other
   - Add optional notes
   - Click **Stop Break** when finished

4. **Pause and Resume**
   - Click **⏸ Pause Work** to temporarily pause tracking
   - Click **▶ Resume Work** to continue from where you left off
   - Useful for unexpected interruptions

5. **End Your Day**
   - Click **⏹ Stop Work** to end your work session
   - Review your daily summary in the popup
   - Export to Excel if needed

#### Managing Time Gaps

- If you forget to track time, the app detects gaps
- A **"Fill Gap"** section appears automatically
- Choose what you were doing during that time:
  - Task (with description, project, category)
  - Break (with type and notes)
- Click **Fill as Task** or **Fill as Break**

### Using the Analytics Tab

1. **View Dashboard**
   - Click the **📊 Analytics** tab
   - See comprehensive statistics and charts

2. **Key Metrics Displayed**
   - Total work hours
   - Number of tasks completed
   - Break time taken
   - Average task duration
   - Productivity score
   - Work efficiency percentage
   - Peak productivity hour

3. **Charts Available**
   - **Doughnut Chart**: Task distribution by project
   - **Bar Chart**: Time by project
   - **Line Chart**: Daily work hours trend
   - **Heatmap**: Activity intensity over months

4. **Date Range Filtering**
   - Click filter buttons:
     - Current Week
     - Last 7 Days
     - Last 30 Days
     - Last 90 Days
     - All Time
   - Charts update automatically

5. **Set Goals**
   - Click **Set Goals** button in Goals & Progress section
   - Enter your targets:
     - Daily work goal (hours)
     - Weekly work goal (hours)
   - Progress bars show real-time achievement
   - Visual indicators when goals are exceeded

### Using the History Tab

1. **Navigate Weeks**
   - Use **← Previous Week** and **Next Week →** buttons
   - Current week range is displayed

2. **View Weekly Summary**
   - Total work hours for the week
   - Number of tasks completed
   - Break time taken
   - Average task duration
   - Days worked

3. **Daily Breakdown**
   - Each day shows as an expandable card
   - Click **▼** to expand and see details
   - Holiday days are marked with badge
   - View all tasks and breaks for that day
   - Color-coded tables:
     - Green gradient = Tasks
     - Orange gradient = Breaks

### Using the Search Tab

1. **Search Activities**
   - Enter keywords in search box
   - Click **🔍 Search** or press Enter
   - Searches across task descriptions and break notes

2. **Filter Options**
   - **Date Range**: Set start and end dates
   - **Project**: Filter by specific project
   - **Category**: Filter by task category
   - **Activity Type**: Show All / Tasks Only / Breaks Only

3. **Clear Filters**
   - Click **Clear Filters** to reset all filters

4. **View Results**
   - Results shown in color-coded table
   - Click any column header to sort (if implemented)

### Exporting Data

#### Export to Excel

1. **From History Tab**
   - Navigate to History tab
   - Click **📗 Export Week to Excel** for current week
   - Or click **📗 Export All to Excel** for complete history

2. **Excel File Contents**
   - **Summary Sheet**: 
     - Company branding
     - Week/all-time totals
     - Project breakdown with charts
   - **Daily Summary Sheet**:
     - Day-by-day statistics
     - Work hours, tasks, breaks per day
   - **Activity Log Sheet**:
     - Complete detailed log of all activities
     - Color-coded rows
     - Icons for task types

3. **File Naming**
   - Week export: `Work_Report_Week_[dates].xlsx`
   - Full export: `Work_Report_All_Time.xlsx`

### Managing Data

#### View Storage Usage
- Settings → Data Management tab
- Visual bar shows storage used vs. available
- Percentage and MB/GB display

#### Reset Current Week
- Settings → Data Management
- Click **Reset Current Week Data**
- Confirms before deletion
- Only clears current week, keeps history

#### Clear All Data
- Settings → Data Management
- Click **Clear All History**
- **WARNING**: This deletes everything
- Export data first if needed
- Confirmation required

### Tips & Best Practices

1. **Stay Consistent**
   - Start work session at beginning of day
   - Log tasks as you complete them
   - Take regular breaks and track them

2. **Use Descriptive Names**
   - Write clear task descriptions
   - Use consistent project names
   - Categorize tasks properly

3. **Set Realistic Goals**
   - Start with achievable daily/weekly goals
   - Adjust based on your productivity patterns
   - Use analytics to understand your work habits

4. **Enable Reminders**
   - Break reminders prevent burnout
   - Idle detection catches forgotten sessions
   - Pomodoro mode enforces discipline

5. **Regular Exports**
   - Export weekly for backup
   - Keep Excel reports for records
   - Share with managers/clients as needed

6. **Review Analytics**
   - Check weekly trends
   - Identify peak productivity times
   - Optimize schedule based on data

7. **Manage Holidays**
   - Add public holidays in advance
   - Mark vacation days
   - Helps accurate weekly goal calculations

### Keyboard Shortcuts

While there are no built-in keyboard shortcuts, you can use browser's tab navigation:
- `Tab` to move between buttons
- `Enter` to click focused button
- `Esc` to close modals

### Troubleshooting

#### Timer Not Starting
- Check if browser allows JavaScript
- Ensure LocalStorage is enabled
- Try refreshing the page

#### Data Not Saving
- Check browser storage settings
- Ensure you're not in Private/Incognito mode
- Storage might be full (check Settings)

#### Reminders Not Working
- Grant notification permissions in browser
- Check browser sound is not muted
- Verify reminder settings are enabled

#### Excel Export Issues
- Ensure pop-up blocker allows downloads
- Check browser download settings
- Try a different browser if problems persist

#### Charts Not Displaying
- Ensure you have tracked activities
- Check date range filter
- Clear browser cache and reload

## ⚙️ Configuration

### Company Branding
Customize your Excel export headers via Settings → Company Branding:
- Company Name
- Address
- Phone
- Email
- Website

### Default Settings
- Default workstation and timezone can be configured in Settings
- Custom projects and categories can be added via Settings
- Daily and weekly goals can be set in the Analytics section
- Holidays can be managed for accurate work day calculations

## 📁 Project Structure

```
Reporter/
├── index.html              # Main HTML file
├── style.css               # All styles including responsive
├── script.js               # Main application logic
├── analytics-enhanced.js   # Enhanced analytics features
├── tabs.js                 # Tab navigation system
├── README.md               # This file
└── .gitignore              # Git ignore rules
```

## 📱 Responsive Design

The application is fully responsive and works on:
- 📱 Mobile phones (360px+)
- 📱 Small phones (480px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktops (1200px+)

## 🔒 Privacy

All data is stored locally in your browser's LocalStorage. No data is sent to any server. Your work logs stay on your device.

## 📄 License

MIT License - feel free to use and modify for your needs.

## 👨‍💻 Author

Built with ❤️ by [SNS Tech Services](https://snstechservices.com.au/)

---

**Made with ❤️ by SNS Tech Services**
