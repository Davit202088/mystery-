// ========================
// ИНИЦИАЛИЗАЦИЯ И СОБЫТИЯ DOM
// ========================

document.addEventListener('DOMContentLoaded', async () => {
  // Загрузить боксы
  await loadBoxes();

  // Загрузить побеждающих
  await loadLeaderboard();

  // Загрузить награды если есть контейнер
  if (document.getElementById('rewardsContainer')) {
    await loadRewards();
  }

  // Обновить UI для залогиненного пользователя
  updateAuthUI();

  // Инициализировать события
  setupEventListeners();
});

// ========================
// УПРАВЛЕНИЕ АУТЕНТИФИКАЦИЕЙ
// ========================

function updateAuthUI() {
  const authMenuBtn = document.getElementById('authMenuBtn');
  const userMenuBtn = document.getElementById('userMenuBtn');
  const referralMenuBtn = document.getElementById('referralMenuBtn');

  if (currentUser) {
    // Показать меню пользователя
    authMenuBtn.style.display = 'none';
    userMenuBtn.style.display = 'block';
    referralMenuBtn.style.display = 'block';
    document.getElementById('usernameBadge').textContent = currentUser.username || 'Профиль';
  } else {
    // Показать кнопку входа
    authMenuBtn.style.display = 'block';
    userMenuBtn.style.display = 'none';
    referralMenuBtn.style.display = 'none';
  }
}

function openAuthModal() {
  document.getElementById('authModal').style.display = 'flex';
  switchTab('login');
}

function closeAuthModal() {
  document.getElementById('authModal').style.display = 'none';
}

