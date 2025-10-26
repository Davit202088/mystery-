// ========================
// АДМИН-ПАНЕЛЬ ЛОГИКА
// ========================

let currentBox = null;
let currentPrizeId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Проверить что пользователь админ
  await checkAdminAccess();

  // Загрузить данные
  await loadDashboard();
  await loadBoxesForAdmin();
  loadBoxesForPrizeControl();

  setupEventListeners();
});

// ========================
// ПРОВЕРКА ДОСТУПА
// ========================

async function checkAdminAccess() {
  if (!token) {
    window.location.href = '/index.html';
    return;
  }

  // В реальном приложении проверить что пользователь админ
  const profile = await getProfile();
  if (profile) {
    document.getElementById('adminUsername').textContent = profile.username;
  }
}

// ========================
// ПЕРЕКЛЮЧЕНИЕ СЕКЦИЙ
// ========================

function switchSection(sectionName) {
  // Скрыть все секции
  document.querySelectorAll('.admin-section').forEach(section => {
    section.classList.remove('active');
  });

  // Убрать активный класс со всех навигационных элементов
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Показать выбранную секцию
  const section = document.getElementById(sectionName);
  if (section) {
    section.classList.add('active');
  }

  // Добавить активный класс навигационному элементу
  event.target.closest('.nav-item').classList.add('active');
}

// ========================
// DASHBOARD - СТАТИСТИКА
// ========================

async function loadDashboard() {
  try {
    const stats = await getAdminStats();

    if (stats) {
      document.getElementById('totalUsers').textContent = stats.totalUsers;
      document.getElementById('totalBoxesOpened').textContent = stats.totalBoxesOpened;
      document.getElementById('totalRevenue').textContent = formatCurrency(stats.totalRevenue);
      document.getElementById('activeUsers24h').textContent = stats.activeUsers24h;
    }
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
}

// ========================
// УПРАВЛЕНИЕ БОКСАМИ
// ========================

async function loadBoxesForAdmin() {
  try {
    const boxes = await getBoxes();
    const container = document.getElementById('boxesContainer');

    if (boxes.length === 0) {
      container.innerHTML = '<p class="loading">Нет боксов</p>';
      return;
    }

    container.innerHTML = boxes.map(box => `
      <div class="box-edit-card">
        <h3>${box.name}</h3>
        <p><strong>ID:</strong> ${box.boxId}</p>
        <p><strong>Цена:</strong> ${box.price} ₽</p>
        <p><strong>Тип:</strong> ${box.type}</p>
        <p><strong>Редкость:</strong> ${box.rarity}</p>
        <p><strong>Предметов:</strong> ${box.itemCount}</p>
        <div class="box-actions">
          <button class="btn btn-secondary" onclick="editBox('${box.boxId}')">
            <i class="fas fa-edit"></i> Редактировать
          </button>
          <button class="btn btn-danger" onclick="deleteBox('${box.boxId}')">
            <i class="fas fa-trash"></i> Удалить
          </button>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Ошибка загрузки боксов:', error);
  }
}

function openCreateBoxModal() {
  showNotification('🔧 Функция создания бокса в разработке', 'info');
}

function editBox(boxId) {
  showNotification('🔧 Функция редактирования в разработке', 'info');
}

async function deleteBox(boxId) {
  if (!confirm('Вы уверены что хотите удалить этот бокс?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/boxes/${boxId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      showNotification('✅ Бокс удален', 'success');
      await loadBoxesForAdmin();
    } else {
      showNotification(`❌ ${data.error}`, 'error');
    }
  } catch (error) {
    showNotification('❌ Ошибка удаления', 'error');
  }
}

// ========================
// УПРАВЛЕНИЕ ВЕРОЯТНОСТЯМИ
// ========================

async function loadBoxesForPrizeControl() {
  try {
    const boxes = await getBoxes();
    const select = document.getElementById('boxSelect');

    select.innerHTML = '<option value="">-- Выберите бокс --</option>' +
      boxes.map(box => `
        <option value="${box.id}" data-boxid="${box.boxId}">${box.name} (${box.type})</option>
      `).join('');

  } catch (error) {
    console.error('Ошибка загрузки боксов:', error);
  }
}

async function loadPrizesForBox() {
  const select = document.getElementById('boxSelect');
  const boxId = parseInt(select.value);
  const container = document.getElementById('prizesContainer');

  if (!boxId) {
    container.innerHTML = '<p class="loading">Выберите бокс для редактирования вероятностей</p>';
    return;
  }

  try {
    const boxes = await getBoxes();
    const box = boxes.find(b => b.id === boxId);

    if (!box || !box.prizes) {
      container.innerHTML = '<p class="loading">Нет призов в этом боксе</p>';
      return;
    }

    currentBox = box;

    // Рассчитать общую вероятность
    const totalProbability = box.prizes.reduce((sum, prize) => sum + (parseFloat(prize.probability) || 0), 0);

    container.innerHTML = `
      <div class="info-box">
        <strong>Общая вероятность:</strong> ${totalProbability.toFixed(1)}%
        ${totalProbability === 100 ? '✅' : '⚠️'}
      </div>
      ${box.prizes.map(prize => `
        <div class="prize-item">
          <div>
            <div class="prize-name">${prize.name}</div>
            <div class="prize-value">Стоимость: ${formatCurrency(prize.value || 0)}</div>
          </div>
          <div class="prize-rarity rarity-${prize.rarity}">
            ${prize.rarity}
          </div>
          <div class="prize-control-group">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value="${prize.probability || 0}"
              onchange="updateProbability('${prize.prizeId}', this.value)"
              placeholder="Вероятность %"
            >
            <span>%</span>
          </div>
          <button class="btn btn-secondary" onclick="editPrize('${prize.prizeId}', '${prize.name}', ${prize.probability})">
            <i class="fas fa-edit"></i>
          </button>
        </div>
      `).join('')}

      <button class="btn btn-primary" style="width: 100%; margin-top: 2rem;" onclick="saveProbabilities()">
        💾 Сохранить все вероятности
      </button>
    `;

    // Нарисовать график
    drawProbabilityChart(box.prizes);

  } catch (error) {
    console.error('Ошибка загрузки призов:', error);
    container.innerHTML = '<p class="error">Ошибка загрузки призов</p>';
  }
}

function editPrize(prizeId, prizeName, probability) {
  currentPrizeId = prizeId;
  document.getElementById('prizeName').value = prizeName;
  document.getElementById('prizeProbability').value = probability;
  document.getElementById('prizeEditModal').style.display = 'flex';
}

function closePrizeModal() {
  document.getElementById('prizeEditModal').style.display = 'none';
}

async function savePrize(event) {
  event.preventDefault();

  const probability = parseFloat(document.getElementById('prizeProbability').value);

  try {
    const response = await fetch(`${API_BASE_URL}/admin/prizes/${currentPrizeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ probability })
    });

    if (response.ok) {
      showNotification('✅ Приз обновлен', 'success');
      closePrizeModal();
      await loadPrizesForBox();
    } else {
      showNotification('❌ Ошибка обновления', 'error');
    }
  } catch (error) {
    showNotification('❌ Ошибка сохранения', 'error');
  }
}

