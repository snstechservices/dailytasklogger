# Daily Task Logger 📋

A modern, feature-rich web application for tracking daily work activities, tasks, and breaks with comprehensive analytics and Excel export capabilities.

## Features

### Core Functionality
- ⏱️ **Time Tracking** - Start/stop work sessions with automatic time logging
- 📝 **Task Management** - Log tasks with descriptions, projects, and categories
- ☕ **Break Tracking** - Track breaks separately from work time
- ⏸️ **Pause/Resume** - Pause tasks and resume them later

### Analytics Dashboard
- 📊 Interactive charts (doughnut, polar area, line charts)
- 📈 Key performance indicators
- 📅 Date range filtering (week, month, custom)
- 🎯 Daily and weekly goal tracking
- 📁 Project-wise time distribution

### Export & Reporting
- 📗 Professional Excel exports with multiple sheets
- 📊 Summary sheet with KPIs and project breakdown
- 📅 Daily summary with day-by-day stats
- 📋 Detailed activity log with filtering

### Reminder System
- 🔔 Break reminders at custom intervals
- 💤 Idle detection alerts
- 🍅 Pomodoro mode support
- 🔊 Audio alerts with customizable sounds
- 📱 Browser notifications

### Other Features
- 🔍 Search and filter activities
- 🏷️ Custom project types
- 📆 Week-by-week navigation
- 💾 Local storage persistence
- 🌙 Modern glassmorphism UI

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Charts**: Chart.js 4.4.0
- **Excel Export**: ExcelJS 4.4.0
- **Storage**: Browser LocalStorage
- **Audio**: Web Audio API
- **Notifications**: Browser Notifications API

## Getting Started

1. Clone the repository
2. Open `index.html` in a web browser
3. Start logging your work!

No build process or server required - it's a pure client-side application.

## Configuration

### Report Branding
Edit the `REPORT_BRAND` object in `script.js` to customize Excel export headers:
```javascript
const REPORT_BRAND = {
  name: "Your Company Name",
  website: "https://yourwebsite.com",
  email: "contact@yourcompany.com",
  address: "Your Address",
  phone: "Your Phone",
  logoFile: "logo.png"
};
```

### Default Settings
- Default workstation and timezone can be configured
- Custom project types can be added via Settings
- Goals can be set in the Analytics section

## License

MIT License - feel free to use and modify for your needs.

## Author

Built with ❤️ for productivity tracking
