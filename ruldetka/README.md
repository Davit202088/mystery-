# 🎁 RULDETKA - Mystery Box Platform

**Платформа для открытия мистери боксов с электроникой и аксессуарами**

Production-ready приложение на Node.js + Vanilla JS с интеграцией платежных систем (Яндекс.Касса, крипто).

---

## 📋 Оглавление

1. [Особенности](#особенности)
2. [Требования](#требования)
3. [Установка](#установка)
4. [Конфигурация](#конфигурация)
5. [Запуск](#запуск)
6. [API документация](#api-документация)
7. [Деплой](#деплой)

---

## ✨ Особенности

- ✅ **Система аутентификации** - Регистрация/Вход с JWT токенами
- ✅ **Mystery Box механика** - Случайный выбор призов с вероятностями
- ✅ **Real-time уведомления** - WebSocket для live обновлений
- ✅ **Платежные системы** - Яндекс.Касса (ЮКасса) + крипто-платежи
- ✅ **Профили пользователей** - Баланс, история, статистика
- ✅ **Лидерборд** - Топ побед в реальном времени
- ✅ **Админ-панель** - Управление боксами, призами, пользователями
- ✅ **Анимация рулетки** - Canvas-based анимация открытия боксов
- ✅ **Responsive дизайн** - Мобильная + десктоп версии

---

## 🔧 Требования

- **Node.js** 16+
- **MySQL** 5.7+ или **PostgreSQL** 12+
- **npm** 8+

---

## 📦 Установка

### 1. Клонировать репозиторий

```bash
git clone https://github.com/yourusername/ruldetka.git
cd ruldetka
npm install
```

### 2. Создать файл .env

```bash
cp .env.example .env
```

### 3. Отредактировать .env файл

```env
NODE_ENV=production
PORT=3000
APP_URL=https://ruldetka.ru

# DATABASE
DB_HOST=localhost
DB_USER=ruldetka_user
DB_PASSWORD=strong_password
DB_NAME=ruldetka

# JWT
JWT_SECRET=your_super_secret_key_here

# YOOKASSA (Яндекс.Касса)
YOOKASSA_SHOP_ID=xxxxxxx
YOOKASSA_SECRET_KEY=xxxxxxx

# ADMIN (опционально)
ADMIN_USER_IDS=admin_user_id_1,admin_user_id_2
```

---

## ⚙️ Конфигурация

### Получить YOOKASSA ключи

1. Перейти на [https://yookassa.ru/](https://yookassa.ru/)
2. Создать магазин
3. Получить Shop ID и Secret Key из админ-панели
4. Добавить webhook URL: `https://ruldetka.ru/api/payment/webhook/yookassa`

### Инициализация БД

```bash
node -e "const db = require('./config/database'); db.initDatabase().then(() => process.exit(0));"
```

---

## 🚀 Запуск

### Development

```bash
npm run dev
```

Сервер будет доступен на `http://localhost:3000`

### Production

```bash
npm start

# Или с PM2
pm2 start server.js --name "ruldetka"
pm2 save
```

---

## 📚 API Документация

### Аутентификация

#### Регистрация

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "firstName": "Иван",
  "lastName": "Петров"
}

Response:
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "userId": "user_xxxxx",
    "email": "user@example.com",
    "username": "username"
  }
}
```

#### Вход

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "eyJhbGc...",
  "user": { ... }
}
```

#### Получить профиль

```bash
GET /api/auth/profile
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "user": {
    "userId": "user_xxxxx",
    "email": "user@example.com",
    "username": "username",
    "balance": 1500.50,
    "totalBoxes": 5,
    "totalSpent": 2500.00
  }
}
```

### Боксы

#### Получить все боксы

```bash
GET /api/boxes

Response:
{
  "success": true,
  "boxes": [
    {
      "boxId": "box_xxxxx",
      "name": "Starter Box",
      "price": 499,
      "type": "starter",
      "prizes": [ ... ]
    }
  ]
}
```

#### Открыть бокс

```bash
POST /api/boxes/open
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "boxId": "box_xxxxx"
}

Response:
{
  "success": true,
  "prize": {
    "name": "iPhone 15",
    "value": 89990,
    "rarity": "epic"
  },
  "newBalance": 3000.50
}
```

### Платежи

#### Создать платеж (ЮКасса)

```bash
POST /api/payment/create-payment
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "amount": 500,
  "description": "Пополнение баланса"
}

Response:
{
  "success": true,
  "paymentId": "pay_xxxxx",
  "redirectUrl": "https://redirect.yookassa.ru/...",
  "yookassaPaymentId": "xxx"
}
```

#### Получить историю платежей

```bash
GET /api/payment/history?limit=20&offset=0
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "transactions": [ ... ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

### Админ API

#### Статистика (требует admin)

```bash
GET /api/admin/stats
Authorization: Bearer TOKEN

Response:
{
  "success": true,
  "stats": {
    "totalUsers": 1234,
    "totalBoxesOpened": 5678,
    "totalSpent": 123456.50,
    "totalRevenue": 89012.00,
    "activeUsers24h": 256
  }
}
```

#### Создать бокс

```bash
POST /api/admin/boxes
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "New Box",
  "description": "Description",
  "price": 999,
  "type": "premium",
  "itemCount": 5,
  "image": "https://...",
  "rarity": "legendary"
}
```

---

## 🌐 Деплой на Beget/Timeweb

### 1. Подготовка хостинга

#### Beget

1. Создать Node.js приложение через панель управления
2. Установить зависимости: `npm install`
3. Установить MySQL базу данных
4. Настроить переменные окружения (`.env`)

#### Timeweb

1. Создать облачное приложение (Node.js)
2. Загрузить файлы через Git или FTP
3. Создать MySQL базу данных
4. Установить зависимости в консоли

### 2. Загрузить файлы

```bash
# Через Git
git push origin main

# Или через FTP
# Загрузить все файлы кроме node_modules
```

### 3. Установить зависимости на хостинге

```bash
npm install --production
```

### 4. Инициализировать БД

```bash
node config/database.js
```

### 5. Запустить сервер

```bash
npm start

# Или через PM2 (если доступен)
pm2 start server.js
pm2 save
```

### 6. Настроить SSL/HTTPS

- На Beget: автоматический Let's Encrypt
- На Timeweb: использовать встроенный SSL сертификат

### 7. Настроить Nginx (если нужен reverse proxy)

```nginx
server {
    listen 80;
    server_name ruldetka.ru www.ruldetka.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:3000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 🔐 Безопасность

- ✅ JWT аутентификация
- ✅ Хеширование паролей (bcryptjs)
- ✅ Helmet для безопасности заголовков
- ✅ CORS контроль
- ✅ SQL injection защита (параметризованные запросы)
- ✅ Rate limiting на платежные endpoints
- ✅ Валидация всех входных данных

---

## 📞 Поддержка и контакты

- Email: support@ruldetka.ru
- Telegram: @ruldetka_support
- GitHub Issues: [ссылка на репо]

---

## 📄 Лицензия

MIT License - смотрите LICENSE файл для деталей

---

## 📝 Примечания

- Проект находится на стадии production
- Обновления выпускаются регулярно
- Все критические баги исправляются в приоритете
- Для крупных изменений используйте staging окружение

---

**Последнее обновление:** Октябрь 2024
**Версия:** 1.0.0
**Статус:** Production Ready ✅