async function updateProbability(prizeId, newValue) {
  // Временно обновить при изменении
  console.log(`Приз ${prizeId} -> ${newValue}%`);
}

async function saveProbabilities() {
  if (!currentBox) return;

  const inputs = document.querySelectorAll('.prize-control-group input');
  const probabilities = Array.from(inputs).map((input, index) => ({
    prizeId: currentBox.prizes[index].prizeId,
    probability: parseFloat(input.value) || 0
  }));

  // Проверить сумму
  const total = probabilities.reduce((sum, p) => sum + p.probability, 0);
  if (Math.abs(total - 100) > 0.1) {
    showNotification(`⚠️ Сумма вероятностей должна быть 100%, сейчас ${total.toFixed(1)}%`, 'error');
    return;
  }

  try {
    // Обновить каждый приз
    for (const prob of probabilities) {
      await fetch(`${API_BASE_URL}/admin/prizes/${prob.prizeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ probability: prob.probability })
      });
    }

    showNotification('✅ Все вероятности сохранены!', 'success');
    await loadPrizesForBox();

  } catch (error) {
    showNotification('❌ Ошибка сохранения', 'error');
  }
}

// ========================
// ГРАФИК ВЕРОЯТНОСТЕЙ
// ========================

function drawProbabilityChart(prizes) {
  const canvas = document.getElementById('probabilityChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.offsetWidth - 40;
  canvas.height = 300;

  const padding = 50;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;

  // Очистить canvas
  ctx.fillStyle = 'var(--dark-bg)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Цвета для разных редкостей
  const colors = {
    common: '#64c864',
    rare: '#6496ff',
    epic: '#b464ff',
    legendary: '#ffc832'
  };

  // Рисовать оси
  ctx.strokeStyle = 'var(--border-color)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  // Рисовать столбцы
  const barWidth = chartWidth / prizes.length;
  const maxValue = 100;

  prizes.forEach((prize, index) => {
    const probability = parseFloat(prize.probability) || 0;
    const barHeight = (probability / maxValue) * chartHeight;

    const x = padding + index * barWidth + barWidth * 0.1;
    const y = canvas.height - padding - barHeight;

    // Столбец
    ctx.fillStyle = colors[prize.rarity] || colors.common;
    ctx.fillRect(x, y, barWidth * 0.8, barHeight);

    // Значение на столбце
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(probability.toFixed(1) + '%', x + barWidth * 0.4, y - 10);

    // Название приза
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '11px Arial';
    ctx.save();
    ctx.translate(x + barWidth * 0.4, canvas.height - padding + 20);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(prize.name.substring(0, 10), 0, 0);
    ctx.restore();
  });

  // Рисовать сетку
  ctx.strokeStyle = 'rgba(124, 58, 237, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i;
    const value = 100 - (i * 20);

    ctx.beginPath();
    ctx.moveTo(padding - 5, y);
    ctx.lineTo(canvas.width - padding, y);
    ctx.stroke();

    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(value + '%', padding - 10, y + 4);
  }
}

// ========================
// ЛОГИРОВАНИЕ И МОНИТОРИНГ
// ========================

function loadLogs() {
  showNotification('🔧 Загрузка логов в разработке', 'info');
}

// ========================
// НАСТРОЙКИ
// ========================

function saveSettings() {
  const minDeposit = document.getElementById('minDeposit').value;
  const maxDeposit = document.getElementById('maxDeposit').value;

  localStorage.setItem('minDeposit', minDeposit);
  localStorage.setItem('maxDeposit', maxDeposit);

  showNotification('✅ Настройки сохранены', 'success');
}

// ========================
// EVENT LISTENERS
// ========================

function setupEventListeners() {
  // Закрытие модалей
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });

  // ESC для закрытия модалей
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
      });
    }
  });
}

// ========================
// ЭКСПОРТ И ИМПОРТ
// ========================

async function exportStats() {
  try {
    const stats = await getAdminStats();
    const json = JSON.stringify(stats, null, 2);

    // Скачать как файл
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ruldetka-stats-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    showNotification('✅ Статистика экспортирована', 'success');
  } catch (error) {
    showNotification('❌ Ошибка экспорта', 'error');
  }
}
