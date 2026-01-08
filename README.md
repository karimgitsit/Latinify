# Latinify 🏛️

> *Fac Latinum* — Transform any webpage into Latin with a single click.

A Chrome extension that translates all visible text on any webpage into Latin, bringing the classical language of Rome to the modern web.

## Features

- **One-Click Translation** — Toggle switch translates all visible text to Latin
- **Instant Restore** — Toggle off to restore original text immediately
- **Smart Caching** — Translations are cached locally to save API calls
- **Rate Limiting** — Built-in protection against excessive usage
- **Classical Design** — Elegant Roman-inspired minimal interface

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. **Create icon files** (see Icons section below)
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable **Developer mode** (toggle in top right)
5. Click **Load unpacked**
6. Select the `Latin extension` folder
7. The Latinify icon should appear in your toolbar

## Icons Setup

Before loading the extension, you need to create the icon PNG files:

### Option 1: Use the SVG Template
1. Open `icons/icon-template.svg` in a design tool (Figma, Illustrator, etc.)
2. Export as PNG at these sizes:
   - `icon-16.png` (16×16 px)
   - `icon-32.png` (32×32 px)  
   - `icon-48.png` (48×48 px)
   - `icon-128.png` (128×128 px)
3. Save all files in the `icons/` folder

### Option 2: Generate with AI Tools
Use one of these tools with the prompt:
> "Minimal app icon, Roman laurel wreath encircling a classical column, simple two-color silhouette, gold (#C9A227) and charcoal (#2C2C2C), flat design, suitable for browser extension icon"

Recommended tools:
- [Recraft.ai](https://recraft.ai) — Free, icon-specific
- [DALL-E 3](https://chat.openai.com) — Via ChatGPT Plus
- [Adobe Firefly](https://firefly.adobe.com) — Commercial-safe

### Option 3: Quick Placeholder
Create simple solid-color placeholder icons to test the extension, then replace later.

## Usage

1. Navigate to any webpage
2. Click the Latinify icon in your browser toolbar
3. Toggle **"Fac Latinum"** ON
4. Watch as the page transforms into Latin!
5. Toggle OFF to restore the original text

## Configuration

The extension includes built-in rate limiting:
- Maximum 50,000 characters per page
- Maximum 10 translations per hour
- 30-second cooldown between translations
- 24-hour translation cache

## Privacy

**We collect no personal data.** 

- Page text is only sent to Google Translate API
- Original text is cached locally in your browser
- No analytics, tracking, or external servers

See [privacy-policy.html](privacy-policy.html) for full details.

## Development

### File Structure

```
latinify/
├── manifest.json        # Extension configuration
├── popup/
│   ├── popup.html       # Popup UI
│   ├── popup.css        # Styles
│   └── popup.js         # Toggle logic
├── scripts/
│   ├── content.js       # DOM manipulation & translation
│   └── background.js    # Service worker
├── icons/
│   ├── icon-template.svg
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── privacy-policy.html
├── PRD.md
└── README.md
```

### API Key

The Google Cloud Translation API key is embedded in `scripts/content.js`. To use your own:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable the Cloud Translation API
3. Create an API key
4. Replace the key in `content.js`

### Building for Production

1. Ensure all icons are in place
2. Test on various websites
3. Zip the folder contents (not the folder itself)
4. Upload to Chrome Web Store Developer Dashboard

## Tech Stack

- **Manifest V3** — Chrome's latest extension format
- **Google Cloud Translation API** — Neural machine translation
- **EB Garamond** — Classical serif typography
- Vanilla JavaScript — No frameworks

## License

MIT License — Feel free to fork and modify.

---

*Factum est!* 🏛️

