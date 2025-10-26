const express = require('express');
const router = express.Router();
const { pool } = require('../config/database-sqlite');
const { verifyToken } = require('../middleware/auth');

// Middleware для проверки админа (простая версия)
async function isAdmin(req, res, next) {
  try {
    verifyToken(req, res, async () => {
      const { userId } = req.user;
      const connection = await pool.getConnection();

      const [users] = await connection.execute(
        'SELECT role FROM users WHERE userId = ?',
        [userId]
      );

      connection.release();

      if (users.length === 0 || users[0].role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора' });
      }

      next();
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка проверки прав' });
  }
}

// ========================
// УПРАВЛЕНИЕ БОКСАМИ
// ========================

// Создать новый бокс
router.post('/boxes', isAdmin, async (req, res) => {
  try {
    const { name, description, price, type, itemCount, image, rarity } = req.body;

    if (!name || !price || !type) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const boxId = 'box_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const connection = await pool.getConnection();

    await connection.execute(
      `INSERT INTO boxes (boxId, name, description, price, type, itemCount, image, rarity, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [boxId, name, description || '', price, type, itemCount || 0, image || '', rarity || 'common']
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Бокс создан успешно',
      boxId
    });

  } catch (error) {
    console.error('Ошибка создания бокса:', error);
    res.status(500).json({ error: 'Ошибка создания бокса' });
  }
});

// Обновить бокс
router.put('/boxes/:boxId', isAdmin, async (req, res) => {
  try {
    const { boxId } = req.params;
    const { name, description, price, type, itemCount, image, rarity, isActive } = req.body;

    const connection = await pool.getConnection();

    // Проверить существует ли бокс
    const [existingBox] = await connection.execute(
      'SELECT id FROM boxes WHERE boxId = ?',
      [boxId]
    );

    if (existingBox.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Бокс не найден' });
    }

    await connection.execute(
      `UPDATE boxes SET
       name = COALESCE(?, name),
       description = COALESCE(?, description),
       price = COALESCE(?, price),
       type = COALESCE(?, type),
       itemCount = COALESCE(?, itemCount),
       image = COALESCE(?, image),
       rarity = COALESCE(?, rarity),
       isActive = COALESCE(?, isActive),
       updatedAt = CURRENT_TIMESTAMP
       WHERE boxId = ?`,
      [name || null, description || null, price || null, type || null, itemCount || null, image || null, rarity || null, isActive !== undefined ? isActive : null, boxId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Бокс обновлен успешно'
    });

  } catch (error) {
    console.error('Ошибка обновления бокса:', error);
    res.status(500).json({ error: 'Ошибка обновления бокса' });
  }
});

// Удалить бокс
router.delete('/boxes/:boxId', isAdmin, async (req, res) => {
  try {
    const { boxId } = req.params;

    const connection = await pool.getConnection();

    const [boxes] = await connection.execute(
      'SELECT id FROM boxes WHERE boxId = ?',
      [boxId]
    );

    if (boxes.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Бокс не найден' });
    }

    await connection.execute(
      'UPDATE boxes SET isActive = 0 WHERE boxId = ?',
      [boxId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Бокс удален успешно'
    });

  } catch (error) {
    console.error('Ошибка удаления бокса:', error);
    res.status(500).json({ error: 'Ошибка удаления бокса' });
  }
});

// ========================
// УПРАВЛЕНИЕ ПРИЗАМИ
// ========================

// Создать приз
router.post('/prizes', isAdmin, async (req, res) => {
  try {
    const { boxId, name, description, image, value, rarity, probability } = req.body;

    if (!boxId || !name) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const prizeId = 'prize_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const connection = await pool.getConnection();

    // Проверить что бокс существует
    const [boxes] = await connection.execute(
      'SELECT id FROM boxes WHERE boxId = ?',
      [boxId]
    );

    if (boxes.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Бокс не найден' });
    }

    const box = boxes[0];

    await connection.execute(
      `INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [prizeId, box.id, name, description || '', image || '', value || null, rarity || 'common', probability || 0]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Приз создан успешно',
      prizeId
    });

  } catch (error) {
    console.error('Ошибка создания приза:', error);
    res.status(500).json({ error: 'Ошибка создания приза' });
  }
});

// Обновить приз
router.put('/prizes/:prizeId', isAdmin, async (req, res) => {
  try {
    const { prizeId } = req.params;
    const { name, description, image, value, rarity, probability, isActive } = req.body;

    const connection = await pool.getConnection();

    const [existingPrize] = await connection.execute(
      'SELECT id FROM prizes WHERE prizeId = ?',
      [prizeId]
    );

    if (existingPrize.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Приз не найден' });
    }

    await connection.execute(
      `UPDATE prizes SET
       name = COALESCE(?, name),
       description = COALESCE(?, description),
       image = COALESCE(?, image),
       value = COALESCE(?, value),
       rarity = COALESCE(?, rarity),
       probability = COALESCE(?, probability),
       isActive = COALESCE(?, isActive)
       WHERE prizeId = ?`,
      [name || null, description || null, image || null, value || null, rarity || null, probability || null, isActive !== undefined ? isActive : null, prizeId]
    );

    connection.release();

    res.json({
      success: true,
      message: 'Приз обновлен успешно'
    });

  } catch (error) {
    console.error('Ошибка обновления приза:', error);
    res.status(500).json({ error: 'Ошибка обновления приза' });
  }
});

// ========================
// СТАТИСТИКА
// ========================

// Получить общую статистику
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Всего пользователей
    const [usersCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM users'
    );

    // Всего открыто боксов
    const [boxesOpened] = await connection.execute(
      'SELECT COUNT(*) as count, SUM(amount) as totalSpent FROM opened_boxes'
    );

    // Всего заработано
    const [revenue] = await connection.execute(
      'SELECT SUM(amount) as total FROM transactions WHERE type = "deposit" AND status = "completed"'
    );

    // Активные пользователи за последние 24 часа
    const [activeUsers] = await connection.execute(
      "SELECT COUNT(DISTINCT userId) as count FROM opened_boxes WHERE createdAt > datetime('now', '-24 hours')"
    );

    connection.release();

    res.json({
      success: true,
      stats: {
        totalUsers: usersCount[0].count,
        totalBoxesOpened: boxesOpened[0].count,
        totalSpent: parseFloat(boxesOpened[0].totalSpent || 0),
        totalRevenue: parseFloat(revenue[0].total || 0),
        activeUsers24h: activeUsers[0].count
      }
    });

  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// ========================
// ЛОГИ
// ========================

// Получить логи действий админа
router.get('/logs', isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const connection = await pool.getConnection();

    const [logs] = await connection.execute(
      `SELECT id, transactionId, userId, type, amount, paymentGateway, status, createdAt
       FROM transactions
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    connection.release();

    res.json({
      success: true,
      logs,
      limit,
      offset
    });

  } catch (error) {
    console.error('Ошибка получения логов:', error);
    res.status(500).json({ error: 'Ошибка получения логов' });
  }
});

module.exports = router;
