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

// Функция обработки клика по кругу
clickCircle.addEventListener('click', (event) => {
  const clickValue = clickBonus; // Значение клика
  clicks += clickValue; // Добавляем бонусные клики
  updateCounter();
  updateProgressBar();
      

// Функция обработки покупки
function buyItem(item) {
  const price = parseInt(item.dataset.price);

  if (clicks >= price) {
    clicks -= price;
    updateCounter();

    clickBonus++;
    item.querySelector('.buy-button').textContent = `+1 клик за ${price * clickBonus})`;
    item.dataset.price = price * 2; // Увеличиваем цену для следующей покупки
  } else {
    alert('Недостаточно кликов!');
  }
}

// Добавление обработчиков кликов на кнопки в магазине
shop.addEventListener('click', (event) => {
  if (event.target.classList.contains('buy-button')) {
    const item = event.target.closest('.item');
    buyItem(item);
  }
});

// Инициализация счетчика и прогресс-бара
updateCounter();
updateProgressBar();