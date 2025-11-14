// Firebase configuration - ЗАМЕНИТЕ НА ВАШУ КОНФИГУРАЦИЮ
  const firebaseConfig = {
    apiKey: "AIzaSyCUXW9TZ7oV4kXLEjgupYIKmdrXJAqM_aA",
    authDomain: "suns-2264b.firebaseapp.com",
    projectId: "suns-2264b",
    storageBucket: "suns-2264b.firebasestorage.app",
    messagingSenderId: "390208772280",
    appId: "1:390208772280:web:acdaa3725fc43a2c87bc4d",
    measurementId: "G-YV5XD309R4"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

class ClickerGame {
  constructor() {
    this.clicks = 0;
    this.coins = 0;
    this.level = 1;
    this.clicksNeeded = 100;
    this.clickPower = 1;
    this.autoClickers = 0;
    this.cps = 0;
    this.achievements = {};
    this.items = {};
    this.userId = null;
    this.userName = null;
    this.isLoading = true;
    this.leaderboardFilter = 'clicks';
    this.leaderboardData = [];
    this.myRank = null;
    this.isTelegramUser = false;
    
    this.init();
  }
  
  async init() {
    try {
      await this.setupUser();
      this.setupEventListeners();
      this.startAutoClickers();
      this.updateAll();
      this.hideLoading();
      
      // Показываем приветственное сообщение
      setTimeout(() => {
        this.showFloatingText('Добро пожаловать! Кликай!', document.getElementById('click-circle'));
      }, 500);
    } catch (error) {
      console.error('Error initializing game:', error);
      this.hideLoading();
    }
  }
  
  async setupUser() {
    // Пытаемся получить данные Telegram пользователя
    if (window.Telegram && window.Telegram.WebApp) {
      const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
      
      if (tgUser && tgUser.id) {
        // Пользователь из Telegram
        this.userId = `tg_${tgUser.id}`;
        this.userName = tgUser.first_name || tgUser.username || 'Telegram User';
        this.isTelegramUser = true;
        
        // Инициализируем Telegram Web App
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        
        console.log('Telegram user detected:', tgUser);
      }
    }
    
    // Если не Telegram пользователь, создаем локальный аккаунт
    if (!this.userId) {
      let localUserId = localStorage.getItem('clickerUserId');
      if (!localUserId) {
        localUserId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('clickerUserId', localUserId);
      }
      this.userId = localUserId;
      this.userName = 'Локальный игрок';
      this.isTelegramUser = false;
    }
    
    // Загружаем данные пользователя
    await this.loadUserData();
  }
  
  async loadUserData() {
    try {
      // Для Telegram пользователей загружаем из Firebase
      if (this.isTelegramUser) {
        const doc = await db.collection('users').doc(this.userId).get();
        
        if (doc.exists) {
          const data = doc.data();
          this.clicks = data.clicks || 0;
          this.coins = data.coins || 0;
          this.level = data.level || 1;
          this.clickPower = data.clickPower || 1;
          this.autoClickers = data.autoClickers || 0;
          this.achievements = data.achievements || {};
          this.cps = data.cps || 0;
          this.items = data.items || {};
          
          console.log('Loaded from Firebase:', data);
        } else {
          // Создаем нового пользователя в Firebase
          await this.saveUserData();
        }
      } else {
        // Для локальных пользователей загружаем из localStorage
        this.loadFromLocalStorage();
      }
      
      // Восстанавливаем уровни предметов
      this.restoreItemLevels();
      
    } catch (error) {
      console.error('Error loading user data:', error);
      // В случае ошибки загружаем из localStorage
      this.loadFromLocalStorage();
    }
  }
  
  async saveUserData() {
    try {
      const userData = {
        userId: this.userId,
        userName: this.userName,
        isTelegramUser: this.isTelegramUser,
        clicks: this.clicks,
        coins: this.coins,
        level: this.level,
        clickPower: this.clickPower,
        autoClickers: this.autoClickers,
        achievements: this.achievements,
        cps: this.cps,
        items: this.items,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        lastPlayed: new Date().toISOString()
      };
      
      // Для Telegram пользователей сохраняем в Firebase
      if (this.isTelegramUser) {
        await db.collection('users').doc(this.userId).set(userData, { merge: true });
        console.log('Saved to Firebase');
      }
      
      // Всегда сохраняем в localStorage для резервной копии
      this.saveToLocalStorage();
      
    } catch (error) {
      console.error('Error saving user data:', error);
      this.saveToLocalStorage();
    }
  }
  
  saveToLocalStorage() {
    const gameData = {
      clicks: this.clicks,
      coins: this.coins,
      level: this.level,
      clickPower: this.clickPower,
      autoClickers: this.autoClickers,
      achievements: this.achievements,
      cps: this.cps,
      items: this.items,
      userName: this.userName
    };
    localStorage.setItem('clickerGameData', JSON.stringify(gameData));
  }
  
  loadFromLocalStorage() {
    const saved = localStorage.getItem('clickerGameData');
    if (saved) {
      const gameData = JSON.parse(saved);
      this.clicks = gameData.clicks || 0;
      this.coins = gameData.coins || 0;
      this.level = gameData.level || 1;
      this.clickPower = gameData.clickPower || 1;
      this.autoClickers = gameData.autoClickers || 0;
      this.achievements = gameData.achievements || {};
      this.cps = gameData.cps || 0;
      this.items = gameData.items || {};
      this.userName = gameData.userName || 'Локальный игрок';
      
      console.log('Loaded from localStorage');
    }
  }
  
  restoreItemLevels() {
    document.querySelectorAll('.shop-item').forEach(item => {
      const basePrice = parseInt(item.dataset.price);
      const type = item.dataset.type;
      const power = parseInt(item.dataset.power);
      const itemKey = `${type}_${power}`;
      
      if (this.items[itemKey]) {
        const level = this.items[itemKey].level || 0;
        const currentPrice = this.items[itemKey].price || basePrice;
        
        item.querySelector('.item-level span').textContent = level;
        item.querySelector('.buy-button').textContent = `${currentPrice} 🪙`;
        item.dataset.price = currentPrice;
      }
    });
  }
  
  setupEventListeners() {
    // Клик по кругу
    const clickCircle = document.getElementById('click-circle');
    clickCircle.addEventListener('click', (e) => {
      this.handleClick(e);
    });
    
    // Переключение вкладок
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const tabId = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });
    
    // Покупки в магазине
    document.querySelectorAll('.shop-item .buy-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = e.target.closest('.shop-item');
        this.buyItem(item);
      });
    });

    // Фильтры лидерборда
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.currentTarget.dataset.filter;
        this.changeLeaderboardFilter(filter);
      });
    });

    // Обновление лидерборда при открытии вкладки
    document.querySelector('[data-tab="leaderboard-tab"]').addEventListener('click', () => {
      setTimeout(() => {
        this.loadLeaderboard();
      }, 100);
    });
  }
  
  handleClick(e) {
    if (this.isLoading) return;
    
    const circle = document.getElementById('click-circle');
    const clickPower = document.getElementById('click-power');
    
    // Добавляем клики и монеты
    this.clicks += this.clickPower;
    this.coins += this.clickPower;
    
    // Анимация клика
    circle.style.transform = 'scale(0.95)';
    setTimeout(() => {
      circle.style.transform = 'scale(1)';
    }, 100);
    
    // Показываем силу клика
    const rect = circle.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    clickPower.style.left = x + 'px';
    clickPower.style.top = y + 'px';
    clickPower.textContent = `+${this.clickPower}`;
    clickPower.style.opacity = '1';
    
    setTimeout(() => {
      clickPower.style.opacity = '0';
    }, 500);
    
    // Эффект частиц
    this.createParticles(x, y);
    
    this.updateAll();
    this.saveGame();
  }
  
  createParticles(x, y) {
    const circle = document.getElementById('click-circle');
    for (let i = 0; i < 3; i++) {
      const particle = document.createElement('div');
      particle.className = 'floating-text';
      particle.textContent = `+${this.clickPower}`;
      particle.style.left = (x + circle.offsetLeft) + 'px';
      particle.style.top = (y + circle.offsetTop) + 'px';
      particle.style.color = i % 2 === 0 ? '#ffeb3b' : '#ff6b35';
      particle.style.animationDelay = `${i * 0.1}s`;
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        if (particle.parentNode) {
          particle.remove();
        }
      }, 2000);
    }
  }
  
  switchTab(tabId) {
    if (this.isLoading) return;
    
    // Убираем активный класс со всех вкладок и кнопок
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.remove('active');
    });
    
    // Активируем выбранную вкладку
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  }
  
  buyItem(item) {
    if (this.isLoading) return;
    
    const price = parseInt(item.dataset.price);
    const type = item.dataset.type;
    const power = parseInt(item.dataset.power);
    
    if (this.coins >= price) {
      this.coins -= price;
      
      if (type === 'click') {
        this.clickPower += power;
        this.showFloatingText(`+${power} к клику!`, item);
      } else if (type === 'auto') {
        this.autoClickers += power;
        this.showFloatingText(`+${power} автоклик/сек!`, item);
      }
      
      // Увеличиваем уровень предмета
      const levelElement = item.querySelector('.item-level span');
      const currentLevel = parseInt(levelElement.textContent);
      const newLevel = currentLevel + 1;
      levelElement.textContent = newLevel;
      
      // Сохраняем данные предмета
      const itemKey = `${type}_${power}`;
      this.items[itemKey] = {
        level: newLevel,
        price: Math.floor(price * 1.8)
      };
      
      // Увеличиваем цену
      const newPrice = Math.floor(price * 1.8);
      item.dataset.price = newPrice;
      item.querySelector('.buy-button').textContent = `${newPrice} 🪙`;
      
      this.updateAll();
      this.saveGame();
    } else {
      // Вибрация при недостатке монет
      if (navigator.vibrate) navigator.vibrate(200);
      this.showFloatingText('Недостаточно монет!', item);
    }
  }

  changeLeaderboardFilter(filter) {
    this.leaderboardFilter = filter;
    
    // Обновляем активную кнопку
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Сортируем и отображаем лидерборд
    this.sortAndDisplayLeaderboard();
  }

  async loadLeaderboard() {
    try {
      const leaderboardItems = document.getElementById('leaderboard-items');
      leaderboardItems.innerHTML = '<div class="leaderboard-loading">Загрузка лидеров...</div>';
      
      const snapshot = await db.collection('users')
        .where('clicks', '>', 0)
        .get();
      
      this.leaderboardData = [];
      let totalClicks = 0;
      let totalPlayers = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.clicks > 0) {
          this.leaderboardData.push({
            id: doc.id,
            ...data
          });
          totalClicks += data.clicks;
          totalPlayers++;
        }
      });

      // Обновляем общую статистику
      document.getElementById('total-players').textContent = totalPlayers.toLocaleString();
      document.getElementById('total-clicks').textContent = totalClicks.toLocaleString();

      // Находим свой рейтинг
      this.findMyRank();
      
      // Сортируем и отображаем
      this.sortAndDisplayLeaderboard();
      
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      document.getElementById('leaderboard-items').innerHTML = 
        '<div class="leaderboard-error">Ошибка загрузки лидеров</div>';
    }
  }

  findMyRank() {
    const sortedData = [...this.leaderboardData].sort((a, b) => b.clicks - a.clicks);
    this.myRank = sortedData.findIndex(player => player.id === this.userId) + 1;
    
    const myRankElement = document.getElementById('my-rank-info');
    if (this.myRank > 0) {
      const myData = sortedData[this.myRank - 1];
      myRankElement.innerHTML = `
        <div class="my-rank-item">
          <div class="rank">${this.myRank}</div>
          <div class="player">${this.userName}</div>
          <div class="score">${myData.clicks.toLocaleString()}</div>
          <div class="level">${myData.level || 1}</div>
        </div>
      `;
    } else {
      myRankElement.innerHTML = '<div class="no-rank">Вы еще не в рейтинге</div>';
    }
  }

  sortAndDisplayLeaderboard() {
    const sortedData = [...this.leaderboardData];
    
    // Сортируем по выбранному фильтру
    switch (this.leaderboardFilter) {
      case 'clicks':
        sortedData.sort((a, b) => b.clicks - a.clicks);
        break;
      case 'level':
        sortedData.sort((a, b) => (b.level || 1) - (a.level || 1));
        break;
      case 'coins':
        sortedData.sort((a, b) => (b.coins || 0) - (a.coins || 0));
        break;
    }
    
    // Берем топ-20
    const topPlayers = sortedData.slice(0, 20);
    
    // Отображаем лидерборд
    const leaderboardItems = document.getElementById('leaderboard-items');
    leaderboardItems.innerHTML = '';

    if (topPlayers.length === 0) {
      leaderboardItems.innerHTML = '<div class="no-data">Пока нет игроков в рейтинге</div>';
      return;
    }

    topPlayers.forEach((player, index) => {
      const rank = index + 1;
      const isCurrentUser = player.id === this.userId;
      
      const item = document.createElement('div');
      item.className = `leaderboard-item ${isCurrentUser ? 'current-user' : ''}`;
      item.innerHTML = `
        <div class="rank ${rank <= 3 ? `top-${rank}` : ''}">${rank}</div>
        <div class="player">
          ${isCurrentUser ? '👤 ' : ''}${player.userName || 'Аноним'}
          ${rank === 1 ? '👑' : ''}
        </div>
        <div class="score">${this.getPlayerScore(player)}</div>
        <div class="level">${player.level || 1}</div>
      `;
      
      leaderboardItems.appendChild(item);
    });
  }

  getPlayerScore(player) {
    switch (this.leaderboardFilter) {
      case 'clicks':
        return player.clicks.toLocaleString();
      case 'level':
        return (player.level || 1).toLocaleString();
      case 'coins':
        return (player.coins || 0).toLocaleString();
      default:
        return player.clicks.toLocaleString();
    }
  }
  
  startAutoClickers() {
    setInterval(() => {
      if (this.autoClickers > 0 && !this.isLoading) {
        this.clicks += this.autoClickers;
        this.coins += this.autoClickers;
        this.cps = this.autoClickers;
        this.updateAll();
        this.saveGame();
      }
    }, 1000);
  }
  
  updateAll() {
    this.updateCounter();
    this.updateProgressBar();
    this.updateShop();
    this.updateAchievements();
    this.updateStats();
  }
  
  updateCounter() {
    document.getElementById('click-counter').textContent = this.clicks.toLocaleString();
    document.getElementById('coins').textContent = `🪙 ${this.coins.toLocaleString()}`;
    document.getElementById('level').textContent = `Ур. ${this.level}`;
    document.getElementById('clicks-count').textContent = `👆 ${this.clicks.toLocaleString()}`;
  }
  
  updateProgressBar() {
    const progressWidth = Math.min((this.clicks % this.clicksNeeded) / this.clicksNeeded * 100, 100);
    document.getElementById('progress').style.width = progressWidth + '%';
    
    // Проверка уровня
    if (this.clicks >= this.clicksNeeded * this.level) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.clicksNeeded = Math.floor(100 * Math.pow(1.5, this.level - 1));
    this.coins += this.level * 20;
    this.showFloatingText(`Уровень ${this.level}! +${this.level*20}🪙`, document.getElementById('click-circle'));
    this.updateAll();
  }
  
  updateShop() {
    document.querySelectorAll('.shop-item').forEach(item => {
      const price = parseInt(item.dataset.price);
      const button = item.querySelector('.buy-button');
      
      if (this.coins >= price) {
        button.disabled = false;
        button.classList.remove('disabled');
      } else {
        button.disabled = true;
        button.classList.add('disabled');
      }
    });
  }
  
  updateAchievements() {
    document.querySelectorAll('.achievement-card').forEach(achievement => {
      const target = parseInt(achievement.dataset.target);
      const type = achievement.dataset.type;
      const progressFill = achievement.querySelector('.progress-fill');
      const progressText = achievement.querySelector('.progress-text');
      const achievementIcon = achievement.querySelector('.achievement-icon');
      
      let current = 0;
      let progress = 0;
      
      if (type === 'clicks') {
        current = this.clicks;
        progress = Math.min((this.clicks / target) * 100, 100);
      } else if (type === 'power') {
        current = this.clickPower;
        progress = Math.min((this.clickPower / target) * 100, 100);
      }
      
      progressFill.style.width = progress + '%';
      progressText.textContent = `${Math.min(current, target)}/${target}`;
      
      if (current >= target && !this.achievements[target]) {
        this.achievements[target] = true;
        achievementIcon.textContent = '🏆';
        achievement.classList.add('completed');
        const reward = target <= 1000 ? target / 10 : 200;
        this.coins += reward;
        this.showFloatingText(`Достижение! +${reward}🪙`, achievement);
        this.saveGame();
      }
    });
  }
  
  updateStats() {
    document.getElementById('power').textContent = this.clickPower;
    document.getElementById('cps').textContent = this.cps;
  }
  
  showFloatingText(text, element) {
    const rect = element.getBoundingClientRect();
    const floating = document.createElement('div');
    floating.className = 'floating-text';
    floating.textContent = text;
    floating.style.left = rect.left + rect.width / 2 + 'px';
    floating.style.top = rect.top + 'px';
    
    document.body.appendChild(floating);
    
    setTimeout(() => {
      if (floating.parentNode) {
        floating.remove();
      }
    }, 2000);
  }
  
  hideLoading() {
    this.isLoading = false;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('main-interface').style.display = 'flex';
  }
  
  async saveGame() {
    await this.saveUserData();
  }
}

// Запуск игры когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
  new ClickerGame();
});
