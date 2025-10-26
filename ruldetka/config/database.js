const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ruldetka',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Инициализировать таблицы при запуске
async function initDatabase() {
  try {
    const connection = await pool.getConnection();

    // Таблица пользователей
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255),
        passwordHash VARCHAR(255),
        firstName VARCHAR(255),
        lastName VARCHAR(255),
        avatar VARCHAR(255),
        balance DECIMAL(10, 2) DEFAULT 0,
        role ENUM('user', 'admin') DEFAULT 'user',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        lastActive TIMESTAMP,
        INDEX(userId),
        INDEX(email)
      )
    `);

    // Таблица боксов
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS boxes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        boxId VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        type ENUM('starter', 'deluxe', 'premium') DEFAULT 'starter',
        itemCount INT,
        image VARCHAR(255),
        rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
        isActive BOOLEAN DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX(boxId)
      )
    `);

    // Таблица призов
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS prizes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        prizeId VARCHAR(255) UNIQUE NOT NULL,
        boxId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image VARCHAR(255),
        value DECIMAL(10, 2),
        rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
        probability DECIMAL(5, 2),
        isActive BOOLEAN DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(boxId) REFERENCES boxes(id),
        INDEX(prizeId),
        INDEX(boxId)
      )
    `);

    // Таблица открытых боксов (история)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS opened_boxes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        boxId INT NOT NULL,
        prizeId INT NOT NULL,
        amount DECIMAL(10, 2),
        transactionId VARCHAR(255),
        status ENUM('success', 'pending', 'failed') DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(boxId) REFERENCES boxes(id),
        FOREIGN KEY(prizeId) REFERENCES prizes(id),
        INDEX(userId),
        INDEX(boxId),
        INDEX(createdAt)
      )
    `);

    // Таблица транзакций
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transactionId VARCHAR(255) UNIQUE NOT NULL,
        userId INT NOT NULL,
        type ENUM('deposit', 'withdrawal', 'refund', 'bonus') DEFAULT 'deposit',
        amount DECIMAL(10, 2) NOT NULL,
        paymentMethod VARCHAR(255),
        paymentGateway VARCHAR(255),
        status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
        metadata JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completedAt TIMESTAMP NULL,
        FOREIGN KEY(userId) REFERENCES users(id),
        INDEX(transactionId),
        INDEX(userId),
        INDEX(status)
      )
    `);

    console.log('✅ База данных инициализирована успешно');
    connection.release();
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error);
    throw error;
  }
}

module.exports = {
  pool,
  initDatabase,
  query: (sql, values) => pool.query(sql, values)
};
