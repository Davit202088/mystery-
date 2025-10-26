const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// ========================
// ПОЛУЧИТЬ ВСЕ БОКСЫ
// ========================
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [boxes] = await connection.execute(
      `SELECT id, boxId, name, description, price, type, itemCount, image, rarity, isActive
       FROM boxes WHERE isActive = 1 ORDER BY type ASC`
    );

    // Для каждого бокса получить его призы
    for (let box of boxes) {
      const [prizes] = await connection.execute(
        `SELECT id, prizeId, name, description, image, value, rarity, probability
         FROM prizes WHERE boxId = ? AND isActive = 1`,
        [box.id]
      );
      box.prizes = prizes;
    }

    connection.release();

    res.json({
      success: true,
      boxes,
      count: boxes.length
    });

  } catch (error) {
    console.error('Ошибка получения боксов:', error);
    res.status(500).json({ error: 'Ошибка получения боксов' });
  }
});

// ========================
// ПОЛУЧИТЬ КОНКРЕТНЫЙ БОК
// ========================
router.get('/:boxId', async (req, res) => {
  try {
    const { boxId } = req.params;

    const connection = await pool.getConnection();

    const [boxes] = await connection.execute(
      `SELECT id, boxId, name, description, price, type, itemCount, image, rarity
       FROM boxes WHERE boxId = ?`,
      [boxId]
    );

    if (boxes.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Бокс не найден' });
    }

    const box = boxes[0];

    // Получить все призы для этого бокса
    const [prizes] = await connection.execute(
      `SELECT id, prizeId, name, description, image, value, rarity, probability
       FROM prizes WHERE boxId = ?`,
      [box.id]
    );

    box.prizes = prizes;

    connection.release();

    res.json({
      success: true,
      box
    });

  } catch (error) {
    console.error('Ошибка получения бокса:', error);
    res.status(500).json({ error: 'Ошибка получения бокса' });
  }
});

// ========================
// ОТКРЫТЬ БОК (основная логика)
// ========================
router.post('/open', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { boxId } = req.body;

    if (!boxId) {
      return res.status(400).json({ error: 'boxId обязателен' });
    }

    const connection = await pool.getConnection();

    // Получить пользователя
    const [users] = await connection.execute(
      'SELECT id, balance FROM users WHERE userId = ?',
      [userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = users[0];

    // Получить бокс
    const [boxes] = await connection.execute(
      'SELECT id, price FROM boxes WHERE boxId = ?',
      [boxId]
    );

    if (boxes.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Бокс не найден' });
    }

    const box = boxes[0];

    // Проверить баланс
    if (user.balance < box.price) {
      connection.release();
      return res.status(402).json({ error: 'Недостаточно средств' });
    }

    // Получить все призы для этого бокса с их вероятностями
    const [prizes] = await connection.execute(
      'SELECT id, prizeId, name, value, probability FROM prizes WHERE boxId = ? AND isActive = 1',
      [box.id]
    );

    if (prizes.length === 0) {
      connection.release();
      return res.status(500).json({ error: 'Нет доступных призов' });
    }

    // Выбрать случайный приз на основе вероятностей
    const selectedPrize = selectPrizeByProbability(prizes);

    // Начать транзакцию
    await connection.beginTransaction();

    try {
      // Списать деньги со счета
      const transactionId = 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      await connection.execute(
        'UPDATE users SET balance = balance - ? WHERE id = ?',
        [box.price, user.id]
      );

      // Создать запись открытия бокса
      await connection.execute(
        `INSERT INTO opened_boxes (userId, boxId, prizeId, amount, status)
         VALUES (?, ?, ?, ?, 'success')`,
        [user.id, box.id, selectedPrize.id, box.price]
      );

      // Создать запись транзакции
      await connection.execute(
        `INSERT INTO transactions (transactionId, userId, type, amount, paymentGateway, status)
         VALUES (?, ?, 'deposit', ?, 'balance', 'completed')`,
        [transactionId, user.id]
      );

      await connection.commit();

      // Отправить уведомление через WebSocket если клиент подключен
      const notifyUser = req.app.locals.notifyUser;
      if (notifyUser) {
        notifyUser(userId, {
          type: 'box_result',
          prize: selectedPrize,
          newBalance: user.balance - box.price
        });
      }

      res.json({
        success: true,
        message: 'Бокс открыт успешно!',
        prize: selectedPrize,
        newBalance: user.balance - box.price,
        transactionId
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Ошибка открытия бокса:', error);
    res.status(500).json({ error: 'Ошибка открытия бокса' });
  }
});

// ========================
// ПОЛУЧИТЬ ИСТОРИЮ ОТКРЫТИЙ
// ========================
router.get('/history/user', verifyToken, async (req, res) => {
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

    // Получить историю открытий
    const [history] = await connection.execute(
      `SELECT
        ob.id, ob.createdAt, b.name as boxName, p.name as prizeName,
        p.image as prizeImage, p.value, ob.amount
       FROM opened_boxes ob
       JOIN boxes b ON ob.boxId = b.id
       JOIN prizes p ON ob.prizeId = p.id
       WHERE ob.userId = ?
       ORDER BY ob.createdAt DESC
       LIMIT ? OFFSET ?`,
      [dbUserId, limit, offset]
    );

    // Получить общее количество
    const [count] = await connection.execute(
      'SELECT COUNT(*) as total FROM opened_boxes WHERE userId = ?',
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
    console.error('Ошибка получения истории:', error);
    res.status(500).json({ error: 'Ошибка получения истории' });
  }
});

// ========================
// ПОЛУЧИТЬ ТОП ПОБЕД
// ========================
router.get('/leaderboard/wins', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const connection = await pool.getConnection();

    const [leaderboard] = await connection.execute(
      `SELECT
        u.username, u.avatar, p.name, p.value, p.rarity, ob.createdAt
       FROM opened_boxes ob
       JOIN users u ON ob.userId = u.id
       JOIN prizes p ON ob.prizeId = p.id
       WHERE p.value IS NOT NULL
       ORDER BY ob.createdAt DESC
       LIMIT ?`,
      [limit]
    );

    connection.release();

    res.json({
      success: true,
      wins: leaderboard,
      count: leaderboard.length
    });

  } catch (error) {
    console.error('Ошибка получения лидерборда:', error);
    res.status(500).json({ error: 'Ошибка получения лидерборда' });
  }
});

// ========================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: выбрать приз по вероятности
// ========================
function selectPrizeByProbability(prizes) {
  // Рассчитать кумулятивные вероятности
  let cumulativeProbability = 0;
  const cumulativePrizes = prizes.map(prize => {
    cumulativeProbability += parseFloat(prize.probability) || (100 / prizes.length);
    return {
      ...prize,
      cumulativeProbability
    };
  });

  // Генерировать случайное число от 0 до 100
  const random = Math.random() * 100;

  // Найти приз который соответствует случайному числу
  const selectedPrize = cumulativePrizes.find(prize => random <= prize.cumulativeProbability);

  return selectedPrize || prizes[0]; // Вернуть первый приз если ничего не найдено
}

module.exports = router;
