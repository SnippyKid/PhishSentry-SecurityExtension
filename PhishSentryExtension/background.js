// PhishSentry Extension - Background Script
// This script runs in the background to coordinate between content scripts and popup

console.log("PhishSentry background script initialized");

// Default settings
const DEFAULT_SETTINGS = {
  autoScan: true,
  showWarnings: true,
  emailsScanned: 0,
  phishingDetected: 0,
  lastScanTime: null
};

// Initialize settings when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(DEFAULT_SETTINGS, (result) => {
    // Only set defaults for values that don't exist
    const settings = {
      autoScan: result.autoScan ?? DEFAULT_SETTINGS.autoScan,
      showWarnings: result.showWarnings ?? DEFAULT_SETTINGS.showWarnings,
      emailsScanned: result.emailsScanned ?? DEFAULT_SETTINGS.emailsScanned,
      phishingDetected: result.phishingDetected ?? DEFAULT_SETTINGS.phishingDetected,
      lastScanTime: result.lastScanTime ?? DEFAULT_SETTINGS.lastScanTime
    };
    
    chrome.storage.local.set(settings);
    console.log("PhishSentry settings initialized:", settings);
  });
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("PhishSentry background received message:", message);
  
  if (message.action === 'updateSettings') {
    // Broadcast the setting change to all content scripts
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        // Only send to email service tabs
        if (
          tab.url && (
            tab.url.includes('mail.google.com') || 
            tab.url.includes('outlook') || 
            tab.url.includes('mail.yahoo.com')
          )
        ) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {
            // Ignore errors from tabs that don't have content scripts loaded
          });
        }
      }
    });
  }
  
  // Always return true for async response handling
  return true;
});

// Listen for tab updates to re-inject content scripts if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is an email service
    if (
      tab.url.includes('mail.google.com') || 
      tab.url.includes('outlook') || 
      tab.url.includes('mail.yahoo.com')
    ) {
      // Get current settings
      chrome.storage.local.get(['autoScan'], (result) => {
        if (result.autoScan) {
          // Send a message to the tab to initialize observers
          // This will only work if the content script is already loaded
          chrome.tabs.sendMessage(tabId, { action: 'initializeObservers' }).catch(() => {
            // Content script not loaded, this is expected
          });
        }
      });
    }
  }
}); 