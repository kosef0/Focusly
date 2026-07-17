/* ============================================
   FOCUSLY — Pomodoro Timer Application
   ============================================ */

'use strict';

/* 
   Note: TRANSLATIONS has been moved to js/translations.js
   Note: COLOR_THEMES has been moved to js/config.js
   Note: createNotificationSound has been moved to js/audio.js
*/

/* ---------- Application State ---------- */
const App = {
  // State
  state: {
    mode: 'pomodoro',       // 'pomodoro' | 'shortBreak' | 'longBreak'
    status: 'idle',         // 'idle' | 'running' | 'paused'
    timeRemaining: 25 * 60, // in seconds
    totalTime: 25 * 60,     // total time for current session
    sessionsCompleted: 0,
    totalFocusMinutes: 0,
    pomodoroInCycle: 0,     // 0-based index within a 4-cycle
    intervalId: null,
    tasks: [],              // Tasks list
  },

  // Settings
  settings: {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    sound: true,
    browserNotif: false,
    autoStart: false,
    theme: 'dark',
    color: 'ocean',
    background: 'aurora',
    language: 'en',
  },

  // Cached DOM elements
  els: {},

  // Sound
  sound: null,

  /* ---------- Initialization ---------- */
  init() {
    this.cacheDom();
    this.loadSettings();
    this.sound = createNotificationSound();
    this.applyLanguage();
    this.applyTheme();
    this.applyColor();
    this.applyBackground();
    this.syncSettingsUI();
    this.updateTimerDisplay();
    this.updateProgress();
    this.updateSessionInfo();
    this.updatePomoDots();
    this.showRandomQuote();
    this.bindEvents();
    this.buildLanguageDropdown();
    this.renderTasks();

    // Auto-detect language on first visit
    if (!localStorage.getItem('focusly_settings')) {
      this.autoDetectLanguage();
    }
  },

  /* ---------- Cache DOM Elements ---------- */
  cacheDom() {
    const ids = [
      'timerTime', 'timerLabel', 'timerProgress', 'timerGlow', 'timerRing',
      'startBtn', 'resetBtn', 'skipBtn',
      'tabPomodoro', 'tabShortBreak', 'tabLongBreak',
      'sessionCount', 'sessionLabel', 'totalTime', 'totalLabel',
      'pomoDots',
      'settingsBtn', 'settingsCloseBtn', 'settingsPanel', 'settingsOverlay', 'settingsTitle',
      'pomodoroInput', 'shortBreakInput', 'longBreakInput', 'longBreakIntervalInput',
      'soundToggle', 'notifToggle', 'autoStartToggle',
      'themeToggleBtn', 'darkModeBtn', 'lightModeBtn',
      'langBtn', 'langDropdown', 'languageSelect',
      'motivationText', 'motivationAuthor',
      'shortcutHint', 'footerTagline', 'toastContainer',
      // Settings labels
      'sectionTimerTitle', 'labelPomodoro', 'sublabelPomodoro',
      'labelShortBreak', 'sublabelShortBreak',
      'labelLongBreak', 'sublabelLongBreak',
      'labelLongBreakInterval', 'sublabelLongBreakInterval',
      'sectionNotificationsTitle', 'labelSound', 'labelBrowserNotif', 'labelAutoStart',
      'sectionSessionTitle', 'labelResetSession', 'sublabelResetSession',
      'resetSessionBtn', 'resetSessionBtnText',
      'sectionAppearanceTitle', 'labelThemeMode', 'labelAccentColor',
      // Tasks elements
      'tasksForm', 'tasksInput', 'tasksList', 'tasksTitle', 'tasksCount',
    ];

    ids.forEach(id => {
      this.els[id] = document.getElementById(id);
    });
  },

  /* ---------- Local Storage ---------- */
  loadSettings() {
    try {
      const saved = localStorage.getItem('focusly_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(this.settings, parsed);
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }

    // Also load session data
    try {
      const session = localStorage.getItem('focusly_session');
      if (session) {
        const parsed = JSON.parse(session);
        this.state.sessionsCompleted = parsed.sessionsCompleted || 0;
        this.state.totalFocusMinutes = parsed.totalFocusMinutes || 0;
        this.state.pomodoroInCycle = parsed.pomodoroInCycle || 0;
      }
    } catch (e) {
      console.warn('Failed to load session:', e);
    }

    // Load tasks data
    try {
      const savedTasks = localStorage.getItem('focusly_tasks');
      this.state.tasks = savedTasks ? JSON.parse(savedTasks) : [];
    } catch (e) {
      console.warn('Failed to load tasks:', e);
      this.state.tasks = [];
    }

    // Set initial time
    this.state.totalTime = this.settings.pomodoro * 60;
    this.state.timeRemaining = this.state.totalTime;
  },

  saveSettings() {
    try {
      localStorage.setItem('focusly_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  },

  saveSession() {
    try {
      localStorage.setItem('focusly_session', JSON.stringify({
        sessionsCompleted: this.state.sessionsCompleted,
        totalFocusMinutes: this.state.totalFocusMinutes,
        pomodoroInCycle: this.state.pomodoroInCycle,
      }));
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  },

  saveTasks() {
    try {
      localStorage.setItem('focusly_tasks', JSON.stringify(this.state.tasks));
    } catch (e) {
      console.warn('Failed to save tasks:', e);
    }
  },

  /* ---------- Auto Detect Language ---------- */
  autoDetectLanguage() {
    const browserLang = navigator.language.split('-')[0].toLowerCase();
    if (TRANSLATIONS[browserLang]) {
      this.settings.language = browserLang;
      this.applyLanguage();
      this.saveSettings();
    }
  },

  /* ---------- i18n ---------- */
  t(key) {
    const lang = TRANSLATIONS[this.settings.language] || TRANSLATIONS.en;
    return lang[key] || TRANSLATIONS.en[key] || key;
  },

  applyLanguage() {
    const lang = TRANSLATIONS[this.settings.language] || TRANSLATIONS.en;

    // Text direction
    document.documentElement.dir = lang.dir;
    document.documentElement.lang = this.settings.language;

    // Tabs
    if (this.els.tabPomodoro) this.els.tabPomodoro.textContent = this.t('pomodoro');
    if (this.els.tabShortBreak) this.els.tabShortBreak.textContent = this.t('shortBreak');
    if (this.els.tabLongBreak) this.els.tabLongBreak.textContent = this.t('longBreak');

    // Timer label
    this.updateTimerLabel();

    // Start button
    this.updateStartButtonText();

    // Session info
    if (this.els.sessionLabel) this.els.sessionLabel.textContent = this.t('sessions');
    if (this.els.totalLabel) this.els.totalLabel.textContent = this.t('totalFocus');

    // Settings
    if (this.els.settingsTitle) this.els.settingsTitle.textContent = this.t('settings');
    if (this.els.sectionTimerTitle) this.els.sectionTimerTitle.textContent = this.t('sectionTimer');
    if (this.els.labelPomodoro) this.els.labelPomodoro.textContent = this.t('labelPomodoro');
    if (this.els.sublabelPomodoro) this.els.sublabelPomodoro.textContent = this.t('sublabelPomodoro');
    if (this.els.labelShortBreak) this.els.labelShortBreak.textContent = this.t('labelShortBreak');
    if (this.els.sublabelShortBreak) this.els.sublabelShortBreak.textContent = this.t('sublabelShortBreak');
    if (this.els.labelLongBreak) this.els.labelLongBreak.textContent = this.t('labelLongBreak');
    if (this.els.sublabelLongBreak) this.els.sublabelLongBreak.textContent = this.t('sublabelLongBreak');
    if (this.els.labelLongBreakInterval) this.els.labelLongBreakInterval.textContent = this.t('labelLongBreakInterval');
    if (this.els.sublabelLongBreakInterval) this.els.sublabelLongBreakInterval.textContent = this.t('sublabelLongBreakInterval');
    if (this.els.sectionNotificationsTitle) this.els.sectionNotificationsTitle.textContent = this.t('sectionNotifications');
    if (this.els.labelSound) this.els.labelSound.textContent = this.t('labelSound');
    if (this.els.labelBrowserNotif) this.els.labelBrowserNotif.textContent = this.t('labelBrowserNotif');
    if (this.els.labelAutoStart) this.els.labelAutoStart.textContent = this.t('labelAutoStart');
    // Session data section
    if (this.els.sectionSessionTitle) this.els.sectionSessionTitle.textContent = this.t('sectionSession');
    if (this.els.labelResetSession) this.els.labelResetSession.textContent = this.t('labelResetSession');
    if (this.els.sublabelResetSession) this.els.sublabelResetSession.textContent = this.t('sublabelResetSession');
    if (this.els.resetSessionBtnText) this.els.resetSessionBtnText.textContent = this.t('resetAllData');

    if (this.els.sectionAppearanceTitle) this.els.sectionAppearanceTitle.textContent = this.t('sectionAppearance');
    if (this.els.labelThemeMode) this.els.labelThemeMode.textContent = this.t('labelThemeMode');
    if (this.els.labelAccentColor) this.els.labelAccentColor.textContent = this.t('labelAccentColor');
    
    // Background language apply
    const labelBg = document.getElementById('labelBackground');
    if (labelBg) labelBg.textContent = this.t('labelBackground');
    
    const names = {
      aurora: 'bgAurora',
      nebula: 'bgNebula',
      sunset: 'bgSunset',
      cyber: 'bgCyber',
      rain: 'bgRain',
      sakura: 'bgSakura',
      forest: 'bgForest',
      studio: 'bgStudio'
    };
    Object.entries(names).forEach(([key, tKey]) => {
      const el = document.getElementById(`bgName${key.charAt(0).toUpperCase() + key.slice(1)}`);
      if (el) el.textContent = this.t(tKey);
    });

    // Dark/Light buttons
    const darkSpan = document.querySelector('[data-i18n="dark"]');
    const lightSpan = document.querySelector('[data-i18n="light"]');
    if (darkSpan) darkSpan.textContent = this.t('dark');
    if (lightSpan) lightSpan.textContent = this.t('light');

    // Tasks i18n
    if (this.els.tasksTitle) this.els.tasksTitle.textContent = this.t('tasks');
    if (this.els.tasksInput) this.els.tasksInput.placeholder = this.t('addTaskPlaceholder');
    this.renderTasks();

    // Shortcut hint
    if (this.els.shortcutHint) {
      this.els.shortcutHint.innerHTML = `<kbd>Space</kbd> ${this.t('shortcutHint')}`;
    }

    // Footer
    if (this.els.footerTagline) this.els.footerTagline.textContent = this.t('footerTagline');

    // Title
    document.title = `Focusly — ${this.t('pomodoro')}`;

    // Quote
    this.showRandomQuote();
  },

  /* ---------- Theme ---------- */
  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.settings.theme);
    if (this.els.themeToggleBtn) {
      this.els.themeToggleBtn.textContent = this.settings.theme === 'dark' ? '🌙' : '☀️';
    }

    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.content = this.settings.theme === 'dark' ? '#0a0e1a' : '#f4f6fb';
    }

    // Appearance toggle buttons
    document.querySelectorAll('.appearance-btn').forEach(btn => {
      btn.classList.toggle('appearance-btn--active', btn.dataset.appearance === this.settings.theme);
    });

    // Refresh canvas particle styles on theme change
    this.initCanvasEffects();
  },

  /* ---------- Color ---------- */
  applyColor() {
    const theme = COLOR_THEMES[this.settings.color];
    if (!theme) return;

    document.documentElement.style.setProperty('--hue-primary', theme.primary);
    document.documentElement.style.setProperty('--hue-accent', theme.accent);

    // Update active button
    document.querySelectorAll('.theme-color-btn').forEach(btn => {
      const isActive = btn.dataset.color === this.settings.color;
      btn.classList.toggle('theme-color-btn--active', isActive);
      btn.setAttribute('aria-checked', isActive);
    });
  },

  /* ---------- Background ---------- */
  applyBackground() {
    const bg = this.settings.background || 'aurora';
    document.body.setAttribute('data-bg', bg);

    // Update active button classes in Settings panel
    document.querySelectorAll('.bg-option-card').forEach(card => {
      const isActive = card.dataset.bg === bg;
      card.classList.toggle('bg-option-card--active', isActive);
      card.setAttribute('aria-checked', isActive);
    });

    // Start or stop canvas dynamic animations (Rain/Sakura)
    this.initCanvasEffects();
  },

  /* ---------- Canvas Dynamic Effects (Rain/Sakura) ---------- */
  canvasAnimId: null,
  canvasCtx: null,
  particles: [],

  initCanvasEffects() {
    // Stop any existing loop
    if (this.canvasAnimId) {
      cancelAnimationFrame(this.canvasAnimId);
      this.canvasAnimId = null;
    }

    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    const bg = this.settings.background;
    if (bg !== 'rain' && bg !== 'sakura') {
      // Clear canvas and do nothing else
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    this.canvasCtx = canvas.getContext('2d');
    this.particles = [];

    // Resize handler
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create particles based on background
    const particleCount = bg === 'rain' ? 120 : 40;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle(bg, true));
    }

    // Animation Loop
    const draw = () => {
      if (this.settings.background !== bg) {
        window.removeEventListener('resize', resizeCanvas);
        return;
      }
      
      const ctx = this.canvasCtx;
      const w = canvas.width;
      const h = canvas.height;

      if (bg === 'rain') {
        // Rain trail effect using translucent background fill
        ctx.fillStyle = this.settings.theme === 'dark' ? 'rgba(10, 14, 26, 0.25)' : 'rgba(244, 246, 251, 0.25)';
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.clearRect(0, 0, w, h);
      }

      this.particles.forEach(p => {
        this.updateAndDrawParticle(p, ctx, w, h);
      });

      this.canvasAnimId = requestAnimationFrame(draw);
    };

    this.canvasAnimId = requestAnimationFrame(draw);
  },

  createParticle(type, initRandomY = false) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (type === 'rain') {
      return {
        x: Math.random() * w,
        y: initRandomY ? Math.random() * h : -20,
        length: 15 + Math.random() * 20,
        speed: 10 + Math.random() * 8,
        opacity: 0.15 + Math.random() * 0.2,
        weight: 1.5 + Math.random() * 1
      };
    } else if (type === 'sakura') {
      return {
        x: Math.random() * w,
        y: initRandomY ? Math.random() * h : -20,
        size: 5 + Math.random() * 6,
        speedX: -1.5 + Math.random() * 1.5,
        speedY: 1 + Math.random() * 1.5,
        density: 1 + Math.random() * 1,
        opacity: 0.5 + Math.random() * 0.4,
        angle: Math.random() * 360,
        spin: -1 + Math.random() * 2
      };
    }
  },

  updateAndDrawParticle(p, ctx, w, h) {
    const bg = this.settings.background;

    if (bg === 'rain') {
      // Draw Rain Streak
      ctx.beginPath();
      ctx.strokeStyle = this.settings.theme === 'dark' 
        ? `rgba(156, 163, 175, ${p.opacity})` 
        : `rgba(75, 85, 99, ${p.opacity})`;
      ctx.lineWidth = p.weight;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + (p.speed * 0.05), p.y + p.length); // Slight wind angle
      ctx.stroke();

      // Update position
      p.y += p.speed;
      p.x += p.speed * 0.05;

      // Reset when particle goes off screen
      if (p.y > h || p.x > w) {
        Object.assign(p, this.createParticle('rain', false));
      }
    } else if (bg === 'sakura') {
      // Draw Sakura Petal (smooth curved oval shape)
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      
      // Petal shape
      ctx.beginPath();
      ctx.fillStyle = `rgba(244, 143, 177, ${p.opacity})`; // Soft pink
      // Draw half petal curves
      ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, 2 * Math.PI);
      ctx.fill();

      // Highlight line on petal
      ctx.beginPath();
      ctx.strokeStyle = `rgba(240, 98, 146, ${p.opacity * 0.5})`;
      ctx.lineWidth = 0.8;
      ctx.moveTo(-p.size, 0);
      ctx.lineTo(p.size, 0);
      ctx.stroke();

      ctx.restore();

      // Update position
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.y / 30) * 0.5; // Natural swaying motion
      p.angle += p.spin;

      // Reset when particle goes off screen
      if (p.y > h || p.x < -20 || p.x > w + 20) {
        Object.assign(p, this.createParticle('sakura', false));
      }
    }
  },

  /* ---------- Sync Settings UI ---------- */
  syncSettingsUI() {
    if (this.els.pomodoroInput) this.els.pomodoroInput.value = this.settings.pomodoro;
    if (this.els.shortBreakInput) this.els.shortBreakInput.value = this.settings.shortBreak;
    if (this.els.longBreakInput) this.els.longBreakInput.value = this.settings.longBreak;
    if (this.els.longBreakIntervalInput) this.els.longBreakIntervalInput.value = this.settings.longBreakInterval;
    if (this.els.soundToggle) this.els.soundToggle.checked = this.settings.sound;
    if (this.els.notifToggle) this.els.notifToggle.checked = this.settings.browserNotif;
    if (this.els.autoStartToggle) this.els.autoStartToggle.checked = this.settings.autoStart;
  },

  /* ---------- Build Language Dropdown ---------- */
  buildLanguageDropdown() {
    const dropdown = this.els.langDropdown;
    if (!dropdown) return;

    dropdown.innerHTML = '';
    Object.entries(TRANSLATIONS).forEach(([code, data]) => {
      const btn = document.createElement('button');
      btn.className = 'language-option';
      if (code === this.settings.language) btn.classList.add('language-option--active');
      btn.dataset.lang = code;
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', code === this.settings.language);
      btn.innerHTML = `<span class="language-option__flag">${data.flag}</span> ${data.lang}`;
      dropdown.appendChild(btn);
    });
  },

  /* ---------- Event Binding ---------- */
  bindEvents() {
    // Start / Pause
    this.els.startBtn?.addEventListener('click', () => this.toggleTimer());

    // Reset
    this.els.resetBtn?.addEventListener('click', () => this.resetTimer());

    // Skip
    this.els.skipBtn?.addEventListener('click', () => this.skipSession());

    // Mode tabs
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchMode(tab.dataset.mode));
    });

    // Settings open/close
    this.els.settingsBtn?.addEventListener('click', () => this.openSettings());
    this.els.settingsCloseBtn?.addEventListener('click', () => this.closeSettings());
    this.els.settingsOverlay?.addEventListener('click', () => this.closeSettings());

    // Theme toggle (header)
    this.els.themeToggleBtn?.addEventListener('click', () => {
      this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme();
      this.saveSettings();
    });

    // Appearance buttons (in settings)
    this.els.darkModeBtn?.addEventListener('click', () => {
      this.settings.theme = 'dark';
      this.applyTheme();
      this.saveSettings();
    });
    this.els.lightModeBtn?.addEventListener('click', () => {
      this.settings.theme = 'light';
      this.applyTheme();
      this.saveSettings();
    });

    // Color theme buttons
    document.querySelectorAll('.theme-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.settings.color = btn.dataset.color;
        this.applyColor();
        this.saveSettings();
      });
    });

    // Background option buttons
    document.querySelectorAll('.bg-option-card').forEach(card => {
      card.addEventListener('click', () => {
        this.settings.background = card.dataset.bg;
        this.applyBackground();
        this.saveSettings();
      });
    });

    // Number inputs (+/- buttons)
    document.querySelectorAll('.number-input__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const step = btn.dataset.action === 'increase' ? 1 : -1;
        const newVal = Math.max(
          parseInt(input.min) || 1,
          Math.min(parseInt(input.max) || 90, (parseInt(input.value) || 0) + step)
        );
        input.value = newVal;
        this.onSettingInputChange(input);
      });
    });

    // Direct input change
    [this.els.pomodoroInput, this.els.shortBreakInput, this.els.longBreakInput, this.els.longBreakIntervalInput].forEach(input => {
      if (input) {
        input.addEventListener('change', () => this.onSettingInputChange(input));
      }
    });

    // Toggle switches
    this.els.soundToggle?.addEventListener('change', () => {
      this.settings.sound = this.els.soundToggle.checked;
      this.saveSettings();
    });

    this.els.notifToggle?.addEventListener('change', () => {
      if (this.els.notifToggle.checked) {
        this.requestNotificationPermission();
      }
      this.settings.browserNotif = this.els.notifToggle.checked;
      this.saveSettings();
    });

    this.els.autoStartToggle?.addEventListener('change', () => {
      this.settings.autoStart = this.els.autoStartToggle.checked;
      this.saveSettings();
    });

    // Reset session button (double-click to confirm)
    this.els.resetSessionBtn?.addEventListener('click', () => {
      this.handleResetSessionClick();
    });

    // Language dropdown
    this.els.langBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.els.langDropdown?.classList.toggle('language-select__dropdown--open');
    });

    this.els.langDropdown?.addEventListener('click', (e) => {
      const option = e.target.closest('.language-option');
      if (!option) return;
      this.settings.language = option.dataset.lang;
      this.applyLanguage();
      this.buildLanguageDropdown();
      this.saveSettings();
      this.els.langDropdown?.classList.remove('language-select__dropdown--open');
    });

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#languageSelect')) {
        this.els.langDropdown?.classList.remove('language-select__dropdown--open');
      }
    });

    // Tasks form submit
    this.els.tasksForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addTask();
    });

    // Tasks list click interactions (checkbox / delete)
    this.els.tasksList?.addEventListener('click', (e) => {
      const target = e.target;
      const item = target.closest('.task-item');
      if (!item) return;

      const taskId = parseInt(item.dataset.id);

      if (target.closest('.task-item__delete')) {
        this.deleteTask(taskId);
      } else {
        // Toggle completion when clicking checkbox or item content
        this.toggleTask(taskId);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Don't trigger when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.toggleTimer();
          break;
        case 'KeyR':
          if (!e.ctrlKey && !e.metaKey) this.resetTimer();
          break;
        case 'KeyS':
          if (!e.ctrlKey && !e.metaKey) this.skipSession();
          break;
        case 'Escape':
          this.closeSettings();
          break;
      }
    });

    // Visibility change — pause tracking but keep timer accurate
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.state.status === 'running') {
        // Resync with wallclock
        this.resyncTimer();
      }
    });
  },

  /* ---------- Settings Input Handler ---------- */
  onSettingInputChange(input) {
    const val = parseInt(input.value) || 1;
    const min = parseInt(input.min) || 1;
    const max = parseInt(input.max) || 90;
    const clamped = Math.max(min, Math.min(max, val));
    input.value = clamped;

    const mapping = {
      pomodoroInput: 'pomodoro',
      shortBreakInput: 'shortBreak',
      longBreakInput: 'longBreak',
      longBreakIntervalInput: 'longBreakInterval',
    };

    const settingKey = mapping[input.id];
    if (settingKey) {
      this.settings[settingKey] = clamped;
      this.saveSettings();

      // If editing the current mode's duration and timer is idle, update
      if (this.state.status === 'idle') {
        const modeMapping = {
          pomodoro: 'pomodoro',
          shortBreak: 'shortBreak',
          longBreak: 'longBreak',
        };
        if (modeMapping[this.state.mode] === settingKey) {
          this.state.totalTime = clamped * 60;
          this.state.timeRemaining = clamped * 60;
          this.updateTimerDisplay();
          this.updateProgress();
        }
      }

      // Update pomo dots if interval changed
      if (settingKey === 'longBreakInterval') {
        this.updatePomoDots();
      }
    }

    this.showToast(this.t('settingsSaved'));
  },

  /* ---------- Timer Control ---------- */
  toggleTimer() {
    if (this.state.status === 'idle' || this.state.status === 'paused') {
      this.startTimer();
    } else {
      this.pauseTimer();
    }
  },

  startTimer() {
    this.state.status = 'running';
    this.state.startedAt = Date.now();
    this.state.startedWithRemaining = this.state.timeRemaining;
    this.state._lastTickSecond = null;
    this.updateStartButtonText();
    this.els.timerRing?.classList.add('timer-ring--running');

    this.state.intervalId = setInterval(() => this.tick(), 200);
  },

  pauseTimer() {
    this.state.status = 'paused';
    this.updateStartButtonText();
    this.els.timerRing?.classList.remove('timer-ring--running');

    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = null;
    }
  },

  resetTimer() {
    this.pauseTimer();
    this.state.status = 'idle';
    this.state._lastTickSecond = null;
    const modeMinutes = this.getModeMinutes(this.state.mode);
    this.state.totalTime = modeMinutes * 60;
    this.state.timeRemaining = this.state.totalTime;
    this.updateTimerDisplay();
    this.updateProgress();
    this.updateStartButtonText();
    this.updateTitle();
  },

  skipSession() {
    this.pauseTimer();
    this.state.status = 'idle';
    this.onSessionComplete();
  },

  tick() {
    // Use wallclock time for accuracy
    const elapsed = (Date.now() - this.state.startedAt) / 1000;
    this.state.timeRemaining = Math.max(0, this.state.startedWithRemaining - elapsed);

    this.updateTimerDisplay();
    this.updateProgress();
    this.updateTitle();

    // Countdown tick-tock in the last 5 seconds
    if (this.settings.sound && this.state.timeRemaining > 0 && this.state.timeRemaining <= 5.5) {
      const secondsLeft = Math.ceil(this.state.timeRemaining);
      if (secondsLeft >= 1 && secondsLeft <= 5 && secondsLeft !== this.state._lastTickSecond) {
        this.state._lastTickSecond = secondsLeft;
        this.sound?.playCountdownTick(secondsLeft);
      }
    }

    if (this.state.timeRemaining <= 0) {
      this.state._lastTickSecond = null;
      this.onTimerComplete();
    }
  },

  resyncTimer() {
    if (this.state.status !== 'running') return;
    const elapsed = (Date.now() - this.state.startedAt) / 1000;
    this.state.timeRemaining = Math.max(0, this.state.startedWithRemaining - elapsed);

    if (this.state.timeRemaining <= 0) {
      this.onTimerComplete();
    } else {
      this.updateTimerDisplay();
      this.updateProgress();
    }
  },

  onTimerComplete() {
    this.pauseTimer();
    this.state.status = 'idle';
    this.state.timeRemaining = 0;

    // Animate
    this.els.timerRing?.classList.add('timer-ring--complete');
    setTimeout(() => {
      this.els.timerRing?.classList.remove('timer-ring--complete');
    }, 600);

    // Sound
    if (this.settings.sound) {
      this.sound?.playComplete();
    }

    // Notification
    const isPomodoro = this.state.mode === 'pomodoro';

    if (this.settings.browserNotif) {
      this.sendBrowserNotification(
        isPomodoro ? this.t('notifPomoTitle') : this.t('notifBreakTitle'),
        isPomodoro ? this.t('notifPomoBody') : this.t('notifBreakBody')
      );
    }

    // Toast
    this.showToast(isPomodoro ? this.t('pomodoroComplete') : this.t('breakComplete'));

    this.onSessionComplete();
  },

  onSessionComplete() {
    const wasPomodoro = this.state.mode === 'pomodoro';

    if (wasPomodoro) {
      this.state.sessionsCompleted++;
      this.state.totalFocusMinutes += this.settings.pomodoro;
      this.state.pomodoroInCycle++;

      // Check if long break
      if (this.state.pomodoroInCycle >= this.settings.longBreakInterval) {
        this.switchMode('longBreak');
        this.state.pomodoroInCycle = 0;
      } else {
        this.switchMode('shortBreak');
      }
    } else {
      this.switchMode('pomodoro');
    }

    this.updateSessionInfo();
    this.updatePomoDots();
    this.saveSession();

    // Auto-start
    if (this.settings.autoStart) {
      setTimeout(() => this.startTimer(), 1000);
    }
  },

  /* ---------- Mode Switching ---------- */
  switchMode(mode) {
    // Stop current timer
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = null;
    }
    this.state.status = 'idle';
    this.state.mode = mode;

    const minutes = this.getModeMinutes(mode);
    this.state.totalTime = minutes * 60;
    this.state.timeRemaining = this.state.totalTime;

    // Update tab styling
    document.querySelectorAll('.mode-tab').forEach(tab => {
      const isActive = tab.dataset.mode === mode;
      tab.classList.toggle('mode-tab--active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });

    this.els.timerRing?.classList.remove('timer-ring--running');

    this.updateTimerDisplay();
    this.updateProgress();
    this.updateTimerLabel();
    this.updateStartButtonText();
    this.updateTitle();
    this.showRandomQuote();
  },

  getModeMinutes(mode) {
    switch (mode) {
      case 'pomodoro': return this.settings.pomodoro;
      case 'shortBreak': return this.settings.shortBreak;
      case 'longBreak': return this.settings.longBreak;
      default: return 25;
    }
  },

  /* ---------- UI Updates ---------- */
  updateTimerDisplay() {
    const totalSeconds = Math.ceil(this.state.timeRemaining);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (this.els.timerTime) {
      this.els.timerTime.textContent = display;
    }
  },

  updateProgress() {
    const circumference = 2 * Math.PI * 155; // ~974
    const progress = this.state.totalTime > 0
      ? this.state.timeRemaining / this.state.totalTime
      : 1;
    const offset = circumference * (1 - progress);

    if (this.els.timerProgress) {
      this.els.timerProgress.style.strokeDashoffset = offset;
    }
    if (this.els.timerGlow) {
      this.els.timerGlow.style.strokeDashoffset = offset;
    }
  },

  updateTimerLabel() {
    if (!this.els.timerLabel) return;
    switch (this.state.mode) {
      case 'pomodoro':
        this.els.timerLabel.textContent = this.t('focus');
        break;
      case 'shortBreak':
        this.els.timerLabel.textContent = this.t('break');
        break;
      case 'longBreak':
        this.els.timerLabel.textContent = this.t('longBreakLabel');
        break;
    }
  },

  updateStartButtonText() {
    if (!this.els.startBtn) return;
    switch (this.state.status) {
      case 'idle':
        this.els.startBtn.textContent = `▶ ${this.t('start')}`;
        break;
      case 'running':
        this.els.startBtn.textContent = `⏸ ${this.t('pause')}`;
        break;
      case 'paused':
        this.els.startBtn.textContent = `▶ ${this.t('resume')}`;
        break;
    }
  },

  updateTitle() {
    const totalSeconds = Math.ceil(this.state.timeRemaining);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const modeLabel = this.t(this.state.mode === 'pomodoro' ? 'focus' : 'break');
    document.title = this.state.status === 'running'
      ? `${display} — ${modeLabel} | Focusly`
      : `Focusly — ${this.t('pomodoro')}`;
  },

  updateSessionInfo() {
    if (this.els.sessionCount) {
      this.els.sessionCount.textContent = this.state.sessionsCompleted;
    }
    if (this.els.totalTime) {
      const hours = Math.floor(this.state.totalFocusMinutes / 60);
      const mins = this.state.totalFocusMinutes % 60;
      this.els.totalTime.textContent = hours > 0
        ? `${hours}h ${mins}m`
        : `${mins}m`;
    }
  },

  updatePomoDots() {
    const container = this.els.pomoDots;
    if (!container) return;

    const interval = this.settings.longBreakInterval;
    const completed = this.state.pomodoroInCycle;

    container.innerHTML = '';
    for (let i = 0; i < interval; i++) {
      const dot = document.createElement('div');
      dot.className = 'pomo-dot';
      if (i < completed) {
        dot.classList.add('pomo-dot--filled');
      } else if (i === completed && this.state.mode === 'pomodoro') {
        dot.classList.add('pomo-dot--active');
      }
      container.appendChild(dot);
    }
  },

  /* ---------- Tasks Feature ---------- */
  addTask() {
    const input = this.els.tasksInput;
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const newTask = {
      id: Date.now(),
      text,
      completed: false
    };

    this.state.tasks.push(newTask);
    this.saveTasks();
    this.renderTasks();

    input.value = '';
  },

  toggleTask(id) {
    const task = this.state.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
    }
  },

  deleteTask(id) {
    const item = document.querySelector(`.task-item[data-id="${id}"]`);
    if (item) {
      item.classList.add('task-item--deleting');
      setTimeout(() => {
        this.state.tasks = this.state.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
      }, 250);
    } else {
      this.state.tasks = this.state.tasks.filter(t => t.id !== id);
      this.saveTasks();
      this.renderTasks();
    }
  },

  renderTasks() {
    const list = this.els.tasksList;
    if (!list) return;

    list.innerHTML = '';
    const tasks = this.state.tasks;

    if (tasks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'task-empty';
      empty.textContent = this.t('noTasks');
      list.appendChild(empty);
    } else {
      tasks.forEach(task => {
        const item = document.createElement('li');
        item.className = `task-item ${task.completed ? 'task-item--completed' : ''}`;
        item.dataset.id = task.id;
        item.innerHTML = `
          <div class="task-item__content">
            <input type="checkbox" class="task-item__checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark completed">
            <span class="task-item__text">${this.escapeHTML(task.text)}</span>
          </div>
          <button class="task-item__delete" aria-label="Delete task" title="Delete">✕</button>
        `;
        list.appendChild(item);
      });
    }

    // Update badge
    const count = this.els.tasksCount;
    if (count) {
      const completed = tasks.filter(t => t.completed).length;
      count.textContent = `${completed} / ${tasks.length}`;
    }
  },

  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /* ---------- Motivational Quotes ---------- */
  showRandomQuote() {
    const lang = TRANSLATIONS[this.settings.language] || TRANSLATIONS.en;
    const quotes = lang.quotes || TRANSLATIONS.en.quotes;
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    if (this.els.motivationText) {
      this.els.motivationText.textContent = quote.text;
    }
    if (this.els.motivationAuthor) {
      this.els.motivationAuthor.textContent = quote.author;
    }
  },

  /* ---------- Reset Session ---------- */
  resetSessionConfirmTimeout: null,

  handleResetSessionClick() {
    const btn = this.els.resetSessionBtn;
    if (!btn) return;

    // If already in confirm state, execute reset
    if (btn.classList.contains('btn--confirm')) {
      clearTimeout(this.resetSessionConfirmTimeout);
      this.resetFullSession();
      btn.classList.remove('btn--confirm');
      if (this.els.resetSessionBtnText) {
        this.els.resetSessionBtnText.textContent = this.t('resetAllData');
      }
      return;
    }

    // Enter confirm state
    btn.classList.add('btn--confirm');
    if (this.els.resetSessionBtnText) {
      this.els.resetSessionBtnText.textContent = this.t('confirmReset');
    }

    // Auto-cancel after 3 seconds
    this.resetSessionConfirmTimeout = setTimeout(() => {
      btn.classList.remove('btn--confirm');
      if (this.els.resetSessionBtnText) {
        this.els.resetSessionBtnText.textContent = this.t('resetAllData');
      }
    }, 3000);
  },

  resetFullSession() {
    // Stop any running timer
    this.pauseTimer();
    this.state.status = 'idle';

    // Reset session state
    this.state.sessionsCompleted = 0;
    this.state.totalFocusMinutes = 0;
    this.state.pomodoroInCycle = 0;

    // Reset tasks
    this.state.tasks = [];

    // Reset mode to pomodoro
    this.state.mode = 'pomodoro';
    const minutes = this.settings.pomodoro;
    this.state.totalTime = minutes * 60;
    this.state.timeRemaining = this.state.totalTime;

    // Clear localStorage session & tasks
    localStorage.removeItem('focusly_session');
    localStorage.removeItem('focusly_tasks');

    // Update all UI
    this.updateTimerDisplay();
    this.updateProgress();
    this.updateStartButtonText();
    this.updateTimerLabel();
    this.updateSessionInfo();
    this.updatePomoDots();
    this.renderTasks();
    this.updateTitle();

    // Update tab styling
    document.querySelectorAll('.mode-tab').forEach(tab => {
      const isActive = tab.dataset.mode === 'pomodoro';
      tab.classList.toggle('mode-tab--active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });

    this.els.timerRing?.classList.remove('timer-ring--running');

    this.showToast(this.t('sessionResetSuccess'));
    this.showRandomQuote();
  },

  /* ---------- Settings Panel ---------- */
  openSettings() {
    this.els.settingsPanel?.classList.add('settings-panel--open');
    this.els.settingsOverlay?.classList.add('settings-overlay--open');
    this.els.settingsPanel?.setAttribute('aria-hidden', 'false');
    this.els.settingsOverlay?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },

  closeSettings() {
    this.els.settingsPanel?.classList.remove('settings-panel--open');
    this.els.settingsOverlay?.classList.remove('settings-overlay--open');
    this.els.settingsPanel?.setAttribute('aria-hidden', 'true');
    this.els.settingsOverlay?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },

  /* ---------- Toast Notifications ---------- */
  showToast(message) {
    const container = this.els.toastContainer;
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
      toast.remove();
    }, 3500);
  },

  /* ---------- Browser Notifications ---------- */
  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },

  sendBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '🍅',
        badge: '🍅',
        tag: 'focusly-timer',
      });
    }
  },
};

/* ---------- Bootstrap ---------- */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
