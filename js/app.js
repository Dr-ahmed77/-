/**
 * Ethereal Sanctuary - Main Application Logic
 * ============================================
 */

// ============================================
// Global State
// ============================================
const AppState = {
  // Timer State
  timer: {
    timeRemaining: 25 * 60, // 25 minutes in seconds
    totalTime: 25 * 60,
    isRunning: false,
    interval: null,
    mode: 'focus', // 'focus', 'shortBreak', 'longBreak'
    modes: {
      focus: { time: 25 * 60, label: 'Focus' },
      shortBreak: { time: 5 * 60, label: 'Short Break' },
      longBreak: { time: 15 * 60, label: 'Long Break' }
    }
  },
  
  // Tasks State
  tasks: [
    { id: 1, title: 'Finalize Sanctuary Q3 Design', priority: 'high', completed: false },
    { id: 2, title: 'Review User Feedback Logs', priority: 'medium', completed: false },
    { id: 3, title: 'Update Component Library', priority: 'low', completed: false },
    { id: 4, title: 'Team Sync: Morning Ritual', priority: 'medium', completed: true }
  ],
  
  // Habits State
  habits: [
    { id: 1, name: 'Read for 30m', streak: 12, progress: 85, days: [1, 1, 1, 1, 1, 0, 0] },
    { id: 2, name: 'Meditate', streak: 5, progress: 42, days: [1, 1, 1, 0, 0, 0, 0] },
    { id: 3, name: 'Drink 2L Water', streak: 32, progress: 100, days: [1, 1, 1, 1, 1, 1, 1] }
  ],
  
  // Ambient Sounds State
  sounds: {
    rain: 50,
    forest: 25,
    coffee: 0,
    whitenoise: 75
  },
  
  // User Stats
  stats: {
    focusTime: 38.4,
    streak: 7,
    level: 14,
    xp: 2450,
    xpToNext: 3200
  }
};

// ============================================
// Timer Functions
// ============================================
const Timer = {
  init() {
    this.updateDisplay();
    this.setupEventListeners();
  },
  
  setupEventListeners() {
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    const resetBtn = document.getElementById('timer-reset');
    const skipBtn = document.getElementById('timer-skip');
    
    if (startBtn) startBtn.addEventListener('click', () => this.start());
    if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
    if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
    if (skipBtn) skipBtn.addEventListener('click', () => this.skip());
    
    // Mode switchers
    document.querySelectorAll('.timer-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
    });
  },
  
  start() {
    if (AppState.timer.isRunning) return;
    
    AppState.timer.isRunning = true;
    this.updateButtonState();
    
    AppState.timer.interval = setInterval(() => {
      if (AppState.timer.timeRemaining > 0) {
        AppState.timer.timeRemaining--;
        this.updateDisplay();
        this.updateProgressRing();
      } else {
        this.complete();
      }
    }, 1000);
  },
  
  pause() {
    AppState.timer.isRunning = false;
    clearInterval(AppState.timer.interval);
    this.updateButtonState();
  },
  
  reset() {
    this.pause();
    AppState.timer.timeRemaining = AppState.timer.modes[AppState.timer.mode].time;
    this.updateDisplay();
    this.updateProgressRing();
  },
  
  skip() {
    this.pause();
    const modes = ['focus', 'shortBreak', 'longBreak'];
    const currentIndex = modes.indexOf(AppState.timer.mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    this.switchMode(nextMode);
  },
  
  switchMode(mode) {
    this.pause();
    AppState.timer.mode = mode;
    AppState.timer.totalTime = AppState.timer.modes[mode].time;
    AppState.timer.timeRemaining = AppState.timer.modes[mode].time;
    
    // Update UI
    document.querySelectorAll('.timer-mode-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.mode === mode) btn.classList.add('active');
    });
    
    const label = document.getElementById('timer-label');
    if (label) label.textContent = AppState.timer.modes[mode].label;
    
    this.updateDisplay();
    this.updateProgressRing();
  },
  
  complete() {
    this.pause();
    
    // Play notification sound (if supported)
    this.playNotification();
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Ethereal Sanctuary', {
        body: `${AppState.timer.modes[AppState.timer.mode].label} session complete!`,
        icon: '/images/icon.png'
      });
    }
    
    // Auto-switch to next mode
    if (AppState.timer.mode === 'focus') {
      this.switchMode('shortBreak');
    } else {
      this.switchMode('focus');
    }
  },
  
  updateDisplay() {
    const minutes = Math.floor(AppState.timer.timeRemaining / 60);
    const seconds = AppState.timer.timeRemaining % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) timerDisplay.textContent = display;
    
    // Update page title
    document.title = `${display} - Ethereal Sanctuary`;
  },
  
  updateProgressRing() {
    const circle = document.getElementById('timer-progress');
    if (!circle) return;
    
    const circumference = 2 * Math.PI * 154;
    const progress = AppState.timer.timeRemaining / AppState.timer.totalTime;
    const offset = circumference * (1 - progress);
    
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
  },
  
  updateButtonState() {
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    
    if (startBtn && pauseBtn) {
      if (AppState.timer.isRunning) {
        startBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
      } else {
        startBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
      }
    }
  },
  
  playNotification() {
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio notification not supported');
    }
  }
};

