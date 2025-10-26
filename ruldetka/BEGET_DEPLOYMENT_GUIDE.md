# 🚀 Пошаговая инструкция развертывания RULDETKA на Beget

## ⚡ Быстрый старт (15 минут)

### Шаг 1: Подготовка файлов

1. Создайте папку на вашем компьютере:
```bash
mkdir C:\ruldetka-deploy
cd C:\ruldetka-deploy
```

2. Скопируйте все файлы проекта из `C:\Users\user\ruldetka\`:
   - ✅ `server.js`
   - ✅ `package.json`
   - ✅ `.env.example`
   - ✅ `config/` (папка)
   - ✅ `routes/` (папка)
   - ✅ `middleware/` (папка)
   - ✅ `public/` (папка)
   - ✅ `database/` (папка)
   - ❌ `node_modules/` (НЕ копируем!)
   - ❌ `.git/` (если есть)

---

### Шаг 2: Инициализировать Git

```bash
cd C:\ruldetka-deploy
git init
git add .
git commit -m "Initial RULDETKA deployment"
```

---

### Шаг 3: В панели Beget

#### 3.1 Создать Node.js приложение

1. Откройте https://beget.com
2. Войдите в аккаунт
3. В панели управления нажмите **"Node.js"** или **"Приложения"**
4. Нажмите **"Создать приложение"**
5. Выберите:
   - **Фреймворк:** Node.js
   - **Версия:** 18+ или 20+
   - **Имя:** `ruldetka-test`
   - **Порт:** 3000

6. Нажмите **"Создать"**

#### 3.2 Получить Git URL

После создания приложения Beget выдаст вам:
```
Git URL: git@git.beget.com:xxxxxx/ruldetka-test.git
```

Скопируйте эту ссылку - она нужна для загрузки кода.

---

### Шаг 4: Загрузить код на Beget

```bash
cd C:\ruldetka-deploy

# Добавить удаленный репозиторий Beget
git remote add beget git@git.beget.com:xxxxxx/ruldetka-test.git

# Загрузить код (замените на вашу ссылку из шага 3.2)
git push -u beget main
```

> **Если ошибка с ключом SSH:** Используйте HTTPS вместо SSH
> ```bash
> git remote add beget https://git.beget.com/xxxxxx/ruldetka-test.git
> git push -u beget main
> ```

Beget автоматически:
- ✅ Установит зависимости (npm install)
- ✅ Запустит приложение
- ✅ Создаст SSL сертификат

---

### Шаг 5: Создать БД на Beget

1. В панели Beget нажмите **"MySQL"** или **"Базы данных"**
2. Нажмите **"Создать базу"**
3. Заполните:
   - **Имя БД:** `ruldetka_test`
   - **Пользователь:** `ruldetka_user`
   - **Пароль:** `YourSecurePassword123!` (придумайте сложный)

4. Нажмите **"Создать"**

5. **Скопируйте реквизиты:**
   ```
   Хост: localhost или mysql.XXX.beget.com
   БД: ruldetka_test
   Пользователь: ruldetka_user
   Пароль: YourSecurePassword123!
   ```

---

### Шаг 6: Создать .env файл на Beget

1. В панели Beget откройте **"Файловый менеджер"**
2. Перейдите в корень приложения (там где `server.js`)
3. Создайте новый файл `.env` с содержимым:

```env
NODE_ENV=production
PORT=3000
APP_URL=https://ваш-тестовый-домен.beget.com

# DATABASE (из шага 5)
DB_HOST=localhost
DB_USER=ruldetka_user
DB_PASSWORD=YourSecurePassword123!
DB_NAME=ruldetka_test

# JWT (сгенерируйте свой случайный ключ)
JWT_SECRET=your_super_secret_jwt_key_here_change_this_to_random_string_12345678901234567890

# YOOKASSA (получите позже)
YOOKASSA_SHOP_ID=your_shop_id_later
YOOKASSA_SECRET_KEY=your_secret_key_later
```

---

### Шаг 7: Инициализировать БД

1. В панели Beget откройте **"Терминал"** (SSH консоль)
2. Выполните команды:

```bash
cd /home/username/приложение/ruldetka-test

# Инициализировать таблицы
node config/database.js

# Загрузить примеры данных
mysql -u ruldetka_user -p ruldetka_test < database/seed.sql
# (введите пароль из .env)
```

---

### Шаг 8: Запустить приложение

1. В панели Beget найдите приложение **"ruldetka-test"**
2. Нажмите **"Статус"** → **"Запустить"** (или "Перезагрузить")
3. Дождитесь пока статус станет **"Работает"** ✅

---

### Шаг 9: Проверить работу

```bash
# Откройте в браузере и проверьте:
https://ruldetka-test.xxxxxxx.beget.com/health

