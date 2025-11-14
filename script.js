// script.js
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
    
    this.init();
  }
  
  init() {
    this.loadGame();
    this.setupEventListeners();
    this.startAutoClickers();
    this.updateAll();
    this.showWelcomeMessage();
  }
  
  setupEventListeners() {
    // Клик по кругу
    document.getElementById('click-circle').addEventListener('click', (e) => {
      this.handleClick(e);
    });
    
    // Переключение вкладок
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.switchTab(e.currentTarget.dataset.tab);
      });
    });
    
    // Покупки в магазине
    document.querySelectorAll('.shop-item').forEach(item => {
      const button = item.querySelector('.buy-button');
      button.addEventListener('click', () => {
        this.buyItem(item);
      });
    });
  }
  
  handleClick(e) {
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
    for (let i = 0; i < 5; i++) {
      const particle = document.createElement('div');
      particle.className = 'floating-text';
      particle.textContent = `+${this.clickPower}`;
      particle.style.left = (x + circle.offsetLeft) + 'px';
      particle.style.top = (y + circle.offsetTop) + 'px';
      particle.style.color = i % 2 === 0 ? '#ffeb3b' : '#ff6b35';
      
      // Случайное направление
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 50;
      
      particle.style.setProperty('--end-x', Math.cos(angle) * distance + 'px');
      particle.style.setProperty('--end-y', Math.sin(angle) * distance + 'px');
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 2000);
    }
  }
  
  switchTab(tabId) {
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
      levelElement.textContent = currentLevel + 1;
      
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
  
  startAutoClickers() {
    setInterval(() => {
      if (this.autoClickers > 0) {
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
      const progressFill = achievement.querySelector('.progress-fill');
      const progressText = achievement.querySelector('.progress-text');
      const achievementIcon = achievement.querySelector('.achievement-icon');
      
      let progress = 0;
      let current = 0;
      
      if (target <= 1000) {
        // Достижения по кликам
        current = this.clicks;
        progress = Math.min((this.clicks / target) * 100, 100);
      } else {
        // Достижения по силе клика
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
      floating.remove();
    }, 2000);
  }
  
  showWelcomeMessage() {
    setTimeout(() => {
      this.showFloatingText('Добро пожаловать! Кликай!', document.getElementById('click-circle'));
    }, 1000);
  }
  
  saveGame() {
    const gameData = {
      clicks: this.clicks,
      coins: this.coins,
      level: this.level,
      clickPower: this.clickPower,
      autoClickers: this.autoClickers,
      achievements: this.achievements,
      cps: this.cps
    };
    localStorage.setItem('clickerGame', JSON.stringify(gameData));
  }
  
  loadGame() {
    const saved = localStorage.getItem('clickerGame');
    if (saved) {
      const gameData = JSON.parse(saved);
      this.clicks = gameData.clicks || 0;
      this.coins = gameData.coins || 0;
      this.level = gameData.level || 1;
      this.clickPower = gameData.clickPower || 1;
      this.autoClickers = gameData.autoClickers || 0;
      this.achievements = gameData.achievements || {};
      this.cps = gameData.cps || 0;
    }
  }
}

// Запуск игры когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
  new ClickerGame();
});