function switchTab(tabName) {
  // Скрыть все табы
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // Убрать активный класс со всех кнопок
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Показать выбранный таб
  document.getElementById(tabName + 'Tab').classList.add('active');

  // Добавить активный класс кнопке
  event.target.classList.add('active');
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const result = await loginUser(email, password);

  if (result.success) {
    showNotification('✅ Вы успешно вошли!', 'success');
    closeAuthModal();
    updateAuthUI();
    await loadBoxes();
  } else {
    showNotification(`❌ ${result.error}`, 'error');
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const email = document.getElementById('registerEmail').value;
  const username = document.getElementById('registerUsername').value;
  const firstName = document.getElementById('registerFirstName').value;
  const lastName = document.getElementById('registerLastName').value;
  const password = document.getElementById('registerPassword').value;

  const result = await registerUser(email, password, username, firstName, lastName);

  if (result.success) {
    showNotification('✅ Регистрация успешна!', 'success');
    closeAuthModal();
    updateAuthUI();
    await loadBoxes();
  } else {
    showNotification(`❌ ${result.error}`, 'error');
  }
}

function logout() {
  logoutUser();
  closeProfileModal();
  updateAuthUI();
  showNotification('✅ Вы вышли из системы', 'success');
  loadBoxes();
}

// ========================
// УПРАВЛЕНИЕ БОКСАМИ
// ========================

async function loadBoxes() {
  const container = document.getElementById('boxesContainer');

  try {
    container.innerHTML = '<div class="loading">Загрузка боксов...</div>';

    const boxes = await getBoxes();

    if (boxes.length === 0) {
      container.innerHTML = '<p class="loading">Нет доступных боксов</p>';
      return;
    }

    container.innerHTML = boxes.map(box => `
      <div class="box-card" onclick="showBoxModal('${box.boxId}')">
        <div class="box-image" style="background-image: url('${box.image}'); background-size: cover;"></div>
        <div class="box-content">
          <div class="box-badge">${box.type.toUpperCase()}</div>
          <h3>${box.name}</h3>
          <p class="box-description">${box.description || 'Mystery Box'}</p>
          <div class="box-meta">
            <span>
              <strong>Предметов</strong>
              <span>${box.itemCount || '3-5'}</span>
            </span>
            <span>
              <strong>Редкость</strong>
              <span>${box.rarity}</span>
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="box-price">${box.price} ₽</div>
            <button class="btn btn-primary" onclick="event.stopPropagation()">
              Открыть
            </button>
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    container.innerHTML = `<p class="error">Ошибка загрузки боксов: ${error.message}</p>`;
  }
}

async function showBoxModal(boxId) {
  if (!currentUser) {
    openAuthModal();
    return;
  }

  const modal = document.getElementById('boxModal');
  const boxInfo = document.getElementById('boxInfo');
  const prizeResult = document.getElementById('prizeResult');

  boxInfo.style.display = 'block';
  prizeResult.style.display = 'none';

  try {
    const box = await getBox(boxId);

    if (!box) {
      showNotification('❌ Бокс не найден', 'error');
      return;
    }

    // Заполнить информацию о боксе
    document.getElementById('boxTitle').textContent = box.name;
    document.getElementById('boxDescription').textContent = box.description || 'Mystery Box';
    document.getElementById('boxImage').src = box.image || '/images/placeholder.png';
    document.getElementById('boxItemCount').textContent = box.itemCount || '3-5';
    document.getElementById('boxPrice').textContent = `${box.price} ₽`;
    document.getElementById('priceText').textContent = box.price;

    // Заполнить список призов
    const prizesList = document.getElementById('prizesList');
    if (box.prizes && box.prizes.length > 0) {
      prizesList.innerHTML = box.prizes.map(prize => `
        <li>
          <i class="fas fa-gift"></i>
          ${prize.name}
          ${prize.rarity ? ` <span style="color: var(--gradient-2);">(${prize.rarity})</span>` : ''}
        </li>
      `).join('');
    }

    // Сохранить ID бокса для открытия
    document.getElementById('openBoxBtn').dataset.boxId = boxId;

    modal.style.display = 'flex';

  } catch (error) {
    showNotification(`❌ Ошибка: ${error.message}`, 'error');
  }
}

function closeBoxModal() {
  document.getElementById('boxModal').style.display = 'none';
}

async function openBox() {
  if (!currentUser) {
    openAuthModal();
    return;
  }

  const boxId = document.getElementById('openBoxBtn').dataset.boxId;
  const boxInfo = document.getElementById('boxInfo');
  const animationContainer = document.getElementById('boxOpeningAnimation');
  const prizeResult = document.getElementById('prizeResult');

  try {
    // Показать анимацию загрузки
    boxInfo.style.display = 'none';
    animationContainer.style.display = 'flex';

    // Запустить анимацию рулетки
    await animateRoulette();

    // Открыть бокс
    const result = await openBox(boxId);

    // Показать результат
    displayPrizeResult(result.prize, result.newBalance);

  } catch (error) {
    showNotification(`❌ ${error.message}`, 'error');
    animationContainer.style.display = 'none';
    boxInfo.style.display = 'block';
  }
}

// Переименовать функцию открытия бокса (был конфликт имен)
async function openBoxAPI(boxId) {
  return await openBox(boxId);
}

// ========================
// АНИМАЦИЯ РУЛЕТКИ
// ========================

async function animateRoulette() {
  return new Promise((resolve) => {
    const canvas = document.getElementById('rouletteCanvas');
    const ctx = canvas.getContext('2d');

    // Установить размер canvas
    canvas.width = 300;
    canvas.height = 300;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;

    let rotation = 0;
    const spinDuration = 3000; // 3 секунды
    const startTime = Date.now();

    function drawRoulette(rotation) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Сохранить контекст
      ctx.save();

      // Перенести в центр и повернуть
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);

      // Рисовать сегменты
      const segments = 8;
      const colors = ['#7c3aed', '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

      for (let i = 0; i < segments; i++) {
        const startAngle = (i / segments) * 2 * Math.PI;
        const endAngle = ((i + 1) / segments) * 2 * Math.PI;

        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Восстановить контекст
      ctx.restore();

      // Рисовать центр
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
      ctx.fill();

      // Рисовать стрелку в верху
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(centerX, 10);
      ctx.lineTo(centerX - 10, 30);
      ctx.lineTo(centerX + 10, 30);
      ctx.closePath();
      ctx.fill();
    }

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Easing function (deceleration)
      const easeProgress = 1 - (1 - progress) ** 3;

      rotation = 360 * 10 * easeProgress; // 10 полных оборотов

      drawRoulette(rotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }

    animate();
  });
}

function displayPrizeResult(prize, newBalance) {
  const boxInfo = document.getElementById('boxInfo');
  const animationContainer = document.getElementById('boxOpeningAnimation');
  const prizeResult = document.getElementById('prizeResult');

  animationContainer.style.display = 'none';

  // Заполнить информацию о призе
  document.getElementById('prizeResultName').textContent = prize.name || 'Неизвестный приз';
  document.getElementById('prizeResultText').innerHTML = `Вы выиграли: <strong>${prize.name}</strong>`;

  if (prize.value) {
    document.getElementById('prizeResultValue').textContent = `Стоимость: ${formatCurrency(prize.value)}`;
  }

  prizeResult.style.display = 'block';

  // Обновить баланс
  if (newBalance !== undefined) {
    currentUser.balance = newBalance;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateBalanceDisplay();
  }

  // Перезагрузить побеждающих
  loadLeaderboard();
}

// ========================
// ЛИДЕРБОАРД
// ========================

async function loadLeaderboard() {
  const container = document.getElementById('winsContainer');

  try {
    const wins = await getLeaderboard(10);

    if (wins.length === 0) {
      container.innerHTML = '<p class="loading">Еще нет побед</p>';
      return;
    }

    container.innerHTML = wins.map((win, index) => `
      <div class="win-item">
        <div class="win-avatar">
          <i class="fas fa-trophy"></i>
        </div>
        <div class="win-info">
          <div class="win-player">${win.username || `Player ${index + 1}`}</div>
          <div class="win-prize">${win.name}</div>
          <div class="win-time">${formatTime(win.createdAt)}</div>
        </div>
        <div class="win-value">${formatCurrency(win.value || 0)}</div>
      </div>
    `).join('');

  } catch (error) {
    container.innerHTML = `<p class="error">Ошибка загрузки побед</p>`;
  }
}

// ========================
// ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
// ========================

function openProfileModal() {
  document.getElementById('profileModal').style.display = 'flex';
  loadProfileData();
  loadUserWins();
}

function closeProfileModal() {
  document.getElementById('profileModal').style.display = 'none';
}

async function loadProfileData() {
  try {
    const profile = await getProfile();

    if (!profile) {
      return;
    }

    document.getElementById('profileUsername').textContent = profile.username;
    document.getElementById('profileEmail').textContent = profile.email;
    document.getElementById('profileBalance').textContent = formatCurrency(profile.balance || 0);
    document.getElementById('profileBoxes').textContent = profile.totalBoxes || 0;
    document.getElementById('profileSpent').textContent = formatCurrency(profile.totalSpent || 0);

  } catch (error) {
    console.error('Ошибка загрузки профиля:', error);
  }
}

async function loadUserWins() {
  try {
    const history = await getUserHistory(5);

    const container = document.getElementById('userWinsHistory');

    if (history.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">У вас еще нет побед</p>';
      return;
    }

    container.innerHTML = history.map(win => `
      <div class="win-item">
        <div class="win-avatar" style="background: linear-gradient(90deg, var(--gradient-1), var(--gradient-2));">
          <i class="fas fa-star"></i>
        </div>
        <div class="win-info">
          <div class="win-prize">${win.prizeName}</div>
          <div class="win-time">${formatTime(win.createdAt)}</div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Ошибка загрузки побед:', error);
  }
}

function updateBalanceDisplay() {
  if (currentUser) {
    document.getElementById('profileBalance').textContent = formatCurrency(currentUser.balance || 0);
  }
}

// ========================
// ПЛАТЕЖИ
// ========================

function openPaymentModal(method) {
  document.getElementById('paymentModal').style.display = 'flex';

  const yookassaPayBtn = document.getElementById('yookassaPayBtn');
  const cryptoPayBtn = document.getElementById('cryptoPayBtn');

  if (method === 'yookassa') {
    yookassaPayBtn.style.display = 'block';
    cryptoPayBtn.style.display = 'none';
  } else {
    yookassaPayBtn.style.display = 'none';
    cryptoPayBtn.style.display = 'block';
  }
}

function closePaymentModal() {
  document.getElementById('paymentModal').style.display = 'none';
}

async function processYookassaPayment() {
  if (!currentUser) {
    openAuthModal();
    return;
  }

  const amount = parseInt(document.getElementById('paymentAmount').value);

  if (!amount || amount < 100) {
    showNotification('❌ Минимальная сумма 100 ₽', 'error');
    return;
  }

  try {
    const payment = await createPayment(amount, `Пополнение баланса на ${amount} ₽`);

    if (payment.redirectUrl) {
      // Перенаправить на платежную форму ЮКассы
      window.location.href = payment.redirectUrl;
    }

  } catch (error) {
    showNotification(`❌ ${error.message}`, 'error');
  }
}

async function processCryptoPayment() {
  showNotification('🔧 Крипто-платежи в разработке', 'info');
}

// ========================
// РЕФЕРАЛЬНАЯ ПРОГРАММА
// ========================

function openReferralModal() {
  if (!currentUser) {
    openAuthModal();
    return;
  }

  document.getElementById('referralModal').style.display = 'flex';
  generateReferralLink();
}

function closeReferralModal() {
  document.getElementById('referralModal').style.display = 'none';
}

function generateReferralLink() {
  if (!currentUser || !currentUser.userId) {
    return;
  }

  // Создать реферальную ссылку с параметром ref
  const baseUrl = window.location.origin;
  const referralLink = `${baseUrl}?ref=${currentUser.userId}`;

  const linkInput = document.getElementById('referralLink');
  if (linkInput) {
    linkInput.value = referralLink;
  }
}

function copyReferralLink() {
  const linkInput = document.getElementById('referralLink');

  if (!linkInput || !linkInput.value) {
    showNotification('❌ Ссылка не загружена', 'error');
    return;
  }

  // Копировать в буфер обмена
  navigator.clipboard.writeText(linkInput.value).then(() => {
    showNotification('✅ Ссылка скопирована в буфер обмена!', 'success');
  }).catch(() => {
    // Fallback для старых браузеров
    linkInput.select();
    document.execCommand('copy');
    showNotification('✅ Ссылка скопирована в буфер обмена!', 'success');
  });
}

function shareReferral(platform) {
  const linkInput = document.getElementById('referralLink');
  const link = linkInput ? linkInput.value : '';

  if (!link) {
    showNotification('❌ Ссылка не готова', 'error');
    return;
  }

  const message = `Присоединяйся к RULDETKA и открывай мистери боксы с призами! ${link}`;
  let shareUrl = '';

  switch (platform) {
    case 'telegram':
      shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Присоединяйся к RULDETKA!')}`;
      break;
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      break;
    case 'vk':
      shareUrl = `https://vk.com/share.php?url=${encodeURIComponent(link)}&title=RULDETKA`;
      break;
  }

  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
}

// ========================
// НАГРАДЫ И БОНУСЫ
// ========================

async function loadRewards() {
  const container = document.getElementById('rewardsContainer');

  if (!container) {
    return; // Контейнер еще не загружен на странице
  }

  try {
    container.innerHTML = '<div class="loading">Загрузка наград...</div>';

    const rewards = await getAvailableRewards();

    if (rewards.length === 0) {
      container.innerHTML = '<p class="loading">Нет доступных наград</p>';
      return;
    }

    container.innerHTML = rewards.map(reward => `
      <div class="reward-card">
        <div class="reward-icon">
          <i class="fas ${getRewardIcon(reward.type)}"></i>
        </div>
        <div class="reward-content">
          <h4>${reward.name}</h4>
          <p>${reward.description || ''}</p>
          <div class="reward-meta">
            <span class="reward-type">${getRewardTypeLabel(reward.type)}</span>
            <span class="reward-coins">
              <i class="fas fa-coins"></i> ${reward.coins}
            </span>
          </div>
        </div>
        <button class="btn btn-sm ${reward.isCompleted ? 'btn-disabled' : 'btn-primary'}"
                onclick="claimRewardAction('${reward.rewardId}')"
                ${reward.isCompleted ? 'disabled' : ''}>
          ${reward.isCompleted ? '✓ Получено' : 'Получить'}
        </button>
      </div>
    `).join('');

  } catch (error) {
    if (container) {
      container.innerHTML = `<p class="error">Ошибка загрузки наград: ${error.message}</p>`;
    }
  }
}

function getRewardIcon(type) {
  const icons = {
    'review': 'fa-star',
    'referral': 'fa-share-alt',
    'daily': 'fa-calendar-day',
    'action': 'fa-bolt',
    'bonus': 'fa-gift'
  };
  return icons[type] || 'fa-coins';
}

function getRewardTypeLabel(type) {
  const labels = {
    'review': '📝 Отзыв',
    'referral': '👥 Реферал',
    'daily': '📅 Ежедневный',
    'action': '⚡ Действие',
    'bonus': '🎁 Бонус'
  };
  return labels[type] || type;
}

async function claimRewardAction(rewardId) {
  if (!currentUser) {
    openAuthModal();
    return;
  }

  try {
    const result = await claimReward(rewardId);
    showNotification(`✅ ${result.message}`, 'success');

    // Перезагрузить награды
    await loadRewards();

    // Обновить баланс если он отображается
    updateBalanceDisplay();
  } catch (error) {
    showNotification(`❌ ${error.message}`, 'error');
  }
}

function openRewardHistoryModal() {
  if (!currentUser) {
    openAuthModal();
    return;
  }

  document.getElementById('rewardHistoryModal').style.display = 'flex';
  loadRewardHistoryData();
}

function closeRewardHistoryModal() {
  document.getElementById('rewardHistoryModal').style.display = 'none';
}

async function loadRewardHistoryData() {
  const container = document.getElementById('rewardHistoryContainer');

  try {
    container.innerHTML = '<div class="loading">Загрузка истории...</div>';

    const history = await getRewardHistory(20, 0);

    if (history.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">У вас еще нет полученных наград</p>';
      return;
    }

    let totalCoins = 0;
    container.innerHTML = history.map(item => {
      totalCoins += item.coins || 0;
      return `
        <div class="reward-history-item">
          <div class="history-icon">
            <i class="fas ${getRewardIcon(item.type)}"></i>
          </div>
          <div class="history-info">
            <div class="history-name">${item.name}</div>
            <div class="history-type">${getRewardTypeLabel(item.type)}</div>
          </div>
          <div class="history-coins">
            <strong>+${item.coins}</strong>
            <small>${formatTime(item.claimedAt)}</small>
          </div>
        </div>
      `;
    }).join('');

    // Добавить итоговые монеты в заголовок
    const header = document.querySelector('#rewardHistoryModal .modal-header');
    if (header) {
      const total = header.querySelector('.total-coins');
      if (total) {
        total.textContent = `Всего получено: ${totalCoins} монет`;
      }
    }

  } catch (error) {
    container.innerHTML = `<p class="error">Ошибка загрузки истории: ${error.message}</p>`;
  }
}

// ========================
// НАВИГАЦИЯ
// ========================

function scrollToBoxes() {
  document.getElementById('boxes').scrollIntoView({ behavior: 'smooth' });
}

// ========================
// EVENT LISTENERS
// ========================

function setupEventListeners() {
  // Кнопка входа в навигации
  document.getElementById('authMenuBtn')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-primary')) {
      openAuthModal();
    }
  });

  // Кнопка профиля в навигации
  document.getElementById('userMenuBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    openProfileModal();
  });

  // Закрытие модалей по клику на фон
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });

  // Закрытие по ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
      });
    }
  });
}

// Инициализировать при загрузке
if (document.readyState !== 'loading') {
  setupEventListeners();
}
