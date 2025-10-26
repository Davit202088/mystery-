const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

// Загрузить переменные окружения
dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ limit: '64kb', extended: true }));

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Базовая конфигурация
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ========================
// ИМПОРТ МАРШРУТОВ
// ========================
const authRoutes = require('./routes/auth');
const boxesRoutes = require('./routes/boxes');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');

// Регистрация маршрутов
app.use('/api/auth', authRoutes);
app.use('/api/boxes', boxesRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========================
// WebSocket соединения
// ========================
const connectedClients = new Map();

wss.on('connection', (ws) => {
  console.log(`[WebSocket] Новый клиент подключен. Всего клиентов: ${wss.clients.size}`);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(ws, data);
    } catch (error) {
      console.error('[WebSocket] Ошибка парсинга сообщения:', error);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    // Удалить клиента из кэша
    for (const [userId, clientWs] of connectedClients.entries()) {
      if (clientWs === ws) {
        connectedClients.delete(userId);
        break;
      }
    }
    console.log(`[WebSocket] Клиент отключен. Осталось клиентов: ${wss.clients.size}`);
  });

  ws.on('error', (error) => {
    console.error('[WebSocket] Ошибка:', error);
  });
});

// Обработчик WebSocket сообщений
function handleWebSocketMessage(ws, data) {
  switch (data.type) {
    case 'auth':
      // Сохранить userId для этого клиента
      connectedClients.set(data.userId, ws);
      ws.send(JSON.stringify({ type: 'auth_success' }));
      break;

    case 'open_box':
      // Обработка открытия бокса
      console.log(`[WebSocket] Открытие бокса от пользователя ${data.userId}`);
      ws.send(JSON.stringify({
        type: 'box_opening',
        boxId: data.boxId,
        message: 'Открываем бокс...'
      }));
      break;

    default:
      ws.send(JSON.stringify({ error: 'Unknown message type' }));
  }
}

// Функция для отправки уведомления конкретному пользователю
function notifyUser(userId, message) {
  const ws = connectedClients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Экспортировать для использования в маршрутах
app.locals.notifyUser = notifyUser;

// ========================
// ОБРАБОТЧИК ОШИБОК
// ========================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// ========================
// ЗАПУСК СЕРВЕРА
// ========================
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║  🎁 RULDETKA - Mystery Box        ║
║  Сервер запущен на порту ${PORT}         ║
║  Окружение: ${NODE_ENV}              ║
║  Домен: ruldetka.ru               ║
╚════════════════════════════════════╝
  `);
});

// Обработка сигналов выключения
process.on('SIGTERM', () => {
  console.log('SIGTERM получен. Завершаем работу...');
  server.close(() => {
    console.log('Сервер остановлен');
    process.exit(0);
  });
});

module.exports = { app, server, wss, connectedClients };