# Должен вернуть:
{"status":"OK","timestamp":"2024-10-26T12:34:56.789Z"}
```

✅ **Если увидели OK** → приложение работает!

---

## 🔧 Если что-то не работает

### Проблема: "Cannot find module"

```bash
# В терминале Beget:
cd /home/username/приложение/ruldetka-test
npm install --production
```

### Проблема: "Error: connect ENOENT"

БД не работает. Проверьте:
```bash
# Проверить что БД существует
mysql -u ruldetka_user -p
# (введите пароль и напишите: SHOW DATABASES;)
```

### Проблема: Приложение не запускается

1. Откройте **"Логи"** в панели Beget
2. Посмотрите ошибку
3. Проверьте `.env` файл

---

## 🌐 Получить тестовый домен

Beget обычно предоставляет:
- Временный домен вида: `app-123456.beget.com`
- Или поддомен вашего основного домена: `ruldetka-test.yourname.beget.com`

Проверьте в панели: **"Приложения"** → **"Домены"**

---

## 📝 Проверить приложение

### 1. Главная страница
```
https://ruldetka-test.xxxxxxx.beget.com/
```
Должна загрузиться главная страница с кнопкой "Открыть бокс"

### 2. API боксов
```bash
curl https://ruldetka-test.xxxxxxx.beget.com/api/boxes
```
Должен вернуть JSON с боксами

### 3. Создать пользователя (Регистрация)
```bash
curl -X POST https://ruldetka-test.xxxxxxx.beget.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Должен вернуть:
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "userId": "user_xxx",
    "email": "test@example.com",
    "username": "testuser"
  }
}
```

---

## 🎛️ Администрирование

### Доступ к админ-панели

1. Откройте в браузере:
```
https://ruldetka-test.xxxxxxx.beget.com/admin.html
```

2. Вам нужно быть админом. Чтобы сделать себя админом:
   - В SSH терминале Beget выполните:
   ```bash
   mysql -u ruldetka_user -p ruldetka_test
   UPDATE users SET role = 'admin' WHERE username = 'testuser';
   EXIT;
   ```

3. Перезагрузитесь в приложении (нажмите F5)

4. Теперь в админ-панели вы можете:
   - ✅ Редактировать вероятности боксов
   - ✅ Добавлять новые боксы
   - ✅ Смотреть статистику
   - ✅ Управлять пользователями

---

## 💳 Интегрировать Яндекс.Касса

### Получить ключи

1. Зарегистрируйтесь на https://yookassa.ru/
2. Создайте магазин
3. Получите:
   - **Shop ID** (например: 123456)
   - **Secret Key** (длинная строка)

### Добавить в .env на Beget

1. В файловом менеджере Beget отредактируйте `.env`:
```env
YOOKASSA_SHOP_ID=123456
YOOKASSA_SECRET_KEY=test_xxxxxxxxxxxxxxxxxxxxxxxx
```

2. Добавьте webhook URL в панели Yookassa:
```
https://ruldetka-test.xxxxxxx.beget.com/api/payment/webhook/yookassa
```

3. Перезагрузите приложение

---

## 📊 Мониторинг

### Просмотреть логи

В панели Beget: **"Приложение"** → **"Логи"**

### Проверить здоровье приложения

```bash
curl https://ruldetka-test.xxxxxxx.beget.com/health
```

### Проверить статистику

После входа в админ-панель:
```
https://ruldetka-test.xxxxxxx.beget.com/admin.html
```
Раздел: **"📊 Статистика"**

---

## ✅ Чек-лист перед production

- [ ] Приложение запущено и доступно по URL
- [ ] БД инициализирована и содержит примеры боксов
- [ ] Регистрация/вход работает
- [ ] Можно открывать боксы (если добавить баланс)
- [ ] Админ-панель доступна
- [ ] Вероятности боксов настроены правильно
- [ ] Логи показывают "Working" без ошибок

---

## 🔄 Обновить приложение после изменений

Если вы изменили файлы локально:

```bash
cd C:\ruldetka-deploy

# Добавить изменения
git add .

# Создать коммит
git commit -m "Update: описание изменений"

# Загрузить на Beget
git push beget main
```

Beget автоматически перезагрузит приложение! 🚀

---

## 📞 Контакты поддержки

- **Beget:** support@beget.com
- **Яндекс.Касса:** support@yookassa.ru

---

## 📈 Следующие шаги

После успешного развертывания на Beget:

1. ✅ **Тестирование**
   - Зарегистрируйтесь как пользователь
   - Откройте несколько боксов
   - Проверьте админ-панель

2. ✅ **Настройка вероятностей**
   - Откройте админ-панель
   - Отрегулируйте шансы боксов
   - Проверьте статистику

3. ✅ **Интеграция платежей**
   - Настроить Яндекс.Касса
   - Тестировать платежи
   - Проверить webhook

4. ✅ **Подключить свой домен**
   - После того как убедитесь что все работает
   - Откройте этот документ: `DEPLOYMENT.md`
   - Следуйте инструкциям по DNS

---

**Дата создания:** Октябрь 2024
**Версия:** 1.0.0
**Статус:** Ready to Deploy ✅
