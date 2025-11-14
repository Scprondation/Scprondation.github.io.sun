// script.js
const clickCounter = document.getElementById('click-counter');
const progressBar = document.getElementById('progress');
const clickCircle = document.getElementById('click-circle');
const shop = document.getElementById('shop');
const levelElement = document.getElementById('level');
const coinsElement = document.getElementById('coins');
const cpsElement = document.getElementById('cps');
const powerElement = document.getElementById('power');
const clickPowerElement = document.getElementById('click-power');
const floatingText = document.getElementById('floating-text');

let clicks = 0;
let coins = 0;
let level = 1;
let clicksNeeded = 100;
let clickPower = 1;
let autoClickers = 0;
let cps = 0;
let achievements = {};

// Инициализация игры
function initGame() {
  loadGame();
  updateAll();
  startAutoClickers();
  
  // Показываем начальное сообщение
  showFloatingText("Добро пожаловать!", clickCircle);
}

// Обновление всего интерфейса
function updateAll() {
  updateCounter();
  updateProgressBar();
  updateShop();
  updateAchievements();
  updateStats();
}

// Обновление счетчика кликов
function updateCounter() {
  clickCounter.textContent = clicks.toLocaleString();
  coinsElement.textContent = `🪙 ${coins.toLocaleString()}`;
  levelElement.textContent = `Уровень: ${level}`;
}

// Обновление прогресс-бара
function updateProgressBar() {
  const progressWidth = Math.min((clicks % clicksNeeded) / clicksNeeded * 100, 100);
  progressBar.style.width = progressWidth + '%';
  
  // Проверка уровня
  if (clicks >= clicksNeeded * level) {
    levelUp();
  }
}

// Повышение уровня
function levelUp() {
  level++;
  clicksNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
  coins += level * 10;
  showFloatingText(`Уровень ${level}! +${level*10}🪙`, clickCircle);
  updateAll();
}

// Обновление магазина
function updateShop() {
  document.querySelectorAll('.item').forEach(item => {
    const price = parseInt(item.dataset.price);
    const button = item.querySelector('.buy-button');
    
    if (coins >= price) {
      button.disabled = false;
      button.classList.remove('disabled');
    } else {
      button.disabled = true;
      button.classList.add('disabled');
    }
  });
}

// Обновление достижений
function updateAchievements() {
  document.querySelectorAll('.achievement').forEach(achievement => {
    const target = parseInt(achievement.dataset.target);
    const progressFill = achievement.querySelector('.progress-fill');
    const achievementIcon = achievement.querySelector('.achievement-icon');
    const progress = Math.min((clicks / target) * 100, 100);
    
    progressFill.style.width = progress + '%';
    
    if (clicks >= target && !achievements[target]) {
      achievements[target] = true;
      achievementIcon.textContent = '🏆';
      achievement.classList.add('completed');
      coins += target / 10;
      showFloatingText(`Достижение! +${target/10}🪙`, achievement);
      saveGame();
    }
  });
}

// Обновление статистики
function updateStats() {
  cpsElement.textContent = cps;
  powerElement.textContent = clickPower;
}

// Показ всплывающего текста
function showFloatingText(text, element) {
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

// Автокликеры
function startAutoClickers() {
  setInterval(() => {
    if (autoClickers > 0) {
      const autoClicks = autoClickers;
      clicks += autoClicks;
      cps = autoClicks;
      updateAll();
      saveGame();
    }
  }, 1000);
}

// Сохранение игры
function saveGame() {
  const gameData = {
    clicks,
    coins,
    level,
    clickPower,
    autoClickers,
    achievements,
    cps
  };
  localStorage.setItem('clickerGame', JSON.stringify(gameData));
}

// Загрузка игры
function loadGame() {
  const saved = localStorage.getItem('clickerGame');
  if (saved) {
    const gameData = JSON.parse(saved);
    clicks = gameData.clicks || 0;
    coins = gameData.coins || 0;
    level = gameData.level || 1;
    clickPower = gameData.clickPower || 1;
    autoClickers = gameData.autoClickers || 0;
    achievements = gameData.achievements || {};
    cps = gameData.cps || 0;
  }
}

// Обработка клика по кругу
clickCircle.addEventListener('click', (e) => {
  clicks += clickPower;
  coins += clickPower;
  
  // Анимация клика
  clickCircle.style.transform = 'scale(0.95)';
  setTimeout(() => {
    clickCircle.style.transform = 'scale(1)';
  }, 100);
  
  // Показываем силу клика
  clickPowerElement.style.opacity = '1';
  clickPowerElement.textContent = `+${clickPower}`;
  setTimeout(() => {
    clickPowerElement.style.opacity = '0';
  }, 500);
  
  // Случайная позиция для текста
  const rect = clickCircle.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  clickPowerElement.style.left = x + 'px';
  clickPowerElement.style.top = y + 'px';
  
  updateAll();
  saveGame();
});

// Обработка покупок
shop.addEventListener('click', (event) => {
  if (event.target.tagName === 'BUTTON' && !event.target.disabled) {
    const item = event.target.closest('.item');
    const price = parseInt(item.dataset.price);
    const type = item.dataset.type;
    
    if (coins >= price) {
      coins -= price;
      
      if (type === 'click') {
        if (price === 100) {
          clickPower += 1;
          showFloatingText("+1 к клику!", item);
        } else if (price === 500) {
          clickPower += 2;
          showFloatingText("+2 к клику!", item);
        }
      } else if (type === 'auto') {
        if (price === 300) {
          autoClickers += 1;
          showFloatingText("+1 автоклик!", item);
        } else if (price === 1000) {
          autoClickers += 2;
          showFloatingText("+2 автоклика!", item);
        }
      }
      
      // Увеличиваем цену
      item.dataset.price = Math.floor(price * 1.5);
      event.target.textContent = event.target.textContent.replace(
        price, 
        Math.floor(price * 1.5)
      );
      
      updateAll();
      saveGame();
    }
  }
});

// Запуск игры
initGame();
  updateProgressBar();

}



// Вызываем функцию загрузки игры при загрузке страницы



// Функция обработки клика по кругу

clickCircle.addEventListener('click', () => {

  clicks += 1+clickBonus; // Добавляем бонусные клики

  updateCounter();

  updateProgressBar();

  saveGame();

  // Проверка на достижение цели

  if (clicks >= clicksNeeded) {

    clicksNeeded *= 5;

    

    updateProgressBar();

  }

});



// Функция обработки покупки

function buyItem(item) {

  const price = parseInt(item.dataset.price);



  if (clicks >= price) {

    clicks -= price;

    updateCounter();



    clickBonus++;

    item.querySelector('button').textContent = `${clickBonus} клик +1 за ${price * 2}`;

    item.dataset.price = price * 2; // Увеличиваем цену для следующей покупки

    updateProgressBar();

  } else {

    navigator.vibrate(200);

  }

}



// Добавление обработчиков кликов на кнопки в магазине

shop.addEventListener('click', (event) => {

  if (event.target.tagName === 'BUTTON') {

    const item = event.target.closest('.item');

    buyItem(item);

  }

});



// Инициализация счетчика и прогресс-бара

updateCounter();

updateProgressBar();

loadGame()
