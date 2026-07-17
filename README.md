# Focusly 🍅

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Site-00C853?style=for-the-badge&logo=google-chrome&logoColor=white)](https://kosef0.github.io/Focusly/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Live Demo / Canlı Önizleme:** [https://kosef0.github.io/Focusly/](https://kosef0.github.io/Focusly/)

Focusly is a stunning, premium, and fully customizable Pomodoro timer application designed to keep you focused and productive. Built with clean, standard-compliant vanilla web technologies (HTML5, CSS3, JavaScript), it offers a highly aesthetic glassmorphic interface, dynamic ambient animations, rich statistics tracking, integrated task management, and full internationalization.

---

## 🌍 Language Support / Dil Desteği

Focusly is global and supports **12 languages** out of the box (with automatic browser language detection):

`🇬🇧 English` · `🇹🇷 Türkçe` · `🇪🇸 Español` · `🇫🇷 Français` · `🇩🇪 Deutsch` · `🇯🇵 日本語` · `🇨🇳 中文` · `🇸🇦 العربية (RTL)` · `🇧🇷 Português` · `🇰🇷 한국어` · `🇷🇺 Русский` · `🇮🇳 हिन्दी`

---

## ✨ Features / Özellikler

### 🎨 Premium UI & Themes
- **Glassmorphism Design:** Modern translucent panels, micro-animations, spring transitions, and elegant typography.
- **11 Animated Backgrounds:**
  - `🌌 Aurora` — Glowing neon energy flows (default)
  - `✨ Cosmic Nebula` — Deep space clouds with twinkling stars
  - `🌅 Sunset Hues` — Warm sunset color gradients
  - `🌐 Cyberpunk Grid` — Retro scrolling 3D grid with a neon horizon
  - `🌧️ Soothing Rain` — Relaxing canvas-drawn falling raindrops
  - `🌸 Sakura Breeze` — Gently swaying pink cherry blossom petals
  - `🌲 Deep Forest` — Animated sunrays drifting through green hues
  - `🖥️ Studio Minimal` — Clean, distraction-free monochrome background
  - `📟 Matrix Rain` — Falling code letters that dynamically color-match the active accent theme
  - `🫧 Aqua Bubbles` — Soft, rising underwater bubbles with wobble effects
  - `✨ Magic Fireflies` — Drifting, breathing golden fireflies in a dark forest
- **12 Accent Colors:** Switch active colors instantly (Ocean, Sunset, Forest, Lavender, Cherry, Amber, Rose, Teal, Indigo, Emerald, Coral, Slate).
- **Dark/Light Mode:** Full dark and light themes that seamlessly re-render all ambient background assets.

### ⏱️ Core Productivity Tools
- **Advanced Timer:** Focus Pomodoros, Short Breaks, and Long Breaks with precise, clock-synchronized tick handlers.
- **Integrated Task List:** Add, toggle, and complete tasks directly inside the sidebar layout.
- **Session Stats:** Track completed sessions and total accumulated focus time.
- **Smart Settings:** Configure target durations, long break intervals, notification sounds, and auto-start preferences.
- **Web Audio API:** Generates synthesizer audio chime tones natively for timer completions.
- **Web Notifications API:** Sends desktop notifications when the timer completes.
- **Data Persistence:** Automatically saves all preferences, active tasks, and session statistics to `localStorage`.

### ⌨️ Keyboard Shortcuts / Klavye Kısayolları
- <kbd>Space</kbd> : Start / Pause timer (*Başlat / Duraklat*)
- <kbd>R</kbd> : Reset timer (*Sıfırla*)
- <kbd>S</kbd> : Skip current session (*Mola/Odak geç*)
- <kbd>Esc</kbd> : Close settings panel (*Ayarları kapat*)

---

## 📁 File Structure / Dosya Yapısı

```files
POMODRO/
├── index.html          # Main HTML structure with semantic tags & accessibility
├── css/
│   ├── styles.css      # Core styles importer
│   ├── variables.css   # Color tokens, fonts, layouts, and background animations
│   ├── components.css  # Buttons, timer rings, modals, and preview cards
│   └── tasks.css       # To-Do manager layout and transitions
├── js/
│   ├── app.js          # Core application logic & canvas particles engine
│   ├── config.js       # Theme definitions and background variables
│   ├── audio.js        # Sound alerts generator (Web Audio API synth)
│   └── translations.js # 12-language localized copy dictionaries
└── README.md           # This document
```

---

## 🚀 Getting Started / Nasıl Çalıştırılır?

### English
1. **Option A (Direct):** Simply double-click `index.html` to open the app directly in your browser.
2. **Option B (Server - Recommended for Notifications):** Launch a local web server in the directory.
   ```bash
   # Using Node.js
   npx http-server . -p 8080
   ```
3. Open `http://localhost:8080` in your web browser.

### Türkçe
1. **Yöntem A (Doğrudan):** Tarayıcınızda açmak için `index.html` dosyasına çift tıklamanız yeterlidir.
2. **Yöntem B (Sunucu - Bildirimler İçin Önerilir):** Proje dizininde yerel bir web sunucusu başlatın:
   ```bash
   # Node.js ile
   npx http-server . -p 8080
   ```
3. Tarayıcınızda `http://localhost:8080` adresine gidin.

---

## 📄 License / Lisans

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

*Focusly — Stay focused, stay productive.* 🍅
