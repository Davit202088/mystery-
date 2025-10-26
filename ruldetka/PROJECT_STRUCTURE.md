# 📁 Структура проекта RULDETKA

```
ruldetka/
│
├── 📄 server.js                          # ⭐ Главный файл сервера (Express + WebSocket)
├── 📄 package.json                       # Зависимости и скрипты
├── 📄 .env.example                       # Пример переменных окружения
├── 📄 .gitignore                         # Git ignore файл
├── 📄 README.md                          # Основная документация
├── 📄 DEPLOYMENT.md                      # Инструкция деплоя на Beget/Timeweb
├── 📄 PROJECT_STRUCTURE.md               # Этот файл
│
├── 📂 config/                            # Конфигурационные файлы
│   └── 📄 database.js                    # Инициализация БД (MySQL)
│
├── 📂 routes/                            # API маршруты
│   ├── 📄 auth.js                        # 🔐 Аутентификация (register/login/profile)
│   ├── 📄 boxes.js                       # 🎁 Управление боксами и открытие
│   ├── 📄 payment.js                     # 💳 Платежи (ЮКасса, webhook)
│   └── 📄 admin.js                       # 👨‍💼 Админ API (статистика, управление)
│
├── 📂 middleware/                        # Middleware функции
│   └── 📄 auth.js                        # JWT верификация токенов
│
├── 📂 database/                          # Скрипты БД
│   └── 📄 seed.sql                       # Примеры данных (боксы, призы, пользователи)
│
├── 📂 public/                            # Frontend файлы (статика)
│   │
│   ├── 📄 index.html                     # ⭐ Главная страница
│   ├── 📄 cabinet.html                   # Личный кабинет (опционально)
│   │
│   ├── 📂 css/
│   │   └── 📄 styles.css                 # Все стили (Responsive дизайн)
│   │
│   ├── 📂 js/
│   │   ├── 📄 api.js                     # REST API клиент + WebSocket
│   │   └── 📄 main.js                    # Логика фронтенда (события, UI)
│   │
│   └── 📂 assets/
│       ├── 📂 images/                    # Изображения боксов и призов
│       ├── 📂 audio/                     # Звуки открытия (опционально)
│       └── 📂 icons/                     # SVG иконки
│
├── 📂 logs/                              # Логи (создается автоматически)
│   ├── error.log
│   └── out.log
│
└── 📂 node_modules/                      # Зависимости (не в Git)
```

---

## 📦 Ключевые файлы

### Backend (Node.js)

| Файл | Описание |
|------|---------|
| `server.js` | Express сервер + WebSocket + инициализация БД |
| `config/database.js` | MySQL подключение и инициализация таблиц |
| `routes/auth.js` | Регистрация, вход, профиль, баланс |
| `routes/boxes.js` | Получить боксы, открыть бокс, история, лидербоард |
| `routes/payment.js` | Создание платежа, webhook ЮКассы, история платежей |
| `routes/admin.js` | Управление боксами/призами, статистика |
| `middleware/auth.js` | Проверка JWT токена |

### Frontend (HTML/CSS/JS)

| Файл | Описание |
|------|---------|
| `public/index.html` | Главная страница (Hero, боксы, побеждающие, CTA) |
| `public/css/styles.css` | Все стили (4000+ строк, responsive) |
| `public/js/api.js` | REST API клиент, WebSocket, localStorage |
| `public/js/main.js` | UI логика, события, модали, профиль |

### База данных

| Таблица | Назначение |
|---------|-----------|
| `users` | Пользователи (баланс, роль, профиль) |
| `boxes` | Виды боксов (Starter, Deluxe, Premium) |
| `prizes` | Призы (электроника, аксессуары, вероятности) |
| `opened_boxes` | История открытий (кто, когда, что выиграл) |
| `transactions` | Платежные транзакции (платежи, пополнения) |

---

## 🔧 Установленные зависимости

```json
{
  "express": "^4.18.2",              // HTTP сервер
  "cors": "^2.8.5",                  // CORS middleware
  "mysql2": "^3.6.5",                // MySQL драйвер
  "dotenv": "^16.3.1",               // Переменные окружения
  "jsonwebtoken": "^9.1.2",          // JWT токены
  "bcryptjs": "^2.4.3",              // Хеширование паролей
  "axios": "^1.6.2",                 // HTTP клиент (для API запросов)
  "helmet": "^7.1.0",                // Безопасность заголовков
  "express-rate-limit": "^7.1.5",    // Rate limiting
  "ws": "^8.14.2"                    // WebSocket
}
```

---

## 🚀 Скрипты (npm)

```bash
npm start          # Запустить сервер (production)
npm run dev        # Запустить с nodemon (development)
npm test           # Запустить тесты (если будут добавлены)
```

---

## 📊 API endpoints

### Аутентификация (`/api/auth`)
- `POST /register` - Регистрация
- `POST /login` - Вход
- `GET /profile` - Профиль пользователя
- `GET /balance` - Баланс
- `PUT /profile` - Обновить профиль

