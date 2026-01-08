# Latinify — Product Requirements Document

> **Version:** 1.0  
> **Last Updated:** January 8, 2026  
> **Status:** Ready for Development

---

## 1. Overview

### 1.1 Product Name
**Latinify**

### 1.2 Tagline
*"Fac Latinum"* — Make it Latin

### 1.3 Description
Latinify is a Chrome browser extension that translates all visible text on any webpage into Latin with a single toggle. It brings the classical language of Rome to the modern web, offering users a unique, educational, and entertaining way to experience their favorite websites.

### 1.4 Target Audience
- Latin students and educators
- Classics enthusiasts
- History buffs
- Users looking for a fun, unique browsing experience
- Language learners

---

## 2. Features

### 2.1 Core Functionality

| Feature | Description |
|---------|-------------|
| **One-Click Translation** | Toggle switch translates all visible text on the current page to Latin |
| **Instant Restore** | Toggle off instantly restores original text (no page refresh needed) |
| **Smart Text Detection** | Translates only visible text nodes, preserving page layout and functionality |
| **Caching** | Stores translations locally to avoid redundant API calls |

### 2.2 What Gets Translated
- All visible text content in the DOM
- Headings, paragraphs, spans, links, buttons, lists
- Dynamically loaded content (via MutationObserver)

### 2.3 What Gets Excluded
- `<script>` and `<style>` tags
- `<code>` and `<pre>` blocks
- Form inputs and textareas (user input fields)
- `<noscript>` content
- Hidden elements (`display: none`, `visibility: hidden`)
- Already-translated content

---

## 3. User Experience

### 3.1 User Flow

```
1. User installs Latinify from Chrome Web Store
2. User navigates to any webpage
3. User clicks Latinify icon in browser toolbar
4. Popup appears with toggle switch
5. User toggles "Fac Latinum" ON
6. Page text transforms to Latin (background process, no loading bar)
7. User can toggle OFF to restore original text
8. State persists per tab until toggled off or tab closes
```

### 3.2 Popup UI Specifications

**Dimensions:** 240px (width) × 120px (height)

**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│         Fac Latinum             │  ← Toggle label (in Latin)
│                                 │
│        ────●────────            │  ← Elegant toggle switch
│                                 │
└─────────────────────────────────┘
```

**States:**
- **OFF State:** Toggle shows "OFF", switch is to the left
- **ON State:** Toggle shows "ON", switch is to the right, gold accent color
- **Translating:** Toggle is disabled briefly, subtle pulse animation on icon
- **Error:** Red accent, brief error message (e.g., "Rate limit reached. Try again later.")

### 3.3 Visual Design

**Aesthetic:** Classical Roman Minimalist

**Color Palette:**
| Color | Hex | Usage |
|-------|-----|-------|
| Ivory/Cream | `#F5F2EB` | Background |
| Parchment | `#EDE8DC` | Secondary background |
| Charcoal | `#2C2C2C` | Primary text |
| Warm Gray | `#6B6560` | Secondary text |
| Roman Gold | `#C9A227` | Accent (toggle ON, highlights) |
| Terracotta | `#C45C3E` | Error states |
| Laurel Green | `#5C7A5C` | Success states |

**Typography:**
| Element | Font | Weight | Size |
|---------|------|--------|------|
| Toggle Label "Fac Latinum" | EB Garamond | 500 (Medium) | 20px |
| Status Text (ON/OFF) | EB Garamond | 400 | 14px |

