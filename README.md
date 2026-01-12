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
