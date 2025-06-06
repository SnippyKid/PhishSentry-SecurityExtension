// PhishSentry Extension - Popup Script
document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const analyzeButton = document.getElementById('analyze-btn');
  const contentInput = document.getElementById('content-input');
  const loadingElement = document.getElementById('loading');
  const resultElement = document.getElementById('result');
  const verdictIcon = document.getElementById('verdict-icon');
  const verdictText = document.getElementById('verdict-text');
  const confidenceValue = document.getElementById('confidence-value');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const monitoringText = document.getElementById('monitoring-text');
  const emailsScanned = document.getElementById('emails-scanned');
  const phishingDetected = document.getElementById('phishing-detected');
  const lastScan = document.getElementById('last-scan');
  const autoScanToggle = document.getElementById('auto-scan');
  const showWarningsToggle = document.getElementById('show-warnings');
  const showSafeNotificationsToggle = document.getElementById('show-safe-notifications');
  const rescanButton = document.getElementById('rescan-button');

  // API endpoint (configured in manifest.json host_permissions)
  const API_URL = 'http://127.0.0.1:5000/predict';

  // Try to restore previous input from storage
  chrome.storage.local.get(['lastInput'], (result) => {
    if (result.lastInput) {
      contentInput.value = result.lastInput;
    }
  });

  // Load settings and stats from storage
  loadSettings();
  updateStats();

  // Set up event listeners for toggles
  autoScanToggle.addEventListener('change', function() {
    chrome.storage.local.set({ autoScan: this.checked });
    updateStatusIndicator();
    
    // Notify content script
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      setting: 'autoScan', 
      value: this.checked
    });
  });

  showWarningsToggle.addEventListener('change', function() {
    chrome.storage.local.set({ showWarnings: this.checked });
    
    // Notify content script
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      setting: 'showWarnings', 
      value: this.checked
    });
  });
  
  showSafeNotificationsToggle.addEventListener('change', function() {
    chrome.storage.local.set({ showSafeNotifications: this.checked });
    
    // Notify content script
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      setting: 'showSafeNotifications', 
      value: this.checked
    });
  });
  
  // Rescan button
  rescanButton.addEventListener('click', function() {
    this.textContent = "Scanning...";
    this.disabled = true;
    
    // Tell content script to rescan
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'forceRescan'
        }, function() {
          // Re-enable after a short delay
          setTimeout(() => {
            rescanButton.textContent = "Rescan Current Page";
            rescanButton.disabled = false;
          }, 1000);
        });
      }
    });
  });

  // Analyze button click handler
  analyzeButton.addEventListener('click', async () => {
    const content = contentInput.value.trim();
    
    // Save input to storage
    chrome.storage.local.set({lastInput: content});
    
    // Validate input content
    if (!content) {
      alert('Please enter email text or URL to analyze.');
      return;
    }

    // Show loading state
    loadingElement.classList.remove('hidden');
    resultElement.classList.add('hidden');
    analyzeButton.disabled = true;
    
    try {
      // Call the PhishSentry API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: content })
      });

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      // Process the response
      const data = await response.json();
      console.log("API Response:", data); // Debug: Log the API response
      displayResult(data);
    } catch (error) {
      console.error('Error:', error);
      
      // Show error in the result area
      resultElement.classList.remove('hidden');
      verdictIcon.className = 'verdict-icon';
      verdictText.innerHTML = `<span class="text-phishing">Error: Could not connect to PhishSentry server.</span><br><small>Make sure the backend server is running at ${API_URL}</small>`;
      confidenceValue.textContent = 'N/A';
    } finally {
      // Hide loading state and re-enable button
      loadingElement.classList.add('hidden');
      analyzeButton.disabled = false;
    }
  });

  // Function to display the analysis result
  function displayResult(data) {
    // In the backend model: 1 = phishing, 0 = safe
    const isPossiblePhishing = data.prediction === 1;
    
    // Update UI based on prediction
    if (isPossiblePhishing) {
      verdictIcon.className = 'verdict-icon phishing';
      verdictText.className = 'text-phishing';
      verdictText.textContent = 'Potential Phishing Detected';
    } else {
      verdictIcon.className = 'verdict-icon safe';
      verdictText.className = 'text-safe';
      verdictText.textContent = 'Content Appears Safe';
    }

    // Update confidence score
    confidenceValue.textContent = `${data.confidence}%`;
    
    // Show result
    resultElement.classList.remove('hidden');
  }

  // Helper function to extract text from current page (when implemented)
  function extractCurrentPageContent() {
    // This will be implemented with chrome.scripting.executeScript
    // when we add the feature to scan current page
    console.log('Page content extraction not yet implemented');
  }

  // Function to load settings from storage
  function loadSettings() {
    chrome.storage.local.get(
      { 
        autoScan: true, 
        showWarnings: true,
        showSafeNotifications: false
      }, 
      (result) => {
        autoScanToggle.checked = result.autoScan;
        showWarningsToggle.checked = result.showWarnings;
        showSafeNotificationsToggle.checked = result.showSafeNotifications;
        updateStatusIndicator();
    });
  }

  // Function to update the status indicator
  function updateStatusIndicator() {
    if (autoScanToggle.checked) {
      statusDot.className = 'status-dot active';
      statusText.textContent = 'Protection active';
      monitoringText.textContent = 'Monitoring emails for phishing content in real-time.';
    } else {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Protection disabled';
      monitoringText.textContent = 'Auto-scanning is turned off. Enable to protect against phishing.';
    }
  }

  // Function to update statistics
  function updateStats() {
    chrome.storage.local.get(
      { 
        emailsScanned: 0, 
        phishingDetected: 0,
        lastScanTime: null
      }, 
      (result) => {
        emailsScanned.textContent = result.emailsScanned;
        phishingDetected.textContent = result.phishingDetected;
        
        if (result.lastScanTime) {
          const date = new Date(result.lastScanTime);
          lastScan.textContent = date.toLocaleString();
        } else {
          lastScan.textContent = 'Never';
        }
    });
  }

  // Listen for messages to update stats in real-time
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateStats') {
      updateStats();
    }
    return true;
  });
}); 