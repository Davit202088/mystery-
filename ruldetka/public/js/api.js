// ========================
// API КЛИЕНТ
// ========================

const API_BASE_URL = window.location.origin + '/api';
const WS_URL = (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host;

let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let ws = null;

// ========================
// WebSocket СОЕДИНЕНИЕ
// ========================

function initWebSocket() {
  if (token) {
    try {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket подключен');
        // Отправить аутентификацию
        ws.send(JSON.stringify({
          type: 'auth',
          userId: currentUser?.userId
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      ws.onerror = (error) => {
        console.error('WebSocket ошибка:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket отключен');
        // Переподключиться через 3 секунды
        setTimeout(initWebSocket, 3000);
      };
    } catch (error) {
      console.error('Ошибка инициализации WebSocket:', error);
    }
  }
}

function handleWebSocketMessage(data) {
  console.log('WebSocket сообщение:', data);

  switch (data.type) {
    case 'box_result':
      // Обновить баланс
      if (data.newBalance !== undefined) {
        currentUser.balance = data.newBalance;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateBalanceDisplay();
      }
      break;

    case 'payment_success':
      showNotification(`✅ Платеж успешен! Получено ${data.amount} ₽`, 'success');
      break;

    case 'auth_success':
      console.log('Аутентификация WebSocket успешна');
      break;
  }
}

// ========================
// АУТЕНТИФИКАЦИЯ
// ========================

async function registerUser(email, password, username, firstName, lastName) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        username,
        firstName,
        lastName
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка регистрации');
    }

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    initWebSocket();

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    return { success: false, error: error.message };
  }
}

async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка входа');
    }

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    initWebSocket();

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Ошибка входа:', error);
    return { success: false, error: error.message };
  }
}

function logoutUser() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');

  if (ws) {
    ws.close();
  }
}

// ========================
// БОКСЫ
// ========================

async function getBoxes() {
  try {
    const response = await fetch(`${API_BASE_URL}/boxes`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки боксов');
    }

    return data.boxes;
  } catch (error) {
    console.error('Ошибка получения боксов:', error);
    return [];
  }
}

async function getBox(boxId) {
  try {
    const response = await fetch(`${API_BASE_URL}/boxes/${boxId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки бокса');
    }

    return data.box;
  } catch (error) {
    console.error('Ошибка получения бокса:', error);
    return null;
  }
}

async function openBox(boxId) {
  if (!token) {
    throw new Error('Требуется аутентификация');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/boxes/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ boxId })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка открытия бокса');
    }

    // Обновить локальный баланс
    if (data.newBalance !== undefined) {
      currentUser.balance = data.newBalance;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    return { success: true, prize: data.prize, newBalance: data.newBalance };
  } catch (error) {
    console.error('Ошибка открытия бокса:', error);
    throw error;
  }
}

// ========================
// ИСТОРИЯ И ЛИДЕРБОАРД
// ========================

async function getLeaderboard(limit = 20) {
  try {
    const response = await fetch(`${API_BASE_URL}/boxes/leaderboard/wins?limit=${limit}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки лидерборда');
    }

    return data.wins || [];
  } catch (error) {
    console.error('Ошибка получения лидерборда:', error);
    return [];
  }
}

async function getUserHistory(limit = 20, offset = 0) {
  if (!token) {
    return [];
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/boxes/history/user?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки истории');
    }

    return data.history || [];
  } catch (error) {
    console.error('Ошибка получения истории:', error);
    return [];
  }
}

// ========================
// ПРОФИЛЬ
// ========================

async function getProfile() {
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки профиля');
    }

    // Обновить локальный пользователь
    currentUser = data.user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    return data.user;
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    return null;
  }
}

async function getBalance() {
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/balance`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки баланса');
    }

    return data.balance;
  } catch (error) {
    console.error('Ошибка получения баланса:', error);
    return null;
  }
}

// ========================
// ПЛАТЕЖИ
// ========================

async function createPayment(amount, description) {
  if (!token) {
    throw new Error('Требуется аутентификация');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/payment/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount, description })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка создания платежа');
    }

    return data;
  } catch (error) {
    console.error('Ошибка создания платежа:', error);
    throw error;
  }
}

async function getPaymentHistory(limit = 20, offset = 0) {
  if (!token) {
    return [];
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/payment/history?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки истории платежей');
    }

    return data.transactions || [];
  } catch (error) {
    console.error('Ошибка получения истории платежей:', error);
    return [];
  }
}

// ========================
// АДМИН API
// ========================

async function getAdminStats() {
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки статистики');
    }

    return data.stats;
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    return null;
  }
}

// ========================
// НАГРАДЫ И БОНУСЫ
// ========================

async function getAvailableRewards() {
  if (!token) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/rewards/available`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки наград');
    }

    return data.rewards || [];
  } catch (error) {
    console.error('Ошибка получения наград:', error);
    return [];
  }
}

async function claimReward(rewardId) {
  if (!token) {
    throw new Error('Требуется аутентификация');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/rewards/claim/${rewardId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка получения награды');
    }

    // Обновить баланс
    if (data.coins && currentUser) {
      currentUser.balance = (currentUser.balance || 0) + data.coins;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      updateBalanceDisplay();
    }

    return data;
  } catch (error) {
    console.error('Ошибка требования награды:', error);
    throw error;
  }
}

async function getRewardHistory(limit = 20, offset = 0) {
  if (!token) {
    return [];
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/rewards/history?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки истории наград');
    }

    return data.history || [];
  } catch (error) {
    console.error('Ошибка получения истории наград:', error);
    return [];
  }
}

// ========================
// УТИЛИТЫ
// ========================

function formatCurrency(amount) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB'
  }).format(amount);
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes}м назад`;
  if (hours < 24) return `${hours}ч назад`;
  if (days < 7) return `${days}д назад`;

  return date.toLocaleDateString('ru-RU');
}

function showNotification(message, type = 'info') {
  // Создать уведомление
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--secondary-color)'};
    color: white;
    border-radius: 0.5rem;
    z-index: 3000;
    animation: slideUp 0.3s;
  `;

  document.body.appendChild(notification);

  // Удалить через 3 секунды
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ========================
// ИНИЦИАЛИЗАЦИЯ
// ========================

// При загрузке страницы проверить токен и подключиться к WebSocket
document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    initWebSocket();
    getProfile();
  }
});
