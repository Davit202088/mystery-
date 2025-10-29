# 👀 Руководство по просмотру проекта RULDETKA

## 🚀 Сервер запущен!

Сервер успешно работает на `http://localhost:3000`

---

## 📍 Доступные страницы:

### 1. **Главная страница**
```
URL: http://localhost:3000/
```

**Что на ней:**
- 🎁 Hero секция с призывом "Открыть бокс"
- 📦 Каталог мистери-боксов (Starter, Deluxe, Premium)
- 🏆 Лидерборд последних выигрышей
- 💰 Система наград и бонусов
- 🔐 Модальное окно входа/регистрации
- ℹ️ Информационные блоки

### 2. **Админ-панель**
```
URL: http://localhost:3000/admin.html
```

**Возможности:**
- Управление боксами
- Управление призами
- Статистика платформы
- Управление пользователями

---

## 🔌 API Endpoints:

### Health Check
```bash
curl http://localhost:3000/health
```

### Аутентификация

**Регистрация:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser",
    "firstName": "Иван",
    "lastName": "Петров"
  }'
```

**Вход:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Получить профиль:**
```bash
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Боксы

**Получить все боксы:**
```bash
curl http://localhost:3000/api/boxes
```

**Открыть бокс:**
```bash
curl -X POST http://localhost:3000/api/boxes/open \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "boxId": "box_starter_001"
  }'
```

### Платежи

**Создать платеж:**
```bash
curl -X POST http://localhost:3000/api/payment/create-payment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "description": "Пополнение баланса"
  }'
```

**История платежей:**
```bash
curl http://localhost:3000/api/payment/history?limit=20&offset=0 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Админ (требуется admin роль)

**Статистика:**
```bash
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

## 🎨 Дизайн и стили:

Проект использует **темную тему** с современным дизайном:

- **Основной цвет**: #7c3aed (фиолетовый)
- **Вторичный цвет**: #0ea5e9 (голубой)
- **Фон**: Темный градиент (#0f172a → #1a1f35)
- **Типографика**: Segoe UI
- **Анимации**: Плавные переходы и эффекты hover
- **Canvas**: Анимация рулетки при открытии боксов

---

## 📁 Структура файлов:

```
public/
├── index.html          # Главная страница
├── admin.html          # Админ-панель
├── css/
│   ├── styles.css      # Основные стили (24KB)
│   └── admin.css       # Стили админки (9KB)
└── js/
    ├── main.js         # Основная логика (24KB)
    ├── api.js          # API запросы (14KB)
    └── admin.js        # Логика админки (14KB)
```

---

## ⚠️ Текущие ограничения:

**MySQL не подключена:**
- API endpoints возвращают ошибки
- Нужно установить и настроить MySQL для полной функциональности
- SQL скрипты готовы: `database/seed.sql`

**Для полной работы нужно:**
1. Установить MySQL
2. Создать базу данных `ruldetka`
3. Выполнить скрипты инициализации
4. Обновить `.env` с реальными credentials

---

## 🔥 Быстрый тест:

```bash
# 1. Проверить здоровье сервера
curl http://localhost:3000/health

# 2. Получить главную страницу
curl http://localhost:3000/ | head -20

# 3. Попробовать API боксов
curl http://localhost:3000/api/boxes

# 4. Открыть в браузере
# Просто откройте: http://localhost:3000
```

---

## 💡 Совет:

Для лучшего просмотра откройте проект в браузере:
1. Chrome/Firefox/Edge
2. Адрес: `http://localhost:3000`
3. Откройте DevTools (F12) чтобы посмотреть:
   - Network запросы
   - Console логи
   - WebSocket соединения

---

**Сервер работает на порту 3000 ✅**

**Окружение: development 🛠️**

**Версия: 1.0.0 📦**