**Font Source:** [EB Garamond on Google Fonts](https://fonts.google.com/specimen/EB+Garamond)

**Design Elements:**
- Subtle box shadow on popup for depth
- Toggle switch with smooth 200ms transition
- Gold glow effect on toggle when ON
- Optional: subtle paper/parchment texture (very light, CSS only)

---

## 4. Technical Architecture

### 4.1 File Structure

```
latinify/
├── manifest.json           # Extension manifest (V3)
├── popup/
│   ├── popup.html          # Popup markup
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup logic
├── scripts/
│   ├── content.js          # Content script (DOM manipulation)
│   └── background.js       # Service worker
├── icons/
│   ├── icon-16.png         # Toolbar icon
│   ├── icon-32.png         # Toolbar icon @2x
│   ├── icon-48.png         # Extension management
│   └── icon-128.png        # Chrome Web Store
├── fonts/
│   └── EBGaramond-*.woff2  # Self-hosted font files
├── privacy-policy.html     # Privacy policy (required)
└── README.md               # Documentation
```

### 4.2 Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "Latinify",
  "version": "1.0.0",
  "description": "Transform any webpage into Latin with a single click. Fac Latinum!",
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "https://translation.googleapis.com/*"
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "background": {
    "service_worker": "scripts/background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["scripts/content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

### 4.3 Translation API

**Provider:** Google Cloud Translation API (v2)

**Endpoint:** `https://translation.googleapis.com/language/translate/v2`

**Configuration:**
- Source Language: Auto-detect (`source` parameter omitted)
- Target Language: Latin (`target=la`)
- Format: Plain text (`format=text`)

**Request Example:**
```javascript
POST https://translation.googleapis.com/language/translate/v2?key=API_KEY
Content-Type: application/json

{
  "q": ["Hello world", "Welcome to my website"],
  "target": "la",
  "format": "text"
}
```

**Response Example:**
```json
{
  "data": {
    "translations": [
      { "translatedText": "Salve mundi" },
      { "translatedText": "Benvenuto ad meum website" }
    ]
  }
}
```

---

## 5. Abuse Prevention & Rate Limiting

### 5.1 Google Cloud Console Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| Daily Quota | 100,000 characters | Prevents runaway usage |
| Budget Alert | $10/month | Email notification |
| Budget Hard Cap | $20/month | API auto-disables |

### 5.2 Extension-Level Throttling

| Limit | Value | Implementation |
|-------|-------|----------------|
| Max chars per page | 50,000 | Truncate if exceeded |
| Max translations/hour | 10 per user | `chrome.storage.local` counter |
| Cooldown between translations | 30 seconds | Timestamp check |
| Cache duration | 24 hours | Local storage with TTL |

### 5.3 Smart Optimizations

- **Deduplication:** Identical strings translated once, result reused
- **Batching:** Combine all text into single API request
- **Viewport Priority:** Translate visible content first (optional enhancement)
- **Skip Short Strings:** Don't translate strings < 2 characters

### 5.4 Error Handling

| Error | User Message | Action |
|-------|--------------|--------|
| Rate limit (extension) | "Please wait before translating again" | Show countdown |
| Rate limit (API) | "Too many requests. Try again later." | Disable toggle 5 min |
| API quota exceeded | "Service temporarily unavailable" | Graceful failure |
| Network error | "Check your internet connection" | Retry option |
| Invalid API key | "Translation service unavailable" | Contact developer |

---

## 6. Data & Privacy

### 6.1 Data Collection Policy

**We collect NO user data.**

| Data Type | Collected? | Stored? | Transmitted? |
|-----------|------------|---------|--------------|
| Personal information | ❌ No | ❌ No | ❌ No |
| Browsing history | ❌ No | ❌ No | ❌ No |
| Page content | ❌ No | Locally only | To Google Translate only |
| Analytics/telemetry | ❌ No | ❌ No | ❌ No |
| Cookies | ❌ No | ❌ No | ❌ No |

### 6.2 What Happens to Page Text

1. Text is extracted from the current page **in the user's browser**
2. Text is sent to Google Cloud Translation API over HTTPS
3. Translated text is returned and displayed
4. Original text is cached **locally** in `chrome.storage.local`
5. **Nothing is stored on any server we control**

### 6.3 Third-Party Services

| Service | Purpose | Privacy Policy |
|---------|---------|----------------|
| Google Cloud Translation | Translation | [Google Privacy Policy](https://policies.google.com/privacy) |

---

## 7. Chrome Web Store Requirements

### 7.1 Required Assets

| Asset | Dimensions | Format | Status |
|-------|------------|--------|--------|
| Small promo tile | 440 × 280 px | PNG/JPG | To create |
| Large promo tile | 920 × 680 px | PNG/JPG | Optional |
| Marquee promo tile | 1400 × 560 px | PNG/JPG | Optional |
| Screenshots | 1280 × 800 or 640 × 400 | PNG/JPG | Min 1, max 5 |
| Icon 128px | 128 × 128 px | PNG | Required |

### 7.2 Store Listing Content

**Name:** Latinify

**Summary (132 chars max):**
> Transform any webpage into Latin with one click. Experience the web as the Romans might have. Fac Latinum!

**Description:**
```
🏛️ LATINIFY — The Web, In Latin

Ever wondered what your favorite websites would look like in the language of Caesar, Cicero, and Virgil? Now you can find out!

FEATURES:
• One-click translation of any webpage to Latin
• Instant toggle — switch back to original text anytime
• Clean, Roman-inspired design
• Works on any website

HOW TO USE:
1. Click the Latinify icon in your browser toolbar
2. Toggle "Fac Latinum" (Make it Latin) ON
3. Watch as the page transforms into Latin
4. Toggle OFF to restore the original text

Perfect for:
📚 Latin students wanting immersive practice
🏛️ Classics enthusiasts
🎓 Educators creating engaging materials
🎭 Anyone who wants a unique browsing experience

PRIVACY:
We don't collect any personal data. Page text is sent to Google Translate for translation and is not stored anywhere.

Fac Latinum! 🏛️
```

**Category:** Fun

**Language:** English

### 7.3 Required Policies

1. **Privacy Policy** — Must be hosted at a public URL
2. **Permissions Justification** — Explain why each permission is needed

**Permissions Justification:**

| Permission | Justification |
|------------|---------------|
| `activeTab` | Required to access and modify text content on the current tab when the user activates the extension |
| `storage` | Required to cache translations locally and store user preferences |
| `scripting` | Required to inject content scripts that perform the translation |
| `host_permissions: translation.googleapis.com` | Required to call the Google Translate API |

---

## 8. Icon Design

### 8.1 Concept
A Roman laurel wreath encircling a classical column (Ionic or Corinthian style)

### 8.2 Style Guidelines
- **Simple silhouette** suitable for 16×16 rendering
- **Two-color max:** Charcoal (#2C2C2C) and Gold (#C9A227)
- **Clean lines** — no fine details that disappear at small sizes
- **Recognizable at glance** as Roman/classical

### 8.3 Icon Generation Tools

| Tool | Best For | Cost |
|------|----------|------|
| **Midjourney** | High-quality artistic concepts | $10/mo |
| **DALL-E 3** (via ChatGPT Plus) | Quick iterations, good quality | $20/mo |
| **Adobe Firefly** | Clean vectors, commercial-safe | Free tier available |
| **Recraft.ai** | Icon-specific generation, SVG output | Free tier |
| **Figma + AI plugins** | Refining and exporting final assets | Free |

**Recommended Workflow:**
1. Generate concepts with **Recraft.ai** or **DALL-E 3** (prompt: "minimal icon, laurel wreath around Roman column, simple silhouette, two colors gold and charcoal, suitable for app icon")
2. Refine in **Figma** or **Illustrator**
3. Export at all required sizes (16, 32, 48, 128)

---

## 9. Development Phases

### Phase 1: MVP (Target: 1-2 days)
- [ ] Set up extension structure with Manifest V3
- [ ] Create popup UI with toggle
- [ ] Implement content script for DOM text extraction
- [ ] Integrate Google Cloud Translation API
- [ ] Basic caching (original text storage)
- [ ] Toggle restore functionality

### Phase 2: Polish (Target: 1 day)
- [ ] Apply visual design (colors, typography, animations)
- [ ] Add rate limiting logic
- [ ] Error handling and user feedback
- [ ] Create icons
- [ ] Test on various websites

### Phase 3: Store Preparation (Target: 1 day)
- [ ] Write and host privacy policy
- [ ] Create promotional screenshots
- [ ] Write store listing copy
- [ ] Final testing
- [ ] Submit for review

---

## 10. Testing Checklist

### Functional Testing
- [ ] Toggle ON translates page
- [ ] Toggle OFF restores original text
- [ ] Works on static HTML pages
- [ ] Works on SPAs (React, Vue, etc.)
- [ ] Handles pages with 1000+ text nodes
- [ ] Handles dynamic content loading
- [ ] Respects rate limits
- [ ] Caching works correctly
- [ ] Error states display properly

### Visual Testing
- [ ] Popup renders correctly at 100%, 125%, 150% zoom
- [ ] Colors match spec
- [ ] Font loads correctly
- [ ] Toggle animation is smooth
- [ ] Icons crisp at all sizes

### Compatibility Testing
- [ ] Chrome stable (latest)
- [ ] Chrome beta
- [ ] Edge (Chromium)
- [ ] Brave

### Sites to Test
- [ ] Wikipedia
- [ ] Reddit
- [ ] Twitter/X
- [ ] News sites (NYT, BBC)
- [ ] E-commerce (Amazon)
- [ ] Google Search results

---

## 11. Privacy Policy (Full Text)

```
LATINIFY PRIVACY POLICY

Last Updated: January 8, 2026

OVERVIEW
Latinify is a browser extension that translates webpage text into Latin. 
We are committed to protecting your privacy.

WHAT WE COLLECT
Nothing. We do not collect, store, or transmit any personal data.

HOW THE EXTENSION WORKS
When you activate Latinify on a webpage:
1. The extension reads the visible text on the page (locally, in your browser)
2. This text is sent to Google Cloud Translation API for translation
3. The translated text replaces the original on screen
4. Original text is cached locally in your browser so you can restore it
5. No data is sent to our servers (we don't have any)

THIRD-PARTY SERVICES
We use Google Cloud Translation API to perform translations. When you 
translate a page, the text content is sent to Google's servers. Google's 
privacy policy applies to this data: https://policies.google.com/privacy

LOCAL STORAGE
The extension stores the following in your browser's local storage:
- Original page text (to enable restore functionality)
- Translation cache (to avoid redundant API calls)
- Rate limiting counters
This data never leaves your browser and is automatically cleared over time.

PERMISSIONS
- activeTab: To read and modify text on the current page
- storage: To cache translations locally
- scripting: To inject the translation script

CHANGES TO THIS POLICY
We may update this policy occasionally. Changes will be posted here.

CONTACT
For questions about this privacy policy, contact: [YOUR EMAIL]

---
Latinify does not collect personal data. Your privacy is respected.
```

---

## 12. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Install conversion | >10% | Store analytics |
| Daily active users | 100+ (month 1) | Chrome dashboard |
| Uninstall rate | <30% | Store analytics |
| Rating | 4.5+ stars | Store reviews |
| API costs | <$20/month | Google Cloud billing |

---

## Appendix A: Latin Phrases for UI

| English | Latin | Usage |
|---------|-------|-------|
| Make it Latin | Fac Latinum | Toggle label |
| On | Actum | Toggle state |
| Off | Inactum | Toggle state |
| It is done | Factum est | Success feedback |
| Please wait | Mane, quaeso | Loading/cooldown |
| Error | Error | Error state |
| Try again | Iterum conare | Retry button |

---

## Appendix B: API Key Security Note

The Google Cloud API key will be embedded in the extension code. While this means technically visible to users, the risk is mitigated by:

1. **Key restrictions** in Google Cloud Console:
   - HTTP referrer restrictions (Chrome extension ID)
   - API restrictions (Translation API only)
   
2. **Quota limits** preventing abuse even if key is extracted

3. **Monitoring** via Google Cloud Console alerts

For enhanced security in future versions, consider a proxy server that holds the key, but this adds complexity and server costs.

---

*End of PRD*

