// Latinify Content Script
// Handles DOM text extraction, translation, and restoration

(function() {
  // Prevent multiple injections
  if (window.__latinifyInjected) {
    return;
  }
  window.__latinifyInjected = true;

  // Configuration
  const CONFIG = {
    MAX_CHARS_PER_PAGE: 50000,
    RATE_LIMIT_TRANSLATIONS_PER_HOUR: 30,
    RATE_LIMIT_COOLDOWN_MS: 5000, // 5 seconds
    CACHE_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
  };

  // Storage for original text
  const originalTextMap = new Map();
  let translationCache = {};

  // Elements to skip
  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED',
    'CODE', 'PRE', 'KBD', 'SAMP', 'VAR',
    'INPUT', 'TEXTAREA', 'SELECT', 'OPTION',
    'SVG', 'MATH', 'CANVAS'
  ]);

  // Check if element should be skipped
  function shouldSkipElement(element) {
    if (!element || !element.tagName) return true;
    if (SKIP_TAGS.has(element.tagName)) return true;
    
    // Skip hidden elements
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return true;
    
    // Skip contenteditable elements
    if (element.isContentEditable) return true;
    
    return false;
  }

  // Get all text nodes from the document
  function getTextNodes() {
    const textNodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip empty or whitespace-only nodes
          if (!node.textContent || !node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip if parent should be skipped
          if (shouldSkipElement(node.parentElement)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    return textNodes;
  }

  // Rate limiting check
  async function checkRateLimit() {
    const storage = await chrome.storage.local.get(['latinify_rate_limit']);
    const rateLimit = storage.latinify_rate_limit || { count: 0, resetTime: 0, lastTranslation: 0 };
    const now = Date.now();

    // Reset hourly counter
    if (now > rateLimit.resetTime) {
      rateLimit.count = 0;
      rateLimit.resetTime = now + (60 * 60 * 1000); // 1 hour from now
    }

    // Check cooldown
    if (now - rateLimit.lastTranslation < CONFIG.RATE_LIMIT_COOLDOWN_MS) {
      const waitTime = Math.ceil((CONFIG.RATE_LIMIT_COOLDOWN_MS - (now - rateLimit.lastTranslation)) / 1000);
      throw new Error(`Rate limit: please wait ${waitTime} seconds`);
    }

    // Check hourly limit
    if (rateLimit.count >= CONFIG.RATE_LIMIT_TRANSLATIONS_PER_HOUR) {
      throw new Error('Rate limit: maximum translations per hour reached');
    }

    return rateLimit;
  }

  // Update rate limit after successful translation
  async function updateRateLimit(rateLimit) {
    rateLimit.count++;
    rateLimit.lastTranslation = Date.now();
    await chrome.storage.local.set({ latinify_rate_limit: rateLimit });
  }

  // Load translation cache
  async function loadCache() {
    const storage = await chrome.storage.local.get(['latinify_cache']);
    const cache = storage.latinify_cache || {};
    const now = Date.now();

    // Clean expired entries
    for (const key in cache) {
      if (now - cache[key].timestamp > CONFIG.CACHE_TTL_MS) {
        delete cache[key];
      }
    }

    translationCache = cache;
  }

  // Save translation cache
  async function saveCache() {
    await chrome.storage.local.set({ latinify_cache: translationCache });
  }

  // Get cached translation
  function getCachedTranslation(text) {
    const cached = translationCache[text];
    if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_TTL_MS) {
      return cached.translation;
    }
    return null;
  }

  // Set cached translation
  function setCachedTranslation(text, translation) {
    translationCache[text] = {
      translation,
      timestamp: Date.now()
    };
  }

  // Translate texts via background script (which calls the API)
  async function translateTexts(texts) {
    // Filter out already cached translations
    const uncachedTexts = [];
    const results = {};

    for (const text of texts) {
      const cached = getCachedTranslation(text);
      if (cached) {
        results[text] = cached;
      } else {
        uncachedTexts.push(text);
      }
    }

    // If all cached, return early
    if (uncachedTexts.length === 0) {
      return results;
    }

    // Deduplicate
    const uniqueTexts = [...new Set(uncachedTexts)];

    // Send to background script for translation
    const response = await chrome.runtime.sendMessage({
      action: 'translateTexts',
      texts: uniqueTexts
    });

    if (!response.success) {
      throw new Error(response.error || 'Translation failed');
    }

    // Cache the results
    for (const [text, translation] of Object.entries(response.translations)) {
      results[text] = translation;
      setCachedTranslation(text, translation);
    }

    // Save updated cache
    await saveCache();

    return results;
  }

  // Main translation function
  async function translatePage() {
    // Check rate limit
    const rateLimit = await checkRateLimit();

    // Load cache
    await loadCache();

    // Get all text nodes
    const textNodes = getTextNodes();
    
    if (textNodes.length === 0) {
      return { success: true, translated: 0 };
    }

    // Collect texts to translate
    const textsToTranslate = [];
    let totalChars = 0;

    for (const node of textNodes) {
      const text = node.textContent.trim();
      
      // Skip very short strings
      if (text.length < 2) continue;
      
      // Skip if already stored (already translated)
      if (originalTextMap.has(node)) continue;

      // Check character limit
      if (totalChars + text.length > CONFIG.MAX_CHARS_PER_PAGE) {
        console.warn('Latinify: Character limit reached, some text will not be translated');
        break;
      }

      textsToTranslate.push({ node, text });
      totalChars += text.length;
    }

    if (textsToTranslate.length === 0) {
      return { success: true, translated: 0, message: 'No text to translate' };
    }

    // Get unique texts
    const uniqueTexts = [...new Set(textsToTranslate.map(t => t.text))];

    // Translate all texts
    const translations = await translateTexts(uniqueTexts);

    // Apply translations to DOM
    for (const { node, text } of textsToTranslate) {
      const translation = translations[text];
      if (translation) {
        // Store original
        originalTextMap.set(node, text);
        // Apply translation
        node.textContent = translation;
      }
    }

    // Update rate limit
    await updateRateLimit(rateLimit);

    return { success: true, translated: textsToTranslate.length };
  }

  // Restore original text
  function restorePage() {
    for (const [node, originalText] of originalTextMap) {
      try {
        node.textContent = originalText;
      } catch (e) {
        // Node may have been removed from DOM
      }
    }
    originalTextMap.clear();
    return { success: true };
  }

  // Message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'translate') {
      translatePage()
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Indicates async response
    }

    if (message.action === 'restore') {
      const result = restorePage();
      sendResponse(result);
      return false;
    }

    return false;
  });

})();