### Боксы (`/api/boxes`)
- `GET /` - Все боксы
- `GET /:boxId` - Конкретный бокс
- `POST /open` - Открыть бокс
- `GET /history/user` - История открытий пользователя
- `GET /leaderboard/wins` - Топ побед

### Платежи (`/api/payment`)
- `POST /create-payment` - Создать платеж (ЮКасса)
- `POST /webhook/yookassa` - Webhook от ЮКассы
- `GET /history` - История платежей
- `GET /status/:paymentId` - Статус платежа

### Админ (`/api/admin`)
- `POST /boxes` - Создать бокс
- `PUT /boxes/:boxId` - Обновить бокс
- `DELETE /boxes/:boxId` - Удалить бокс
- `POST /prizes` - Создать приз
- `PUT /prizes/:prizeId` - Обновить приз
- `GET /stats` - Статистика
- `GET /logs` - Логи

---

## 🔐 Переменные окружения

```env
NODE_ENV=production                    # Режим работы
PORT=3000                              # Порт сервера
APP_URL=https://ruldetka.ru            # URL приложения

DB_HOST=localhost                      # Хост БД
DB_USER=ruldetka                       # Пользователь БД
DB_PASSWORD=***                        # Пароль БД
DB_NAME=ruldetka                       # Имя БД

JWT_SECRET=your_secret_key             # Секретный ключ для JWT

YOOKASSA_SHOP_ID=xxxxx                 # ID магазина ЮКассы
YOOKASSA_SECRET_KEY=xxxxx              # Секретный ключ ЮКассы

ADMIN_USER_IDS=user_1,user_2           # ID админов (опционально)
```

---

## 📈 Размеры файлов

| Файл | Размер | Строк кода |
|------|--------|-----------|
| `server.js` | 6 KB | ~200 |
| `routes/auth.js` | 8 KB | ~250 |
| `routes/boxes.js` | 12 KB | ~350 |
| `routes/payment.js` | 10 KB | ~280 |
| `routes/admin.js` | 14 KB | ~380 |
| `public/css/styles.css` | 35 KB | ~1000 |
| `public/js/api.js` | 20 KB | ~600 |
| `public/js/main.js` | 25 KB | ~700 |
| **ВСЕГО** | ~130 KB | ~3800 строк |

---

## 🔄 WebSocket события

### Client -> Server
- `auth` - Аутентификация пользователя
- `open_box` - Открыть бокс (с транзитом)

### Server -> Client
- `auth_success` - Успешная аутентификация
- `box_result` - Результат открытия бокса
- `box_opening` - Начало анимации открытия
- `payment_success` - Успешный платеж
- `error` - Ошибка

---

## 🗄️ Схема БД

### users
```sql
id, userId, email, username, passwordHash, firstName, lastName,
avatar, balance, role, createdAt, updatedAt, lastActive
```

### boxes
```sql
id, boxId, name, description, price, type (starter/deluxe/premium),
itemCount, image, rarity, isActive, createdAt, updatedAt
```

### prizes
```sql
id, prizeId, boxId, name, description, image, value, rarity,
probability, isActive, createdAt
```

### opened_boxes
```sql
id, userId, boxId, prizeId, amount, transactionId, status, createdAt
```

### transactions
```sql
id, transactionId, userId, type, amount, paymentMethod,
paymentGateway, status, metadata (JSON), createdAt, completedAt
```

---

## 📝 Соглашения о кодировании

### Именование
- Функции: `camelCase` (например: `openBox`, `getProfile`)
- Классы: `PascalCase` (например: `User`, `Box`)
- Константы: `UPPER_SNAKE_CASE`
- Файлы: `lowercase.js`

### Структура кода
- 1 маршрут = 1 файл в `routes/`
- Middleware в отдельных файлах
- Конфиги в `config/`

### Комментарии
- Секции: `// ========================`
- Функции: `// Описание функции`
- Сложная логика: `// Почему это нужно`

---

## 🚀 Развертывание

### На localhost
```bash
npm install
cp .env.example .env
# Отредактировать .env с локальными данными БД
node config/database.js
npm start
```

### На Beget
Смотрите `DEPLOYMENT.md` -> Раздел "Развертывание на Beget"

### На Timeweb
Смотрите `DEPLOYMENT.md` -> Раздел "Развертывание на Timeweb"

---

## 📚 Дополнительные ресурсы

- **Express документация:** https://expressjs.com/
- **MySQL документация:** https://dev.mysql.com/doc/
- **JWT токены:** https://jwt.io/
- **Yookassa API:** https://yookassa.ru/developers
- **WebSocket:** https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

---

## ✅ Чек-лист перед production

- [ ] Все переменные окружения установлены
- [ ] БД инициализирована и заполнена примерами
- [ ] JWT_SECRET изменен на случайный ключ
- [ ] SSL сертификат установлен
- [ ] Webhook ЮКассы настроена
- [ ] Email для оповещений установлен
- [ ] Бэкапы БД настроены
- [ ] Логирование включено
- [ ] Rate limiting включен
- [ ] CORS настроен для правильного домена

---

**Дата создания:** Октябрь 2024
**Версия:** 1.0.0
**Статус:** Production Ready ✅
