const Database = require('better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Создать SQLite базу данных
const dbPath = path.join(__dirname, '..', 'ruldetka.db');
const db = new Database(dbPath);

// Включить внешние ключи
db.pragma('foreign_keys = ON');

// Адаптер для совместимости с MySQL API
class SQLiteAdapter {
  async query(sql, values = []) {
    try {
      // Преобразовать MySQL синтаксис в SQLite
      sql = sql.replace(/\?/g, () => '?');

      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = db.prepare(sql);
        const rows = stmt.all(...values);
        return [rows];
      } else {
        const stmt = db.prepare(sql);
        const info = stmt.run(...values);
        return [{ affectedRows: info.changes, insertId: info.lastInsertRowid }];
      }
    } catch (error) {
      console.error('SQLite Query Error:', error);
      throw error;
    }
  }

  async execute(sql, values = []) {
    return this.query(sql, values);
  }

  async getConnection() {
    return this;
  }

  release() {
    // No-op for SQLite
  }
}

const pool = new SQLiteAdapter();

// Инициализировать таблицы при запуске
async function initDatabase() {
  try {
    // Таблица пользователей
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        username TEXT,
        passwordHash TEXT,
        firstName TEXT,
        lastName TEXT,
        avatar TEXT,
        balance REAL DEFAULT 0,
        role TEXT DEFAULT 'user',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastActive DATETIME
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_userId ON users(userId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

    // Таблица боксов
    db.exec(`
      CREATE TABLE IF NOT EXISTS boxes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        boxId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        type TEXT DEFAULT 'starter',
        itemCount INTEGER,
        image TEXT,
        rarity TEXT DEFAULT 'common',
        isActive INTEGER DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_boxes_boxId ON boxes(boxId)`);

    // Таблица призов
    db.exec(`
      CREATE TABLE IF NOT EXISTS prizes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prizeId TEXT UNIQUE NOT NULL,
        boxId INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        image TEXT,
        value REAL,
        rarity TEXT DEFAULT 'common',
        probability REAL,
        isActive INTEGER DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(boxId) REFERENCES boxes(id)
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_prizes_prizeId ON prizes(prizeId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_prizes_boxId ON prizes(boxId)`);

    // Таблица открытых боксов (история)
    db.exec(`
      CREATE TABLE IF NOT EXISTS opened_boxes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        boxId INTEGER NOT NULL,
        prizeId INTEGER NOT NULL,
        amount REAL,
        transactionId TEXT,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(boxId) REFERENCES boxes(id),
        FOREIGN KEY(prizeId) REFERENCES prizes(id)
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_opened_userId ON opened_boxes(userId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_opened_boxId ON opened_boxes(boxId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_opened_createdAt ON opened_boxes(createdAt)`);

    // Таблица транзакций
    db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transactionId TEXT UNIQUE NOT NULL,
        userId INTEGER NOT NULL,
        type TEXT DEFAULT 'deposit',
        amount REAL NOT NULL,
        paymentMethod TEXT,
        paymentGateway TEXT,
        status TEXT DEFAULT 'pending',
        metadata TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        completedAt DATETIME,
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_trans_transactionId ON transactions(transactionId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_trans_userId ON transactions(userId)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_trans_status ON transactions(status)`);

    // Проверить, есть ли данные
    const boxesCount = db.prepare('SELECT COUNT(*) as count FROM boxes').get();

    if (boxesCount.count === 0) {
      console.log('📦 Добавляем тестовые данные...');
      await seedDatabase();
    }

    console.log('✅ База данных SQLite инициализирована успешно');
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error);
    throw error;
  }
}

// Добавить тестовые данные
async function seedDatabase() {
  // Боксы
  db.prepare(`
    INSERT INTO boxes (boxId, name, description, price, type, itemCount, image, rarity, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('box_starter_001', 'Starter Box', 'Идеальный первый бокс для новичков', 499, 'starter', 3, 'https://via.placeholder.com/300x300?text=Starter+Box', 'common', 1);

  db.prepare(`
    INSERT INTO boxes (boxId, name, description, price, type, itemCount, image, rarity, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('box_deluxe_001', 'Deluxe Box', 'Премиум набор с гарантированным редким призом', 1999, 'deluxe', 5, 'https://via.placeholder.com/300x300?text=Deluxe+Box', 'rare', 1);

  db.prepare(`
    INSERT INTO boxes (boxId, name, description, price, type, itemCount, image, rarity, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('box_premium_001', 'Premium Box', 'Легендарные призы ждут вас', 4999, 'premium', 10, 'https://via.placeholder.com/300x300?text=Premium+Box', 'legendary', 1);

  // Призы для Starter Box
  db.prepare(`
    INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('prize_starter_001', 1, 'Наушники Xiaomi', 'Беспроводные наушники Xiaomi', 'https://via.placeholder.com/100x100?text=Earbuds', 2990, 'common', 40, 1);

  db.prepare(`
    INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('prize_starter_002', 1, 'Power Bank 10000mAh', 'Мобильное зарядное устройство', 'https://via.placeholder.com/100x100?text=PowerBank', 1490, 'common', 40, 1);

  db.prepare(`
    INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('prize_starter_003', 1, 'USB-C Кабель', 'Качественный кабель для заряда', 'https://via.placeholder.com/100x100?text=Cable', 490, 'common', 20, 1);

  // Призы для Deluxe Box
  db.prepare(`
    INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('prize_deluxe_001', 2, 'iPhone 13', 'Смартфон Apple iPhone 13', 'https://via.placeholder.com/100x100?text=iPhone13', 54990, 'epic', 25, 1);

  db.prepare(`
    INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('prize_deluxe_002', 2, 'iPad Air', 'Планшет Apple iPad Air', 'https://via.placeholder.com/100x100?text=iPad', 49990, 'epic', 25, 1);

  db.prepare(`
    INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('prize_deluxe_003', 2, 'Apple Watch', 'Умные часы Apple Watch Series 7', 'https://via.placeholder.com/100x100?text=Watch', 39990, 'rare', 25, 1);

  db.prepare(`
    INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('prize_deluxe_004', 2, 'AirPods Pro', 'Премиум наушники Apple AirPods Pro', 'https://via.placeholder.com/100x100?text=AirPods', 24990, 'rare', 25, 1);

  // Призы для Premium Box
  db.prepare(`
    INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('prize_premium_001', 3, 'iPhone 15 Pro Max', 'Флагманский смартфон Apple', 'https://via.placeholder.com/100x100?text=iPhone15Pro', 119990, 'legendary', 15, 1);

  db.prepare(`
    INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('prize_premium_002', 3, 'PlayStation 5', 'Консоль Sony PlayStation 5', 'https://via.placeholder.com/100x100?text=PS5', 59990, 'legendary', 15, 1);

  db.prepare(`
    INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('prize_premium_003', 3, 'MacBook Air M2', 'Ноутбук Apple MacBook Air', 'https://via.placeholder.com/100x100?text=MacBook', 99990, 'legendary', 10, 1);

  db.prepare(`
    INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('prize_premium_004', 3, 'Samsung Galaxy Watch', 'Смарт-часы Samsung Galaxy Watch 5', 'https://via.placeholder.com/100x100?text=GalaxyWatch', 24990, 'epic', 20, 1);

  db.prepare(`
    INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('prize_premium_005', 3, 'DJI Mini 3 Pro', 'Дрон DJI Mini 3 Pro', 'https://via.placeholder.com/100x100?text=DJIMini', 34990, 'epic', 20, 1);

  db.prepare(`
    INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('prize_premium_006', 3, 'Sony WH-1000XM5', 'Премиум наушники Sony', 'https://via.placeholder.com/100x100?text=SonyWH', 34990, 'rare', 20, 1);

  // Тестовый пользователь (пароль: password123)
  db.prepare(`
    INSERT INTO users (userId, email, username, passwordHash, firstName, lastName, role, balance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('user_test_001', 'test@example.com', 'testuser', '$2a$10$YJC/EwlIX0v8ZCJsSuXRWOp4aDfQWrJaWyZCDH0rLiPB1zPMsCpYK', 'Test', 'User', 'user', 5000);

  // Админ пользователь (пароль: password123)
  db.prepare(`
    INSERT INTO users (userId, email, username, passwordHash, firstName, lastName, role, balance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('user_admin_001', 'admin@example.com', 'admin', '$2a$10$YJC/EwlIX0v8ZCJsSuXRWOp4aDfQWrJaWyZCDH0rLiPB1zPMsCpYK', 'Admin', 'User', 'admin', 10000);

  console.log('✅ Тестовые данные добавлены');
}

module.exports = {
  pool,
  initDatabase,
  query: (sql, values) => pool.query(sql, values)
};