// ============================================
// Tasks Functions
// ============================================
const Tasks = {
  init() {
    this.render();
    this.setupEventListeners();
  },
  
  setupEventListeners() {
    const addBtn = document.getElementById('add-task-btn');
    const input = document.getElementById('new-task-input');
    
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addTask());
    }
    
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.addTask();
      });
    }
  },
  
  render() {
    const container = document.getElementById('tasks-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    AppState.tasks.forEach((task, index) => {
      const taskEl = this.createTaskElement(task, index);
      container.appendChild(taskEl);
    });
    
    this.updateStats();
  },
  
  createTaskElement(task, index) {
    const div = document.createElement('div');
    div.className = `group flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer ${
      task.completed ? 'task-completed bg-surface-container/30' : 'bg-surface-container hover:bg-surface-container-high'
    }`;
    div.style.animationDelay = `${index * 0.1}s`;
    div.classList.add('animate-fade-in');
    
    const priorityClass = `badge-${task.priority}`;
    const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    
    div.innerHTML = `
      <span class="material-symbols-outlined drag-handle">drag_indicator</span>
      <div class="checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}">
        ${task.completed ? '<span class="material-symbols-outlined">check</span>' : ''}
      </div>
      <div class="flex-1">
        <p class="task-title font-medium ${task.completed ? 'text-on-surface/60' : 'text-on-surface'}">${task.title}</p>
      </div>
      <span class="badge ${priorityClass}">${priorityText}</span>
    `;
    
    // Toggle completion
    const checkbox = div.querySelector('.checkbox');
    checkbox.addEventListener('click', () => this.toggleTask(task.id));
    
    return div;
  },
  
  toggleTask(id) {
    const task = AppState.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.render();
    }
  },
  
  addTask() {
    const input = document.getElementById('new-task-input');
    if (!input || !input.value.trim()) return;
    
    const newTask = {
      id: Date.now(),
      title: input.value.trim(),
      priority: 'medium',
      completed: false
    };
    
    AppState.tasks.unshift(newTask);
    input.value = '';
    this.render();
  },
  
  updateStats() {
    const pendingCount = AppState.tasks.filter(t => !t.completed).length;
    const badge = document.getElementById('pending-count');
    if (badge) badge.textContent = `${pendingCount} Pending`;
  }
};

