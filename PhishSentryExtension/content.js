// PhishSentry Extension - Simple Content Script for email scanning
// This script runs on supported email domains and scans for phishing content

// Configuration
const API_URL = "http://127.0.0.1:5000/predict";
let settings = {
  autoScan: true,
  showWarnings: true,
  showSafeNotifications: false // Turn off by default to reduce clutter
};

// Simple cache to avoid rescanning
const scannedEmails = new Map();

// Load settings
chrome.storage.local.get(
  { 
    autoScan: true, 
    showWarnings: true,
    showSafeNotifications: false
  }, 
  (result) => {
    settings.autoScan = result.autoScan;
    settings.showWarnings = result.showWarnings;
    settings.showSafeNotifications = result.showSafeNotifications;
    initScanners();
  }
);

// Listen for settings updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'updateSettings') {
    settings[message.setting] = message.value;
  } else if (message.action === 'forceRescan') {
    scanCurrentEmail();
  }
  return true;
});

// Initialize scanning
function initScanners() {
  // Only proceed if auto-scan is enabled
  if (!settings.autoScan) return;
  
  // Different handlers based on email service
  const host = window.location.hostname;
  
  // Set up event listener for scanning
  document.addEventListener('click', () => {
    // Simple debounce to avoid excessive scanning
    setTimeout(() => {
      scanCurrentEmail();
    }, 500);
  });
  
  // Initial scan on load
  setTimeout(scanCurrentEmail, 1000);
  
  // Set up periodic scanning every 5 seconds
  setInterval(scanCurrentEmail, 5000);
}

// Scan the currently visible email
function scanCurrentEmail() {
  if (!settings.autoScan) return;
  
  let emailContent = null;
  let container = null;

  // Find email content based on host
  if (window.location.hostname.includes('mail.google.com')) {
    // Gmail
    container = document.querySelector('.a3s.aiL');
    if (container) emailContent = container.innerText;
  } 
  else if (window.location.hostname.includes('outlook')) {
    // Outlook
    container = document.querySelector('[role="main"] .ReadingPaneContent');
    if (container) emailContent = container.innerText;
  } 
  else if (window.location.hostname.includes('mail.yahoo.com')) {
    // Yahoo Mail
    container = document.querySelector('.message-content-wrapper');
    if (container) emailContent = container.innerText;
  }

  // Proceed with scanning if we found content
  if (emailContent && container && emailContent.length > 20) {
    // Simple hash to avoid rescanning the same content
    const contentHash = simpleHash(emailContent);
    
    // Skip if already scanned
    if (container.dataset.phishSentryScanned === 'true' && 
        scannedEmails.has(contentHash)) {
      return;
    }
    
    container.dataset.phishSentryScanned = 'true';
    
    // Check if already in cache
    if (scannedEmails.has(contentHash)) {
      const result = scannedEmails.get(contentHash);
      if (result.isPossiblePhishing && settings.showWarnings) {
        showWarningBanner(container, result.confidence);
      }
      return;
    }
    
    // Perform the scan
    performScan(emailContent, container, contentHash);
  }
}

// Perform the actual scanning
async function performScan(content, container, contentHash) {
  try {
    // Update stats
    chrome.storage.local.get({ emailsScanned: 0 }, (result) => {
      chrome.storage.local.set({ 
        emailsScanned: result.emailsScanned + 1,
        lastScanTime: new Date().getTime()
      });
      chrome.runtime.sendMessage({ action: 'updateStats' });
    });
    
    // Call the API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: content })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    // Process response
    const data = await response.json();
    
    // Cache the result
    const result = {
      isPossiblePhishing: data.prediction === 1,
      confidence: data.confidence
    };
    scannedEmails.set(contentHash, result);
    
    // Show warning if needed
    if (result.isPossiblePhishing && settings.showWarnings) {
      showWarningBanner(container, data.confidence);
      
      // Update phishing detected count
      chrome.storage.local.get({ phishingDetected: 0 }, (stats) => {
        chrome.storage.local.set({ phishingDetected: stats.phishingDetected + 1 });
        chrome.runtime.sendMessage({ action: 'updateStats' });
      });
    } 
    else if (!result.isPossiblePhishing && settings.showSafeNotifications) {
      showSafeBanner(container);
    }
  } catch (error) {
    console.error("PhishSentry Error:", error);
  }
}

// Show warning banner
function showWarningBanner(element, confidence) {
  // Check if banner already exists
  const existingBanner = element.parentNode.querySelector('.phishsentry-warning');
  if (existingBanner) return;

  // Create banner
  const banner = document.createElement('div');
  banner.className = 'phishsentry-warning';
  banner.style.cssText = `
    position: relative;
    background-color: #FEF0F0;
    color: #D93025;
    padding: 12px 16px;
    margin-bottom: 16px;
    border-left: 4px solid #D93025;
    font-family: 'Segoe UI', sans-serif;
    font-size: 14px;
    display: flex;
    align-items: center;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  `;
  
  // Content
  banner.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#D93025" style="margin-right: 12px;">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
    <div style="flex-grow: 1;">
      <strong>WARNING: POTENTIAL PHISHING DETECTED</strong>
      <p style="margin: 5px 0 0 0;">This email may be attempting to steal your information.</p>
      <div style="margin-top: 4px; font-size: 12px;">Confidence: ${confidence}%</div>
    </div>
    <div class="phishsentry-close" style="cursor: pointer; opacity: 0.7;">✕</div>
  `;
  
  // Add to DOM
  element.parentNode.insertBefore(banner, element);
  
  // Add close functionality
  banner.querySelector('.phishsentry-close').addEventListener('click', () => {
    banner.remove();
  });
}

// Show safe banner
function showSafeBanner(element) {
  // Only if enabled and no existing banner
  if (!settings.showSafeNotifications) return;
  const existingBanner = element.parentNode.querySelector('.phishsentry-safe');
  if (existingBanner) return;

  const banner = document.createElement('div');
  banner.className = 'phishsentry-safe';
  banner.style.cssText = `
    position: relative;
    background-color: #E6F4EA;
    color: #137333;
    padding: 12px 16px;
    margin-bottom: 16px;
    border-left: 4px solid #34A853;
    font-family: 'Segoe UI', sans-serif;
    font-size: 14px;
    display: flex;
    align-items: center;
    border-radius: 4px;
  `;
  
  banner.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#34A853" style="margin-right: 12px;">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
    <div>
      <strong>Email Appears Safe</strong>
      <p style="margin: 5px 0 0 0;">No phishing indicators found.</p>
    </div>
    <div class="phishsentry-close" style="cursor: pointer; margin-left: auto; opacity: 0.7;">✕</div>
  `;
  
  element.parentNode.insertBefore(banner, element);
  
  banner.querySelector('.phishsentry-close').addEventListener('click', () => {
    banner.remove();
  });
}

// Simple hash function
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
} 