const clickCounter = document.getElementById('click-counter');

const progressBar = document.getElementById('progress');

const clickCircle = document.getElementById('click-circle');

const shop = document.getElementById('shop');

let clicks = 0;

let clicksNeeded = 100;

let clickBonus = 1;



// Обновление счетчика кликов

function updateCounter() {

  clickCounter.textContent = clicks;

}



// Обновление прогресс-бара

function updateProgressBar() {

  const progressWidth = (clicks % clicksNeeded) / clicksNeeded * 100;

  progressBar.style.width = progressWidth + '%';

}



// Функция для сохранения игры

function saveGame() {

  localStorage.setItem('clicks', clicks);

  localStorage.setItem('clicksNeeded', clicksNeeded);

  localStorage.setItem('clickBonus', clickBonus);

}



// Функция для загрузки игры

function loadGame() {

  clicks = parseInt(localStorage.getItem('clicks')) || 0;

  clicksNeeded = parseInt(localStorage.getItem('clicksNeeded')) || 100;

  clickBonus = parseInt(localStorage.getItem('clickBonus')) || 1;

  updateCounter();

  updateProgressBar();

}



// Вызываем функцию загрузки игры при загрузке страницы



// Функция обработки клика по кругу

clickCircle.addEventListener('click', () => {

  clicks += clickBonus; // Добавляем бонусные клики

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
