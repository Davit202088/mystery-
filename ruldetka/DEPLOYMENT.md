# 🚀 Инструкция по развертыванию на Beget/Timeweb

## Выбор хостинга

### ✅ Beget
- Стабильный российский хостинг
- Автоматический SSL (Let's Encrypt)
- Хорошая техподдержка
- Node.js поддержка

### ✅ Timeweb
- Облачное приложение
- Быстрый деплой
- Масштабируемость
- Встроенный мониторинг

---

## Развертывание на Beget

### 1. Регистрация и создание приложения

1. Перейти на beget.com
2. Создать аккаунт
3. В панели управления найти "Node.js приложения"
4. Нажать "Создать приложение"
5. Выбрать Node.js 18+

### 2. Загрузить файлы проекта

**Способ 1: Git (рекомендуется)**

```bash
# На локальной машине инициализировать Git
git init
git add .
git commit -m "Initial commit"

# Скопировать URL репозитория из панели Beget
git remote add origin [URL_FROM_BEGET]
git push origin main
```

**Способ 2: FTP**

1. Получить FTP доступ из панели Beget
2. Загрузить все файлы кроме:
   - `node_modules` (будут установлены автоматически)
   - `.git` (если используется Git)
   - `.env` (создать на хостинге вручную)

### 3. Создать базу данных

1. В панели Beget перейти в "MySQL"
2. Создать новую БД
3. Создать пользователя БД с полными правами
4. Сохранить реквизиты:
   - Хост БД (обычно localhost)
   - Имя БД
   - Пользователь
   - Пароль

### 4. Создать .env файл на хостинге

В панели управления создать файл `.env` в корне проекта:

```env
NODE_ENV=production
PORT=3000
APP_URL=https://ruldetka.ru

# DATABASE (данные из шага 3)
DB_HOST=localhost
DB_USER=beget_ruldetka
DB_PASSWORD=your_secure_password
DB_NAME=beget_ruldetka

# JWT
JWT_SECRET=your_super_secret_key_change_this_to_something_random_and_long_string_here

# YOOKASSA
YOOKASSA_SHOP_ID=your_shop_id_from_yookassa
YOOKASSA_SECRET_KEY=your_secret_key_from_yookassa

# ADMIN
ADMIN_USER_IDS=your_user_id_for_admin
```

### 5. Установить зависимости

В терминале Beget (или через SSH):

```bash
cd /home/username/public_html/ruldetka

npm install --production
```

### 6. Инициализировать базу данных

```bash
node config/database.js

# Или загрузить примеры данных:
mysql -u beget_ruldetka -p ruldetka < database/seed.sql
```

### 7. Запустить приложение

В панели Beget установить:
- **Точка входа:** `server.js`
- **Версия Node.js:** 18+

Нажать "Запустить приложение"

### 8. Настроить домен

1. Перейти в настройки домена
2. Указать поддомен на приложение
3. Дождаться распространения DNS (5-30 минут)

### 9. Проверить работу

```bash
curl https://ruldetka.ru/health
# Должен вернуть: {"status":"OK","timestamp":"..."}
```

---

## Развертывание на Timeweb

### 1. Регистрация и создание приложения

1. Перейти на timeweb.com
2. Создать аккаунт
3. Перейти в "Облачные приложения"
4. Нажать "Создать приложение"
5. Выбрать Node.js 18+

### 2. Подготовить локальный Git репозиторий

```bash
git init
git add .
git commit -m "Initial commit"
```

### 3. Получить Timeweb Git URL

В панели приложения скопировать Git URL для деплоя:
```
git@git.timeweb.cloud:xxxxx/ruldetka.git
```

### 4. Загрузить на Timeweb

```bash
git remote add timeweb git@git.timeweb.cloud:xxxxx/ruldetka.git
git push timeweb main
```

Timeweb автоматически:
- Установит зависимости (`npm install`)
- Запустит приложение
- Создаст SSL сертификат

### 5. Создать базу данных

1. В панели приложения перейти в "Базы данных"
2. Создать MySQL базу
3. Получить реквизиты подключения
4. Записать в .env файл

### 6. Установить переменные окружения

1. В панели приложения перейти в "Переменные окружения"
2. Добавить все переменные из .env:

```
NODE_ENV=production
PORT=3000
APP_URL=https://ruldetka.timeweb.cloud
DB_HOST=[HOST_FROM_TIMEWEB]
DB_USER=[USER_FROM_TIMEWEB]
DB_PASSWORD=[PASSWORD_FROM_TIMEWEB]
DB_NAME=[NAME_FROM_TIMEWEB]
JWT_SECRET=your_secret_key
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
```

### 7. Инициализировать базу данных

В панели приложения открыть SSH консоль:

```bash
cd /app
node config/database.js
```

### 8. Связать домен

1. В панели приложения перейти в "Домены"
2. Подключить ваш домен ruldetka.ru
3. Настроить DNS записи:
   - A запись: IP адрес приложения Timeweb
   - CNAME для www: ruldetka.ru

### 9. Настроить Webhook для ЮКассы

1. В панели Yookassa перейти в настройки магазина
2. Добавить webhook URL:
   ```
   https://ruldetka.ru/api/payment/webhook/yookassa
   ```

---

## 🔍 Проверка после развертывания

### Health Check

```bash
curl https://ruldetka.ru/health
# Ожидаемый ответ: {"status":"OK","timestamp":"2024-10-26T12:00:00.000Z"}
```

### Проверить API

```bash
# Получить список боксов
curl https://ruldetka.ru/api/boxes

# Должен вернуть JSON с боксами
```

### Проверить WebSocket

Открыть DevTools в браузере и проверить Network -> WS:
- WebSocket должен подключиться к `wss://ruldetka.ru/`

---

## 🛠️ Полезные команды

### Просмотр логов

**Beget:**
```bash
# SSH в приложение и просмотреть логи
tail -f /home/username/public_html/ruldetka/logs/error.log
```

**Timeweb:**
```bash
# В панели приложения: Мониторинг -> Логи
```

### Перезагрузить приложение

**Beget:**
Нажать "Перезагрузить" в панели управления

**Timeweb:**
```bash
# Commit пустое изменение и push
git commit --allow-empty -m "Redeploy"
git push timeweb main
```

### Обновить код

```bash
git add .
git commit -m "Update feature"
git push timeweb main  # или git push origin main для Beget
```

---

## 🔐 Безопасность после деплоя

### Обязательные шаги:

1. ✅ **Изменить JWT_SECRET**
   - Сгенерировать новый случайный ключ
   - Обновить в переменных окружения

2. ✅ **Обновить БД пароли**
   - Использовать сильный пароль для пользователя БД
   - Не использовать root пользователя

3. ✅ **Включить HTTPS**
   - На Beget: автоматический Let's Encrypt
   - На Timeweb: встроенный SSL

4. ✅ **Настроить CORS**
   - Если фронтенд на другом домене, обновить `.env`:
   ```
   CORS_ORIGIN=https://ruldetka.ru
   ```

5. ✅ **Бэкапы БД**
   - Настроить автоматические бэкапы на хостинге
   - Минимум раз в сутки

---

## 📊 Мониторинг

### Проверить статус приложения

**Beget:**
1. Панель управления -> Приложения -> Статус

**Timeweb:**
1. Панель управления -> Мониторинг -> Статус

### Настроить оповещения

1. В панели хостинга включить email оповещения
2. Указать email для получения уведомлений об ошибках

---

## 🆘 Troubleshooting

### Приложение не запускается

**Beget:**
```bash
npm install --production
node server.js  # Проверить ошибки в логе
```

**Timeweb:**
Проверить логи в панели "Мониторинг -> Логи"

### Ошибка подключения к БД

```bash
# Проверить реквизиты в .env
# Проверить что БД создана
# Проверить IP доступ (Timeweb может требовать whitelist IP)
```

### Платежи не работают

1. Проверить YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY
2. Убедиться что webhook URL добавлен в Yookassa
3. Проверить логи платежей в админ-панели

### WebSocket не подключается

1. Проверить что приложение работает (`/health`)
2. Проверить Nginx конфигурацию (если используется)
3. Проверить что WebSocket не блокируется firewall

---

## 📞 Контакты поддержки

- **Beget Support:** support@beget.com
- **Timeweb Support:** support@timeweb.com
- **Ваша поддержка:** support@ruldetka.ru

---

**Дата обновления:** Октябрь 2024
**Версия:** 1.0.0