// ============================================
// Habits Functions
// ============================================
const Habits = {
  init() {
    this.render();
    this.setupEventListeners();
  },
  
  setupEventListeners() {
    const addBtn = document.getElementById('add-habit-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddHabitModal());
    }
  },
  
  render() {
    const container = document.getElementById('habits-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    AppState.habits.forEach((habit, index) => {
      const habitEl = this.createHabitElement(habit, index);
      container.appendChild(habitEl);
    });
  },
  
  createHabitElement(habit, index) {
    const div = document.createElement('div');
    div.className = 'glass-card rounded-lg p-6 flex flex-col md:flex-row md:items-center gap-6 border-none group hover:bg-surface-container-highest/80 transition-all duration-300 animate-fade-in';
    div.style.animationDelay = `${index * 0.1}s`;
    
    const daysHtml = habit.days.map((completed, i) => {
      const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      return `
        <div class="flex flex-col items-center gap-2">
          <span class="text-[10px] text-on-surface-variant font-bold">${dayLabels[i]}</span>
          <div class="habit-day ${completed ? 'completed' : 'pending'} cursor-pointer" data-habit="${habit.id}" data-day="${i}">
            ${completed ? '<span class="material-symbols-outlined text-on-secondary text-sm filled">check</span>' : ''}
          </div>
        </div>
      `;
    }).join('');
    
    const iconMap = {
      'Read for 30m': 'menu_book',
      'Meditate': 'self_improvement',
      'Drink 2L Water': 'water_drop'
    };
    
    const colorMap = {
      'Read for 30m': 'secondary',
      'Meditate': 'primary',
      'Drink 2L Water': 'tertiary'
    };
    
    const icon = iconMap[habit.name] || 'star';
    const color = colorMap[habit.name] || 'primary';
    
    div.innerHTML = `
      <div class="flex items-center gap-4 min-w-[240px]">
        <div class="w-14 h-14 rounded-full bg-${color}-container flex items-center justify-center text-${color}">
          <span class="material-symbols-outlined text-3xl">${icon}</span>
        </div>
        <div>
          <h3 class="text-lg font-bold font-headline text-on-surface">${habit.name}</h3>
          <p class="text-sm text-secondary-dim font-medium">${habit.streak} Day Streak</p>
        </div>
      </div>
      <div class="flex-grow">
        <div class="flex justify-between mb-4">
          <span class="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Weekly Progress</span>
          <span class="text-xs font-bold text-primary">${habit.progress}% Complete</span>
        </div>
        <div class="flex justify-between items-center gap-2">
          ${daysHtml}
        </div>
      </div>
    `;
    
    // Add click handlers for days
    div.querySelectorAll('.habit-day').forEach(dayEl => {
      dayEl.addEventListener('click', (e) => {
        const habitId = parseInt(e.currentTarget.dataset.habit);
        const dayIndex = parseInt(e.currentTarget.dataset.day);
        this.toggleDay(habitId, dayIndex);
      });
    });
    
    return div;
  },
  
  toggleDay(habitId, dayIndex) {
    const habit = AppState.habits.find(h => h.id === habitId);
    if (habit) {
      habit.days[dayIndex] = habit.days[dayIndex] ? 0 : 1;
      habit.progress = Math.round((habit.days.filter(d => d).length / 7) * 100);
      this.render();
    }
  },
  
  showAddHabitModal() {
    const name = prompt('Enter habit name:');
    if (name && name.trim()) {
      AppState.habits.push({
        id: Date.now(),
        name: name.trim(),
        streak: 0,
        progress: 0,
        days: [0, 0, 0, 0, 0, 0, 0]
      });
      this.render();
    }
  }
};

// ============================================
// Ambient Sounds
// ============================================
const AmbientSounds = {
  audioContexts: {},
  
  init() {
    this.setupEventListeners();
  },
  
  setupEventListeners() {
    document.querySelectorAll('.sound-slider').forEach(slider => {
      const soundType = slider.dataset.sound;
      const fill = slider.querySelector('.sound-slider-fill');
      
      // Set initial value
      const initialValue = AppState.sounds[soundType] || 0;
      if (fill) fill.style.width = `${initialValue}%`;
      
      slider.addEventListener('click', (e) => {
        const rect = slider.getBoundingClientRect();
        const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        
        AppState.sounds[soundType] = Math.round(percent);
        if (fill) fill.style.width = `${percent}%`;
        
        // Update percentage display
        const percentEl = slider.parentElement.querySelector('.sound-percent');
        if (percentEl) percentEl.textContent = `${Math.round(percent)}%`;
        
        // Play/stop sound based on volume
        if (percent > 0) {
          this.playSound(soundType, percent / 100);
        } else {
          this.stopSound(soundType);
        }
      });
    });
  },
  
  playSound(type, volume) {
    // This is a placeholder - in a real app, you'd load actual audio files
    console.log(`Playing ${type} at volume ${volume}`);
  },
  
  stopSound(type) {
    console.log(`Stopping ${type}`);
  }
};

