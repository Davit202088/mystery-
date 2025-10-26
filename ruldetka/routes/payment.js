const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Конфигурация ЮКассы
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;
const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3/payments';

// ========================
// СОЗДАТЬ ПЛАТЕЖ (ЮКасса)
// ========================
router.post('/create-payment', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Неверная сумма' });
    }

    const connection = await pool.getConnection();

    // Получить пользователя
    const [users] = await connection.execute(
      'SELECT id, email FROM users WHERE userId = ?',
      [userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = users[0];

    // Создать уникальный ID платежа
    const paymentId = 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Подготовить данные для API ЮКассы
    const paymentData = {
      amount: {
        value: amount.toString(),
        currency: 'RUB'
      },
      payment_method_data: {
        type: 'bank_card'
      },
      confirmation: {
        type: 'redirect',
        return_url: `${process.env.APP_URL || 'https://ruldetka.ru'}/payment-result`
      },
      description: description || `Пополнение баланса на ${amount} рублей`,
      metadata: {
        userId: userId,
        paymentId: paymentId,
        userEmail: user.email
      }
    };

    // Создать платеж в ЮКассе
    const auth = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64');

    const response = await axios.post(YOOKASSA_API_URL, paymentData, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Idempotence-Key': paymentId
      }
    });

    const yookassaPaymentId = response.data.id;

    // Сохранить информацию о платеже в БД
    await connection.execute(
      `INSERT INTO transactions (transactionId, userId, type, amount, paymentMethod, paymentGateway, status, metadata)
       VALUES (?, ?, 'deposit', ?, 'bank_card', 'yookassa', 'pending', ?)`,
      [paymentId, user.id, amount, JSON.stringify({
        yookassaPaymentId,
        email: user.email
      })]
    );

    connection.release();

    res.json({
      success: true,
      paymentId,
      redirectUrl: response.data.confirmation.confirmation_url,
      yookassaPaymentId
    });

  } catch (error) {
    console.error('Ошибка создания платежа:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Ошибка создания платежа',
      details: error.response?.data?.description
    });
  }
});

// ========================
// WEBHOOK ОТ ЮКАССЫ (подтверждение платежа)
// ========================
router.post('/webhook/yookassa', async (req, res) => {
  try {
    const event = req.body;

    // Проверить тип события
    if (event.type !== 'payment.succeeded') {
      return res.json({ success: true });
    }

    const payment = event.object;
    const yookassaPaymentId = payment.id;
    const amount = parseFloat(payment.amount.value);
    const metadata = payment.metadata;

    const connection = await pool.getConnection();

    // Найти пользователя по ID из метаданных
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE userId = ?',
      [metadata.userId]
    );

    if (users.length === 0) {
      connection.release();
      console.error('Пользователь не найден для платежа:', yookassaPaymentId);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const user = users[0];

    // Начать транзакцию
    await connection.beginTransaction();

    try {
      // Обновить баланс пользователя
      await connection.execute(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [amount, user.id]
      );

      // Обновить статус платежа
      await connection.execute(
        `UPDATE transactions SET status = 'completed', completedAt = NOW()
         WHERE metadata LIKE ?`,
        [`%${yookassaPaymentId}%`]
      );

      await connection.commit();

      console.log(`✅ Платеж подтвержден: ${yookassaPaymentId}, сумма: ${amount}, пользователь: ${user.id}`);

      // Отправить уведомление пользователю через WebSocket
      const notifyUser = req.app?.locals?.notifyUser;
      if (notifyUser) {
        notifyUser(metadata.userId, {
          type: 'payment_success',
          amount,
          newBalance: amount // Будет обновлено после получения актуального баланса
        });
      }

      res.json({ success: true });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Ошибка обработки webhook:', error);
    res.status(500).json({ error: 'Ошибка обработки webhook' });
  }
});

// ========================
// ПОЛУЧИТЬ СТАТУС ПЛАТЕЖА
// ========================
router.get('/status/:paymentId', verifyToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { userId } = req.user;

    const connection = await pool.getConnection();

    // Получить платеж
    const [payments] = await connection.execute(
      `SELECT u.userId, t.transactionId, t.status, t.amount, t.createdAt
       FROM transactions t
       JOIN users u ON t.userId = u.id
       WHERE t.transactionId = ?`,
      [paymentId]
    );

    connection.release();

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Платеж не найден' });
    }

    const payment = payments[0];

    // Проверить что платеж принадлежит текущему пользователю
    if (payment.userId !== userId) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    res.json({
      success: true,
      payment
    });

  } catch (error) {
    console.error('Ошибка получения статуса платежа:', error);
    res.status(500).json({ error: 'Ошибка получения статуса платежа' });
  }
});

// ========================
// ПОЛУЧИТЬ ИСТОРИЮ ПЛАТЕЖЕЙ
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

    // Получить историю платежей
    const [transactions] = await connection.execute(
      `SELECT id, transactionId, type, amount, paymentGateway, status, createdAt
       FROM transactions
       WHERE userId = ?
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [users[0].id, limit, offset]
    );

    // Получить общее количество
    const [count] = await connection.execute(
      'SELECT COUNT(*) as total FROM transactions WHERE userId = ?',
      [users[0].id]
    );

    connection.release();

    res.json({
      success: true,
      transactions,
      total: count[0].total,
      limit,
      offset
    });

  } catch (error) {
    console.error('Ошибка получения истории платежей:', error);
    res.status(500).json({ error: 'Ошибка получения истории платежей' });
  }
});

module.exports = router;
