// Latinify Background Service Worker

const CONFIG = {
  API_KEY: 'input',
  API_URL: 'https://translation.googleapis.com/language/translate/v2',
  BATCH_SIZE: 100
};

// Handle translation requests from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'translateTexts') {
    translateTexts(message.texts)
      .then(results => sendResponse({ success: true, translations: results }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates async response
  }
  return false;
});

// Translate texts via Google Cloud Translation API
async function translateTexts(texts) {
  if (!texts || texts.length === 0) {
    return {};
  }

  const results = {};
  
  // Batch API requests
  const batches = [];
  for (let i = 0; i < texts.length; i += CONFIG.BATCH_SIZE) {
    batches.push(texts.slice(i, i + CONFIG.BATCH_SIZE));
  }

  for (const batch of batches) {
    const response = await fetch(`${CONFIG.API_URL}?key=${CONFIG.API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: batch,
        target: 'la',
        format: 'text'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Latinify API Error:', response.status, error);
      
      if (response.status === 429) {
        throw new Error('API rate limit exceeded');
      }
      if (response.status === 403) {
        const msg = error.error?.message || '';
        if (msg.includes('billing')) {
          throw new Error('Billing not enabled');
        }
        if (msg.includes('API key') || msg.includes('referer')) {
          throw new Error('API key restricted - check referrer settings');
        }
        throw new Error('API access denied: ' + msg);
      }
      if (response.status === 400) {
        throw new Error('API request error: ' + (error.error?.message || 'Bad request'));
      }
      throw new Error(error.error?.message || 'Translation API error');
    }

    const data = await response.json();
    const translations = data.data.translations;

    for (let i = 0; i < batch.length; i++) {
      results[batch[i]] = translations[i].translatedText;
    }
  }

  return results;
}

// Clean up tab state when tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await chrome.storage.local.remove([`tab_${tabId}_active`]);
});

// Clean up tab state when tab navigates to a new page
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    await chrome.storage.local.remove([`tab_${tabId}_active`]);
  }
});

console.log('Latinify service worker initialized');