// ============================================
// Background Switcher
// ============================================
const BackgroundSwitcher = {
  backgrounds: [
    { id: 'workspace', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80', thumb: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=60' },
    { id: 'forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80', thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&q=60' },
    { id: 'rain', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1920&q=80', thumb: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=200&q=60' },
    { id: 'coffee', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=80', thumb: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&q=60' }
  ],
  
  init() {
    this.setupEventListeners();
    this.renderThumbnails();
  },
  
  setupEventListeners() {
    const toggleBtn = document.getElementById('bg-toggle');
    const picker = document.getElementById('bg-picker');
    
    if (toggleBtn && picker) {
      toggleBtn.addEventListener('click', () => {
        picker.classList.toggle('hidden');
      });
    }
  },
  
  renderThumbnails() {
    const container = document.getElementById('bg-thumbnails');
    if (!container) return;
    
    container.innerHTML = this.backgrounds.map((bg, i) => `
      <div class="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer transition-all ${i === 0 ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'}"
           data-bg="${bg.id}" onclick="BackgroundSwitcher.setBackground('${bg.id}')">
        <img src="${bg.thumb}" alt="${bg.id}" class="w-full h-full object-cover">
      </div>
    `).join('');
  },
  
  setBackground(id) {
    const bg = this.backgrounds.find(b => b.id === id);
    if (!bg) return;
    
    const bgElement = document.getElementById('main-bg');
    if (bgElement) {
      bgElement.style.opacity = '0';
      setTimeout(() => {
        bgElement.src = bg.url;
        bgElement.onload = () => {
          bgElement.style.opacity = '1';
        };
      }, 300);
    }
    
    // Update active state
    document.querySelectorAll('#bg-thumbnails > div').forEach(el => {
      el.classList.remove('ring-2', 'ring-primary');
      el.classList.add('opacity-60');
      if (el.dataset.bg === id) {
        el.classList.add('ring-2', 'ring-primary');
        el.classList.remove('opacity-60');
      }
    });
  }
};

// ============================================
// Navigation
// ============================================
const Navigation = {
  init() {
    this.setupEventListeners();
    this.highlightCurrentPage();
  },
  
  setupEventListeners() {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sideNav = document.querySelector('.side-nav');
    
    if (menuToggle && sideNav) {
      menuToggle.addEventListener('click', () => {
        sideNav.classList.toggle('open');
      });
    }
    
    // Close mobile menu on link click
    document.querySelectorAll('.side-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (sideNav) sideNav.classList.remove('open');
      });
    });
  },
  
  highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const pageMap = {
      'index.html': 'home',
      'dashboard.html': 'dashboard',
      'tasks.html': 'tasks',
      'habits.html': 'habits',
      'study.html': 'study'
    };
    
    const currentId = pageMap[currentPage];
    if (!currentId) return;
    
    document.querySelectorAll('.side-nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.page === currentId) {
        link.classList.add('active');
      }
    });
    
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.page === currentId) {
        btn.classList.add('active');
      }
    });
  }
};

// ============================================
// Stats & Animations
// ============================================
const Stats = {
  init() {
    this.animateNumbers();
    this.setupCharts();
  },
  
  animateNumbers() {
    document.querySelectorAll('[data-animate]').forEach(el => {
      const target = parseFloat(el.dataset.target);
      const duration = 1000;
      const start = 0;
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (target - start) * easeOut;
        
        el.textContent = current.toFixed(1);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    });
  },
  
  setupCharts() {
    // Animate chart bars on dashboard
    document.querySelectorAll('.chart-bar').forEach((bar, i) => {
      setTimeout(() => {
        bar.style.transform = 'scaleY(1)';
      }, i * 100);
    });
  }
};

// ============================================
// Initialize App
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // Initialize all modules
  Navigation.init();
  Timer.init();
  Tasks.init();
  Habits.init();
  AmbientSounds.init();
  BackgroundSwitcher.init();
  Stats.init();
  
  console.log('🌟 Ethereal Sanctuary initialized');
});

// Export for global access
window.AppState = AppState;
window.Timer = Timer;
window.Tasks = Tasks;
window.Habits = Habits;
window.BackgroundSwitcher = BackgroundSwitcher;
