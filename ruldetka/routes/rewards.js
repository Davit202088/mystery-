const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// ========================
// НАГРАДЫ ЗА ДЕЙСТВИЯ
// ========================

// Получить доступные награды для пользователя
router.get('/available', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;

    const connection = await pool.getConnection();

    // Получить пользователя
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE userId = ?',
      [userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const dbUserId = users[0].id;

    // Получить доступные награды
    const [rewards] = await connection.execute(
      `SELECT
        r.id, r.rewardId, r.name, r.description, r.type,
        r.coins, r.image, r.isActive,
        CASE WHEN ur.id IS NOT NULL THEN 1 ELSE 0 END as isCompleted
       FROM rewards r
       LEFT JOIN user_rewards ur ON r.id = ur.rewardId AND ur.userId = ?
       WHERE r.isActive = 1
       ORDER BY r.type, r.coins DESC`,
      [dbUserId]
    );

    connection.release();

    res.json({
      success: true,
      rewards
    });

  } catch (error) {
    console.error('Ошибка получения наград:', error);
    res.status(500).json({ error: 'Ошибка получения наград' });
  }
});

// ========================
// ВЫПОЛНИТЬ ДЕЙСТВИЕ (ПОЛУЧИТЬ НАГРАДУ)
// ========================

router.post('/claim/:rewardId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { rewardId } = req.params;

    const connection = await pool.getConnection();

    // Получить пользователя
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE userId = ?',
      [userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const dbUserId = users[0].id;

    // Получить награду
    const [rewards] = await connection.execute(
      'SELECT id, coins, name FROM rewards WHERE rewardId = ?',
      [rewardId]
    );

    if (rewards.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Награда не найдена' });
    }

    const reward = rewards[0];

    // Проверить не получена ли уже награда (для одноразовых)
    const [alreadyClaimed] = await connection.execute(
      'SELECT id FROM user_rewards WHERE userId = ? AND rewardId = ?',
      [dbUserId, reward.id]
    );

    if (alreadyClaimed.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Эта награда уже получена' });
    }

    // Начать транзакцию
    await connection.beginTransaction();

    try {
      // Добавить монеты
      await connection.execute(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [reward.coins, dbUserId]
      );

      // Записать что награда получена
      await connection.execute(
        'INSERT INTO user_rewards (userId, rewardId, claimedAt) VALUES (?, ?, NOW())',
        [dbUserId, reward.id]
      );

      // Добавить в логи
      await connection.execute(
        `INSERT INTO reward_logs (userId, rewardId, action, amount, timestamp)
         VALUES (?, ?, 'claim', ?, NOW())`,
        [dbUserId, reward.id, reward.coins]
      );

      await connection.commit();

      res.json({
        success: true,
        message: `Получено ${reward.coins} монет за "${reward.name}"!`,
        coins: reward.coins,
        rewardName: reward.name
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Ошибка получения награды:', error);
    res.status(500).json({ error: 'Ошибка получения награды' });
  }
});

// ========================
// ИСТОРИЕЯ ПОЛУЧЕННЫХ НАГРАД
// ========================

router.get('/history', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const connection = await pool.getConnection();

    // Получить ID пользователя в БД
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE userId = ?',
      [userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const dbUserId = users[0].id;

    // Получить историю наград
    const [history] = await connection.execute(
      `SELECT
        ur.id, r.name, r.coins, r.type, ur.claimedAt
       FROM user_rewards ur
       JOIN rewards r ON ur.rewardId = r.id
       WHERE ur.userId = ?
       ORDER BY ur.claimedAt DESC
       LIMIT ? OFFSET ?`,
      [dbUserId, limit, offset]
    );

    // Получить общее количество
    const [count] = await connection.execute(
      'SELECT COUNT(*) as total FROM user_rewards WHERE userId = ?',
      [dbUserId]
    );

    connection.release();

    res.json({
      success: true,
      history,
      total: count[0].total,
      limit,
      offset
    });

  } catch (error) {
    console.error('Ошибка получения истории наград:', error);
    res.status(500).json({ error: 'Ошибка получения истории наград' });
  }
});

// ========================
// АДМИН API - УПРАВЛЕНИЕ НАГРАДАМИ
// ========================

// Создать награду (только админ)
router.post('/admin/create', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, description, type, coins, image } = req.body;

    // Проверить админ
    const connection = await pool.getConnection();

    const [admin] = await connection.execute(
      'SELECT role FROM users WHERE userId = ?',
      [userId]
    );

    if (admin.length === 0 || admin[0].role !== 'admin') {
      connection.release();
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    const rewardId = 'reward_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    await connection.execute(
      `INSERT INTO rewards (rewardId, name, description, type, coins, image, isActive)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [rewardId, name, description || '', type || 'action', coins, image || '']
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Награда создана',
      rewardId
    });

  } catch (error) {
    console.error('Ошибка создания награды:', error);
    res.status(500).json({ error: 'Ошибка создания награды' });
  }
});

// Обновить награду (только админ)
router.put('/admin/:rewardId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { rewardId } = req.params;
    const { name, description, type, coins, image, isActive } = req.body;

    // Проверить админ
    const connection = await pool.getConnection();

    const [admin] = await connection.execute(
      'SELECT role FROM users WHERE userId = ?',
      [userId]
    );

    if (admin.length === 0 || admin[0].role !== 'admin') {
      connection.release();
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    await connection.execute(
      `UPDATE rewards SET
       name = COALESCE(?, name),
       description = COALESCE(?, description),
       type = COALESCE(?, type),
       coins = COALESCE(?, coins),
       image = COALESCE(?, image),
       isActive = COALESCE(?, isActive)
       WHERE rewardId = ?`,
      [name || null, description || null, type || null, coins || null, image || null, isActive !== undefined ? isActive : null, rewardId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Награда обновлена'
    });

  } catch (error) {
    console.error('Ошибка обновления награды:', error);
    res.status(500).json({ error: 'Ошибка обновления награды' });
  }
});

// ========================
// АДМИН API - ВЫДАТЬ МОНЕТЫ ВРУЧНУЮ
// ========================

router.post('/admin/grant-coins', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { targetUserId, coins, reason } = req.body;

    if (!coins || coins <= 0) {
      return res.status(400).json({ error: 'Количество монет должно быть больше 0' });
    }

    const connection = await pool.getConnection();

    // Проверить админ
    const [admin] = await connection.execute(
      'SELECT role FROM users WHERE userId = ?',
      [userId]
    );

    if (admin.length === 0 || admin[0].role !== 'admin') {
      connection.release();
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    // Получить целевого пользователя
    const [targetUser] = await connection.execute(
      'SELECT id FROM users WHERE userId = ?',
      [targetUserId]
    );

    if (targetUser.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Начать транзакцию
    await connection.beginTransaction();

    try {
      // Добавить монеты
      await connection.execute(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [coins, targetUser[0].id]
      );

      // Записать в логи
      await connection.execute(
        `INSERT INTO admin_grants (adminId, targetUserId, coins, reason, timestamp)
         VALUES (?, ?, ?, ?, NOW())`,
        [userId, targetUserId, coins, reason || 'No reason']
      );

      await connection.commit();

      res.json({
        success: true,
        message: `Выдано ${coins} монет пользователю ${targetUserId}`,
        coins,
        reason
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Ошибка выдачи монет:', error);
    res.status(500).json({ error: 'Ошибка выдачи монет' });
  }
});

// Получить список всех наград (админ)
router.get('/admin/all', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;

    const connection = await pool.getConnection();

    // Проверить админ
    const [admin] = await connection.execute(
      'SELECT role FROM users WHERE userId = ?',
      [userId]
    );

    if (admin.length === 0 || admin[0].role !== 'admin') {
      connection.release();
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    // Получить все награды
    const [rewards] = await connection.execute(
      `SELECT * FROM rewards ORDER BY type, coins DESC`
    );

    // Получить статистику
    const [stats] = await connection.execute(
      `SELECT
        type,
        COUNT(*) as count,
        SUM(coins) as total_coins,
        COUNT(DISTINCT id) as claimed_count
       FROM rewards
       GROUP BY type`
    );

    connection.release();

    res.json({
      success: true,
      rewards,
      stats
    });

  } catch (error) {
    console.error('Ошибка получения наград:', error);
    res.status(500).json({ error: 'Ошибка получения наград' });
  }
});

module.exports = router;
