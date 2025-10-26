const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database-sqlite');
const { verifyToken } = require('../middleware/auth');

// Генерирование уникального userId
function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ========================
// РЕГИСТРАЦИЯ
// ========================
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, firstName, lastName } = req.body;

    // Валидация
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, пароль и имя пользователя обязательны' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
    }

    const connection = await pool.getConnection();

    // Проверить существует ли пользователь
    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(409).json({ error: 'Email или имя пользователя уже зарегистрированы' });
    }

    // Захешировать пароль
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = generateUserId();

    // Создать пользователя
    await connection.execute(
      `INSERT INTO users (userId, email, username, passwordHash, firstName, lastName, role)
       VALUES (?, ?, ?, ?, ?, ?, 'user')`,
      [userId, email, username, passwordHash, firstName || '', lastName || '']
    );

    // Создать JWT токен
    const token = jwt.sign(
      { userId, email, username },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    connection.release();

    res.status(201).json({
      success: true,
      token,
      user: { userId, email, username, firstName, lastName }
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// ========================
// ВХОД
// ========================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT id, userId, email, username, passwordHash, firstName, lastName FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = users[0];

    // Проверить пароль
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      connection.release();
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Обновить lastActive
    await connection.execute(
      'UPDATE users SET lastActive = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Создать JWT токен
    const token = jwt.sign(
      { userId: user.userId, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    connection.release();

    res.json({
      success: true,
      token,
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

// ========================
// ПОЛУЧИТЬ ПРОФИЛЬ
// ========================
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;

    const connection = await pool.getConnection();

    const [users] = await connection.execute(
      `SELECT id, userId, email, username, firstName, lastName, avatar, balance, role, createdAt
       FROM users WHERE userId = ?`,
      [userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = users[0];

    // Получить количество открытых боксов
    const [stats] = await connection.execute(
      `SELECT COUNT(*) as totalBoxes, SUM(amount) as totalSpent
       FROM opened_boxes WHERE userId = ?`,
      [user.id]
    );

    connection.release();

    res.json({
      success: true,
      user: {
        ...user,
        totalBoxes: stats[0].totalBoxes || 0,
        totalSpent: parseFloat(stats[0].totalSpent || 0)
      }
    });

  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Ошибка получения профиля' });
  }
});

// ========================
// ОБНОВИТЬ ПРОФИЛЬ
// ========================
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { username, firstName, lastName, avatar } = req.body;

    const connection = await pool.getConnection();

    // Проверить что username уникален
    if (username) {
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE username = ? AND userId != ?',
        [username, userId]
      );

      if (existing.length > 0) {
        connection.release();
        return res.status(409).json({ error: 'Это имя пользователя уже занято' });
      }
    }

    await connection.execute(
      `UPDATE users SET
       username = COALESCE(?, username),
       firstName = COALESCE(?, firstName),
       lastName = COALESCE(?, lastName),
       avatar = COALESCE(?, avatar),
       updatedAt = CURRENT_TIMESTAMP
       WHERE userId = ?`,
      [username || null, firstName || null, lastName || null, avatar || null, userId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Профиль обновлен'
    });

  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
});

// ========================
// ПОЛУЧИТЬ БАЛАНС
// ========================
router.get('/balance', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;

    const connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT balance FROM users WHERE userId = ?',
      [userId]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({
      success: true,
      balance: parseFloat(users[0].balance)
    });

  } catch (error) {
    console.error('Ошибка получения баланса:', error);
    res.status(500).json({ error: 'Ошибка получения баланса' });
  }
});

module.exports = router;
