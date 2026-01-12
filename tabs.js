// ========================================
// TAB NAVIGATION SYSTEM
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Tab switching function
  function switchTab(tabName) {
    // Remove active class from all buttons and contents
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to selected button and content
    const selectedButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(`${tabName}-tab`);

    if (selectedButton && selectedContent) {
      selectedButton.classList.add('active');
      selectedContent.classList.add('active');

      // Save current tab to localStorage
      localStorage.setItem('activeTab', tabName);

      // Refresh analytics charts if switching to analytics tab
      if (tabName === 'analytics' && typeof generateAnalytics === 'function') {
        setTimeout(() => {
          generateAnalytics();
        }, 100);
      }
    }
  }

  // Add click event listeners to all tab buttons
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Restore last active tab on page load
  const savedTab = localStorage.getItem('activeTab');
  if (savedTab) {
    switchTab(savedTab);
  } else {
    switchTab('overview'); // Default to overview tab
  }

  // Keyboard shortcuts for tab switching
  document.addEventListener('keydown', (e) => {
    // Ctrl+1, Ctrl+2, etc. for tab switching
    if (e.ctrlKey && e.key >= '1' && e.key <= '4') {
      e.preventDefault();
      const tabIndex = parseInt(e.key) - 1;
      const tabs = ['overview', 'analytics', 'history', 'search'];
      if (tabs[tabIndex]) {
        switchTab(tabs[tabIndex]);
      }
    }
  });

  // Make switchTab available globally
  window.switchTab = switchTab;
});
