// Latinify Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('latinToggle');
  const statusText = document.getElementById('statusText');
  const container = document.querySelector('.container');

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab?.id) {
    statusText.textContent = 'Cannot access this page';
    statusText.classList.add('error');
    toggle.disabled = true;
    return;
  }

  // Check if we can run on this page
  const url = tab.url || '';
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
    statusText.textContent = 'Cannot translate this page';
    statusText.classList.add('error');
    toggle.disabled = true;
    return;
  }

  // Get current state for this tab
  const state = await chrome.storage.local.get([`tab_${tab.id}_active`]);
  const isActive = state[`tab_${tab.id}_active`] || false;
  toggle.checked = isActive;

  // Handle toggle change
  toggle.addEventListener('change', async () => {
    const isOn = toggle.checked;
    toggle.disabled = true;
    
    try {
      if (isOn) {
        // Turning ON - translate the page
        container.classList.add('translating');
        statusText.textContent = 'Mane, quaeso...'; // Please wait...
        statusText.classList.remove('error', 'success');
        
        // Inject and execute content script
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['scripts/content.js']
        });
        
        // Send message to translate
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'translate' });
        
        if (response?.success) {
          await chrome.storage.local.set({ [`tab_${tab.id}_active`]: true });
          statusText.textContent = 'Factum est!'; // It is done!
          statusText.classList.add('success');
        } else {
          throw new Error(response?.error || 'Translation failed');
        }
      } else {
        // Turning OFF - restore original text
        statusText.textContent = '';
        
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'restore' });
        
        if (response?.success) {
          await chrome.storage.local.set({ [`tab_${tab.id}_active`]: false });
        }
      }
    } catch (error) {
      console.error('Latinify error:', error);
      toggle.checked = !isOn; // Revert toggle
      
      // Show user-friendly error message
      let errorMessage = 'Error occurred';
      const msg = error.message.toLowerCase();
      if (msg.includes('rate limit')) {
        errorMessage = 'Mane, quaeso'; // Please wait (rate limited)
      } else if (msg.includes('billing')) {
        errorMessage = 'Enable billing in Google Cloud';
      } else if (msg.includes('api key')) {
        errorMessage = 'API key issue';
      } else if (msg.includes('access denied') || msg.includes('403')) {
        errorMessage = 'API access denied';
      } else if (msg.includes('quota')) {
        errorMessage = 'Quota exceeded';
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed')) {
        errorMessage = 'Check connection';
      }
      
      // Log full error for debugging
      console.error('Latinify error details:', error.message);
      
      statusText.textContent = errorMessage;
      statusText.classList.add('error');
    } finally {
      toggle.disabled = false;
      container.classList.remove('translating');
      
      // Clear success message after a delay
      if (statusText.classList.contains('success')) {
        setTimeout(() => {
          statusText.textContent = '';
          statusText.classList.remove('success');
        }, 2000);
      }
    }
  });
});

